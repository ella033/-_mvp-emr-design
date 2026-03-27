export type DepartmentPositionType = {
  id: number;
  departmentId: number;
  name: string;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  isActive: boolean;
};

export type DepartmentPositionRequestType = {
  departmentId: number;
  name: string;
}

export type DepartmentPositionUpdateRequestType = {
  name: string;
}