'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFieldEditor } from '../_contexts/FieldEditorContext';
import { useToastHelpers } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormsService } from '@/services/forms-service';
import type { components } from '@/generated/api/types';

type FormSearchItemDto = components['schemas']['FormSearchItemDto'];

export default function FieldEditorHeader() {
  const {
    addedFields,
    clearFields,
    pdfFileName,
    formName,
    formVersionId,
    setPdfFile,
    resetPdfFile,
    isPreviewOpen,
    togglePreview,
    getFieldsJsonString,
    setFieldsFromJson,
    loadServerForm,
    updateServerFormFields,
    editingFormId,
  } = useFieldEditor();
  const { success, error } = useToastHelpers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState<boolean>(false);
  const [isJsonImportDialogOpen, setIsJsonImportDialogOpen] = useState<boolean>(false);
  const [jsonInputValue, setJsonInputValue] = useState<string>('');
  const [isServerFormDialogOpen, setIsServerFormDialogOpen] = useState<boolean>(false);
  const [serverForms, setServerForms] = useState<FormSearchItemDto[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [isLoadingForms, setIsLoadingForms] = useState<boolean>(false);
  const [isLoadingFormDetail, setIsLoadingFormDetail] = useState<boolean>(false);

  const fieldsJsonString = useMemo(() => getFieldsJsonString(), [getFieldsJsonString, addedFields]);

  // 서버 서식 리스트 조회
  useEffect(() => {
    if (isServerFormDialogOpen) {
      setIsLoadingForms(true);
      setSelectedFormId(null);
      FormsService.searchForms()
        .then((response) => {
          setServerForms(response.forms);
        })
        .catch((err) => {
          console.error('[FIELD-EDITOR] Failed to fetch forms:', err);
          error('서식 목록을 불러오는데 실패했습니다.');
        })
        .finally(() => {
          setIsLoadingForms(false);
        });
    }
  }, [isServerFormDialogOpen]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        error('PDF 파일만 선택할 수 있습니다.');
        return;
      }
      setPdfFile(file);
      success(`PDF 파일 "${file.name}"을 불러왔습니다.`);
    }
    // input 초기화 (같은 파일 재선택 가능하도록)
    event.target.value = '';
  };

  const handleResetPdf = () => {
    if (confirm('선택된 PDF를 제거하시겠습니까?')) {
      resetPdfFile();
      success('PDF 선택을 해제했습니다.');
    }
  };

  const handleClear = () => {
    if (confirm('모든 필드를 삭제하시겠습니까?')) {
      clearFields();
      success('모든 필드가 삭제되었습니다.');
    }
  };

  const handleCopyFieldsJson = async () => {
    try {
      await navigator.clipboard.writeText(fieldsJsonString);
      success('필드 JSON을 복사했습니다.');
    } catch (err) {
      console.error('[FIELD-EDITOR] Failed to copy JSON:', err);
      error('클립보드 복사에 실패했습니다.');
    }
  };

  const handleApplyFieldsJson = () => {
    const trimmedJson = jsonInputValue.trim();
    if (!trimmedJson) {
      error('JSON을 입력해주세요.');
      return;
    }

    const hasExistingFields = addedFields.length > 0;
    if (hasExistingFields) {
      const shouldReplace = confirm('현재 필드가 있습니다. JSON을 적용하면 기존 필드를 덮어씌웁니다. 계속하시겠습니까?');
      if (!shouldReplace) return;
    }

    const result = setFieldsFromJson(trimmedJson);
    if (result.success) {
      success('JSON으로 필드를 설정했습니다.');
      setIsJsonImportDialogOpen(false);
    } else {
      error(result.error || 'JSON 적용에 실패했습니다.');
    }
  };

  const handleLoadServerForm = async () => {
    if (selectedFormId === null) {
      error('서식을 선택해주세요.');
      return;
    }

    if (addedFields.length > 0) {
      if (!confirm('현재 필드가 있습니다. 불러오면 현재 필드가 덮어씌워집니다. 계속하시겠습니까?')) {
        return;
      }
    }

    const selectedForm = serverForms.find(form => form.id === selectedFormId);
    if (!selectedForm) {
      error('선택한 서식을 찾을 수 없습니다.');
      return;
    }

    setIsLoadingFormDetail(true);
    const result = await loadServerForm(selectedFormId, selectedForm.name);
    setIsLoadingFormDetail(false);

    if (result.success) {
      success('서식을 불러왔습니다.');
      setIsServerFormDialogOpen(false);
    } else {
      error(result.error || '서식을 불러오는데 실패했습니다.');
    }
  };

  const handleUpdateServerFormFields = async () => {
    if (!formVersionId) {
      error('서식 버전 정보가 없습니다.');
      return;
    }

    if (!confirm('서식 필드를 업데이트하시겠습니까?')) {
      return;
    }

    setIsLoadingFormDetail(true);
    const result = await updateServerFormFields();
    setIsLoadingFormDetail(false);

    if (result.success) {
      success('서식 필드가 업데이트되었습니다.');
    } else {
      error(result.error || '서식 필드 업데이트에 실패했습니다.');
    }
  };

  return (
    <div className="w-full h-16 border-b border-gray-300 bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">서식 편집기</h1>

        {/* PDF 파일 선택 영역 */}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleFileSelect}
            className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-1.5"
            title="PDF 파일 선택"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF 선택
          </button>
          <Dialog open={isServerFormDialogOpen} onOpenChange={setIsServerFormDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="px-3 py-1.5 text-sm bg-teal-500 text-white rounded hover:bg-teal-600 flex items-center gap-1.5"
                title="서버에 등록된 서식 불러오기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                서식 불러오기
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>서식 불러오기</DialogTitle>
                <DialogDescription>서버에 등록된 서식을 선택하여 편집기에 불러옵니다.</DialogDescription>
              </DialogHeader>
              <div className="border rounded bg-gray-50 max-h-[320px] overflow-y-auto">
                {isLoadingForms ? (
                  <div className="p-8 text-center text-gray-500">서식 목록을 불러오는 중...</div>
                ) : serverForms.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">등록된 서식이 없습니다.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {serverForms.map((form) => (
                      <li
                        key={form.id}
                        onClick={() => setSelectedFormId(form.id)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${selectedFormId === form.id
                          ? 'bg-teal-100 border-l-4 border-teal-500'
                          : 'hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{form.name}</span>
                          <span className="text-xs text-gray-400">ID: {form.id}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <button
                  onClick={() => setIsServerFormDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleLoadServerForm}
                  disabled={selectedFormId === null || isLoadingFormDetail}
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingFormDetail ? '불러오는 중...' : '불러오기'}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {pdfFileName ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded max-w-48 truncate" title={formName || pdfFileName}>
                {formName || pdfFileName}
              </span>
              <button
                onClick={handleResetPdf}
                className="text-gray-400 hover:text-gray-600"
                title="PDF 선택 해제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-400">선택된 PDF 없음</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePreview}
          className={`px-3 py-1 text-sm rounded border ${isPreviewOpen ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          title="미리보기 토글"
        >
          미리보기
        </button>
        <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="px-3 py-1 text-sm rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              title="필드 JSON 보기/복사"
            >
              JSON
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>필드 JSON</DialogTitle>
              <DialogDescription>서버 등록/디버깅용 필드 스키마를 확인하고 복사할 수 있습니다.</DialogDescription>
            </DialogHeader>
            <div className="border rounded bg-gray-50">
              <textarea
                readOnly
                value={fieldsJsonString}
                className="w-full h-[420px] p-3 font-mono text-xs bg-transparent outline-none resize-none"
              />
            </div>
            <DialogFooter>
              <button
                onClick={handleCopyFieldsJson}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                복사
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isJsonImportDialogOpen} onOpenChange={setIsJsonImportDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="px-3 py-1 text-sm rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              title="JSON으로 필드 설정"
            >
              JSON 입력
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>JSON으로 필드 설정</DialogTitle>
              <DialogDescription>
                JSON 배열 또는 {"{ fields: [...] }"} 형태를 입력하면 필드를 덮어씌웁니다.
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded bg-gray-50">
              <textarea
                value={jsonInputValue}
                onChange={(e) => setJsonInputValue(e.target.value)}
                className="w-full h-[420px] p-3 font-mono text-xs bg-transparent outline-none resize-none"
                placeholder='예시: [{"key":"text_001","name":"이름","type":1,"pageNumber":1,"x":100,"y":100,"width":200,"height":30}]'
              />
            </div>
            <DialogFooter>
              <button
                onClick={() => setIsJsonImportDialogOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleApplyFieldsJson}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                적용
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <span className="text-sm text-gray-500">
          필드 {addedFields.length}개
        </span>
        {editingFormId && formVersionId && (
          <button
            onClick={handleUpdateServerFormFields}
            disabled={isLoadingFormDetail}
            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="필드 수정"
          >
            {isLoadingFormDetail ? '수정 중...' : '필드 수정'}
          </button>
        )}
        {addedFields.length > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            title="전체 필드 삭제"
          >
            전체 삭제
          </button>
        )}
      </div>
    </div>
  );
}
