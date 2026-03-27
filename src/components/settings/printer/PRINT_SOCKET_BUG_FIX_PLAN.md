# 프린터 소켓 통신 버그 수정 계획

## 현재 아키텍처 개요

```
Browser ──(POST /printers)──> API Server ──(Kafka)──> Socket Server ──(socket.io)──> C# Agent
                                                                                       │
Browser <──(printer.job.updated)── Socket Server <──(Kafka)── API Server <──(HTTP)──────┘
```

### 핵심 데이터

| 저장소 | 데이터 | 설명 |
|--------|--------|------|
| `agent_printers` 테이블 | `printerId ↔ agentId` | 에이전트가 프린터 동기화 시 자동 생성. **printerId만으로 agentId 조회 가능** |
| `printer_output_settings` 테이블 | 병원별 출력 종류 → 기본 프린터 설정 | `outputTypeCode`별 기본 프린터 |
| `printer_workstation_overrides` 테이블 | PC별 예외 프린터 설정 | `agentId + outputTypeCode`별 예외 |

### 리더 선출 로직 (제거 예정)

현재 `socket-io.gateway.ts`의 `electLeader()`, Redis `leader:hospital:{orgId}` 키, 에이전트 `agent.role.update` 이벤트 등은 **더 이상 사용하지 않으며 제거 대상**.

---

## 확인된 버그 3건

### Bug #1: 출력 성공인데 실패 토스트 표시

**증상**: 브라우저A가 출력 요청 → 실제 출력 성공 → 토스트 "인쇄에 실패했습니다"

**근본 원인: 다중 에이전트 경합 + 상태 머신 부재**

1. **agentId가 null일 때 hospital 전체 브로드캐스트**
   - `handlePrinterJobCreated`에서 agentId가 없으면 `hospital:{id}` 룸 전체에 이벤트 전송
   - 병원 내 모든 에이전트(PC-A, PC-B, PC-C...)가 동일 job을 수신
   - PC-A: 해당 프린터 있음 → 출력 성공 → `SUCCESS` 보고
   - PC-B: 해당 프린터 없음 → 출력 실패 → `FAILED` 보고
   - **마지막 도착한 상태가 최종값** → 브라우저에 "실패" 토스트

2. **상태 머신 가드 없음**
   - `updatePrintJobStatus`가 현재 상태 확인 없이 무조건 덮어씀
   - `SUCCESS` 이후에도 `FAILED`로 변경 가능
   
3. **agentId 지정 시에도 hospital 룸 중복 브로드캐스트**
   - `handlePrinterJobCreated` 607행: `agent:{agentId}` + `hospital:{hospitalId}` 두 곳에 전송
   - Mesh/Leader 지원 목적이었으나 리더 없으므로 불필요한 중복

**관련 코드 위치:**
- `nextemr-socket-server/src/modules/socket-io/socket-io.gateway.ts` 568-628행 `handlePrinterJobCreated`
- `nestjs-emr-api/src/modules/printers/printers.service.ts` 1113-1153행 `updatePrintJobStatus`
- `nestjs-emr-api/src/modules/printers/printers.service.ts` 1055-1111행 `createPrintJob`

---

### Bug #2: 병원별 프린터 설정이 아닌 다른 설정으로 출력

**증상**: API 서버가 병원 프린터 설정과 다른 프린터로 출력 요청

**근본 원인: 프론트에서 agentId 미전달 → PC별 예외 설정 무시**

1. `requestPrintJob`에서 `agentId`가 선택적 전달
   ```typescript
   // use-print-service.tsx 617행
   ...(agentId ? { agentId } : {}),
   ```
2. agentId 없이 API 호출 → `resolvePrinterSetting`에서 PC별 예외 설정 건너뜀
3. 기본 설정의 프린터 사용 → 사용자 의도와 다른 프린터

**관련 코드 위치:**
- `react-frontend/src/hooks/document/use-print-service.tsx` 581-631행 `requestPrintJob`
- `nestjs-emr-api/src/modules/printers/printers.service.ts` 844-957행 `resolvePrinterSetting`

