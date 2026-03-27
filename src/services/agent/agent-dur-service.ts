/**
 * Agent DUR (Drug Utilization Review) Service
 * 로컬 Agent(8488)의 DUR API를 호출하는 서비스
 */

import { PaymentMethod, UserType, 보험구분상세 } from "@/constants/common/common-enum";
import type { UpsertManyOrders } from "@/types/chart/order-types";

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_BASE || "https://localhost:53999";

/**
 * DUR 점검 요청 타입
 * pPrescription 처방조제 일반정보 필수 Properties
 */
export interface DurCheckRequest {
  // ================================ 처방조제 일반정보 (필수) ================================
  /** 처방조제구분 [1자] (M:처방, P:조제) */
  AdminType: string;
  /** 수진자 주민번호 [13자] */
  JuminNo: string;
  /** 수진자 성명 [20자내] */
  PatNm: string;
  /** 수진자 보험자구분 [2자] (04:건강보험, 05:의료급여, 07:보훈, 08:자동차보험, 09:일반, 10:산업재해보험) */
  InsurerType: string;
  /** 임부여부 [1자] (Y:임부, N:미임부) */
  PregWmnYN: string;
  /** 처방일자 [8자] (MakerDate: 조제일자 YYYYMMDD) */
  PrscPresDt: string;
  /** 처방시간 [6자] (MakerTime: 조제시간 HHMMSS) */
  PrscPresTm: string;
  /** 처방기관기호 [8자] (MakerIssueAdmin: 조제기관기호) */
  MprscIssueAdmin: string;
  /** 처방전교부번호 [13자] (YYYYMMDD + 5자리 일련번호) */
  MprscGrantNo: string;
  /** 처방기관명 [50자내] (MakerAdminName: 조제기관명) */
  PrscAdminName: string;
  /** 처방기관전화번호 [20자내] (MakerTel: 조제기관전화번호) */
  PrscTel: string;
  /** 처방면허종별 [2자] (의사(AA),약사(BB),치과의사(CC),한의사(DD),간호사(EE)) */
  PrscLicType: string;
  /** 의료인면허번호 [6자] (의사,간호사(보건진료소 경우) */
  DrLicNo: string;
  /** 의료인성명 [20자내] */
  PrscName: string;
  /** 진료과목코드 [2자] */
  Dsbjt: string;
  /** 주상병코드 [6내] */
  MainSick: string;
  /** 처방조제유형코드 [2자] (01:입원처방및조제, 02:외래원외처방, 03:약국직접조제, 04:약국판매약, 05:외래원내처방, 06:퇴원약, 07:성분명처방약, 10:외래 예약 등, 31:입원처방 및 직접조제, 36:퇴원처방 및 직접조제, 35:외래원내처방 및 직접조제, 23:외래예약 원내처방, 33:외래예약 원내처방 및 직접조제, 42:비대면진료 외래원외처방) */
  PrscClCode: string;
  /** 청구 SW 업체코드 [8자] */
  AppIssueAdmin: string;
  /** 청구 SW 인증코드 [30자] */
  AppIssueCode: string;
  /** 점검수정구분 [1자] (점검(N), 수정(M)) */
  PrscYN: string;
  /** 최초처방일자 [YYYYMMDD] */
  OrgPrscPresDt: string;
  /** 최초교부번호 [13자] (YYYYMMDD + 5자리 일련번호) */
  OrgMprscGrantNo: string;
  // ================================ 약품정보 (AddMedicine 함수 파라미터) ================================
  /**
   * 약품정보 리스트
   * AddMedicine(보험청구코드, 분류유형코드, 약품코드, 약품명, 성분코드, 성분명, 1회투약량, 1일투여횟수, 총투여횟수, 원내원외코드, 처방용법)
   */
  Medicines: Array<{
    /** 분류유형코드(3:약가,5:보험등재약의 일반(성분명)) 현재 보험등재약, 원료,조제(제제약), 보험등재약의 일반(성분명)만 처리함 */
    PrscType: number;
    /** 약품코드(성분명처방일 경우 NULL 가능) */
    MedcCD: string | null;
    /** 약품명(성분명처방일 경우 NULL 가능) */
    MedcNM: string | null;
    /** 성분코드 */
    GnlNMCD: string;
    /** 성분명(NULL 가능) */
    GnlNM: string | null;
    /** 1회 투여량 */
    DdMgtyFreq: number;
    /** 1일 투여횟수 */
    DdExecFreq: number;
    /** 총 투여일수 */
    MdcnExecFreq: number;
    /** 보험 적용구분(A:보험, B:비보험, C: 100/100, D:약국판매약(조제기관만 해당)) */
    InsudmType: string;
    /** 원외(1), 원내(2) 구분 */
    IoHsp: string;
    /** 처방용법 (추가 필요 시 null 가능 최대 100bytes) */
    prscUsg: string | null;
  }>;
}

