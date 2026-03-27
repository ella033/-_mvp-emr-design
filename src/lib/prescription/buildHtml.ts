// 더 이상 사용 안 하는게 확실해지면 제거 예정
import { existsSync, readFileSync } from "fs";
import path from "path";
import { formatRrnNumber } from "../common-utils";
import { formatPhoneNumber } from "../patient-utils";

const MAX_OUT_MED_ROWS = 13;
const MAX_INJECTION_ROWS = 7;
const DEFAULT_LEFT_MARGIN = 17;
const DEFAULT_TOP_MARGIN = 17;
const LEGACY_FONT = `"Arial","Helvetica",sans-serif`;

/**
 * SVG 이미지를 고해상도 Canvas PNG로 변환하는 인라인 스크립트.
 *
 * 서버 사이드에서는 Canvas API를 사용할 수 없으므로,
 * HTML에 인라인 <script>를 삽입하여 브라우저 렌더링 시점에 변환한다.
 *
 * SVG를 <img>로 표시하면 브라우저가 CSS 픽셀 크기(24mm ≈ 91px)로 래스터화하여
 * 97×97 QR 모듈이 모듈당 0.94px (sub-pixel)이 되어 회색으로 anti-aliasing된다.
 * Canvas에 680px로 렌더링 후 PNG로 교체하면 모듈당 ~6.2px로 선명해진다.
 *
 * 자세한 배경은 build-prescription-html-client.ts의 svgBase64ToHighResPng 주석 참고.
 */
const SVG_TO_PNG_SCRIPT = `<script>
(function(){
  var SIZE=1024;
  var imgs=document.querySelectorAll('.svg-to-png');
  if(!imgs.length)return;
  imgs.forEach(function(el){
    var svgImg=new Image();
    svgImg.onload=function(){
      try{
        var c=document.createElement('canvas');
        c.width=SIZE;c.height=SIZE;
        var ctx=c.getContext('2d');
        ctx.fillStyle='white';
        ctx.fillRect(0,0,SIZE,SIZE);
        ctx.drawImage(svgImg,0,0,SIZE,SIZE);
        el.src=c.toDataURL('image/png');
      }catch(e){}
    };
    svgImg.onerror=function(){};
    svgImg.src=el.src;
  });
})();
<\/script>`;

type InsuranceFlags = {
  isMedicalInsurance: boolean;
  isMedicalAid: boolean;
  isIndustrialAccident: boolean;
  isCarInsurance: boolean;
  isEtcInsurance: boolean;
};

export type PrescriptionItem = {
  name: string;
  dosePerCount: string;
  countPerDay: string;
  days: string;
  usage: string;
  nameAlign?: string;
};

export type InjectionItem = {
  name: string;
  dosePerCount: string;
  countPerDay: string;
  days: string;
  location: "원내" | "원외";
  nameAlign?: string;
};

export type PrescriptionData = {
  purpose?: string;
  issueYear: string;
  issueMonth: string;
  issueDay: string;
  issueNumber: string;
  validPeriod: string;
  hospital: {
    id: string;
    name: string;
    tel: string;
    fax: string;
    email: string;
    address: string;
  };
  patient: {
    name: string;
    registrationNumber: string;
    phone: string;
  };
  insurance: {
    associationName: string;
    associationCode: string;
    cardNumber: string;
    insuredName: string;
    flags: InsuranceFlags;
  };
  diseaseMain: string;
  diseaseSub: string;
  doctor: {
    name: string;
    licenseType: string;
    licenseNumber: string;
    signImageBase64?: string;
  };
  pharmacyNote: string;
  outMedicines: PrescriptionItem[];
  injections: InjectionItem[];
  qrCodeImage?: string;
  printLeftMargin?: number;
  printTopMargin?: number;
};

export type BuildOptions = {
  useFormPaper?: boolean;
  showSpaceRow?: boolean;
  qrCodeImage?: string;
  showBackgroundImage?: boolean;
};

type PrescriptionApiHospital = {
  name?: string | null;
  nameEn?: string | null;
  number?: string | null;
  address1?: string | null;
  address2?: string | null;
  address1En?: string | null;
  address2En?: string | null;
  zipcode?: string | null;
  phone?: string | null;
  mobile?: string | null;
  fax?: string | null;
  director?: string | null;
  directorEn?: string | null;
  email?: string | null;
};

type PrescriptionApiPatient = {
  name?: string | null;
  rrn?: string | null;
  rrnView?: string | null;
  hospital?: PrescriptionApiHospital | null;
};

type PrescriptionApiRegistration = {
  insuranceType?: number | null;
};

type PrescriptionApiDoctor = {
  name?: string | null;
  nameEn?: string | null;
  licenseNo?: string | null;
  signImageBase64?: string | null;
};

type PrescriptionApiDisease = {
  code?: string | null;
};

type PrescriptionApiOrder = {
  claimCode?: string | null;
  name?: string | null;
  itemType?: string | null;
  oneTwoType?: number | null;
  inOutType?: number | null;
  dosePerCount?: string | null;
  countPerDay?: string | null;
  days?: string | null;
  usage?: string | null;
};

