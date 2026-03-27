import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { SpecificDetailCode } from "@/types/chart/specific-detail-code-type";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { useToastHelpers } from "@/components/ui/toast";
import { useInputSlashCommand } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/use-input-slash-command";
import { TextareaSlashCommandPopup } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/textarea-slash-command-popup";

// 코드별 글자 수 제한 (영문 기준, 한글은 2배로 계산)
const CODE_LIMITS: Record<string, number> = {
  JT010: 200, // 영문 200자, 한글 100자
  JT011: 400, // 영문 400자, 한글 200자
  JT012: 200, // 영문 200자, 한글 100자
  JT014: 200, // 영문 200자, 한글 100자
  JX999: 700, // 영문 700자, 한글 350자
  MT024: 200, // 영문 200자, 한글 100자
};

// 고정 content 코드 (입력창 없음)
const FIXED_CONTENT_CODES: Record<string, string> = {
  JT019: "P",
};

// 바이트 수 계산 (한글 2바이트, 영문 1바이트)
const getByteLength = (str: string): number => {
  let byteLength = 0;
  for (const char of str) {
    // 한글 범위 체크
    if (char.charCodeAt(0) > 127) {
      byteLength += 2;
    } else {
      byteLength += 1;
    }
  }
  return byteLength;
};

