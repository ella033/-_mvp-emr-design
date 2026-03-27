"use client"

import { AccessHistoryPageContent } from "../../../../components/settings/personal-privacy/AccessHistoryPageContent";

export default function MedicalAccessHistoryPage() {
  return (
    <div data-testid="settings-personal-privacy-medical-access-history-page">
      <AccessHistoryPageContent type="CLINICAL" />
    </div>
  );
}
