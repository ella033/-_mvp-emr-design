"use client";

import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InternalLab } from "./internal-lab";
import { ExternalLab } from "./external-lab";
import { SettingPageHeader } from "../../commons/setting-page-header";

export const LabManagementPage = () => {
  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]">
      <SettingPageHeader
        title="검사 관리"
        tooltipContent="병원 대표자는 원내 질가산등급과 수탁기관의 질가산등급을 관리할 수 있습니다. 사용할 수탁기관을 선택하면 해당 기관의 검사목록이 기초자료에 추가됩니다."
      />
      <section className="flex flex-col lg:flex-row gap-[20px] w-full min-h-[500px] lg:min-h-[600px] flex-1 overflow-hidden">
        <div className="flex flex-1 min-h-[500px]">
          <InternalLab />
        </div>
        <div className="flex flex-1 min-h-[500px]">
          <ExternalLab />
        </div>
      </section>
    </div>
    // <div className="h-full w-full p-6 space-y-6">
    //   {/* 페이지 타이틀 */}
    //   <div className="flex items-center gap-2">
    //     <h1 className="text-2xl font-semibold">검사 관리</h1>
    //     <Tooltip>
    //       <TooltipTrigger asChild>
    //         <HelpCircle className="w-5 h-5 text-muted-foreground cursor-help" />
    //       </TooltipTrigger>
    //       <TooltipContent>
    //         <p className="max-w-xs">
    //           원내 질가산등급과 수탁기관의 질가산등급을 관리할 수 있습니다. 사용할 수탁기관을 선택하면 해당 기관의 검사목록이 기초자료에 추가됩니다.
    //         </p>
    //       </TooltipContent>
    //     </Tooltip>
    //   </div>

    //   {/* 두 개의 카드 레이아웃 */}
    //   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
    //     {/* 왼쪽 카드: 원내 질가산등급관리 */}
    //     <Card className="flex flex-col h-full">
    //       <CardContent className="flex-1 overflow-y-auto p-6">
    //         <InternalLab />
    //       </CardContent>
    //     </Card>

    //     {/* 오른쪽 카드: 수탁기관 관리 */}
    //     <Card className="flex flex-col h-full">
    //       <CardContent className="flex-1 overflow-y-auto p-6">
    //         <ExternalLab />
    //       </CardContent>
    //     </Card>
    //   </div>
    // </div>
  );
};
