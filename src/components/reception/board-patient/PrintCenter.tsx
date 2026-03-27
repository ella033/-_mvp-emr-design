import type { ExternalReception } from "./types";
import PrintCenterComponent from "../(print-center)/print-center";

export interface PrintCenterProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
  onPrint?: (printType: string) => void;
  isActive?: boolean;
}

/**
 * 출력센터 탭
 *
 * - 처방전, 진단서 등 각종 출력물을 선택/발행하는 공용 컴포넌트
 */
export function PrintCenter({
  reception,
  receptionId,
  onPrint,
  isActive,
}: PrintCenterProps) {
  return (
    <PrintCenterComponent
      reception={reception}
      receptionId={receptionId}
      onPrint={onPrint}
      isActive={isActive}
    />
  );
}


