import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PAGE_MARGIN_MM,
  resolveHeaderCellStyle,
  resolveBodyCellStyle,
  ExaminationRequestPrintablePages,
} from "./generate-examination-request-pdf-printable";

vi.mock("@/lib/printable", () => ({
  PAPER_SIZES: { A4: { width: 210, height: 297 } },
  PrintableDocument: ({ children, header }: any) => (
    <div>
      {header()}
      {children}
    </div>
  ),
  usePrintPageContext: () => ({ pageIndex: 1, totalPages: 1 }),
}));

function createMockOrder(overrides?: Partial<any>): any {
  return {
    id: "order-1",
    hospitalId: 1,
    externalLabHospitalMappingId: "mapping-1",
    orderId: "ord-1",
    encounterId: "enc-1",
    patientId: 1,
    companyId: "comp-1",
    hosNum: "H001",
    orderDate: "2026-03-10",
    patientName: "홍길동",
    sex: "M",
    isSystemProvided: false,
    requestDateTime: null,
    rawData: null,
    status: "PENDING",
    createId: 1,
    createDateTime: "2026-03-10",
    updateId: 1,
    updateDateTime: "2026-03-10",
    deleteId: null,
    deleteDateTime: null,
    externalLabHospitalMapping: {
      id: "mapping-1",
      hospitalId: 1,
      externalLabId: "lab-1",
      isEnabled: true,
      createId: 1,
      createDateTime: "2026-03-10",
      updateId: 1,
      updateDateTime: "2026-03-10",
      library: {
        id: "lib-1",
        hospitalId: 1,
        code: "LIB001",
        name: "테스트",
        description: null,
        isActive: true,
        createId: 1,
        createDateTime: "2026-03-10",
        updateId: null,
        updateDateTime: null,
      },
    },
    patient: {
      id: 1,
      patientNo: "P001",
      name: "홍길동",
      rrn: "9001011234567",
      isTemporary: false,
      birthDate: "1990-01-01",
      gender: 1,
    },
    exams: [],
    order: { examType: null, createDateTime: "2026-03-10" },
    encounter: { doctor: { name: "김의사" } },
    ...overrides,
  };
}

describe("수탁검사 의뢰서 프린트 스타일 간격 축소", () => {
  describe("PAGE_MARGIN_MM", () => {
    it("상단 마진이 8mm여야 한다", () => {
      expect(PAGE_MARGIN_MM.top).toBe(8);
    });

    it("하단 마진이 10mm여야 한다", () => {
      expect(PAGE_MARGIN_MM.bottom).toBe(10);
    });
  });

  describe("resolveHeaderCellStyle", () => {
    it("패딩이 3px 4px여야 한다", () => {
      const style = resolveHeaderCellStyle({ width: "20%" });
      expect(style.padding).toBe("3px 4px");
    });

    it("폰트 사이즈가 10px여야 한다", () => {
      const style = resolveHeaderCellStyle({ width: "20%" });
      expect(style.fontSize).toBe("10px");
    });

    it("라인하이트가 1.2여야 한다", () => {
      const style = resolveHeaderCellStyle({ width: "20%" });
      expect(style.lineHeight).toBe("1.2");
    });
  });

  describe("resolveBodyCellStyle", () => {
    it("패딩이 2px 4px여야 한다", () => {
      const style = resolveBodyCellStyle({});
      expect(style.padding).toBe("2px 4px");
    });

    it("폰트 사이즈가 10px여야 한다", () => {
      const style = resolveBodyCellStyle({});
      expect(style.fontSize).toBe("10px");
    });

    it("라인하이트가 1.2여야 한다", () => {
      const style = resolveBodyCellStyle({});
      expect(style.lineHeight).toBe("1.2");
    });
  });
});

describe("ExaminationRequestHeader 간격 축소", () => {
  it("타이틀 폰트가 15px여야 한다", () => {
    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "테스트기관", orders: [createMockOrder()] }]}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
        hospitalCode="H001"
      />
    );
    const title = screen.getByText("수탁검사의뢰서");
    expect(title.style.fontSize).toBe("15px");
  });

  it("타이틀 paddingBottom이 3px여야 한다", () => {
    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "테스트기관", orders: [createMockOrder()] }]}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
      />
    );
    const title = screen.getByText("수탁검사의뢰서");
    expect(title.style.paddingBottom).toBe("3px");
  });

  it("수탁기관명 패딩이 2px 0 4px 0이어야 한다", () => {
    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "테스트기관", orders: [createMockOrder()] }]}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
      />
    );
    const labNameEl = screen.getByText(/테스트기관/);
    expect(labNameEl.style.padding).toBe("2px 0px 4px");
  });

  it("병원명/의뢰일 영역 폰트가 10px여야 한다", () => {
    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "테스트기관", orders: [createMockOrder()] }]}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
      />
    );
    const hospitalEl = screen.getByText(/병원명/);
    expect(hospitalEl.parentElement?.style.fontSize).toBe("10px");
  });

  it("병원명/의뢰일 영역 패딩이 3px 0이어야 한다", () => {
    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "테스트기관", orders: [createMockOrder()] }]}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
      />
    );
    const hospitalEl = screen.getByText(/병원명/);
    expect(hospitalEl.parentElement?.style.padding).toBe("3px 0px");
  });
});

describe("renderExaminationRequestTable 간격", () => {
  it("테이블 fontSize가 10px여야 한다", () => {
    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "테스트기관", orders: [createMockOrder()] }]}
        treatmentDate="2026-03-10"
      />
    );
    const table = document.querySelector("table");
    expect(table?.style.fontSize).toBe("10px");
  });
});

describe("여러 환자 통합 출력", () => {
  it("같은 수탁기관의 2명 환자가 하나의 테이블에 렌더링된다", () => {
    const orders = [
      createMockOrder({
        id: "o1",
        patientName: "환자A",
        patientId: 1,
        patient: {
          id: 1,
          patientNo: "0001",
          name: "환자A",
          rrn: "9001011234567",
          isTemporary: false,
          birthDate: "1990-01-01",
          gender: 1,
        },
      }),
      createMockOrder({
        id: "o2",
        patientName: "환자B",
        patientId: 2,
        patient: {
          id: 2,
          patientNo: "0002",
          name: "환자B",
          rrn: "9501012345678",
          isTemporary: false,
          birthDate: "1995-01-01",
          gender: 2,
        },
      }),
    ];

    render(
      <ExaminationRequestPrintablePages
        labsData={[{ labName: "씨젠", orders }]}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
      />
    );

    // 테이블이 1개만 있어야 함 (환자별 분리 아님)
    const tables = document.querySelectorAll("table");
    expect(tables).toHaveLength(1);

    // 두 환자 이름 모두 표시
    expect(screen.getByText("환자A")).toBeInTheDocument();
    expect(screen.getByText("환자B")).toBeInTheDocument();
  });

  it("서로 다른 수탁기관이면 별도 테이블로 렌더링된다", () => {
    const labsData = [
      {
        labName: "씨젠",
        orders: [createMockOrder({ id: "o1", patientName: "환자A" })],
      },
      {
        labName: "녹십자",
        orders: [createMockOrder({ id: "o2", patientName: "환자B" })],
      },
    ];

    render(
      <ExaminationRequestPrintablePages
        labsData={labsData}
        treatmentDate="2026-03-10"
        hospitalName="테스트병원"
      />
    );

    // 테이블이 2개여야 함 (수탁기관별 분리)
    const tables = document.querySelectorAll("table");
    expect(tables).toHaveLength(2);
  });
});
