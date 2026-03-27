"use client";

import { useParams, useRouter } from "next/navigation";
import SignatureModal from "@/app/tablet/consent-form/_components/signature-modal";

export default function ConsentSignaturePage() {
  const router = useRouter();
  const params = useParams<{
    patientId: string;
    consentId: string;
    fieldId: string;
  }>();
  const patientId = params?.patientId || "";
  const consentId = params?.consentId || "";
  const fieldId = params?.fieldId || "";

  const handleSaved = () => {
    router.push(
      `/tablet/consent-form/patient/${patientId}/consent/${consentId}?signed=${encodeURIComponent(
        fieldId
      )}&ts=${Date.now()}`
    );
  };

  return (
    <SignatureModal
      open
      consentId={consentId}
      fieldId={fieldId}
      onClose={() => router.back()}
      onSaved={handleSaved}
    />
  );
}
