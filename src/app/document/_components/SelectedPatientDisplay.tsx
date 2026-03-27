'use client';

import type { Patient } from '@/types/patient-types';
import { getAgeOrMonth } from '@/lib/patient-utils';
import { formatRrnNumber } from '@/lib/common-utils';

interface SelectedPatientDisplayProps {
  patient: Patient | null;
}

export default function SelectedPatientDisplay({
  patient,
}: SelectedPatientDisplayProps) {
  if (!patient) {
    return (
      <div className="w-full px-[12px] py-[10px] bg-[#F7F7F8] rounded-[6px] mt-[20px]">
        <div className="text-m font-bold text-[#171719]">환자를 선택해주세요.</div>
      </div>
    );
  }

  return (
    <div className="w-full px-[12px] py-[10px] bg-[#F7F7F8] rounded-[6px] mt-[20px]">
      <div className="flex items-center gap-[4px]">
        <div className="text-sm font-bold text-gray-900">
          {patient.name}
        </div>
        <div className="text-xs font-bold text-[#46474C]">
          ({getAgeOrMonth(patient.birthDate || '', 'en')}&nbsp;{patient.gender === 1 ? '남' : '여'})
        </div>
        <div className="text-xs text-gray-500 px-[5px] py-[2px] bg-[#E4E5E8] rounded-[4px] font-bold">
          {patient.patientNo}
        </div>
        <div className="text-xs text-[#46474C] font-medium">
          {patient.rrn && `/ ${formatRrnNumber(patient.rrn)}`}
        </div>
      </div>
    </div>
  );
}

