"use client";

import React, { useState } from "react";
import CardMoreMenu from "./layout/card-more-menu";
import CardHeader from "./layout/card-header";
import CardModule from "./layout/card-module";
import {
  Search,
  MoreVertical,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Star,
  FolderOpen,
  Folder,
  X,
  Copy,
} from "lucide-react";

/* ──────────────────────────────────────────────
 * 묶음 상세 타입
 * ────────────────────────────────────────────── */
interface BundleItem { name: string; qty?: string; daily?: string; days?: string; highlight?: boolean }
interface BundleDetail {
  title: string; code: string; price: string;
  symptom?: string;
  diagnoses?: BundleItem[];
  prescriptions?: BundleItem[];
  note?: string;
}

/* ──────────────────────────────────────────────
 * 카테고리 트리 데이터
 * ────────────────────────────────────────────── */
const BUNDLE_CATEGORIES = [
  { id: "fav", name: "즐겨찾기 (3)", icon: "star", items: ["감기세트A", "고혈압 정기", "당뇨 3개월 검사"] },
  {
    id: "general", name: "일반 (14)", icon: "folder",
    items: ["감기세트A", "감기세트B(소아)", "급성위염", "급성장염", "요로감염", "인후염", "부비동염", "알레르기비염", "결막염", "편도염", "Influenza", "Burning mouth", "구내염", "대상포진"],
  },
  {
    id: "chronic", name: "만성질환 (8)", icon: "folder",
    items: ["고혈압 정기", "당뇨 정기", "고지혈증 리필", "고혈압+당뇨세트", "갑상선 관리", "통풍 관리", "골다공증", "갱년기 처방"],
  },
  {
    id: "inject", name: "주사 (8)", icon: "folder",
    items: ["비타민D 주사", "마늘주사", "감초주사", "태반주사(라에넥)", "신데렐라주사", "영양수액", "통증주사(트리암)", "철분주사"],
  },
  {
    id: "vaccine", name: "예방접종 (6)", icon: "folder",
    items: ["인플루엔자 3가", "인플루엔자 4가", "폐렴구균 23가", "대상포진 백신", "A형간염", "B형간염"],
  },
  {
    id: "test", name: "검사 (12)", icon: "folder",
    children: [
      { id: "test-blood", name: "혈액검사 (6)", items: ["CBC 5종", "LFT 7종", "당뇨 3개월 검사", "갑상선 기능", "콜레스테롤", "전해질"] },
      { id: "test-urine", name: "소변검사 (2)", items: ["요 일반검사 10종", "요 정밀검사"] },
      { id: "test-imaging", name: "영상검사 (4)", items: ["흉부X-RAY", "복부초음파", "경동맥초음파", "심전도 ECG"] },
    ],
  },
  {
    id: "func", name: "기능의학 (4)", icon: "folder",
    children: [
      { id: "func-basic", name: "기본검진(15종)", items: [] },
      { id: "func-brain", name: "뇌기능-5만원", items: [] },
      { id: "func-neuro", name: "뇌신경계", items: [] },
      { id: "func-iv", name: "IVFORM3-1234", items: [] },
    ],
  },
  { id: "drug", name: "약품 묶음 (6)", icon: "folder", items: ["소화불량 처방", "근골격계 통증 처방", "비뇨기계 처방", "호흡기계 통증 처방", "피부질환 처방", "수면장애 처방"] },
  { id: "radiation", name: "방사선 묶음 (4)", icon: "folder", items: ["단순촬영세트", "CT 기본", "MRI 기본", "골밀도 DEXA"] },
  { id: "meal", name: "식대 묶음 (3)", icon: "folder", items: ["일반식", "당뇨식", "저염식"] },
  { id: "material", name: "치료재료 (3)", icon: "folder", items: ["상처소독세트", "봉합세트", "석고고정"] },
];

/* ──────────────────────────────────────────────
 * 묶음 상세 데이터 (항목별)
 * ────────────────────────────────────────────── */
