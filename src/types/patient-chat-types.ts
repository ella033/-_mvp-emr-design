export interface PatientChatMessage {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  isPinned: boolean;
  createDateTime: string;
  updateDateTime: string | null;
}

export interface PatientChatListResponse {
  items: PatientChatMessage[];
  nextCursor?: number | null;
  hasNextPage?: boolean;
  totalCount?: number;
}
