import NhicForm from "@/components/nhic-form/nhic-form";
import CertificateForm from "@/components/reception/board-patient/(patient-info)/certificate-form";
import MyPopup from "@/components/yjg/my-pop-up";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";
import type { useQualificationCheck } from "@/hooks/reception/use-qualification-check";

interface QualificationCheckModalsProps {
  qualificationCheck: ReturnType<typeof useQualificationCheck>;
  tempEligibilityData: EligibilityCheck | null;
  loading: boolean;
}

export default function QualificationCheckModals({
  qualificationCheck,
  tempEligibilityData,
  loading,
}: QualificationCheckModalsProps) {
  const {
    isNhicPopupOpen,
    handleNhicPopupClose,
    handleNhicPopupApply,
    isCertificateModalOpen,
    certificateFormProps,
  } = qualificationCheck;

  return (
    <>
      {/* NHIC 자격조회 모달 */}
      <MyPopup
        isOpen={isNhicPopupOpen}
        onCloseAction={handleNhicPopupClose}
        title="수진자조회 결과"
        fitContent={true}
        height="720px"
        width="630px"
      >
        <NhicForm
          isOpen={isNhicPopupOpen}
          onClose={handleNhicPopupClose}
          onApply={handleNhicPopupApply}
          onCancel={handleNhicPopupClose}
          parsedData={tempEligibilityData?.parsedData}
          rawData={tempEligibilityData?.rawData || null}
          eligibilityCheck={tempEligibilityData || undefined}
        />
      </MyPopup>

      {/* 본인확인 모달 */}
      <MyPopup
        isOpen={isCertificateModalOpen}
        onCloseAction={certificateFormProps.onClose}
        title="본인확인"
        fitContent={true}
        height="100px"
      >
        <CertificateForm
          isOpen={certificateFormProps.isOpen}
          onClose={certificateFormProps.onClose}
          onConfirm={certificateFormProps.onConfirm}
          onCancel={certificateFormProps.onCancel}
          onCheck={certificateFormProps.onCheck}
          recentCheckDate={certificateFormProps.recentCheckDate}
          identityOptional={certificateFormProps.identityOptional}
          certificateModalSource={certificateFormProps.certificateModalSource}
        />
      </MyPopup>

      {/* 자격조회 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4 min-w-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--main-color)] border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                자격조회 중
              </h3>
              <p className="text-sm text-gray-600">
                수진자 자격을 조회하고 있습니다...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
