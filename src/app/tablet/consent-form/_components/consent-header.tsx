"use client";

import type { ReactNode } from "react";

interface ConsentHeaderProps {
  title?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export default function ConsentHeader({
  title = "동의서",
  showBack = true,
  backLabel = "<",
  onBack,
  rightSlot = null,
}: ConsentHeaderProps) {
  return (
    <div className="consent-header">
      <div className="consent-header-side">
        {showBack ? (
          <button type="button" className="consent-back" onClick={onBack}>
            <img
              className="consent-back-icon"
              src="/icon/ic_line_arrow_left.svg"
              alt={backLabel}
            />
          </button>
        ) : null}
      </div>
      <div className="consent-header-title">{title}</div>
      <div className="consent-header-side">{rightSlot}</div>
      <style jsx>{`
        .consent-header {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 56px;
          padding: 0 16px;
          box-sizing: border-box;
          width: 100%;
        }
        .consent-header-side {
          flex: 0 0 40px;
          display: flex;
          align-items: center;
        }
        .consent-back {
          display: flex;
          align-items: center;
          line-height: 1;
          background: transparent;
          color: #111827;
          border: none;
          border-radius: 6px;
          padding: 6px 4px;
          margin-left: -22px;
          font-size: 20px;
          cursor: pointer;
        }
        .consent-back-icon {
          display: block;
          width: 24px;
          height: 24px;
        }
        .consent-header-title {
          color: var(--Gray-100_171719, #171719);
          font-feature-settings: "case" on, "cpsp" on;
          font-family: "Pretendard", sans-serif;
          font-size: 20px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.2px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          flex: 1 0 0;
          text-align: center;
          pointer-events: none;
          transform: translateY(3px);
        }
      `}</style>
    </div>
  );
}
