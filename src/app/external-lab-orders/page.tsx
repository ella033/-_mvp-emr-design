"use client";

import React, { useState } from "react";
import MySplitPane from "@/components/yjg/my-split-pane";
import EntrustedExaminationPatientList from "./_components/entrusted-examination-patient-list";
import ExaminationResultDetail from "./_components/examination-result-detail";

/**
 * External Lab Orders Page
 * 
 * 역할:
 * - 수탁의뢰 검사 환자 목록을 표시하는 페이지
 * - 진료를 마치고 수탁검사 처방이 있는 환자 리스트 표시
 * - 수탁기관에 전송 및 결과 수신 관리
 * - 왼쪽: 환자 리스트, 오른쪽: 수신결과 및 상세화면
 */
export default function ExternalLabOrdersPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLab, setSelectedLab] = useState<string>("전체");

  return (
    <div className="w-full h-full box-border bg-[var(--page-background)]">
      <MySplitPane
            splitPaneId="external-lab-orders-split"
            testId="external-lab-split"
            isVertical={false}
            panes={[
              <EntrustedExaminationPatientList 
                key="patient-list" 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedLab={selectedLab}
                onLabChange={setSelectedLab}
              />,
              <ExaminationResultDetail key="result-detail" />,
            ]}
            initialRatios={[0.5, 0.5]} // 리스트 60%, 상세 40%
            minPaneRatio={0.25}
          />
    </div>
  );
}

