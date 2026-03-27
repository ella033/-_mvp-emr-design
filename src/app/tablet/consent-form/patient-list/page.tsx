"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePendingPatients, useDeleteConsents } from "@/hooks/consent/use-create-consent";
import { useFacilities } from "@/hooks/facility/use-facilities";
import { useFacilityStore } from "@/store/facility-store";
import { useUserStore } from "@/store/user-store";
import { useSocket } from "@/contexts/SocketContext";
import ConsentHeader from "@/app/tablet/consent-form/_components/consent-header";
import TabletConsentPatientCard from "@/app/tablet/consent-form/_components/tablet-consent-patient-card";
import { useQueryClient } from "@tanstack/react-query";

export default function ConsentFormPatientListPage() {
  const router = useRouter();
  const [isBackTransition, setIsBackTransition] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<number>>(new Set());
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const hospitalIdFromUser = useUserStore((state) => state.user?.hospitalId);
  const setFacilities = useFacilityStore((state) => state.setFacilities);
  // KST 기준 오늘 날짜 가져오기
  const getTodayDateKST = () => {
    const now = new Date();
    // KST는 UTC+9
    const kstOffset = 9 * 60; // 9시간을 분으로 변환
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (kstOffset * 60000));

    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, '0');
    const day = String(kst.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const currentDate = getTodayDateKST();

  // PENDING 상태인 환자 목록 조회
  const { data: pendingPatientsResponse, isLoading, error } = usePendingPatients();
  const { mutateAsync: deleteConsents } = useDeleteConsents();

  // API 응답 확인용 console.log
  
  // console.log('[ConsentFormPatientListPage] isLoading:', isLoading);
  // console.log('[ConsentFormPatientListPage] error:', error);

  // items 배열 추출 (안전하게 처리)
  const patientsList = pendingPatientsResponse?.items && Array.isArray(pendingPatientsResponse.items)
    ? pendingPatientsResponse.items
    : [];

  // console.log('[ConsentFormPatientListPage] patientsList:', JSON.stringify(patientsList, null, 2));

  const hospitalId = hospitalIdFromUser;
  const { data: facilitiesData } = useFacilities(
    hospitalId ? `hospitalId=${hospitalId}` : "",
    !!hospitalId
  );

  useEffect(() => {
    if (facilitiesData && facilitiesData.length > 0) {
      setFacilities(facilitiesData);
    }
  }, [facilitiesData, setFacilities]);

  useEffect(() => {
    if (!socket) return;

    const handleConsentEvent = (eventName: string, payload: any) => {
      // db.* 이벤트에서 table === "patient_consents"인 경우만 처리
      if (!eventName.startsWith("db.") || payload?.table !== "patient_consents") {
        return;
      }

      const evtHospitalId =
        payload?.hospitalId ??
        payload?.data?.hospitalId ??
        payload?.data?.hospital_id;

      if (hospitalIdFromUser && evtHospitalId && Number(evtHospitalId) !== Number(hospitalIdFromUser)) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["consents", "pending-patients"] });
    };

    socket.onAny(handleConsentEvent);

    return () => {
      socket.offAny(handleConsentEvent);
    };
  }, [socket, queryClient, hospitalIdFromUser]);

  useEffect(() => {
    const transition = window.sessionStorage.getItem("consent-list-transition");
    if (transition === "back") {
      setIsBackTransition(true);
      window.sessionStorage.removeItem("consent-list-transition");
    }
  }, []);

  const handlePointerEnd = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const enterDeleteModeWithSelection = (patientId: number) => {
    setIsDeleteMode(true);
    setSelectedPatientIds(new Set([patientId]));
    didLongPressRef.current = true;
  };

  const handlePointerStart = (patientId: number) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    didLongPressRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      enterDeleteModeWithSelection(patientId);
    }, 450);
  };

  const getPatientId = (patientData: any) =>
    Number(
      patientData?.patientId ??
      patientData?.id ??
      patientData?.patient_id ??
      patientData?.patientID
    );

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedPatientIds).filter((id) => Number.isFinite(id));
    if (ids.length === 0) return;
    await deleteConsents({ patientIds: ids });
    setSelectedPatientIds(new Set());
    setIsDeleteMode(false);
    queryClient.invalidateQueries({ queryKey: ["consents", "pending-patients"] });
  };
  return (
    <div
      className={`consent-list-page${isBackTransition ? " back" : ""}`}
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '0px 16px 22px',
        gap: '24px',
        width: '100%',
        height: '100dvh',
        background: '#FFFFFF',
        border: '1px solid #E6E6E6',
        borderRadius: '0px',
      }}
    >
      <ConsentHeader
        showBack={isDeleteMode}
        onBack={() => {
          setIsDeleteMode(false);
          setSelectedPatientIds(new Set());
        }}
        backLabel="<"
      />
      {/* 서명 요청 환자 선택 섹션 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
          alignSelf: 'stretch',
          minHeight: '62px',
        }}
      >
        {isDeleteMode ? (
          <>
            <span
              style={{
                color: 'var(--Gray-100_171719, #171719)',
                fontFeatureSettings: "'case' on, 'cpsp' on",
                fontFamily: 'Pretendard',
                fontSize: '22px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '140%',
                letterSpacing: '-0.22px',
                alignSelf: 'center',
              }}
            >
              {selectedPatientIds.size}개 선택됨
            </span>
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--Gray-400_70737C, #70737C)',
                fontFeatureSettings: "'case' on, 'cpsp' on",
                fontFamily: 'Pretendard',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-0.16px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                alignSelf: 'center',
              }}
              onClick={handleDeleteSelected}
            >
              <img
                src="/icon/ic_trash_20.svg"
                alt=""
                aria-hidden="true"
                style={{ width: '20px', height: '20px', display: 'block' }}
              />
              <span
                style={{
                  transform: 'translateY(1px)',
                }}
              >
                삭제
              </span>
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--Gray-100_171719, #171719)',
                fontFeatureSettings: "'case' on, 'cpsp' on",
                fontFamily: 'Pretendard',
                fontSize: '22px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '140%',
                letterSpacing: '-0.22px',
              }}
            >
              <span>서명이 필요한 환자를</span>
              <span>선택해주세요</span>
            </div>
            <span
              style={{
                color: 'var(--Gray-400_70737C, #70737C)',
                textAlign: 'right',
                fontFamily: 'Pretendard',
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: 500,
                lineHeight: '125%',
                letterSpacing: '-0.14px',
              }}
            >
              {currentDate}
            </span>
          </>
        )}
      </div>

      {/* 환자 카드 리스트 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '16px',
          width: '100%',
        }}
      >
        {isLoading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            로딩 중...
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#EF4444' }}>
            환자 목록을 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {!isLoading && !error && patientsList.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
            PENDING 상태인 환자가 없습니다.
          </div>
        )}

        {!isLoading && !error && patientsList.length > 0 && patientsList.map((patientData: any) => {
          const patientId = getPatientId(patientData);
          const isSelected = selectedPatientIds.has(patientId);
          // API 필드명 매핑: patientName, patientBirthDate, patientGender, patientRrn, patientNo, facilityName
          const name = patientData.patientName || patientData.name || "";
          const birthDate = patientData.patientBirthDate || patientData.birthDate || "";
          const gender = patientData.patientGender ?? patientData.gender ?? 0;
          const rrnView = patientData.patientRrn || patientData.rrnView || patientData.rrn || "";
          const patientNo = patientData.patientNo || patientId;
          const facilityName = patientData.facilityName || "진료실 없음";
          return (
            <TabletConsentPatientCard
              key={patientId}
              name={name}
              birthDate={birthDate}
              gender={gender}
              patientNo={patientNo}
              rrn={rrnView}
              facilityName={facilityName}
              onClick={() => {
                if (didLongPressRef.current) {
                  didLongPressRef.current = false;
                  return;
                }
                if (isDeleteMode) {
                  setSelectedPatientIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(patientId)) {
                      next.delete(patientId);
                    } else {
                      next.add(patientId);
                    }
                    return next;
                  });
                  return;
                }
                const selectedPatient = {
                  id: patientId,
                  name,
                  birthDate,
                  gender,
                  rrnView,
                  patientNo,
                  facilityName,
                  phone1: patientData.phone1 || "",
                  phone2: patientData.phone2 || "",
                };
                window.sessionStorage.setItem(
                  "consent-selected-patient",
                  JSON.stringify(selectedPatient)
                );
                router.push(`/tablet/consent-form/patient/${patientId}`);
              }}
              onPointerDown={() => handlePointerStart(patientId)}
              onPointerUp={handlePointerEnd}
              onPointerLeave={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              showSelection={isDeleteMode}
              selected={isSelected}
            />
          );
        })}
      </div>

      <style jsx>{`
        .consent-list-page.back {
          animation: slide-in-left 250ms ease-out;
        }
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
            opacity: 0.9;
          }
          to {
            transform: translateX(0%);
            opacity: 1;
          }
        }
      `}</style>
      <style jsx global>{`
        html,
        body {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}
