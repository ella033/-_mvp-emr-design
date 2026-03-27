import React, { useId } from "react";

export const LineBundleIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_bundle_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M4 6H8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.66602 3.33301H5.33268"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 3.33301V10.6663C4 10.8432 4.07024 11.0127 4.19526 11.1377C4.32029 11.2628 4.48986 11.333 4.66667 11.333H8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 5.33366C8 5.15685 8.07024 4.98728 8.19526 4.86225C8.32029 4.73723 8.48986 4.66699 8.66667 4.66699H12.6667C12.8435 4.66699 13.013 4.73723 13.1381 4.86225C13.2631 4.98728 13.3333 5.15685 13.3333 5.33366V6.66699C13.3333 6.8438 13.2631 7.01337 13.1381 7.1384C13.013 7.26342 12.8435 7.33366 12.6667 7.33366H8.66667C8.48986 7.33366 8.32029 7.26342 8.19526 7.1384C8.07024 7.01337 8 6.8438 8 6.66699V5.33366Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 10.6667C8 10.4899 8.07024 10.3203 8.19526 10.1953C8.32029 10.0702 8.48986 10 8.66667 10H12.6667C12.8435 10 13.013 10.0702 13.1381 10.1953C13.2631 10.3203 13.3333 10.4899 13.3333 10.6667V12C13.3333 12.1768 13.2631 12.3464 13.1381 12.4714C13.013 12.5964 12.8435 12.6667 12.6667 12.6667H8.66667C8.48986 12.6667 8.32029 12.5964 8.19526 12.4714C8.07024 12.3464 8 12.1768 8 12V10.6667Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 검사
export const LineExamIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_exam_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M6 3H10"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.66699 7H9.33366"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.6339 3V6.33333L3.99936 12.4444C3.96759 12.4984 3.95109 12.5578 3.95117 12.618C3.95126 12.6782 3.96792 12.7376 3.99985 12.7915C4.03177 12.8453 4.07809 12.8922 4.13516 12.9284C4.19222 12.9646 4.25847 12.9891 4.32868 13H11.5737C11.6439 12.9891 11.7101 12.9646 11.7672 12.9284C11.8243 12.8922 11.8706 12.8453 11.9025 12.7915C11.9344 12.7376 11.9511 12.6782 11.9512 12.618C11.9513 12.5578 11.9348 12.4984 11.903 12.4444L9.26844 6.33333V3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 물리치료
export const LinePhysicalTherapyIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_physical_therapy_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5.99967 10.0003L5.33301 8.00033L7.99967 6.66699L10.6663 7.33366H12.9997"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 13C2 13.2652 2.10536 13.5196 2.29289 13.7071C2.48043 13.8946 2.73478 14 3 14C3.26522 14 3.51957 13.8946 3.70711 13.7071C3.89464 13.5196 4 13.2652 4 13C4 12.7348 3.89464 12.4804 3.70711 12.2929C3.51957 12.1054 3.26522 12 3 12C2.73478 12 2.48043 12.1054 2.29289 12.2929C2.10536 12.4804 2 12.7348 2 13Z"
          fill="currentColor"
        />
        <path
          d="M7.33301 4.33301C7.33301 4.59822 7.43836 4.85258 7.6259 5.04011C7.81344 5.22765 8.06779 5.33301 8.33301 5.33301C8.59822 5.33301 8.85258 5.22765 9.04011 5.04011C9.22765 4.85258 9.33301 4.59822 9.33301 4.33301C9.33301 4.06779 9.22765 3.81344 9.04011 3.6259C8.85258 3.43836 8.59822 3.33301 8.33301 3.33301C8.06779 3.33301 7.81344 3.43836 7.6259 3.6259C7.43836 3.81344 7.33301 4.06779 7.33301 4.33301Z"
          fill="currentColor"
        />
        <path
          d="M8 11.3337V6.66699"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.33301 13.333H9.99967L10.6663 10.6663L13.333 9.33301"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 13.333H14"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 방사선
export const LineRadiationIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.00039 11.6004C9.98862 11.6004 11.6004 9.98862 11.6004 8.00039C11.6004 6.01217 9.98862 4.40039 8.00039 4.40039C6.01217 4.40039 4.40039 6.01217 4.40039 8.00039C4.40039 9.98862 6.01217 11.6004 8.00039 11.6004Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.9998 9.20078C8.66255 9.20078 9.1998 8.66352 9.1998 8.00078C9.1998 7.33804 8.66255 6.80078 7.9998 6.80078C7.33706 6.80078 6.7998 7.33804 6.7998 8.00078C6.7998 8.66352 7.33706 9.20078 7.9998 9.20078Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 상병
export const LineDiseaseIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M9.7998 6.19922H9.1998C9.1998 6.53059 9.46843 6.79922 9.7998 6.79922V6.19922ZM12.5 6.19922H13.1C13.1 5.86785 12.8314 5.59922 12.5 5.59922V6.19922ZM12.5 9.79883V10.3988C12.8314 10.3988 13.1 10.1302 13.1 9.79883H12.5ZM9.7998 9.79883V9.19883C9.46843 9.19883 9.1998 9.46746 9.1998 9.79883H9.7998ZM9.7998 12.5V13.1C10.1312 13.1 10.3998 12.8314 10.3998 12.5H9.7998ZM6.2002 12.5H5.6002C5.6002 12.8314 5.86882 13.1 6.2002 13.1V12.5ZM6.2002 9.79883H6.8002C6.8002 9.46746 6.53157 9.19883 6.2002 9.19883V9.79883ZM3.5 9.79883H2.9C2.9 10.1302 3.16863 10.3988 3.5 10.3988V9.79883ZM3.5 6.19922V5.59922C3.16863 5.59922 2.9 5.86785 2.9 6.19922H3.5ZM6.2002 6.19922V6.79922C6.53157 6.79922 6.8002 6.53059 6.8002 6.19922H6.2002ZM6.2002 3.5V2.9C5.86882 2.9 5.6002 3.16863 5.6002 3.5H6.2002ZM9.7998 3.5H10.3998C10.3998 3.16863 10.1312 2.9 9.7998 2.9V3.5ZM9.7998 6.19922V6.79922H12.5V6.19922V5.59922H9.7998V6.19922ZM12.5 6.19922H11.9V9.79883H12.5H13.1V6.19922H12.5ZM12.5 9.79883V9.19883H9.7998V9.79883V10.3988H12.5V9.79883ZM9.7998 9.79883H9.1998V12.5H9.7998H10.3998V9.79883H9.7998ZM9.7998 12.5V11.9H6.2002V12.5V13.1H9.7998V12.5ZM6.2002 12.5H6.8002V9.79883H6.2002H5.6002V12.5H6.2002ZM6.2002 9.79883V9.19883H3.5V9.79883V10.3988H6.2002V9.79883ZM3.5 9.79883H4.1V6.19922H3.5H2.9V9.79883H3.5ZM3.5 6.19922V6.79922H6.2002V6.19922V5.59922H3.5V6.19922ZM6.2002 6.19922H6.8002V3.5H6.2002H5.6002V6.19922H6.2002ZM6.2002 3.5V4.1H9.7998V3.5V2.9H6.2002V3.5ZM9.7998 3.5H9.1998V6.19922H9.7998H10.3998V3.5H9.7998Z"
      fill="currentColor"
    />
  </svg>
);

