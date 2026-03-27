"use client";

import { getAgeOrMonth, getGender } from "@/lib/patient-utils";

interface TabletConsentPatientCardProps {
  name: string;
  birthDate?: string | null;
  gender?: number | null;
  patientNo?: string | number | null;
  rrn?: string | null;
  facilityName?: string | null;
  showSelection?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  onPointerCancel?: () => void;
}

const formatMaskedRrn = (rrn: string | null | undefined) => {
  if (!rrn) return "";
  const digits = rrn.replace(/\D/g, "");
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6, 7)}******`;
};

export default function TabletConsentPatientCard({
  name,
  birthDate,
  gender,
  patientNo,
  rrn,
  facilityName,
  showSelection = false,
  selected = false,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
}: TabletConsentPatientCardProps) {
  const ageText = getAgeOrMonth(birthDate || "", "ko").replace("세", "");
  const genderText = getGender(gender, "ko");
  const ageGender =
    ageText || genderText ? `(${[ageText, genderText].filter(Boolean).join(" ")})` : "";

  const infoParts = [
    patientNo ? String(patientNo) : "",
    formatMaskedRrn(rrn),
    facilityName || "",
  ].filter(Boolean);
  const infoPartsWithType = infoParts.map((part, index) => {
    const type = index === 0 ? "patientNo" : index === 1 ? "rrn" : "facility";
    return { part, type };
  });

  return (
    <div
      className={`tablet-consent-patient-card${selected ? " selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="tablet-consent-patient-card-main">
        <span className="tablet-consent-patient-card-text">
          <span className="tablet-consent-patient-card-name">
            {name}
          </span>
          {ageGender && (
            <span className="tablet-consent-patient-card-age-gender">
              {` ${ageGender}`}
            </span>
          )}
          {infoPartsWithType.length > 0 && (
            <span className="tablet-consent-patient-card-info">
              {infoPartsWithType.map(({ part, type }, index) => (
                <span className="tablet-consent-patient-card-info-item" key={`${part}-${index}`}>
                  <span
                    className={
                      type === "patientNo"
                        ? "tablet-consent-patient-card-info-text patient-no"
                        : "tablet-consent-patient-card-info-text"
                    }
                  >
                    {part}
                  </span>
                  {index < infoPartsWithType.length - 1 && (
                    <span className="tablet-consent-patient-card-divider" aria-hidden="true" />
                  )}
                </span>
              ))}
            </span>
          )}
        </span>
        {showSelection ? (
          <img
            className="tablet-consent-patient-card-selection"
            src={selected ? "/icon/ic_checkbox_checked.svg" : "/icon/ic_checkbox_unchecked.svg"}
            alt=""
            aria-hidden="true"
          />
        ) : (
          <img
            className="tablet-consent-patient-card-arrow"
            src="/icon/ic_line_arrow_right_small.svg"
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
      <style jsx>{`
        .tablet-consent-patient-card {
          display: flex;
          padding: 20px;
          align-items: center;
          gap: 12px;
          align-self: stretch;
          border-radius: 6px;
          border: 1px solid var(--Line-border-1_EAEBEC, #dbdcdf);
          background: var(--Gray-White, #fff);
          cursor: pointer;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        .tablet-consent-patient-card.selected {
          border: 1px solid var(--Supporting-Violet-2, #6541f2);
          background: var(--Gray-White, #fff);
          box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.1);
        }
        .tablet-consent-patient-card-main {
          display: flex;
          align-items: center;
          gap: 8px;
          align-self: stretch;
          width: 100%;
        }
        .tablet-consent-patient-card-text {
          flex: 1 1 auto;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.16px;
          transform: translateY(1.5px);
        }
        .tablet-consent-patient-card-name {
          font-weight: 700;
          color: var(--Gray-200_292A2D, #292a2d);
        }
        .tablet-consent-patient-card-age-gender {
          margin-right: 8px;
          font-weight: 700;
          color: var(--Gray-200_292A2D, #292a2d);
        }
        .tablet-consent-patient-card-info {
          color: inherit;
          font-weight: inherit;
        }
        .tablet-consent-patient-card-info-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .tablet-consent-patient-card-info-text {
          color: inherit;
          font-weight: inherit;
        }
        .tablet-consent-patient-card-info-text.patient-no {
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
        .tablet-consent-patient-card-divider {
          width: 1px;
          height: 12px;
          display: inline-block;
          background: var(--Line-border-2_DBDCDF, #c2c4c8);
          margin-right: 8px;
        }
        .tablet-consent-patient-card-arrow {
          flex: 0 0 auto;
          width: 8px;
          height: 14px;
          display: block;
        }
        .tablet-consent-patient-card-selection {
          flex: 0 0 auto;
          width: 22px;
          height: 22px;
          display: block;
          border-radius: 4px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
