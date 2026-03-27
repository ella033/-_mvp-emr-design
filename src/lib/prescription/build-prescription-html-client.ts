import { formatRrnNumber } from "../common-utils";
import { formatPhoneNumber } from "../patient-utils";

const MAX_OUT_MED_ROWS = 13;
const MAX_INJECTION_ROWS = 7;
const DEFAULT_LEFT_MARGIN = 17;
const DEFAULT_TOP_MARGIN = 22.5;
const LEGACY_FONT = `"Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, Helvetica, sans-serif`;

/**
 * ─── SVG QR/바코드 → 고해상도 PNG 변환 ───
 *
 * ## 문제
 * 서버에서 전달받는 QR/바코드는 SVG base64 형식이다.
 * SVG는 벡터이므로 이론상 어떤 크기에서든 선명해야 하지만,
 * HTML에서 <img src="data:image/svg+xml;base64,..."> 로 삽입하면
 * 브라우저가 SVG를 **CSS 픽셀 크기 기준으로 한 번만 래스터화(비트맵화)** 한다.
 *
 * 처방전의 바코드 컨테이너는 24mm (≈91px @96dpi) 인데,
 * QR 코드 내부 모듈은 97×97개이므로 모듈당 0.94px밖에 안 된다.
 * 1px 미만(sub-pixel)의 검정 선은 anti-aliasing되어 **회색**으로 렌더링되고,
 * 결과적으로 QR 코드가 흐릿하고 연하게 보인다.
 *
 * ## 왜 <img> 안의 SVG가 벡터 장점을 못 살리는가
 * <img> 태그 안의 SVG는 브라우저에게 "외부 이미지"로 취급된다.
 * 브라우저는 이 SVG를 CSS 박스 크기(91px)로 래스터화한 뒤 비트맵으로 캐시하고,
 * 프린트(Ctrl+P → PDF) 시에도 이 저해상도 비트맵을 그대로 PDF에 삽입한다.
 * 즉, 프린터가 300dpi를 지원해도 SVG의 벡터 해상도를 활용하지 못한다.
 *
 * ## 시도한 접근들 (효과 없었음)
 * - viewBox 추가: 브라우저가 여전히 CSS 크기 기준으로 래스터화
 * - 인라인 SVG: 화면 96dpi에서는 물리 픽셀 한계로 동일하게 흐림,
 *               Ctrl+P → PDF에서도 Chrome이 CSS 픽셀 해상도로 합성
 * - <object> 태그: <img>와 동일한 래스터화 문제
 * - shape-rendering: crispEdges + stroke-width 증가: 눈에 띄는 차이 없음
 * - image-rendering: pixelated/crisp-edges CSS: 미미한 차이
 * - CSS transform: scale(4) 후 축소: 브라우저가 최종 표시 크기로 최적화
 *
 * ## 해결: Canvas 고해상도 PNG 변환
 * Canvas API로 SVG를 680×680px에 렌더링하면 모듈당 ~6.2px가 되어
 * 충분히 선명한 검정 픽셀로 표현된다. 이 PNG를 <img src>에 넣으면
 * 24mm 표시 시 680→91px 다운스케일이 일어나지만, 원본이 고해상도이므로
 * 화면과 프린트 모두에서 선명하게 출력된다.
 *
 * ## 참고
 * - 서버 SVG의 외부 <svg>에 viewBox가 없는 것이 근본 원인 중 하나.
 *   viewBox가 없으면 Canvas.drawImage도 intrinsic 크기(340px)로만 렌더링하므로,
 *   prepareSvgBase64()에서 viewBox를 주입한 뒤 Canvas에 그려야 680px 해상도를 얻는다.
 * - 서버 사이드(buildHtml.ts)에서는 Canvas API가 없으므로 인라인 <script>로 처리.
 */
const SVG_TO_PNG_SIZE = 1024;

