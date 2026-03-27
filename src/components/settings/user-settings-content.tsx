"use client";

import React, { useState, useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import { AccountInfoTab } from "./user-settings/account-info-tab";
import { GeneralSettingsTab } from "./user-settings/general-settings-tab";
import { AlertSettingsTab } from "./user-settings/alert-settings-tab";
import { SecurityManagementTab } from "./user-settings/security-management-tab";
import { CertificateManagementTab } from "./user-settings/certificate-management-tab";

// 탭 정의
type UserSettingsTab = "account" | "general" | "alert" | "security" | "certificate";

const tabs = [
  { id: "account" as UserSettingsTab, label: "계정 정보" },
  { id: "general" as UserSettingsTab, label: "일반 설정" },
  { id: "alert" as UserSettingsTab, label: "알림 설정" },
  { id: "security" as UserSettingsTab, label: "보안 관리" },
  { id: "certificate" as UserSettingsTab, label: "인증서 관리" },
];

interface UserSettingsContentProps {
  className?: string;
  onDirtyChange?: (isDirty: boolean) => void;
  initialTab?: string;
}

export function UserSettingsContent({
  className = "",
  onDirtyChange,
  initialTab,
}: UserSettingsContentProps) {
  const [activeTab, setActiveTab] = useState<UserSettingsTab>((initialTab as UserSettingsTab) || "account");
  const { user } = useUserStore();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as UserSettingsTab);
    }
  }, [initialTab]);

  const handleTabChange = (newTab: UserSettingsTab) => {
    setActiveTab(newTab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountInfoTab />;
      case "general":
        return <GeneralSettingsTab />;
      case "alert":
        return <AlertSettingsTab />;
      case "security":
        return <SecurityManagementTab />;
      case "certificate":
        return <CertificateManagementTab />;
      default:
        return <div>컨텐츠를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <div className={`flex h-full w-full ${className}`}>
      {/* 좌측 탭 */}
      <div className="w-[150px] min-w-[120px] border-r flex-shrink-0">
        <div className="pl-5 pt-6 pr-5">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full px-2 py-3 rounded-md mb-2 transition-colors cursor-pointer flex items-center space-x-2 ${activeTab === tab.id
                ? "bg-[var(--setting-hover-background)] font-bold text-primary"
                : "hover:bg-[var(--setting-hover-background)] text-muted-foreground"
                }`}
            >
              <span className="text-sm">{tab.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 우측 컨텐츠 */}
      <div className="flex-1 pl-8 pr-6 pt-12 overflow-y-hidden min-w-0">
        <div className="h-full overflow-y-auto scrollbar-gutter-stable">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
