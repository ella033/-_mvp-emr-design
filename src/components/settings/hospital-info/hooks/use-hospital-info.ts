import { useState, useCallback, useEffect, useMemo } from "react";
import { useHospitalStore } from "@/store/hospital-store";
import { hospitalInfoApi } from "../api/hospital-info.api";
import type { Hospital } from "@/types/hospital-types";
import { getFileUrl } from "@/lib/file-utils";

export const useHospitalInfo = () => {
  const { hospital, setHospital } = useHospitalStore();
  const [formData, setFormData] = useState<Partial<Hospital>>(hospital || {});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync formData with store
  useEffect(() => {
    if (hospital) {
      setFormData(hospital);
    }
  }, [hospital]);

  const savedImages = useMemo(() => {
    if (!hospital) return {};
    return {
      logo: getFileUrl(hospital.logoFileinfo?.uuid),
      hospitalSeal: getFileUrl(hospital.sealFileinfo?.uuid),
      directorSeal: getFileUrl(hospital.directorSealFileinfo?.uuid),
    };
  }, [hospital]);

  const fetchHospital = useCallback(async (hospitalId: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await hospitalInfoApi.getHospital(hospitalId);
      setHospital(data);
    } catch (err: any) {
      setError(err?.message ?? "병원 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [setHospital]);

  const updateHospitalField = useCallback((
    field: keyof Hospital,
    value: string | boolean | number | number[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const uploadImage = useCallback(async (
    type: "logo" | "hospitalSeal" | "directorSeal",
    fileInfo?: any
  ) => {
    if (!hospital) return;

    try {
      const updateData: Partial<Hospital> = {};
      const keyMap = {
        logo: "logoFileinfo",
        hospitalSeal: "sealFileinfo",
        directorSeal: "directorSealFileinfo",
      };

      (updateData as any)[keyMap[type]] = fileInfo || null;

      const updatedHospital = await hospitalInfoApi.updateHospital(
        hospital.id,
        updateData as any // Type assertion needed due to Partial<Hospital> complexity vs API
      );

      setHospital(updatedHospital);
    } catch (error) {
      console.error(
        `${type} ${fileInfo ? "업로드" : "삭제"} 후 병원 정보 업데이트 실패:`,
        error
      );
      throw error;
    }
  }, [hospital, setHospital]);

  const saveChanges = useCallback(async () => {
    if (!hospital) return false;
    try {
      const {
        facilities,
        operatingHours,
        appointmentRooms,
        hospitalUsers,
        id,
        createDateTime,
        updateDateTime,
        internalLabInfo, // 조회 시 계산되는 필드 포함 가능성
        ...cleanData
      } = formData as any;
      const updatedHospital = await hospitalInfoApi.updateHospital(hospital.id, cleanData);
      setHospital(updatedHospital);
      return true;
    } catch (err) {
      console.error("저장 실패:", err);
      return false;
    }
  }, [hospital, formData, setHospital]);

  const cancelChanges = useCallback(() => {
    if (hospital) {
      setFormData(hospital);
    }
  }, [hospital]);

  return {
    hospital,
    formData,
    savedImages,
    isLoading,
    error,
    fetchHospital,
    updateHospitalField,
    uploadImage,
    saveChanges,
    cancelChanges
  };
};