/**
 * DUR 점검 결과 타입
 * pResultSet 점검완료 후의 점검결과 리스트 정보
 */
export interface DurCheckResult {
  /** 점검 성공 여부 */
  Success: boolean;
  /** 결과 코드 */
  ResultCode: number;
  /** 점검 결과 */
  ResultSet?: DurCheckResultSet[];
  /** Agent 결과 메시지 */
  AgentMessage?: string;
  /** Dur 에서 주는 에러 메시지 */
  DurMessage: string;
}

/**
 * DUR 점검 결과 정보
 */
export interface DurCheckResultSet {
  /** 점검결과 총개수 */
  Totalcnt: number;
  /** 점검 개수 */
  Checkcnt: number;
  /** AddReport 수 */
  Reportcnt: number;
  /** 오류코드 */
  ErrorCode: number;
  /** 약품개수 */
  Medicnt: number;
  /** 결과 리스트 인덱스 */
  Index: number;
  /** 최초관리번호 */
  MedicineSerialNo: number;
  /** 입력약품코드 */
  MedcCDA: string;
  /** 입력약품명 */
  MedcNMA: string;
  /** 입력성분코드 */
  GnlNMCDA: string;
  /** 입력성분명 */
  GnlNMA: string;
  /** 입력 1회투약량 */
  DDMqtyFreqA: number;
  /** 입력 1일투여회수 */
  DDExecFreqA: number;
  /** 입력총투여일수 */
  MdcnExecFreqA: number;
  /** 점검종류코드 */
  Type: number;
  /** 점검유형 M,P,L */
  ExamTypeCD: string;
  /** 점검설명 */
  ExamTypeDesc: string;
  /** 점검결과등급 */
  Level: string;
  /** 점검결과내용 */
  Message: string;
  /** 부작용정보 */
  Notice: string;
  /** 사유코드 */
  ReasonCD: string;
  /** 사유내용 */
  Reason: string;
  /** 중복처방조제구분 */
  DpPrscMake: string;
  /** 중복처방일자 */
  DpPrscYYMMDD: string;
  /** 중복처방시간 */
  DpPrscHMMSS: string;
  /** 중복처방기관기호 */
  DpPrscAdminCode: string;
  /** 중복처방전교부번호 */
  DpPrscGrantNo: string;
  /** 중복처방기관명 */
  DpPrscAdminName: string;
  /** 중복처방기관전화 */
  DpPrscTel: string;
  /** 중복처방기관팩스 */
  DpPrscFax: string;
  /** 중복처방의사명 */
  DpPrscName: string;
  /** 중복처방 의사면허번호 */
  DpPrscLic: string;
  /** 중복조제일자 */
  DpMakeYYMMDD: string;
  /** 중복조제시간 */
  DpMakeHMMSS: string;
  /** 중복조제기관기호 */
  DpMakeAdminCode: string;
  /** 중복조제기관명 */
  DpMakeAdminName: string;
  /** 중복조제기관전화 */
  DpMakeTel: string;
  /** 중복조제약사명 */
  DpMakeName: string;
  /** 중복조제약사면허번호 */
  DpMakeLic: string;
  /** 중복약품코드 */
  MedcCDB: string;
  /** 중복약품명 */
  MedcNMB: string;
  /** 중복성분코드 */
  GnlNMCDB: string;
  /** 중복성분명 */
  GnlNMB: string;
  /** 중복 1회투약량 */
  DDMqtyFreqB: number;
  /** 중복 1일투여회수 */
  DDExecFreqB: number;
  /** 중복총투여일수 */
  MdcnExecFreqB: number;
}

/**
 * DUR 점검 취소 요청 타입 (백엔드 DurCancelRequest와 동일)
 */
export interface DurCancelRequest {
  /** 처방(M)/조제구분(P) */
  prscMake: string;
  /** 수진자주민번호(13자리) */
  patJuminNo: string;
  /** 처방일자(YYYYMMDD) */
  prscData: string;
  /** 처방기관기호 */
  yKiHo: string;
  /** 처방전교부번호 */
  mprscGrantNo: string;
  /** 취소사유코드 */
  reasonCd: string;
  /** 취소 사유(NULL 가능) */
  reasonText: string | null;
  /** 조제기관기호(조제취소 시 필수) */
  makerCode: string;
}

export interface DurCancelResponse {
  Code: number;
  HelpMessage: string;
}
/**
 * 임부금기 점검 요청 타입
 */
export interface PregnancyCheckRequest {
  /** 성분코드 */
  ComponentCode: string;
  /** 점검일자 */
  Date: string;
}

/**
 * 연령제한 점검 요청 타입
 */
