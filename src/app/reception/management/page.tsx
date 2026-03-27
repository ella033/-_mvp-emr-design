"use client";

import { Suspense } from "react";
import { ReceptionPageContent } from "./_components/management-page";

export default function ReceptionManagementPage() {
  return (
    <Suspense fallback={null}>
      <ReceptionPageContent />
    </Suspense>
  );
}

