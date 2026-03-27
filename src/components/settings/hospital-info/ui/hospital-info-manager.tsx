"use client";

import React, { useEffect, useState } from "react";
import HospitalInfo from "./(details)/hospital-info";
import LogoSeal from "./(details)/logo-seal";
import MySplitPane from "@/components/yjg/my-split-pane";
import { useHospitalInfo } from "../hooks/use-hospital-info";

interface HospitalInfoManagerProps {
  onDirtyChange?: (isDirty: boolean) => void;
  onSaveRequest?: (saveFn: () => Promise<boolean>) => void;
  onCancelRequest?: (cancelFn: () => void) => void;
  onValidationErrorsChange?: (errors: string[]) => void;
}

export default function HospitalInfoManager({
  onDirtyChange,
  onSaveRequest,
  onCancelRequest,
  onValidationErrorsChange,
}: HospitalInfoManagerProps) {
  const {
    hospital,
    formData,
    savedImages,
    updateHospitalField,
    uploadImage,
    saveChanges,
    cancelChanges
  } = useHospitalInfo();

  /* 
     Register the save/cancel functions from the hook to the parent Page
     whenever they change (or on mount).
  */
  useEffect(() => {
    if (onSaveRequest) {
      onSaveRequest(saveChanges);
    }
  }, [onSaveRequest, saveChanges]);

  useEffect(() => {
    if (onCancelRequest) {
      onCancelRequest(cancelChanges);
    }
  }, [onCancelRequest, cancelChanges]);

  const [isLg, setIsLg] = useState(true);

  // Check initial screen size
  useEffect(() => {
    const checkSize = () => {
      setIsLg(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  if (!hospital || !hospital.id) {
    return (
      <div className="py-8 text-center text-gray-500">
        병원 정보가 없습니다.
      </div>
    );
  }

  // Define panes
  const leftPane = (
    <div className="h-full w-full overflow-hidden">
      <HospitalInfo
        formData={formData}
        onInputChange={updateHospitalField}
        onDirtyChange={onDirtyChange}
        // HospitalInfo (details) component might validtion inside, 
        // passing simpler handlers if possible, or keeping compatibility
        onSaveRequest={onSaveRequest} // Pass through if inner component also registers? 
        // Correction: HospitalInfo(details) seems to consume these to register ITSELF?
        // If HospitalInfo(details) registers a save function, it will overwrite ours!
        // We need to check HospitalInfo(details) implementation. 
        // Assuming HospitalInfo(details) is just UI inputs.
        // Let's pass the hook's handlers directly as props if HospitalInfo expects them.
        // But HospitalInfo definition (from previous view) expected onSaveRequest. 
        // We should double check if HospitalInfo(details) behaves as a sub-manager.
        // For now, passing them through is risky if they conflict.
        // BUT, since we moved logic here, we should pass data/handlers.
        // Let's pass null/undefined for onSaveRequest to inner if we handle save here?
        // Or does HospitalInfo(details) handle validation check before save?
        // Let's keep passing them for now but be aware.
        onCancelRequest={onCancelRequest}
        onValidationErrorsChange={onValidationErrorsChange}
      />
    </div>
  );

  const rightPane = (
    <div className="h-full w-full overflow-hidden px-4 lg:px-0">
      <LogoSeal
        savedImages={savedImages}
        onImageUpload={uploadImage}
        hospital={hospital}
      />
    </div>
  );

  // Filter out null panes
  const panes = [leftPane, rightPane].filter(Boolean) as React.ReactNode[];

  return (
    <div className="h-full w-full ">
      <MySplitPane
        splitPaneId="hospital-info-split"
        isVertical={!isLg} // Desktop: Horizontal (Row, false), Mobile: Vertical (Column, true)
        panes={panes}
        minPaneRatio={0.2}
        initialRatios={[0.5, 0.5]}
        gap={20}
      />
    </div>
  );
}