async function svgBase64ToHighResPng(base64: string): Promise<string> {
  const prepared = prepareSvgBase64(base64);
  const svgDataUrl = `data:image/svg+xml;base64,${prepared}`;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = SVG_TO_PNG_SIZE;
        c.height = SVG_TO_PNG_SIZE;
        const ctx = c.getContext('2d');
        if (!ctx) { resolve(svgDataUrl); return; }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, SVG_TO_PNG_SIZE, SVG_TO_PNG_SIZE);
        ctx.drawImage(img, 0, 0, SVG_TO_PNG_SIZE, SVG_TO_PNG_SIZE);
        resolve(c.toDataURL('image/png'));
      } catch {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

const PRESCRIPTION_CSS = `
body {
  background-color: #ddd;
  font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, Helvetica, sans-serif;
  font-size: 14px;
  height: 100%;
  margin: 0;
  padding: 0;
  width: 100%;
}

* {
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  font-family: inherit;
}

.A4 {
  background: #fff;
  position: relative;
  width: 210mm;
  height: 297mm;
  padding: 0;
  margin: 0;
}

.paper-tail {
  width: 210mm;
  position: absolute;
  bottom: 0;
  text-align: center;
}

@page {
  margin: 0;
  margin-top: -1px;
  size: A4;
}

@media print {
  html,
  body {
    background: #fff;
    height: 297mm;
    width: 210mm;
  }

  .A4 {
    background: initial;
    border: initial;
    border-radius: initial;
    box-shadow: initial;
    margin: 0;
    min-height: initial;
    page-break-after: always;
    width: initial;
  }
}

table {
  border-collapse: collapse;
}

.table {
  margin-bottom: 5px;
  width: 100%;
}

.table th {
  background-color: #e6e6e6;
  border: 1px solid;
  Line-height: 140%;
  padding: 2px;
  text-align: center;
}

.table td {
  border: 1px solid;
  
  Line-height: 140%;
  padding: 2px;
  text-align: left;
}

.table2 {
  margin-bottom: 5px;
  width: 100%;
}

.table2 th {
  background-color: #e6e6e6;
  border: 1px solid;
  line-height: 140%;
  padding: 2px;
  text-align: center;
}

.table2 td {
  border: 1px solid;
  
  line-height: 130%;
  padding: 2px;
  text-align: left;
}

.in-table {
  width: 100%;
}

.in-table td {
  border: 1px solid;
  
  Line-height: 140%;
  padding: 2px;
  text-align: left;
}

.in-table2 {
  width: 100%;
}

.in-table2 td {
  border: 1px solid;
  
  padding: 2px;
  text-align: left;
}

.border-remove-top-left {
  border-left: none !important;
  border-top: none !important;
}

.border-remove-left {
  border-left: none !important;
}

.border-remove-right {
  border-right: none !important;
}

.border-remove-top-right {
  border-right: none !important;
  border-top: none !important;
}

.border-remove-top-bottom {
  border-bottom: none !important;
  border-top: none !important;
}

.border-remove-bottom {
  border-bottom: none !important;
}

.border-remove-bottom-left {
  border-bottom: none !important;
  border-left: none !important;
}

.border-remove-bottom-right {
  border-bottom: none !important;
  border-right: none !important;
}

.border-remove-top {
  border-top: none !important;
}

.table-noline td,
.table-noline th {
  padding: 2px;
  text-align: left;
}

.table-info tr {
  border-left: 1px solid;
  border-right: 1px solid;
}

.table-info th {
  font-weight: bold;
  padding-top: 2px;
  vertical-align: top;
  width: 15px;
}

.table-info td {
  font-size: 12px;
  
  Line-height: 140%;
  padding: 2px;
  text-align: left;
}

.keep-together {
  page-break-inside: avoid;
}

.break-before {
  page-break-before: always;
}

.break-after {
  page-break-after: always;
}

.center {
  text-align: center !important;
}

.br {
  display: block;
  margin-bottom: 10px;
}

.space-between {
  display: flex;
  justify-content: space-between;
}

.text-center {
  text-align: center !important;
}

.dis-code-cell {
  width: 10.3mm;
  font-size: 12px;
  text-align: center !important;
}

.drug-row {
  height: 6.3mm;
  font-size: 12px;
}

.sign {
  height: auto;
  max-height: 37px;
  max-width: 90px;
  width: auto;
}

.form-prescription {
  background-image: url("/images/prescription-form.jpg");
  background-size: contain;
  background-repeat: no-repeat;
}

.check-marker-div {
  position: absolute;
  font-weight: bold;
}

.pharmacy-note {
  display: inline-block;
  font-size: 12px;
  word-break: break-all;
  max-width: 55mm;
  max-height: 48mm;
  overflow: hidden;
}

.usage {
  display: inline-block;
  word-break: break-all;
  max-width: 55mm;
  max-height: 4mm;
  overflow: hidden;
  line-height: 1;
  vertical-align: middle;
}

.drug-name,
.injection-name {
  display: table-cell;
  max-width: 79mm;
  width: 79mm;
  white-space: nowrap;
  text-align: left;
  overflow: hidden;
  padding-left: 38px;
}

.space-row-center {
  padding-left: 0 !important;
  text-align: center !important;
}

.space-row-center .drug-name,
.space-row-center .injection-name {
  padding-left: 0 !important;
  text-align: center !important;
}
`;

export type InsuranceFlags = {
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
  purposeLabel?: PrescriptionPurposeLabel;
};

// ... (다른 타입 정의들은 생략하거나 필요에 따라 추가)
export type KoreanPrescriptionData = {
  교부번호?: string | null;
  조제시참고사항?: string | null;
  바코드?: {
    크기?: string | number | null;
    위치위?: string | number | null;
    위치옆?: string | number | null;
    이미지?: string | null;
  } | null;
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
    직인이미지Base64?: string | null;
    직인이미지?: string | null;
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

export enum PrescriptionPurposeLabel {
  Pharmacy = "약국제출용",
  Patient = "환자보관용",
}

const DEFAULT_PURPOSE = PrescriptionPurposeLabel.Pharmacy;

// FIXME: trim 처리 추가하면 좋을까?
function ensureString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value === "null" ? fallback : value;
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

function getDocumentCss(): string {
  return PRESCRIPTION_CSS;
}

function getFormBackgroundDataUrl(): string | null {
  // 클라이언트 사이드에서는 public 폴더의 경로를 직접 반환
  return "/images/prescription-form.jpg";
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
          nameAlign: "space-row-center",
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

function renderDoctorSign(직인이미지Base64?: string) {
  const signText = '<span class="opacity-zero" style="font-size: 9px; position: absolute; top: 3.5mm; left: 25mm;">(서명 또는 날인)</span>';

  if (!직인이미지Base64) {
    return signText;
  }

  // base64 이미지가 이미 data URL 형식이면 그대로 사용, 아니면 data:image/jpg;base64, 추가
  const src = 직인이미지Base64.startsWith('data:') ? 직인이미지Base64 : `data:image/jpg;base64, ${직인이미지Base64}`;

  // 서명 이미지는 텍스트 위에 absolute로 얹어지며, "(서명 또는 날인)" 텍스트의 가운데에 위치
  // 텍스트가 left: 25mm에서 시작하고 약 15mm 너비이므로 중심은 약 32.5mm
  const signImage = `
    <span style="position: absolute; top: -2.5mm; left: 32.5mm; transform: translateX(-50%);">
      <img src="${src}" alt="sign" class="sign" />
    </span>
  `;

  return signText + signImage;
}

function renderDiseaseCode(code: string, seq: number) {
  return code.length > seq ? code.charAt(seq) : "";
}

function renderDiseaseCodeTable(prescription: KoreanPrescriptionData) {
  const diseaseMain = ensureString(prescription.상병목록?.[0]?.코드);
  const diseaseSub = ensureString(prescription.상병목록?.[1]?.코드);
  const doctorName = ensureString(prescription.의사?.이름);
  const doctorLicenseType = "의사";
  const doctorLicenseNumber = ensureString(prescription.의사?.면허번호);
  const doctorSignImage = prescription.의사?.직인이미지Base64 || undefined;

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
        <td class="border-remove-top-right" style="width: 44mm; font-size: 12px;"><div class="opacity-zero" style="margin-left: 2px; text-align: center;">${doctorLicenseType}</div></td>
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
        }" style="font-size: 11px; padding-left: 5px;">
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
          <span class="opacity-zero" style="float: right;">(서명 또는 날인)</span>
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
              <!-- FIXME: 환자연락처가 필요해지면 주석을 해제해서 다시 추가할 것 -->
              <!-- <span style="display: inline-block; width: 180px;">환자연락처: ${formatPhoneNumber(hospitalTel)}</span> -->
            </div>
            <div style="position: absolute; top: 10mm; width: 173mm;">
              <span class="opacity-zero" style="font-size: 12px;">
                [${insuranceText.medical}] 의료보험 &nbsp;
                [${insuranceText.aid}] 의료급여 &nbsp;
                [${insuranceText.industrial}] 산재보험 &nbsp;
                [${insuranceText.car}] 자동차보험 &nbsp;
                [${insuranceText.etc}] 기타 ( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )
              </span>
              <span style="margin-left: 15mm; font-size: 13px;"><span class="opacity-zero">요양기관기호: </span>${hospitalId}</span>
              ${insuranceMarkers}
            </div>
          </div>
        </td>
      </tr>
      <tr style="height: 6mm;">
        <td class="text-center opacity-zero" style="width: 15mm; font-size: 12px;">교부번호</td>
        <td class="border-remove-right" style="width: 72mm; font-size: 12px;">
          <span style="margin-left: 4mm;">${issueDateParts.year}</span><span class="opacity-zero">년</span>
          <span style="margin-left: 2mm;">${issueDateParts.month}</span><span class="opacity-zero">월</span>
          <span style="margin-left: 3mm;">${issueDateParts.day}</span><span class="opacity-zero" style="margin-left: 0mm;">일 &nbsp; - &nbsp;제 </span>
          <span style="margin-left: 3mm;">${issueNumber}</span><span class="opacity-zero"> 호</span>
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
 *
 * 서버에서 내려오는 QR/바코드 SVG의 외부 <svg>에는 viewBox가 없고
 * width="340" height="340"만 있다. viewBox가 없으면 Canvas.drawImage()가
 * SVG를 intrinsic 크기(340px)로만 렌더링하므로, 680px Canvas에 그려도
 * 340px 비트맵을 확대한 것에 불과하다.
 * viewBox="0 0 340 340"을 추가하면 SVG가 해상도 독립적으로 선언되어
 * Canvas가 목표 크기(680px)에 맞춰 벡터 렌더링할 수 있게 된다.
 */
function prepareSvgBase64(base64: string): string {
  try {
    let svg = atob(base64);

    // 외부 SVG에 viewBox 추가 (없는 경우)
    const hasViewBox = /^[^>]*viewBox/i.test(svg.match(/<svg[^>]*>/)?.[0] ?? '');
    if (!hasViewBox) {
      svg = svg.replace(
        /<svg\s+width="(\d+)"\s+height="(\d+)"/i,
        '<svg viewBox="0 0 $1 $2" width="$1" height="$2"',
      );
    }

    return btoa(svg);
  } catch {
    return base64;
  }
}

async function renderQrCode(qrCodeImage?: string) {
  if (!qrCodeImage) return "";

  const style = "width: 30mm; height: 30mm; display: block;";

  // SVG data URL이면 고해상도 PNG로 변환
  const svgMatch = qrCodeImage.match(/^data:image\/svg\+xml;base64,(.+)$/);
  if (svgMatch?.[1]) {
    const pngDataUrl = await svgBase64ToHighResPng(svgMatch[1]);
    return `
      <div style="position: absolute; top: 195mm; left: 150mm;">
        <img src="${pngDataUrl}" style="${style}" alt="" onerror="this.style.display='none'" />
      </div>
    `;
  }

  return `
    <div style="position: absolute; top: 195mm; left: 150mm;">
      <img src="${qrCodeImage}" style="${style}" alt="" onerror="this.style.display='none'" />
    </div>
  `;
}

async function renderBarcode(barcode?: KoreanPrescriptionData["바코드"]) {
  const imageBase64 = barcode?.이미지;
  if (!imageBase64) return "";

  const size = toMmCss(barcode?.크기, 24);
  const top = toMmCss(barcode?.위치위, 210);
  const left = toMmCss(barcode?.위치옆, 165);

  const pngDataUrl = await svgBase64ToHighResPng(imageBase64);
  const style = "width: 100%; height: 100%; display: block;";

  return `
    <div style="position: absolute; top: ${top}; left: ${left}; width: ${size}; height: ${size};">
      <img
        src="${pngDataUrl}"
        style="${style}"
        alt=""
        onerror="this.style.display='none'"
      />
    </div>
  `;
}

async function renderPage(prescription: KoreanPrescriptionData, _pageIndex: number, outMedicines: PrescriptionItem[], injections: InjectionItem[], options: BuildOptions) {
  const useFormPaper = options.useFormPaper ?? true;
  const leftMargin = DEFAULT_LEFT_MARGIN;
  const topMargin = DEFAULT_TOP_MARGIN;
  const pageClass = useFormPaper ? "A4" : "A4 form-prescription";
  const headerAddress = composeHospitalAddress(prescription.병원);
  const purposeText = ensureString(options.purposeLabel ?? DEFAULT_PURPOSE);
  const purpose = purposeText ? `(${purposeText})` : "";
  const qrCodeImage = options.qrCodeImage ?? undefined;
  const barcode = prescription.바코드;

  const [qrHtml, barcodeHtml] = await Promise.all([
    renderQrCode(qrCodeImage),
    renderBarcode(barcode),
  ]);

  return `
    <div class="${pageClass}">
      <div class="space-between" style="width: 174mm; margin-top: ${topMargin}mm; margin-left: ${leftMargin}mm; display: inline-flex;">
        <span class="opacity-zero">[별지 제10호 서식]</span>
        <span>${headerAddress}</span>
        <span>${purpose}</span>
      </div>
      ${renderPrescriptionTable(outMedicines, injections, prescription, useFormPaper, leftMargin)}
      ${qrHtml}
      ${barcodeHtml}
    </div>
  `;
}

export async function buildPrescriptionHtml(prescription: KoreanPrescriptionData, options: BuildOptions = {}) {
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
      await renderPage(
        prescription,
        pageIndex,
        outPaginator(pageIndex),
        injectionPaginator(pageIndex),
        options,
      ),
    );
  }

  const backgroundUrl = getFormBackgroundDataUrl();
  const backgroundOverride = showBackgroundImage && backgroundUrl
    ? `.A4 { background-image: url("${backgroundUrl}"); background-size: contain; background-repeat: no-repeat; }`
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

  return `<!DOCTYPE html>
    <div data-print-root="true">
      <style>
        ${css}
        ${baseOverride}
      </style>
      ${pages.join("")}
    </div>
  `;
}

export function wrapPrintableHtml(html: string) {
  if (html.includes('data-print-root="true"')) return html;
  if (html.includes("data-print-preview-root")) {
    return html.replace(/data-print-preview-root/g, 'data-print-root="true"');
  }
  return `<div data-print-root="true">${html}</div>`;
}