---

### Bug #3: 에이전트 미실행인데 녹색 표시

**증상**: 내 PC에 에이전트가 실행 안 되는데 헤더에 녹색 동그라미 표시

**근본 원인: presence가 "병원 전체" 기준이지 "로컬 PC" 기준 아님**

1. 소켓 연결 시 Redis에서 ~~리더~~ 에이전트 조회 → 다른 PC 에이전트라도 `online` 방송
2. 프론트에서 `agent.presence` 수신 시 로컬/원격 구분 없이 상태 반영
3. `performSetHospital` 실패(로컬 에이전트 없음)해도 서버 presence에 의해 덮어써짐

**관련 코드 위치:**
- `nextemr-socket-server/src/modules/socket-io/socket-io.gateway.ts` 90-106행 `handleConnection`
- `react-frontend/src/contexts/SocketContext.tsx` 179-208행 `agent.presence` 리스너
- `react-frontend/src/lib/agent/agent-binding.ts` 107-118행 `performSetHospital`

---

## 수정 계획

### Phase 0: 리더 선출 로직 제거 (선행 작업)

리더/팔로워 개념이 필요 없으므로 관련 코드 전체 제거.

| # | 위치 | 작업 |
|---|------|------|
| 0-1 | `socket-io.gateway.ts` | `electLeader()` 메서드 제거 |
| 0-2 | `socket-io.gateway.ts` | `handleConnection`에서 `leader:hospital:*` Redis 조회 제거 |
| 0-3 | `socket-io.gateway.ts` | `handleDisconnect`/`cleanupAgentConnection`에서 리더 재선출 호출 제거 |
| 0-4 | `socket-io.gateway.ts` | `joinHospitalRoom`에서 `electLeader` 호출 제거 |
| 0-5 | `socket-io.gateway.ts` | `agent.role.update` 이벤트 방송 제거 |
| 0-6 | `WebSocketService.cs` | `agent.role.update` 핸들러 및 `_currentRole` 제거 |
| 0-7 | Redis | `leader:hospital:*` 키 정리 |

### Phase 1: Bug #1 수정 — printerId → agentId 확정 라우팅

**핵심 전략**: API에서 `printerId`로 `agentPrinter` 테이블을 조회하여 agentId를 항상 확정.
소켓서버는 확정된 `agent:{agentId}`에게만 전달. hospital 브로드캐스트 제거.

> **질문에 대한 답변**: `agentPrinter` 테이블에 `printerId ↔ agentId` 매핑이 이미 존재합니다.
> 에이전트가 프린터 동기화(`POST /printers/sync`) 시 이 매핑이 자동 갱신됩니다.
> 따라서 **printerId만으로 연결된 에이전트를 찾아 이벤트를 전달하는 것이 가능**하며,
> 현재 `createPrintJob`에서도 이미 이 조회를 수행하고 있습니다(1060-1067행).

#### 수정 항목

| # | 위치 | 작업 | 설명 |
|---|------|------|------|
| 1-1 | `printers.service.ts` `createPrintJob` | agentId null이면 에러 반환 | `agentPrinter` 매핑도 없으면 `AGENT_NOT_FOUND` 에러 → 브라우저에 즉시 피드백 |
| 1-2 | `printers.service.ts` `updatePrintJobStatus` | **상태 머신 가드 추가** | `SUCCESS`/`FAILED`/`CANCELLED` 이후 변경 거부, 409 반환 |
| 1-3 | `socket-io.gateway.ts` `handlePrinterJobCreated` | hospital 브로드캐스트 제거 | agentId 지정 시 `agent:{agentId}`에만 전달. agentId null인 경우 제거 (API에서 항상 해석하므로) |
| 1-4 | `PrinterJobHandler.cs` | agentId 필터링 간소화 | agentId가 항상 존재하므로 null 체크 분기 간소화 |

#### 수정 후 흐름

