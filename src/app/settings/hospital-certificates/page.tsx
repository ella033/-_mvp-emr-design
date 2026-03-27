"use client";

import { SettingPageHeader } from "../../../components/settings/commons/setting-page-header";
import { CertificateRegistration, RegisteredCertificates, useCertificateManager } from "@/components/settings/hospital-certificates";

export default function SettingsHospitalCertificatesPage() {
  const { certificate, loginSettings, isLoading, isRegistering, handlers } = useCertificateManager();

  if (isLoading) {
    return <div className="p-6">Loading...</div>; // Simple loading state for now
  }

  return (


    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-4 md:p-[20px] h-full overflow-hidden">
      <SettingPageHeader
        title="병원 인증서 관리"
        tooltipContent="병원 인증서를 등록하고 갱신할 수 있는 페이지입니다."
      />

      {/* Main Content Area - Scrollable */}
      <section className="flex flex-row lg:flex-row gap-[20px] w-full min-h-0 flex-1 overflow-visible">
        {/* Left: Registration Form */}
        <div className="flex-1">

          <CertificateRegistration
            onRegister={handlers.onRegister}
            isRegistering={isRegistering || false}
          />
        </div>
        <div className="flex-1">

          {/* Right: Management & Settings */}
          <RegisteredCertificates
            certificate={certificate}
            loginSettings={loginSettings}
            handlers={handlers}
          />
        </div>
      </section>


    </div>
  );
}
