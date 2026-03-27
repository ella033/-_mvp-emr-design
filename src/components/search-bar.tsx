"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Patient } from "@/types/patient-types";
import { useSearchPatients } from "@/hooks/patient/use-search-patients";
import PatientInfoForm from "@/components/patient-form/patient-info-form";
import { useReceptionTabsStore } from "@/store/reception";
import { useHospitalStore } from "@/store/hospital-store";
import { usePathname } from "next/navigation";
import { useRegistrationsLatest } from "@/hooks/registration/use-registrionst-latest";
import { useQueryClient } from "@tanstack/react-query";
import type { MedicalAidBase } from "@/types/medical-aid-types";
import { getAgeOrMonth, getGender, mapToPatient } from "@/lib/patient-utils";
import { formatRrnNumber } from "@/lib/common-utils";
import { formatDate } from "@/lib/date-utils";
import { registrationKeys } from "@/lib/query-keys/registrations";
import { highlightKeyword } from "@/components/yjg/common/util/ui-util";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { MyPopupYesNo } from "./yjg/my-pop-up";
import { Button } from "./ui/button";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";
import {
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
  buildProvisionalRegistrationId,
} from "@/lib/registration-utils";
import { ReceptionService } from "@/services/reception-service";

// 커스텀 useDebounce 훅 구현, 특정 시간마다 값을 업데이트
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBar({
  widthClassName = "w-[16rem]",
  onPatientSelect,
  disableDefaultBehavior = false,
  placeholder = "환자 검색",
  inputTestId,
  dropdownTestId,
}: {
  widthClassName: string;
  onPatientSelect?: (patient: Patient) => void;
  disableDefaultBehavior?: boolean;
  placeholder?: string;
  inputTestId?: string;
  dropdownTestId?: string;
}) {
  // Hooks must be called inside component body
  const { hospital } = useHospitalStore();
  const pathname = usePathname();
  const isReception = pathname.includes("/reception");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    addOpenedReception,
    setOpenedReceptionId,
    replaceReceptionTab,
  } = useReceptionTabsStore();
  // 최근 한 달간 선택 환자의 접수 정보 조회
  const [selectedRegPatientId, setSelectedRegPatientId] = useState<
    string | null
  >(null);
  const today = useMemo(() => new Date(), []);
  const baseDate = useMemo(() => formatDate(today, "-"), [today]);
  const {
    data: registrations,
    isLoading: regIsLoading,
    isError: regIsError,
    error: regError,
    isFetching: regIsFetching,
    status: regStatus,
  } = useRegistrationsLatest(selectedRegPatientId ?? "", baseDate);

  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(
    undefined
  );
  const [processedPatientId, setProcessedPatientId] = useState<string | null>(
    null
  );
  // 환자 선택 시 selectedRegPatientId 설정
  useEffect(() => {
    if (selectedPatient && String(selectedPatient.id) !== processedPatientId) {
      setProcessedPatientId(String(selectedPatient.id));

      // 기존 캐시 무효화 (동일한 환자 재조회 시 최신 데이터 가져오기)
      queryClient.invalidateQueries({
        queryKey: registrationKeys.latest(String(selectedPatient.id), baseDate),
      });

      setSelectedRegPatientId(String(selectedPatient.id));
    }
  }, [selectedPatient, processedPatientId]);

  // registrations 데이터가 로드되면 처리하는 useEffect
  useEffect(() => {
    if (
      selectedPatient &&
      selectedRegPatientId === String(selectedPatient.id) &&
      !regIsLoading
    ) {
      if (registrations && registrations.id) {
        const recentReg = registrations;

        const recDate = new Date(recentReg?.receptionDateTime ?? new Date());
        const resolvedId =
          recDate.getDate() === today.getDate()
            ? normalizeRegistrationId(
              recentReg?.id)
            : REGISTRATION_ID_NEW;

        const patientObj = mapToPatient(selectedPatient);

        if (recentReg && resolvedId !== REGISTRATION_ID_NEW) {
          const reception = ReceptionService.convertRegistrationToReception({
            ...recentReg,
            patient: patientObj,
          });

          // 중복 처리: 이미 동일한 originalRegistrationId를 가진 reception이 있는지 확인
          const { openedReceptions } = useReceptionTabsStore.getState();
          const existingReception = openedReceptions.find(
            (r) => r.originalRegistrationId === reception.originalRegistrationId
          );

          if (existingReception) {
            // 이미 열려있는 탭 활성화

            setOpenedReceptionId(
              reception.originalRegistrationId || REGISTRATION_ID_NEW
            );
          } else {
            // 새로운 접수 추가
            addOpenedReception(reception);

            setOpenedReceptionId(
              reception.originalRegistrationId || REGISTRATION_ID_NEW
            );
          }
        } else if (recentReg) {
          setSelectedPatient(recentReg.patient);

          // 기존 환자 조회: 접수 생성 전까지 registrationId는 "new"
          const reception = ReceptionService.convertRegistrationToReception({
            ...recentReg,
            id: resolvedId,
            patient: patientObj,
          });

          // 중복 처리: 동일한 환자(patientId)가 이미 열려있는지 확인
          const { openedReceptions } = useReceptionTabsStore.getState();
          const existingReception = openedReceptions.find(
            (r) =>
              r.patientBaseInfo.patientId === String(selectedPatient?.id)
          );

          if (existingReception) {
            // 이미 열려있는 환자 탭 활성화
            setOpenedReceptionId(
              existingReception.originalRegistrationId || REGISTRATION_ID_NEW
            );
          } else {
            addOpenedReception(reception);
            setOpenedReceptionId(REGISTRATION_ID_NEW);
          }
        } else {
          // registrations가 없는 기존 환자 또는 신규 환자
          const initialReception = ReceptionService.createInitialReception();

          // 기존 환자로 처리: 접수되지 않은 기환자는 provisional ID 사용 (같은 환자를 여러 번 열 수 있도록 고유 ID 생성)
          initialReception.originalRegistrationId = selectedPatient
            ? buildProvisionalRegistrationId(`${selectedPatient.id}-${Date.now()}`)
            : REGISTRATION_ID_NEW;

          // 선택된 환자 정보로 업데이트
          initialReception.patientBaseInfo.patientId = String(
            selectedPatient?.id ?? "0"
          );
          initialReception.patientBaseInfo.name = selectedPatient?.name ?? "";

          // birthDate 처리: YYYYMMDD 형식 지원
          let birthDate = new Date();
          if (selectedPatient?.birthDate) {
            const birthDateStr = selectedPatient.birthDate;
            if (
              typeof birthDateStr === "string" &&
              birthDateStr.length === 8 &&
              /^\d{8}$/.test(birthDateStr)
            ) {
              // "19930101" → "1993-01-01"
              const year = birthDateStr.substring(0, 4);
              const month = birthDateStr.substring(4, 6);
              const day = birthDateStr.substring(6, 8);
              birthDate = new Date(`${year}-${month}-${day}`);
            } else {
              birthDate = new Date(birthDateStr);
            }
            // Invalid Date인 경우 현재 날짜로 대체
            if (isNaN(birthDate.getTime())) {
              birthDate = new Date();
            }
          }
          initialReception.patientBaseInfo.birthday = birthDate;
          initialReception.patientBaseInfo.gender =
            selectedPatient?.gender ?? 0;
          initialReception.patientBaseInfo.rrn = selectedPatient?.rrn ?? "";
          initialReception.patientBaseInfo.zipcode =
            selectedPatient?.zipcode ?? "";
          initialReception.patientBaseInfo.address =
            selectedPatient?.address1 ?? "";
          initialReception.patientBaseInfo.address2 =
            selectedPatient?.address2 ?? "";
          initialReception.patientBaseInfo.phone1 =
            selectedPatient?.phone1 ?? "";
          initialReception.patientBaseInfo.phone2 =
            selectedPatient?.phone2 ?? "";
          initialReception.patientBaseInfo.idNumber =
            selectedPatient?.idNumber ?? null;
          initialReception.patientBaseInfo.idType =
            selectedPatient?.idType ?? null;
          initialReception.patientBaseInfo.lastVisit =
            selectedPatient?.lastEncounterDate ?? null;
          initialReception.patientBaseInfo.isActive =
            selectedPatient?.isActive ?? true;
          initialReception.patientBaseInfo.isNewPatient = true;
          initialReception.patientBaseInfo.patientMemo =
            selectedPatient?.memo ?? "";
          initialReception.patientBaseInfo.receptionMemo = "";
          initialReception.patientBaseInfo.isPrivacy = selectedPatient?.consent
            ?.privacy
            ? 1
            : 0;
          initialReception.patientBaseInfo.recvMsg = selectedPatient?.consent
            ?.marketing
            ? 1
            : 0;
          initialReception.patientBaseInfo.eligibilityCheck =
            selectedPatient?.eligibilityCheck ?? {} as EligibilityCheck;
          initialReception.patientBaseInfo.identityOptional =
            selectedPatient?.eligibilityCheck?.parsedData?.["본인확인예외여부"]?.data === "Y" ||
            selectedPatient?.identityVerifiedAt !== null || false;
          initialReception.patientBaseInfo.identityVerifiedAt =
            selectedPatient?.identityVerifiedAt ?? null;

          // patientStatus 업데이트
          initialReception.patientStatus.patient = patientObj as any;

          initialReception.patientStatus.patientName =
            selectedPatient?.name ?? "";
          initialReception.patientStatus.gender = selectedPatient?.gender ?? 0;
          initialReception.patientStatus.birthday = birthDate; // 위에서 처리한 birthDate 사용
          initialReception.patientStatus.chronicFlags =
            selectedPatient?.chronicDisease ?? {
              hypertension: false,
              diabetes: false,
              highCholesterol: false,
            };

          // insuranceInfo 업데이트
          initialReception.insuranceInfo.patientId = String(
            selectedPatient?.id ?? "0"
          );

          // receptionInfo 업데이트
          initialReception.receptionInfo.patientId = String(
            selectedPatient?.id ?? "0"
          );

          // bioMeasurementsInfo 업데이트
          initialReception.bioMeasurementsInfo.vital = (
            selectedPatient?.vitalSignMeasurements ?? []
          ).map((v) => ({
            id: v.id.toString(),
            measurementDateTime: v.measurementDateTime,
            itemId: v.itemId,
            value: v.value.toString(),
            memo: v.memo || "",
            vitalSignItem: v.vitalSignItem || null,
          }));

          // 중복 처리: 동일한 환자(patientId)가 이미 열려있는지 확인
          const { openedReceptions } = useReceptionTabsStore.getState();
          const existingReception = openedReceptions.find(
            (r) =>
              r.patientBaseInfo.patientId === String(selectedPatient?.id)
          );

          if (existingReception) {
            // 이미 열려있는 환자 탭 활성화
            setOpenedReceptionId(
              existingReception.originalRegistrationId || REGISTRATION_ID_NEW
            );
          } else {
            // 새로운 환자 추가
            addOpenedReception(initialReception);
            setOpenedReceptionId(REGISTRATION_ID_NEW);
          }
        }
      }
    }
  }, [
    selectedPatient,
    registrations,
    selectedRegPatientId,
    today,
    hospital?.id,
    regIsLoading,
  ]);

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingReception, setPendingReception] = useState<any>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // 드롭다운 위치 계산 함수
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // focus 상태 변경 시 위치 업데이트
  useEffect(() => {
    if (isFocused) {
      // 약간의 지연을 두어 CSS transition이 완료된 후 위치 계산
      const timer = setTimeout(updateDropdownPosition, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFocused]);

  const handleOverwriteConfirm = () => {
    if (pendingReception) {
      const normalizedId = normalizeRegistrationId(
        pendingReception.originalRegistrationId
      );
      replaceReceptionTab(normalizedId, {
        ...pendingReception,
        originalRegistrationId: normalizedId,
      });
    }
    setShowOverwriteConfirm(false);
    setPendingReception(null);
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setPendingReception(null);
  };

  const handlePatientSelect = (patient: Patient) => {
    // 1. Props로 받은 콜백이 있으면 먼저 실행
    if (onPatientSelect) {
      onPatientSelect(patient);
    }

    // 2. disableDefaultBehavior가 false이면 기존 로직 실행
    if (!disableDefaultBehavior) {
      // 새로운 환자가 선택되면 processedPatientId 초기화
      setProcessedPatientId(null);
      setSelectedRegPatientId(String(patient.id));

      setSelectedPatient(patient);
      if (!isReception) {
        setFormOpen(true);
      }
    }

    // 3. 공통 처리 (검색어 초기화, 포커스 해제 등)
    setIsFocused(false);
    setQuery(""); // 선택 후 검색어 초기화
    inputRef.current?.blur();
  };

  const debouncedQuery = useDebounce(query, 300);

  // 검색 파라미터 생성
  const params: Record<string, any> = {
    take: 20,
    sortBy: "id",
    sortOrder: "desc",
    search: debouncedQuery,
  };

  // React Query 훅 사용
  const { data, isLoading, isError } = useSearchPatients(params);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredPatients([]);
      setSelectedIndex(-1);
      return;
    }

    if (data && (data as any).items) {
      const patients = ((data as any).items || []).map((item: any) => ({
        phone: item.phone1 ?? item.phone2 ?? "",
        ...item,
      }));
      setFilteredPatients(patients);
      setSelectedIndex(-1);
    } else if (isError) {
      setFilteredPatients([]);
      setSelectedIndex(-1);
    } else {
      setFilteredPatients([]);
      setSelectedIndex(-1);
    }
  }, [
    debouncedQuery,
    data,
    isError,
  ]);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    if (selectedIndex >= 0 && listItemRefs.current[selectedIndex]) {
      listItemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused || filteredPatients.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredPatients.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPatients.length) {
          handlePatientSelect(filteredPatients[selectedIndex] as Patient);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 스타일 클래스 정의
  const inputBaseClasses =
    "pl-[2.5rem] h-[1.75rem] focus:h-[3.25rem] leading-7 focus-visible:ring-transparent border-0";
  const inputStateClasses =
    "bg-gray-100 focus:bg-white focus:mt-2 focus:rounded-b-none focus:border focus:!border-[var(--main-color)] focus:!border-b-gray-200";

  return (
    // 1014 fix:absolute 제거 - 예약페이지 작은 사이즈 panel에 searchBar사용 시 absolute 추가시 부모 영역 넘어가는 문제 발생
    <div className={`${widthClassName}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 w-[1rem] h-[1rem] -translate-y-1/2 pointer-events-none text-muted-foreground" />
        <Input
          ref={inputRef}
          data-testid={inputTestId}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputBaseClasses} ${inputStateClasses}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
        />
        {/* 검색 결과 */}
        {isFocused &&
          createPortal(
            <div
              data-testid={dropdownTestId}
              className="fixed p-3 bg-white rounded-b-md shadow-lg max-h-[50vh] overflow-y-auto border border-[var(--main-color)] z-[99999]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[18.3vh]">
                  <p className="text-[0.875rem] text-muted-foreground">
                    검색 중...
                  </p>
                </div>
              ) : filteredPatients.length > 0 ? (
                <ul>
                  {filteredPatients.map((patient: any, index: number) => (
                    <li
                      key={patient.id}
                      ref={(el) => {
                        listItemRefs.current[index] = el;
                      }}
                      className={`flex flex-col gap-1 p-2 rounded-md transition-colors cursor-pointer ${index === selectedIndex
                        ? "bg-[var(--violet-1)] bg-opacity-10"
                        : "hover:bg-gray-50"
                        }`}
                      onClick={() => handlePatientSelect(patient)}
                      onMouseDown={(e) => e.preventDefault()} // onBlur 이벤트 방지
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {/* 첫 번째 줄 */}
                      <div className="flex gap-2 items-center">
                        <span className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none">
                          {highlightKeyword(
                            patient.patientNo?.toString() ?? "",
                            query,
                            {
                              className:
                                "font-semibold text-black bg-yellow-200 rounded-sm",
                            }
                          )}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {highlightKeyword(patient.name || "", query)}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          ({getGender(patient.gender, "ko")}/{getAgeOrMonth(patient.birthDate || "나이", "en")})
                        </span>
                        <span className="text-sm text-gray-500">
                          {highlightKeyword(
                            patient.rrn ? formatRrnNumber(patient.rrn) : "주민번호",
                            query
                          )}
                        </span>
                        <span className="text-sm text-gray-300">|</span>
                        <span className="text-sm text-gray-500">
                          {highlightKeyword(
                            patient.phone1 || patient.phone || "",
                            query
                          )}
                        </span>
                      </div>
                      {/* 두 번째 줄 */}
                      <div className="flex items-center">
                        <span className="text-xs text-gray-400">
                          {highlightKeyword(
                            stripHtmlTags(
                              patient.memo || patient.patientMemo || ""
                            ),
                            query
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-[18.3vh] justify-center items-center">
                  <p className="text-[0.8125rem] text-[#46474C] text-center">
                    검색 결과가 없습니다.
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2 text-[0.8125rem] text-gray-400">
                  <span>상세검색</span>
                </div>
                <Button
                  variant="outline"
                  className="px-3 py-1 text-[0.75rem] border-[var(--main-color)]"
                >
                  신환접수
                </Button>
              </div>
            </div>,
            document.body
          )}
      </div>
      <PatientInfoForm
        isEdit
        patient={selectedPatient}
        formOpen={formOpen}
        setFormOpen={setFormOpen}
      />

      <MyPopupYesNo
        isOpen={showOverwriteConfirm}
        onCloseAction={handleOverwriteCancel}
        onConfirmAction={handleOverwriteConfirm}
        title=""
        message={`작성중인 환자내역이 있습니다. 덮어쓰시겠습니까?`}
      />
    </div>
  );
}
