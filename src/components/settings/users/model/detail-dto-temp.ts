export interface GetHospitalUserDetailResponseDto {
  id: number;
  name: string;
  nameEn?: string;
  email: string;
  mobile?: string;
  zipcode?: string; // typo in UI prop 'zipcoode' -> 'zipcode' in DTO usually
  address1?: string;
  address2?: string;
  departmentId?: number;
  departmentName?: string;
  positionId?: number;
  positionName?: string;
  roleName?: string;
  licenseNo?: string;
  birthDate?: string;
  hireDate?: string;
  specialty?: string; // Added specialty
  profileFileinfo?: {
    filename: string;
  };
  status: number;
  createDateTime: string;
  // Add invitation-like fields if needed or handle separately
}