//증상
export const LineSymptomIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="11"
    height="12"
    viewBox="0 0 11 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M3.78571 2H2.64286C2.33975 2 2.04906 2.11853 1.83474 2.3295C1.62041 2.54048 1.5 2.82663 1.5 3.125V9.875C1.5 10.1734 1.62041 10.4595 1.83474 10.6705C2.04906 10.8815 2.33975 11 2.64286 11H8.35714C8.66025 11 8.95094 10.8815 9.16527 10.6705C9.37959 10.4595 9.5 10.1734 9.5 9.875V3.125C9.5 2.82663 9.37959 2.54048 9.16527 2.3295C8.95094 2.11853 8.66025 2 8.35714 2H7.21429"
      stroke="#46474C"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.72217 2.1111C3.72217 1.81642 3.83923 1.5338 4.0476 1.32543C4.25597 1.11706 4.53858 1 4.83326 1H5.94436C6.23904 1 6.52165 1.11706 6.73002 1.32543C6.93839 1.5338 7.05546 1.81642 7.05546 2.1111C7.05546 2.40578 6.93839 2.68839 6.73002 2.89676C6.52165 3.10513 6.23904 3.22219 5.94436 3.22219H4.83326C4.53858 3.22219 4.25597 3.10513 4.0476 2.89676C3.83923 2.68839 3.72217 2.40578 3.72217 2.1111Z"
      stroke="#46474C"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 8.1111L5.05555 8.66664L6.72219 7"
      stroke="#46474C"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 약
export const LineMedicineIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_medicine_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M3.80994 8.27934L8.27934 3.80994C8.79793 3.29134 9.5013 3 10.2347 3C10.9681 3 11.6715 3.29134 12.1901 3.80994C12.7087 4.32853 13 5.0319 13 5.7653C13 6.4987 12.7087 7.20207 12.1901 7.72066L7.72066 12.1901C7.20207 12.7087 6.4987 13 5.7653 13C5.0319 13 4.32853 12.7087 3.80994 12.1901C3.29134 11.6715 3 10.9681 3 10.2347C3 9.5013 3.29134 8.79793 3.80994 8.27934Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 6.57031L9.91435 9.98466"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 주사
export const LineInjectionIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_injection_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M11.0557 2.5L13.5001 4.94444"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.2773 3.72266L9.52734 6.47266"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.69434 4.63867L11.361 8.30534"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.7497 7.69444L6.77745 11.6667H4.33301V9.22222L8.30522 5.25"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.25 8.30566L6.16667 9.22233"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.08301 6.47266L7.99967 7.38932"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.5 13.5003L4.33333 11.667"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 지시오더
export const LineGeoOrderIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="14"
    height="13"
    viewBox="0 0 14 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M0.599609 11.6L1.4656 8.92225C0.717148 7.78132 0.446391 6.4302 0.703674 5.12009C0.960957 3.80999 1.72877 2.63007 2.86436 1.7997C3.99995 0.969331 5.42603 0.545029 6.87745 0.605685C8.32888 0.66634 9.70687 1.20783 10.7552 2.12946C11.8036 3.0511 12.451 4.29016 12.577 5.61629C12.703 6.94241 12.2991 8.26534 11.4404 9.3391C10.5817 10.4129 9.32659 11.1644 7.90845 11.454C6.49031 11.7435 5.00565 11.5514 3.73051 10.9134L0.599609 11.6Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.4082 7.00121L6.09348 5.87769L7.217 7.00121L8.90228 5.87769"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 처치
export const LineTreatmentIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_treatment_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5 4H4.5C4.23478 4 3.98043 4.10536 3.79289 4.29289C3.60536 4.48043 3.5 4.73478 3.5 5V6.75C3.5 7.47935 3.78973 8.17882 4.30546 8.69454C4.82118 9.21027 5.52066 9.5 6.25001 9.5C6.97935 9.5 7.67883 9.21027 8.19455 8.69454C8.71028 8.17882 9.00001 7.47935 9.00001 6.75V5C9.00001 4.73478 8.89465 4.48043 8.70712 4.29289C8.51958 4.10536 8.26523 4 8.00001 4H7.50001"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 9.5C6 9.89397 6.0776 10.2841 6.22836 10.6481C6.37913 11.012 6.60011 11.3427 6.87868 11.6213C7.15726 11.8999 7.48798 12.1209 7.85195 12.2716C8.21593 12.4224 8.60604 12.5 9.00001 12.5C9.39397 12.5 9.78408 12.4224 10.1481 12.2716C10.512 12.1209 10.8428 11.8999 11.1213 11.6213C11.3999 11.3427 11.6209 11.012 11.7716 10.6481C11.9224 10.2841 12 9.89397 12 9.5V8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 3.5V4.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 3.5V4.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 7C11 7.26522 11.1054 7.51957 11.2929 7.70711C11.4804 7.89464 11.7348 8 12 8C12.2652 8 12.5196 7.89464 12.7071 7.70711C12.8946 7.51957 13 7.26522 13 7C13 6.73478 12.8946 6.48043 12.7071 6.29289C12.5196 6.10536 12.2652 6 12 6C11.7348 6 11.4804 6.10536 11.2929 6.29289C11.1054 6.48043 11 6.73478 11 7Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 치료재료
export const LineTreatmentMaterialIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_treatment_material_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5.33301 4.86699V3.76699C5.33301 3.47525 5.47348 3.19546 5.72353 2.98917C5.97358 2.78288 6.31272 2.66699 6.66634 2.66699H9.33301C9.68663 2.66699 10.0258 2.78288 10.2758 2.98917C10.5259 3.19546 10.6663 3.47525 10.6663 3.76699V4.86699"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 6.33333C3 5.97971 3.1317 5.64057 3.36612 5.39052C3.60054 5.14048 3.91848 5 4.25 5H11.75C12.0815 5 12.3995 5.14048 12.6339 5.39052C12.8683 5.64057 13 5.97971 13 6.33333V11.6667C13 12.0203 12.8683 12.3594 12.6339 12.6095C12.3995 12.8595 12.0815 13 11.75 13H4.25C3.91848 13 3.60054 12.8595 3.36612 12.6095C3.1317 12.3594 3 12.0203 3 11.6667V6.33333Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 9H9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 8V10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 카테고리
export const LineCategoryIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_category_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M3.33333 2.66699H6L8 4.66699H12.6667C13.0203 4.66699 13.3594 4.80747 13.6095 5.05752C13.8595 5.30756 14 5.6467 14 6.00033V11.3337C14 11.6873 13.8595 12.0264 13.6095 12.2765C13.3594 12.5265 13.0203 12.667 12.6667 12.667H3.33333C2.97971 12.667 2.64057 12.5265 2.39052 12.2765C2.14048 12.0264 2 11.6873 2 11.3337V4.00033C2 3.6467 2.14048 3.30756 2.39052 3.05752C2.64057 2.80747 2.97971 2.66699 3.33333 2.66699Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const TreeVerticalLineIcon = ({
  width = 12,
  height = 38,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { width?: number; height?: number }) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d={`M${width / 2} 0V${height}`}
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
  </svg>
);

