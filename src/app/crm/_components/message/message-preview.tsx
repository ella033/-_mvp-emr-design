"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ImageFile } from "@/types/crm/message-template/message-types";

interface MessagePreviewProps {
  previewMessage: string;
  images?: ImageFile[];
  isAdDisplayed?: boolean;
  containerClassName?: string;
  titleExtra?: React.ReactNode;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({
  previewMessage,
  images = [],
  isAdDisplayed = false,
  containerClassName,
  titleExtra,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 메시지 미리보기 창 */}
      <div
        className={cn(
          "flex gap-3 flex-col rounded-md p-4",
          "border border-[var(--border-1)]",
          containerClassName || "h-[578px]"
        )}
      >
        <div className="flex items-center">
          <h4
            className={cn(
              "font-bold leading-[125%]",
              "text-[13px] text-[var(--gray-100)]"
            )}
          >
            미리보기
          </h4>
          {titleExtra}
        </div>

        <div className="mt-3 ml-2 flex-1 rounded-md flex flex-col overflow-y-auto">
          {/* 메시지 표시 영역 */}
          <div className="relative">
            <div
              className={cn(
                "text-sm text-[var(--gray-200)] bg-[var(--bg-3)] whitespace-pre-wrap p-3",
                "overflow-x-hidden overflow-y-hidden break-words",
                "max-w-[280px] min-h-[50px] max-h-[498px] rounded-md"
              )}
            >
              [Web발신]{"\n"}
              {isAdDisplayed && "(광고) "}
              {previewMessage}
              {isAdDisplayed && "\n\n무료수신거부 080-215-5003"}
            </div>
            {/* 말풍선 꼬리 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="21"
              viewBox="0 0 17 21"
              fill="none"
              className="absolute -bottom-[5px] left-[-5px]"
            >
              <path
                d="M0.112173 20.1846C5.31217 20.9846 10.4455 18.1212 12.1122 16.2879C10.3943 12.1914 21.0001 2.24186 14.0001 2.24148C12.3815 2.24148 10.999 -1.9986 5.11217 1.1846C5.09096 2.47144 5.11217 6.92582 5.11217 7.6842C5.11217 18.1842 -0.887827 19.5813 0.112173 20.1846Z"
                fill="#EAEBEC"
              />
            </svg>
          </div>

          {/* 이미지 미리보기 영역 */}
          {images.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {images.map((image, index) => (
                <div key={image.preview} className="max-w-[210px]">
                  <img
                    src={image.preview}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-auto max-w-[210px] h-auto rounded-md"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagePreview;
