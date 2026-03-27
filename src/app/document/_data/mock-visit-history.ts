import type { VisitHistoryItem } from '../_types/visit-history-types';

export const mockVisitHistory: VisitHistoryItem[] = [
  {
    id: '1',
    visitDate: '2025-07-31',
    patientName: '홍길동',
    summary: '내원일에 대한 주 진료 정보 한 줄 요약 정보란 입니다(내용 초과...)',
    symptoms: '피로감, 어지럼증, 갈증, 당뇨 체중 변화 없음, 시야 흐림 없음, 손발 저림 없음',
    diagnoses: [
      {
        code: 'I10',
        name: '고혈압',
        note: '이전보다 나은 검사 결과로 고혈압 약을 줄임',
      },
    ],
    prescriptions: [
      {
        code: 'C09AA05',
        name: '라미프릴 (Ramipril) 5mg',
        dosage: '1/1/1',
      },
      {
        code: 'C09AA05',
        name: '라미프릴 (Ramipril) 5mg',
        dosage: '3/1/1',
      },
      {
        code: 'A10BH01',
        name: '시타글립틴 (Sitagliptin) 100mg',
        dosage: '3/1/1',
      },
      {
        code: 'N02BE01',
        name: '아세트아미노펜 (Acetaminophen) 500mg',
        dosage: '3/1/1',
      },
      {
        code: 'M01AE01',
        name: '이부프로펜 (Ibuprofen) 400mg',
        dosage: '3/1/1',
      },
      {
        code: 'R03DC03',
        name: '몬테루카스트 (Montelukast) 10mg',
        dosage: '1/1/1',
      },
      {
        code: 'J01CR02',
        name: '아목시실린/클라불란산 (Amoxicillin/clavulanic acid)',
        dosage: '1/1/1',
      },
    ],
    totalAmount: 12600,
  },
  {
    id: '2',
    visitDate: '2025-05-20',
    patientName: '홍길동',
    summary: '내원일에 대한 주 진료 한 줄 요약 정보란이 표시되는 영역',
  },
  {
    id: '3',
    visitDate: '2025-05-20',
    patientName: '김철수',
    summary: '진료 결과 및 처방 내용 요약을 제공합니다.',
  },
  {
    id: '4',
    visitDate: '2025-05-20',
    patientName: '이영희',
    summary: '환자 상태에 대한 관찰 및 조치사항을 기록합니다.',
  },
  {
    id: '5',
    visitDate: '2025-05-20',
    patientName: '박민수',
    summary: '추가 검사 및 진단에 대한 정보를 포함합니다.',
  },
  {
    id: '6',
    visitDate: '2025-05-20',
    patientName: '최지우',
    summary: '재진 예약 및 후속 조치에 대한 기록을 남깁니다.',
  },
  {
    id: '7',
    visitDate: '2025-05-20',
    patientName: '정우성',
    summary: '진료 중 발견된 문제에 대한 상세한 설명을 추가합니다.',
  },
  {
    id: '8',
    visitDate: '2025-05-31',
    patientName: '한가인',
    summary: '환자의 치료 경과 및 피드백을 정리합니다.',
  },
];