export type PrescriptionApiResponse = {
  issuanceNumber?: string | null;
  pharmacyNotes?: string | null;
  patient?: PrescriptionApiPatient | null;
  registration?: PrescriptionApiRegistration | null;
  doctor?: PrescriptionApiDoctor | null;
  diseases?: PrescriptionApiDisease[] | null;
  orders?: PrescriptionApiOrder[] | null;
  validPeriod?: string | null;
  purpose?: string | null;
  issueDate?: string | null;
  printLeftMargin?: number;
  printTopMargin?: number;
  qrCodeImage?: string | null;
};

type BarcodeData = {
  크기?: string | number | null;
  위치위?: string | number | null;
  위치옆?: string | number | null;
  이미지?: string | null;
};

// 한글 키로 구성된 처방전 데이터 타입
type KoreanPrescriptionData = {
  교부번호?: string | null;
  조제시참고사항?: string | null;
  바코드?: BarcodeData | null;
  병원?: {
    요양기관명?: string | null;
    요양기관명영문?: string | null;
    요양기관번호?: string | null;
    주소1?: string | null;
    주소2?: string | null;
    주소1영문?: string | null;
    주소2영문?: string | null;
    우편번호?: string | null;
    전화번호?: string | null;
    휴대폰번호?: string | null;
    팩스번호?: string | null;
    대표자명?: string | null;
    대표자명영문?: string | null;
    이메일?: string | null;
  };
  환자?: {
    성명?: string | null;
    주민등록번호?: string | null;
    조회용주민번호?: string | null;
  };
  접수?: {
    보험구분?: string | number | null;
  };
  의사?: {
    이름?: string | null;
    이름영문?: string | null;
    면허번호?: string | null;
  };
  상병목록?: Array<{ 코드?: string | null }>;
  원외약품처방목록?: Array<{
    페이지?: number;
    목록?: Array<{
      청구코드?: string | null;
      명칭?: string | null;
      투여량1회?: string | null;
      투여횟수1일?: string | null;
      총투약일수?: string | null;
      용법?: string | null;
    }>;
  }>;
  주사제처방내역원내조제여부?: boolean;
  주사제처방내역원외처방여부?: boolean;
  주사제처방목록?: Array<{
    페이지?: number;
    목록?: Array<{
      청구코드?: string | null;
      명칭?: string | null;
      투여량1회?: string | null;
      투여횟수1일?: string | null;
      총투약일수?: string | null;
      용법?: string | null;
    }>;
  }>;
  사용기간?: string | null;
  교부일자?: string | null;
};


const emptyOutMedicine: PrescriptionItem = {
  name: "",
  dosePerCount: "",
  countPerDay: "",
  days: "",
  usage: "",
};

const emptyInjection: InjectionItem = {
  name: "",
  dosePerCount: "",
  countPerDay: "",
  days: "",
  location: "원외",
};

const DEFAULT_PURPOSE = "약국제출용";

function ensureString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function toMmCss(value: unknown, fallbackMm: number): string {
  const isNumberValue = typeof value === "number" && Number.isFinite(value);
  if (isNumberValue) return `${value}mm`;

  const isStringValue = typeof value === "string";
  if (!isStringValue) return `${fallbackMm}mm`;

  const trimmed = value.trim();
  const hasMmSuffix = trimmed.toLowerCase().endsWith("mm");
  if (hasMmSuffix) return trimmed;

  const numericMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
  const parsed = numericMatch ? Number(numericMatch[0]) : NaN;
  const isFiniteParsed = Number.isFinite(parsed);
  return isFiniteParsed ? `${parsed}mm` : `${fallbackMm}mm`;
}

function resolveIssueDateParts(issueNumber?: string | null) {
  if (!issueNumber || issueNumber.length < 8) {
    return {
      year: "",
      month: "",
      day: "",
      number: "",
    };
  }

  const datePart = issueNumber.substring(0, 8);
  const numberPart = issueNumber.substring(8);

  const year = datePart.substring(0, 4);
  const month = datePart.substring(4, 6);
  const day = datePart.substring(6, 8);

  const isValidDate = /^\d{8}$/.test(datePart) &&
    parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 &&
    parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31;

  if (!isValidDate) {
    return {
      year: "",
      month: "",
      day: "",
      number: numberPart || "",
    };
  }

  return {
    year,
    month,
    day,
    number: numberPart,
  };
}

function mapInsuranceFlagsFromType(insuranceType?: number | null): InsuranceFlags {
  const baseFlags: InsuranceFlags = {
    isMedicalInsurance: false,
    isMedicalAid: false,
    isIndustrialAccident: false,
    isCarInsurance: false,
    isEtcInsurance: false,
  };

  if (insuranceType === 1) return { ...baseFlags, isMedicalInsurance: true };
  if (insuranceType === 2) return { ...baseFlags, isMedicalAid: true };
  if (insuranceType === 3) return { ...baseFlags, isIndustrialAccident: true };
  if (insuranceType === 4) return { ...baseFlags, isCarInsurance: true };
  if (insuranceType === 5) return { ...baseFlags, isEtcInsurance: true };

  return baseFlags;
}

