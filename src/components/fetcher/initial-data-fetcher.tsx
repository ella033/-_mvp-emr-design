// 데이터 전역 fetcher (데이터 초기화)

"use client";
import { useEffect, useMemo, useRef } from "react";
import { useHospitalStore } from "@/store/hospital-store";
import { useRegistrationsByHospital } from "@/hooks/registration/use-registrations-by-hospital";
import { useHospital } from "@/hooks/hospital/use-hospital";
import { useAppointmentsByHospital } from "@/hooks/appointment/use-appointments-by-hospital";
import { useAppointmentStore } from "@/store/appointment-store";
import { useDoctorsStore } from "@/store/doctors-store";
import { useUsersByHospital } from "@/hooks/user/use-users-by-hospital";
import { useUsersStore } from "@/store/users-store";
import { useUserStore } from "@/store/user-store";
import { useAuthCheck } from "@/hooks/auth/actions/use-auth-check";
import { useProfile } from "@/hooks/auth/use-profile";
import { usePermissionCheck } from "@/hooks/auth/use-permission-check";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import {
  safeLocalStorage,
  safeJsonParse,
} from "@/components/yjg/common/util/ui-util";
import { useReceptionStore } from "@/store/common/reception-store";
import { useDepartmentStore } from "@/store/department-store";
import { useDepartmentsWithPositions } from "@/hooks/department/use-departments-with-positions";
import { useFacilityStore } from "@/store/facility-store";
import { useAppointmentRooms } from "@/hooks/api/use-appointment-rooms";
import { useAvailablePrintersQuery } from "@/components/settings/printer/hooks/use-available-printers-query";
import { usePrintersStore } from "@/store/printers-store";
import { useSettingsStore } from "@/store/settings-store";
import { useSettings } from "@/hooks/api/use-settings";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import { usePatientGroups } from "@/hooks/patient/use-patient-groups";
import { useBenefitsStore } from "@/store/benefits-store";
import { useBenefits } from "@/hooks/benefits/use-benefits";

export default function InitialDataFetcher() {
  useAuthCheck();
  usePermissionCheck();


  const { user, setUser, setHospitalId } = useUserStore();
  const { data: profile } = useProfile();
  const printers = usePrintersStore((state) => state.printers);
  const setPrinters = usePrintersStore((state) => state.setPrinters);
  const printersQuery = useAvailablePrintersQuery({ enabled: false });
  const fetchedPrintersForHospitalRef = useRef<number | null>(null);

  // 1) 앱 진입/새로고침 시 localStorage user를 먼저 hydrate (profile보다 빠름)
  useEffect(() => {
    const storedUser = safeJsonParse(safeLocalStorage.getItem("user"), {} as any);
    if (storedUser?.hospitalId) {
      setUser(storedUser);
    }
  }, [setUser]);

  // 2) profile이 도착하면 hospitalId를 보정 (localStorage가 비었거나 오래된 경우 대비)
  useEffect(() => {
    if (!profile?.hospitalId) return;
    if (!user?.hospitalId || user.hospitalId !== profile.hospitalId) {
      setHospitalId(profile.hospitalId);
    }
  }, [profile?.hospitalId, user?.hospitalId, setHospitalId]);

  useEffect(function initializePrintersOnAppLoad() {
    const hospitalId = user?.hospitalId;
    if (!hospitalId) return;
    if (fetchedPrintersForHospitalRef.current === hospitalId) return;
    // StrictMode/재렌더에서 중복 refetch를 막기 위해 요청 시작 시점에 선점한다.
    fetchedPrintersForHospitalRef.current = hospitalId;

    async function fetchAndSetPrinters() {
      try {
        const result = await printersQuery.refetch();
        if (result.data) {
          setPrinters(result.data);
        }
      } catch (e) {
        // 실패한 경우 다음 렌더에서 재시도 가능하도록 롤백
        fetchedPrintersForHospitalRef.current = null;
        console.error("[InitialDataFetcher] Failed to fetch printers on app load", e);
      }
    }

    fetchAndSetPrinters();
  }, [user?.hospitalId, setPrinters, printersQuery]);

  const initializationRef = useRef(false);

  const hospitalId = user?.hospitalId;

  // hospitalId가 없으면 초기화하지 않음
  if (!hospitalId) {
    return null;
  }

  // 이미 초기화되었으면 중복 실행 방지
  if (initializationRef.current) {
    return null;
  }

  return (
    <DataLoader
      hospitalId={hospitalId}
      onInitialized={() => {
        initializationRef.current = true;
      }}
    />
  );
}