```
Browser → POST /printers (outputTypeCode)
  ↓
API: resolvePrinterSetting → printerId 확정
API: agentPrinter.findMany({ where: { printerId } }) → agentId 확정
API: agentId가 null이면 → 400 AGENT_NOT_FOUND (즉시 실패)
API: agentId가 있으면 → printerJob 생성 → Kafka
  ↓
Socket Server: handlePrinterJobCreated
  → agent:{agentId}에만 전달 (hospital 브로드캐스트 없음)
  → user:{requestedBy}를 job:{jobId} 룸에 조인
  ↓
Agent (특정 1개만 수신): 출력 → API 상태 업데이트
  ↓
API: updatePrintJobStatus
  → 상태 머신 체크 (이미 SUCCESS면 FAILED 거부)
  → Kafka → Socket → job 룸 → 브라우저 토스트
```

#### `updatePrintJobStatus` 상태 머신 구현

```typescript
const TERMINAL_STATUSES = ['SUCCESS', 'FAILED', 'CANCELLED'];

async updatePrintJobStatus(input) {
  const current = await prismaAny.printerJob.findUnique({
    where: { id: input.jobId },
    select: { status: true },
  });

  if (!current) throw new NotFoundException('JOB_NOT_FOUND');
  if (TERMINAL_STATUSES.includes(current.status)) {
    return { id: input.jobId, status: current.status, ignored: true };
  }

  // 기존 업데이트 로직...
}
```

---

### Phase 2: Bug #2 수정 — agentId 항상 전달

| # | 위치 | 작업 | 설명 |
|---|------|------|------|
| 2-1 | `use-print-service.tsx` `requestPrintJob` | `useSocket()`에서 `currentAgentId` 가져와 항상 포함 | PC별 예외 설정이 적용되도록 |
| 2-2 | 프린트 팝업에서 호출하는 곳 | `agentId`를 `currentAgentId`로 주입 | 모든 출력 요청에 일관 적용 |

#### 수정 코드 예시

```typescript
// use-print-service.tsx
const requestPrintJob = useCallback(
  async ({ pdf, copies, paperSize, fileNamePrefix, outputTypeCode }: PrintOptions) => {
    // SocketContext에서 현재 바인딩된 에이전트 가져오기
    const { currentAgentId } = useSocket();
    
    const printPayload = {
      outputTypeCode,
      contentType: "application/pdf",
      fileName,
      contentUrl: uploadResult.storagePath,
      copies: finalCopies,
      options: { paperSize: finalPaperSize },
      agentId: currentAgentId ?? undefined,  // 항상 전달
    };
    await ApiClient.post("/printers", printPayload);
  }, []
);
```

---

### Phase 3: Bug #3 수정 — 로컬/원격 에이전트 구분

| # | 위치 | 작업 | 설명 |
|---|------|------|------|
| 3-1 | `SocketContext.tsx` | presence를 2개로 분리 | `localAgentStatus` (로컬 헬스체크), `hospitalAgentOnline` (병원 에이전트 존재 여부) |
| 3-2 | `SocketContext.tsx` | `performSetHospital` 결과 반영 | 실패 시 `localAgentStatus = 'offline'` |
| 3-3 | `socket-io.gateway.ts` `handleConnection` | 리더 기반 presence 제거 | ~~Redis leader 조회~~ → 연결된 에이전트 유무만 확인 |
| 3-4 | 헤더 UI | 녹색 동그라미 기준 변경 | 표시 기준을 `hospitalAgentOnline`으로 변경 (병원 내 출력 가능 에이전트 존재 = 녹색) |
| 3-5 | 헤더 UI (선택) | 로컬 에이전트 상태 별도 표시 | 로컬 에이전트 offline이면 경고 아이콘 또는 툴팁 추가 |

#### 수정 후 `SocketContext` 상태 구조

```typescript
type SocketContextValue = {
  socket: Socket | null;
  localAgentStatus: "online" | "offline" | null;     // 로컬 PC 에이전트 (loopback 체크)
  hospitalAgentOnline: boolean;                       // 병원 내 1개 이상 에이전트 연결 여부
  connectedAgentIds: string[];                        // 연결된 에이전트 ID 목록
  currentAgentId: string | null;                      // 내 PC 에이전트 ID (바인딩된)
};
```

