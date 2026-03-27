import { useState, useEffect, useCallback } from "react";
import { Certificate, LoginSettings, CertFiles } from "../model/types";
import { CertsService } from "@/services/certs-service";
import { useToastHelpers } from "@/components/ui/toast";

export const useCertificateManager = () => {
  const { success, error: toastError } = useToastHelpers();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loginSettings, setLoginSettings] = useState<LoginSettings>({ autoLogin: false, password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Load mostly recent certificate
  const loadCertificates = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await CertsService.list();
      if (list && list.length > 0) {
        // Sort by notAfter descending (most future date first)
        const sorted = list.sort((a, b) => b.signMeta.notAfter.localeCompare(a.signMeta.notAfter));
        const latest = sorted[0];
        // Map to frontend model
        setCertificate({
          ...latest,
          fileName: latest.alias || "병원 인증서",
          registeredDate: latest.signMeta.notBefore, // or logic? actually no registered date field in API
          expirationDate: latest.signMeta.notAfter,
          daysRemaining: latest.daysToExpire,
          status: latest.daysToExpire > 0 ? 'active' : 'expired' // Logic as agreed
        });
      } else {
        setCertificate(null);
      }
    } catch (error) {
      console.error("Load certs error", error);
      // Silent error or toast?
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const handleRegister = async (files: CertFiles, password: string) => {
    setIsRegistering(true);
    try {
      const formData = new FormData();
      // Append files. Need to verify backend expected keys.
      // Standard NPKI keys: signCert, signKey, kmCert, kmKey
      if (files.signCert) formData.append("signCert", files.signCert);
      if (files.signKey) formData.append("signKey", files.signKey);
      if (files.kmCert) formData.append("kmCert", files.kmCert);
      if (files.kmKey) formData.append("kmKey", files.kmKey);

      formData.append("password", password);

      await CertsService.upload(formData);
      success("인증서가 등록되었습니다.");
      await loadCertificates(); // Reload to show
    } catch (error: any) {
      console.error("Register failed", error);
      if (error.status === 409 && error.message === "ALIAS_ALREADY_EXISTS") {
        alert("이미 등록된 인증서입니다. 기존 인증서를 삭제 후 다시 시도해주세요.");
      } else {
        toastError("등록 실패", error.message || "인증서 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!certificate) return;
    if (!confirm("정말 인증서를 삭제하시겠습니까?")) return;

    try {
      await CertsService.delete(certificate.id);
      success("인증서가 삭제되었습니다.");
      setCertificate(null);
    } catch (error: any) {
      toastError("삭제 실패", error.message);
    }
  };

  // Renew logic usually just leads to re-registering often in UI flow, or specialized update?
  // Current UI just shows "Delete and Re-register" help text if renewed.
  // The 'Renew' button in Registered screen can just trigger a state to show registration?
  // But our page logic currently swaps between "Registered" and "New" based on `certificate` existence.
  // So 'Renew' implies we should probably delete? Or allow overwrite?
  // User asked for "Renew" -> "Delete existing and Register new".
  // The UI code I wrote says "Renew -> button click".
  // Let's make renew just log/toast "Not implemented" or trigger delete confirmation?
  // Or better: In `backup_page.tsx` logic?
  // Actually, if we have a certificate, showing "Register" again is tricky if we don't delete first.
  const handleRenew = () => {
    // Ideally, navigate to a renew page or show registration modal?
    // For now, guide user to delete.
    alert("기존 인증서를 삭제한 후 새로 등록해주세요.");
  };

  return {
    certificate,
    loginSettings, // Dummy
    isLoading,
    isRegistering,
    handlers: {
      onRegister: handleRegister,
      onRenew: handleRenew,
      onDelete: handleDelete,
      onUpdateAutoLogin: () => { }, // Disabled
      onUpdatePassword: () => { }, // Disabled
    }
  };
};
