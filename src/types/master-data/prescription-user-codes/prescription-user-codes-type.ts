import type { PrescriptionUserCodeType } from "./prescription-user-code-type";

export type PrescriptionUserCodesType = {
  items: PrescriptionUserCodeType[];
  nextCursor: number | null;
  hasNextPage: boolean;
  totalCount: number;
};