#### 소켓서버 `handleConnection` 수정 (리더 제거 후)

```typescript
if (role === 'user') {
  await client.join(`hospital:${hospitalId}`);
  await client.join(`user:${payload.sub}`);

  // 병원 내 연결된 에이전트 목록 전달 (리더 아님, 목록)
  const sockets = await this.server.in(`hospital:${hospitalId}`).fetchSockets();
  const agentIds = sockets
    .filter(s => s.data?.payload?.role === 'agent')
    .map(s => String(s.data.payload.sub));

  client.emit('agent.presence', {
    agentIds,          // 연결된 에이전트 ID 배열
    status: agentIds.length > 0 ? 'online' : 'offline',
  });
}
```

---

### Phase 4: 소켓서버 리더 관련 코드 정리

| # | 위치 | 작업 |
|---|------|------|
| 4-1 | `socket-io.gateway.ts` | `electLeader` 메서드 삭제 |
| 4-2 | `socket-io.gateway.ts` | `notifyUsersAgentPresence` 간소화 |
| 4-3 | `socket-io.gateway.ts` | `sendAgentPresenceSnapshot` → 에이전트 목록 기반으로 변경 |
| 4-4 | `socket-io.gateway.ts` | `sendAgentByAgentIdFromAgent` → Mesh 관련 hospital fallback 제거 |
| 4-5 | `socket-io.gateway.ts` | `agent-event` 핸들러의 `orgId` 참조 정리 |
| 4-6 | `WebSocketService.cs` | `_currentRole`, `RoleUpdatePayload` 제거 |

---

## 수정 우선순위

```
[Phase 0] 리더 로직 제거 ──────────────────────── 선행 조건
     │
     ├── [Phase 1] Bug #1: 단일 에이전트 확정 라우팅 ── 가장 시급
     │
     ├── [Phase 2] Bug #2: agentId 항상 전달 ────────── 시급
     │
     └── [Phase 3] Bug #3: presence 분리 ────────────── 중간
          │
          └── [Phase 4] 코드 정리 ───────────────────── 낮음
```

---

## 테스트 검증 항목

### 기본 동작 검증
- [ ] 브라우저A 출력 요청 → 올바른 에이전트만 출력 → 브라우저A에 성공 토스트
- [ ] 요양기관A 출력이 요양기관B 에이전트에 전달되지 않음
- [ ] PC-A의 프린터가 PC-B 에이전트에 연결되어 있으면 PC-B가 출력

### Bug #1 회귀 테스트
- [ ] agentPrinter 매핑 있음 → 특정 에이전트에만 전달, 성공 토스트
- [ ] agentPrinter 매핑 없음 → 브라우저에 즉시 에러 반환 (500/404)
- [ ] 에이전트 SUCCESS 보고 후 다른 FAILED 도착 → 무시됨

### Bug #2 회귀 테스트
- [ ] PC별 예외 설정이 있으면 해당 프린터 사용
- [ ] 예외 설정 없으면 기본 프린터 사용
- [ ] agentId 전달 시 resolvePrinterSetting에서 예외 설정 조회

### Bug #3 회귀 테스트
- [ ] 로컬 에이전트 OFF, 다른 PC 에이전트 ON → 녹색 표시 (병원 가용)
- [ ] 로컬 에이전트 OFF → 로컬 상태 표시 (회색/경고)
- [ ] 모든 에이전트 OFF → 빨간색 표시

---

## 생성된 테스트 파일

| 파일 | 위치 | 테스트 수 |
|------|------|-----------|
| `socket-io.gateway.spec.ts` | `nextemr-socket-server/src/modules/socket-io/` | 14건 (전부 통과) |
| `printers-bug-analysis.spec.ts` | `nestjs-emr-api/src/modules/printers/` | 19건 (전부 통과) |