export const TreeChildLineIcon = ({
  width = 12,
  height = 38,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { width?: number; height?: number }) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d={`M${width / 2} 0V${height}`}
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
    <path
      d={`M${width / 2} ${height / 2}H${width}`}
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
  </svg>
);

export const TreeLastChildLineIcon = ({
  width = 12,
  height = 38,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { width?: number; height?: number }) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d={`M${width / 2} 0V${height / 2}`}
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
    <path
      d={`M${width / 2} ${height / 2}H${width}`}
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
  </svg>
);

export const MoneyIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_money_${id}`;
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M14.3333 8C14.3333 11.4978 11.4978 14.3333 7.99996 14.3333C4.50216 14.3333 1.66663 11.4978 1.66663 8C1.66663 4.50219 4.50216 1.66666 7.99996 1.66666C11.4978 1.66666 14.3333 4.50219 14.3333 8Z"
          stroke="#70737C"
          strokeWidth="1.2"
          strokeMiterlimit="10"
        />
      </g>
      <path
        d="M4.5 7.57356H6.16667H7.83333H9.5H11.1667"
        stroke="#70737C"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M5.16663 5.5L6.5952 10.5L8.02377 5.5L9.45234 10.5L10.8809 5.5"
        stroke="#70737C"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <clipPath id={clipId}>
          <rect
            width="14"
            height="14"
            fill="white"
            transform="translate(1 1)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CloseMenuIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M10.8333 12.5L8.33333 10L10.8333 7.5M10 2.5C16 2.5 17.5 4 17.5 10C17.5 16 16 17.5 10 17.5C4 17.5 2.5 16 2.5 10C2.5 4 4 2.5 10 2.5Z"
      stroke="#70737C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const RepeatIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_repeat_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M4 8V6.33333C4 5.89131 4.17559 5.46738 4.48816 5.15482C4.80072 4.84226 5.22464 4.66667 5.66667 4.66667H12.8889M12.8889 4.66667L11.2222 3M12.8889 4.66667L11.2222 6.33333"
          stroke="#D478FF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.8889 8V9.66667C12.8889 10.1087 12.7133 10.5326 12.4007 10.8452C12.0882 11.1577 11.6643 11.3333 11.2222 11.3333H4M4 11.3333L5.66667 13M4 11.3333L5.66667 9.66667"
          stroke="#D478FF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const ExpandAllIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_expand_all_${id}`;
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M6.15441 9.30882H3.50735C3.27334 9.30882 3.04891 9.21586 2.88344 9.05039C2.71796 8.88491 2.625 8.66049 2.625 8.42647V3.13235C2.625 2.89834 2.71796 2.67391 2.88344 2.50844C3.04891 2.34296 3.27334 2.25 3.50735 2.25H7.03676"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.80151 2.25V9.75"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.47791 8.42593L8.80143 9.74946L10.125 8.42593"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CollapseAllIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_collapse_all_${id}`;
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M6.1543 2.6911H3.50733C3.27332 2.6911 3.0489 2.78406 2.88343 2.94954C2.71796 3.11501 2.625 3.33944 2.625 3.57345V8.86757C2.625 9.10159 2.71796 9.32602 2.88343 9.49149C3.0489 9.65696 3.27332 9.74992 3.50733 9.74992H7.03663"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.80127 9.75V2.25"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.47778 3.57353L8.80127 2.25L10.1248 3.57353"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const DispensingNotePlusIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_dispensing_note_plus_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5.77783 5.78125H10.2223"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.77783 8H9.11117"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.27778 12.1667L8 12.4444L6.33333 10.7778H4.66667C4.22464 10.7778 3.80072 10.6022 3.48816 10.2896C3.17559 9.97706 3 9.55314 3 9.11111V4.66667C3 4.22464 3.17559 3.80072 3.48816 3.48816C3.80072 3.17559 4.22464 3 4.66667 3H11.3333C11.7754 3 12.1993 3.17559 12.5118 3.48816C12.8244 3.80072 13 4.22464 13 4.66667V7.72222"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.2222 11.3359H13.5555"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.8889 9.66406V12.9974"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const DispensingNoteCheckIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_dispensing_note_check_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5.93335 5.60156H10.6267"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.93335 7.96094H9.45335"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.27999 12.6641L7.69333 12.0758L6.52 10.8994H4.76C4.29322 10.8994 3.84556 10.7134 3.51549 10.3825C3.18543 10.0515 3 9.60268 3 9.13465V4.42877C3 3.96074 3.18543 3.51188 3.51549 3.18093C3.84556 2.84999 4.29322 2.66406 4.76 2.66406H11.8C12.2668 2.66406 12.7144 2.84999 13.0445 3.18093C13.3746 3.51188 13.56 3.96074 13.56 4.42877V7.95818"
          stroke="#46474C"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.04 11.489L11.2134 12.6654L13.56 10.3125"
          stroke="#0066FF"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const ClockIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M10.0645 5.61996C10.1216 4.66124 9.88593 3.7078 9.38873 2.8861C8.89153 2.0644 8.1563 1.41325 7.28054 1.01902C6.40478 0.624782 5.42986 0.506085 4.48509 0.678668C3.54032 0.851251 2.67033 1.30696 1.9905 1.98536C1.31067 2.66376 0.853125 3.53279 0.678535 4.47721C0.503946 5.42163 0.620565 6.39681 1.01293 7.27342C1.40529 8.15004 2.05486 8.88667 2.87549 9.38563C3.69611 9.88458 4.64902 10.1223 5.60785 10.0672"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.44141 9.02344H10.5992"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.01953 7.44531V10.6031"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.33594 2.70703V5.33854L6.91481 6.91745"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PatientExceptionIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="14"
    viewBox="0 0 12 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M0 10.6667V8.8C0 8.42222 0.0972222 8.075 0.291667 7.75833C0.486111 7.44167 0.744444 7.2 1.06667 7.03333C1.75556 6.68889 2.45556 6.43056 3.16667 6.25833C3.87778 6.08611 4.6 6 5.33333 6C5.55556 6 5.77778 6.00833 6 6.025C6.22222 6.04167 6.44444 6.06667 6.66667 6.1V7.45C6.44444 7.40556 6.22222 7.375 6 7.35833C5.77778 7.34167 5.55556 7.33333 5.33333 7.33333C4.71111 7.33333 4.09444 7.40833 3.48333 7.55833C2.87222 7.70833 2.26667 7.93333 1.66667 8.23333C1.56667 8.28889 1.48611 8.36667 1.425 8.46667C1.36389 8.56667 1.33333 8.67778 1.33333 8.8V9.33333H6.66667V10.6667H0ZM5.33333 5.33333C4.6 5.33333 3.97222 5.07222 3.45 4.55C2.92778 4.02778 2.66667 3.4 2.66667 2.66667C2.66667 1.93333 2.92778 1.30556 3.45 0.783333C3.97222 0.261111 4.6 0 5.33333 0C6.06667 0 6.69444 0.261111 7.21667 0.783333C7.73889 1.30556 8 1.93333 8 2.66667C8 3.4 7.73889 4.02778 7.21667 4.55C6.69444 5.07222 6.06667 5.33333 5.33333 5.33333ZM5.33333 4C5.7 4 6.01389 3.86944 6.275 3.60833C6.53611 3.34722 6.66667 3.03333 6.66667 2.66667C6.66667 2.3 6.53611 1.98611 6.275 1.725C6.01389 1.46389 5.7 1.33333 5.33333 1.33333C4.96667 1.33333 4.65278 1.46389 4.39167 1.725C4.13056 1.98611 4 2.3 4 2.66667C4 3.03333 4.13056 3.34722 4.39167 3.60833C4.65278 3.86944 4.96667 4 5.33333 4ZM9.33333 13.3333V10H8V6H12L10.6667 8.66667H12L9.33333 13.3333Z"
      fill="currentColor"
    />
  </svg>
);

