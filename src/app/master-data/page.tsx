"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MyTabPanel, type MyTabItem } from "@/components/yjg/my-tabs";
import Drug from "./_components/(tabs)/(drug)/drug";
import Material from "./_components/(tabs)/(material)/material";
import MedicalAction from "./_components/(tabs)/(medical-action)/medical-action";
import MedicalExamine from "./_components/(tabs)/(medical-examine)/medical-examine";
import MasterBundle from "./_components/(tabs)/(bundle)/master-bundle";
import Usage from "./_components/(tabs)/(usage)/usage";
import VitalSign from "./_components/(tabs)/(vital-sign)/vital-sign";
import TemplateCodePage from "./_components/(tabs)/(template-code)/template-code-page";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";

type MasterDataTab =
  | "drug"
  | "material"
  | "action"
  | "examine"
  | "bundle"
  | "vital-sign"
  | "template-code"
  | "usage";

const TABS: MyTabItem<MasterDataTab>[] = [
  { key: "drug", label: "약품", testId: "master-data-tab-drug" },
  { key: "material", label: "치료재료", testId: "master-data-tab-material" },
  { key: "action", label: "행위", testId: "master-data-tab-action" },
  { key: "examine", label: "검사", testId: "master-data-tab-examine" },
  { key: "bundle", label: "묶음", testId: "master-data-tab-bundle" },
  { key: "vital-sign", label: "바이탈사인", testId: "master-data-tab-vital-sign" },
  { key: "template-code", label: "상용구", testId: "master-data-tab-template-code" },
  { key: "usage", label: "용법", testId: "master-data-tab-usage" },
];

const MASTER_DATA_TAB_SETTINGS = {
  scope: "user" as const,
  category: "master-data-tab",
  pageContext: "master-data-tab",
};

let saveTabTimer: NodeJS.Timeout | null = null;

const getInitialTab = (tabParam: MasterDataTab | null): MasterDataTab => {
  if (tabParam && TABS.some((t) => t.key === tabParam)) return tabParam;
  const state = useSettingsStore.getState();
  const saved = state.getSettingsByCategoryAndPageContext(
    MASTER_DATA_TAB_SETTINGS.category,
    MASTER_DATA_TAB_SETTINGS.pageContext
  );
  const savedTab = saved?.settings?.activeTab as MasterDataTab | undefined;
  if (savedTab && TABS.some((t) => t.key === savedTab)) return savedTab;
  return "drug";
};

const saveTabSetting = (activeTab: MasterDataTab) => {
  const state = useSettingsStore.getState();
  const existing = state.getSettingsByCategoryAndPageContext(
    MASTER_DATA_TAB_SETTINGS.category,
    MASTER_DATA_TAB_SETTINGS.pageContext
  );
  if (existing?.settings?.activeTab === activeTab) return;

  const payload = {
    scope: MASTER_DATA_TAB_SETTINGS.scope,
    category: MASTER_DATA_TAB_SETTINGS.category,
    pageContext: MASTER_DATA_TAB_SETTINGS.pageContext,
    settings: { activeTab },
  };

  state.updateSettingLocally(payload);

  if (saveTabTimer) clearTimeout(saveTabTimer);
  saveTabTimer = setTimeout(() => {
    SettingsService.createOrUpdateSetting(payload).catch((error) => {
      console.error("[MasterData] 탭 설정 저장 실패:", error);
    });
    saveTabTimer = null;
  }, 400);
};

const TAB_CONTENT: Record<MasterDataTab, React.ReactNode> = {
  drug: <Drug />,
  material: <Material />,
  action: <MedicalAction />,
  examine: <MedicalExamine />,
  bundle: <MasterBundle />,
  "vital-sign": <VitalSign />,
  "template-code": <TemplateCodePage />,
  usage: <Usage />,
};

function MasterDataContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as MasterDataTab | null;
  const isSettingsLoaded = useSettingsStore((s) => s.isLoaded);
  const didSyncRef = useRef(false);

  const [activeTab, setActiveTab] = useState<MasterDataTab>(
    () => getInitialTab(tabParam)
  );

  // URL 쿼리 파라미터 변경 시 탭 동기화
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // settings가 늦게 로드된 경우 저장된 탭으로 1회 동기화
  useEffect(() => {
    if (!isSettingsLoaded || didSyncRef.current) return;
    didSyncRef.current = true;
    if (!tabParam) {
      const saved = getInitialTab(null);
      setActiveTab((prev) => (prev === saved ? prev : saved));
    }
  }, [isSettingsLoaded, tabParam]);

  // 탭 변경 시 서버에 저장
  useEffect(() => {
    saveTabSetting(activeTab);
  }, [activeTab]);

  return (
    <div className="flex h-full w-full bg-[var(--bg-base)] p-2">
      <MyTabPanel
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="boxed"
        size="sm"
        className="h-full w-full"
        contentClassName="bg-[var(--bg-main)] rounded-lg"
      >
        {TAB_CONTENT[activeTab]}
      </MyTabPanel>
    </div>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          로딩 중...
        </div>
      }
    >
      <MasterDataContent />
    </Suspense>
  );
}
