import type { Registration } from "@/types/registration-types";
import { 보험구분상세Label } from "@/constants/common/common-enum";

export const PatientBadge = ({
  registration,
}: {
  registration: Registration;
}) => {
  // 보험타입 뱃지
  const insuranceBadge = (
    <span className="flex items-center rounded-sm px-1 py-0.5 bg-[#e2f2ff] text-blue-600 box-border dark:bg-[#222222] dark:text-blue-400">
      {보험구분상세Label[registration.insuranceType]}
    </span>
  );

  // 진료실 뱃지
  const clinicBadge = (
    <>
      {registration.patient?.chronicDisease?.hypertension && (
        <span className="flex items-center rounded px-1 py-0.5 bg-[#FFF5F0] text-[#FF6F2D] box-border dark:bg-[#222222] dark:text-[#FF6F2D]">
          고
        </span>
      )}
      {registration.patient?.chronicDisease?.diabetes && (
        <span className="flex items-center rounded px-1 py-0.5 bg-[#FFF5F0] text-[#FF6F2D] box-border dark:bg-[#222222] dark:text-[#FF6F2D]">
          당
        </span>
      )}
    </>
  );

  // 수납실 추가 뱃지
  const paymentBadges = (
    <>
      <span className="border rounded-sm px-1 py-0.5">주</span>
      <span className="border rounded-sm px-1 py-0.5">물</span>
      <span className="border rounded-sm px-1 py-0.5">🗒️</span>
    </>
  );

  if (registration.roomPanel === "예약") {
    return (
      <div className="flex gap-1 text-xs">
        <span className="border rounded-sm px-1 py-0.5">초</span>
      </div>
    );
  }

  if (registration.roomPanel?.includes("진료실")) {
    return (
      <div className="flex gap-1 text-xs">
        {clinicBadge}
        {insuranceBadge}
      </div>
    );
  }

  if (registration.roomPanel === "수납실") {
    return (
      <div className="flex gap-1 text-xs">
        {insuranceBadge}
        {paymentBadges}
      </div>
    );
  }

  // 기본값(뱃지 없음)
  return null;
};
