import { ApiClient } from "@/lib/api/api-client";
import { prescriptionUserCodeApi } from "@/lib/api/api-routes";
import { createServiceError } from "@/lib/error-utils";
import { validateId } from "@/lib/validation";
import type {
  PrescriptionUserCodesParamType,
  PrescriptionUserCodesSearchAllParamType,
} from "@/types/master-data/prescription-user-codes/prescription-user-codes-param-type";
import type { PrescriptionUserCodesType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-type";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import type { PrescriptionUserCodesUpsertType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";

export class PrescriptionUserCodeService {
  static async getPrescriptionUserCodes(
    query?: PrescriptionUserCodesParamType
  ): Promise<PrescriptionUserCodesType> {
    try {
      const queryString = query ? this.buildQueryString(query) : "";
      return await ApiClient.get<PrescriptionUserCodesType>(
        prescriptionUserCodeApi.list(queryString)
      );
    } catch (error: any) {
      throw new Error("처방 사용자코드 조회 실패", error.status);
    }
  }

  private static buildQueryString(
    query: PrescriptionUserCodesParamType
  ): string {
    const params = new URLSearchParams();

    // 각 필드를 적절한 타입으로 변환하여 추가
    if (query.keyword !== undefined && query.keyword !== "") {
      params.append("keyword", query.keyword);
    }
    if (query.limit !== undefined && query.limit > 0) {
      params.append("limit", query.limit.toString());
    }
    if (query.cursor !== undefined && query.cursor > 0) {
      params.append("cursor", query.cursor.toString());
    }
    if (query.baseDate !== undefined && query.baseDate !== "") {
      params.append("baseDate", query.baseDate);
    }
    if (query.type !== undefined && query.type > 0) {
      params.append("type", query.type.toString());
    }
    if (query.subType !== undefined && query.subType > 0) {
      params.append("subType", query.subType.toString());
    }
    if (query.itemType !== undefined && query.itemType !== "") {
      params.append("itemType", query.itemType);
    }
    if (query.codeType !== undefined && query.codeType > 0) {
      params.append("codeType", query.codeType.toString());
    }
    if (query.examCategory !== undefined && query.examCategory > 0) {
      params.append("examCategory", query.examCategory.toString());
    }
    if (
      query.examDetailCategory !== undefined &&
      query.examDetailCategory > 0
    ) {
      params.append("examDetailCategory", query.examDetailCategory.toString());
    }
    if (query.oneTwoType !== undefined && query.oneTwoType > 0) {
      params.append("oneTwoType", query.oneTwoType.toString());
    }
    if (query.surgeryType !== undefined && query.surgeryType !== "") {
      params.append("surgeryType", query.surgeryType);
    }
    if (query.radiationCategory !== undefined && query.radiationCategory > 0) {
      params.append("radiationCategory", query.radiationCategory.toString());
    }
    if (query.isIncludeAssessment !== undefined) {
      params.append(
        "isIncludeAssessment",
        query.isIncludeAssessment.toString()
      );
    }
    if (
      query.administrationRoute !== undefined &&
      query.administrationRoute !== ""
    ) {
      params.append("administrationRoute", query.administrationRoute);
    }
    if (
      query.activeIngredientCode !== undefined &&
      query.activeIngredientCode !== ""
    ) {
      params.append("activeIngredientCode", query.activeIngredientCode);
    }
    if (query.salaryStandard !== undefined && query.salaryStandard !== "") {
      params.append("salaryStandard", query.salaryStandard);
    }
    if (
      query.withdrawalPrevention !== undefined &&
      query.withdrawalPrevention !== ""
    ) {
      params.append("withdrawalPrevention", query.withdrawalPrevention);
    }
    if (query.sameDrugCode !== undefined && query.sameDrugCode !== "") {
      params.append("sameDrugCode", query.sameDrugCode);
    }
    if (
      query.specializationType !== undefined &&
      query.specializationType !== ""
    ) {
      params.append("specializationType", query.specializationType);
    }
    if (query.drugEquivalence !== undefined && query.drugEquivalence !== "") {
      params.append("drugEquivalence", query.drugEquivalence);
    }
    if (query.substituteType !== undefined && query.substituteType !== "") {
      params.append("substituteType", query.substituteType);
    }
    if (query.importCompany !== undefined && query.importCompany !== "") {
      params.append("importCompany", query.importCompany);
    }
    if (query.manufacturerName !== undefined && query.manufacturerName !== "") {
      params.append("manufacturerName", query.manufacturerName);
    }
    if (query.scope !== undefined && query.scope !== "") {
      params.append("scope", query.scope);
    }
    if (query.isActive !== undefined && query.isActive !== "") {
      params.append("isActive", query.isActive);
    }
    if (
      query.externalLabHospitalMappingId !== undefined &&
      query.externalLabHospitalMappingId !== ""
    ) {
      params.append(
        "externalLabHospitalMappingId",
        query.externalLabHospitalMappingId
      );
    }
    if (query.excludeSystemExternalLab === true) {
      params.append("excludeSystemExternalLab", "true");
    }

    return params.toString();
  }

  static async searchAllPrescriptionUserCodes(
    query: PrescriptionUserCodesSearchAllParamType
  ): Promise<any> {
    const queryString = query ? this.buildQueryStringSearchAll(query) : "";
    return await ApiClient.get<any>(
      prescriptionUserCodeApi.searchAll(queryString)
    );
  }

  private static buildQueryStringSearchAll(
    param: PrescriptionUserCodesSearchAllParamType
  ): string {
    const searchParams = new URLSearchParams();

    searchParams.append("baseDate", param.baseDate);
    if (param.keyword !== undefined && param.keyword !== "") {
      searchParams.append("keyword", param.keyword);
    }
    if (param.limit !== undefined && param.limit > 0) {
      searchParams.append("limit", param.limit.toString());
    }
    if (param.diseaseCursor !== undefined) {
      searchParams.append("diseaseCursor", param.diseaseCursor.toString());
    }
    if (param.bundleCursor !== undefined) {
      searchParams.append("bundleCursor", param.bundleCursor.toString());
    }
    if (param.userCodeCursor !== undefined) {
      searchParams.append("userCodeCursor", param.userCodeCursor.toString());
    }
    if (param.libraryCursor !== undefined) {
      searchParams.append("libraryCursor", param.libraryCursor.toString());
    }
    if (param.type !== undefined && param.type > 0) {
      searchParams.append("type", param.type.toString());
    }
    if (param.isComplete !== undefined) {
      searchParams.append("isComplete", param.isComplete ? "true" : "false");
    }

    return searchParams.toString();
  }

  static async getPrescriptionUserCode(
    id: number
  ): Promise<PrescriptionUserCodeType> {
    try {
      return await ApiClient.get<PrescriptionUserCodeType>(
        prescriptionUserCodeApi.detail(id)
      );
    } catch (error: any) {
      throw new Error("처방 사용자코드 상세 조회 실패", error.status);
    }
  }

  static async upsertPrescriptionUserCode(
    data: PrescriptionUserCodesUpsertType
  ): Promise<any> {
    try {
      // 수정 모드인 경우 existingId를 URL에 추가
      const existingId = data.userCodeId?.toString();
      return await ApiClient.post<any>(
        prescriptionUserCodeApi.upsert(existingId),
        data
      );
    } catch (error: any) {
      throw createServiceError(
        error,
        "PrescriptionUserCodeService.upsertPrescriptionUserCode"
      );
    }
  }

  static async toggleActivePrescriptionUserCode(
    id: number,
    isActive: boolean
  ): Promise<any> {
    return await ApiClient.patch<any>(
      prescriptionUserCodeApi.toggleActive(id, isActive)
    );
  }

  static async toggleActivePrescriptionUserCodes(
    ids: number[],
    isActive: boolean
  ): Promise<any> {
    return await ApiClient.patch<any>(
      prescriptionUserCodeApi.toggleActiveMultiple(),
      { ids: ids, isActive: isActive }
    );
  }

  static async deletePrescriptionUserCode(id: string): Promise<any> {
    const validatedId = validateId(id, "prescriptionUserCodeId");
    try {
      return await ApiClient.delete<any>(
        prescriptionUserCodeApi.delete(validatedId)
      );
    } catch (error: any) {
      throw createServiceError(
        error,
        "PrescriptionUserCodeService.deletePrescriptionUserCode"
      );
    }
  }

  static async deletePrescriptionUserCodes(ids: number[]): Promise<any> {
    try {
      return await ApiClient.delete<any>(
        prescriptionUserCodeApi.deleteMultiple(),
        { ids: ids }
      );
    } catch (error: any) {
      throw createServiceError(
        error,
        "PrescriptionUserCodeService.deletePrescriptionUserCodes"
      );
    }
  }
}
