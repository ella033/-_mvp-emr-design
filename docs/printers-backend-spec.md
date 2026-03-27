## 프린터 동기화 백엔드 명세 (API/소켓/에이전트)

### 목표

- 요양기관(병원) 단위로 연결된 모든 PC 에이전트가 윈도우 프린터 전체 정보를 수집하여 서버 DB에 업서트한다.
- 프런트는 동기화 트리거 후 완료 이벤트를 받아 최신 목록을 재조회한다.

---

### 소켓 토폴로지(역할/룸 설계)

- 연결 구조: 웹프론트 ↔ 웹소켓서버 ↔ 에이전트 (PC 1 : Agent 1)
- 역할(Role)
  - `user`: 웹프론트 클라이언트
  - `agent`: PC 에이전트
- 조인 룸(Room)
  - 조직 룸: `hospital:{orgId}`
    - 동일 요양기관의 모든 `user`, `agent`가 조인
    - 브로드캐스트 대상(동기화 요청/완료 알림)
  - 에이전트 프라이빗 룸: `agent:{agentId}:{orgId}`
    - 해당 에이전트 전용 지시/응답 채널
- 프레즌스 이벤트(예시)
  - 서버→조직 룸: `agent.presence` `{ agentId, status: 'online'|'offline' }`

---

### HTTP API (REST 계약)

1. GET `/printers`
   - 설명: 토큰 컨텍스트의 최신 프린터 목록 조회
   - 응답: `Printer[]`
   - 캐시: ETag/If-None-Match 지원 가능

2. POST `/printers/sync`
   - 설명: 에이전트가 윈도우 프린터 스냅샷 업서트 제출
   - 헤더: `Authorization`(에이전트 인증), `X-Agent-Id`, `X-Operation-Id`(선택), `Idempotency-Key`(선택)
   - 본문: `SyncPrintersRequest`
   - 응답: `SyncPrintersResponse { synced: number }`
   - 멱등성: `(operationId, agentId)` 단위 중복 무시

3. POST `/agent/printers/refresh`
   - 설명: 조직 전체 에이전트에 수집 요청 트리거
   - 서버 동작: `operationId` 발급 → 카프카 `printers.refresh.request` 발행 `{ orgId, operationId, requesterId }` → 소켓으로 `hospital:{orgId}`에 브로드캐스트(또는 소켓 게이트웨이가 카프카 컨슘)
   - 응답: 202 Accepted, `RefreshPrintersAcceptedResponse { operationId, onlineAgents, timeoutSec, status: 'pending' }`

4. GET `/agent/printers/refresh/:operationId`
   - 설명: 진행 상태 조회(소켓 미사용 클라이언트용 폴링)
   - 응답: `RefreshPrintersStatusResponse { status, expected, received, completedAt? }`

5. (선택) GET `/printers/me`
   - 설명: 토큰 컨텍스트의 기본 프린터/설정 조회

---

### 이벤트 흐름(카프카/소켓)

1. 클라이언트가 POST `/agent/printers/refresh` 호출 → 서버가 `operationId` 생성(ULID/UUIDv4)
2. 서버가 카프카 `printers.refresh.request` 발행 `{ orgId, operationId, requesterId }`
3. 소켓 서버가 `hospital:{orgId}` 룸에 브로드캐스트(역할 구분 불필요) 이벤트명 예: `printers.refresh.request`
4. 각 에이전트(agent:{agentId}:{orgId}에 조인되어 있음)가 요청 수신 → 윈도우 프린터 목록 수집 → POST `/printers/sync` 전송(헤더에 `X-Agent-Id`, `X-Operation-Id`)
5. API 서버는 업서트 후 집계 테이블에 `(operationId, expected, received)` 업데이트, 진행률 필요 시 카프카 `printers.refresh.progress` 발행
6. 모든 응답 수신 또는 타임아웃 시 `printers.refresh.completed` 발행 → 소켓 `hospital:{orgId}` 룸에 브로드캐스트 `{ operationId, expected, received, status }`
7. 프런트는 `printers.refresh.completed` 수신 시 `GET /printers`로 최신 목록 재조회

