import { ApiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-proxy";
import { eligibilityApi } from "@/lib/api/api-routes";
import { convertToYYYYMMDD } from "@/lib/date-utils";
import { validateId } from "@/lib/validation";

export class EligibilityService {
  static async getEligibility(id: string): Promise<any> {
    const validatedId = validateId(id, "eligibilityId");
    try {
      return await ApiClient.get<any>(eligibilityApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("자격 조회 실패", error.status);
    }
  }
  static async getQualifications(data: {
    sujinjaJuminNo: string;
    sujinjaJuminNm: string;
    diagDt: Date;
    ykiho: string;
    msgType: string;
    idYN?: boolean;
  }): Promise<any> {
    try {
      const { ...bodyData } = data;
      // Date 객체를 ISO 문자열로 변환
      const diagDtString = bodyData.diagDt instanceof Date
        ? convertToYYYYMMDD(bodyData.diagDt.toISOString().split('T')[0])
        : convertToYYYYMMDD(String(bodyData.diagDt));
      console.log(diagDtString);

      const url = eligibilityApi.qualifications();
      return await ApiClient.post<any>(url, {
        sujinjaJuminNo: bodyData.sujinjaJuminNo,
        sujinjaJuminNm: bodyData.sujinjaJuminNm,
        diagDt: diagDtString,
        ykiho: bodyData.ykiho,
        msgType: bodyData.msgType,
        idYN: bodyData.idYN ? 'Y' : 'N',
      });
    } catch (error: any) {
      // ApiError인 경우 message를 그대로 반환
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("공단자격 조회 실패: " + error.message);
    }
  }
  static async createEligibility(data: any): Promise<any> {
    try {
      const { patientId, ...bodyData } = data;
      const url = eligibilityApi.create(patientId);
      return await ApiClient.post<any>(url, bodyData);
    } catch (error: any) {
      throw new Error("자격 생성 실패", error.status);
    }
  }
  static async updateEligibility(id: string, data: any): Promise<any> {
    const validatedId = validateId(id, "eligibilityId");
    try {
      return await ApiClient.put<any>(eligibilityApi.update(validatedId), data);
    } catch (error: any) {
      throw new Error("자격 수정 실패", error.status);
    }
  }
  static async deleteEligibility(id: string): Promise<any> {
    const validatedId = validateId(id, "eligibilityId");
    try {
      return await ApiClient.delete<any>(eligibilityApi.delete(validatedId));
    } catch (error: any) {
      throw new Error("자격 삭제 실패", error.status);
    }
  }
}