export const FilterIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M11 7.99976H5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 4.99976H3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 10.9998H6"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SettingIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_setting_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M7.9998 9.20078C8.66255 9.20078 9.1998 8.66352 9.1998 8.00078C9.1998 7.33804 8.66255 6.80078 7.9998 6.80078C7.33706 6.80078 6.7998 7.33804 6.7998 8.00078C6.7998 8.66352 7.33706 9.20078 7.9998 9.20078Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.0364 9.63636C11.9638 9.80088 11.9421 9.98338 11.9742 10.1603C12.0063 10.3373 12.0906 10.5005 12.2164 10.6291L12.2491 10.6618C12.3505 10.7631 12.431 10.8834 12.4859 11.0159C12.5408 11.1483 12.569 11.2903 12.569 11.4336C12.569 11.577 12.5408 11.719 12.4859 11.8514C12.431 11.9838 12.3505 12.1041 12.2491 12.2055C12.1478 12.3069 12.0275 12.3873 11.895 12.4422C11.7626 12.4971 11.6206 12.5254 11.4773 12.5254C11.3339 12.5254 11.192 12.4971 11.0595 12.4422C10.9271 12.3873 10.8068 12.3069 10.7055 12.2055L10.6727 12.1727C10.5442 12.047 10.3809 11.9626 10.204 11.9305C10.027 11.8985 9.84452 11.9201 9.68 11.9927C9.51867 12.0619 9.38108 12.1767 9.28417 12.323C9.18725 12.4694 9.13525 12.6408 9.13455 12.8164V12.9091C9.13455 13.1984 9.01961 13.4759 8.81503 13.6805C8.61044 13.8851 8.33296 14 8.04364 14C7.75431 14 7.47683 13.8851 7.27225 13.6805C7.06766 13.4759 6.95273 13.1984 6.95273 12.9091V12.86C6.9485 12.6795 6.89006 12.5044 6.78501 12.3575C6.67995 12.2106 6.53313 12.0987 6.36364 12.0364C6.19912 11.9638 6.01662 11.9421 5.83968 11.9742C5.66274 12.0063 5.49946 12.0906 5.37091 12.2164L5.33818 12.2491C5.23687 12.3505 5.11655 12.431 4.98412 12.4859C4.85168 12.5408 4.70973 12.569 4.56636 12.569C4.423 12.569 4.28104 12.5408 4.14861 12.4859C4.01618 12.431 3.89586 12.3505 3.79455 12.2491C3.69312 12.1478 3.61265 12.0275 3.55775 11.895C3.50285 11.7626 3.4746 11.6206 3.4746 11.4773C3.4746 11.3339 3.50285 11.192 3.55775 11.0595C3.61265 10.9271 3.69312 10.8068 3.79455 10.7055L3.82727 10.6727C3.95302 10.5442 4.03737 10.3809 4.06946 10.204C4.10154 10.027 4.07988 9.84452 4.00727 9.68C3.93813 9.51867 3.82332 9.38108 3.67698 9.28417C3.53064 9.18725 3.35916 9.13525 3.18364 9.13455H3.09091C2.80158 9.13455 2.52411 9.01961 2.31952 8.81503C2.11493 8.61044 2 8.33296 2 8.04364C2 7.75431 2.11493 7.47683 2.31952 7.27225C2.52411 7.06766 2.80158 6.95273 3.09091 6.95273H3.14C3.32054 6.9485 3.49564 6.89006 3.64253 6.78501C3.78941 6.67995 3.9013 6.53313 3.96364 6.36364C4.03624 6.19912 4.0579 6.01662 4.02582 5.83968C3.99374 5.66274 3.90938 5.49946 3.78364 5.37091L3.75091 5.33818C3.64948 5.23687 3.56902 5.11655 3.51412 4.98412C3.45922 4.85168 3.43096 4.70973 3.43096 4.56636C3.43096 4.423 3.45922 4.28104 3.51412 4.14861C3.56902 4.01618 3.64948 3.89586 3.75091 3.79455C3.85223 3.69312 3.97254 3.61265 4.10497 3.55775C4.23741 3.50285 4.37936 3.4746 4.52273 3.4746C4.66609 3.4746 4.80805 3.50285 4.94048 3.55775C5.07291 3.61265 5.19323 3.69312 5.29455 3.79455L5.32727 3.82727C5.45583 3.95302 5.6191 4.03737 5.79604 4.06946C5.97299 4.10154 6.15548 4.07988 6.32 4.00727H6.36364C6.52497 3.93813 6.66255 3.82332 6.75947 3.67698C6.85638 3.53064 6.90839 3.35916 6.90909 3.18364V3.09091C6.90909 2.80158 7.02403 2.52411 7.22861 2.31952C7.4332 2.11493 7.71067 2 8 2C8.28933 2 8.5668 2.11493 8.77139 2.31952C8.97597 2.52411 9.09091 2.80158 9.09091 3.09091V3.14C9.09161 3.31552 9.14362 3.487 9.24053 3.63334C9.33745 3.77969 9.47504 3.89449 9.63636 3.96364C9.80088 4.03624 9.98338 4.0579 10.1603 4.02582C10.3373 3.99374 10.5005 3.90938 10.6291 3.78364L10.6618 3.75091C10.7631 3.64948 10.8834 3.56902 11.0159 3.51412C11.1483 3.45922 11.2903 3.43096 11.4336 3.43096C11.577 3.43096 11.719 3.45922 11.8514 3.51412C11.9838 3.56902 12.1041 3.64948 12.2055 3.75091C12.3069 3.85223 12.3873 3.97254 12.4422 4.10497C12.4971 4.23741 12.5254 4.37936 12.5254 4.52273C12.5254 4.66609 12.4971 4.80805 12.4422 4.94048C12.3873 5.07291 12.3069 5.19323 12.2055 5.29455L12.1727 5.32727C12.047 5.45583 11.9626 5.6191 11.9305 5.79604C11.8985 5.97299 11.9201 6.15548 11.9927 6.32V6.36364C12.0619 6.52497 12.1767 6.66255 12.323 6.75947C12.4694 6.85638 12.6408 6.90839 12.8164 6.90909H12.9091C13.1984 6.90909 13.4759 7.02403 13.6805 7.22861C13.8851 7.4332 14 7.71067 14 8C14 8.28933 13.8851 8.5668 13.6805 8.77139C13.4759 8.97597 13.1984 9.09091 12.9091 9.09091H12.86C12.6845 9.09161 12.513 9.14362 12.3667 9.24053C12.2203 9.33745 12.1055 9.47504 12.0364 9.63636Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const PrescriptionBlockIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_prescription_block_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M6 3.33333V2.66667C6 2.48986 6.07024 2.32029 6.19526 2.19526C6.32029 2.07024 6.48986 2 6.66667 2H9.33333C9.51014 2 9.67971 2.07024 9.80474 2.19526C9.92976 2.32029 10 2.48986 10 2.66667V3.33333C10 3.51014 9.92976 3.67971 9.80474 3.80474C9.67971 3.92976 9.51014 4 9.33333 4H6.66667"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.79984 5.80333C5.756 5.81585 5.71148 5.82587 5.6665 5.83333C5.08917 5.92933 4.6665 6.42867 4.6665 7.01333V12.6667C4.6665 13.0203 4.80698 13.3594 5.05703 13.6095C5.30708 13.8595 5.64622 14 5.99984 14H9.99984C10.3535 14 10.6926 13.8595 10.9426 13.6095C11.1927 13.3594 11.3332 13.0203 11.3332 12.6667V11.3333M11.3332 8.66667V7.01333C11.3332 6.42867 10.9105 5.92933 10.3332 5.83333C10.0538 5.78679 9.80001 5.64267 9.6169 5.42661C9.4338 5.21055 9.33326 4.93655 9.33317 4.65333V4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.6665 8H7.99984M10.6665 8H11.3332"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.6665 12H11.3332"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.3335 10H8.66683"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 3.5L13.5 13.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const QuickMenuIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_quick_menu_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M7 8.33203C7 8.59725 7.10536 8.8516 7.29289 9.03914C7.48043 9.22667 7.73478 9.33203 8 9.33203C8.26522 9.33203 8.51957 9.22667 8.70711 9.03914C8.89464 8.8516 9 8.59725 9 8.33203C9 8.06681 8.89464 7.81246 8.70711 7.62492C8.51957 7.43739 8.26522 7.33203 8 7.33203C7.73478 7.33203 7.48043 7.43739 7.29289 7.62492C7.10536 7.81246 7 8.06681 7 8.33203Z"
          fill="currentColor"
        />
        <path
          d="M7 12.332C7 12.5972 7.10536 12.8516 7.29289 13.0391C7.48043 13.2267 7.73478 13.332 8 13.332C8.26522 13.332 8.51957 13.2267 8.70711 13.0391C8.89464 12.8516 9 12.5972 9 12.332C9 12.0668 8.89464 11.8125 8.70711 11.6249C8.51957 11.4374 8.26522 11.332 8 11.332C7.73478 11.332 7.48043 11.4374 7.29289 11.6249C7.10536 11.8125 7 12.0668 7 12.332Z"
          fill="currentColor"
        />
        <path
          d="M7 4C7 4.26522 7.10536 4.51957 7.29289 4.70711C7.48043 4.89464 7.73478 5 8 5C8.26522 5 8.51957 4.89464 8.70711 4.70711C8.89464 4.51957 9 4.26522 9 4C9 3.73478 8.89464 3.48043 8.70711 3.29289C8.51957 3.10536 8.26522 3 8 3C7.73478 3 7.48043 3.10536 7.29289 3.29289C7.10536 3.48043 7 3.73478 7 4Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 특정내역
