"use client";

import { useEffect, useState } from "react";

export default function PrescriptionPreviewPage() {
  const [html, setHtml] = useState("");
  const [useFormPaper, setUseFormPaper] = useState(true);
  const [showBackgroundImage, setShowBackgroundImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    function loadPreview() {
      let canceled = false;
      async function fetchPreview() {
        setIsLoading(true);
        setError(null);
        try {
          const searchParams = new URLSearchParams();
          searchParams.set("useFormPaper", useFormPaper ? "true" : "false");
          searchParams.set("showBackgroundImage", showBackgroundImage ? "true" : "false");

          const res = await fetch(`/api/dev/prescription-preview?${searchParams.toString()}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error("미리보기를 불러오지 못했습니다.");
          const data = await res.json();
          if (!canceled) {
            setHtml(data.html ?? "");
          }
        } catch (err) {
          if (!canceled) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
          }
        } finally {
          if (!canceled) {
            setIsLoading(false);
          }
        }
      }
      fetchPreview();
      return () => {
        canceled = true;
      };
    },
    [useFormPaper, showBackgroundImage],
  );

  return (
    <div className="flex flex-col gap-4 p-6" style={{ width: "100%" }}>
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">원외 처방전 미리보기 (dev)</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useFormPaper}
            onChange={(e) => setUseFormPaper(e.target.checked)}
            className="h-4 w-4"
          />
          양식지 사용 (배경 제외)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showBackgroundImage}
            onChange={(e) => setShowBackgroundImage(e.target.checked)}
            className="h-4 w-4"
          />
          처방전 이미지
        </label>
        {isLoading ? <span className="text-sm text-gray-600">불러오는 중...</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>

      <div className="border rounded bg-white overflow-auto" style={{ width: "100%", height: "85vh" }}>
        {html ? (
          <iframe
            title="prescription-preview"
            srcDoc={html}
            className="w-full h-full border-0"
            style={{ width: "100%" }}
            sandbox="allow-same-origin allow-popups allow-forms allow-scripts"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
            {isLoading ? "불러오는 중..." : "미리볼 HTML이 없습니다."}
          </div>
        )}
      </div>
    </div>
  );
}

