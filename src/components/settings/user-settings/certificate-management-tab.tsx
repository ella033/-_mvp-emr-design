import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CertificateManagementTab() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h3 className="text-lg font-bold mb-6">인증서 관리</h3>

        <div className="space-y-8">
          <IssuanceSection />
          <CertificateListSection />
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function IssuanceSection() {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h4 className="font-bold text-base">인증서 신규 및 추가 발급</h4>
        <p className="text-sm text-muted-foreground">
          의무기록 전자서명을 위한 PIN 인증서를 발급 및 관리할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <IssuanceCard
          title="신규 인증서 발급"
          description="전자서명을 처음 사용하는 경우 신규 발급해주세요."
          buttonLabel="신규 발급하기"
        />
        <IssuanceCard
          title="추가 인증서 발급"
          description="현재 브라우저에 인증서를 추가로 발급해주세요."
          buttonLabel="추가 발급하기"
        />
      </div>
    </section>
  );
}

function IssuanceCard({
  title,
  description,
  buttonLabel,
}: {
  title: string;
  description: string;
  buttonLabel: string;
}) {
  return (
    <Card className="shadow-none border p-5 space-y-4">
      <div className="space-y-2">
        <h5 className="font-bold text-sm">{title}</h5>
        <p className="text-xs text-muted-foreground break-keep">
          {description}
        </p>
      </div>
      <Button className="w-fit h-9 text-sm px-4">{buttonLabel}</Button>
    </Card>
  );
}

function CertificateListSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-bold text-base">내 인증서 목록</h4>
          <p className="text-sm text-muted-foreground">
            인증서 만료일 전 갱신이 필요합니다.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs font-medium">
          모든 인증서 폐기
        </Button>
      </div>

      <Card className="shadow-none border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 space-y-5">
            <CertificateItem />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CertificateItem() {
  return (
    <>
      {/* Header: Name + Status */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">홍길동</span>
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-600 hover:bg-green-100 border-0 gap-1.5 px-2 py-0.5"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          정상
        </Badge>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <InfoItem label="발급일" value="2025-11-20" />
        <InfoItem
          label="만료일"
          value="2028-11-20"
          valueClassName="text-red-500"
        />
        <InfoItem label="남은 기간" value="365일" />
        <InfoItem label="저장 위치" value="현재 브라우저" />
      </div>

      <hr className="border-t border-border" />

      {/* Footer Actions */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8">
            갱신
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            삭제
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            비밀번호 변경
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          인증서 갱신 또는 삭제, 비밀번호 변경이 가능합니다.
        </span>
      </div>
    </>
  );
}

function InfoItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={`font-semibold ${valueClassName || ""}`}>{value}</div>
    </div>
  );
}
