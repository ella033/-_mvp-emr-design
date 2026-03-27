import type {
  DoseConditionType,
  InjectionLinkType,
} from "../prescription-user-codes-upsert-type";
import type { InOut } from "@/constants/master-data-enum";

export interface DrugUserCodeType {
  id: number; // 약가 사용자코드 아이디 (PK)
  prescriptionUserCodeId: number; // 처방 사용자코드 아이디 (FK)
  inOutType: InOut; // 원내외구분
  administrationRoute: string; // 투여경로(내복, 외용, 주사, 기타)
  specializationType: string; // 전문_일반(전문의약품 or 일반의약품)
  manufacturerName: string; // 제약사
  specification: string; // 규격
  unit: string; // 단위
  dose: number; // 투여량(용량)
  decimalPoint: number; // 소수점자리 (1:그대로, 2:올림, 3:반올림, 4:단위처리0.5, 5:단위올림0.5)
  days: number; // 투여일수(일투수)
  times: number; // 일투여횟수(일수)
  usage: string; // 용법: 코드 or 프리 텍스트
  injectionLink: InjectionLinkType[]; // 주사연결코드
  exceptionCode: string; // 예외코드
  doseCondition: DoseConditionType[]; // 연령/체중별 투여량 조건
}