export const SpecificDetailIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_specific_detail_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M3 3.875C3 3.51033 3.11706 3.16059 3.32544 2.90273C3.53381 2.64487 3.81643 2.5 4.11111 2.5H11.8889C12.1836 2.5 12.4662 2.64487 12.6746 2.90273C12.8829 3.16059 13 3.51033 13 3.875V12.125C13 12.4897 12.8829 12.8394 12.6746 13.0973C12.4662 13.3551 12.1836 13.5 11.8889 13.5H4.11111C3.81643 13.5 3.53381 13.3551 3.32544 13.0973C3.11706 12.8394 3 12.4897 3 12.125V3.875Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 5.5H10.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 8H10.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 10.5H10.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

// 내용이 비어있는 특정내역
export const SpecificDetailEmptyIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_specific_detail_empty_${id}`;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <g clipPath={`url(#${clipId})`}>
        <path d="M3 3.875C3 3.51033 3.11706 3.16059 3.32544 2.90273C3.53381 2.64487 3.81643 2.5 4.11111 2.5H11.8889C12.1836 2.5 12.4662 2.64487 12.6746 2.90273C12.8829 3.16059 13 3.51033 13 3.875V12.125C13 12.4897 12.8829 12.8394 12.6746 13.0973C12.4662 13.3551 12.1836 13.5 11.8889 13.5H4.11111C3.81643 13.5 3.53381 13.3551 3.32544 13.0973C3.11706 12.8394 3 12.4897 3 12.125V3.875Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2.6 2.6" />
        <path d="M5.5 5.5H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 8H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10.5H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="none" />
        </clipPath>
      </defs>
    </svg>

  );
};

