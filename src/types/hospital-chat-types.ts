export interface HospitalChatRoomMember {
  userId: number;
  name: string;
  type: number;
  profileFileinfo: any;
}

export interface HospitalChatMessage {
  id: number;
  chatRoomId: number;
  authorId: number;
  authorName: string;
  content: string;
  mentions: PatientMention[] | null;
  isPinned: boolean;
  createDateTime: string;
  updateDateTime: string | null;
  deleteDateTime: string | null;
}

export interface PatientMention {
  patientId: number;
  patientName: string;
}

export interface HospitalChatRoom {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  createdById: number;
  members: HospitalChatRoomMember[];
  lastMessage: {
    id: number;
    authorName: string;
    content: string;
    createDateTime: string;
  } | null;
  unreadCount: number;
  createDateTime: string;
}

export interface HospitalChatMessageListResponse {
  items: HospitalChatMessage[];
  nextCursor?: number | null;
  hasNextPage?: boolean;
}

export interface MentionPatientResult {
  patientId: number;
  patientName: string;
  patientNo: number | null;
}
