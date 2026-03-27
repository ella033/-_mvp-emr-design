"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAgeOrMonth, getGender, makeRrnView } from "@/lib/patient-utils";
import { usePatientConsents } from "@/hooks/consent/use-create-consent";
import ConsentHeader from "@/app/tablet/consent-form/_components/consent-header";

export default function ConsentFormPatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ patientId: string }>();
  const patientId = params?.patientId || "";
  const numericPatientId = Number(patientId);
  const [patientInfo, setPatientInfo] = useState<{
    id: number | string;
    name: string;
    birthDate: string;
    gender: number;
    rrnView: string;
    patientNo?: string | number;
    facilityName?: string;
  } | null>(null);
  useEffect(() => {
    router.prefetch("/tablet/consent-form/patient-list");
  }, [router]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("consent-selected-patient");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (String(parsed.id) === String(patientId)) {
        setPatientInfo({
          ...parsed,
          patientNo: parsed.patientNo ?? parsed.id,
        });
      }
    } catch {
      // ignore invalid storage data
    }
  }, [patientId]);
  const title = useMemo(() => "서명이 필요한 동의서를\n선택해 주세요", []);
  const currentDate = useMemo(() => {
    const now = new Date();
    const kstOffset = 9 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (kstOffset * 60000));
    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, "0");
    const day = String(kst.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const handleBack = () => {
    window.sessionStorage.setItem("consent-list-transition", "back");
    router.push("/tablet/consent-form/patient-list");
  };

  const { data: consentsResponse, isLoading: isConsentsLoading } =
    usePatientConsents({
      patientId: Number.isNaN(numericPatientId) ? undefined : numericPatientId,
      status: "PENDING",
      take: 20,
    });

  const consentItems = consentsResponse?.items || [];
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SIGNED":
        return "서명 완료";
      case "PENDING":
        return "서명 필요";
      case "REVOKED":
        return "철회";
      case "VOIDED":
        return "무효";
      default:
        return status;
    }
  };
  const getStatusClass = (status: string) => {
    switch (status) {
      case "SIGNED":
        return "status-complete";
      case "PENDING":
        return "status-pending";
      default:
        return "status-default";
    }
  };

  return (
    <div className="consent-slide-page">
      <ConsentHeader onBack={handleBack} backLabel="<" />

      <div className="consent-body">
        <div className="consent-title-row">
          <div className="consent-title">
            {title.split("\n").map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </div>
          <span className="consent-date">{currentDate}</span>
        </div>
        <div className="consent-patient-section">
          <div className="consent-patient-bar">
            <div className="consent-patient-row">
              <span className="consent-patient-name">
                {patientInfo
                  ? (() => {
                    const ageText = getAgeOrMonth(
                      patientInfo.birthDate,
                      "en"
                    );
                    const rawGender = patientInfo.gender;
                    const genderText =
                      rawGender === "F" || rawGender === "f"
                        ? "여"
                        : rawGender === "M" || rawGender === "m"
                          ? "남"
                          : getGender(rawGender as number, "ko");
                    return `${patientInfo.name} (${ageText} ${genderText})`;
                  })()
                  : "환자 정보"}
              </span>
              {patientInfo?.patientNo != null && (
                <span className="consent-patient-chart">
                  {patientInfo.patientNo}
                </span>
              )}
              <span className="consent-sep" aria-hidden="true" />
              <span className="consent-patient-rrn">
                {(() => {
                  const rrnValue = patientInfo?.rrnView || "";
                  if (!rrnValue) return "";
                  if (rrnValue.includes("*")) return rrnValue;
                  return makeRrnView(rrnValue);
                })()}
              </span>
              <span className="consent-sep" aria-hidden="true" />
              <span className="consent-patient-room">
                {patientInfo?.facilityName || "진료실 없음"}
              </span>
            </div>
          </div>
          <div className="consent-list">
            {isConsentsLoading && (
              <div className="consent-empty">동의서 목록을 불러오는 중...</div>
            )}
            {!isConsentsLoading && consentItems.length === 0 && (
              <div className="consent-empty">등록된 동의서가 없습니다.</div>
            )}
            {consentItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="consent-item"
                onClick={() =>
                  router.push(
                    `/tablet/consent-form/patient/${patientId}/consent/${item.id}`
                  )
                }
              >
                <div className="consent-item-content">
                  <div className="consent-item-icon">
                    <img
                      className="consent-item-icon-image"
                      src="/icon/ic_consent_document_filled.svg"
                      alt="document"
                    />
                  </div>
                  <div className="consent-item-text">
                    <div className="consent-item-title">
                      {item.templateTitle}
                    </div>
                  </div>
                  <div className="consent-item-status">
                    <span className={`consent-item-status-text ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                <img
                  className="consent-item-arrow"
                  src="/icon/ic_line_arrow_right_small.svg"
                  alt=""
                  aria-hidden="true"
                />
                </div>
              </button>
            ))}
          </div>
          <div className="consent-list-footer">
            <div className="consent-list-footer-title">
              <img
                className="consent-list-footer-icon"
                src="/icon/ic_info_14.svg"
                alt=""
                aria-hidden="true"
              />
              <span>안내사항</span>
            </div>
            <div className="consent-list-footer-text">
              <span>모든 동의서에 서명을 완료해야 진료가 진행됩니다.</span>
              <span>각 동의서를 확인하시고 서명해주세요.</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .consent-slide-page {
          min-height: 100dvh;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e6e6e6;
          animation: slide-in 250ms ease-out;
          display: flex;
          flex-direction: column;
          padding: 0px 16px 0px;
          box-sizing: border-box;
          gap: 24px;
          overflow: auto;
          touch-action: pan-x pan-y;
        }
        .consent-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
          min-height: 62px;
        }
        .consent-title {
          display: flex;
          flex-direction: column;
          color: var(--Gray-100_171719, #171719);
          font-feature-settings: "case" on, "cpsp" on;
          font-family: "Pretendard", sans-serif;
          font-size: 22px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.22px;
          gap: 2px;
        }
        .consent-date {
          color: var(--Gray-400_70737C, #70737C);
          text-align: right;
          font-family: "Pretendard", sans-serif;
          font-size: 14px;
          font-style: normal;
          font-weight: 500;
          line-height: 125%;
          letter-spacing: -0.14px;
        }
        .consent-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .consent-patient-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .consent-patient-bar {
          display: flex;
          padding: 20px;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 12px;
          align-self: stretch;
          border-radius: 6px;
          border: 0 solid var(--Line-border-1_EAEBEC, #dbdcdf);
          background: var(--Supporting-Blue-1, #eaf2fe);
        }
        .consent-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }
        .consent-list-footer {
          display: flex;
          padding: 16px;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          align-self: stretch;
          border-radius: 6px;
          background: var(--Background-bg-1_F7F7F8, #f7f7f8);
        }
        .consent-list-footer-title {
          color: var(--Gray-300_46474C, #46474c);
          font-family: "Pretendard", sans-serif;
          font-size: 14px;
          font-style: normal;
          font-weight: 700;
          line-height: 125%;
          letter-spacing: -0.14px;
          display: flex;
          align-items: center;
          gap: 2px;
          align-self: stretch;
        }
        .consent-list-footer-icon {
          width: 14px;
          height: 14px;
          display: inline-block;
        }
        .consent-list-footer-text {
          color: var(--Gray-400_70737C, #70737C);
          font-family: "Pretendard", sans-serif;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 125%;
          letter-spacing: -0.14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-self: stretch;
        }
        .consent-item {
          box-sizing: border-box;
          width: 100%;
          height: 65.45px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 20px;
          text-align: left;
        }
        .consent-item-content {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          width: 100%;
          height: 36.85px;
        }
        .consent-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .consent-item-icon-image {
          width: 24px;
          height: 24px;
          display: block;
        }
        .consent-item-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          flex: 1;
        }
        .consent-item-title {
          color: var(--Gray-200_292A2D, #292a2d);
          font-feature-settings: "case" on, "cpsp" on;
          font-family: "Pretendard", sans-serif;
          font-size: 18px;
          font-style: normal;
          font-weight: 600;
          line-height: 140%;
          letter-spacing: -0.18px;
        }
        .consent-item-status {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 4.4px;
        }
        .consent-item-status-text {
          font-family: "Pretendard", sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 12px;
          line-height: 125%;
          letter-spacing: -0.12px;
          text-align: center;
          display: inline-flex;
          padding: 2px 5px;
          justify-content: center;
          align-items: center;
          gap: 2px;
          border-radius: 4px;
        }
        .consent-item-status-text.status-complete {
          color: var(--Supporting-Lime-2, #4ead0a);
          background: var(--Supporting-Lime-1, #edf8ef);
        }
        .consent-item-status-text.status-pending {
          color: var(--Supporting-Red-2, #ff6363);
          background: var(--Supporting-Red-1, #feecec);
        }
        .consent-item-status-text.status-default {
          color: var(--Gray-300_4E5054, #4e5054);
          background: var(--Background-bg-1_F7F7F8, #f7f7f8);
        }
        .consent-item-arrow {
          width: 8px;
          height: 14px;
          display: block;
          margin-left: auto;
        }
        .consent-patient-row {
          display: flex;
          align-items: center;
          gap: 8px;
          align-self: stretch;
          transform: translateY(1.5px)
        }
        .consent-patient-name {
          color: var(--Gray-200_292A2D, #292a2d);
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.16px;
        }
        .consent-patient-rrn {
          color: var(--Gray-200_292A2D, #292a2d);
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.16px;
        }
        .consent-patient-room {
          color: var(--Gray-200_292A2D, #292a2d);
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.16px;
        }
        .consent-patient-chart {
          color: var(--Gray-100_171719, #171719);
          text-align: center;
          font-family: "Pretendard", sans-serif;
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: 125%;
          letter-spacing: -0.12px;
          display: inline-flex;
          padding: 2px 5px;
          justify-content: center;
          align-items: center;
          gap: 2px;
          border-radius: 4px;
          background: var(--Background-bg-3_EAEBEC, #eaebec);
        }
        .consent-sep {
          width: 1px;
          height: 12px;
          display: inline-block;
          background: var(--Line-border-2_DBDCDF, #c2c4c8);
        }
        .consent-empty {
          color: #6b7280;
          font-size: 16px;
        }
        @keyframes slide-in {
          from {
            transform: translateX(100%);
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
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}
