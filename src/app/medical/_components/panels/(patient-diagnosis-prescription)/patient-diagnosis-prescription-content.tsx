import { DiseaseGridRef } from "@/components/disease-order/disease/disease-grid";
import { OrderGridRef } from "@/components/disease-order/order/order-grid";
import { Disease } from "@/types/chart/disease-types";
import { Order } from "@/types/chart/order-types";
import { useEncounterStore } from "@/store/encounter-store";
import { useEffect, useCallback } from "react";
import DiseaseGrid from "@/components/disease-order/disease/disease-grid";
import OrderGrid from "@/components/disease-order/order/order-grid";
import { onGridCommand, offGridCommand, type GridCommand } from "@/lib/grid-command-channel";
import MySplitPane from "@/components/yjg/my-split-pane";
import { PC_DIAGNOSIS_HEADERS } from "@/components/disease-order/disease/disease-header";
import { PC_PRESCRIPTION_HEADERS } from "@/components/disease-order/order/order-header";
import { convertDiseasesToMyTreeGridType } from "@/components/disease-order/disease/converter/disease-converter";
import { convertOrdersToMyTreeGridType } from "@/components/disease-order/order/converter/order-converter";

export function Content({
  diagnosisGridRef,
  prescriptionGridRef,
  diseases,
  orders,
  isChartCheck = false,
}: {
  diagnosisGridRef: React.RefObject<DiseaseGridRef | null>;
  prescriptionGridRef: React.RefObject<OrderGridRef | null>;
  diseases: Disease[];
  orders: Order[];
  isChartCheck?: boolean;
}) {
  const {
    newDiseases,
    newOrders,
    newBundle,
    setNewDiseases,
    setNewOrders,
    setNewBundle,
    mergeDraftStatementSpecificDetail,
    setIsEncounterDataChanged,
  } = useEncounterStore();
  useEffect(() => {
    if (newDiseases) {
      console.log("[TEST] 진단", newDiseases);
      diagnosisGridRef.current?.addDiseases(newDiseases);
      setNewDiseases(null);
    }
  }, [newDiseases]);

  useEffect(() => {
    if (newOrders) {
      prescriptionGridRef.current?.addOrders(newOrders);
      setNewOrders(null);
    }
  }, [newOrders]);

  useEffect(() => {
    if (newBundle) {
      if (newBundle.specificDetail?.length) {
        mergeDraftStatementSpecificDetail(newBundle.specificDetail);
      }
      prescriptionGridRef.current?.addOrderLibrary(newBundle, false, "");
      setNewBundle(null);
    }
  }, [newBundle, mergeDraftStatementSpecificDetail, setNewBundle]);

  // 크로스 윈도우 커맨드 수신 (팝아웃 창 → 부모 창)
  const handleGridCommand = useCallback((cmd: GridCommand) => {
    switch (cmd.type) {
      case "add-diseases":
        diagnosisGridRef.current?.addDiseases(cmd.diseases);
        break;
      case "add-orders":
        prescriptionGridRef.current?.addOrders(cmd.orders);
        break;
      case "add-bundle":
        if (cmd.bundle.specificDetail?.length) {
          mergeDraftStatementSpecificDetail(cmd.bundle.specificDetail);
        }
        prescriptionGridRef.current?.addOrderLibrary(cmd.bundle, false, "");
        break;
    }
  }, [diagnosisGridRef, prescriptionGridRef, mergeDraftStatementSpecificDetail]);

  useEffect(() => {
    onGridCommand(handleGridCommand);
    return () => offGridCommand();
  }, [handleGridCommand]);

  const handleDataChanged = (isChanged: boolean) => {
    setIsEncounterDataChanged(isChanged);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="patient-diagnosis-prescription"
        testId="medical-diagnosis-prescription-split"
        isVertical={true}
        initialRatios={[0.4, 0.6]}
        panes={[
          <div className={`flex flex-col w-full h-full ${!isChartCheck && "p-2"}`}>
            <DiseaseGrid
              ref={diagnosisGridRef}
              headerLsKey={PC_DIAGNOSIS_HEADERS}
              data={diseases}
              onConvertToGridRowTypes={convertDiseasesToMyTreeGridType}
              isCheckExclude={true}
              onDataChanged={handleDataChanged}
            />
          </div>,
          <div className={`flex flex-col w-full h-full ${!isChartCheck && "p-2"}`}>
            <OrderGrid
              ref={prescriptionGridRef}
              headerLsKey={PC_PRESCRIPTION_HEADERS}
              data={orders}
              onConvertToGridRowTypes={convertOrdersToMyTreeGridType}
              isCheckProhibitedDrug={true}
              isCheckBundle={true}
              isCheckUserCode={true}
              isCheckInsuranceType={true}
              onDataChanged={handleDataChanged}
            />
          </div>,
        ]}
      />
    </div>
  );
}
