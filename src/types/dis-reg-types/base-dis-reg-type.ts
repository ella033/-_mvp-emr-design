/* BaseDisReg 타입 정의 */
export interface BaseDisReg {
  isData: boolean;
  division: number;
  specificCode: string;
  registeredCode: string;
  registeredDate: Date | null;
  validity: Date | null;
  corporalCode?: string;
  corporalSerialNumber?: string;
}