// 실제 데이터 로딩을 담당하는 컴포넌트
function DataLoader({
  hospitalId,
  onInitialized,
}: {
  hospitalId: number;
  onInitialized: () => void;
}) {
  const { setHospital } = useHospitalStore();
  const { setAppointments } = useAppointmentStore();
  const { setAppointmentRooms } = useAppointmentRoomsStore();
  const { setDoctors } = useDoctorsStore();
  const { setRegistrations } = useReceptionStore();
  const { setSettings, setIsLoaded: setSettingsLoaded } = useSettingsStore();
  const { data: currentHospital } = useHospital(hospitalId);
  const { data: settings } = useSettings({ scope: "user" });
  const { setDepartmentsByHospital } = useDepartmentStore();
  const { setFacilitiesByHospital } = useFacilityStore();
  const { setUsersByHospital } = useUsersStore();
  const { setPatientGroups } = usePatientGroupsStore();
  const { data: patientGroups } = usePatientGroups();
  const { setBenefits } = useBenefitsStore();
  const { data: benefits } = useBenefits();

  const registrationHospitalId = useMemo(
    () => currentHospital?.id,
    [currentHospital]
  );

  const { data: currentAppointments } = useAppointmentsByHospital(
    registrationHospitalId
  );
  const { data: currentRegistrations } = useRegistrationsByHospital(
    String(registrationHospitalId)
  );
  const { data: doctors } = useUsersByHospital(registrationHospitalId || 0);
  const { data: departments } = useDepartmentsWithPositions();

  // Hospital 데이터에서 facilities 추출 (별도 API 호출 불필요)
  const facilities = currentHospital?.facilities || [];
  const { data: currentAppointmentRooms } = useAppointmentRooms();
  useEffect(() => {
    if (currentHospital) {
      setHospital(currentHospital);
    }
  }, [currentHospital, setHospital]);

  // 초기 로드 시에만 store에 기록한다.
  // 이후 데이터 갱신은 소켓 리스너(use-reception-socket-listener)가 store를 직접 갱신하므로,
  // invalidateQueries로 인한 React Query 재조회가 store를 덮어쓰지 않도록 한다.
  const appointmentsInitializedRef = useRef(false);
  const registrationsInitializedRef = useRef(false);

  useEffect(() => {
    if (currentAppointments && !appointmentsInitializedRef.current) {
      setAppointments(currentAppointments);
      appointmentsInitializedRef.current = true;
    }
  }, [currentAppointments, setAppointments]);

  useEffect(() => {
    if (currentRegistrations && !registrationsInitializedRef.current) {
      setRegistrations(currentRegistrations);
      registrationsInitializedRef.current = true;
    }
  }, [currentRegistrations, setRegistrations]);

  useEffect(() => {
    if (doctors) {
      // UserManager를 DoctorType으로 변환
      const doctorTypes = doctors.map((doctor) => ({
        id: doctor.id,
        hospitalId: doctor.hospitalId,
        type: doctor.type,
        name: doctor.name,
        email: doctor.email,
        mobile: doctor.mobile || "",
        createId: doctor.createId || 0,
        createDateTime: doctor.createDateTime || new Date().toISOString(),
        updateId: doctor.updateId || null,
        updateDateTime: doctor.updateDateTime || null,
        isActive: doctor.isActive,
      }));
      setDoctors(doctorTypes);
    }
  }, [doctors, setDoctors]);

  useEffect(() => {
    if (departments && registrationHospitalId) {
      setDepartmentsByHospital(registrationHospitalId.toString(), departments);
    }
  }, [departments, registrationHospitalId, setDepartmentsByHospital]);

  useEffect(() => {
    if (currentHospital && facilities.length > 0) {
      setFacilitiesByHospital(currentHospital.id.toString(), facilities);
    }
  }, [currentHospital, facilities, setFacilitiesByHospital]);

  useEffect(() => {
    if (doctors && registrationHospitalId) {
      setUsersByHospital(registrationHospitalId.toString(), doctors);
    }
  }, [doctors, registrationHospitalId, setUsersByHospital]);

  useEffect(() => {
    if (currentAppointmentRooms) {
      setAppointmentRooms(currentAppointmentRooms);
    }
  }, [currentAppointmentRooms, setAppointmentRooms]);

  useEffect(() => {
    if (settings) {
      setSettings(settings);
      setSettingsLoaded(true);
    }
  }, [settings, setSettings, setSettingsLoaded]);

  useEffect(() => {
    if (patientGroups) {
      setPatientGroups(patientGroups);
    }
  }, [patientGroups, setPatientGroups]);

  useEffect(() => {
    if (benefits) {
      setBenefits(benefits);
    }
  }, [benefits, setBenefits]);

  // patientGroups, benefits까지 스토어에 반영된 뒤에만 초기화 완료 처리.
  // 이렇게 하지 않으면 다른 데이터만 준비된 시점에 DataLoader가 언마운트되어
  // basic-info2 / payment-amount 쪽 select에 값이 간헐적으로 비는 현상이 발생할 수 있음.
  useEffect(() => {
    if (
      currentHospital &&
      currentAppointments &&
      currentRegistrations &&
      doctors &&
      departments &&
      facilities.length >= 0 &&
      currentAppointmentRooms &&
      settings &&
      patientGroups &&
      benefits
    ) {
      onInitialized();
    }
  }, [
    currentHospital,
    currentAppointments,
    currentRegistrations,
    doctors,
    departments,
    facilities,
    currentAppointmentRooms,
    settings,
    patientGroups,
    benefits,
    onInitialized,
  ]);

  return null;
}