export interface AgeLimitCheckRequest {
  /** 수진자 주민번호 */
  JuminNo: string;
  /** 발행일자 */
  IssueDate: string;
  /** 성분코드 */
  GnlNMCD: string;
  /** 약품코드 */
  MedCode: string;
}

/**
 * Agent DUR Service
 */
export const AgentDurService = {
  /**
   * DUR 점검
   * @param hospitalCode 요양기관번호
   * @param request DUR 점검 요청 데이터
   * @returns DUR 점검 결과 (pResultSet)
   */
  async checkDur(hospitalCode: string, request: DurCheckRequest): Promise<DurCheckResult> {
    const url = `${AGENT_BASE}/api/dur/${hospitalCode}/Check`;

    try {
      console.log("[DUR] DUR 점검 요청", request);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답을 읽을 수 없습니다");
        throw new Error(`DUR 점검 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log("[DUR] DUR 점검 결과", result);
      return result;
    } catch (error: any) {
      // Failed to fetch 에러 처리
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        const errorMessage = `DUR 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (${url})`;
        console.error("[DUR] DUR 점검 네트워크 에러:", errorMessage, error);
        throw new Error(errorMessage);
      }

      console.error("[DUR] DUR 점검 에러:", error);
      throw error;
    }
  },

  /**
   * DUR 점검 취소
   * @param hospitalCode 요양기관번호(처방기관기호)
   * @param request DUR 취소 요청 데이터
   */
  async cancelDur(hospitalCode: string, request: DurCancelRequest): Promise<unknown> {
    const url = `${AGENT_BASE}/api/dur/${hospitalCode}/Cancel`;

    try {
      console.log("[DUR] DUR 점검 취소 요청", request);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답을 읽을 수 없습니다");
        throw new Error(
          `DUR 점검 취소 실패: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json().catch(() => ({}));
      console.log("[DUR] DUR 점검 취소 결과", result);
      return result;
    } catch (error: unknown) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        const errorMessage = `DUR 서버에 연결할 수 없습니다. (${url})`;
        console.error("[DUR] DUR 점검 취소 네트워크 에러:", errorMessage, error);
        throw new Error(errorMessage);
      }
      console.error("[DUR] DUR 점검 취소 에러:", error);
      throw error;
    }
  },

  /**
   * 임부금기 점검
   * @param hospitalCode 요양기관번호
   * @param request 임부금기 점검 요청 데이터
   */
  async checkPregnancy(hospitalCode: string, request: PregnancyCheckRequest) {
    try {
      const response = await fetch(`${AGENT_BASE}/api/dur/${hospitalCode}/ChkPwCtdDrug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`임부금기 점검 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[DUR] 임부금기 점검 에러:", error);
      throw error;
    }
  },

  /**
   * 연령제한 점검
   * @param hospitalCode 요양기관번호
   * @param request 연령제한 점검 요청 데이터
   */
  async checkAgeLimit(hospitalCode: string, request: AgeLimitCheckRequest) {
    try {
      const response = await fetch(`${AGENT_BASE}/api/dur/${hospitalCode}/CheckAgeLimit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`연령제한 점검 실패: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[DUR] 연령제한 점검 에러:", error);
      throw error;
    }
  },

  // 수진자 보험자구분 (04:건강보험, 05:의료급여, 07:보훈, 08:자동차보험, 09:일반, 10:산업재해보험)
  getInsurerType: (insuranceType: 보험구분상세) => {
    switch (insuranceType) {
      case 보험구분상세.일반:
        return "09";
      case 보험구분상세.직장조합:
        return "04";
      case 보험구분상세.국민공단:
        return "04";
      case 보험구분상세.의료급여1종:
        return "05";
      case 보험구분상세.의료급여2종:
        return "05";
      case 보험구분상세.의료급여2종장애:
        return "05";
      case 보험구분상세.차상위1종:
        return "04";
      case 보험구분상세.차상위2종:
        return "04";
      case 보험구분상세.자보:
        return "08";
      case 보험구분상세.산재:
        return "10";
      case 보험구분상세.재해:
        return "10";
      default:
        return "09";
    }
  },

  // 의사(AA),약사(BB),치과의사(CC),한의사(DD),간호사(EE)
  getPrscLicType: (userType: UserType) => {
    switch (userType) {
      case UserType.의사:
        return "AA";
      case UserType.간호사:
        return "EE";
    }
  },

  // A:보험, B:비보험, C: 100/100, D:약국판매약(조제기관만 해당)
  getPInsudmType: (order: UpsertManyOrders) => {
    if (order.isClaim) return "A";
    return [PaymentMethod.백대백, PaymentMethod.보훈본인부담].includes(order.paymentMethod)
      ? "C"
      : "B";
  },
};