const BUNDLE_DETAILS: Record<string, BundleDetail> = {
  "감기세트A": {
    title: "감기세트A", code: "COLD-A01", price: "12,600",
    symptom: "3일 전부터 목이 아프고 기침이 심함, 열감이 있음, 콧물 가래 동반",
    diagnoses: [{ name: "급성 상기도감염 (J06.9)" }, { name: "급성 비인두염 (J00)" }],
    prescriptions: [
      { name: "아목시실린캡슐 500mg", qty: "1", daily: "3", days: "5" },
      { name: "타이레놀정 500mg", qty: "1", daily: "3", days: "5" },
      { name: "코대원포르테시럽", qty: "10ml", daily: "3", days: "5" },
      { name: "슈다페드정 60mg", qty: "1", daily: "3", days: "5" },
      { name: "클로르페니라민정 4mg", qty: "1", daily: "2", days: "5" },
    ],
  },
  "감기세트B(소아)": {
    title: "감기세트B(소아)", code: "COLD-B01", price: "8,200",
    symptom: "콧물, 기침, 미열 2일째",
    diagnoses: [{ name: "급성 비인두염 (J00)" }],
    prescriptions: [
      { name: "세티리진시럽", qty: "2.5ml", daily: "1", days: "5" },
      { name: "부루펜시럽", qty: "5ml", daily: "3", days: "3" },
      { name: "뮤코펙트시럽", qty: "5ml", daily: "3", days: "5" },
    ],
  },
  "급성위염": {
    title: "급성위염", code: "GI-A01", price: "15,400",
    symptom: "상복부 통증, 오심, 구토, 식욕부진",
    diagnoses: [{ name: "급성 위염 (K29.1)" }],
    prescriptions: [
      { name: "판토프라졸정 40mg", qty: "1", daily: "1", days: "7" },
      { name: "모사프리드정 5mg", qty: "1", daily: "3", days: "7" },
      { name: "알마겔현탁액", qty: "15ml", daily: "3", days: "7" },
      { name: "돔페리돈정 10mg", qty: "1", daily: "3", days: "5" },
    ],
  },
  "급성장염": {
    title: "급성장염", code: "GI-B01", price: "11,200",
    symptom: "수양성 설사 하루 5회 이상, 복통, 오심",
    diagnoses: [{ name: "감염성 위장염 (A09)" }],
    prescriptions: [
      { name: "정장생균제(비오플250)", qty: "1", daily: "3", days: "5" },
      { name: "로페라미드캡슐 2mg", qty: "1", daily: "2", days: "3" },
      { name: "부스코판정 10mg", qty: "1", daily: "3", days: "3" },
    ],
    note: "탈수 심하면 수액 병행",
  },
  "요로감염": {
    title: "요로감염", code: "URI-A01", price: "18,500",
    symptom: "배뇨통, 빈뇨, 하복부 불쾌감",
    diagnoses: [{ name: "요로감염 (N39.0)" }],
    prescriptions: [
      { name: "시프로플록사신정 500mg", qty: "1", daily: "2", days: "7" },
      { name: "페나조피리딘정 200mg", qty: "1", daily: "3", days: "3" },
      { name: "소변검사(UA)", qty: "1", daily: "1", days: "1" },
      { name: "소변배양(Urine C/S)", qty: "1", daily: "1", days: "1" },
    ],
  },
  "인후염": {
    title: "인후염", code: "ENT-A01", price: "9,800",
    symptom: "인후통, 연하곤란, 발열 38.5도",
    diagnoses: [{ name: "급성 인두염 (J02.9)" }],
    prescriptions: [
      { name: "아목시실린/클라불라네이트 625mg", qty: "1", daily: "2", days: "7" },
      { name: "이부프로펜정 400mg", qty: "1", daily: "3", days: "5" },
      { name: "트라넥삼산정 250mg", qty: "1", daily: "3", days: "5" },
    ],
  },
  "대상포진": {
    title: "대상포진", code: "DERM-Z01", price: "45,600",
    symptom: "우측 흉부 수포성 발진, 극심한 통증, 3일 전 발생",
    diagnoses: [{ name: "대상포진 (B02.9)" }],
    prescriptions: [
      { name: "발라시클로비르정 500mg", qty: "2", daily: "3", days: "7" },
      { name: "프레가발린캡슐 75mg", qty: "1", daily: "2", days: "14" },
      { name: "트라마돌/아세트아미노펜정", qty: "1", daily: "3", days: "7" },
      { name: "가바펜틴캡슐 300mg", qty: "1", daily: "3", days: "14" },
    ],
    note: "72시간 이내 항바이러스제 시작 권장",
  },
  "고혈압 정기": {
    title: "고혈압 정기처방", code: "HTN-M01", price: "8,400",
    diagnoses: [{ name: "본태성 고혈압 (I10)" }],
    prescriptions: [
      { name: "암로디핀정 5mg", qty: "1", daily: "1", days: "30" },
      { name: "로살탄정 50mg", qty: "1", daily: "1", days: "30" },
    ],
  },
  "당뇨 정기": {
    title: "당뇨 정기처방", code: "DM-M01", price: "12,000",
    diagnoses: [{ name: "제2형 당뇨병 (E11)" }],
    prescriptions: [
      { name: "메트포르민정 500mg", qty: "1", daily: "2", days: "30" },
      { name: "글리메피리드정 2mg", qty: "1", daily: "1", days: "30" },
    ],
  },
  "고혈압+당뇨세트": {
    title: "고혈압+당뇨 세트", code: "HTN-DM01", price: "24,800",
    diagnoses: [{ name: "본태성 고혈압 (I10)" }, { name: "제2형 당뇨병 (E11)" }, { name: "고지혈증 (E78.5)" }],
    prescriptions: [
      { name: "암로디핀정 5mg", qty: "1", daily: "1", days: "30" },
      { name: "로살탄정 50mg", qty: "1", daily: "1", days: "30" },
      { name: "메트포르민정 500mg", qty: "1", daily: "2", days: "30" },
      { name: "아토르바스타틴정 10mg", qty: "1", daily: "1", days: "30" },
      { name: "아스피린장용정 100mg", qty: "1", daily: "1", days: "30" },
    ],
  },
  "당뇨 3개월 검사": {
    title: "당뇨 3개월 정기검사", code: "DM-T01", price: "32,000",
    diagnoses: [{ name: "제2형 당뇨병 (E11)" }],
    prescriptions: [
      { name: "HbA1c 당화혈색소", qty: "1", daily: "1", days: "1" },
      { name: "공복혈당 FBS", qty: "1", daily: "1", days: "1" },
      { name: "BUN/Creatinine", qty: "1", daily: "1", days: "1" },
      { name: "지질검사 TC/TG/HDL/LDL", qty: "1", daily: "1", days: "1" },
      { name: "소변 미세알부민", qty: "1", daily: "1", days: "1" },
    ],
    note: "3개월마다 정기 시행",
  },
  "비타민D 주사": {
    title: "비타민D 근육주사", code: "INJ-VD01", price: "35,000",
    prescriptions: [
      { name: "비타민D3 300,000IU IM", qty: "1", daily: "1", days: "1" },
    ],
    note: "3~6개월 간격 투여, 25(OH)D 수치 확인 후",
  },
  "마늘주사": {
    title: "마늘주사(푸르설타민)", code: "INJ-GA01", price: "25,000",
    prescriptions: [
      { name: "푸르설타민주(마늘주사) 50mg", qty: "1", daily: "1", days: "1" },
      { name: "생리식염수 100ml", qty: "1", daily: "1", days: "1" },
    ],
    note: "피로회복, 면역증강 목적. IV drip 30분",
  },
  "영양수액": {
    title: "영양수액 세트", code: "INJ-NUT01", price: "45,000",
    prescriptions: [
      { name: "5%포도당 500ml", qty: "1", daily: "1", days: "1" },
      { name: "비타민B콤플렉스", qty: "1", daily: "1", days: "1" },
      { name: "비타민C 2g", qty: "1", daily: "1", days: "1" },
      { name: "아미노산 수액", qty: "1", daily: "1", days: "1" },
    ],
    note: "전해질 보충 및 영양보충 목적",
  },
  "인플루엔자 3가": {
    title: "인플루엔자 예방접종(3가)", code: "VAC-FLU3", price: "30,000",
    prescriptions: [{ name: "인플루엔자백신 3가 0.5mL IM", qty: "1", daily: "1", days: "1" }],
    note: "매년 10~12월 접종 권장",
  },
  "인플루엔자 4가": {
    title: "인플루엔자 예방접종(4가)", code: "VAC-FLU4", price: "45,000",
    prescriptions: [{ name: "인플루엔자백신 4가 0.5mL IM", qty: "1", daily: "1", days: "1" }],
    note: "매년 10~12월 접종 권장",
  },
  "폐렴구균 23가": {
    title: "폐렴구균 예방접종(23가)", code: "VAC-PPSV23", price: "60,000",
    prescriptions: [{ name: "PPSV23 폐렴구균 23가 0.5mL IM", qty: "1", daily: "1", days: "1" }],
    note: "65세 이상 또는 만성질환 보유자",
  },
  "대상포진 백신": {
    title: "대상포진 예방접종", code: "VAC-ZOS01", price: "150,000",
    prescriptions: [{ name: "조스타박스 0.65mL SC", qty: "1", daily: "1", days: "1" }],
    note: "50세 이상 권장, 1회 접종",
  },
  "CBC 5종": {
    title: "CBC 5종 혈액검사", code: "LAB-CBC5", price: "12,000",
    prescriptions: [
      { name: "WBC (백혈구)", qty: "1", daily: "1", days: "1" },
      { name: "RBC (적혈구)", qty: "1", daily: "1", days: "1" },
      { name: "Hemoglobin (혈색소)", qty: "1", daily: "1", days: "1" },
      { name: "Hematocrit (적혈구용적)", qty: "1", daily: "1", days: "1" },
      { name: "Platelet (혈소판)", qty: "1", daily: "1", days: "1" },
    ],
  },
  "LFT 7종": {
    title: "간기능검사 7종", code: "LAB-LFT7", price: "18,000",
    prescriptions: [
      { name: "AST (GOT)", qty: "1", daily: "1", days: "1" },
      { name: "ALT (GPT)", qty: "1", daily: "1", days: "1" },
      { name: "ALP", qty: "1", daily: "1", days: "1" },
      { name: "GGT (감마지티피)", qty: "1", daily: "1", days: "1" },
      { name: "Total Bilirubin", qty: "1", daily: "1", days: "1" },
      { name: "Albumin", qty: "1", daily: "1", days: "1" },
      { name: "PT/INR", qty: "1", daily: "1", days: "1" },
    ],
  },
  "요 일반검사 10종": {
    title: "요 일반검사 10종", code: "LAB-UA10", price: "5,000",
    prescriptions: [
      { name: "Protein", qty: "1", daily: "1", days: "1" },
      { name: "pH", qty: "1", daily: "1", days: "1", highlight: true },
      { name: "Glucose", qty: "1", daily: "1", days: "1" },
      { name: "Occult Blood", qty: "1", daily: "1", days: "1" },
      { name: "Urobilinogen", qty: "1", daily: "1", days: "1" },
      { name: "Nitrite", qty: "1", daily: "1", days: "1" },
      { name: "Ketones", qty: "1", daily: "1", days: "1" },
      { name: "Bilirubin", qty: "1", daily: "1", days: "1" },
      { name: "Specific Gravity", qty: "1", daily: "1", days: "1" },
      { name: "WBC (Leukocyte)", qty: "1", daily: "1", days: "1" },
    ],
  },
  "흉부X-RAY": {
    title: "흉부 X-RAY", code: "IMG-CXR01", price: "15,000",
    prescriptions: [{ name: "흉부X-RAY PA (정면)", qty: "1", daily: "1", days: "1" }],
  },
  "복부초음파": {
    title: "복부초음파", code: "IMG-AUS01", price: "80,000",
    prescriptions: [{ name: "복부초음파 (전체)", qty: "1", daily: "1", days: "1" }],
    note: "8시간 이상 금식 필요",
  },
  "소화불량 처방": {
    title: "소화불량 처방", code: "DRUG-DYS01", price: "6,800",
    diagnoses: [{ name: "기능성 소화불량 (K30)" }],
    prescriptions: [
      { name: "모사프리드정 5mg", qty: "1", daily: "3", days: "7" },
      { name: "트리메부틴정 100mg", qty: "1", daily: "3", days: "7" },
    ],
  },
  "근골격계 통증 처방": {
    title: "근골격계 통증 처방", code: "DRUG-MSK01", price: "9,200",
    diagnoses: [{ name: "근막통증증후군 (M79.1)" }],
    prescriptions: [
      { name: "에토리콕시브정 60mg", qty: "1", daily: "1", days: "7" },
      { name: "에페리손정 50mg", qty: "1", daily: "3", days: "7" },
      { name: "레바미피드정 100mg", qty: "1", daily: "3", days: "7" },
    ],
  },
  // 기본 폴백
  "Influenza": {
    title: "Influenza 세트", code: "INFLU-01", price: "5,000",
    diagnoses: [{ name: "인플루엔자 (J10)" }],
    prescriptions: [
      { name: "오셀타미비르캡슐 75mg", qty: "1", daily: "2", days: "5" },
      { name: "타이레놀정 500mg", qty: "1", daily: "3", days: "5" },
    ],
  },
};

