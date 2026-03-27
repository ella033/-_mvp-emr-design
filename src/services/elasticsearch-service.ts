import { ApiClient } from "@/lib/api/api-client";
import { elasticsearchApi } from "@/lib/api/api-routes";
import type { Patient } from "@/types/patient-types";
import type {
  ElasticsearchPrescriptionSearchAllResponse,
  ElasticsearchPrescriptionSearchItem,
} from "@/types/elasticsearch/prescription-search-types";

interface ElasticsearchSearchPayload {
  indexUid: string;
  query: string;
  limit?: number;
  filter?: string[];
  attributesToHighlight?: string[];
  highlightPreTag?: string;
  highlightPostTag?: string;
}

interface ElasticsearchSearchResponse<T> {
  hits: T[];
  limit: number;
  offset?: number;
  estimatedTotalHits?: number;
  processingTimeMs?: number;
  query: string;
}

export class ElasticsearchService {
  private static patientIndex = "patients";

  private static async search<T>(
    payload: ElasticsearchSearchPayload
  ): Promise<T[]> {
    try {
      const response = await ApiClient.post<ElasticsearchSearchResponse<T>>(
        elasticsearchApi.search(),
        payload
      );

      return response?.hits ?? [];
    } catch (error) {
      console.error("Elasticsearch proxy 검색 실패:", error);
      throw new Error("검색 요청 중 오류가 발생했습니다.");
    }
  }

  private static buildSearchAllResponse(
    items: ElasticsearchPrescriptionSearchItem[],
    totalCount?: Partial<ElasticsearchPrescriptionSearchAllResponse["totalCount"]>
  ): ElasticsearchPrescriptionSearchAllResponse {
    const counts = items.reduce(
      (acc, item) => {
        acc.all += 1;
        if (item.category) {
          acc[item.category] = (acc[item.category] ?? 0) + 1;
        }
        return acc;
      },
      {
        all: 0,
        disease: 0,
        bundle: 0,
        userCode: 0,
        medicalLibrary: 0,
        drugLibrary: 0,
        materialLibrary: 0,
      } as ElasticsearchPrescriptionSearchAllResponse["totalCount"]
    );

    return {
      items,
      totalCount: {
        ...counts,
        ...totalCount,
        all: totalCount?.all ?? counts.all,
      },
      nextCursor: {
        disease: -1,
        bundle: -1,
        userCode: -1,
        medicalLibrary: -1,
        drugLibrary: -1,
        materialLibrary: -1,
      },
      hasNextPage: false,
    };
  }