export default function SpecificDetailForm({
  selectedSpecificDetailCode,
  localSpecificDetail,
  setLocalSpecificDetail,
}: {
  selectedSpecificDetailCode: SpecificDetailCode | undefined;
  localSpecificDetail: SpecificDetail | undefined;
  setLocalSpecificDetail: (specificDetail: SpecificDetail | undefined) => void;
}) {
  const isFixedContent = selectedSpecificDetailCode
    ? FIXED_CONTENT_CODES[selectedSpecificDetailCode.code] !== undefined
    : false;

  return (
    <div className="flex flex-col w-full h-full py-2 pl-2 gap-3">
      {selectedSpecificDetailCode ? (
        <>
          <div className="flex flex-col items-center gap-2 bg-[var(--bg-1)] px-3 py-2 rounded">
            <div className="text-[12px] font-bold justify-start w-full">
              {selectedSpecificDetailCode?.code}
            </div>
            <div className="text-[12px] text-[var(--gray-400)] justify-start w-full">
              {selectedSpecificDetailCode?.content}
            </div>
          </div>
          {isFixedContent ? (
            <FixedContentInput
              selectedSpecificDetailCode={selectedSpecificDetailCode}
              setLocalSpecificDetail={setLocalSpecificDetail}
            />
          ) : (
            <div className="flex-1 min-h-0 border rounded-sm my-scroll">
              <FreeTextTypeInput
                selectedSpecificDetailCode={selectedSpecificDetailCode}
                localSpecificDetail={localSpecificDetail}
                setLocalSpecificDetail={setLocalSpecificDetail}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full border rounded-sm text-[var(--gray-400)]">
          좌측 리스트에서 선택해주세요.
        </div>
      )}
    </div>
  );
}

// JT019 같은 고정 content 코드용 컴포넌트
function FixedContentInput({
  selectedSpecificDetailCode,
  setLocalSpecificDetail,
}: {
  selectedSpecificDetailCode: SpecificDetailCode;
  setLocalSpecificDetail: (specificDetail: SpecificDetail | undefined) => void;
}) {
  const fixedContent = FIXED_CONTENT_CODES[selectedSpecificDetailCode.code] ?? "";

  const handleAdd = useCallback(() => {
    const specificDetail: SpecificDetail = {
      code: selectedSpecificDetailCode.code,
      name: selectedSpecificDetailCode.name,
      content: fixedContent,
      type: selectedSpecificDetailCode.type,
    };
    setLocalSpecificDetail(specificDetail);
  }, [selectedSpecificDetailCode, fixedContent, setLocalSpecificDetail]);

  // 컴포넌트 마운트 시 자동으로 설정
  useEffect(() => {
    handleAdd();
  }, [handleAdd]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 border rounded-sm">
      <div className="text-[12px] text-[var(--gray-400)]">
        이 특정내역은 고정 값이 사용됩니다.
      </div>
      <div className="text-[14px]">
        {fixedContent}
      </div>
    </div>
  );
}

function FreeTextTypeInput({
  selectedSpecificDetailCode,
  localSpecificDetail,
  setLocalSpecificDetail,
}: {
  selectedSpecificDetailCode: SpecificDetailCode;
  localSpecificDetail: SpecificDetail | undefined;
  setLocalSpecificDetail: (specificDetail: SpecificDetail | undefined) => void;
}) {
  const { warning } = useToastHelpers();
  const [inputContent, setInputContent] = useState("");
  const inputContentRef = useRef(inputContent);
  const localSpecificDetailRef = useRef(localSpecificDetail);

  // inputContent가 변경될 때마다 ref 업데이트
  useEffect(() => {
    inputContentRef.current = inputContent;
  }, [inputContent]);

  useEffect(() => {
    localSpecificDetailRef.current = localSpecificDetail;
  }, [localSpecificDetail]);

  const maxBytes = CODE_LIMITS[selectedSpecificDetailCode.code]; // undefined면 제한 없음
  const currentBytes = useMemo(() => getByteLength(inputContent), [inputContent]);

  // content 업데이트 및 SpecificDetail 생성
  const updateContent = useCallback(
    (newContent: string): boolean => {
      // maxBytes가 있을 때만 바이트 제한 체크
      if (maxBytes !== undefined) {
        const byteLength = getByteLength(newContent);
        if (byteLength > maxBytes) {
          warning(`${maxBytes}bytes 이상 입력할 수 없습니다.`);
          return false;
        }
      }

      setInputContent(newContent);

      const nextSpecificDetail: SpecificDetail = {
        code: selectedSpecificDetailCode.code,
        name: selectedSpecificDetailCode.name,
        content: newContent,
        type: selectedSpecificDetailCode.type,
      };

      // 동일 값 재설정으로 부모/자식이 반복 갱신되는 것을 방지한다.
      const currentSpecificDetail = localSpecificDetailRef.current;
      if (
        currentSpecificDetail?.code === nextSpecificDetail.code &&
        currentSpecificDetail?.name === nextSpecificDetail.name &&
        currentSpecificDetail?.content === nextSpecificDetail.content &&
        currentSpecificDetail?.type === nextSpecificDetail.type
      ) {
        return true;
      }

      setLocalSpecificDetail(nextSpecificDetail);

      return true;
    },
    [
      selectedSpecificDetailCode,
      setLocalSpecificDetail,
      maxBytes,
      warning,
    ]
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 슬래시 명령어 훅
  const {
    commandListRef,
    slashState,
    commandItems,
    handleKeyDown: slashHandleKeyDown,
    handleInputChange,
  } = useInputSlashCommand({
    templateCodeType: TemplateCodeType.특정내역,
    currentValue: inputContent,
    externalInputRef: textareaRef,
    onInsert: (content) => {
      updateContent(content);
    },
  });

  // selectedSpecificDetailCode가 변경되면 입력 초기화 + 포커스
  useEffect(() => {
    if (localSpecificDetail) {
      setInputContent(localSpecificDetail.content);
    } else {
      setInputContent("");
    }
    // textarea에 포커스 → 바로 입력 가능
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [selectedSpecificDetailCode]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;
      updateContent(value);
      handleInputChange(value, cursorPos);
    },
    [updateContent, handleInputChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      slashHandleKeyDown(e);
      if (e.key === "Enter") {
        // 부모 그리드의 Enter 이동 처리로 전파되지 않도록 차단
        e.stopPropagation();
      }
    },
    [slashHandleKeyDown]
  );

  const handleTemplateClick = useCallback(
    (template: TemplateCode) => {
      const strippedContent = stripHtmlTags(template.content);
      updateContent(`${inputContentRef.current}${strippedContent}`);
    },
    [updateContent]
  );

  return (
    <div className="flex flex-col w-full h-full">
      <textarea
        ref={textareaRef}
        className="flex-1 w-full resize-none p-2 text-[12px] outline-none"
        placeholder="내용을 입력하세요. ('/' 입력하여 상용구 검색)"
        value={inputContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {maxBytes !== undefined && (
        <div className="flex justify-end px-2 py-1 text-[10px] text-[var(--gray-400)]">
          {currentBytes} / {maxBytes} bytes (영문 {maxBytes}자, 한글 {Math.floor(maxBytes / 2)}자)
        </div>
      )}
      <TemplateCodeQuickBar
        templateCodeType={TemplateCodeType.특정내역}
        onTemplateClickAction={handleTemplateClick}
        className="p-[3px]"
      />
      <TextareaSlashCommandPopup
        ref={commandListRef}
        isOpen={slashState.isOpen}
        position={slashState.position}
        items={commandItems}
        onSelect={(item) => item.command({ editor: null as any, range: null as any })}
      />
    </div>
  );
}
