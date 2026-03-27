"use client";

type AccessLogsTabsProps = {
  activeTab: "history" | "online";
  onChange: (tab: "history" | "online") => void;
};

export function AccessLogsTabs({ activeTab, onChange }: AccessLogsTabsProps) {
  return (
    <div className="flex w-full items-stretch text-sm">
      <button
        type="button"
        onClick={() => onChange("history")}
        className={`flex flex-1 flex-col items-center justify-center gap-1 px-3 py-[10px] transition cursor-pointer hover:bg-slate-50 ${activeTab === "history"
          ? "border-b-2 border-slate-900 text-slate-900 font-bold"
          : "border-b-2 border-slate-200 text-slate-500 font-medium hover:text-slate-800"
          }`}
      >
        접속 내역
      </button>
      <button
        type="button"
        onClick={() => onChange("online")}
        className={`flex flex-1 flex-col items-center justify-center gap-1 px-3 py-[10px] transition cursor-pointer hover:bg-slate-50 ${activeTab === "online"
          ? "border-b-2 border-slate-900 text-slate-900 font-bold"
          : "border-b-2 border-slate-200 text-slate-500 font-medium hover:text-slate-800"
          }`}
      >
        현재 접속 현황
      </button>
    </div>
  );
}
