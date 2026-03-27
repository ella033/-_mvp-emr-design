'use client';

import SearchBar from '@/components/search-bar';
import type { Patient } from '@/types/patient-types';

interface PatientSearchSectionProps {
  onPatientSelect: (patient: Patient) => void;
}

export default function PatientSearchSection({
  onPatientSelect,
}: PatientSearchSectionProps) {
  return (
    <div className="w-full">
      <SearchBar
        widthClassName="w-full"
        onPatientSelect={onPatientSelect}
        disableDefaultBehavior={true}
      />
    </div>
  );
}

