"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { initializePosPrinter } from "@/lib/label-printer";
import {
  printMedicalRecordLocal,
  printMedicalRecordImageViaApi,
  renderMedicalRecord,
} from "@/lib/medical-record";
import { formatDateByPattern } from "@/lib/date-utils";
import { getGender } from "@/lib/patient-utils";
import type { 진료기록부데이터, 진료기록부처방 } from "@/lib/medical-record";
import { InputType } from "@/types/chart/order-types";

const DEMO_ORDERS: 진료기록부처방[] = [
  { 입력구분: InputType.묶음헤더, 명칭: "[묶음] 수액처치 묶음 (긴 이름 테스트: 포도당주사액 + 비타민B군 혼합수액세트)", 용량: "", 일투: "", 일수: "", 용법: "" },
  { 입력구분: InputType.일반, 명칭: "푸르설타민주(마늘주)", 용량: "1", 일투: "1", 일수: "1", 용법: "1일 2회 복용" },
  { 입력구분: InputType.일반, 명칭: "지씨비타오(B5)", 용량: "1", 일투: "1", 일수: "1", 용법: "" },
  { 입력구분: InputType.지시오더, 명칭: "[지시] 수액 투여 속도 60ml/hr로 조절, 환자 상태 관찰 후 속도 조절 가능", 용량: "", 일투: "", 일수: "", 용법: "" },
  { 입력구분: InputType.일반, 명칭: "메가비타식스(B6)", 용량: "4", 일투: "1", 일수: "1", 용법: "1일 1회 복용" },
  { 입력구분: InputType.일반, 명칭: "데노간주", 용량: "1", 일투: "1", 일수: "1", 용법: "" },
  { 입력구분: InputType.일반, 명칭: "지씨비타일이(B12)", 용량: "1", 일투: "1", 일수: "1", 용법: "1일 3회 복용" },
];

export default function MedicalRecordDemoPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [printerName, setPrinterName] = useState("Printer2");
  const [testResult, setTestResult] = useState<string | null>(null);

  const [chartNumber, setChartNumber] = useState("17");
  const [patientName, setPatientName] = useState("조연숙");
  const [gender, setGender] = useState<number>(2);
  const [age, setAge] = useState("54");
  const [birthDate, setBirthDate] = useState("701116");
  const [doctorName, setDoctorName] = useState("김현호");

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [isRendering, setIsRendering] = useState(false);
  const isPrintDisabled = !printerName || !sdkLoaded;

  useEffect(function initializeSdk() {
    initializePosPrinter()
      .then(() => setSdkLoaded(true))
      .catch((error) => {
        console.error("POS 프린터 SDK 스크립트 로드 실패:", error);
      });
  }, []);

  const medicalRecordData = useMemo(() => {
    return buildDemoMedicalRecordData({
      chartNumber,
      patientName,
      gender,
      age,
      birthDate,
      doctorName,
      orders: DEMO_ORDERS,
    });
  }, [age, birthDate, chartNumber, doctorName, gender, patientName]);

  useEffect(function updatePreview() {
    async function render() {
      setIsRendering(true);
      const startTime = performance.now();
      try {
        const dataUrl = await renderMedicalRecord(medicalRecordData);
        const endTime = performance.now();
        setImagePreviewUrl(dataUrl);
        setRenderTime(Math.round(endTime - startTime));
      } catch (error) {
        console.error("렌더링 오류:", error);
      } finally {
        setIsRendering(false);
      }
    }
    render();
  }, [medicalRecordData]);

  const handleLocalPrint = async () => {
    if (!printerName) {
      setTestResult("프린터 이름을 입력해주세요.");
      return;
    }

    setTestResult("로컬 출력 중...");
    try {
      const result = await printMedicalRecordLocal(printerName, medicalRecordData, {
        copies: 1,
      });
      setTestResult(`[로컬] ${result.message}`);
    } catch (error) {
      setTestResult(`[로컬] 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  };

  const handleAgentPrint = async () => {
    setTestResult("에이전트 출력 요청 중...");
    try {
      const result = await printMedicalRecordImageViaApi(medicalRecordData, {
        copies: 1,
      });
      setTestResult(`[에이전트] ${result.message}`);
    } catch (error) {
      setTestResult(`[에이전트] 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">진료기록부 출력 데모</h1>
        <p className="text-muted-foreground">
          SRP-350III POS 프린터용 진료기록부 출력 테스트 페이지입니다. (HTML 렌더러 사용)
        </p>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">SDK 상태</h2>
        <div className="flex items-center gap-4">
          <span className={sdkLoaded ? "text-green-600" : "text-orange-500"}>
            {sdkLoaded ? "✓ POS SDK 로드 완료" : "⏳ POS SDK 로딩 중..."}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          로컬 출력은 Web Print SDK App이 localhost:18080에서 실행 중이어야 합니다. (POS 프린터)
        </p>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">프린터 설정</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">로컬 프린터 (SDK Logical Name)</label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="예: Printer1"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            SDK App에서 등록한 Logical Name을 입력하세요.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">진료기록부 데이터</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">차트번호</label>
            <input
              type="text"
              value={chartNumber}
              onChange={(e) => setChartNumber(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">환자명</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">성별</label>
            <select
              value={gender}
              onChange={(e) => setGender(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value={1}>남</option>
              <option value={2}>여</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">나이</label>
            <input
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">생년월일 (조회용주민번호)</label>
            <input
              type="text"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">진료의</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">미리보기</h2>
        <div className="rounded-lg bg-gray-100 p-4">
          {isRendering ? (
            <div className="flex h-[400px] w-[576px] items-center justify-center border border-gray-300 bg-white text-muted-foreground">
              렌더링 중...
            </div>
          ) : imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Medical Record Preview"
              className="border border-gray-300 bg-white"
              style={{ width: 576, height: "auto" }}
            />
          ) : (
            <div className="flex h-[400px] w-[576px] items-center justify-center border border-gray-300 bg-white text-muted-foreground">
              로딩 중...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>렌더러: <strong>HTML (html-to-image)</strong></span>
          <span>•</span>
          <span>렌더링 시간: {renderTime}ms</span>
          <span>•</span>
          <span>폭 576 dots 기준</span>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">테스트 출력</h2>
        <div className="flex gap-2">
          <Button onClick={handleLocalPrint} disabled={isPrintDisabled}>
            로컬 테스트 출력
          </Button>
          <Button onClick={handleAgentPrint} variant="outline">
            에이전트 테스트 출력
          </Button>
        </div>
        {testResult && (
          <div className="rounded-md border bg-muted/50 p-3">
            <span className="text-sm">{testResult}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function buildDemoMedicalRecordData(params: {
  chartNumber: string;
  patientName: string;
  gender: number;
  age: string;
  birthDate: string;
  doctorName: string;
  orders: 진료기록부처방[];
}): 진료기록부데이터 {
  const 출력일자 = formatDateByPattern(new Date(), "YYYY-MM-DD");
  const 출력시간 = formatDateByPattern(new Date(), "HH:mm:ss");
  const 성별텍스트 = getGender(params.gender, "ko");
  const 교부번호 = `${출력일자} 제 010376호`;

  return {
    헤더: {
      출력일자,
      출력시간,
      교부번호,
    },
    환자: {
      번호: params.chartNumber,
      성명: params.patientName,
      성별: 성별텍스트,
      나이: params.age,
      생년월일: params.birthDate,
    },
    의사이름: params.doctorName,
    처방목록: params.orders,
  };
}