---

### 데이터 모델(권장)

```
printers
  id PK, org_id, name, device_id, path, port_name, driver_name,
  location, is_default, status, capabilities JSONB, updated_at
  UNIQUE(org_id, device_id)  // 대안: (org_id, path) → 최후: (org_id, name, port_name)

agent_printers
  id PK, printer_id FK, agent_id, last_seen_at

printer_snapshots (선택 보관)
  id PK, org_id, agent_id, operation_id, payload JSONB, created_at

printer_sync_operations
  operation_id PK, org_id, expected, received,
  status ENUM(pending, completed, partial, no_agents),
  created_at, completed_at
```

---

### 타입(프런트 계약과 동일)

```ts
interface WindowsPrinterCapability {
  duplex?: boolean;
  color?: boolean;
  collate?: boolean;
  paperSizes?: string[];
  bins?: string[];
}

interface WindowsPrinterInfo {
  name: string;
  shareName?: string | null;
  portName?: string | null;
  driverName?: string | null;
  location?: string | null;
  comment?: string | null;
  serverName?: string | null;
  isDefault?: boolean;
  status?: string | null;
  isNetwork?: boolean;
  isShared?: boolean;
  deviceId?: string | null;
  macAddress?: string | null;
  ipAddress?: string | null;
  path?: string | null;
  capabilities?: WindowsPrinterCapability;
}

interface SyncPrintersRequest {
  printers: WindowsPrinterInfo[];
}
interface SyncPrintersResponse {
  synced: number;
}

interface RefreshPrintersAcceptedResponse {
  operationId: string;
  onlineAgents: number;
  timeoutSec: number;
  status: "pending";
}
interface RefreshPrintersStatusResponse {
  operationId: string;
  status: "pending" | "completed" | "partial" | "no_agents";
  expected: number;
  received: number;
  completedAt?: string | null;
}
```

---

### 보안/정책

- 토큰에서 `hospitalId`(=orgId) 추출, 모든 엔드포인트는 컨텍스트 기준 동작
- 에이전트 인증: 서버-서버 토큰 또는 HMAC 서명 권장, 헤더 `X-Agent-Id` 필수
- 멱등성: `(operationId, agentId)` 유니크 제약으로 중복 제출 무시
- 타임아웃: 기본 10초(설정 가능). 일부만 응답 시 `partial` 처리

---

### 예시 시퀀스

1. 프런트 POST `/agent/printers/refresh` → 202 `{ operationId, onlineAgents, timeoutSec, status: 'pending' }`
2. 소켓 서버 `hospital:{orgId}`에 `printers.refresh.request` 브로드캐스트
3. 각 에이전트 → 윈도우 프린터 조회 → POST `/printers/sync`(`X-Agent-Id`, `X-Operation-Id`)
4. 서버 집계 완료 → `printers.refresh.completed`를 `hospital:{orgId}`에 브로드캐스트
5. 프런트가 `GET /printers` 재조회 후 화면 갱신

---

### 구현 체크리스트

- [ ] ULID/UUIDv4로 `operationId` 발급 유틸
- [ ] 카프카 토픽: `printers.refresh.request|progress|completed`
- [ ] 소켓 룸 조인 정책(위 토폴로지) 및 브로드캐스트 유틸
- [ ] DB 마이그레이션(4개 테이블) 및 인덱스/유니크 제약
- [ ] 업서트 리포지토리: 키 우선순위 `deviceId` > `path` > `name+portName`
- [ ] 멱등성 저장소: `(operationId, agentId)` 처리
- [ ] REST 컨트롤러 4개 엔드포인트 구현
- [ ] 단위/통합 테스트(업서트/집계/타임아웃/이벤트)

---

### 합의 포인트

- `operationId` 포맷(ULID vs UUIDv4)
- 타임아웃/재시도 전략
- 진행률(progress) 이벤트 제공 여부(완료 이벤트만으로 충분한지)

