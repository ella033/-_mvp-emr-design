export interface BundleItemDisease {
  id?: number;
  bundleItemId: number;
  diseaseId: number;
  sortNumber: number;
  code: string;
  name: string;
  isExcluded: boolean;
  isSuspected: boolean;
  isLeftSide: boolean;
  isRightSide: boolean;
  isSurgery: boolean;
  department: number;
  specificSymbol: string;
  externalCauseCode: string;
}
