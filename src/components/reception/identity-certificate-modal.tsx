"use client";

import React from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import CertificateForm from "@/components/reception/board-patient/(patient-info)/certificate-form";

export interface IdentityCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCheck: () => void;
  recentCheckDate?: string | null;
  identityOptional?: boolean;
}

export function IdentityCertificateModal({
  isOpen,
  onClose,
  onConfirm,
  onCheck,
  recentCheckDate = null,
  identityOptional = false,
}: IdentityCertificateModalProps) {
  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title="본인확인"
      fitContent={true}
      height="100px"
    >
      <CertificateForm
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        onCancel={onClose}
        onCheck={onCheck}
        recentCheckDate={recentCheckDate ?? undefined}
        identityOptional={identityOptional}
        certificateModalSource="identity"
      />
    </MyPopup>
  );
}
