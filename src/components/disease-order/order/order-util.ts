import { ProhibitedDrug } from "@/types/prohibited-drugs-type";
import { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  flattenTree,
  getCellValueAsString,
  getCellValueAsNumber,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";

/**
 * specificDetail JSON 문자열을 파싱하여 배열로 반환
 * @param value - specificDetail JSON 문자열 또는 null
 * @returns SpecificDetail 배열
 */
export const parseSpecificDetail = (value: string | null | undefined): SpecificDetail[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    // 파싱 결과가 배열인지 확인
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * row에서 specificDetail을 가져와 파싱하여 배열로 반환
 * @param row - MyTreeGridRowType
 * @returns SpecificDetail 배열
 */
export const getSpecificDetailFromRow = (row: MyTreeGridRowType): SpecificDetail[] => {
  const value = getCellValueAsString(row, "specificDetail");
  return parseSpecificDetail(value);
};

/**
 * specificDetail 배열에 특정 코드가 존재하는지 확인
 * @param specificDetails - SpecificDetail 배열
 * @param code - 확인할 코드
 * @returns 존재 여부
 */
export const hasSpecificDetailCode = (specificDetails: SpecificDetail[], code: string): boolean => {
  return specificDetails.some((item) => item.code === code);
};

/**
 * row에서 specificDetail을 가져와 특정 코드가 존재하는지 확인
 * @param row - MyTreeGridRowType
 * @param code - 확인할 코드
 * @returns 존재 여부
 */
export const hasSpecificDetailCodeFromRow = (row: MyTreeGridRowType, code: string): boolean => {
  const specificDetails = getSpecificDetailFromRow(row);
  return hasSpecificDetailCode(specificDetails, code);
};

/**
 * 특정내역 배열에서 content가 비어있는 항목 정보 반환.
 * 아이콘(SpecificDetailEmptyIcon) 표시 및 툴팁 메시지에 사용.
 */
export function getSpecificDetailEmptyContentInfo(details: SpecificDetail[]): {
  itemsWithEmptyContent: SpecificDetail[];
  hasEmptyContent: boolean;
  emptyContentTooltipMessage: string;
} {
  const itemsWithEmptyContent = details.filter((item) => !item.content?.trim());
  const hasEmptyContent = itemsWithEmptyContent.length > 0;
  const emptyCodes = itemsWithEmptyContent.map((item) => item.code).filter(Boolean);
  let emptyContentTooltipMessage = "";
  if (hasEmptyContent) {
    if (emptyCodes.length === 0)
      emptyContentTooltipMessage = "특정내역 내용이 비어있는 항목이 있습니다.";
    else if (emptyCodes.length === 1)
      emptyContentTooltipMessage = `코드 ${emptyCodes[0]}의 특정내역이 비어있습니다.`;
    else
      emptyContentTooltipMessage = `다음 코드의 특정내역이 비어있습니다: ${emptyCodes.join(", ")}`;
  }
  return { itemsWithEmptyContent, hasEmptyContent, emptyContentTooltipMessage };
}

export enum CheckProhibitedDrugStatus {
  BAN = 0,
  PASS = 1,
  USER_CONFIRM = 2,
}

export const checkAllowProhibitedDrug = (
  prescriptionLibraryId: number,
  activeIngredientCode: string,
  prohibitedDrugs: ProhibitedDrug[]
) => {
  try {
    const existingProhibitedDrug = prohibitedDrugs.find(
      (prohibitedDrug) => prohibitedDrug.prescriptionLibraryId === prescriptionLibraryId
    );
    if (existingProhibitedDrug) {
      return existingProhibitedDrug.isPrescriptionAllowed
        ? CheckProhibitedDrugStatus.USER_CONFIRM
        : CheckProhibitedDrugStatus.BAN;
    }

    const sameIngredientProhibitedDrugs = prohibitedDrugs.filter(
      (prohibitedDrug) => prohibitedDrug.isSameIngredientProhibited
    );

    if (sameIngredientProhibitedDrugs && sameIngredientProhibitedDrugs.length > 0) {
      const sameIngredientProhibitedDrug = sameIngredientProhibitedDrugs.find(
        (prohibitedDrug) =>
          prohibitedDrug.atcCode?.slice(0, 4) === activeIngredientCode?.slice(0, 4)
      );
      if (sameIngredientProhibitedDrug) {
        return sameIngredientProhibitedDrug.isPrescriptionAllowed
          ? CheckProhibitedDrugStatus.USER_CONFIRM
          : CheckProhibitedDrugStatus.BAN;
      }
    }

    return CheckProhibitedDrugStatus.PASS;
  } catch (err: any) {
    console.error("처방금지된 약품 체크 실패:", err);
    return CheckProhibitedDrugStatus.PASS;
  }
};

const normalizeId = (v: string | undefined): string =>
  v && v !== "null" && v !== "" ? String(v) : "";

/**
 * 현재 등록된 data와 새로 추가하려는 newRows를 비교하여 중복 행과 신규 행으로 분리한다.
 * 새 row에 userCodeId가 있으면 userCodeId로만 중복 점검하고, 없을 경우에만 prescriptionLibraryId로 점검한다.
 * @param data - 현재 등록된 row들
 * @param newRows - 새로 등록하려는 row들
 */
export const getDuplicatedAndUniqueRows = (
  data: MyTreeGridRowType[],
  newRows: MyTreeGridRowType[],
  checkDuplicate: boolean = true
): {
  duplicatedRows: MyTreeGridRowType[];
  /** 팝업 표시용: 묶음 헤더 제외, 중복인 처방(리프)만 목록. 묶음 내 중복 시 자식만 포함 */
  duplicatedDisplayRows: MyTreeGridRowType[];
  uniqueRows: MyTreeGridRowType[];
  untrackedRows: MyTreeGridRowType[];
} => {
  // 규칙상 parentRowKey가 있는 row(자식)는 개별 결과에 포함하지 않는다.
  const rootRows = newRows.filter((row) => row.parentRowKey == null);

  if (!checkDuplicate || !data.length) {
    return {
      duplicatedRows: [],
      duplicatedDisplayRows: [],
      uniqueRows: rootRows,
      untrackedRows: [],
    };
  }
  console.log("[TEST] getDuplicatedAndUniqueRows data:", data, "rootRows:", rootRows);
  const existingLibIds = new Set<string>();
  const existingUserCodeIds = new Set<string>();
  flattenTree(data, true).forEach((row) => {
    const typePrescriptionLibraryId = getCellValueAsNumber(row, "typePrescriptionLibraryId") ?? 0;
    const libId = normalizeId(getCellValueAsString(row, "prescriptionLibraryId"));
    const userCodeId = normalizeId(getCellValueAsString(row, "userCodeId"));
    // typePrescriptionLibraryId가 0이면 libId로 중복 집계하지 않음 (userCodeId만 사용)
    if (typePrescriptionLibraryId !== 0 && libId) existingLibIds.add(libId);
    if (userCodeId) existingUserCodeIds.add(userCodeId);
  });

  if (existingLibIds.size === 0 && existingUserCodeIds.size === 0) {
    return {
      duplicatedRows: [],
      duplicatedDisplayRows: [],
      uniqueRows: rootRows,
      untrackedRows: [],
    };
  }

  const duplicatedRows: MyTreeGridRowType[] = [];
  const duplicatedDisplayRows: MyTreeGridRowType[] = [];
  const uniqueRows: MyTreeGridRowType[] = [];
  const untrackedRows: MyTreeGridRowType[] = [];

  const hasDuplicateInSubtree = (row: MyTreeGridRowType): boolean => {
    // 묶음(row.children 존재)은 자식 기준으로만 중복 판정
    if (row.children?.length) {
      return row.children.some((child) => hasDuplicateInSubtree(child));
    }
    // 단일 row(leaf): userCodeId가 있으면 userCodeId로만 중복 점검, 없을 경우에만 prescriptionLibraryId로 점검
    const typePrescriptionLibraryId = getCellValueAsNumber(row, "typePrescriptionLibraryId") ?? 0;
    const libId = normalizeId(getCellValueAsString(row, "prescriptionLibraryId"));
    const userCodeId = normalizeId(getCellValueAsString(row, "userCodeId"));
    if (!libId && !userCodeId) untrackedRows.push(row);
    if (userCodeId) {
      return existingUserCodeIds.has(userCodeId);
    }
    const useLibForDup = typePrescriptionLibraryId !== 0;
    return useLibForDup && !!(libId && existingLibIds.has(libId));
  };

  const collectDuplicateLeaves = (root: MyTreeGridRowType): void => {
    if (root.children?.length) {
      root.children.forEach((child) => {
        if (hasDuplicateInSubtree(child)) duplicatedDisplayRows.push(child);
      });
    } else {
      duplicatedDisplayRows.push(root);
    }
  };

  // 묶음 row는 기본 unique.
  // 단, children 중 하나라도 중복이면 해당 부모(묶음) row를 duplicated로 분류.
  // duplicatedDisplayRows에는 묶음 헤더는 넣지 않고, 중복인 처방(리프)만 넣는다.
  rootRows.forEach((root) => {
    if (hasDuplicateInSubtree(root)) {
      duplicatedRows.push(root);
      collectDuplicateLeaves(root);
    } else {
      uniqueRows.push(root);
    }
  });

  console.log();

  return { duplicatedRows, duplicatedDisplayRows, uniqueRows, untrackedRows };
};
