import { formatDate } from "@/lib/date-utils";
import { useAgentDur } from "@/hooks/use-agent-dur";
import { usePatient } from "@/hooks/patient/use-patient";
import { useToastHelpers } from "@/components/ui/toast";

// 현재 로그인한 유저의 병원 코드 가져오기
export const getCurrentHospitalCode = (user: any): string => {
  const userWithHospitals = user as any; // 타입 캐스팅
  if (
    !userWithHospitals?.hospitals ||
    userWithHospitals.hospitals.length === 0
  ) {
    console.warn("[AgentUtil] 사용자 병원 정보가 없습니다.");
    return "99350001"; // 기본값
  }

  const currentHospital = userWithHospitals.hospitals.find(
    (hos: any) => hos.hospitalId === user.hospitalId
  );
  if (!currentHospital?.number) {
    console.warn("[AgentUtil] 현재 병원의 number를 찾을 수 없습니다.");
    return "99350001"; // 기본값
  }

  return currentHospital.number.toString();
};

// 임부금기 점검 함수
export const createPregnancyCheckHandler = (
  prescriptionGridRef: React.RefObject<any>,
  user: any,
  patientId?: number
) => {
  const { pregnancyCheck } = useAgentDur();
  const { error } = useToastHelpers();
  const { data: patientData, isLoading: isPatientLoading } = usePatient(
    patientId || 0
  );

  return async () => {
    try {
      console.log("[AgentUtil] 임부금기 점검 시작");

      // 환자 데이터 로딩 중이면 대기
      if (isPatientLoading) {
        console.log("[AgentUtil] 환자 데이터 로딩 중...");
        return;
      }

      // 환자 데이터가 없으면 경고
      if (!patientData) {
        error("환자 정보를 찾을 수 없습니다.");
        return;
      }

      // 현재 병원 코드 가져오기
      const hospitalCode = getCurrentHospitalCode(user);
      console.log("[AgentUtil] 사용할 병원 코드:", hospitalCode);
      console.log("[AgentUtil] 환자 정보:", patientData);

      const prescriptionData =
        prescriptionGridRef.current?.getTreeData?.() || [];

      let hasWarning = false;

      // 각 처방에 대해 임부금기 점검
      for (const item of prescriptionData) {
        const itemData = item as any; // 타입 캐스팅
        const componentCode =
          itemData.gnlNMCD || itemData.componentCode || itemData.gnlNmcd;

        if (componentCode) {
          const result = await pregnancyCheck.execute(hospitalCode, {
            ComponentCode: componentCode,
            Date: formatDate(new Date(), "").replace(/-/g, ""),
          });

          // 실제 API 응답 형식에 맞게 처리
          if (result?.Success === true) {
            if (result.Result === 0) {
              // 성공 - 토스트 표시하지 않음
              console.log(
                `[AgentUtil] 임부금기 점검 완료 (${itemData.medcNM || itemData.name}): ${result.Message}`
              );
            } else {
              // 경고나 문제가 있는 경우
              error(
                `⚠️ 임부금기 점검 결과 (${itemData.medcNM || itemData.name}): ${result.Message}`
              );
              hasWarning = true;
            }
          } else {
            // 실패
            error(
              `❌ 임부금기 점검 실패 (${itemData.medcNM || itemData.name}): ${result?.Message || "알 수 없는 오류"}`
            );
            hasWarning = true;
          }
        }
      }

      // 경고가 없으면 토스트 표시하지 않음
      if (!hasWarning) {
        console.log("[AgentUtil] 임부금기 점검 완료 - 안전");
      }
    } catch (err) {
      console.error("[AgentUtil] 임부금기 점검 실패:", err);
      error("❌ 임부금기 점검 중 오류가 발생했습니다.");
    }
  };
};

// 연령제한 점검 함수
export const createAgeLimitCheckHandler = (
  prescriptionGridRef: React.RefObject<any>,
  user: any,
  patientId?: number
) => {
  const { ageLimitCheck } = useAgentDur();
  const { error } = useToastHelpers();
  const { data: patientData, isLoading: isPatientLoading } = usePatient(
    patientId || 0
  );

  return async () => {
    try {
      console.log("[AgentUtil] 연령제한 점검 시작");

      // 환자 데이터 로딩 중이면 대기
      if (isPatientLoading) {
        console.log("[AgentUtil] 환자 데이터 로딩 중...");
        return;
      }

      // 환자 데이터가 없으면 경고
      if (!patientData) {
        error("환자 정보를 찾을 수 없습니다.");
        return;
      }

      // 현재 병원 코드 가져오기
      const hospitalCode = getCurrentHospitalCode(user);
      console.log("[AgentUtil] 사용할 병원 코드:", hospitalCode);
      console.log("[AgentUtil] 환자 정보:", patientData);

      const prescriptionData =
        prescriptionGridRef.current?.getTreeData?.() || [];

      let hasWarning = false;

      // 각 처방에 대해 연령제한 점검
      for (const item of prescriptionData) {
        const itemData = item as any; // 타입 캐스팅
        const componentCode =
          itemData.gnlNMCD || itemData.componentCode || itemData.gnlNmcd;
        const medCode = itemData.medcCD || itemData.code;

        if (componentCode && medCode) {
          const result = await ageLimitCheck.execute(hospitalCode, {
            JuminNo: patientData?.rrn || "2211111000098", // 환자 주민번호
            IssueDate: formatDate(new Date(), "").replace(/-/g, ""),
            GnlNMCD: componentCode,
            MedCode: medCode,
          });

          // 실제 API 응답 형식에 맞게 처리
          if (result?.Success === true) {
            if (result.Result === 0) {
              // 성공 - 토스트 표시하지 않음
              console.log(
                `[AgentUtil] 연령제한 점검 완료 (${itemData.medcNM || itemData.name}): ${result.Message}`
              );
            } else {
              // 경고나 문제가 있는 경우
              error(
                `⚠️ 연령제한 점검 결과 (${itemData.medcNM || itemData.name}): ${result.Message}`
              );
              hasWarning = true;
            }
          } else {
            // 실패
            error(
              `❌ 연령제한 점검 실패 (${itemData.medcNM || itemData.name}): ${result?.Message || "알 수 없는 오류"}`
            );
            hasWarning = true;
          }
        }
      }

      // 경고가 없으면 토스트 표시하지 않음
      if (!hasWarning) {
        console.log("[AgentUtil] 연령제한 점검 완료 - 안전");
      }
    } catch (err) {
      console.error("[AgentUtil] 연령제한 점검 실패:", err);
      error("❌ 연령제한 점검 중 오류가 발생했습니다.");
    }
  };
};
