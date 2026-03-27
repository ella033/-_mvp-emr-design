"use client"

import { AccessHistoryPageContent } from "../../../../components/settings/personal-privacy/AccessHistoryPageContent";

export default function AccessHistoryPage() {
  return (
    <div data-testid="settings-personal-privacy-access-history-page">
      <AccessHistoryPageContent type="PERSONAL" />
    </div>
  );
}