// 예약처방 메모
export const ScheduledOrderMemoIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_scheduled_order_memo_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M8.5625 12.5L12.5 8.5625"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5625 12.5V9.125C8.5625 8.97582 8.62176 8.83274 8.72725 8.72725C8.83274 8.62176 8.97582 8.5625 9.125 8.5625H12.5V4.625C12.5 4.32663 12.3815 4.04048 12.1705 3.8295C11.9595 3.61853 11.6734 3.5 11.375 3.5H4.625C4.32663 3.5 4.04048 3.61853 3.8295 3.8295C3.61853 4.04048 3.5 4.32663 3.5 4.625V11.375C3.5 11.6734 3.61853 11.9595 3.8295 12.1705C4.04048 12.3815 4.32663 12.5 4.625 12.5H8.5625Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const ScheduledOrderIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_scheduled_order_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M13.4648 8.62379C13.5898 7.52861 13.3829 6.42113 12.8708 5.44499C12.3587 4.46885 11.5652 3.66909 10.593 3.14946C9.6208 2.62983 8.5149 2.4143 7.41873 2.53082C6.32256 2.64734 5.28669 3.09055 4.44549 3.80294C3.60429 4.51534 2.99658 5.46405 2.70117 6.52603C2.40576 7.588 2.4363 8.71424 2.78881 9.75865C3.14133 10.8031 3.79955 11.7175 4.67812 12.3832C5.55668 13.049 6.61504 13.4354 7.71592 13.4924"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 4.94531V8.0008L9.83338 9.83409"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.83203 12.2769L11.0543 13.4991L13.4988 11.0547"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CaretDownIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_caret_down_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path d="M3.5 5.5L8 10.5L12.5 5.5H3.5Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const WarningIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_warning_${id}`;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <g clipPath={`url(#${clipId})`}>
        <path d="M2.5 10C2.5 10.9849 2.69399 11.9602 3.0709 12.8701C3.44781 13.7801 4.00026 14.6069 4.6967 15.3033C5.39314 15.9997 6.21993 16.5522 7.12987 16.9291C8.03982 17.306 9.01509 17.5 10 17.5C10.9849 17.5 11.9602 17.306 12.8701 16.9291C13.7801 16.5522 14.6069 15.9997 15.3033 15.3033C15.9997 14.6069 16.5522 13.7801 16.9291 12.8701C17.306 11.9602 17.5 10.9849 17.5 10C17.5 8.01088 16.7098 6.10322 15.3033 4.6967C13.8968 3.29018 11.9891 2.5 10 2.5C8.01088 2.5 6.10322 3.29018 4.6967 4.6967C3.29018 6.10322 2.5 8.01088 2.5 10Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 6.66626V9.99959" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 13.3337H10.0069" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>

  );
};

export const CircleCheckIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_circle_check_${id}`;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <g clipPath={`url(#${clipId})`}>
        <path d="M2 8C2 8.78793 2.15519 9.56815 2.45672 10.2961C2.75825 11.0241 3.20021 11.6855 3.75736 12.2426C4.31451 12.7998 4.97595 13.2417 5.7039 13.5433C6.43185 13.8448 7.21207 14 8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 7.21207 13.8448 6.43185 13.5433 5.7039C13.2417 4.97595 12.7998 4.31451 12.2426 3.75736C11.6855 3.20021 11.0241 2.75825 10.2961 2.45672C9.56815 2.15519 8.78793 2 8 2C7.21207 2 6.43185 2.15519 5.7039 2.45672C4.97595 2.75825 4.31451 3.20021 3.75736 3.75736C3.20021 4.31451 2.75825 4.97595 2.45672 5.7039C2.15519 6.43185 2 7.21207 2 8Z" fill="#2EA652" />
        <path d="M6 7.99935L7.33333 9.33268L10 6.66602" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>

  );
};

