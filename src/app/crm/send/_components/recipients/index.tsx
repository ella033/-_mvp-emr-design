"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
// Recipients 컴포넌트에서 사용할 환자 타입 정의
export interface RecipientPatient {
  id: number;
  patientNo?: number | null;
  name: string;
  birthDate: string;
  gender: number;
  phone: string;
  lastEncounterDate: string | null;
}

// Recipients 컴포넌트의 ref 타입 정의
export interface RecipientsRef {
  addPatient: (patient: RecipientPatient) => void;
  setPatients: (patients: RecipientPatient[]) => void;
  getPatients: () => RecipientPatient[];
}

const formatAgeGender = (birthDate: string, gender: number): string => {
  const genderStr = gender === 1 ? "남" : gender === 2 ? "여" : "";

  if (!birthDate || birthDate.length < 4) return genderStr || "";

  const birthYear = parseInt(birthDate.substring(0, 4));
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  return genderStr ? `${age} ${genderStr}` : `${age}`;
};

const formatLastEncounterDate = (lastEncounterDate: string | null): string => {
  if (!lastEncounterDate) return "";
  return lastEncounterDate.substring(0, 10);
};

const Recipients = forwardRef<RecipientsRef>((_props, ref) => {
  const [patients, setPatients] = useState<RecipientPatient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);

  const headerCellStyle =
    "border-none text-sm font-medium text-[var(--gray-200)] align-middle";
  const columnCellStyle =
    "border-none text-sm font-normal text-[var(--gray-300)] align-middle";
  const tableRowStyle = "border-none hover:bg-transparent h-8";

  // 외부에서 호출할 수 있는 메서드들을 ref로 노출
  useImperativeHandle(ref, () => ({
    // 개별 환자 추가 (중복 체크)
    addPatient: (patient: RecipientPatient) => {
      setPatients((prev) => {
        const exists = prev.some((p) => p.id === patient.id);
        if (exists) {
          console.log("이미 추가된 환자입니다:", patient.name);
          return prev;
        }
        console.log("환자가 추가되었습니다:", patient.name);
        return [...prev, patient];
      });
    },
    // 전체 환자 리스트 설정
    setPatients: (newPatients: RecipientPatient[]) => {
      setPatients(newPatients);
      setSelectedPatients([]); // 선택 상태 초기화
      console.log(
        "전체 환자 리스트가 설정되었습니다:",
        newPatients.length,
        "명"
      );
    },
    // 현재 환자 리스트 반환
    getPatients: () => patients,
  }));

  const handlePatientSelect = (patientId: number, checked: boolean) => {
    if (checked) {
      setSelectedPatients((prev) => [...prev, patientId]);
    } else {
      setSelectedPatients((prev) => prev.filter((id) => id !== patientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(patients.map((patient) => patient.id));
    } else {
      setSelectedPatients([]);
    }
  };

  const handleDelete = () => {
    // 선택된 환자 제거
    setPatients((prev) =>
      prev.filter((patient) => !selectedPatients.includes(patient.id))
    );
    setSelectedPatients([]);
  };

  return (
    <div className="flex flex-col h-full" data-testid="crm-recipients-list">
      <div className="space-y-2 p-4 pb-2">
        <h2 className="text-base font-semibold">발송 대상</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--gray-200)]">
            총 <span className="font-bold">{patients.length}</span>명
          </p>
          <Button
            variant="outline"
            size="sm"
            data-testid="crm-recipients-delete-button"
            onClick={handleDelete}
            disabled={selectedPatients.length === 0}
            className="bg-white text-[var(--gray-100)] border-[var(--border-1)]"
          >
            삭제
          </Button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <Table className="border-separate border-spacing-0 w-full">
          <colgroup>
            <col style={{ width: "8%", minWidth: 40 }} />
            <col style={{ width: "16%", minWidth: 48 }} />
            <col style={{ width: "16%", minWidth: 56 }} />
            <col style={{ width: "14%", minWidth: 52 }} />
            <col style={{ width: "26%", minWidth: 110 }} />
            <col style={{ width: "20%", minWidth: 86 }} />
          </colgroup>
          <TableHeader className="bg-[var(--bg-2)] rounded-t-lg">
            <TableRow className={cn(tableRowStyle)}>
              <TableHead
                className={cn(
                  "text-center",
                  headerCellStyle,
                  "rounded-tl-lg"
                )}
              >
                <Checkbox
                  checked={
                    patients.length > 0 &&
                    selectedPatients.length === patients.length
                  }
                  onCheckedChange={handleSelectAll}
                  disabled={patients.length === 0}
                />
              </TableHead>
              <TableHead className={cn(headerCellStyle)}>환자명</TableHead>
              <TableHead className={cn(headerCellStyle, "text-center")}>
                차트번호
              </TableHead>
              <TableHead className={cn(headerCellStyle, "text-center")}>
                나이/성별
              </TableHead>
              <TableHead className={cn(headerCellStyle, "text-center")}>
                전화번호
              </TableHead>
              <TableHead
                className={cn(headerCellStyle, "text-center rounded-tr-lg")}
              >
                최근 내원일
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow className={cn(tableRowStyle)}>
                <TableCell
                  colSpan={6}
                  className={cn(
                    "text-center text-[var(--gray-500)] border-none align-middle"
                  )}
                  style={{ height: "500px" }}
                >
                  검색된 환자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} className={cn(tableRowStyle)}>
                  <TableCell
                    className={cn("text-center", columnCellStyle)}
                  >
                    <Checkbox
                      checked={selectedPatients.includes(patient.id)}
                      onCheckedChange={(checked) =>
                        handlePatientSelect(patient.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell
                    className={cn(
                      columnCellStyle,
                      "truncate overflow-hidden"
                    )}
                  >
                    {patient.name}
                  </TableCell>
                  <TableCell className={cn(columnCellStyle, "text-center")}>
                    {patient.patientNo}
                  </TableCell>
                  <TableCell className={cn(columnCellStyle, "text-center")}>
                    {formatAgeGender(patient.birthDate, patient.gender)}
                  </TableCell>
                  <TableCell className={cn(columnCellStyle, "text-center")}>
                    {patient.phone}
                  </TableCell>
                  <TableCell className={cn(columnCellStyle, "text-center")}>
                    {formatLastEncounterDate(patient.lastEncounterDate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

Recipients.displayName = "Recipients";

export default Recipients;
