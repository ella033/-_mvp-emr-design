import { useEncounterStore } from "@/store/encounter-store";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Disease } from "@/types/chart/disease-types";
import { Order, UpsertManyOrders } from "@/types/chart/order-types";
import { NoneSelectedPatient } from "../../widgets/none-patient";
import { useToastHelpers } from "@/components/ui/toast";
import { useUpdateOrdersByEncounter } from "@/hooks/order/use-update-orders-by-encounter";
import { useUpdateEncounter } from "@/hooks/encounter/use-encounter-update";
import {
  useUpsertDiseasesByEncounter,
  type ApiDisease,
} from "@/hooks/disease/use-upsert-diseases-by-encounter";
import { useUserStore } from "@/store/user-store";
import { convertToApiDisease, convertToApiOrder } from "./api-converter";
import { type OrderGridRef } from "@/components/disease-order/order/order-grid";
import { type DiseaseGridRef } from "@/components/disease-order/disease/disease-grid";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { AgentDurService } from "@/services/agent/agent-dur-service";
import {
  급여제한여부Label,
  접수상태,
  type 급여제한여부,
} from "@/constants/common/common-enum";
import { useReceptionStore } from "@/store/common/reception-store";
import { Header } from "./patient-diagnosis-prescription-header";
import { Content } from "./patient-diagnosis-prescription-content";
import { useAgentDur } from "@/hooks/use-agent-dur";
import { useHospitalStore } from "@/store/hospital-store";
import {
  DurCheckRequest,
  type DurCheckResult,
  type DurCheckResultSet,
} from "@/services/agent/agent-dur-service";
import { formatDateByPattern } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/user/use-user";
import { InOut, PrescriptionType } from "@/constants/master-data-enum";
import {
  FooterTop,
  type FooterTopValues,
} from "./patient-diagnosis-prescription-footer-top";
import {
  FooterBottom,
  type FooterBottomValues,
} from "./patient-diagnosis-prescription-footer-bottom";
import { EncountersService } from "@/services/encounters-service";
import MyPopup, { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { AccessLogsService } from "@/services/access-logs-service";
import { useMedicalRecordPrint } from "@/hooks/medical-record";
import DurInfoPopup from "../(dur)/dur-info-popup";
import { useMedicalUi } from "@/app/medical/contexts/medical-ui-context";
import { getStringFieldKeysDataFromExtraQualification } from "@/hooks/medical-info/add-disreg-modal-utils";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import { usePrintService } from "@/hooks/document/use-print-service";
import { executePrinter, MEDICAL_RECORD_LOCAL_PRINTER_NAME } from "./execute-printer";
import { is임신부 } from "@/lib/extra-qualification-utils";
import ChartCheck from "./chart-check/chart-check";
import MySplitPane from "@/components/yjg/my-split-pane";


export default function PatientDiagnosisPrescription() {
  const { success, error, info } = useToastHelpers();
  const { user } = useUserStore();
  const { resetEncounterHistoryFilters, diagnosisPrescriptionGridSnapshotRef } = useMedicalUi();
  const { data: userData } = useUser(user.id);
  const { hospital } = useHospitalStore();
  const queryClient = useQueryClient();

  const diagnosisGridRef = useRef<DiseaseGridRef>(null);
  const prescriptionGridRef = useRef<OrderGridRef>(null);
  const handleSaveRef = useRef<(() => Promise<void>) | null>(null);
  const handleSaveAndTransmitRef = useRef<(() => Promise<void>) | null>(null);
  const handlePrintAndTransmitRef = useRef<(() => Promise<void>) | null>(null);
  const saveDiseaseMutation = useUpsertDiseasesByEncounter();
  const saveOrderMutation = useUpdateOrdersByEncounter();
  const saveEncounterMutation = useUpdateEncounter();
  const updateRegistrationMutation = useUpdateRegistration();
  const {
    selectedEncounter,
    setSelectedEncounter,
    updateEncounters,
    setIsEncounterDataChanged,
    setSaveEncounterFn,
    draftSymptom,
    draftClinicalMemo,
    draftEncounterSummary,
  } = useEncounterStore();
  const { currentRegistration, updateRegistration } = useReceptionStore();
  const { mutateAsync: updatePatientApi } = useUpdatePatient();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingAndTransmitting, setIsSavingAndTransmitting] = useState(false);
  const [isSavedAndTransmitted, setIsSavedAndTransmitted] = useState(false);
  const [isPrintingAndTransmitting, setIsPrintingAndTransmitting] =
    useState(false);
  const [isPrintAndTransmitted, setIsPrintAndTransmitted] = useState(false);
  const [pharmacyNotes, setPharmacyNotes] = useState("");
  const { durCheck } = useAgentDur();
  const [durResult, setDurResult] = useState<DurCheckResult | null>(null);
  const { buildPrescriptionPdf, requestPrintJob, requestHtmlPrintJob } = usePrintService();
  const [isShowDurResult, setIsShowDurResult] = useState(false);
  const { print: printMedicalRecord } = useMedicalRecordPrint();
  const [footerTopValues, setFooterTopValues] =
    useState<FooterTopValues | null>(null);
  const [footerBottomValues, setFooterBottomValues] =
    useState<FooterBottomValues | null>(null);
  const [isOpenNonCoveredCheck, setIsOpenNonCoveredCheck] = useState(false);
  const [nonCoveredLabel, setNonCoveredLabel] = useState<string>("");
  const [isChartCheckPopupOpen, setIsChartCheckPopupOpen] = useState(false);

  useEffect(() => {
    if (selectedEncounter) {
      console.log("[TEST] selectedEncounter:", selectedEncounter);
      setDiseases(selectedEncounter.diseases || []);
      setOrders(selectedEncounter.orders || []);
      setPharmacyNotes(selectedEncounter.pharmacyNotes || "");
      setFooterBottomValues(null);
      setFooterTopValues(null);
    }
  }, [selectedEncounter]);

  // store에 저장 함수 등록 (다른 컴포넌트에서 호출 가능하도록)
  // 조기 반환 전에 위치해야 Hooks 순서가 유지됨
  useEffect(() => {
    const wrappedSave = async () => {
      if (handleSaveRef.current) {
        await handleSaveRef.current();
      }
    };
    setSaveEncounterFn(selectedEncounter ? wrappedSave : null);
    return () => {
      setSaveEncounterFn(null);
    };
  }, [selectedEncounter, setSaveEncounterFn]);

  // 묶음 추가 시 현재 진단/처방 그리드 스냅샷 제공 (getTreeData 기준)
  useEffect(() => {
    diagnosisPrescriptionGridSnapshotRef.current = () => ({
      diagnosisGridData: diagnosisGridRef.current?.getTreeData() ?? [],
      prescriptionGridData: prescriptionGridRef.current?.getTreeData() ?? [],
    });
    return () => {
      diagnosisPrescriptionGridSnapshotRef.current = null;
    };
  }, [diagnosisPrescriptionGridSnapshotRef]);

  // 브라우저를 닫거나 새로고침할 때 미저장 데이터 경고
  const isEncounterDataChanged = useEncounterStore(
    (state) => state.isEncounterDataChanged
  );
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEncounterDataChanged) {
        e.preventDefault();
        // 최신 브라우저에서는 커스텀 메시지가 무시되고 브라우저 기본 메시지가 표시됨
        e.returnValue =
          "저장되지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEncounterDataChanged]);

  // 단축키 처리: Ctrl+S(저장), F9(저장전달), F10(출력전달)
  // capture phase에서 등록하여 브라우저 기본 동작보다 먼저 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: 저장
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (handleSaveRef.current && !isSaving) {
          handleSaveRef.current();
        }
        return;
      }

      // F9: 저장전달
      if (e.key === "F9") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (handleSaveAndTransmitRef.current && !isSavingAndTransmitting) {
          handleSaveAndTransmitRef.current();
        }
        return;
      }

      // F10: 출력전달
      if (e.key === "F10") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (handlePrintAndTransmitRef.current && !isPrintingAndTransmitting) {
          handlePrintAndTransmitRef.current();
        }
        return;
      }
    };

    // capture: true로 등록하여 이벤트를 가장 먼저 처리
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isSaving, isSavingAndTransmitting, isPrintingAndTransmitting]);

  // Ctrl+A: 브라우저 기본 동작 방지 (그리드 외부에서만)
  // bubble phase에서 처리하여 그리드 내부에서는 그리드의 전체선택 기능이 동작하도록 함
  useEffect(() => {
    const handleCtrlA = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        // input, textarea, contenteditable에서는 기본 동작 유지
        const target = e.target as HTMLElement;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
      }
    };

    // bubble phase에서 등록 (그리드에서 stopPropagation하면 여기까지 오지 않음)
    document.addEventListener("keydown", handleCtrlA);
    return () => {
      document.removeEventListener("keydown", handleCtrlA);
    };
  }, []);

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  const addDiseaseLibrary = (disease: any) => {
    diagnosisGridRef.current?.addDiseaseLibrary(disease);
  };

  const addOrderLibrary = (
    order: any,
    isScheduledOrder: boolean = false,
    scheduledOrderMemo: string = ""
  ) => {
    prescriptionGridRef.current?.addOrderLibrary(
      order,
      isScheduledOrder,
      scheduledOrderMemo
    );
  };

  const addLibrary = (library: any) => {
    if (library.category === "disease") {
      addDiseaseLibrary(library);
    } else {
      addOrderLibrary(library);
    }
  };

  const checkDur = async (
    diseaseData: ApiDisease[],
    orderData: UpsertManyOrders[],
    isModify: boolean
  ) => {
    try {
      if (!currentRegistration) {
        error("접수 정보를 찾을 수 없습니다.");
        return;
      }

      if (!currentRegistration.patient) {
        error("환자 정보를 찾을 수 없습니다.");
        return;
      }

      if (!userData?.type) {
        error("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      if (!userData?.licenseNo) {
        error("사용자 면허번호를 찾을 수 없습니다.");
        return;
      }

      if (
        currentRegistration.insuranceType === undefined ||
        currentRegistration.insuranceType === null
      ) {
        error("보험 정보를 찾을 수 없습니다.");
        return;
      }

      const mainDisease = diseaseData[0];
      const drugOrders = orderData.filter(
        (order) =>
          order.type === PrescriptionType.drug &&
          order.claimCode !== null &&
          order.claimCode !== "" &&
          order.name !== null &&
          order.name !== "" &&
          order.drugAtcCode !== null &&
          order.drugAtcCode !== ""
      );

      // 처방조제유형코드 [2자] 
      // (01:입원처방및조제, 02:외래원외처방, 03:약국직접조제, 04:약국판매약, 05:외래원내처방, 
      // 06:퇴원약, 07:성분명처방약, 10:외래 예약 등, 31:입원처방 및 직접조제, 36:퇴원처방 및 직접조제, 
      // 35:외래원내처방 및 직접조제, 23:외래예약 원내처방, 33:외래예약 원내처방 및 직접조제, 42:비대면진료 외래원외처방)
      const getPrscClCode = (drugOrders: UpsertManyOrders[]): string => {
        if (drugOrders.length === 0) return "02";
        const hasIn = drugOrders.some((o) => o.inOutType === InOut.In);
        const hasOut = drugOrders.some((o) => o.inOutType === InOut.Out);
        if (hasIn && hasOut) return "08";
        if (hasIn) return "05";
        return "02";
      };

      const issuanceNumber = (
        await EncountersService.getEncounterIssuanceNumber(selectedEncounter.id, false)
      ).issuanceNumber;

      const durRequest: DurCheckRequest = {
        AdminType: "M",
        JuminNo: currentRegistration.patient?.rrn || "",
        PatNm: currentRegistration.patient?.name || "",
        InsurerType: AgentDurService.getInsurerType(
          currentRegistration.insuranceType
        ),
        PregWmnYN: is임신부(currentRegistration.extraQualification) ? "Y" : "N",
        PrscPresDt: formatDateByPattern(
          selectedEncounter?.encounterDateTime,
          "YYYYMMDD"
        ),
        PrscPresTm: formatDateByPattern(
          selectedEncounter?.encounterDateTime,
          "HHmmss"
        ),
        MprscIssueAdmin: hospital.number.toString(),
        MprscGrantNo: issuanceNumber,
        PrscAdminName: hospital.name,
        PrscTel: hospital.phone,
        PrscLicType: AgentDurService.getPrscLicType(userData?.type),
        DrLicNo: userData?.licenseNo,
        PrscName: userData?.name,
        Dsbjt: mainDisease
          ? String(mainDisease.department).padStart(2, "0")
          : "",
        MainSick: mainDisease?.code || "",
        PrscClCode: getPrscClCode(drugOrders),
        AppIssueAdmin: "10200011", // Todo: 청구 SW 업체코드인데 일단 테스트 데이터
        AppIssueCode: "102000110000000000000000000000", // Todo: 청구 SW 인증코드인데 일단 테스트 데이터 
        // (테스트: 102000110000000000000000000000 / 위차트: B01001132019102005224023420191 / 의사랑: B01001132025102003241009720258)
        PrscYN: isModify ? "M" : "N",
        OrgPrscPresDt: formatDateByPattern(
          selectedEncounter?.encounterDateTime,
          "YYYYMMDD"
        ),
        OrgMprscGrantNo: issuanceNumber,
        Medicines: drugOrders.map((order) => ({
          PrscType: 3, // Todo: 분류유형코드 3이나 5 중에 넣어야 하는데... 일단 3으로 넣음
          MedcCD: order.claimCode ?? null,
          MedcNM: order.name ?? null,
          GnlNMCD: order.drugAtcCode ?? "",
          GnlNM: null,
          DdMgtyFreq: order.dose,
          DdExecFreq: order.times,
          MdcnExecFreq: order.days,
          InsudmType: AgentDurService.getPInsudmType(order),
          IoHsp: order.inOutType === InOut.In ? "2" : "1",
          prscUsg: order.usage ?? null,
        })),
      };
      return await durCheck.execute(hospital.number, durRequest);
    } catch (err: any) {
      error("[DUR 점검 실패]", "에이전트 실행 여부를 확인해주세요.");
      return null;
    }
  };

  const saveEncounter = async (isModify: boolean) => {
    try {
      const diagnosisGridData = diagnosisGridRef.current?.getTreeData();
      const prescriptionGridData = prescriptionGridRef.current?.getTreeData();
      const diseaseData = convertToApiDisease(diagnosisGridData || []);
      const orderData = convertToApiOrder(prescriptionGridData || []);

      // DUR 점검을 비동기로 실행 (실패해도 저장은 진행)
      checkDur(diseaseData, orderData, isModify).then((durResult) => {
        if (durResult) {
          if (durResult.ResultCode === 0) {
            success("DUR 통과");
          } else if (durResult.ResultCode === 16009) {
            info("DUR 통과 (약품 없음)");
          } else {
            setDurResult(durResult);
            setIsShowDurResult(true);
          }
        }
      });

      const encounterData = {
        registrationId: selectedEncounter.registrationId,
        patientId: selectedEncounter.patientId,
        symptom: draftSymptom, // store의 draftSymptom 사용
        doctorId: user.id,
        pharmacyNotes: pharmacyNotes,
        specificDetail:
          footerTopValues?.statementSpecificDetail ??
          useEncounterStore.getState().draftStatementSpecificDetail ??
          [],
        receptionType:
          footerBottomValues?.receptionType ??
          selectedEncounter.receptionType,
        timeCategory:
          footerBottomValues?.timeCategory ??
          selectedEncounter.timeCategory,
        resultType:
          footerBottomValues?.resultType ?? selectedEncounter.resultType,
        isClaim: footerBottomValues?.isClaim ?? selectedEncounter.isClaim,
      };

      console.log("[TEST] save encounter - encounterData:", encounterData);

      await saveEncounterMutation.mutateAsync({
        id: selectedEncounter.id,
        data: encounterData,
        options: { skipClaimSync: true },
      });

      console.log("[TEST] save disease - encounterId:", selectedEncounter.id, "diseaseData:", diseaseData);
      console.log("[TEST] save order - encounterId:", selectedEncounter.id, "orderData:", orderData);

      await Promise.all([
        saveDiseaseMutation.mutateAsync({
          encounterId: selectedEncounter.id,
          diseases: diseaseData,
        }),
        saveOrderMutation.mutateAsync({
          encounterId: selectedEncounter.id,
          orders: orderData,
        }),
      ]);

      await EncountersService.syncEncounterClaimDetail(selectedEncounter.id);

      // 저장 성공 후 최신 encounter 데이터로 상태 업데이트
      const updatedEncounter = await EncountersService.getEncounter(
        selectedEncounter.id
      );
      setSelectedEncounter(updatedEncounter);
      updateEncounters(updatedEncounter);

      // encounter-history 필터 초기화 (변경된 encounter가 필터 때문에 목록에 안 보이지 않도록, searchWord 유지, 저장한 encounter는 열린 상태로)
      resetEncounterHistoryFilters({
        expandEncounterId: selectedEncounter?.id,
      });

      // encounter-history 새로고침을 위해 patient charts 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["patient", selectedEncounter.patientId, "charts"],
      });

      // 처방 저장 후 ES 검색 캐시 무효화 (Redis 사용량 리랭킹 반영)
      queryClient.invalidateQueries({
        queryKey: ["prescription-libraries", "elasticsearch"],
      });
    } catch (err: any) {
      console.error("저장 실패:", err);

      throw err; // 에러를 다시 throw하여 상위에서 처리할 수 있도록
    }
  };

  const checkAndSave = async () => {
    try {
      // 이미 비청구(isClaim false)면 확인 팝업 없이 바로 저장
      const effectiveIsClaim =
        footerBottomValues?.isClaim ?? selectedEncounter?.isClaim ?? true;
      if (effectiveIsClaim === false) {
        await handleSave();
        return;
      }
      const traveler = getStringFieldKeysDataFromExtraQualification(currentRegistration?.extraQualification, "출국자여부") as any;
      const nonCovered = getStringFieldKeysDataFromExtraQualification(currentRegistration?.extraQualification, "급여제한여부") as any;
      const nonCoveredLabelText = 급여제한여부Label[nonCovered as unknown as 급여제한여부] ?? "";
      const travelerLabelText = traveler === "Y" ? "출국자" : "";
      const label = [nonCoveredLabelText, travelerLabelText].filter(Boolean).join(", ");
      if (label === "") {
        await handleSave();
        return;
      }
      setNonCoveredLabel(label);
      setIsOpenNonCoveredCheck(true);
    } catch {
      setNonCoveredLabel("");
      handleSave();
    }
  };

  // checkAndSave 함수를 ref에 저장 (store에서 호출 가능하도록)
  handleSaveRef.current = checkAndSave;

  const getRegistrationData = (status?: 접수상태, roomPanel?: string) => {
    return {
      exceptionCode: footerTopValues?.patientExceptionCode || "",
      ...(status != null && { status }),
      ...(roomPanel != null && { roomPanel }),
      receptionType:
        footerBottomValues?.receptionType ??
        selectedEncounter?.receptionType ??
        currentRegistration?.receptionType,
    };
  };

  const commonSave = async (status?: 접수상태, roomPanel?: string) => {
    await saveEncounter(true);

    const registrationData = getRegistrationData(status, roomPanel);
    await updateRegistrationMutation.mutateAsync({
      id: selectedEncounter.registrationId,
      data: registrationData,
    });
    updateRegistration(selectedEncounter.registrationId, registrationData);

    await updatePatientApi({
      patientId: selectedEncounter.patientId,
      updatePatient: {
        clinicalMemo: draftClinicalMemo,
        symptom: draftEncounterSummary,
      },
    });
    if (currentRegistration?.patient) {
      updateRegistration(selectedEncounter.registrationId, {
        patient: {
          ...currentRegistration.patient,
          clinicalMemo: draftClinicalMemo,
          symptom: draftEncounterSummary,
        },
      });
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await commonSave();
      success("저장 완료");
      setIsSaved(true);

      // BE가 저장 시 자동 PCI/자체 점검 → encounter response에 결과 포함
      // setSelectedEncounter 호출 시 store.pciCheckResults + chartCheckResults에 자동 반영됨
      const { pciCheckResults: pciResults, chartCheckResults } = useEncounterStore.getState();
      if (pciResults.length > 0 || chartCheckResults.length > 0) {
        info("차트점검 결과가 있습니다. 점검 완료 후 다시 저장해주세요.");
        setIsChartCheckPopupOpen(true);
      } else {
        setIsChartCheckPopupOpen(false);
      }
    } catch (err: any) {
      console.error("저장 실패:", err);
      error("저장에 실패했습니다. 다시 시도해주세요.");
      throw err;
    } finally {
      setIsSaving(false);
      setIsEncounterDataChanged(false);
    }
  };

  const handleSaveAndTransmit = async () => {
    setIsSavingAndTransmitting(true);
    try {
      await commonSave();

      // BE가 저장 시 자동 PCI/자체 점검 → encounter response에 결과 포함
      const { pciCheckResults: pciResults, chartCheckResults } = useEncounterStore.getState();

      if (pciResults.length > 0 || chartCheckResults.length > 0) {
        // 점검 결과가 있으면 전달 차단, 저장만 완료
        info("차트점검 결과가 있습니다. 점검 완료 후 다시 전달해주세요.");
        success("저장 완료 (전달 보류)");
        setIsChartCheckPopupOpen(true);
      } else {
        // 점검 결과가 없으면 전달 수행
        setIsChartCheckPopupOpen(false);
        const registrationData = getRegistrationData(접수상태.수납대기, "payment");
        await updateRegistrationMutation.mutateAsync({
          id: selectedEncounter.registrationId,
          data: registrationData,
        });
        updateRegistration(selectedEncounter.registrationId, registrationData);
        success("저장전달 완료");
        setIsSavedAndTransmitted(true);
      }
    } catch (err: any) {
      console.error("저장전달 실패:", err);
      error("저장전달에 실패했습니다. 다시 시도해주세요.");
      throw err;
    } finally {
      setIsSavingAndTransmitting(false);
      setIsEncounterDataChanged(false);
    }
  };

  const handlePrintAndTransmit = async () => {
    setIsPrintingAndTransmitting(true);
    try {
      await commonSave();

      // BE가 저장 시 자동 PCI/자체 점검 → encounter response에 결과 포함
      const { pciCheckResults: pciResults, chartCheckResults } = useEncounterStore.getState();

      if (pciResults.length > 0 || chartCheckResults.length > 0) {
        // 점검 결과가 있으면 전달+출력 차단, 저장만 완료
        info("차트점검 결과가 있습니다. 점검 완료 후 다시 출력전달해주세요.");
        success("저장 완료 (출력전달 보류)");
        setIsChartCheckPopupOpen(true);
      } else {
        setIsChartCheckPopupOpen(false);
        // 점검 결과가 없으면 전달+출력 수행
        const registrationData = getRegistrationData(접수상태.수납대기, "payment");
        await updateRegistrationMutation.mutateAsync({
          id: selectedEncounter.registrationId,
          data: registrationData,
        });
        updateRegistration(selectedEncounter.registrationId, registrationData);

        await executePrinter({
          encounterId: selectedEncounter?.id,
          prescriptionGridRef,
          currentRegistrationPatient: currentRegistration?.patient,
          printMedicalRecord,
          medicalRecordLocalPrinterName: MEDICAL_RECORD_LOCAL_PRINTER_NAME,
          buildPrescriptionPdf,
          requestPrintJob,
          requestHtmlPrintJob,
        });

        AccessLogsService.createAccessLog({
          type: "PERSONAL",
          menuName: "진료실",
          patients: [
            {
              name: currentRegistration?.patient?.name || "",
              id: String(currentRegistration?.patient?.patientNo || currentRegistration?.patient?.id || ""),
            },
          ],
          action: "출력",
        });

        success("출력전달 완료");
        setIsPrintAndTransmitted(true);
      }
    } catch (err: any) {
      console.error("출력전달 실패:", err);
      // FIXME: 에러 임시 숨김
      // error("출력전달에 실패했습니다. 다시 시도해주세요.");
      throw err;
    } finally {
      setIsPrintingAndTransmitting(false);
      setIsEncounterDataChanged(false);
    }
  };

  // 단축키용 ref에 함수 할당
  handleSaveAndTransmitRef.current = handleSaveAndTransmit;
  handlePrintAndTransmitRef.current = handlePrintAndTransmit;

  const renderMainContent = (isChartCheck = false) => (
    <div className={`flex flex-col w-full h-full ${isChartCheck && "gap-[8px]"}`}>
      <Header onAddLibrary={addLibrary} isChartCheck={isChartCheck} />
      <Content
        diagnosisGridRef={diagnosisGridRef}
        prescriptionGridRef={prescriptionGridRef}
        diseases={diseases || []}
        orders={orders || []}
        isChartCheck={isChartCheck}
      />
      <FooterTop
        encounter={selectedEncounter}
        pharmacyNotes={pharmacyNotes}
        onPharmacyNotesChange={setPharmacyNotes}
        addOrderLibrary={addOrderLibrary}
        onValuesChange={setFooterTopValues}
        onSaveAndTransmit={handleSaveAndTransmit}
        onPrintAndTransmit={handlePrintAndTransmit}
        isChartCheck={isChartCheck}
      />
      <FooterBottom
        encounter={selectedEncounter}
        values={footerBottomValues}
        onSave={checkAndSave}
        isSaving={isSaving}
        isSaved={isSaved}
        onSaveAndTransmit={handleSaveAndTransmit}
        isSavingAndTransmitting={isSavingAndTransmitting}
        isSavedAndTransmitted={isSavedAndTransmitted}
        onPrintAndTransmit={handlePrintAndTransmit}
        isPrintingAndTransmitting={isPrintingAndTransmitting}
        isPrintAndTransmitted={isPrintAndTransmitted}
        onValuesChange={setFooterBottomValues}
        isChartCheck={isChartCheck}
      />
    </div>
  );

  return (
    <>
      {isChartCheckPopupOpen ? (
        <div className="flex flex-col w-full h-full items-center justify-center text-[12px] text-[var(--gray-400)]">
          차트점검 팝업에서 작업 중입니다.
        </div>
      ) : (
        renderMainContent(false)
      )}

      <MyPopup
        isOpen={isChartCheckPopupOpen}
        onCloseAction={() => setIsChartCheckPopupOpen(false)}
        title="차트점검"
        width="80vw"
        height="80vh"
        minWidth="900px"
        minHeight="600px"
        localStorageKey="chart-check-popup"
      >
        <div className="flex-1 min-h-0 h-full">
          <MySplitPane
            splitPaneId="chart-check-popup-split"
            isVertical={false}
            initialRatios={[0.3, 0.7]}
            panes={[
              <div key="chart-check" className="h-full overflow-hidden p-[4px] mr-[4px]">
                <ChartCheck />
              </div>,
              <div key="prescription" className="h-full overflow-hidden p-[4px] ml-[4px]">
                {renderMainContent(true)}
              </div>,
            ]}
          />
        </div>
      </MyPopup>
      <MyPopupYesNo
        isOpen={isOpenNonCoveredCheck}
        onCloseAction={() => setIsOpenNonCoveredCheck(false)}
        onConfirmAction={() => {
          setIsOpenNonCoveredCheck(false);
          setFooterBottomValues((prev) =>
            prev
              ? { ...prev, isClaim: false }
              : {
                receptionType: selectedEncounter!.receptionType!,
                timeCategory: selectedEncounter!.timeCategory!,
                resultType: selectedEncounter!.resultType!,
                isClaim: false,
              }
          );
          setTimeout(() => handleSave(), 0);
        }}
        hideHeader={true}
      >
        <div className="flex flex-col gap-2 text-[16px]">
          <div>
            이 환자는 {nonCoveredLabel} 사유로 급여제한 상태입니다.
          </div>
          <div>
            이 진료건을 비청구 진료로 변경합니다.
          </div>
        </div>
      </MyPopupYesNo>
      {isShowDurResult &&
        ((durResult?.ResultSet?.length ?? 0) > 0 ? (
          <MyPopup
            isOpen={true}
            onCloseAction={() => setIsShowDurResult(false)}
            title="DUR 점검 결과"
            width="600px"
            height="400px"
            minWidth="400px"
            minHeight="200px"
            localStorageKey={"dur-result-popup-settings"}
          >
            <DurResultInfo durResult={durResult || null} />
          </MyPopup>
        ) : (
          <DurInfoPopup
            durResult={durResult || null}
            setOpen={setIsShowDurResult}
          />
        ))}
    </>
  );
}

