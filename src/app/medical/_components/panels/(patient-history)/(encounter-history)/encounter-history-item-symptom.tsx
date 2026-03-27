import { useEncounterStore } from "@/store/encounter-store";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { HEADER_TEXT_CLASS } from "@/components/yjg/common/constant/class-constants";
import { RepeatIcon } from "@/components/custom-icons";
import { highlightKeywordInHTML } from "@/components/yjg/common/util/ui-util";

export default function EncounterHistoryItemSymptom({
  symptom,
  searchKeyword,
  canRepeat
}: {
  symptom: string;
  searchKeyword?: string;
  canRepeat: boolean;
}) {
  const { setNewSymptom } = useEncounterStore();

  if (!symptom || symptom.trim().length === 0 || symptom.trim() === "<p></p>") {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between">
        <MyTooltip side="right" content={canRepeat ? "증상을 리핏합니다." : ""}>
          <div
            className={cn(
              "flex flex-row items-center justify-between flex-1 p-[4px]",
              canRepeat
                ? "cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] rounded-sm"
                : "cursor-default"
            )}
            onClick={(e) => {
              if (!canRepeat) return;
              e.stopPropagation();
              setNewSymptom(symptom || "");
            }}
          >
            <span className={HEADER_TEXT_CLASS}>증상</span>
            {canRepeat && (
              <RepeatIcon className="w-[12px] h-[12px]" />
            )}
          </div>
        </MyTooltip>
      </div>
      <div className="border border-[var(--input-border)] rounded-sm">
        <div
          className="my-tiptap-editor tiptap ProseMirror read-only p-2 rounded-sm"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              highlightKeywordInHTML(symptom, searchKeyword)
            ),
          }}
        />
      </div>
    </div>
  );
}
