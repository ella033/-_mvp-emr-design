import type { Patient } from "@/types/patient-types";
import MySplitPane from "../yjg/my-split-pane";
import VitalChart from "./vital-chart";
import VitalGrid from "./vital-grid";
import type { VitalGridHandle } from "./vital-grid";
import { useVitalSignItems } from "@/hooks/vital-sign-item/use-vital-sign-items";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { formatDateByPattern } from "@/lib/date-utils";
import { SearchPeriod } from "@/constants/common/common-enum";
import { useVitalSignMeasurementsPivot } from "@/hooks/vital-sign-measurement/use-vital-sign-measurements";
import type { VitalSignSubItemGroup } from "@/types/vital/vital-sign-sub-items-types";
import { useQueries } from "@tanstack/react-query";
import { VitalSignSubItemsService } from "@/services/vital-sign-sub-items-service";
import { MyButton } from "@/components/yjg/my-button";
import { MyPopupYesNo } from "../yjg/my-pop-up";

interface VitalMainProps {
  patient: Patient;
  onClose?: () => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 초기화
const getTodayDate = () => {
  return formatDateByPattern(new Date(), "YYYY-MM-DD");
};

// period에 따라 from 날짜 계산
const calculateFromDate = (periodValue: number) => {
  const today = new Date();
  const fromDate = new Date(today);

  switch (periodValue) {
    case SearchPeriod.OneMonth:
      fromDate.setMonth(today.getMonth() - 1);
      break;
    case SearchPeriod.TwoMonths:
      fromDate.setMonth(today.getMonth() - 2);
      break;
    case SearchPeriod.ThreeMonths:
      fromDate.setMonth(today.getMonth() - 3);
      break;
    case SearchPeriod.SixMonths:
      fromDate.setMonth(today.getMonth() - 6);
      break;
    case SearchPeriod.OneYear:
      fromDate.setFullYear(today.getFullYear() - 1);
      break;
  }

  return formatDateByPattern(fromDate, "YYYY-MM-DD");
};

export default function VitalMain({ patient, onClose }: VitalMainProps) {
  const [from, setFrom] = useState<string>(() => getTodayDate());
  const [to, setTo] = useState<string>(getTodayDate());
  const [period, setPeriod] = useState<number>(SearchPeriod.all);
  const [isDirty, setIsDirty] = useState(false);
  const [dialogReason, setDialogReason] = useState<'close' | 'patient-change' | null>(null);
  const pendingPatientRef = useRef<Patient | null>(null);
  const vitalGridRef = useRef<VitalGridHandle | null>(null);

  const { data: vitalSignItems = [], isLoading: isLoadingVitalSignItems } =
    useVitalSignItems();

  // isActive가 true인 항목만 필터링
  const activeVitalSignItems = useMemo(() => {
    return vitalSignItems.filter(
      (item) => item.vitalSignItemSettings[0]?.isActive === true
    );
  }, [vitalSignItems]);

  const isAllPeriod = period === SearchPeriod.all;
  const {
    data: vitalSignMeasurementsPivot = [],
    isLoading: isLoadingVitalSignMeasurementsPivot,
  } = useVitalSignMeasurementsPivot(
    patient.id,
    isAllPeriod ? undefined : from,
    isAllPeriod ? undefined : to
  );

  // activeVitalSignItems가 로드되면 각 아이템의 서브아이템을 가져옴
  const subItemQueries = useQueries({
    queries: activeVitalSignItems.map((item) => ({
      queryKey: ["vital-sign-sub-items", item.id],
      queryFn: () => VitalSignSubItemsService.getVitalSignSubItems(item.id),
      enabled: activeVitalSignItems.length > 0,
    })),
  });

  const isLoadingSubItems = subItemQueries.some((q) => q.isLoading);

  // 서브아이템 쿼리 결과를 VitalSignSubItemGroup 배열로 변환
  const vitalSubItemGroups = useMemo<VitalSignSubItemGroup[]>(() => {
    return activeVitalSignItems
      .map((item, index) => ({
        itemId: item.id,
        subItems: subItemQueries[index]?.data ?? [],
      }))
      .filter((group) => group.subItems.length > 0);
  }, [activeVitalSignItems, subItemQueries]);

  // period가 변경되면 from 날짜 자동 계산
  useEffect(() => {
    const newFromDate = calculateFromDate(period);
    setFrom((prevFrom) => {
      if (prevFrom === newFromDate) return prevFrom;
      return newFromDate;
    });
  }, [period]);

  // 환자 변경 시 이탈 방지: patient.id가 변경될 때 isDirty면 다이얼로그
  const prevPatientIdRef = useRef(patient.id);
  useEffect(() => {
    if (prevPatientIdRef.current !== patient.id && isDirty) {
      // 환자가 변경되었고 저장하지 않은 변경사항이 있음
      pendingPatientRef.current = patient;
      setDialogReason('patient-change');
    } else {
      prevPatientIdRef.current = patient.id;
    }
  }, [patient.id, isDirty]);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  // 저장 완료 후 팝업 닫기를 위한 ref
  const pendingCloseAfterSaveRef = useRef(false);

  const handleSaveSuccess = useCallback(() => {
    if (pendingCloseAfterSaveRef.current) {
      pendingCloseAfterSaveRef.current = false;
      onClose?.();
    }
  }, [onClose]);

  // 통합 다이얼로그: "저장" 선택
  const handleDialogSave = useCallback(() => {
    if (dialogReason === 'close') {
      pendingCloseAfterSaveRef.current = true;
      vitalGridRef.current?.save();
    } else if (dialogReason === 'patient-change') {
      vitalGridRef.current?.save();
      prevPatientIdRef.current = patient.id;
      pendingPatientRef.current = null;
    }
    setDialogReason(null);
  }, [dialogReason, patient.id]);

  // 통합 다이얼로그: "저장 안함" 선택
  const handleDialogDiscard = useCallback(() => {
    vitalGridRef.current?.cancel();
    if (dialogReason === 'close') {
      onClose?.();
    } else if (dialogReason === 'patient-change') {
      prevPatientIdRef.current = patient.id;
      pendingPatientRef.current = null;
    }
    setDialogReason(null);
  }, [dialogReason, patient.id, onClose]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 min-h-0">
        <MySplitPane
          splitPaneId="vital-main"
          isVertical={true}
          initialRatios={[0.5, 0.5]}
          panes={[
            <VitalGrid
              patient={patient}
              vitalSignItems={activeVitalSignItems}
              vitalSubItemGroups={vitalSubItemGroups}
              vitalSignMeasurements={vitalSignMeasurementsPivot}
              isLoading={
                isLoadingVitalSignItems ||
                isLoadingVitalSignMeasurementsPivot ||
                isLoadingSubItems
              }
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
              period={period}
              setPeriod={setPeriod}
              onDirtyChange={handleDirtyChange}
              onSaveSuccess={handleSaveSuccess}
              ref={vitalGridRef}
            />,
            <VitalChart
              vitalSignItems={activeVitalSignItems}
              vitalSignMeasurements={vitalSignMeasurementsPivot}
            />,
          ]}
        />
      </div>

      {/* 저장/취소 버튼 영역 - VitalChart 하단 우측 */}
      <div className="flex justify-end gap-2 px-2 py-2">
        <MyButton
          variant="outline"
          onClick={() => {
            if (isDirty) {
              setDialogReason('close');
            } else {
              onClose?.();
            }
          }}
        >
          취소
        </MyButton>
        <MyButton
          variant="default"
          onClick={() => vitalGridRef.current?.save()}
          disabled={!isDirty}
        >
          저장
        </MyButton>
      </div>

      {/* 저장 확인 다이얼로그 (닫기/환자변경 통합) */}
      <MyPopupYesNo
        isOpen={dialogReason !== null}
        onCloseAction={handleDialogDiscard}
        onConfirmAction={handleDialogSave}
        hideHeader={false}
        title="저장하지 않은 변경사항"
        message="저장되지 않은 정보가 있습니다. 저장하시겠습니까?"
        confirmText="저장"
        cancelText="저장 안함"
      />
    </div>
  );
}
