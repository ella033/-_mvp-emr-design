import DOMPurify from 'dompurify';
import { formatDate } from '@/lib/date-utils';
import { formatPhoneNumber, getAgeOrMonth } from '@/lib/patient-utils';
import { formatRrnNumber, getUdeptDetailToUdept } from '@/lib/common-utils';
import { 보험구분Label } from "@/constants/common/common-enum";
import { InputType } from '@/types/chart/order-types';
import { getPrescriptionDetailType, 처방상세구분 } from '@/types/master-data/item-type';
import { Patient } from '@/types/patient-types';
import { Encounter } from '@/types/chart/encounter-types';
import { MedicalRecordCopyData } from './types';

export function transformToMedicalRecordCopyData(params: {
  patient: Patient;
  encounters: Encounter[];
  hospitalInfo: any;
  doctors: any[];
}): MedicalRecordCopyData {
  const { patient, encounters, hospitalInfo, doctors } = params;

  const doctorsById = new Map<any, { id: any; name?: string }>();
  doctors.forEach((doctor) => {
    doctorsById.set(doctor.id, doctor);
  });

  const age = getAgeOrMonth(patient.birthDate);
  const genderText = patient.gender === 1 ? '남' : patient.gender === 2 ? '여' : '';
  const rrn = formatRrnNumber(patient.rrn);

  return {
    patient: {
      id: patient.id,
      chartNumber: String(patient.patientNo ?? ''),
      name: patient.name ?? '',
      rrn,
      age: age ? `${age}` : '',
      gender: genderText,
      phone: formatPhoneNumber(patient.phone1 ?? patient.phone2 ?? ''),
      address: `${patient.address1 ?? ''} ${patient.address2 ?? ''}`.trim(),
    },
    hospital: {
      name: hospitalInfo?.name ?? '',
      address: `${hospitalInfo?.address1 ?? ''} ${hospitalInfo?.address2 ?? ''}`.trim(),
      phone: hospitalInfo?.phone ?? '',
    },
    encounters: encounters.map((encounter) => {
      const dateTime = new Date(String(encounter?.encounterDateTime ?? ''));
      const isValidDate = !Number.isNaN(dateTime.getTime());
      const visitDate = isValidDate ? formatDate(encounter?.encounterDateTime, '-') : '';
      const visitTime = isValidDate ? dateTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      const doctorName = doctorsById.get(encounter?.doctorId)?.name ?? '';

      const diagnoses = ((encounter?.diseases ?? []) as any[]).map((disease, idx) => ({
        code: String(disease?.code ?? ''),
        name: String(disease?.name ?? ''),
        isPrimary: idx === 0,
        isSecondary: idx > 0,
        isExcluded: false,
      }));

      const excludedInputTypes = [InputType.구분선, InputType.묶음헤더];
      const isActualPrescription = (order: any) =>
        !excludedInputTypes.includes(order?.inputType);

      const orders = ((encounter?.orders ?? []) as any[])
        .filter(isActualPrescription)
        .map((order) => ({
          claimCode: String(order?.claimCode ?? ''),
          name: String(order?.name ?? ''),
          dose: String(order?.dose ?? '-'),
          timesPerDay: String(order?.times ?? '-'),
          days: String(order?.days ?? '-'),
        }));

      const exams = ((encounter?.orders ?? []) as any[])
        .filter(isActualPrescription)
        .filter(order => getPrescriptionDetailType(order.itemType) === 처방상세구분.검사)
        .map((order) => {
          const firstSpecimen = order?.specimenDetail?.[0];
          return {
            claimCode: String(order?.claimCode ?? ''),
            name: String(order?.name ?? ''),
            referenceValue: String(firstSpecimen?.referenceRange ?? '-'),
            resultValue: String(firstSpecimen?.resultValue ?? '-'),
          };
        });

      const symptomText = (() => {
        const raw = encounter?.symptom;
        const hasSymptom = typeof raw === 'string' && raw.length > 0;
        if (!hasSymptom) return '';
        return DOMPurify.sanitize(raw);
      })();

      const encounterAny = encounter as any;
      const vitals = encounterAny?.vitals ?? {};
      const receptionType = encounter?.receptionType ?? encounter?.registration?.receptionType;
      const insuranceType = encounter?.registration?.insuranceType;

      return {
        encounterId: String(encounter.id),
        visitDate,
        visitTime,
        visitType: receptionType === 1 ? '초진' : '재진',
        // FIXME: 보험구분이 null인 경우 0(일반)으로 처리하고 있는데 동작 이상 없는지 확인 후 필요시 수정 필요
        insuranceType: 보험구분Label[getUdeptDetailToUdept(insuranceType ?? 0)],
        doctorName,
        department: encounterAny?.departmentName ?? '내과',
        diagnoses,
        orders,
        exams,
        symptomText,
        vitals: {
          systolicBp: String(vitals?.systolicBp ?? vitals?.sbp ?? '-'),
          diastolicBp: String(vitals?.diastolicBp ?? vitals?.dbp ?? '-'),
          pulse: String(vitals?.pulse ?? vitals?.pr ?? '-'),
          bloodSugar: String(vitals?.bloodSugar ?? vitals?.bs ?? '-'),
          weight: String(vitals?.weight ?? vitals?.wt ?? '-'),
          height: String(vitals?.height ?? vitals?.ht ?? '-'),
          bmi: String(vitals?.bmi ?? '-'),
          temperature: String(vitals?.temperature ?? vitals?.bt ?? '-'),
        },
      };
    }),
  };
}
