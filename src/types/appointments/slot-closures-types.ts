export interface SlotClosureBase {
  appointmentRoomId: number | null;
  closureDate: Date;
  startTime: string;
  endTime: string;
  //TODO : ENUM
  closureType: number;
  reason: string;
}
export interface SlotClosure extends SlotClosureBase {
  id: number;
  createdBy: number;
  createdAt: Date;
}

export interface CreateSlotClosureRequest extends SlotClosureBase { }
export interface CreateSlotClosureResponse {
  id: number;
}
export interface UpdateSlotClosureRequest extends Partial<SlotClosure> { }
export interface UpdateSlotClosureResponse {
  id: number;
}
export interface DeleteSlotClosureRequest { }
