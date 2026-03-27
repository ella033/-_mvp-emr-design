import { 의료급여메시지타입Label, type 의료급여메시지타입 } from "@/constants/common/common-enum";
import { EligibilityService } from "@/services/eligibility-service";

interface 수진자자격조회메세지 {
  sujinjaJuminNo: string;
  sujinjaJuminNm: string;
  diagDt: Date;
  ykiho: string;
  hiCardNo: string;
  birthDay: Date;
  logInId: string;
  logInPw: string;
  date: Date;
  messageStatus: string;
  msgType: any;
  clientInfo: string;
  operatorJuminNo: string;
  pgmType: any;
  version: string;
  idYN: boolean;
}

/**
 * 자격조회 서비스
 * 다른 화면에서도 재사용 가능한 자격조회 기능을 제공합니다.
 */
export class QualificationService {
  /**
   * 자격조회 실행
   * @param request - 자격조회 요청 데이터
   * @returns Promise<any> - 자격조회 응답 데이터
   */
  static async getQualification(
    request: 수진자자격조회메세지,
    isAutoTest: boolean = false
  ): Promise<any> {
    try {
      const response = await EligibilityService.getQualifications({
        sujinjaJuminNo: request.sujinjaJuminNo,
        sujinjaJuminNm: request.sujinjaJuminNm,
        diagDt: request.diagDt,
        ykiho: request.ykiho,
        msgType: 의료급여메시지타입Label[request.msgType as 의료급여메시지타입],
        idYN: request.idYN ?? false,
      });
      return response;
    } catch (error: any) {
      console.error("자격조회 서비스 오류:", error);
      if (isAutoTest) {
        return null;
      }
      // 에러 메시지를 포함하여 throw
      const errorMessage = error?.message || "자격조회에 실패했습니다.";
      throw new Error(errorMessage);
    }
  }

  /**
   * 자격조회 요청 데이터 생성
   * @param params - 기본 파라미터
   * @returns 수진자자격조회메세지
   */
  static createRequest(params: {
    sujinjaJuminNo: string;
    sujinjaJuminNm: string;
    ykiho: string;
    date?: Date;
    msgType?: 의료급여메시지타입;
    idYN?: boolean | false;
  }): 수진자자격조회메세지 {
    return {
      sujinjaJuminNo: params.sujinjaJuminNo.replace(/-/g, ""), // 하이픈 제거
      sujinjaJuminNm: params.sujinjaJuminNm,
      diagDt: params.date || new Date(),
      ykiho: params.ykiho,
      hiCardNo: "",
      birthDay: new Date(),
      logInId: "",
      logInPw: "",
      date: new Date(),
      messageStatus: "",
      msgType: params.msgType as any,
      clientInfo: "",
      operatorJuminNo: "",
      pgmType: 1 as any,
      version: "1.0",
      idYN: params.idYN ?? false,
    };
  }
}
