/**
 * Medical V2 기본 레이아웃 및 진료과 템플릿
 */

/** 기본 레이아웃 (현재 v2와 동일한 배치) */
export const DEFAULT_LAYOUT: any = {
  dockbox: {
    mode: "horizontal",
    children: [
      {
        size: 15,
        tabs: [{ id: "calendar-patients" }],
      },
      {
        size: 25,
        tabs: [{ id: "patient-info" }],
      },
      {
        size: 30,
        tabs: [{ id: "diagnosis-prescription" }],
      },
      {
        size: 18,
        tabs: [{ id: "bundle-prescription" }],
      },
      {
        size: 12,
        mode: "vertical",
        children: [
          { tabs: [{ id: "clinical-memo" }, { id: "patient-memo" }] },
          { tabs: [{ id: "symptom" }] },
        ],
      },
    ],
  },
};

/** 진료과별 템플릿 */
export interface LayoutTemplate {
  id: string;
  name: string;
  department: string;
  icon: string;
  description: string;
  layout: any;
  widgetIds: string[];
}

export const DEPARTMENT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "default",
    name: "기본 레이아웃",
    department: "공통",
    icon: "🏥",
    description: "진단/처방 중심, 증상·묶음처방 기본 구성",
    layout: DEFAULT_LAYOUT,
    widgetIds: ["calendar-patients", "patient-info", "diagnosis-prescription", "bundle-prescription", "clinical-memo", "patient-memo", "symptom"],
  },
  {
    id: "ent",
    name: "이비인후과",
    department: "이비인후과",
    icon: "👂",
    description: "진단/처방 중심, 증상·묶음처방 강조",
    layout: {
      dockbox: {
        mode: "horizontal",
        children: [
          { size: 15, tabs: [{ id: "calendar-patients" }] },
          {
            size: 30, mode: "vertical", children: [
              { size: 30, tabs: [{ id: "patient-info" }] },
              { size: 70, tabs: [{ id: "image-viewer" }] },
            ],
          },
          { size: 35, tabs: [{ id: "diagnosis-prescription" }] },
          {
            size: 20, mode: "vertical", children: [
              { tabs: [{ id: "clinical-memo" }, { id: "patient-memo" }] },
              { tabs: [{ id: "symptom" }] },
            ],
          },
        ],
      },
    },
    widgetIds: ["calendar-patients", "patient-info", "image-viewer", "diagnosis-prescription", "clinical-memo", "patient-memo", "symptom"],
  },
  {
    id: "internal",
    name: "내과",
    department: "내과",
    icon: "🩺",
    description: "내원이력·임상메모·AI 요약, 증상·묶음처방",
    layout: {
      dockbox: {
        mode: "horizontal",
        children: [
          { size: 15, tabs: [{ id: "calendar-patients" }] },
          {
            size: 25, mode: "vertical", children: [
              { size: 40, tabs: [{ id: "patient-info" }] },
              { size: 60, tabs: [{ id: "lab-results" }] },
            ],
          },
          { size: 30, tabs: [{ id: "diagnosis-prescription" }] },
          { size: 15, tabs: [{ id: "bundle-prescription" }] },
          {
            size: 15, mode: "vertical", children: [
              { tabs: [{ id: "clinical-memo" }, { id: "patient-memo" }] },
              { tabs: [{ id: "symptom" }] },
            ],
          },
        ],
      },
    },
    widgetIds: ["calendar-patients", "patient-info", "lab-results", "diagnosis-prescription", "bundle-prescription", "clinical-memo", "patient-memo", "symptom"],
  },
  {
    id: "pediatric",
    name: "소아과",
    department: "소아과",
    icon: "👶",
    description: "대기환자 설계, 메모·증상 강조",
    layout: {
      dockbox: {
        mode: "horizontal",
        children: [
          { size: 18, tabs: [{ id: "calendar-patients" }] },
          { size: 22, tabs: [{ id: "patient-info" }] },
          { size: 35, tabs: [{ id: "diagnosis-prescription" }] },
          {
            size: 25, mode: "vertical", children: [
              { tabs: [{ id: "bundle-prescription" }] },
              { tabs: [{ id: "clinical-memo" }, { id: "symptom" }] },
            ],
          },
        ],
      },
    },
    widgetIds: ["calendar-patients", "patient-info", "diagnosis-prescription", "bundle-prescription", "clinical-memo", "symptom"],
  },
  {
    id: "dermatology",
    name: "피부과",
    department: "피부과",
    icon: "🔬",
    description: "이미지 뷰어 중심, 처방·진단 하단",
    layout: {
      dockbox: {
        mode: "horizontal",
        children: [
          { size: 15, tabs: [{ id: "calendar-patients" }] },
          {
            size: 35, mode: "vertical", children: [
              { size: 60, tabs: [{ id: "image-viewer" }] },
              { size: 40, tabs: [{ id: "patient-info" }] },
            ],
          },
          { size: 30, tabs: [{ id: "diagnosis-prescription" }] },
          {
            size: 20, mode: "vertical", children: [
              { tabs: [{ id: "bundle-prescription" }] },
              { tabs: [{ id: "clinical-memo" }, { id: "symptom" }] },
            ],
          },
        ],
      },
    },
    widgetIds: ["calendar-patients", "image-viewer", "patient-info", "diagnosis-prescription", "bundle-prescription", "clinical-memo", "symptom"],
  },
  {
    id: "psychiatry",
    name: "정신건강의학과",
    department: "정신건강의학과",
    icon: "💜",
    description: "진료 메모 AI 채팅 중심, 긴 상담 기록",
    layout: {
      dockbox: {
        mode: "horizontal",
        children: [
          { size: 15, tabs: [{ id: "calendar-patients" }] },
          { size: 20, tabs: [{ id: "patient-info" }] },
          { size: 25, tabs: [{ id: "diagnosis-prescription" }] },
          {
            size: 20, mode: "vertical", children: [
              { tabs: [{ id: "clinical-memo" }] },
              { tabs: [{ id: "patient-memo" }] },
            ],
          },
          {
            size: 20, mode: "vertical", children: [
              { tabs: [{ id: "ai-assistant" }] },
              { tabs: [{ id: "symptom" }] },
            ],
          },
        ],
      },
    },
    widgetIds: ["calendar-patients", "patient-info", "diagnosis-prescription", "clinical-memo", "patient-memo", "ai-assistant", "symptom"],
  },
];