  private static normalizePrescriptionLibraryHit(
    hit: any
  ): ElasticsearchPrescriptionSearchItem | null {
    const rawCategory =
      hit?.category ||
      hit?.category_name ||
      hit?.categoryName ||
      hit?.categoryType ||
      "";
    const normalizedCategory =
      typeof rawCategory === "string" ? rawCategory.trim() : "";
    const lowerCategory = normalizedCategory.toLowerCase();
    const isKnownCategory = (value: string) =>
      [
        "disease",
        "bundle",
        "usercode",
        "user_code",
        "medicallibrary",
        "medical_library",
        "druglibrary",
        "drug_library",
        "materiallibrary",
        "material_library",
      ].includes(value);

    let category = "";
    if (normalizedCategory && isKnownCategory(lowerCategory)) {
      switch (lowerCategory) {
        case "disease":
          category = "disease";
          break;
        case "bundle":
          category = "bundle";
          break;
        case "usercode":
        case "user_code":
          category = "userCode";
          break;
        case "medicallibrary":
        case "medical_library":
          category = "medicalLibrary";
          break;
        case "druglibrary":
        case "drug_library":
          category = "drugLibrary";
          break;
        case "materiallibrary":
        case "material_library":
          category = "materialLibrary";
          break;
      }
    } else {
      switch (hit?.type?.toString()) {
        case "1":
          category = "medicalLibrary";
          break;
        case "2":
          category = "drugLibrary";
          break;
        case "3":
          category = "materialLibrary";
          break;
        default:
          category = "medicalLibrary";
      }
    }

    const fallbackItemTypeByCategory: Record<string, string> = {
      medicalLibrary: "0101",
      drugLibrary: "0301",
      materialLibrary: "0803",
    };

    if (category === "disease") {
      const toNumberOrNull = (value: any) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const diseaseId =
        hit?.disease_id ||
        hit?.diseaseId ||
        hit?.id ||
        hit?.type_prescription_library_id ||
        0;

      const normalizeDiseaseDetail = (detail: any) => ({
        diseaseId: detail?.disease_id || detail?.diseaseId || diseaseId,
        applyDate: detail?.apply_date || detail?.applyDate || "",
        code: detail?.code || detail?.disease_code || hit?.code || "",
        isComplete:
          detail?.is_complete ??
          detail?.isComplete ??
          hit?.is_complete ??
          hit?.isComplete ??
          false,
        isPossibleMainDisease:
          detail?.is_possible_main_disease ??
          detail?.isPossibleMainDisease ??
          hit?.is_possible_main_disease ??
          hit?.isPossibleMainDisease ??
          true,
        legalInfectiousCategory:
          detail?.legal_infectious_category ||
          detail?.legalInfectiousCategory ||
          hit?.legal_infectious_category ||
          hit?.legalInfectiousCategory ||
          "",
        gender:
          typeof detail?.gender === "number"
            ? detail.gender
            : typeof hit?.gender === "number"
              ? hit.gender
              : Number(detail?.gender ?? hit?.gender ?? 0) || 0,
        maxAge: toNumberOrNull(
          detail?.max_age ?? detail?.maxAge ?? hit?.max_age ?? hit?.maxAge
        ),
        minAge: toNumberOrNull(
          detail?.min_age ?? detail?.minAge ?? hit?.min_age ?? hit?.minAge
        ),
      });

      const diseaseDetails =
        Array.isArray(hit?.details) && hit.details.length > 0
          ? hit.details.map(normalizeDiseaseDetail)
          : [normalizeDiseaseDetail(null)];

      return {
        category: "disease",
        id: diseaseId,
        original_id:
        hit?.original_id,
        name: hit?.name || hit?.korean_name || "",
        nameEn: hit?.name_en || hit?.nameEn || "",
        details: diseaseDetails,
      } as any;
    }

    const medicalLibrarySource = hit?.medicalLibrary || hit?.medical_library || {};
    const drugLibrarySource = hit?.drugLibrary || hit?.drug_library || {};
    const materialLibrarySource = hit?.materialLibrary || hit?.material_library || {};

    let medicalLibrary = undefined;
    let drugLibrary = undefined;
    let materialLibrary = undefined;

    if (category === "medicalLibrary") {
      medicalLibrary = {
        koreanName:
          medicalLibrarySource.koreanName ||
          medicalLibrarySource.korean_name ||
          hit?.name ||
          hit?.korean_name ||
          "",
        classificationNo:
          medicalLibrarySource.classificationNo ||
          medicalLibrarySource.classification_no ||
          hit?.classification_no ||
          hit?.classificationNo ||
          "",
        assessmentName:
          medicalLibrarySource.assessmentName ||
          medicalLibrarySource.assessment_name ||
          "",
        nameEn:
          medicalLibrarySource.nameEn ||
          medicalLibrarySource.name_en ||
          hit?.name_en ||
          hit?.nameEn ||
          "",
        examCategory:
          medicalLibrarySource.examCategory ||
          medicalLibrarySource.exam_category ||
          hit?.exam_category ||
          hit?.examCategory,
        examDetailCategory:
          medicalLibrarySource.examDetailCategory ||
          medicalLibrarySource.exam_detail_category ||
          hit?.exam_detail_category ||
          hit?.examDetailCategory,
        radiationCategory:
          medicalLibrarySource.radiationCategory ||
          medicalLibrarySource.radiation_category ||
          hit?.radiation_category ||
          hit?.radiationCategory ||
          null,
        surgeryType:
          medicalLibrarySource.surgeryType ||
          medicalLibrarySource.surgery_type ||
          hit?.surgery_type ||
          hit?.surgeryType ||
          "",
        organCategory:
          medicalLibrarySource.organCategory ||
          medicalLibrarySource.organ_category ||
          hit?.organ_category ||
          hit?.organCategory ||
          "",
        sectionCategory:
          medicalLibrarySource.sectionCategory ||
          medicalLibrarySource.section_category ||
          hit?.section_category ||
          hit?.sectionCategory ||
          "",
        subCategory:
          medicalLibrarySource.subCategory ||
          medicalLibrarySource.sub_category ||
          hit?.sub_category ||
          hit?.subCategory ||
          "",
      };
    } else if (category === "drugLibrary") {
      drugLibrary = {
        productName:
          drugLibrarySource.productName ||
          drugLibrarySource.product_name ||
          hit?.name ||
          hit?.product_name ||
          "",
        classificationNo:
          drugLibrarySource.classificationNo ||
          drugLibrarySource.classification_no ||
          hit?.classification_no ||
          hit?.classificationNo ||
          "",
        administrationRoute:
          drugLibrarySource.administrationRoute ||
          drugLibrarySource.administration_route ||
          hit?.administration_route ||
          hit?.administrationRoute,
        manufacturerName:
          drugLibrarySource.manufacturerName ||
          drugLibrarySource.manufacturer_name ||
          hit?.manufacturer_name ||
          hit?.manufacturerName,
        specification: drugLibrarySource.specification || hit?.specification,
        unit: drugLibrarySource.unit || hit?.unit,
        specializationType:
          drugLibrarySource.specializationType ||
          drugLibrarySource.specialization_type ||
          hit?.specialization_type ||
          hit?.specializationType,
        drugEquivalence:
          drugLibrarySource.drugEquivalence ||
          drugLibrarySource.drug_equivalence ||
          hit?.drug_equivalence ||
          hit?.drugEquivalence,
        substituteType:
          drugLibrarySource.substituteType ||
          drugLibrarySource.substitute_type ||
          hit?.substitute_type ||
          hit?.substituteType,
        sameDrugCode:
          drugLibrarySource.sameDrugCode ||
          drugLibrarySource.same_drug_code ||
          hit?.same_drug_code ||
          hit?.sameDrugCode,
        claimSpecification:
          drugLibrarySource.claimSpecification ||
          drugLibrarySource.claim_specification ||
          hit?.claim_specification ||
          hit?.claimSpecification,
      };
    } else if (category === "materialLibrary") {
      materialLibrary = {
        productName:
          materialLibrarySource.productName ||
          materialLibrarySource.product_name ||
          hit?.name ||
          hit?.product_name ||
          "",
      };
    }

    const codeValue =
      hit?.code ||
      hit?.claim_code ||
      hit?.claimCode ||
      hit?.library_code ||
      "";
    const priceValue =
      typeof hit?.price === "number" ? hit.price : Number(hit?.price ?? 0) || 0;
    const activeIngredientCodeValue =
      hit?.active_ingredient_code || hit?.activeIngredientCode || "";

    const defaultDetail = {
      claimCode: hit?.claim_code || hit?.claimCode || "",
      price: priceValue,
      activeIngredientCode: activeIngredientCodeValue,
    };

    const resolvedItemType =
      hit?.item_type ||
      hit?.itemType ||
      hit?.original_data?.itemType ||
      hit?.original_data?.item_type ||
      fallbackItemTypeByCategory[category] ||
      "";

    return {
      ...hit,
      category,
      code: codeValue,
      name: hit?.name || hit?.korean_name || hit?.product_name || "",
      nameEn: hit?.name_en || hit?.nameEn || "",
      type: hit?.type,
      typePrescriptionLibraryId:
        hit?.type_prescription_library_id || hit?.typePrescriptionLibraryId,
      itemType: resolvedItemType,
      codeType: hit?.code_type || hit?.codeType,
      receiptPrintLocation:
        hit?.receipt_print_location || hit?.receiptPrintLocation,
      medicalLibrary,
      drugLibrary,
      materialLibrary,
      details:
        Array.isArray(hit?.details) && hit.details.length > 0
          ? hit.details
          : [defaultDetail],
    };
  }

