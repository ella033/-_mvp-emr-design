import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChartSearch from "./index";

// SearchBar mock — onPatientSelect 콜백을 버튼 클릭으로 트리거
let capturedOnPatientSelect: ((patient: any) => void) | undefined;

vi.mock("@/components/search-bar", () => ({
  default: ({
    onPatientSelect,
  }: {
    onPatientSelect?: (patient: any) => void;
  }) => {
    capturedOnPatientSelect = onPatientSelect;
    return <div data-testid="mock-search-bar">검색</div>;
  },
}));

describe("ChartSearch", () => {
  it("환자 선택 시 검증 없이 onPatientSelect에 그대로 전달한다", () => {
    const onPatientSelect = vi.fn();
    render(<ChartSearch onPatientSelect={onPatientSelect} />);

    // consent null 환자 전달
    capturedOnPatientSelect?.({
      id: 1,
      name: "홍길동",
      phone1: "010-1234-5678",
      consent: null,
    });

    expect(onPatientSelect).toHaveBeenCalledWith({
      id: 1,
      name: "홍길동",
      phone1: "010-1234-5678",
      consent: null,
    });
  });

  it("휴대폰 번호 없는 환자도 검증 없이 그대로 전달한다", () => {
    const onPatientSelect = vi.fn();
    render(<ChartSearch onPatientSelect={onPatientSelect} />);

    capturedOnPatientSelect?.({
      id: 2,
      name: "김환자",
      phone1: "",
      consent: { privacy: 2, marketing: false },
    });

    expect(onPatientSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, phone1: "" })
    );
  });

  it("개인정보 거부 환자도 검증 없이 그대로 전달한다", () => {
    const onPatientSelect = vi.fn();
    render(<ChartSearch onPatientSelect={onPatientSelect} />);

    capturedOnPatientSelect?.({
      id: 3,
      name: "박환자",
      phone1: "010-9999-8888",
      consent: { privacy: 2, marketing: true },
    });

    expect(onPatientSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, consent: { privacy: 2, marketing: true } })
    );
  });

  it("onPatientSelect prop이 없어도 에러 없이 렌더링된다", () => {
    expect(() => render(<ChartSearch />)).not.toThrow();
  });
});
