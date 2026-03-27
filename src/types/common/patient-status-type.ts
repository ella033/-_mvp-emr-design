import { Patient } from "../patient-types";
import {
  환자구분,
  성별,
  보험구분,
  ChronicTypes,
} from "@/constants/common/common-enum";
import { ChronicDisease } from "../chart/chronic-disease";

export interface PatientStatus {
  // 기본 정보
  patient: Patient;
  status: number;
  position: string;
  // 등록 및 미디어 관련
  isNewRegister: string;
  withMediaCall: boolean;

  // Route 관련
  year: number;
  patientClass: 환자구분;
  routeId: number;
  visitNumber: number; // todo - encounterId
  destStat: number; // 대기상태
  userId: string;
  patientName: string; // Patient
  age: string;
  numberOfDaysLived: string;
  jsDate: Date;
  jsTime: string; // TimeSpan을 string으로 변환
  gender: 성별;
  udept: 보험구분;

  waitStatus?: number;

  // Patient 관련
  birthday: Date;
  lastVisit: Date | null;
  startDate?: Date;
  chronicFlags: ChronicDisease;
}