  static async searchPatients(
    query: string,
    limit: number = 20
  ): Promise<Patient[]> {
    return await this.search<Patient>({
      indexUid: this.patientIndex,
      query,
      limit,
      attributesToHighlight: ["name", "patientId"],
      highlightPreTag: "<em>",
      highlightPostTag: "</em>",
    });
  }

  // 처방 라이브러리 검색 (단일 search — relevancy 정렬)
  static async searchPrescriptionLibraries(
    query: string,
    limit: number = 50,
    categories?: string[]
  ): Promise<ElasticsearchPrescriptionSearchAllResponse> {
    try {
      const response = await ApiClient.post<
        | ElasticsearchPrescriptionSearchAllResponse
        | ElasticsearchSearchResponse<any>
      >(elasticsearchApi.search(), {
        indexUid: "diagnosis_prescriptions",
        query,
        limit,
        categories,
        attributesToHighlight: ["name"],
        highlightPreTag: "<em>",
        highlightPostTag: "</em>",
      });

      if (response && "items" in response) {
        const normalizedItems = (response.items ?? [])
          .map((item: any) => this.normalizePrescriptionLibraryHit(item))
          .filter(
            (item): item is ElasticsearchPrescriptionSearchItem =>
              item !== null
          );
        return this.buildSearchAllResponse(
          normalizedItems,
          response.totalCount
        );
      }

      const hits =
        (response as ElasticsearchSearchResponse<any>)?.hits ?? [];

      const convertedHits = hits
        .map((hit: any) => this.normalizePrescriptionLibraryHit(hit))
        .filter(
          (hit): hit is ElasticsearchPrescriptionSearchItem => hit !== null
        );

      const totalCount =
        (response as ElasticsearchSearchResponse<any>)
          ?.estimatedTotalHits ?? convertedHits.length;
      return this.buildSearchAllResponse(convertedHits, { all: totalCount });
    } catch (error) {
      console.error("Elasticsearch 처방 라이브러리 검색 실패:", error);
      throw new Error("처방 라이브러리 검색 중 오류가 발생했습니다.");
    }
  }

  // 이하 인덱싱/수정/삭제 메서드는 백엔드 관리용 API가 제공된 후 그쪽을 호출하도록 재구성 예정
}
