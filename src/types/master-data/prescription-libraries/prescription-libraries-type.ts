import type { PrescriptionLibraryType } from "./prescription-library-type";

export type PrescriptionLibrariesType = {
  items: PrescriptionLibraryType[];
  nextCursor: number;
  hasNextPage: boolean;
  totalCount: number;
};
