import { ApiClient } from "@/lib/api/api-client";
import { prescriptionLibrariesApi } from "@/lib/api/api-routes";
import type { PrescriptionLibrariesParamType } from "@/types/master-data/prescription-libraries/prescription-libraries-param-type";
import type { PrescriptionLibrariesType } from "@/types/master-data/prescription-libraries/prescription-libraries-type";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";

export class PrescriptionLibrariesService {
  static async searchPrescriptionLibraries(
    query?: PrescriptionLibrariesParamType
  ): Promise<PrescriptionLibrariesType> {
    try {
      const queryString = query ? this.buildQueryString(query) : "";

      return await ApiClient.get<PrescriptionLibrariesType>(
        prescriptionLibrariesApi.list(queryString)
      );
    } catch (error: any) {
      throw new Error("처방 라이브러리 조회 실패", error.status);
    }
  }

  private static buildQueryString(
    query: PrescriptionLibrariesParamType
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
    if (
      query.administrationRoute !== undefined &&
      query.administrationRoute !== ""
    ) {
      params.append("administrationRoute", query.administrationRoute);
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

    return params.toString();
  }

  static async getPrescriptionLibraryDetail(
    type: number,
    typePrescriptionLibraryId: number
  ): Promise<PrescriptionLibraryType> {
    try {
      return await ApiClient.get<PrescriptionLibraryType>(
        prescriptionLibrariesApi.detail(type, typePrescriptionLibraryId)
      );
    } catch (error: any) {
      throw new Error("처방 라이브러리 상세 조회 실패", error.status);
    }
  }

  static async getPrescriptionLibraryById(
    id: number
  ): Promise<PrescriptionLibraryType> {
    try {
      return await ApiClient.get<PrescriptionLibraryType>(
        prescriptionLibrariesApi.detailById(id)
      );
    } catch (error: any) {
      throw new Error("처방 라이브러리 상세 조회 실패", error.status);
    }
  }
}
