// 새 파일 추가: src/app/claims/_components/(detail)/claims-dx-adapter.tsx
"use client";

import React, { useEffect, useRef } from "react";
import MySplitPane from "@/components/yjg/my-split-pane";
import DiseaseGrid from "@/app/medical/_components/panels/(patient-diagnosis)/(disease)/disease-grid";
import OrderGrid from "@/app/medical/_components/panels/(patient-diagnosis)/(order)/order-grid";
import { useEncounterStore } from "@/store/encounter-store";
import { useClaimsDxStore } from "../(stores)/claims-dx-store";
import type {
  Disease,
  Order,
  DiseaseWithTempId,
  OrderWithTempId,
} from "@/types/chart/chart";

type Props = {
  diseases?: Disease[];
  orders?: Order[];
};

function mapDiseases(c: any): Disease[] {
  const list = c?.claimDetailDiseases ?? [];
  return list.map((d: any) => ({
    code: d.diseaseClassificationCode || "",
    name: d.name || "",
    department: 0,
    isSuspected: false,
    isLeftSide: false,
    isRightSide: false,
    specificSymbol: "",
    externalCauseCode: "",
  }));
}

function mapOrders(c: any): Order[] {
  const rows: Order[] = [];
  const treat = c?.claimDetailTreatments ?? [];
  treat.forEach((t: any, idx: number) => {
    rows.push({
      sortNumber: idx,
      parentSortNumber: null,
      userCode: "",
      claimCode: t.code || "",
      name: t.name || "",
      dose: Number(t.singleDoseAmount ?? 0) || undefined,
      times: Number(t.dailyDosageOrFrequency ?? 0) || undefined,
      days: Number(t.totalDaysOrFrequency ?? 0) || undefined,
      insurancePrice: Number(t.amount ?? 0) || 0,
      treatmentDateTime: new Date().toISOString(),
    });
  });
  const rx = c?.claimDetailPrescriptions ?? [];
  rx.forEach((p: any, idx: number) => {
    rows.push({
      sortNumber: treat.length + idx,
      parentSortNumber: null,
      userCode: "",
      claimCode: p.code || "",
      name: p.name || "",
      dose: Number(p.singleDoseAmount ?? 0) || undefined,
      times: Number(p.dailyDosageOrFrequency ?? 0) || undefined,
      days: Number(p.totalDaysOrFrequency ?? 0) || undefined,
      insurancePrice: Number(p.amount ?? 0) || 0,
      treatmentDateTime: new Date().toISOString(),
    });
  });
  return rows;
}

function ClaimsDxAdapterImpl({ diseases, orders }: Props) {
  const {
    activeDiseaseArr,
    activeOrderArr,
    setActiveDiseaseArrAndOrderArrWithTempId,
    setActiveDiseaseArr,
    setActiveOrderArr,
  } = useEncounterStore();
  const setDxStore = useClaimsDxStore((s) => s.setFromEncounter);
  const claimDetail = useClaimsDxStore((s) => s.claimDetail);

  // capture initial mapped data once from global claimDetail (fallback to props)
  const initialDiseasesRef = useRef<Disease[]>(
    diseases ?? mapDiseases(claimDetail)
  );
  const initialOrdersRef = useRef<Order[]>(orders ?? mapOrders(claimDetail));
  const injectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (injectedRef.current) return;
    injectedRef.current = true;

    // snapshot previous encounter data
    const prevDiseases: DiseaseWithTempId[] = activeDiseaseArr;
    const prevOrders: OrderWithTempId[] = activeOrderArr;

    // inject initial claims data into encounter store once
    setActiveDiseaseArrAndOrderArrWithTempId(
      initialDiseasesRef.current,
      initialOrdersRef.current
    );

    // forward encounter changes into claims dx store
    const unsub = useEncounterStore.subscribe((state) => {
      setDxStore(
        state.activeDiseaseArr as DiseaseWithTempId[],
        state.activeOrderArr as OrderWithTempId[]
      );
    });

    // seed dx store immediately
    setDxStore(
      useEncounterStore.getState().activeDiseaseArr as DiseaseWithTempId[],
      useEncounterStore.getState().activeOrderArr as OrderWithTempId[]
    );

    return () => {
      unsub();
      // restore previous encounter state
      setActiveDiseaseArr(prevDiseases);
      setActiveOrderArr(prevOrders);
    };
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col gap-1 box-border overflow-hidden">
      <MySplitPane
        splitPaneId="claims-dx-pane"
        testId="claims-dx-split"
        initialRatios={[0.3, 0.7]}
        panes={[<DiseaseGrid />, <OrderGrid />]}
      />
    </div>
  );
}

export default React.memo(ClaimsDxAdapterImpl);
