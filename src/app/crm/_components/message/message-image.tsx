"use client";

import React, { useRef, useCallback } from "react";
import { Plus, X, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastHelpers } from "@/components/ui/toast";
import { MyTooltip } from "@/components/yjg/my-tooltip";

interface ImageFile {
  file: File;
  preview: string;
}

interface MessageImageProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
}

const MessageImage: React.FC<MessageImageProps> = ({
  images,
  onImagesChange,
}) => {
  const toastHelpers = useToastHelpers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 이미지 비율을 조정합니다.
   * 비율 제한: 1:1(정형) or 2:1 이하(가로폭이 2배 초과하는 경우), 3:4 이하(세로폭이 4/3 초과하는 경우)
   */
  const adjustAspectRatio = (
    width: number,
    height: number
  ): { width: number; height: number } => {
    const ratio = width / height;

    // 비율이 1:1 ~ 2:1 사이이거나, 3:4 ~ 1:1 사이인 경우 그대로 유지
    if (ratio >= 0.75 && ratio <= 2) {
      return { width, height };
    }

    // 가로가 너무 긴 경우 (2:1 초과) -> 2:1로 조정
    if (ratio > 2) {
      return { width, height: Math.floor(width / 2) };
    }

    // 세로가 너무 긴 경우 (3:4 미만) -> 3:4로 조정
    if (ratio < 0.75) {
      return { width: Math.floor(height * 0.75), height };
    }

    return { width, height };
  };

  /**
   * 이미지가 최소 크기(가로 500px, 세로 250px)를 만족하도록
   * 필요한 경우 흰 바탕으로 여백을 추가합니다.
   */
  const addPaddingIfNeeded = (
    canvas: HTMLCanvasElement,
    minWidth: number = 500,
    minHeight: number = 250
  ): HTMLCanvasElement => {
    const currentWidth = canvas.width;
    const currentHeight = canvas.height;

    // 이미 최소 크기를 만족하는 경우
    if (currentWidth >= minWidth && currentHeight >= minHeight) {
      return canvas;
    }

    const finalWidth = Math.max(currentWidth, minWidth);
    const finalHeight = Math.max(currentHeight, minHeight);

    const paddedCanvas = document.createElement("canvas");
    paddedCanvas.width = finalWidth;
    paddedCanvas.height = finalHeight;

    const paddedCtx = paddedCanvas.getContext("2d");
    if (!paddedCtx) {
      return canvas; // 실패 시 원본 반환
    }

    // 흰색 배경으로 채우기
    paddedCtx.fillStyle = "#FFFFFF";
    paddedCtx.fillRect(0, 0, finalWidth, finalHeight);

    // 이미지를 중앙에 배치
    const offsetX = Math.floor((finalWidth - currentWidth) / 2);
    const offsetY = Math.floor((finalHeight - currentHeight) / 2);
    paddedCtx.drawImage(canvas, offsetX, offsetY);

    return paddedCanvas;
  };

  const compressImage = async (
    file: File,
    maxWidth: number = 1500,
    maxHeight: number = 1440,
    maxSizeKB: number = 300
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas를 생성할 수 없습니다."));
            return;
          }

          let width = img.width;
          let height = img.height;

          // 1. 비율 조정
          const adjusted = adjustAspectRatio(width, height);
          width = adjusted.width;
          height = adjusted.height;

          // 2. 비율 유지하면서 최대 크기 제한
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);

            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // 임시 캔버스에 이미지 그리기
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // 3. 최소 크기 보장 (흰 바탕 패딩 추가)
          const finalCanvas = addPaddingIfNeeded(canvas, 500, 250);

          // 4. 모든 이미지는 JPEG로 변환 (*MMS는 JPG, JPEG만 지원)
          const outputType = "image/jpeg";
          let quality = 0.92;
          const minQuality = 0.1;
          const qualityStep = 0.05; // 0.05 단위로 품질 조정

          const tryCompress = () => {
            finalCanvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("이미지 압축에 실패했습니다."));
                  return;
                }

                if (blob.size <= maxSizeKB * 1024 || quality <= minQuality) {
                  // 원본 파일명 유지하되 확장자는 .jpg로 변경
                  const fileName = file.name.replace(/\.[^/.]+$/, ".jpg");
                  const compressedFile = new File([blob], fileName, {
                    type: outputType,
                  });

                  if (blob.size > maxSizeKB * 1024) {
                    console.warn(
                      `이미지 크기가 ${maxSizeKB}KB를 초과합니다: ${Math.round(blob.size / 1024)}KB`
                    );
                  }

                  resolve(compressedFile);
                } else {
                  // 품질을 낮춰서 다시 시도
                  quality = Math.max(minQuality, quality - qualityStep);
                  tryCompress();
                }
              },
              outputType,
              quality
            );
          };

          tryCompress();
        };

        img.onerror = () => {
          reject(new Error("이미지를 로드할 수 없습니다."));
        };
      };

      reader.onerror = () => {
        reject(new Error("파일을 읽을 수 없습니다."));
      };
    });
  };

  const handleImageAdd = useCallback(() => {
    if (images.length < 3) {
      fileInputRef.current?.click();
    }
  }, [images.length]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file) return;

      // 이미지 파일 타입 체크
      if (!file.type.startsWith("image/")) {
        toastHelpers.error("이미지 파일만 업로드 가능합니다.");
        return;
      }

      // 이미 3개 이상인 경우
      if (images.length >= 3) {
        toastHelpers.error("이미지는 최대 3개까지 업로드 가능합니다.");
        return;
      }

      try {
        // 이미지 사이즈 조정
        const compressedFile = await compressImage(file, 1500, 1440, 300);

        const preview = URL.createObjectURL(compressedFile);
        onImagesChange([...images, { file: compressedFile, preview }]);
      } catch (error) {
        console.error("이미지 처리 실패:", error);
        toastHelpers.error(
          error instanceof Error
            ? error.message
            : "이미지 첨부 실패하였습니다.\n(첨부이미지는 jpg, png, gif 형식의 300KB 이하 해상도 1500*1440px 이하의 이미지로 다시 첨부하여 주시기 바랍니다)"
        );
      } finally {
        // input 초기화 (같은 파일을 다시 선택할 수 있도록)
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, onImagesChange, toastHelpers]
  );

  const handleImageRemove = useCallback(
    (index: number) => {
      // 메모리 누수 방지를 위해 미리보기 URL 해제
      const image = images[index];
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      onImagesChange(images.filter((_, i) => i !== index));
    },
    [images, onImagesChange]
  );

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col">
        <h3 className="text-sm font-bold flex items-center">
          이미지
          <MyTooltip
            side="bottom"
            align="start"
            content={
              <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                jpg, jpeg, png 형식을 지원합니다.
                <br />
                업로드한 이미지는 자동 보정되며 여백이 추가될 수 있습니다.
                이미지는 최대 3개까지 업로드할 수 있습니다.
              </div>
            }
          >
            <CircleAlert className="ml-1 w-4 h-4 text-[var(--gray-300)]" />
          </MyTooltip>
        </h3>
        <span className="text-xs text-gray-500">(최대3개)</span>
      </div>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          multiple={false}
        />
        {images.length < 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleImageAdd}
            className="w-20 h-20 border-dashed border-[var(--border-2)]"
          >
            <Plus className="w-20 h-20 text-[var(--gray-300)]" />
          </Button>
        )}
        {images.map((image, index) => (
          <div
            key={image.preview}
            className="relative w-20 h-20 border rounded overflow-hidden"
          >
            <img
              src={image.preview}
              alt={`첨부 이미지 ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute top-1 right-1.5 w-5 h-5 p-0 rounded-[100px] bg-[var(--bg-2)] flex items-center justify-center cursor-pointer"
              onClick={() => handleImageRemove(index)}
            >
              <X className="w-3.5 h-3.5 text-[var(--gray-300)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageImage;
