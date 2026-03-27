// ============================ 리팩토링 필요 ============================

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, ReactNode } from "react";
import type { NewPatientForm } from "@/types/patient";
import type { PatientType } from "@/types/patient-types";
import { Gender } from "@/constants/patient";
import { usePatientStore } from "@/store/patient-store";
import {
  useHospitalQueueStore,
  useHospitalStore,
} from "@/store/hospital-store";
// import { useRegisterUser } from "@/hooks/patient/use-register-patient";

// 폼 초기값 상수 정의 (NewPatientForm 타입과 일치)
const INITIAL_FORM_STATE = {
  name: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  phone: "",
  zipcode: "",
  address: "",
  memo: "",
  familyName: "",
  familyPhone: "",
  gender: "" as Gender | "", // 타입 일치
  purpose: "",
  visitType: "",
  insurance: "",
  schedule: "",
  room: "",
  date: "",
  time: "",
  family: "",
  vitals: {},
};

// 재사용 가능한 Select + Label 컴포넌트
function LabeledSelect({
  label,
  placeholder,
  value,
  onValueChange,
  items,
  className = "",
  open,
  onOpenChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (v: string) => void;
  items: { value: string; label: string }[];
  className?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={placeholder}
            className={value ? "text-[#333]" : "text-[#999]"}
          />
        </SelectTrigger>
        <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-full">
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

const INSURANCE_LABELS = [
  { value: "none", label: "선택안함" },
  { value: "health", label: "건강보험" },
  { value: "private", label: "실손보험" },
];

// 환자 정보 매핑 함수
function mapFormToPatient(
  form: NewPatientForm,
  patientId: number | null,
  facilities: any[]
): PatientType {
  const roomLabel = facilities[Number(form.room)] || "선택안함";
  const insuranceLabel =
    INSURANCE_LABELS.find((i) => i.value === form.insurance)?.label || "";
  return {
    id: patientId ?? 10,
    name: form.name,
    residenceNum: patientId ?? 10,
    initial: false,
    tag: "단골",
    insurance: insuranceLabel,
    birth: `${form.birthYear}.${form.birthMonth}.${form.birthDay}`,
    gender: form.gender === "남자" ? "M" : "F",
    symptom: "",
    isInProgress: false,
    memo: "",
    room: roomLabel,
    status: undefined,
    doctor: undefined,
    address: form.address,
    phone: form.phone,
    hospital_id: undefined,
    guardians: undefined,
    histories: undefined,
  };
}

const mapPatientToForm = (patient: PatientType): NewPatientForm => {
  return {
    name: patient?.name || "",
    birthYear: patient?.birth.split(".")[0] || "",
    birthMonth: patient?.birth.split(".")[1] || "",
    birthDay: patient?.birth.split(".")[2] || "",
    phone: patient?.phone || "",
    zipcode: "",
    address: patient?.address || "",
    memo: patient?.memo || "",
    familyName: "",
    familyPhone: "",
    gender: patient?.gender as Gender | "", // 타입 일치
    purpose: "",
    visitType: "",
    insurance: patient?.insurance || "",
    schedule: "",
    room: patient?.room || "",
    date: "",
    time: "",
    family: "",
    vitals: {},
  };
};

// 환자 객체 생성 함수
// function createNewPatient(form: NewPatientForm): any {
//   const {
//     name,
//     birthYear,
//     birthMonth,
//     birthDay,
//     phone,
//     zipcode,
//     address,
//     memo,
//     gender,
//   } = form;
//   const now = new Date().toISOString();
//   return {
//     name,
//     rrn: "암호화된주민번호",
//     rrnView: `${birthYear}${birthMonth}${birthDay}-1`,
//     birthDate: `${birthYear}-${birthMonth}-${birthDay}T00:00:00.000Z`,
//     gender,
//     phone1: phone,
//     phone2: phone,
//     address1: address,
//     address2: "",
//     zipcode,
//     memo,
//     insuranceType: 1,
//     specialSymptom: "",
//     isForeigner: false,
//     passportNo: "",
//     visitRoute: "",
//     recommender: "",
//     doctor: "",
//     chronicDisease: "",
//     consent: true,
//     hospitalIds: [1, 2],
//     createUserId: 1,
//     updateUserId: 1,
//     createDateTime: now,
//     updateDateTime: now,
//     isDelete: false,
//     patientNo: `P${now}`,
//   };
// }

// 대기열 업데이트 함수
function updateHospitalQueueWithPatient(
  hospitalQueue: any,
  newPatientObj: PatientType,
  patientId: any,
  form: NewPatientForm
) {
  const newQueueItem = {
    patientId: patientId,
    queuedAt: new Date().toISOString(),
    queueId: `Q${String(patientId)}`,
    status: "waiting",
    symptom: String(newPatientObj.symptom) || "",
  };

  const facilities = hospitalQueue?.facilities || [];
  const facilityIdx = facilities.findIndex(
    (facility: any) =>
      String(facility.facility_id) === String(newPatientObj.room)
  );

  let updatedFacilities;
  if (facilityIdx !== -1) {
    updatedFacilities = facilities.map((facility: any) =>
      String(facility.facility_id) === String(newPatientObj.room)
        ? {
            ...facility,
            waitingQueue: [...(facility.waitingQueue || []), newQueueItem],
          }
        : facility
    );
  } else {
    updatedFacilities = [
      ...facilities.filter(
        (f: any) => String(f.facility_id) !== String(newPatientObj.room)
      ),
      {
        facility_id: form.room,
        facility_type: "진료실",
        waitingQueue: [newQueueItem],
      },
    ];
  }
  return {
    ...hospitalQueue,
    facilities: updatedFacilities,
  };
}

export default function PatientInfoForm({
  children,
  isRegister = false,
  isEdit = false,
  patientId,
}: {
  children: ReactNode;
  isRegister?: boolean;
  isEdit?: boolean;
  patientId?: number;
}) {
  const { patients, setPatients } = usePatientStore();
  const patient = patients.find((p) => p.id === patientId);
  const { hospital } = useHospitalStore();
  const { hospitalQueue, setHospitalQueue } = useHospitalQueueStore();
  const [form, setForm] = useState<NewPatientForm>(INITIAL_FORM_STATE);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const vitalFields = [
    { key: "BT", label: "BT" },
    { key: "BW", label: "BW" },
    { key: "BP1", label: "BP1" },
    { key: "BP2", label: "BP2" },
    { key: "PR", label: "PR" },
    { key: "BH", label: "BH" },
    { key: "BMI", label: "BMI" },
    { key: "BW2", label: "BW" }, // 마지막 BW는 BW2로 구분
  ];

  // const { mutate: registerPatientApi } = useRegisterUser({
  //   onSuccess: () => {
  //     console.log("등록 성공");
  //   },
  //   onError: () => {
  //     console.error("등록 실패");
  //   },
  // });

  const handleRegister = () => {
    try {
      // const newPatient = createNewPatient(form);
      // const data = registerPatientApi(newPatient);
      // const newPatientObj = mapFormToPatient(form, data, hospital?.facilities);
      const newPatientObj = mapFormToPatient(form, null, hospital?.facilities);
      console.log("환자정보", newPatientObj);
      setPatients([...patients, newPatientObj]);

      if (newPatientObj.room && newPatientObj.room !== "선택안함") {
        const updatedQueue = updateHospitalQueueWithPatient(
          hospitalQueue,
          newPatientObj,
          10, // patientId
          form
        );
        setHospitalQueue(updatedQueue);
      } else {
        console.log("진료실이 선택되지 않아 대기열에 추가하지 않습니다.");
      }
      setOpen(false);
      setForm(INITIAL_FORM_STATE);
    } catch (err) {
      console.error("환자 등록 에러:", err);
    }
  };

  const handleEdit = () => {
    const newPatients = patients.map((p) =>
      p.id === patientId
        ? { ...mapFormToPatient(form, patientId, hospital?.facilities) }
        : { ...p }
    );
    setPatients(newPatients);

    const prevRoomLabel = hospitalQueue.facilities.find((f) =>
      f.waitingQueue.some((q) => q.patientId === patient?.id)
    )?.facility_id;
    const newRoomLabel = hospital.facilities[Number(form.room)];

    console.log("prev", prevRoomLabel);
    console.log("new", newRoomLabel);
    if (prevRoomLabel !== newRoomLabel) {
      const updatedFacilities = hospitalQueue.facilities.map(
        (facility: any) => {
          if (String(facility.facility_id) === String(prevRoomLabel)) {
            return {
              ...facility,
              waitingQueue: facility.waitingQueue.filter(
                (item: any) => item.patientId !== patientId
              ),
            };
          }
          return facility;
        }
      );

      // 새 진료실에 환자 추가
      const newQueueItem = {
        patientId: patientId,
        queuedAt: new Date().toISOString(),
        queueId: `Q${String(patientId)}`,
        status: "waiting",
        symptom: String(form?.purpose) || "",
      };

      const finalFacilities = updatedFacilities.map((facility: any) => {
        if (String(facility.facility_id) === String(newRoomLabel)) {
          return {
            ...facility,
            waitingQueue: [...(facility.waitingQueue || []), newQueueItem],
          };
        }
        return facility;
      });

      console.log("final", finalFacilities);

      setHospitalQueue({
        ...hospitalQueue,
        facilities: finalFacilities,
      });
    }
    setOpen(false);
    setForm(INITIAL_FORM_STATE);
  };

  const handleOpenChange = (isOpen: boolean) => {
    console.log("patient", patient);
    if (isEdit && patient) {
      setForm(mapPatientToForm(patient));
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isEdit) {
      handleEdit();
    } else {
      handleRegister();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => handleOpenChange(isOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="p-0 overflow-hidden"
      >
        <form
          className="space-y-4 text-[0.75rem] overflow-y-auto max-h-[90vh] p-6"
          onSubmit={handleSubmit}
        >
          <DialogHeader>
            <DialogTitle className="font-bold text-[1rem]">
              신규환자 접수
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-2 text-[#999]">
            <div className="flex flex-col gap-1">
              <span>환자명</span>
              <Input
                name="환자명"
                placeholder="홍길동"
                required
                className="placeholder:text-[#999] text-[#333]"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                tabIndex={isEdit ? -1 : undefined}
              />
            </div>
            <div className="flex flex-col col-span-3 gap-1">
              <span>생년월일</span>
              <div className="grid grid-cols-3 gap-1">
                <Input
                  name="생년"
                  placeholder="YYYY"
                  required
                  className="placeholder:text-[#999] text-[#333]"
                  value={form.birthYear}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, birthYear: e.target.value }))
                  }
                  tabIndex={-1}
                />
                <Input
                  name="생월"
                  placeholder="MM"
                  required
                  className="placeholder:text-[#999] text-[#333]"
                  value={form.birthMonth}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, birthMonth: e.target.value }))
                  }
                  tabIndex={-1}
                />
                <Input
                  name="생일"
                  placeholder="DD"
                  required
                  className="placeholder:text-[#999] text-[#333]"
                  value={form.birthDay}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, birthDay: e.target.value }))
                  }
                  tabIndex={-1}
                />
              </div>
            </div>
            <LabeledSelect
              label="성별"
              placeholder="성별"
              value={form.gender}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, gender: value as Gender }))
              }
              items={[
                { value: Gender.None, label: "선택안함" },
                { value: Gender.Male, label: "남자" },
                { value: Gender.Female, label: "여자" },
              ]}
              open={openSelect === "gender"}
              onOpenChange={(open) => setOpenSelect(open ? "gender" : null)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[#999]">
            <div className="flex flex-col gap-1">
              <span>연락처</span>
              <div>
                <Input
                  name="연락처"
                  placeholder="010-0000-0000"
                  required
                  className="placeholder:text-[#999] text-[#333]"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  tabIndex={-1}
                />
              </div>
            </div>
            <LabeledSelect
              label="보험 여부"
              placeholder="보험 여부"
              value={form.insurance}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, insurance: value }))
              }
              items={[
                { value: "none", label: "선택안함" },
                { value: "health", label: "건강보험" },
                { value: "private", label: "실손보험" },
              ]}
              open={openSelect === "insurance"}
              onOpenChange={(open) => setOpenSelect(open ? "insurance" : null)}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-[#999]">
            <div className="flex flex-col gap-1">
              <span>우편번호</span>
              <Input
                name="우편번호"
                placeholder="368474"
                className="placeholder:text-[#999] text-[#333]"
                value={form.zipcode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, zipcode: e.target.value }))
                }
                tabIndex={-1}
              />
            </div>
            <div className="flex flex-col col-span-3 gap-1">
              <span>주소</span>
              <Input
                name="주소"
                placeholder="상세 주소까지 모두 입력"
                className="placeholder:text-[#999] text-[#333]"
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                tabIndex={-1}
              />
            </div>
          </div>
          <DialogHeader className="mt-6">
            <DialogTitle className="font-bold text-[1rem]">
              스케쥴 정보
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 text-[#999]">
            <LabeledSelect
              label="스케쥴"
              placeholder="스케쥴"
              value={form.schedule}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, schedule: value }))
              }
              items={[
                { value: "none", label: "선택안함" },
                { value: "예약", label: "예약" },
                { value: "당일", label: "당일" },
              ]}
              open={openSelect === "schedule"}
              onOpenChange={(open) => setOpenSelect(open ? "schedule" : null)}
            />
            <LabeledSelect
              label="진료실"
              placeholder="진료실"
              value={form.room}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, room: value }))
              }
              items={[
                { value: "none", label: "선택안함" },
                ...(hospital?.facilities ?? []).map((i: any, idx: number) => ({
                  value: String(idx),
                  label: i || "",
                })),
              ]}
              open={openSelect === "room"}
              onOpenChange={(open) => setOpenSelect(open ? "room" : null)}
            />
            <LabeledSelect
              label="진료날짜"
              placeholder="날짜"
              value={form.date}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, date: value }))
              }
              items={[
                { value: "none", label: "선택안함" },
                { value: "today", label: "오늘" },
                { value: "tomorrow", label: "내일" },
              ]}
              open={openSelect === "date"}
              onOpenChange={(open) => setOpenSelect(open ? "date" : null)}
            />
            <LabeledSelect
              label="진료시간"
              placeholder="시간"
              value={form.time}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, time: value }))
              }
              items={[
                { value: "none", label: "선택안함" },
                { value: "am", label: "오전" },
                { value: "pm", label: "오후" },
              ]}
              open={openSelect === "time"}
              onOpenChange={(open) => setOpenSelect(open ? "time" : null)}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-[#999]">
            <LabeledSelect
              label="방문목적"
              placeholder="방문목적"
              value={form.visitType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, visitType: value }))
              }
              items={[
                { value: "선택안함", label: "선택안함" },
                { value: "일반진료", label: "일반진료" },
                { value: "예약진료", label: "예약진료" },
              ]}
              open={openSelect === "visitType"}
              onOpenChange={(open) => setOpenSelect(open ? "visitType" : null)}
            />
            <div className="flex flex-col col-span-3 gap-1">
              <LabeledSelect
                label="세부목적"
                placeholder="세부목적을 선택해주세요"
                value={form.purpose}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, purpose: value }))
                }
                items={[
                  { value: "선택안함", label: "선택안함" },
                  { value: "진료", label: "진료" },
                  { value: "상담", label: "상담" },
                  { value: "검사", label: "검사" },
                ]}
                open={openSelect === "purpose"}
                onOpenChange={(open) => setOpenSelect(open ? "purpose" : null)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 text-[#999]">
            <span>예약메모</span>
            <textarea
              name="예약메모"
              placeholder="메모를 입력해주세요"
              className="w-full min-h-[60px] border border-[#EEEEEE] rounded-[4px] p-2 text-[12px] text-[#333] placeholder:text-[#DDDDDD] placeholder:text-[12px] placeholder:align-top resize-none focus:outline-none focus:ring-0"
              value={form.memo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, memo: e.target.value }))
              }
            />
          </div>
          <DialogHeader className="mt-6">
            <DialogTitle className="font-bold text-[1rem]">
              바이탈 정보
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-8 gap-2 text-[#999]">
            {vitalFields.map((field) => (
              <div key={field.key} className="flex flex-col items-center gap-1">
                <span>{field.label}</span>
                <Input
                  name={field.key}
                  className="text-[#333]"
                  value={form.vitals[field.key.replace("2", "")] || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      vitals: {
                        ...prev.vitals,
                        [field.key.replace("2", "")]: value,
                      },
                    }));
                  }}
                  tabIndex={-1}
                />
              </div>
            ))}
          </div>
          <DialogHeader className="mt-6">
            <DialogTitle className="font-bold text-[1rem]">
              가족 정보
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 text-[#999]">
            <LabeledSelect
              label="가족 선택"
              placeholder="가족"
              value={form.family}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, family: value }))
              }
              items={[
                { value: "none", label: "선택안함" },
                { value: "father", label: "아버지" },
                { value: "mother", label: "어머니" },
                { value: "child", label: "자녀" },
              ]}
              open={openSelect === "family"}
              onOpenChange={(open) => setOpenSelect(open ? "family" : null)}
            />
            <div className="flex flex-col gap-1">
              <span>가족명</span>
              <Input
                name="가족명"
                placeholder="가족명"
                className="placeholder:text-[#999] text-[#333]"
                value={form.familyName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, familyName: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>연락처</span>
              <Input
                name="연락처"
                placeholder="010-0000-0000"
                className="placeholder:text-[#999] text-[#333]"
                value={form.familyPhone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, familyPhone: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              {isEdit && (
                <Button
                  variant="outline"
                  className="text-[#999] cursor-pointer"
                  type="submit"
                >
                  수정
                </Button>
              )}
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="text-[#999] cursor-pointer"
                >
                  취소
                </Button>
              </DialogClose>
              {isRegister && (
                <Button
                  className="bg-[#FF6F2D] text-white cursor-pointer"
                  type="submit"
                >
                  완료
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
