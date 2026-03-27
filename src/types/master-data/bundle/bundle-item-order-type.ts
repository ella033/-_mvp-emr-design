import type { PrescriptionUserCodeType } from "../prescription-user-codes/prescription-user-code-type";
import type { PrescriptionLibraryType } from "../prescription-libraries/prescription-library-type";
import type { SpecificDetail } from "../../chart/specific-detail-code-type";
import type { SpecimenDetail } from "../../chart/specimen-detail-code-type";
import type { InOut } from "@/constants/master-data-enum";
import { PrescriptionType } from "@/constants/master-data-enum";
import { PaymentMethod } from "@/constants/common/common-enum";

export interface BundleItemOrder {
  id?: number;
  bundleItemId: number;
  userCodeId: number | null;
  prescriptionLibraryId?: number;
  typePrescriptionLibraryId?: number;
  type?: PrescriptionType;
  sortNumber: number;
  userCode?: string;
  claimCode?: string;
  name?: string;
  itemType?: string;
  drugAtcCode?: string;
  dose?: number;
  days?: number;
  times?: number;
  usage?: string;
  specification?: string;
  unit?: string;
  exceptionCode?: string;
  paymentMethod?: PaymentMethod;
  isClaim: boolean;
  isPowder: boolean;
  inOutType: InOut;
  specificDetail: SpecificDetail[];
  specimenDetail: SpecimenDetail[];

  prescriptionUserCode?: PrescriptionUserCodeType | null;
  prescriptionLibrary?: PrescriptionLibraryType;
}
