"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import { useAccessHistoryStore } from "@/store/access-history-store";

const TABS = [
  {
    id: "destruction",
    name: "개인정보 파기",
    href: "/settings/personal-privacy/destruction",
  },
  {
    id: "access-history",
    name: "개인정보 접근 내역",
    href: "/settings/personal-privacy/access-history",
  },
  {
    id: "medical-access-history",
    name: "진료정보 접근 내역",
    href: "/settings/personal-privacy/medical-access-history",
  },
];

export default function PersonalPrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const resetAccessHistory = useAccessHistoryStore((state) => state.reset);

  useEffect(() => {
    return () => {
      resetAccessHistory();
    };
  }, [resetAccessHistory]);

  return (
    <div
      className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]"
      data-testid="settings-personal-privacy-page"
    >
      <SettingPageHeader
        title="개인정보 관리"
        tooltipContent="개인정보 파기 및 접근 내역을 관리합니다."
      />
      <section className="flex flex-row lg:flex-row gap-[20px] w-full min-h-[500px] lg:min-h-[600px] flex-1 overflow-hidden">
        <SectionLayout
          className="!pt-[8px]"
          body={
            <>
              <div className="flex w-full items-stretch text-sm">
                {TABS.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      data-testid={`settings-personal-privacy-tab-${tab.id}`}
                      className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1 px-3 py-[10px] transition cursor-pointer hover:bg-slate-50",
                        isActive
                          ? "border-b-2 border-slate-900 text-slate-900 font-bold"
                          : "border-b-2 border-slate-200 text-slate-500 font-medium hover:text-slate-800"
                      )}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </div>
              <div className="flex h-full flex-col overflow-hidden mt-[4px] gap-[12px]">
                {children}
              </div>
            </>
          }
        />
      </section>
    </div>
  );
}