export const StarIcon = ({
  className,
  filled = false,
  ...props
}: React.SVGProps<SVGSVGElement> & { filled?: boolean }) => {
  const id = useId();
  const clipId = `clip_star_${id}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} {...props} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M8.19202 12.0496C8.0747 11.9872 7.93403 11.9871 7.81664 12.0494L4.85953 13.6189C4.5663 13.7745 4.22205 13.5258 4.27766 13.1986L4.84439 9.86348C4.86631 9.73446 4.82374 9.60288 4.7304 9.51116L2.32448 7.14703C2.08867 6.91531 2.2198 6.5138 2.54693 6.46594L5.85977 5.98126C5.99042 5.96215 6.10322 5.87979 6.16122 5.76116L7.64065 2.73505C7.78687 2.43596 8.21313 2.43596 8.35935 2.73505L9.83878 5.76116C9.89678 5.87979 10.0096 5.96215 10.1402 5.98126L13.4531 6.46594C13.7802 6.5138 13.9113 6.91531 13.6755 7.14703L11.2696 9.51116C11.1763 9.60288 11.1337 9.73446 11.1556 9.86348L11.7222 13.1976C11.7778 13.5251 11.4332 13.7738 11.14 13.6178L8.19202 12.0496Z"
          fill={filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const PatientNewBadgeIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {

  const id = useId();
  const clipId = `clip_add_bundle_${id}`;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <g clipPath={`url(#${clipId})`}>
        <rect width="16" height="16" rx="4" fill="#FF8C8C" />
        <path d="M6.54237 3.86L8.90737 8.194L9.72137 9.954H9.77637C9.73237 9.52867 9.6847 9.063 9.63337 8.557C9.58937 8.051 9.56737 7.567 9.56737 7.105V3.86H11.1074V12H9.45737L7.10337 7.644L6.27837 5.895H6.22337C6.26004 6.335 6.30037 6.80067 6.34437 7.292C6.3957 7.78333 6.42137 8.26367 6.42137 8.733V12H4.88137V3.86H6.54237Z" fill="white" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const DdocDocIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" className={className} {...props}>
      <path d="M0 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H0V0Z" fill="white" />
      <path d="M0 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H0V0Z" fill="url(#pattern0_3527_114189)" />
      <defs>
        <pattern id="pattern0_3527_114189" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use xlinkHref="#image0_3527_114189" transform="translate(-0.142857 -0.25) scale(0.0178571)" />
        </pattern>
        <image id="image0_3527_114189" width="69" height="79" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
      </defs>
    </svg>

  );
};

// --- Appointment Status Icons (ic_filled_{statusKey.toLowerCase()}.svg) ---

export const AppointmentStatusPending = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_appointment_pending_${id}`;
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M5.9733 2.80794L1.06047 11.0096C0.959248 11.185 0.905702 11.3839 0.905156 11.5864C0.904609 11.7889 0.957082 11.988 1.05736 12.164C1.15763 12.3399 1.30222 12.4866 1.47674 12.5893C1.65126 12.6921 1.84963 12.7474 2.05214 12.7497H11.8784C12.0809 12.7474 12.2793 12.6921 12.4538 12.5893C12.6283 12.4866 12.7729 12.3399 12.8732 12.164C12.9734 11.988 13.0259 11.7889 13.0254 11.5864C13.0248 11.3839 12.9713 11.185 12.8701 11.0096L7.95664 2.80794C7.85318 2.6376 7.70759 2.49678 7.5339 2.39906C7.3602 2.30134 7.16427 2.25 6.96497 2.25C6.76567 2.25 6.56974 2.30134 6.39605 2.39906C6.22235 2.49678 6.07676 2.6376 5.9733 2.80794Z"
          fill="#F4A130"
        />
        <path
          d="M7 5.75V8.08333"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 10.418H7.00583"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="14" height="14" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const AppointmentStatusConfirmed = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_appointment_confirmed_${id}`;
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M1.75 7.5C1.75 8.18944 1.8858 8.87213 2.14963 9.50909C2.41347 10.146 2.80018 10.7248 3.28769 11.2123C3.7752 11.6998 4.35395 12.0865 4.99091 12.3504C5.62787 12.6142 6.31056 12.75 7 12.75C7.68944 12.75 8.37213 12.6142 9.00909 12.3504C9.64605 12.0865 10.2248 11.6998 10.7123 11.2123C11.1998 10.7248 11.5865 10.146 11.8504 9.50909C12.1142 8.87213 12.25 8.18944 12.25 7.5C12.25 6.81056 12.1142 6.12787 11.8504 5.49091C11.5865 4.85395 11.1998 4.2752 10.7123 3.78769C10.2248 3.30018 9.64605 2.91347 9.00909 2.64963C8.37213 2.3858 7.68944 2.25 7 2.25C6.31056 2.25 5.62787 2.3858 4.99091 2.64963C4.35395 2.91347 3.7752 3.30018 3.28769 3.78769C2.80018 4.2752 2.41347 4.85395 2.14963 5.49091C1.8858 6.12787 1.75 6.81056 1.75 7.5Z"
          fill="#3385FF"
        />
        <path
          d="M7 7.5L8.75 8.66667"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 4.58203V7.4987"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="14" height="14" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const AppointmentStatusVisited = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_appointment_visited_${id}`;
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M1.75 7.5C1.75 8.18944 1.8858 8.87213 2.14963 9.50909C2.41347 10.146 2.80018 10.7248 3.28769 11.2123C3.7752 11.6998 4.35395 12.0865 4.99091 12.3504C5.62787 12.6142 6.31056 12.75 7 12.75C7.68944 12.75 8.37213 12.6142 9.00909 12.3504C9.64605 12.0865 10.2248 11.6998 10.7123 11.2123C11.1998 10.7248 11.5865 10.146 11.8504 9.50909C12.1142 8.87213 12.25 8.18944 12.25 7.5C12.25 6.81056 12.1142 6.12787 11.8504 5.49091C11.5865 4.85395 11.1998 4.2752 10.7123 3.78769C10.2248 3.30018 9.64605 2.91347 9.00909 2.64963C8.37213 2.3858 7.68944 2.25 7 2.25C6.31056 2.25 5.62787 2.3858 4.99091 2.64963C4.35395 2.91347 3.7752 3.30018 3.28769 3.78769C2.80018 4.2752 2.41347 4.85395 2.14963 5.49091C1.8858 6.12787 1.75 6.81056 1.75 7.5Z"
          fill="#46474C"
        />
        <path
          d="M5.25 7.4987L6.41667 8.66537L8.75 6.33203"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="14" height="14" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const AppointmentStatusNoshow = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_appointment_noshow_${id}`;
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M1.75 7.5C1.75 8.18944 1.8858 8.87213 2.14963 9.50909C2.41347 10.146 2.80018 10.7248 3.28769 11.2123C3.7752 11.6998 4.35395 12.0865 4.99091 12.3504C5.62787 12.6142 6.31056 12.75 7 12.75C7.68944 12.75 8.37213 12.6142 9.00909 12.3504C9.64605 12.0865 10.2248 11.6998 10.7123 11.2123C11.1998 10.7248 11.5865 10.146 11.8504 9.50909C12.1142 8.87213 12.25 8.18944 12.25 7.5C12.25 6.81056 12.1142 6.12787 11.8504 5.49091C11.5865 4.85395 11.1998 4.2752 10.7123 3.78769C10.2248 3.30018 9.64605 2.91347 9.00909 2.64963C8.37213 2.3858 7.68944 2.25 7 2.25C6.31056 2.25 5.62787 2.3858 4.99091 2.64963C4.35395 2.91347 3.7752 3.30018 3.28769 3.78769C2.80018 4.2752 2.41347 4.85395 2.14963 5.49091C1.8858 6.12787 1.75 6.81056 1.75 7.5Z"
          fill="#FF6363"
        />
        <path
          d="M2.64978 3.125L11.3998 11.875"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="14" height="14" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const AppointmentStatusCanceled = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_appointment_canceled_${id}`;
  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M1.75 7.5C1.75 8.18944 1.8858 8.87213 2.14963 9.50909C2.41347 10.146 2.80018 10.7248 3.28769 11.2123C3.7752 11.6998 4.35395 12.0865 4.99091 12.3504C5.62787 12.6142 6.31056 12.75 7 12.75C7.68944 12.75 8.37213 12.6142 9.00909 12.3504C9.64605 12.0865 10.2248 11.6998 10.7123 11.2123C11.1998 10.7248 11.5865 10.146 11.8504 9.50909C12.1142 8.87213 12.25 8.18944 12.25 7.5C12.25 6.81056 12.1142 6.12787 11.8504 5.49091C11.5865 4.85395 11.1998 4.2752 10.7123 3.78769C10.2248 3.30018 9.64605 2.91347 9.00909 2.64963C8.37213 2.3858 7.68944 2.25 7 2.25C6.31056 2.25 5.62787 2.3858 4.99091 2.64963C4.35395 2.91347 3.7752 3.30018 3.28769 3.78769C2.80018 4.2752 2.41347 4.85395 2.14963 5.49091C1.8858 6.12787 1.75 6.81056 1.75 7.5Z"
          fill="#AEB0B6"
        />
        <path
          d="M5.25 7.5H8.75"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="14" height="14" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export type AppointmentStatusIconComponent =
  | typeof AppointmentStatusPending
  | typeof AppointmentStatusConfirmed
  | typeof AppointmentStatusVisited
  | typeof AppointmentStatusNoshow
  | typeof AppointmentStatusCanceled;