---

### 소켓 우선(REST 최소화) 변형안

브라우저 ↔ 소켓서버 ↔ 에이전트로 실시간 트리거/알림을 처리하고, DB 저장은 그대로 REST API로 수행하는 구성. 기존 흐름에서 “트리거용 HTTP”만 소켓 이벤트로 대체되며, `operationId`/집계/타임아웃/완료 알림 개념은 동일하다.

#### 변경점 요약

- 트리거: HTTP POST(`/agent/printers/refresh`) → 소켓 이벤트 `printers.refresh.request`(client→server)
- 승인 응답: 소켓 `printers.refresh.accepted`(server→요청자)
- 요청 브로드캐스트: 소켓 서버가 `hospital:{orgId}` 룸에 `printers.refresh.request` 재전파
- 에이전트 업서트: 에이전트는 로컬 수집 후 REST `POST /printers/sync` 호출(헤더 `X-Agent-Id`, `X-Operation-Id`)
- 진행/완료 알림: API→카프카→소켓서버 경유 `printers.refresh.progress/completed`를 `hospital:{orgId}`로 브로드캐스트
- 최종 목록: 클라이언트는 완료 수신 후 `GET /printers` 재조회

#### 이벤트 계약(예시)

```ts
// Client → SocketServer
type PrintersRefreshRequest = { orgId: string };
// SocketServer → Client(요청자)
type PrintersRefreshAccepted = {
  operationId: string;
  onlineAgents: number;
  timeoutSec: number;
  status: "pending";
};
// SocketServer ↔ Agents(브로드캐스트는 hospital:{orgId})
type PrintersRefreshBroadcast = {
  orgId: string;
  operationId: string;
  requesterId: string;
};
// SocketServer → Clients(조직 룸)
type PrintersRefreshProgress = {
  operationId: string;
  expected: number;
  received: number;
};
type PrintersRefreshCompleted = {
  operationId: string;
  status: "completed" | "partial" | "no_agents";
  expected: number;
  received: number;
  completedAt?: string;
};
```

#### 시퀀스

1. 브라우저가 소켓 `printers.refresh.request` emit `{ orgId }`
2. 소켓서버가 인증/인가(토큰의 orgId/role==user) 확인 → `operationId` 생성 → 요청자에게 `printers.refresh.accepted` 송신
3. 소켓서버가 `hospital:{orgId}` 룸에 `printers.refresh.request` 브로드캐스트 `{ operationId, orgId, requesterId }`
4. 각 에이전트가 수신 → 로컬 윈도우 프린터 수집
5. 각 에이전트가 REST `POST /printers/sync` 제출(헤더: `X-Agent-Id`, `X-Operation-Id`=operationId)
6. API 서버는 업서트 및 진행 집계 후 카프카 `printers.refresh.progress`/`completed` 발행
7. 소켓서버가 이를 컨슘하여 `hospital:{orgId}`에 `progress`/`completed` 이벤트 브로드캐스트
8. 브라우저는 `completed` 수신 시 `GET /printers`로 최신 목록 재조회

#### 에러/타임아웃 처리

- 온라인 에이전트 수가 0이면 즉시 `printers.refresh.completed { status:'no_agents' }`
- 타임아웃 경과 후 미응답이 존재하면 `status:'partial'`로 종료
- 진행률 표시가 필요 없다면 `completed`만 송신해도 무방

#### 소켓 인증/인가 가이드

- 핸드셰이크에서 액세스 토큰 검증, 컨텍스트에 `orgId`, `role` 바인딩
- emit 권한: `printers.refresh.request`는 `role=='user'`만 허용
- 룸 조인: 로그인 직후 `hospital:{orgId}` 조인, 에이전트는 추가로 `agent:{agentId}:{orgId}` 조인
- 서버에서 `orgId`는 토큰 소스 우선, 클라이언트 페이로드의 `orgId`는 교차검증(불일치 시 거부)
