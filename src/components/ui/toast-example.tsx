"use client";

import React from "react";
import { useToastHelpers } from "./toast";
import { Button } from "./button";

export function ToastExample() {
  const { success, error, warning, info, toast, persistent } =
    useToastHelpers();

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Toast 사용 예시</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* 기본 Toast들 */}
        <div className="space-y-2">
          <h3 className="font-medium">기본 Toast (3초 자동 닫기)</h3>
          <Button onClick={() => success("성공!", "작업이 완료되었습니다.")}>
            성공 Toast
          </Button>
          <Button onClick={() => error("오류 발생", "다시 시도해주세요.")}>
            에러 Toast
          </Button>
          <Button
            onClick={() => warning("주의사항", "이 작업은 되돌릴 수 없습니다.")}
          >
            경고 Toast
          </Button>
          <Button onClick={() => info("정보", "새로운 업데이트가 있습니다.")}>
            정보 Toast
          </Button>
        </div>

        {/* 커스텀 Toast들 */}
        <div className="space-y-2">
          <h3 className="font-medium">커스텀 Toast</h3>
          <Button
            onClick={() =>
              success("저장 완료", "파일이 저장되었습니다.", { duration: 5000 })
            }
          >
            5초 자동 닫기
          </Button>
          <Button
            onClick={() =>
              persistent({
                variant: "warning",
                title: "업데이트 확인",
                children: "자동으로 닫히지 않습니다.",
              })
            }
          >
            자동 닫기 안함
          </Button>
          <Button
            onClick={() =>
              toast({
                variant: "info",
                title: "복잡한 Toast",
                dismissible: false,
                children: (
                  <div className="space-y-2">
                    <p>닫기 버튼이 없는 Toast입니다.</p>
                    <p className="text-xs text-gray-500">
                      마우스를 올리면 자동 닫기가 일시 중지됩니다.
                    </p>
                  </div>
                ),
              })
            }
          >
            닫기 버튼 없음
          </Button>
        </div>
      </div>

      {/* 복잡한 내용의 Toast */}
      <div className="space-y-2">
        <h3 className="font-medium">복잡한 내용의 Toast</h3>
        <Button
          onClick={() =>
            toast({
              variant: "warning",
              title: "업데이트 확인",
              duration: 0, // 자동 닫기 안함
              children: (
                <div className="space-y-3">
                  <p>새로운 버전이 사용 가능합니다.</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log("업데이트");
                        // Toast가 자동으로 닫힙니다
                      }}
                    >
                      업데이트
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log("나중에");
                        // Toast가 자동으로 닫힙니다
                      }}
                    >
                      나중에
                    </Button>
                  </div>
                </div>
              ),
            })
          }
        >
          액션 버튼이 있는 Toast
        </Button>
      </div>

      {/* 파일 업로드 예시 */}
      <div className="space-y-2">
        <h3 className="font-medium">파일 업로드 예시</h3>
        <Button
          onClick={() => {
            // 업로드 시작
            const uploadToast = persistent({
              variant: "info",
              title: "파일 업로드 중...",
              children: (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full animate-pulse"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                  <p className="text-xs">document.pdf 업로드 중...</p>
                </div>
              ),
            });

            // 3초 후 완료
            setTimeout(() => {
              success("업로드 완료", "파일이 성공적으로 업로드되었습니다.");
            }, 3000);
          }}
        >
          파일 업로드 시뮬레이션
        </Button>
      </div>

      {/* 네트워크 오류 예시 */}
      <div className="space-y-2">
        <h3 className="font-medium">네트워크 오류 예시</h3>
        <Button
          onClick={() =>
            toast({
              variant: "destructive",
              title: "네트워크 오류",
              children: (
                <div className="space-y-2">
                  <p>서버에 연결할 수 없습니다.</p>
                  <p className="text-xs text-gray-500">
                    인터넷 연결을 확인해주세요.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      console.log("다시 시도");
                      // Toast가 자동으로 닫힙니다
                    }}
                  >
                    다시 시도
                  </Button>
                </div>
              ),
            })
          }
        >
          네트워크 오류 Toast
        </Button>
      </div>
    </div>
  );
}

// 실제 사용 예시 컴포넌트들
export function FileUploadExample() {
  const { persistent, success, error } = useToastHelpers();

  const handleFileUpload = async (file: File) => {
    // 업로드 시작 Toast
    const uploadToast = persistent({
      variant: "info",
      title: "파일 업로드 중...",
      children: (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: "0%" }}
            ></div>
          </div>
          <p className="text-xs">{file.name} 업로드 중...</p>
        </div>
      ),
    });

    try {
      // 실제 업로드 로직
      await new Promise((resolve) => setTimeout(resolve, 2000));
      success("업로드 완료", `${file.name}이 성공적으로 업로드되었습니다.`);
    } catch (err) {
      error("업로드 실패", "파일 업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
  );
}

export function FormSubmissionExample() {
  const { success, error, warning } = useToastHelpers();

  const handleSubmit = async (data: any) => {
    try {
      // 폼 제출 로직
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (data.email === "test@example.com") {
        warning("중복 이메일", "이미 등록된 이메일입니다.");
        return;
      }

      success("제출 완료", "폼이 성공적으로 제출되었습니다.");
    } catch (err) {
      error("제출 실패", "폼 제출 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={() => handleSubmit({ email: "test@example.com" })}>
        중복 이메일로 제출
      </Button>
      <Button onClick={() => handleSubmit({ email: "new@example.com" })}>
        새 이메일로 제출
      </Button>
    </div>
  );
}
