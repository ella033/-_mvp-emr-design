"use client";

import { useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";

interface ConsentTemplateFormModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    category: string;
    file: File;
  }) => Promise<boolean>;
}

export function ConsentTemplateFormModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: ConsentTemplateFormModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setCategory("");
    setFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !file) return;
    const ok = await onSubmit({
      title: title.trim(),
      category: category.trim(),
      file,
    });
    if (ok) {
      handleClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    }
  };

  const isValid = title.trim() && file;

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={handleClose}
      fitContent
      hideHeader
      width="420px"
    >
      <div className="-m-[10px] w-[400px] max-w-[88vw] rounded-md border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-3 py-2">
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">
            동의서 템플릿 등록
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-600">
              동의서 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 개인정보 수집 및 이용 동의서"
              className="h-[30px] rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-600">
              카테고리
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: PRIVACY"
              className="h-[30px] rounded border border-slate-200 px-2 text-[12px] outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-600">
              PDF 파일 <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[60px] items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-500 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : "PDF 파일을 선택하세요"}
            </button>
          </div>

          <div className="flex justify-end gap-1 pt-1">
            <MyButton
              variant="outline"
              className="h-[28px] min-w-[50px] px-3 text-[11px]"
              onClick={handleClose}
            >
              취소
            </MyButton>
            <MyButton
              className="h-[28px] min-w-[50px] px-3 text-[11px]"
              onClick={() => void handleSubmit()}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </MyButton>
          </div>
        </div>
      </div>
    </MyPopup>
  );
}
