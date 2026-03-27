import MyInput from "@/components/yjg/my-input";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useReceptionStore } from "@/store/reception";
import type { Registration } from "@/types/registration-types";
import { useState, useEffect } from "react";

export default function RegistrationMemo({
  registration,
}: {
  registration: Registration;
}) {
  const { mutate: updateRegistrationApi } = useUpdateRegistration();
  const { updateRegistration } = useReceptionStore();
  const [memo, setMemo] = useState(registration.memo);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setMemo(registration.memo);
  }, [registration.memo]);

  const handleBlur = (value: string) => {
    setMemo(value);

    updateRegistrationApi(
      {
        id: String(registration.id),
        data: { memo: value },
      },
      {
        onSuccess: () => {
          updateRegistration(String(registration.id), { memo: value });
          setIsEditMode(false);
        },
      }
    );
  };

  return (
    <MyTooltip
      side="bottom"
      align="start"
      delayDuration={1000}
      className="max-w-[30vh] max-h-[30vh] my-scroll"
      content={
        <div>
          {memo === "" ? (
            <div className="text-sm text-white">접수메모가 없습니다.</div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{memo}</pre>
          )}
        </div>
      }
    >
      <div
        className="flex flex-1 gap-2 items-center min-w-[200px]"
        onDoubleClick={() => setIsEditMode(true)}
      >
        <div className="text-[12px] font-[500] flex items-center justify-center border border-[var(--border-1)] bg-[var(--gray-white)] rounded-[4px] px-[4px] py-[1px]">
          접수메모
        </div>
        <div className="flex flex-1 items-center min-w-0">
          {isEditMode ? (
            <MyInput
              type="text"
              value={memo}
              className="flex-1 min-w-0"
              onBlur={(value) => {
                handleBlur(String(value));
              }}
            />
          ) : (
            <div className="text-[12px] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {memo}
            </div>
          )}
        </div>
      </div>
    </MyTooltip>
  );
}