/* ──────────────────────────────────────────────
 * 시안A 워크플로우 탭 데이터
 * ────────────────────────────────────────────── */
const WORKFLOW_TABS = [
  { id: "top", icon: "★", label: "자주사용" },
  { id: "acute", icon: "⚡", label: "급성질환" },
  { id: "chronic", icon: "♻", label: "만성관리" },
  { id: "prev", icon: "◎", label: "예방/검진" },
  { id: "test", icon: "◈", label: "단독검사" },
];

const WORKFLOW_RX: Record<string, { label: string; type: string; freq: boolean; count: number }[]> = {
  top: [
    { label: "기침감기", type: "set", freq: true, count: 4 },
    { label: "위염", type: "set", freq: true, count: 3 },
    { label: "혈압약 리필", type: "med", freq: true, count: 2 },
    { label: "당뇨약 리필", type: "med", freq: true, count: 2 },
    { label: "CBC 5종", type: "test", freq: false, count: 5 },
    { label: "비타민D주사", type: "proc", freq: true, count: 1 },
    { label: "흉부X-RAY", type: "test", freq: false, count: 1 },
  ],
  acute: [
    { label: "기침감기", type: "set", freq: true, count: 4 },
    { label: "급성인후염", type: "set", freq: false, count: 3 },
    { label: "급성위염", type: "set", freq: true, count: 2 },
    { label: "급성장염", type: "set", freq: false, count: 3 },
    { label: "부비동염", type: "set", freq: false, count: 4 },
    { label: "요로감염", type: "set", freq: false, count: 3 },
    { label: "알레르기비염", type: "set", freq: false, count: 2 },
    { label: "결막염", type: "set", freq: false, count: 2 },
  ],
  chronic: [
    { label: "혈압약 리필", type: "med", freq: true, count: 2 },
    { label: "당뇨약 리필", type: "med", freq: true, count: 1 },
    { label: "고지혈증 리필", type: "med", freq: false, count: 1 },
    { label: "고혈압+당뇨 세트", type: "set", freq: false, count: 8 },
    { label: "당뇨 3개월 검사", type: "test", freq: false, count: 4 },
    { label: "갱년기처방", type: "set", freq: false, count: 5 },
    { label: "갑상선 관리", type: "set", freq: false, count: 3 },
  ],
  prev: [
    { label: "독감접종 3가", type: "prev", freq: true, count: 1 },
    { label: "독감접종 4가", type: "prev", freq: false, count: 1 },
    { label: "폐렴구균 23가", type: "prev", freq: false, count: 1 },
    { label: "대상포진 백신", type: "prev", freq: false, count: 1 },
    { label: "종합검진 패키지", type: "set", freq: false, count: 9 },
    { label: "비타민D 주사", type: "proc", freq: true, count: 1 },
    { label: "갱년기 검진", type: "set", freq: false, count: 4 },
  ],
  test: [
    { label: "CBC 5종", type: "test", freq: false, count: 5 },
    { label: "LFT 7종", type: "test", freq: false, count: 6 },
    { label: "HbA1c", type: "test", freq: false, count: 1 },
    { label: "갑상선 기능", type: "test", freq: false, count: 3 },
    { label: "콜레스테롤", type: "test", freq: false, count: 1 },
    { label: "소변검사", type: "test", freq: false, count: 1 },
    { label: "흉부X-RAY", type: "test", freq: false, count: 1 },
    { label: "복부초음파", type: "test", freq: false, count: 1 },
    { label: "BUN/Cr", type: "test", freq: false, count: 2 },
    { label: "전해질", type: "test", freq: false, count: 1 },
  ],
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  set: { bg: "bg-[#EEEDFE]", border: "border-[#CECBF6]", text: "text-[#3C3489]" },
  med: { bg: "bg-[#EAF3DE]", border: "border-[#C0DD97]", text: "text-[#3B6D11]" },
  test: { bg: "bg-[#E6F1FB]", border: "border-[#B5D4F4]", text: "text-[#185FA5]" },
  proc: { bg: "bg-[#FAEEDA]", border: "border-[#FAC775]", text: "text-[#854F0B]" },
  prev: { bg: "bg-[#E1F5EE]", border: "border-[#9FE1CB]", text: "text-[#085041]" },
};

