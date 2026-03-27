"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";

// Web Serial API 타입 확장
declare global {
  interface Navigator {
    serial: {
      requestPort(): Promise<SerialPort>;
    };
  }

  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    readable: ReadableStream<Uint8Array>;
  }
}

export default function Lab() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDownload = () => {
    setIsDownloading(true);

    // 프록시 서버 API를 통해 최신 에이전트 다운로드
    const downloadUrl = "/api/agents/download/latest";
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "NextEmrAgent_Setup.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 다운로드 시작 후 상태 리셋
    setTimeout(() => {
      setIsDownloading(false);
    }, 1000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // exe 파일만 허용
      if (file.name.toLowerCase().endsWith(".exe")) {
        setSelectedFile(file);
      } else {
        alert("exe 파일만 업로드 가능합니다.");
        event.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("업로드할 파일을 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "agent-installer");

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/agents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        alert(`업로드 성공: ${result.message}`);
        setSelectedFile(null);
        // 파일 입력 초기화
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        alert(`업로드 실패: ${error.message}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };
  const [scannedData, setScannedData] = useState<string>("");
  const [isScannerConnected, setIsScannerConnected] = useState(false);
  const [scannedHistory, setScannedHistory] = useState<string[]>([]);
  const [currentBaudRate, setCurrentBaudRate] = useState<number>(115200);

  async function connectScanner() {
    try {
      console.log("Requesting serial port...");
      const port = await navigator.serial.requestPort(); // 포트 선택 UI
      console.log("Port selected:", port);

      console.log(`Opening port with baudRate ${currentBaudRate}...`);
      await port.open({ baudRate: currentBaudRate }); // 스캐너 설정 속도 맞추기
      console.log("Port opened successfully");
      setIsScannerConnected(true);

      const reader = port.readable.getReader();
      let buffer = "";
      console.log("Starting to read data...");

      while (true) {
        const { value, done } = await reader.read();
        console.log("Read data:", value, "Done:", done);

        if (done) {
          console.log("Scanner disconnected");
          setIsScannerConnected(false);
          break;
        }

        const decoded = new TextDecoder().decode(value);
        console.log("Decoded data:", decoded);
        buffer += decoded;

        // 여러 종료 문자 처리
        const lineEndings = ["\n", "\r", "\r\n"];
        let hasLineEnding = false;

        for (const ending of lineEndings) {
          if (buffer.includes(ending)) {
            hasLineEnding = true;
            break;
          }
        }

        if (hasLineEnding) {
          const lines = buffer.split(/\r\n|\r|\n/);
          buffer = lines.pop() || ""; // 마지막 불완전한 라인은 버퍼에 유지

          for (const line of lines) {
            const scannedCode = line.trim();
            if (scannedCode) {
              console.log("Scanned:", scannedCode);
              setScannedData(scannedCode);
              setScannedHistory((prev) => [
                ...prev,
                `${new Date().toLocaleTimeString()}: ${scannedCode}`,
              ]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Scanner connection failed:", error);
      setIsScannerConnected(false);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`스캐너 연결 실패: ${errorMessage}`);
    }
  }
  return (
    <div className="h-full w-full bg-[var(--bg-base)] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
          EMR 에이전트 다운로드
        </h1>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/80 disabled:bg-[var(--primary-color)]/50 text-green-600 hover:text-green-500 font-medium py-4 px-8 rounded-lg transition-all duration-200 flex items-center space-x-3 text-lg border-2 border-[var(--primary-color)] hover:border-[var(--primary-color)]/60 hover:shadow-lg cursor-pointer hover:cursor-pointer disabled:cursor-not-allowed"
          title="NextEMR Agent 설치 파일을 다운로드합니다"
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 rounded-full border-b-2 border-current animate-spin"></div>
              <span>다운로드 중...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>NextEMR Agent 다운로드</span>
            </>
          )}
        </button>

        <p className="text-sm text-[var(--text-secondary)] mt-4">
          Windows 10 이상 (64비트) • 관리자 권한 필요
        </p>

        {/* 바코드 스캐너 섹션 */}
        <div className="mt-8 p-4 bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            바코드 스캐너
          </h2>

          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <button
                onClick={connectScanner}
                disabled={isScannerConnected}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md transition-colors cursor-pointer hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isScannerConnected ? "스캐너 연결됨" : "스캐너 연결"}
              </button>

              <select
                value={currentBaudRate}
                onChange={(e) => setCurrentBaudRate(Number(e.target.value))}
                disabled={isScannerConnected}
                className="px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-base)] text-sm"
              >
                <option value={9600}>9600</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={57600}>57600</option>
                <option value={115200}>115200</option>
                <option value={230400}>230400</option>
              </select>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              현재 보드레이트: {currentBaudRate} bps
            </p>
          </div>

          {scannedData && (
            <div className="p-3 mt-4 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm font-medium text-green-800">
                최근 스캔된 데이터:
              </p>
              <p className="font-mono text-lg text-green-900">{scannedData}</p>
            </div>
          )}

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                스캔 히스토리
              </label>
              <button
                onClick={() => setScannedHistory([])}
                className="text-xs text-red-600 cursor-pointer hover:text-red-800"
              >
                전체 삭제
              </button>
            </div>
            <textarea
              value={scannedHistory.join("\n")}
              readOnly
              className="w-full h-32 p-3 border border-[var(--border-color)] rounded-md bg-[var(--bg-base)] text-sm font-mono resize-none"
              placeholder="바코드를 스캔하면 여기에 표시됩니다..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
