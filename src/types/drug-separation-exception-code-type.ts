export interface DrugSeparationExceptionCode {
  code: string;
  title: string;
  content: string;
}

export enum DrugSeparationExceptionCodeType {
  Region = 1,
  Patient = 2,
  Drug = 3,
}