// system-danger: 빨간 원 + X 아이콘 (ic_filled_icon_x.svg 와 동일)
export const SystemDangerIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M1.33301 8.00008C1.33301 11.682 4.31778 14.6667 7.99967 14.6667C11.6816 14.6667 14.6663 11.682 14.6663 8.00008C14.6663 4.31818 11.6816 1.33341 7.99967 1.33341C4.31778 1.33341 1.33301 4.31818 1.33301 8.00008Z"
      fill="#FF4242"
    />
    <path
      d="M9.62305 5.62305C9.83127 5.41482 10.1687 5.41494 10.377 5.62305C10.5852 5.83133 10.5852 6.16867 10.377 6.37695L8.75293 8L10.376 9.62305C10.5843 9.83133 10.5843 10.1687 10.376 10.377C10.1677 10.5852 9.83033 10.5852 9.62207 10.377L7.99902 8.75391L6.37695 10.377C6.16867 10.5852 5.8313 10.5852 5.62305 10.377C5.41497 10.1687 5.41491 9.83128 5.62305 9.62305L7.24512 8L5.62207 6.37695C5.41395 6.16868 5.41389 5.83128 5.62207 5.62305C5.8303 5.41481 6.16769 5.41491 6.37598 5.62305L7.99902 7.24609L9.62305 5.62305Z"
      fill="white"
    />
  </svg>
);

// system-success: 녹색 원 + 체크 아이콘
export const SystemSuccessIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <rect
      width="13.3333"
      height="13.3333"
      rx="6.66667"
      transform="matrix(1 0 0 -1 1.33301 14.667)"
      fill="#00BF40"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5019 5.56008C10.7451 5.72627 10.8075 6.05813 10.6413 6.30133L7.90799 10.3013C7.81846 10.4323 7.67524 10.5167 7.51724 10.5314C7.35924 10.5462 7.20288 10.4898 7.09064 10.3777L5.42293 8.711C5.21458 8.50279 5.21448 8.1651 5.42269 7.95675C5.63091 7.74841 5.9686 7.7483 6.17694 7.95652L7.38997 9.16879L9.76063 5.69952C9.92682 5.45633 10.2587 5.3939 10.5019 5.56008Z"
      fill="white"
    />
  </svg>
);

// ic_filled_check_default: 회색 원 + 체크 아이콘
export const CheckDefaultIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_check_default_${id}`;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M2 8C2 8.78793 2.15519 9.56815 2.45672 10.2961C2.75825 11.0241 3.20021 11.6855 3.75736 12.2426C4.31451 12.7998 4.97595 13.2417 5.7039 13.5433C6.43185 13.8448 7.21207 14 8 14C8.78793 14 9.56815 13.8448 10.2961 13.5433C11.0241 13.2417 11.6855 12.7998 12.2426 12.2426C12.7998 11.6855 13.2417 11.0241 13.5433 10.2961C13.8448 9.56815 14 8.78793 14 8C14 7.21207 13.8448 6.43185 13.5433 5.7039C13.2417 4.97595 12.7998 4.31451 12.2426 3.75736C11.6855 3.20021 11.0241 2.75825 10.2961 2.45672C9.56815 2.15519 8.78793 2 8 2C7.21207 2 6.43185 2.15519 5.7039 2.45672C4.97595 2.75825 4.31451 3.20021 3.75736 3.75736C3.20021 4.31451 2.75825 4.97595 2.45672 5.7039C2.15519 6.43185 2 7.21207 2 8Z"
          fill="#989BA2"
        />
        <path
          d="M6 8.00008L7.33333 9.33341L10 6.66675"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const MasterDataIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const clipId = `clip_master_data_${id}`;
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M2.5 2H4.5L6 3.5H9.5C9.76522 3.5 10.0196 3.60536 10.2071 3.79289C10.3946 3.98043 10.5 4.23478 10.5 4.5V8.5C10.5 8.76522 10.3946 9.01957 10.2071 9.20711C10.0196 9.39464 9.76522 9.5 9.5 9.5H2.5C2.23478 9.5 1.98043 9.39464 1.79289 9.20711C1.60536 9.01957 1.5 8.76522 1.5 8.5V3C1.5 2.73478 1.60536 2.48043 1.79289 2.29289C1.98043 2.10536 2.23478 2 2.5 2Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="12" height="12" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};