function DurResultInfo({ durResult }: { durResult: DurCheckResult | null }) {
  if (!durResult) {
    return null;
  }
  const resultSets = durResult?.ResultSet || [];
  return (
    <div className="flex flex-col h-full w-full gap-3 p-2 my-scroll">
      <div className="flex flex-row items-center gap-2 text-[14px] font-bold border p-2">
        이 팝업은 DUR에서 입력한 점검 결과를 제대로 받아왔는지 확인하기 위한 임시 화면입니다. 추 후 필요한 곳에 데이터 입력이 확인된다면 해당 팝업은 제거 됩니다.
      </div>
      {durResult?.AgentMessage && (
        <div className="flex flex-row items-start gap-2">
          <span className="text-sm font-semibold text-gray-600 min-w-[100px]">
            Agent 메시지:
          </span>
          <span className="text-sm flex-1">{durResult?.AgentMessage}</span>
        </div>
      )}

      {durResult?.DurMessage && (
        <div className="flex flex-row items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
          <span className="text-sm text-red-700 flex-1">
            [{durResult?.ResultCode}] {durResult.DurMessage}
          </span>
        </div>
      )}

      {/* 점검 결과 상세 테이블 */}
      {resultSets.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            점검 결과 상세 ({resultSets.length}건)
          </h3>
          <div className="border border-gray-200 rounded">
            <table className="w-full text-[12px] border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    순번
                  </th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    약품명
                  </th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    성분명
                  </th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    점검유형
                  </th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    등급
                  </th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    점검내용
                  </th>
                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                    사유
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultSets.map((result: DurCheckResultSet, index: number) => (
                  <tr
                    key={index}
                    className={cn(
                      "hover:bg-gray-50",
                      result.Level === "E" || result.Level === "W"
                        ? "bg-red-50"
                        : ""
                    )}
                  >
                    <td className="border border-gray-200 px-2 py-1">
                      {index + 1}
                    </td>
                    <td className="border border-gray-200 px-2 py-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{result.MedcNMA}</span>
                        {result.MedcCDA && (
                          <span className="text-gray-500 text-[12px]">
                            {result.MedcCDA}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-2 py-1">
                      <div className="flex flex-col gap-0.5">
                        <span>{result.GnlNMA || "-"}</span>
                        {result.GnlNMCDA && (
                          <span className="text-gray-500 text-[12px]">
                            {result.GnlNMCDA}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-2 py-1">
                      <div className="flex flex-col gap-0.5">
                        <span>{result.ExamTypeDesc || result.ExamTypeCD}</span>
                        {result.Type && (
                          <span className="text-gray-500 text-[12px]">
                            코드: {result.Type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-2 py-1">
                      <span
                        className={cn(
                          "font-bold",
                          result.Level === "E"
                            ? "text-red-600"
                            : result.Level === "W"
                              ? "text-orange-600"
                              : "text-gray-600"
                        )}
                      >
                        {result.Level || "-"}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-2 py-1">
                      <div className="flex flex-col gap-0.5 max-w-[300px]">
                        <span className="break-words">
                          {result.Message || "-"}
                        </span>
                        {result.Notice && (
                          <span className="text-orange-600 text-[12px] break-words">
                            부작용: {result.Notice}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-2 py-1">
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        <span className="break-words">
                          {result.Reason || "-"}
                        </span>
                        {result.ReasonCD && (
                          <span className="text-gray-500 text-[12px]">
                            코드: {result.ReasonCD}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