/* ──────────────────────────────────────────────
 * 카테고리 트리 아이템 (재귀)
 * ────────────────────────────────────────────── */
function TreeItem({ cat, depth = 0, selected, onSelect, onSelectItem, selectedItem }: {
  cat: (typeof BUNDLE_CATEGORIES)[number]; depth?: number; selected: string | null; onSelect: (id: string) => void;
  onSelectItem?: (name: string) => void; selectedItem?: string | null;
}) {
  const [expanded, setExpanded] = useState(cat.id === "general" || cat.id === "chronic" || cat.id === "test");
  const hasChildren = "children" in cat && (cat as { children?: unknown[] }).children;
  const hasItems = cat.items && cat.items.length > 0;
  const isSelected = selected === cat.id;
  const pl = 8 + depth * 14;

  return (
    <div>
      <button
        className={`flex w-full items-center gap-[4px] py-[5px] text-[12px] hover:bg-[#F8F8FA] transition-colors ${isSelected ? "bg-[#F1EDFF] text-[#453EDC] font-bold" : "text-[#171719]"}`}
        style={{ paddingLeft: pl, paddingRight: 8 }}
        onClick={() => { if (hasChildren) setExpanded(!expanded); else setExpanded(!expanded); onSelect(cat.id); }}
      >
        {hasChildren || hasItems ? (
          expanded ? <ChevronDown className="h-[11px] w-[11px] text-[#989BA2] shrink-0" /> : <ChevronRight className="h-[11px] w-[11px] text-[#989BA2] shrink-0" />
        ) : (
          <span className="w-[11px] shrink-0" />
        )}
        <span className="truncate">{cat.name}</span>
      </button>
      {expanded && hasItems && cat.items.map((item, idx) => (
        <button
          key={idx}
          className={`flex w-full items-center py-[4px] text-[12px] hover:bg-[#F8F8FA] transition-colors ${selectedItem === item ? "bg-[#F1EDFF] text-[#453EDC] font-bold" : "text-[#70737C]"}`}
          style={{ paddingLeft: pl + 18 }}
          onClick={() => onSelectItem?.(item)}
        >
          <span className="truncate">{item}</span>
        </button>
      ))}
      {expanded && hasChildren && (cat as { children: typeof BUNDLE_CATEGORIES }).children.map((child) => (
        <TreeItem key={child.id} cat={child} depth={depth + 1} selected={selected} onSelect={onSelect} onSelectItem={onSelectItem} selectedItem={selectedItem} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 현재 안 (트리 + 상세)
 * ────────────────────────────────────────────── */
function CurrentDesign() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>("general");
  const [selectedItem, setSelectedItem] = useState<string | null>("감기세트A");

  const detail = selectedItem ? BUNDLE_DETAILS[selectedItem] : null;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* 검색 */}
      <div className="flex items-center gap-[6px] border-b border-[#EAEBEC] px-[10px] py-[6px]">
        <Search className="h-[14px] w-[14px] text-[#989BA2]" />
        <input
          type="text"
          placeholder="카테고리 이름, 묶음코드, 묶음명칭, 세부키워드로 검색"
          className="flex-1 text-[12px] text-[#171719] placeholder-[#C2C4C8] outline-none bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 왼쪽 트리 */}
        <div className="flex w-[160px] flex-col border-r border-[#EAEBEC] overflow-y-auto shrink-0">
          {BUNDLE_CATEGORIES.map((cat) => (
            <TreeItem key={cat.id} cat={cat} selected={selectedCat} onSelect={(id) => { setSelectedCat(id); setSelectedItem(null); }} onSelectItem={setSelectedItem} selectedItem={selectedItem} />
          ))}
        </div>

        {/* 오른쪽 상세 */}
        <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
          {detail ? (
            <>
              {/* 묶음 대표 타이틀 — 더블클릭 시 진단 및 처방에 오더 적용 */}
              <div
                className="flex items-center gap-[8px] px-[10px] py-[8px] bg-[#F7F7F8] border-b border-[#EAEBEC] cursor-pointer hover:bg-[#F0F0F2] transition-colors"
                onDoubleClick={() => {
                  alert(`[${detail.code}] ${detail.title}\n처방 ${detail.prescriptions?.length || 0}건이 진단 및 처방에 적용되었습니다.`);
                }}
                title="더블클릭하여 진단 및 처방에 적용"
              >
                <span className="text-[13px] font-bold text-[#171719]">{detail.title}</span>
                <span className="text-[12px] text-[#989BA2]">{detail.code}</span>
                <span className="ml-auto text-[12px] font-bold text-[#171719]">{detail.price}</span>
                <button className="p-[1px] text-[#989BA2] hover:text-[#453EDC]" onClick={(e) => e.stopPropagation()}><Copy className="h-[12px] w-[12px]" /></button>
              </div>

              {/* 증상 */}
              {detail.symptom && (
                <Section label="증상" copyable>
                  <p className="px-[10px] py-[6px] text-[12px] text-[#46474C] leading-[1.5]">{detail.symptom}</p>
                </Section>
              )}

              {/* 진단 */}
              {detail.diagnoses && detail.diagnoses.length > 0 && (
                <Section label="진단" copyable>
                  <table className="w-full text-[11px]">
                    <tbody>
                      {detail.diagnoses.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#F0F0F2]">
                          <td className="py-[4px] px-[10px] text-[#171719]">{item.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {/* 처방 */}
              {detail.prescriptions && detail.prescriptions.length > 0 && (
                <Section label="처방" copyable>
                  <table className="w-full text-[11px]">
                    <tbody>
                      {detail.prescriptions.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#F0F0F2]">
                          <td className="py-[4px] px-[10px] text-[#171719]">{item.name}</td>
                          <td className={`py-[4px] w-[28px] text-center ${item.highlight ? "text-[#453EDC] font-bold" : "text-[#989BA2]"}`}>{item.qty}</td>
                          <td className="py-[4px] w-[28px] text-center text-[#989BA2]">{item.daily}</td>
                          <td className="py-[4px] w-[28px] text-center text-[#989BA2]">{item.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              )}

              {/* 메모 */}
              {detail.note && (
                <div className="px-[10px] py-[6px] text-[11px] text-[#F57010] bg-[#FFF8F0]">💡 {detail.note}</div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[12px] text-[#989BA2]">
              왼쪽에서 묶음을 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 시안A - 워크플로우 기반
 * ────────────────────────────────────────────── */
function DesignA() {
  const [activeTab, setActiveTab] = useState("top");
  const [selectedRx, setSelectedRx] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const rxList = WORKFLOW_RX[activeTab] || [];
  const filtered = searchTerm
    ? rxList.filter((r) => r.label.includes(searchTerm))
    : rxList;

  const detail = selectedRx ? BUNDLE_DETAILS[selectedRx] : null;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* ─── 상단: 탭 + 버튼 그리드 ─── */}
      <div className="flex flex-col shrink-0">
        {/* 검색 */}
        <div className="flex items-center gap-[6px] border-b border-[#EAEBEC] px-[10px] py-[6px]">
          <Search className="h-[14px] w-[14px] text-[#989BA2]" />
          <input
            type="text"
            placeholder="처방명 검색"
            className="flex-1 text-[12px] text-[#171719] placeholder-[#C2C4C8] outline-none bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 워크플로우 탭 */}
        <div className="flex border-b border-[#EAEBEC]">
          {WORKFLOW_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 flex flex-col items-center gap-[1px] py-[5px] text-center transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-[#453EDC] text-[#171719]"
                  : "border-transparent text-[#989BA2] hover:text-[#70737C]"
              }`}
              onClick={() => { setActiveTab(tab.id); setSelectedRx(null); }}
            >
              <span className="text-[12px]">{tab.icon}</span>
              <span className="text-[9px]">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 처방 버튼 그리드 */}
        <div className="overflow-y-auto h-[160px] shrink-0 p-[6px]">
          <div className="flex flex-wrap gap-[4px]">
            {filtered.map((rx) => {
              const colors = TYPE_COLORS[rx.type] || TYPE_COLORS.set;
              return (
                <button
                  key={rx.label}
                  className={`relative rounded-[4px] border px-[6px] py-[3px] text-[11px] transition-all hover:brightness-95 ${colors.bg} ${colors.border} ${colors.text} ${
                    selectedRx === rx.label ? "ring-2 ring-[#453EDC] ring-offset-1" : ""
                  }`}
                  onClick={() => setSelectedRx(rx.label)}
                >
                  {rx.freq && (
                    <span className="absolute -top-[2px] -right-[2px] h-[6px] w-[6px] rounded-full bg-[#E24B4A] border border-white" />
                  )}
                  <span className="leading-[1.2]">{rx.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-[6px] border-t border-b border-[#EAEBEC] px-[6px] py-[3px] flex-wrap">
          <LegendDot color="#AFA9EC" label="묶음" />
          <LegendDot color="#C0DD97" label="약" />
          <LegendDot color="#85B7EB" label="검사" />
          <LegendDot color="#9FE1CB" label="예방" />
          <span className="ml-auto flex items-center gap-[2px] text-[9px] text-[#989BA2]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#E24B4A]" />
            다회
          </span>
        </div>
      </div>

      {/* ─── 하단: 상세 미리보기 ─── */}
      <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
        {detail ? (
          <>
            {/* 타이틀 */}
            <div className="flex items-center gap-[6px] px-[10px] py-[6px] bg-[#F1EDFF] border-b border-[#EAEBEC] shrink-0">
              <span className="text-[12px] font-bold text-[#453EDC]">{detail.title}</span>
              <span className="text-[10px] text-[#989BA2]">{detail.code}</span>
              <span className="ml-auto text-[11px] font-bold text-[#171719]">{detail.price}</span>
            </div>

            {/* 증상 */}
            {detail.symptom && (
              <div className="px-[10px] py-[5px] border-b border-[#F0F0F2]">
                <span className="text-[10px] font-bold text-[#989BA2]">증상</span>
                <p className="text-[11px] text-[#46474C] leading-[1.4] mt-[2px]">{detail.symptom}</p>
              </div>
            )}

            {/* 진단 */}
            {detail.diagnoses && detail.diagnoses.length > 0 && (
              <div className="px-[10px] py-[5px] border-b border-[#F0F0F2]">
                <span className="text-[10px] font-bold text-[#989BA2]">진단</span>
                {detail.diagnoses.map((d, i) => (
                  <div key={i} className="text-[11px] text-[#171719] mt-[1px]">{d.name}</div>
                ))}
              </div>
            )}

            {/* 처방 */}
            {detail.prescriptions && detail.prescriptions.length > 0 && (
              <div className="px-[10px] py-[5px] border-b border-[#F0F0F2]">
                <span className="text-[10px] font-bold text-[#989BA2]">처방</span>
                {detail.prescriptions.map((p, i) => (
                  <div key={i} className="flex items-center gap-[4px] mt-[2px]">
                    <span className="h-[4px] w-[4px] rounded-full bg-[#453EDC] shrink-0" />
                    <span className="text-[11px] text-[#171719] flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] text-[#989BA2] shrink-0">{p.qty}/{p.daily}/{p.days}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 메모 */}
            {detail.note && (
              <div className="px-[10px] py-[4px] text-[10px] text-[#F57010] bg-[#FFF8F0]">💡 {detail.note}</div>
            )}

            {/* 적용 버튼 */}
            <div className="flex items-center gap-[4px] px-[10px] py-[6px] border-t border-[#EAEBEC] mt-auto shrink-0">
              <span className="flex-1 text-[10px] text-[#989BA2]">
                {detail.prescriptions?.length || 0}건
              </span>
              <button className="rounded-[4px] border border-[#C2C4C8] px-[8px] py-[3px] text-[11px] text-[#70737C]">선택 적용</button>
              <button className="rounded-[4px] bg-[#453EDC] px-[8px] py-[3px] text-[11px] font-bold text-white">전체 적용</button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[#989BA2] gap-[6px] flex-col">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#F4F4F5] text-[14px]">+</div>
            <span className="text-[11px] text-center leading-[1.4]">위에서 처방을 선택하면<br />상세를 확인할 수 있어요</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 섹션 헤더 (증상/진단/처방)
 * ────────────────────────────────────────────── */
function Section({ label, copyable, children }: { label: string; copyable?: boolean; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#EAEBEC]">
      <div className="flex items-center px-[10px] py-[5px] bg-[#F7F7F8]">
        <span className="text-[11px] font-bold text-[#989BA2]">{label}</span>
        {copyable && (
          <button className="ml-auto p-[1px] text-[#C2C4C8] hover:text-[#453EDC]"><Copy className="h-[11px] w-[11px]" /></button>
        )}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[2px] text-[10px] text-[#989BA2]">
      <span className="h-[6px] w-[6px] rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  );
}

/* ──────────────────────────────────────────────
 * 메인 컴포넌트
 * ────────────────────────────────────────────── */
export default function BundlePrescription() {
  const [view, setView] = useState<"current" | "designA">("current");

  return (
    <CardModule widgetId="bundle-prescription" className="w-full h-full rounded-[6px] border border-[#C2C4C8] bg-white overflow-hidden">
      {/* 타이틀 바 */}
      <CardHeader widgetId="bundle-prescription">
        <span className="text-[13px] font-bold text-[#171719]">묶음처방</span>
        <button
          className={`ml-[8px] rounded-[4px] px-[6px] py-[1px] text-[10px] font-bold transition-colors ${
            view === "designA"
              ? "bg-[#453EDC] text-white"
              : "bg-white border border-[#C2C4C8] text-[#70737C] hover:border-[#453EDC] hover:text-[#453EDC]"
          }`}
          onClick={() => setView(view === "current" ? "designA" : "current")}
        >
          {view === "designA" ? "현재안" : "시안A"}
        </button>
        <div className="flex items-center gap-[4px] ml-auto">
          <button className="p-[2px] text-[#989BA2] hover:text-[#171719]"><Settings className="h-[14px] w-[14px]" /></button>
          <CardMoreMenu widgetId="bundle-prescription" />
        </div>
      </CardHeader>

      {view === "current" ? <CurrentDesign /> : <DesignA />}
    </CardModule>
  );
}
