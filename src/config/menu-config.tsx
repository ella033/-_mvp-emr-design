import React from "react";
import { FlaskConical, FileText } from "lucide-react";
import Image from "next/image";

export interface VisibilityContext {
  isOwnerOfCurrentHospital: boolean;
}

export interface SubMenuItem {
  title: string;
  url: string;
  visibleWhen?: (context: VisibilityContext) => boolean;
}

export interface MenuItem {
  title: string;
  url?: string;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  isActive?: boolean;
  visibleWhen?: (context: VisibilityContext) => boolean;
  subMenus?: SubMenuItem[];
  subject?: string;
  openInNewWindow?: boolean;
}

export const IconImage = (icon: string, rotate: boolean = false) => {
  return (
    <Image
      src={`/icon/menu/menu_icon_${icon}.svg`}
      alt={icon}
      width={20}
      height={20}
      className={`${rotate ? "rotate-180" : "rotate-0"} w-5 h-5`}
    />
  );
};

export const baseMenus: MenuItem[] = [
  {
    title: "접수",
    icon: IconImage("reception"),
    subject: "reception",
    subMenus: [
      {
        title: "접수/수납 현황",
        url: "/reception/management",
      },
      {
        title: "일별수납내역",
        url: "/reception/daily-receipt",
      },
      {
        title: "신용카드 수납내역",
        url: "/reception/credit-card-approval",
      },
      {
        title: "동의서 서명내역",
        url: "/reception/consent-list"
      }
    ],
  },
  {
    title: "진료",
    url: "/medical",
    icon: IconImage("medical"),
    subject: "medical",
  },
  {
    title: "수탁 검사",
    url: "/external-lab-orders",
    icon: IconImage("tests"),
    subject: "external-lab-orders",
  },
  {
    title: "예약",
    url: "/reservation",
    icon: IconImage("reservation"),
    subject: "reservation",
  },
  {
    title: "CRM",
    icon: IconImage("crm"),
    isActive: false,
    subject: "crm",
    subMenus: [
      {
        title: "수동 발송",
        url: "/crm/send",
      },
      {
        title: "자동 발송",
        url: "/crm/event-send",
      },
      {
        title: "템플릿",
        url: "/crm/template",
      },
      {
        title: "발송내역",
        url: "/crm/history",
      },
      {
        title: "요금내역",
        url: "/crm/cost",
      },
      {
        title: "설정",
        url: "/crm/settings",
      },
    ],
  },
  {
    title: "청구",
    url: "/claims",
    icon: IconImage("claims"),
    subject: "claims",
    subMenus: [
      {
        title: "청구 현황",
        url: "/claims",
      },
      {
        title: "치료재료대 신고",
        url: "/claims/material-report",
      },
      {
        title: "요양기관 자체 조제 · 제제약 내역서 작성 목록",
        url: "/claims/preparation-report",
      },
    ],
  },
  {
    title: "서식출력",
    url: "/document",
    icon: IconImage("document"),
    openInNewWindow: true,
  },
  {
    title: "기초자료",
    url: "/master-data",
    icon: IconImage("master-data"),
    subject: "master-data",
  },
  {
    title: "실험실",
    url: "/lab",
    icon: <FlaskConical className="w-5 h-5" />,
    subMenus: [
      {
        title: "서식 제작",
        url: "/field-editor",
      },
      {
        title: "서식 성능 테스트",
        url: "/pdf-perf-test",
      },
      {
        title: "환자 라벨 데모",
        url: "/patient-label-demo",
      },
      {
        title: "검사 라벨 데모",
        url: "/examination-label-demo",
      },
      {
        title: "진료기록부 데모",
        url: "/medical-record-demo",
      },
    ],
  },
  {
    title: "환경설정",
    icon: IconImage("settings"),
    isActive: false,
    subject: "settings",
    subMenus: [
      {
        title: "병원 정보",
        url: "/settings/hospital-info",
      },
      {
        title: "공간 정보",
        url: "/settings/space-info",
      },
      {
        title: "진료일 설정",
        url: "/settings/operating-days",
      },
      {
        title: "권한 관리",
        url: "/settings/permissions",
        // visibleWhen: (ctx: VisibilityContext) => ctx.isOwnerOfCurrentHospital,
      },
      {
        title: "사용자 관리",
        url: "/settings/users",
      },
      {
        title: "접속 기록",
        url: "/settings/access-logs",
      },
      {
        title: "IP 제한",
        url: "/settings/ip-restrictions",
        // visibleWhen: (ctx: VisibilityContext) => ctx.isOwnerOfCurrentHospital,
      },
      {
        title: "병원 인증서 관리",
        url: "/settings/hospital-certificates",
        // visibleWhen: (ctx: VisibilityContext) => ctx.isOwnerOfCurrentHospital,
      },
      {
        title: "프린터 설정",
        url: "/settings/printer",
      },
      {
        title: "검사 설정",
        url: "/settings/lab-management",
      },
      {
        title: "개인정보 관리",
        url: "/settings/personal-privacy",
      },
      {
        title: "연동 관리",
        url: "/settings/integrations",
      },
      {
        title: "환자 관리",
        url: "/settings/patient-management",
      },
      {
        title: "청구 설정",
        url: "/settings/claim-settings",
      },
      {
        title: "동의서 관리",
        url: "/settings/consent-management",
        visibleWhen: () => false,
      },
    ],
  },
];
