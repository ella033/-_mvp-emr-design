"use client";

/**
 * 환자 라벨 출력 데모 페이지
 *
 * 개발/테스트용 페이지입니다.
 * - 로컬 방식: 라벨 프린터 SDK 출력 (HTML 렌더러)
 * - API 방식: HTML 렌더링 → API 전송 (원격 출력)
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  initializeLabelPrinter,
  printPatientLabelImageViaApi,
  printPatientLabelLocal,
  renderLabelToDataUrlHtml,
  renderLabelToBase64Html,
  getCurrentPrintDateTime,
} from "@/lib/label-printer";
import type { Gender, LabelData } from "@/lib/label-printer";

export default function PatientLabelDemoPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // SDK App의 Logical Name 사용 (기본값: Printer1)
  const [printerName, setPrinterName] = useState("Printer1");

  // 미리보기용 상태
  const [previewChartNumber, setPreviewChartNumber] = useState("17");
  const [previewName, setPreviewName] = useState("조연숙");
  const [previewBirthDate, setPreviewBirthDate] = useState("1970-11-16");
  const [previewGender, setPreviewGender] = useState<Gender>("F");
  const [previewAge, setPreviewAge] = useState(55);

  // 미리보기 상태
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Length, setBase64Length] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(function initializeSDK() {
    initializeLabelPrinter()
      .then(() => {
        setSdkLoaded(true);
        console.log("라벨 프린터 SDK 스크립트 로드 완료");
      })
      .catch((error) => {
        console.error("라벨 프린터 SDK 스크립트 로드 실패:", error);
      });
  }, []);

  const createCurrentLabelData = useCallback((): LabelData => {
    return {
      chartNumber: previewChartNumber,
      patientName: previewName,
      age: previewAge,
      gender: previewGender,
      birthDate: previewBirthDate,
      printDateTime: getCurrentPrintDateTime(),
    };
  }, [previewAge, previewBirthDate, previewChartNumber, previewGender, previewName]);


  // HTML 방식 미리보기 렌더링
  const renderPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const labelData = createCurrentLabelData();
      const dataUrl = await renderLabelToDataUrlHtml(labelData);
      const base64 = await renderLabelToBase64Html(labelData);

      setPreviewUrl(dataUrl);
      setBase64Length(base64.length);
    } catch (error) {
      console.error("미리보기 렌더링 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [createCurrentLabelData]);

  useEffect(function updatePreview() {
    renderPreview();
  }, [renderPreview]);

  const handleAgentTestPrint = async () => {
    setTestResult("에이전트 출력 요청 중...");
    try {
      const labelData = createCurrentLabelData();
      const result = await printPatientLabelImageViaApi(labelData, {
        copies: 1,
      });
      setTestResult(`[에이전트] ${result.message}`);
    } catch (error) {
      setTestResult(`[에이전트] 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  };

  const handleLocalTestPrint = async () => {
    if (!printerName) {
      setTestResult("프린터 이름을 입력해주세요.");
      return;
    }

    setTestResult("로컬 출력 중...");
    try {
      const labelData = createCurrentLabelData();
      const result = await printPatientLabelLocal(printerName, labelData, 1);
      setTestResult(`[로컬] ${result.message}`);
    } catch (error) {
      setTestResult(`[로컬] 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  };

  const handleDownloadImage = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `patient-label-${Date.now()}.png`;
    link.click();
  };

  const handleOpenImageInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank");
  };

  const handleCopyBase64 = async () => {
    const labelData = createCurrentLabelData();
    const base64 = await renderLabelToBase64Html(labelData);
    await navigator.clipboard.writeText(base64);
    setTestResult("Base64가 클립보드에 복사되었습니다.");
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">환자 라벨 출력 데모</h1>
        <p className="text-muted-foreground">
          환자 라벨 출력 테스트 페이지입니다. (HTML 렌더러 사용)
        </p>
      </div>

      {/* SDK 스크립트 로드 상태 */}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">SDK 상태</h2>
        <div className="flex items-center gap-4">
          <span className={sdkLoaded ? "text-green-600" : "text-orange-500"}>
            {sdkLoaded ? "✓ SDK 스크립트 로드 완료" : "⏳ SDK 스크립트 로딩 중..."}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          로컬 출력은 Web Print SDK App이 localhost:18080에서 실행 중이어야 합니다.
        </p>
      </section>

      {/* 프린터 설정 */}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">1. 프린터 설정</h2>
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">로컬 프린터 (SDK Logical Name)</label>
          <input
            type="text"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            placeholder="예: Printer1"
            className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            로컬 출력 시 사용됩니다. SDK App에서 등록한 Logical Name을 입력하세요.
          </p>
        </div>
      </section>

      {/* 라벨 미리보기 */}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">2. 라벨 미리보기</h2>

        {/* 입력 필드 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">차트번호</label>
            <input
              type="text"
              value={previewChartNumber}
              onChange={(e) => setPreviewChartNumber(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">환자명</label>
            <input
              type="text"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">생년월일 (YYYY-MM-DD)</label>
            <input
              type="text"
              value={previewBirthDate}
              onChange={(e) => setPreviewBirthDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium">나이</label>
              <input
                type="number"
                value={previewAge}
                onChange={(e) => setPreviewAge(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">성별</label>
              <select
                value={previewGender}
                onChange={(e) => setPreviewGender(e.target.value as Gender)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="M">남</option>
                <option value="F">여</option>
              </select>
            </div>
          </div>
        </div>

        {/* 테스트 버튼 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewName("크리스티안 샤메드 부르고스 아탈라")}
          >
            긴 이름 테스트
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewName("조연숙")}>
            짧은 이름 테스트
          </Button>
        </div>

        {/* 미리보기 */}
        <div className="space-y-2">
          <div className="rounded-lg bg-gray-100 p-4">
            {isLoading ? (
              <div className="flex h-[400px] w-[640px] items-center justify-center border border-gray-300 bg-white text-muted-foreground">
                렌더링 중...
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Patient Label Preview"
                className="border border-gray-300 bg-white"
                style={{ width: 640, height: 400 }}
              />
            ) : (
              <div className="flex h-[400px] w-[640px] items-center justify-center border border-gray-300 bg-white text-muted-foreground">
                로딩 중...
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Base64 크기: {(base64Length / 1024).toFixed(1)} KB</span>
            <span>•</span>
            <span>HTML 템플릿 기반 렌더링</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenImageInNewTab}>
              새 탭에서 열기
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadImage}>
              다운로드 (PNG)
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyBase64}>
              Base64 복사
            </Button>
          </div>
        </div>
      </section>

      {/* 테스트 출력 */}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">3. 테스트 출력</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                로컬
              </span>
              <span className="text-sm font-medium">이 PC에서 출력</span>
            </div>
            <p className="text-xs text-muted-foreground">
              브라우저 → SDK App → 프린터
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={handleLocalTestPrint}
              disabled={!printerName || !sdkLoaded}
            >
              로컬 테스트 출력
            </Button>
          </div>

          {/* 에이전트 출력 */}
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                에이전트
              </span>
              <span className="text-sm font-medium">에이전트로 출력</span>
            </div>
            <p className="text-xs text-muted-foreground">
              브라우저 → API → 에이전트 → 프린터
            </p>
            <Button
              size="sm"
              className="w-full"
              variant="outline"
              onClick={handleAgentTestPrint}
            >
              에이전트 테스트 출력
            </Button>
          </div>
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

