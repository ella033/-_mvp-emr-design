export enum SpecificDetailCodeType {
  Statement = 1, // 명세서단위 특정내역
  Line = 2, // 줄단위 특정내역
}

export interface SpecificDetailCode {
  id: number;
  code: string;
  applyDate: string;
  endDate: string | null;
  type: SpecificDetailCodeType;
  name: string;
  content: string;
  sortNumber: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

export interface SpecificDetail {
  code: string;
  name: string;
  content: string;
  type: SpecificDetailCodeType;
}