function parseInsuranceType(insuranceType?: string | number | null) {
  if (typeof insuranceType === "number") {
    return insuranceType;
  }
  if (typeof insuranceType === "string") {
    const match = insuranceType.match(/^(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

function composeHospitalAddress(hospital?: KoreanPrescriptionData["병원"] | null) {
  const address1 = ensureString(hospital?.주소1);
  const address2 = ensureString(hospital?.주소2);
  const hasBothAddress = Boolean(address1 && address2);
  return hasBothAddress ? `${address1} ${address2}`.trim() : (address1 || address2);
}

function splitKoreanOrders(prescription: KoreanPrescriptionData) {
  const outMedicines: PrescriptionItem[] = [];
  const injections: InjectionItem[] = [];

  if (prescription.원외약품처방목록) {
    prescription.원외약품처방목록.forEach((page) => {
      page.목록?.forEach((item) => {
        outMedicines.push({
          name: ensureString(item.명칭),
          dosePerCount: ensureString(item.투여량1회),
          countPerDay: ensureString(item.투여횟수1일),
          days: ensureString(item.총투약일수),
          usage: ensureString(item.용법),
        });
      });
    });
  }

  if (prescription.주사제처방목록) {
    const isInClinic = prescription.주사제처방내역원내조제여부 === true;
    prescription.주사제처방목록.forEach((page) => {
      page.목록?.forEach((item) => {
        injections.push({
          name: ensureString(item.명칭),
          dosePerCount: ensureString(item.투여량1회),
          countPerDay: ensureString(item.투여횟수1일),
          days: ensureString(item.총투약일수),
          location: isInClinic ? "원내" : "원외",
        });
      });
    });
  }

  return { outMedicines, injections };
}


let cachedCss: string | null = null;
let cachedBackgroundDataUrl: string | null = null;

function getDocumentCss(): string {
  if (cachedCss !== null) return cachedCss;

  try {
    const scssPath = path.join(process.cwd(), "src", "lib", "prescription", "prescription.scss");
    if (existsSync(scssPath)) {
      // sass는 이미 다른 곳에서 사용 중이라 런타임 의존성 충돌 위험이 낮음
      const sass = require("sass");
      const result = sass.compile(scssPath, { style: "expanded" });
      cachedCss = String(result.css ?? "");
      return cachedCss;
    }
  } catch {
    // ignore read errors
  }

  cachedCss = "";
  return cachedCss;
}

function getFormBackgroundDataUrl(): string | null {
  if (cachedBackgroundDataUrl !== null) return cachedBackgroundDataUrl;

  try {
    const imgPath = path.join(
      process.cwd(),
      "examples",
      "print-forms",
      "Html",
      "Images",
      "처방전양식지.jpg",
    );
    if (existsSync(imgPath)) {
      const buf = readFileSync(imgPath);
      cachedBackgroundDataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
      return cachedBackgroundDataUrl;
    }
  } catch {
    // ignore read errors
  }

  cachedBackgroundDataUrl = null;
  return cachedBackgroundDataUrl;
}

function chunkItems<T>(items: T[], size: number, filler: T, showSpaceRow: boolean) {
  return (pageIndex: number) => {
    const start = pageIndex * size;
    const sliced = items.slice(start, start + size);
    const remainingSlots = size - sliced.length;

    if (remainingSlots > 0) {
      const shouldInsertSpaceRow = showSpaceRow && sliced.length > 0;
      const availableSlots = shouldInsertSpaceRow ? remainingSlots - 1 : remainingSlots;
      if (shouldInsertSpaceRow) {
        sliced.push({
          ...(filler as unknown as Record<string, unknown>),
          name: "============ 이 하 여 백 ============",
          nameAlign: "text-center",
        } as T);
      }
      for (let i = 0; i < availableSlots; i++) {
        sliced.push(filler);
      }
    }

    return sliced.slice(0, size);
  };
}

function getTotalPages(outMedicines: PrescriptionItem[], injections: InjectionItem[]) {
  const outPages = Math.max(Math.ceil(outMedicines.length / MAX_OUT_MED_ROWS), 1);
  const injectionPages = Math.max(Math.ceil(injections.length / MAX_INJECTION_ROWS), 1);
  return Math.max(outPages, injectionPages);
}

function getInsuranceText(flags: InsuranceFlags) {
  return {
    medical: flags.isMedicalInsurance ? "V" : "1",
    aid: flags.isMedicalAid ? "V" : "2",
    industrial: flags.isIndustrialAccident ? "V" : "3",
    car: flags.isCarInsurance ? "V" : "4",
    etc: flags.isEtcInsurance ? "V" : "5",
  };
}

function getInsuranceMarkers(flags: InsuranceFlags, useFormPaper: boolean) {
  if (!useFormPaper) return "";

  const markers: string[] = [];
  if (flags.isMedicalInsurance) {
    markers.push('<div class="check-marker-div" style="top: 0mm; left: 0.7mm;">V</div>');
  }
  if (flags.isMedicalAid) {
    markers.push('<div class="check-marker-div" style="top: 0mm; left: 20.7mm;">V</div>');
  }
  if (flags.isIndustrialAccident) {
    markers.push('<div class="check-marker-div" style="top: 0mm; left: 40.7mm;">V</div>');
  }
  if (flags.isCarInsurance) {
    markers.push('<div class="check-marker-div" style="top: 0mm; left: 60.8mm;">V</div>');
  }
  if (flags.isEtcInsurance) {
    markers.push('<div class="check-marker-div" style="top: 0mm; left: 84.2mm;">V</div>');
  }
  return markers.join("");
}

function renderDoctorSign(signImageBase64?: string) {
  if (!signImageBase64) {
    return '<span class="opacity-zero" style="font-size: 9px; position: absolute; top: 3.5mm; left: 25mm;">(서명 또는 날인)</span>';
  }

  return `
    <span style="position: absolute; top: -2.5mm; left: 17mm;">
      <img src="data:image/jpg;base64, ${signImageBase64}" alt="sign" class="sign" />
    </span>
  `;
}

function renderDiseaseCode(code: string, seq: number) {
  return code.length > seq ? code.charAt(seq) : "";
}

function renderDiseaseCodeTable(prescription: KoreanPrescriptionData) {
  const diseaseMain = ensureString(prescription.상병목록?.[0]?.코드);
  const diseaseSub = ensureString(prescription.상병목록?.[1]?.코드);
  const doctorName = ensureString(prescription.의사?.이름);
  // FIXME: 면허종별 표시 로직 수정
  // const doctorLicenseType = ensureString(prescription.의사?.이름영문) || "의사";
  const doctorLicenseType = "의사";
  const doctorLicenseNumber = ensureString(prescription.의사?.면허번호);
  const doctorSignImage = undefined;

  return `
    <table class="in-table2" style="width: auto;">
      <tr style="height: 6mm;">
        <td rowspan="2" class="text-center border-remove-top-left border-remove-bottom opacity-zero" style="width: 10mm; min-width: 10mm; max-width: 10mm; font-size: 10px;">질병<br />분류<br />기호</td>
        <td class="border-remove-top-left dis-code-cell">${renderDiseaseCode(diseaseMain, 0)}</td>
        <td class="border-remove-top dis-code-cell">${renderDiseaseCode(diseaseMain, 1)}</td>
        <td class="border-remove-top dis-code-cell">${renderDiseaseCode(diseaseMain, 2)}</td>
        <td class="border-remove-top dis-code-cell">${renderDiseaseCode(diseaseMain, 3)}</td>
        <td class="border-remove-top-right dis-code-cell">${renderDiseaseCode(diseaseMain, 4)}</td>
        <td class="border-remove-top-bottom opacity-zero" rowspan="2" style="width: 12mm; font-size: 9px;">처 방<br />의료인의<br />성 명</td>
        <td class="border-remove-top-bottom" rowspan="2" style="width: 45.5mm; font-size: 12px;">
          <div style="position: relative;">
            <span style="margin-left: 5px;">${doctorName}</span>
            ${renderDoctorSign(doctorSignImage)}
          </div>
        </td>
        <td class="border-remove-top text-center opacity-zero" style="width: 13mm; font-size: 10px;">면허종별</td>
        <td class="border-remove-top-right" style="width: 44mm; font-size: 12px;"><div style="margin-left: 2px; text-align: center;">${doctorLicenseType}</div></td>
      </tr>
      <tr style="height: 6mm;">
        <td class="border-remove-bottom-left dis-code-cell">${renderDiseaseCode(diseaseSub, 0)}</td>
        <td class="border-remove-bottom dis-code-cell">${renderDiseaseCode(diseaseSub, 1)}</td>
        <td class="border-remove-bottom dis-code-cell">${renderDiseaseCode(diseaseSub, 2)}</td>
        <td class="border-remove-bottom dis-code-cell">${renderDiseaseCode(diseaseSub, 3)}</td>
        <td class="border-remove-bottom-right dis-code-cell">${renderDiseaseCode(diseaseSub, 4)}</td>
        <td class="border-remove-bottom text-center opacity-zero" style="font-size: 10px;">면허번호</td>
        <td style="border-bottom: none; border-right: none; font-size: 12px;">
          <span style="margin-left: 4mm;" class="opacity-zero">제</span>
          <span style="margin-left: 6mm;">${doctorLicenseNumber}</span>
          <span style="margin-left: 6mm;" class="opacity-zero">호</span>
        </td>
      </tr>
    </table>
  `;
}

function renderInjectionMarkers(injections: InjectionItem[], useFormPaper: boolean) {
  if (!useFormPaper) return "";

  const hasInClinic = injections.some((item) => item.location === "원내");
  const hasOutClinic = injections.some((item) => item.location === "원외");
  const markers: string[] = [];

  if (hasInClinic) {
    markers.push('<div class="check-marker-div" style="top: 0.3mm; left: 70mm;">V</div>');
  }
  if (hasOutClinic) {
    markers.push('<div class="check-marker-div" style="top: 0.3mm; left: 93.5mm;">V</div>');
  }

  return markers.join("");
}

function renderPrescriptionRows(outMedicines: PrescriptionItem[], injections: InjectionItem[], prescription: KoreanPrescriptionData, useFormPaper: boolean) {
  const rows: string[] = [];
  const validPeriod = ensureString(prescription.사용기간 ?? "3");
  const pharmacyNote = ensureString(prescription.조제시참고사항);

  const hasInClinic = injections.some((item) => item.location === "원내");
  const hasOutClinic = injections.some((item) => item.location === "원외");
  const inClinicText = hasInClinic ? "V" : "&nbsp;";
  const outClinicText = hasOutClinic ? "V" : "&nbsp;";

  // Header
  rows.push(`
    <tr style="height: 9.5mm">
      <td colspan="2" class="text-center border-remove-top-left opacity-zero" style="width: 81mm">처방 의약품의 명칭</td>
      <td class="text-center border-remove-top opacity-zero" style="width: 13mm; font-size: 10px;">1 회<br />투여량</td>
      <td class="text-center border-remove-top opacity-zero" style="width: 13mm; font-size: 10px; ">1 일<br />투여횟수</td>
      <td class="text-center border-remove-top opacity-zero" style="width: 13mm; font-size: 10px; ">총<br />투약일수</td>
      <td class="text-center border-remove-top-right opacity-zero">용 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 법</td>
    </tr>
  `);

  for (let i = 0; i < MAX_OUT_MED_ROWS; i++) {
    const item = outMedicines[i] ?? emptyOutMedicine;
    const isFirstRow = i === 0;
    const isLastRow = i === MAX_OUT_MED_ROWS - 1;

    const usageCell =
      isLastRow && !item.usage
        ? '<td class="text-center border-remove-right opacity-zero">조 제 시 참 고 사 항</td>'
        : `<td class="${isFirstRow ? "border-remove-bottom-right" : "border-remove-top-bottom border-remove-right"} ${item.nameAlign ?? ""
        }">
            <span class="usage border-remove-bottom-right">${item.usage ?? ""}</span>
          </td>`;

    rows.push(`
      <tr class="drug-row">
        <td colspan="2" class="border-remove-left ${item.nameAlign ?? ""}">
          <span class="drug-name">${item.name}</span>
        </td>
        <td class="text-center">${item.dosePerCount}</td>
        <td class="text-center">${item.countPerDay}</td>
        <td class="text-center border-remove-right">${item.days}</td>
        ${usageCell}
      </tr>
    `);
  }

  const injectionMarkers = renderInjectionMarkers(injections, useFormPaper);
  rows.push(`
    <tr class="drug-row">
      <td colspan="5" class="text-center border-remove-left border-remove-bottom-right" style="font-size: 13px;">
        <div style="position: relative;">
          <!-- FIXME: flex 스타일 제거 -->
          <span class="opacity-zero" style="display: flex; justify-content: center;">
            주사제 처방내역 (원내조제 [${inClinicText}], 원외처방 [${outClinicText}])
          </span>
          ${injectionMarkers}
        </div>
      </td>
      <td rowspan="8" class="border-remove-right" style="vertical-align: top;">
        <span class="pharmacy-note">
          ${pharmacyNote.replace(/\n/g, "<br />")}
        </span>
      </td>
    </tr>
  `);

  for (let i = 0; i < MAX_INJECTION_ROWS; i++) {
    const inj = injections[i] ?? emptyInjection;
    rows.push(`
      <tr class="drug-row">
        <td colspan="2" class="border-remove-left ${inj.nameAlign ?? ""}">
          <span class="injection-name">${inj.name}</span>
        </td>
        <td class="text-center">${inj.dosePerCount}</td>
        <td class="text-center">${inj.countPerDay}</td>
        <td class="text-center">${inj.days}</td>
      </tr>
    `);
  }

  rows.push(`
    <tr class="drug-row" style="height: 6.5mm;">
      <td class="text-center border-remove-bottom-left opacity-zero" style="width: 16.5mm">사용기간</td>
      <td class="text-center border-remove-bottom" style="width: 64mm;"><span class="opacity-zero">교부일로부터 ( &nbsp; &nbsp; </span>${validPeriod}<span class="opacity-zero"> &nbsp; &nbsp; ) 일간</span></td>
      <td colspan="4" class="text-center border-remove-bottom-right">
        <span class="opacity-zero" style="font-size: 14px; font-weight: bold;">&nbsp;&nbsp; ※ 사용 기간내에 약국에 제출하여야 합니다.</span>
      </td>
    </tr>
    <tr style="height: 6.4mm;">
      <td colspan="6" class="text-center border-remove-left border-remove-right">
        <span class="space-between opacity-zero" style="font-size: 12px; font-weight: bolder; margin: 0 auto; width: 250px;">
          <span>의</span><span>약</span><span>품</span><span>조</span><span>제</span><span>내</span><span>역</span>
        </span>
      </td>
    </tr>
    <tr>
      <td colspan="6" style="margin: 0; padding: 0;" class="border-remove-bottom-left border-remove-right opacity-zero">
        ${renderDispenseHistoryTable()}
      </td>
    </tr>
  `);

  return rows.join("");
}

function renderDispenseHistoryTable() {
  return `
    <table class="in-table2">
      <tr style="height: 6.2mm;">
        <td rowspan="4" class="text-center border-remove-top-left border-remove-bottom" style="width: 10mm;">
          조<br />제<br />내<br />역
        </td>
        <td class="text-center border-remove-top" style="width: 25mm; font-size: 12px;">조제기관의 명칭</td>
        <td colspan="2" class="border-remove-top"></td>
        <td class="text-center border-remove-top-right">처방의 변경, 수정, 확인 대체 시 그 내용 등</td>
      </tr>
      <tr style="height: 6.2mm;">
        <td class="text-center" style="font-size: 12px;">조 제 약 사</td>
        <td class="text-center" style="width: 8mm; font-size: 10px;">성명</td>
        <td class="border-remove-right" style="width: 56mm;">
          <span style="float: right;">(서명 또는 날인)</span>
        </td>
        <td rowspan="3" class="border-remove-bottom-right"></td>
      </tr>
      <tr style="height: 6.2mm;">
        <td class="text-center" style="font-size: 11px;">조제량(조제일수)</td>
        <td colspan="2"></td>
      </tr>
      <tr style="height: 6.2mm;">
        <td class="text-center border-remove-bottom" style="font-size: 12px;">조 제 년 월 일</td>
        <td colspan="2" class="border-remove-bottom"></td>
      </tr>
    </table>
  `;
}

function renderPrescriptionTable(
  outMedicines: PrescriptionItem[],
  injections: InjectionItem[],
  prescription: KoreanPrescriptionData,
  useFormPaper: boolean,
  leftMargin: number,
) {
  const hospital = prescription.병원 ?? {};
  const patient = prescription.환자 ?? {};
  const issueDateParts = resolveIssueDateParts(prescription.교부번호);
  const insuranceType = parseInsuranceType(prescription.접수?.보험구분);
  const insuranceFlags = mapInsuranceFlagsFromType(insuranceType);
  const insuranceText = getInsuranceText(insuranceFlags);
  const insuranceMarkers = getInsuranceMarkers(insuranceFlags, useFormPaper);
  const insuranceHolderName = ensureString(patient.성명);
  const patientRegistrationNumber = ensureString(patient.주민등록번호 ?? patient.조회용주민번호);
  const issueNumber = issueDateParts.number;
  const hospitalId = ensureString(hospital.요양기관번호);
  const hospitalName = ensureString(hospital.요양기관명);
  const hospitalTel = ensureString(hospital.전화번호 ?? hospital.휴대폰번호);
  const hospitalFax = ensureString(hospital.팩스번호);
  const hospitalEmail = ensureString(hospital.이메일);

  return `
    <table class="table2" style="width: 176mm; margin-top: 1mm; margin-left: ${leftMargin}mm;">
      <tr style="height: 22.5mm;">
        <td colspan="6" style="padding-top: 5mm; position: relative;">
          <div style="position: absolute; top: 7mm;">
            <span style="font-size: 13px;">명칭: </span>
            <div style="display: inline-block; position: absolute; top: -1mm; left: 52mm; width: 80mm; font-size: 24px; font-weight: bolder;">
              <span class="opacity-zero" style="margin-right: 23mm;">처</span>
              <span class="opacity-zero" style="margin-right: 23mm;">방</span>
              <span class="opacity-zero">전</span>
            </div>
            <div style="display: flex; position: absolute; top: 6mm; font-size: 13px;">
              <span style="display: inline-block; width: 140px;">코드: </span>
              <span style="display: inline-block; width: 140px;">증: </span>
              <span style="display: inline-block; width: 140px;">피보험자: ${insuranceHolderName}</span>
              <span style="display: inline-block; width: 180px;">환자연락처: ${formatPhoneNumber(hospitalTel)}</span>
            </div>
            <div style="position: absolute; top: 10mm; width: 173mm;">
              <span class="opacity-zero" style="font-size: 12px;">
                [${insuranceText.medical}] 의료보험 &nbsp;
                [${insuranceText.aid}] 의료급여 &nbsp;
                [${insuranceText.industrial}] 산재보험 &nbsp;
                [${insuranceText.car}] 자동차보험 &nbsp;
                [${insuranceText.etc}] 기타 ( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )
              </span>
              <span style="margin-left: 2mm; font-size: 13px;"><span class="opacity-zero">요양기관기호: </span>${hospitalId}</span>
              ${insuranceMarkers}
            </div>
          </div>
        </td>
      </tr>
      <tr style="height: 6mm;">
        <td class="text-center opacity-zero" style="width: 15mm; font-size: 12px;">교부번호</td>
        <td class="border-remove-right" style="width: 72mm; font-size: 12px;">
          <span style="margin-left: 5mm;">${issueDateParts.year}</span><span class="opacity-zero">년</span>
          <span style="margin-left: 3mm;">${issueDateParts.month}</span><span class="opacity-zero">월</span>
          <span style="margin-left: 4mm;">${issueDateParts.day}</span><span class="opacity-zero" style="margin-left: 0mm;">일 &nbsp; - &nbsp;제 </span>
          <span style="margin-left: 0mm;">${issueNumber}</span><span class="opacity-zero"> 호</span>
        </td>
        <td rowspan="4" class="text-center opacity-zero" style="width: 9mm; font-size: 12px;">의<br />료<br />기<br />관</td>
        <td class="text-center  opacity-zero" style="width: 14mm; font-size: 12px;">명 &nbsp; &nbsp; &nbsp; 칭</td>
        <td style="width: 64mm; font-size: 12px;">${hospitalName}</td>
      </tr>
      <tr style="height: 6mm;">
        <td colspan="2" rowspan="3" style="margin: 0; padding: 0;">
          <table class="in-table2">
            <tr style="height: 9.75mm;">
              <td rowspan="2" class="text-center border-remove-top-left border-remove-bottom opacity-zero" style="width: 10mm; font-size: 12px;">환<br />자</td>
              <td class="text-center border-remove-top opacity-zero" style="width: 27mm; font-size: 12px;">성 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 명</td>
              <td class="border-remove-top-right" style="width: 50mm; font-size: 12px;">${patient.성명 ?? ""}</td>
            </tr>
            <tr style="height: 9.75mm;">
              <td style="width: 27mm; font-size: 12px;" class="text-center border-remove-bottom opacity-zero">주민등록번호</td>
              <td style="width: 50mm; font-size: 12px;" class="border-remove-bottom-right">${formatRrnNumber(patientRegistrationNumber)}</td>
            </tr>
          </table>
        </td>
        <td class="text-center opacity-zero" style="font-size: 12px;">전화번호</td>
        <td style="font-size: 12px;">${formatPhoneNumber(hospitalTel)}</td>
      </tr>
      <tr style="height: 6mm;">
        <td class="text-center opacity-zero" style="font-size: 12px;">팩스번호</td>
        <td style="font-size: 12px;">${formatPhoneNumber(hospitalFax)}</td>
      </tr>
      <tr style="height: 6mm;">
        <td class="text-center opacity-zero" style="font-size: 9px;">e-mail 주소</td>
        <td style="font-size: 12px;">${hospitalEmail}</td>
      </tr>
      <tr>
        <td colspan="6" style="margin: 0; padding: 0;">
          ${renderDiseaseCodeTable(prescription)}
        </td>
      </tr>
      <tr style="height: 6.5mm;">
        <td colspan="6" class="opacity-zero">
          <span>&nbsp;&nbsp; ※ 환자의 요구가 있는 때에는 질병분류기호를 기재하지 아니합니다.</span>
        </td>
      </tr>
      <tr>
        <td colspan="6" style="margin: 0; padding: 0;">
          <table class="in-table2">
            ${renderPrescriptionRows(outMedicines, injections, prescription, useFormPaper)}
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * SVG base64에 viewBox를 주입합니다.
 * viewBox가 없으면 Canvas.drawImage()가 intrinsic 크기(340px)로만 렌더링하므로,
 * 인라인 스크립트의 680px Canvas 렌더링이 효과를 발휘하려면 viewBox가 필수.
 * 자세한 배경은 build-prescription-html-client.ts의 svgBase64ToHighResPng 주석 참고.
 */
function prepareSvgBase64(base64: string): string {
  try {
    let svg = Buffer.from(base64, 'base64').toString('utf-8');

    // 외부 SVG에 viewBox 추가 (없는 경우)
    const hasViewBox = /^[^>]*viewBox/i.test(svg.match(/<svg[^>]*>/)?.[0] ?? '');
    if (!hasViewBox) {
      svg = svg.replace(
        /<svg\s+width="(\d+)"\s+height="(\d+)"/i,
        '<svg viewBox="0 0 $1 $2" width="$1" height="$2"',
      );
    }

    return Buffer.from(svg, 'utf-8').toString('base64');
  } catch {
    return base64;
  }
}

function renderQrCode(qrCodeImage?: string) {
  if (!qrCodeImage) return "";

  const style = "width: 30mm; height: 30mm; display: block;";

  // SVG data URL이면 viewBox 추가 후 svg-to-png 마커 부여
  const svgMatch = qrCodeImage.match(/^data:image\/svg\+xml;base64,(.+)$/);
  if (svgMatch?.[1]) {
    const prepared = prepareSvgBase64(svgMatch[1]);
    return `
      <div style="position: absolute; top: 195mm; left: 150mm;">
        <img class="svg-to-png" src="data:image/svg+xml;base64,${prepared}" style="${style}" alt="" onerror="this.style.display='none'" />
      </div>
    `;
  }

  return `
    <div style="position: absolute; top: 195mm; left: 150mm;">
      <img src="${qrCodeImage}" style="${style}" alt="" onerror="this.style.display='none'" />
    </div>
  `;
}

//FIXME: 바코드 위치 조절
function renderBarcode(barcode?: BarcodeData | null) {
  const imageBase64 = barcode?.이미지;
  if (!imageBase64) return "";

  const size = toMmCss(barcode?.크기, 24);
  const top = toMmCss(barcode?.위치위, 210);
  const left = toMmCss(barcode?.위치옆, 165);

  const prepared = prepareSvgBase64(imageBase64);
  const style = "width: 100%; height: 100%; display: block;";

  return `
    <div style="position: absolute; top: ${top}; left: ${left}; width: ${size}; height: ${size};">
      <img
        class="svg-to-png"
        src="data:image/svg+xml;base64,${prepared}"
        style="${style}"
        alt=""
        onerror="this.style.display='none'"
      />
    </div>
  `;
}

function renderPage(prescription: KoreanPrescriptionData, _pageIndex: number, outMedicines: PrescriptionItem[], injections: InjectionItem[], options: BuildOptions) {
  const useFormPaper = options.useFormPaper ?? true;
  const leftMargin = DEFAULT_LEFT_MARGIN;
  const topMargin = DEFAULT_TOP_MARGIN;
  const pageClass = useFormPaper ? "A4" : "A4 form-prescription";
  const headerAddress = composeHospitalAddress(prescription.병원);
  const purposeText = ensureString(DEFAULT_PURPOSE);
  const purpose = purposeText ? `(${purposeText})` : "";
  const qrCodeImage = options.qrCodeImage ?? undefined;
  const barcode = prescription.바코드;

  return `
    <div class="${pageClass}">
      <div class="space-between" style="width: 174mm; margin-top: ${topMargin}mm; margin-left: ${leftMargin}mm; display: inline-flex;">
        <span class="opacity-zero">[별지 제10호 서식]</span>
        <span>${headerAddress}</span>
        <span>${purpose}</span>
      </div>
      ${renderPrescriptionTable(outMedicines, injections, prescription, useFormPaper, leftMargin)}
      ${renderQrCode(qrCodeImage)}
      ${renderBarcode(barcode)}
    </div>
  `;
}

export function buildPrescriptionHtml(prescription: KoreanPrescriptionData, options: BuildOptions = {}) {
  const css = getDocumentCss();
  const useFormPaper = options.useFormPaper ?? true;
  const showSpaceRow = options.showSpaceRow ?? true;
  const showBackgroundImage = options.showBackgroundImage ?? false;
  const { outMedicines, injections } = splitKoreanOrders(prescription);
  const outPaginator = chunkItems(outMedicines, MAX_OUT_MED_ROWS, emptyOutMedicine, showSpaceRow);
  const injectionPaginator = chunkItems(injections, MAX_INJECTION_ROWS, emptyInjection, false);

  const totalPages = getTotalPages(outMedicines, injections);
  const pages: string[] = [];

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    pages.push(
      renderPage(
        prescription,
        pageIndex,
        outPaginator(pageIndex),
        injectionPaginator(pageIndex),
        options,
      ),
    );
  }

  const backgroundDataUrl = getFormBackgroundDataUrl();
  const backgroundOverride = showBackgroundImage && backgroundDataUrl
    ? `.A4 { background-image: url("${backgroundDataUrl}"); background-size: contain; background-repeat: no-repeat; }`
    : ".A4 { background-image: none !important; }";

  const highlightOverride = showBackgroundImage
    ? `
      .table2 td { border: 1px dashed red; }
      .A4, .A4 * { color: blue; }
    `
    : "";

  const formPaperOverride = useFormPaper
    ? `
      .opacity-zero { opacity: 0 !important; }
      .table2 td { border: 1px solid transparent; }
    `
    : `
      .opacity-zero { opacity: 1 !important; }
      .table2 td { border: 1px solid #000; }
    `;

  const baseOverride = `
    :root, html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      background: white;
      font-family: ${LEGACY_FONT};
      font-size: 14px;
    }

    [data-print-root="true"] {
      display: block !important;
    }

    .A4 {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      page-break-after: always;
    }
    @page { size: A4; margin: 0; }
    ${backgroundOverride}
    ${formPaperOverride}
    ${highlightOverride}
  `;

  return `
    <div data-print-root="true">
      <style>
        ${css}
        ${baseOverride}
      </style>
      ${pages.join("")}
      ${SVG_TO_PNG_SCRIPT}
    </div>
  `;
}

export function getMockPrescription(): KoreanPrescriptionData {
  return {
    교부번호: "2025121100003",
    조제시참고사항: "여기는 조제시 참고사항",
    바코드: {
      크기: "24mm",
      위치위: "210mm",
      위치옆: "165mm",
      // NOTE: 서버에서 내려오는 base64(svg) 문자열이 들어갑니다.
      이미지: null,
    },
    병원: {
      요양기관명: "UB의원",
      요양기관명영문: "UB Clinic",
      요양기관번호: "99350001",
      주소1: "서울 영등포구 여의대로 108",
      주소2: "타워2 30F 유비케어 ",
      주소1영문: "108 Yeouidaero, Yeongdeungpo-gu, Seoul",
      주소2영문: "Tower 2, 30F UBcare",
      우편번호: "07335",
      전화번호: "0221055000",
      휴대폰번호: "01012345678",
      팩스번호: "0221055001",
      대표자명: "홍길동2",
      대표자명영문: "Hong Gildong",
      이메일: "contact@ubclinic.co.kr",
    },
    환자: {
      성명: "박성훈",
      주민등록번호: "8101211234567",
      조회용주민번호: "8101211",
    },
    접수: {
      보험구분: "1:의료보험",
    },
    의사: {
      이름: "홍길동",
      이름영문: "Hong Gildong",
      면허번호: "123456",
    },
    상병목록: [
      {
        코드: "J00",
      },
      {
        코드: "R1049",
      },
    ],
    원외약품처방목록: [
      {
        페이지: 1,
        목록: [
          {
            청구코드: "055500130",
            명칭: "아타칸정32밀리그램(칸데사르탄실렉세틸)_(32mg/1정)",
            투여량1회: "1",
            투여횟수1일: "1",
            총투약일수: "1",
            용법: "식후 30분에 복용",
          },
          {
            청구코드: "623006330",
            명칭: "세비칸정5/20밀리그램_(1정)",
            투여량1회: "1",
            투여횟수1일: "1",
            총투약일수: "1",
            용법: "1일 1회!!!",
          },
          {
            청구코드: "055500130",
            명칭: "아타칸정32밀리그램(칸데사르탄실렉세틸)_(32mg/1정)",
            투여량1회: "1",
            투여횟수1일: "1",
            총투약일수: "1",
            용법: "천천히",
          },
        ],
      },
    ],
    주사제처방내역원내조제여부: false,
    주사제처방내역원외처방여부: true,
    주사제처방목록: [
      {
        페이지: 1,
        목록: [
          {
            청구코드: "050400021",
            명칭: "옵디보주20mg(니볼루맙,유전자재조합)_(20mg/2mL)",
            투여량1회: "1",
            투여횟수1일: "1",
            총투약일수: "1",
            용법: "정맥주사, 천천히 투여",
          },
          {
            청구코드: "050400021",
            명칭: "옵디보주20mg(니볼루맙,유전자재조합)_(20mg/2mL)",
            투여량1회: "1",
            투여횟수1일: "1",
            총투약일수: "1",
            용법: "정맥주사, 천천히 투여",
          },
        ],
      },
    ],
    사용기간: "14",
  };
}

export function wrapPrintableHtml(html: string) {
  if (html.includes('data-print-root="true"')) return html;
  if (html.includes("data-print-preview-root")) {
    return html.replace(/data-print-preview-root/g, 'data-print-root="true"');
  }
  return `<div data-print-root="true">${html}</div>`;
}

