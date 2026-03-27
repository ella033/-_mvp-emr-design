"use client";

import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  safeJsonParse,
  safeLocalStorage,
} from "@/components/yjg/common/util/ui-util";
import { useUserStore } from "@/store/user-store";

type RoleInfo = {
  roleName: string;
  isOwner: boolean;
};

const resolveUser = (storeUser: unknown) => {
  if (
    storeUser &&
    Object.keys(storeUser as Record<string, unknown>).length > 0
  ) {
    return storeUser as any;
  }
  return safeJsonParse(safeLocalStorage.getItem("user"), {} as any);
};

const extractRoleInfo = (user: any): RoleInfo => {
  const hospitals = user?.hospitals ?? [];
  const currentHospitalId =
    user?.hospitalId ?? (hospitals.length > 0 ? hospitals[0].hospitalId : null);
  const currentHospital =
    hospitals.find(
      (hospital: any) => hospital.hospitalId === currentHospitalId
    ) ?? hospitals[0];

  const isOwner = Boolean(currentHospital?.isOwner);
  const roleNameFromHospital = currentHospital?.roleName;
  const roleNameFromUser = user?.roleName;

  const roleName =
    roleNameFromUser ||
    roleNameFromHospital ||
    (isOwner ? "병원 대표자" : "직원");

  return { roleName, isOwner };
};

const RoleBadge = ({ roleName, isOwner }: RoleInfo) => {
  const tone = isOwner
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : "bg-slate-50 text-slate-700 border-slate-100";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {isOwner ? "대표자" : "내 역할"} · {roleName}
    </span>
  );
};

type SettingPageHeaderProps = {
  title: string;
  tooltipContent?: string;
  infoAriaLabel?: string;
  showRoleBadge?: boolean;
  className?: string;
};

export function SettingPageHeader({
  title,
  tooltipContent,
  infoAriaLabel = "권한 안내",
  showRoleBadge = false,
  className = "",
}: SettingPageHeaderProps) {
  const { user } = useUserStore();

  const roleInfo = useMemo(() => {
    if (!showRoleBadge) return null;
    const resolved = resolveUser(user);
    return extractRoleInfo(resolved);
  }, [user, showRoleBadge]);

  return (
    <section className={`flex items-center gap-2 ${className}`}>
      <div className="font-pretendard text-[16px] font-bold leading-[140%] tracking-[-0.16px]">
        {title}
      </div>
      {showRoleBadge && roleInfo ? (
        <RoleBadge roleName={roleInfo.roleName} isOwner={roleInfo.isOwner} />
      ) : null}
      {tooltipContent ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div aria-label={infoAriaLabel} className="cursor-help">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_5680_30500)">
                  <path d="M2 8C2 8.78793 2.15519 9.56815 2.45672 10.2961C2.75825 11.0241 3.20021 11.6855 3.75736 12.2426C4.31451 12.7998 4.97595 13.2417 5.7039 13.5433C6.43185 13.8448 7.21207 14 8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 6.4087 13.3679 4.88258 12.2426 3.75736C11.1174 2.63214 9.5913 2 8 2C6.4087 2 4.88258 2.63214 3.75736 3.75736C2.63214 4.88258 2 6.4087 2 8Z" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 5.33301V7.99967" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 10.667H8.00556" stroke="#46474C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_5680_30500">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>


          </TooltipTrigger>
          <TooltipContent className="bg-slate-800 text-white border-slate-800 max-w-xs" side="top">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </section>
  );
}
