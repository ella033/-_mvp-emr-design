import { useCallback, useMemo } from 'react';
import { PaybridgeSDK } from '@/services/pay-bridge';
import type {
  PaymentRequest,
  PaymentResult,
  CashReceiptRequest,
  CashReceiptResult,
  PaymentCancelRequest,
  CashReceiptCancelRequest,
  DevicesSetting,
} from '@/services/pay-bridge';
import { SalesSlipType, IdentificationTypes, CashReceiptTypes } from '@/services/pay-bridge';

// TODO: 차후 서버에서 받아올 예정이지만 지금은 임시 선언
const ADMIN_PAGE_URL = 'http://localhost:24000/';

/**
 * Pay Bridge SDK를 사용하는 훅
 */
export function usePayBridge() {

  // SDK 인스턴스 생성 (싱글톤 패턴)
  const sdk = useMemo(() => {
    return PaybridgeSDK.build({
      getJwtAction: () => {
        // TODO: JWT 토큰 반환 로직 구현 필요
        return '';
      },
      errorAction: (errMsg: string, errObj: any, _showErrorPop: boolean) => {
        console.error('Pay Bridge Error:', errMsg, errObj);
      },
      showDimmerAction: () => {
        // TODO: 로딩 표시 로직 구현 필요
      },
      hideDimmerAction: () => {
        // TODO: 로딩 숨김 로직 구현 필요
      },
      httpErrorAction: (response) => {
        // HTTP 응답 처리
        if (response.status >= 400) {
          return false;
        }
        return true;
      },
      finishAction: () => {
        // 요청 완료 후 처리
      },
    });
  }, []);

  /**
   * 카드 결제 요청
   * @param request - 결제 요청 정보
   * @returns 결제 결과
   */
  const requestCardPayment = useCallback(
    async (request: {
      amount: number; // 결제 금액
      installmentMonths: number; // 할부개월 (0: 일시불)
      useSign?: boolean; // 서명 사용 여부
      signData?: string; // 서명 데이터
      printSalesSlipType?: SalesSlipType; // 전표 출력 타입
      printReceiptStr?: string; // 영수증 하단 출력문구
    }): Promise<PaymentResult> => {
      const paymentRequest: PaymentRequest = {
        taxFreeAmount: request.amount, // 기본 비과세
        taxAmount: 0, // todo :과세금액 (세금포함금액)
        vat: Math.floor(request.amount / 11), // 부가세 (10% 기준)
        installmentMonths: request.installmentMonths,
        useSign: request.useSign ?? false,
        signData: request.signData ?? '',
        printSalesSlipType: request.printSalesSlipType ?? SalesSlipType.CustomerOnly,
        printReceiptStr: request.printReceiptStr ?? '',
        simplePay: 0, // 간편결제 사용 안함
        callbackAction: async (_result: PaymentResult) => {
          // 결제 성공 후 콜백 처리
          // true 반환 시 결제 유지, false 반환 시 자동 취소
          return true;
        },
      };

      const response = await sdk.payment.request(paymentRequest);

      if (response.statusCode !== 200 || !response.result?.payResult) {
        const errorMessage = response.message || '카드 결제 요청 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      const { vanTransacctionNo, ...rest } = response.result.payResult as any;
      return {
        ...rest,
        vanTransactionNo: vanTransacctionNo,
      } as PaymentResult;
    },
    [sdk]
  );

  /**
   * 현금영수증 발행 요청
   * @param request - 현금영수증 발행 요청 정보
   * @returns 현금영수증 발행 결과
   */
  const requestCashReceipt = useCallback(
    async (request: {
      receiptType: CashReceiptTypes; // 현금영수증 타입
      identificationNumber: string; // 식별번호 (휴대폰번호, 사업자등록번호 등)
      identificationType: IdentificationTypes; // 식별 타입
      amount: number; // 발행 금액
      printSalesSlipType?: SalesSlipType; // 전표 출력 타입
      printReceiptStr?: string; // 영수증 하단 출력문구
    }): Promise<CashReceiptResult> => {
      const cashReceiptRequest: CashReceiptRequest = {
        receiptType: request.receiptType,
        identificationNumber: request.identificationNumber,
        identificationType: request.identificationType,
        taxFreeAmount: request.amount, // 기본 비과세
        taxAmount: 0, // todo :과세금액 (세금포함금액)
        vat: 0,
        printSalesSlipType: request.printSalesSlipType ?? SalesSlipType.CustomerOnly,
        printReceiptStr: request.printReceiptStr ?? '',
      };

      const response = await sdk.cashReceipt.request(cashReceiptRequest);

      if (response.statusCode !== 200 || !response.result) {
        const errorMessage = response.message || '현금영수증 발행 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }
      console.log('[usePayBridge] response.result:', response.result);
      // CashReceiptResult에 unavailableAction 추가
      return {
        ...response.result,
        receiptType: response.result.receiptType as 1 | 2 | 3,
        unavailableAction: () => {
          // 취소 불가 시 처리 로직
        },
      } as CashReceiptResult;
    },
    [sdk]
  );

  /**
   * 현재 설정된 단말기 정보 조회
   * @returns 단말기 ID (vanId)
   */
  const getCurrentVan = useCallback(
    async (): Promise<number> => {
      const response = await sdk.devices.getCurrentVan();

      if (response.statusCode !== 200 || response.result?.vanId === undefined || response.result?.vanId === null) {
        const errorMessage = response.message || '단말기 정보 조회 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      return response.result.vanId;
    },
    [sdk]
  );

  /**
   * 사용할 단말기 설정
   * @param vanId - 단말기 ID (문자열)
   * @returns 설정 성공 여부
   */
  const settingVan = useCallback(
    async (vanId: string): Promise<boolean> => {
      const response = await sdk.payment.setVan({ vanId });

      if (response.statusCode !== 200) {
        const errorMessage = response.message || '단말기 설정 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      return response.result === true;
    },
    [sdk]
  );

  /**
   * 단말기 연결 확인
   * @param vanId - 단말기 ID
   * @returns 연결 성공 여부
   */
  const connectTerminal = useCallback(
    async (vanId: number): Promise<boolean> => {
      const response = await sdk.devices.connect(vanId);

      if (response.statusCode !== 200) {
        const errorMessage = response.message || '단말기 연결 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      return response.result === true;
    },
    [sdk]
  );

  /**
   * 카드 결제 취소
   * (결제 승인번호/승인일자 기준)
   */
  const cancelCardPayment = useCallback(
    async (params: { amount: number; installmentMonths: number; approvalNumber: string; approvalDate: Date }) => {
      const cancelRequest: PaymentCancelRequest = {
        taxFreeAmount: params.amount,
        taxAmount: 0,
        vat: Math.floor(params.amount / 11),
        installmentMonths: params.installmentMonths,
        approvalDate: params.approvalDate,
        approvalNumber: params.approvalNumber,
        printReceiptStr: '',
        simplePay: 0,
        unavailableAction: () => {
          // 취소 불가 시 추가 처리 필요 시 여기에 구현
        },
      };

      const response = await sdk.payment.cancel(cancelRequest);

      if (response.statusCode !== 200) {
        const errorMessage = response.message || '카드 결제 취소 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      return response;
    },
    [sdk]
  );

  /**
   * 현금영수증 취소
   * (승인번호/승인일자 기준)
   */
  const cancelCashReceipt = useCallback(
    async (params: {
      amount: number;
      receiptType: CashReceiptTypes;
      identificationNumber: string;
      approvalNumber: string;
      approvalDate: Date;
    }) => {
      const cancelRequest: CashReceiptCancelRequest = {
        receiptType: params.receiptType as 1 | 2 | 3,
        identificationNumber: params.identificationNumber,
        taxFreeAmount: params.amount,
        taxAmount: 0,
        vat: Math.floor(params.amount / 11),
        approvalDate: params.approvalDate,
        approvalNumber: params.approvalNumber,
        cancelReason: 0,
        printReceiptStr: '',
        printSalesSlipType: SalesSlipType.CustomerOnly,
        unavailableAction: () => {
          // 취소 불가 시 추가 처리 필요 시 여기에 구현
        },
      };

      const response = await sdk.cashReceipt.cancel(cancelRequest);

      if (response.statusCode !== 200) {
        const errorMessage = response.message || '현금영수증 취소 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      return response;
    },
    [sdk]
  );

  /**
   * 결제수단별 구성정보 목록 조회
   * @returns 단말기 설정 목록
   */
  const getSettingList = useCallback(
    async (): Promise<DevicesSetting[]> => {
      const response = await sdk.setting.getList();

      if (response.statusCode !== 200 || !response.result) {
        const errorMessage = response.message || '설정 목록 조회 실패';
        throw new Error(errorMessage + '[' + response.statusCode + ']');
      }

      return response.result;
    },
    [sdk]
  );

  /**
   * 결제인터페이스 최초설치 후 설정
   * 설정 목록에서 첫 번째 단말기의 vanId를 가져와 설정하고 확인까지 완료
   * @returns 설정된 단말기 ID
   */
  const setVanInit = useCallback(
    async (): Promise<number> => {
      // 1) 설정 목록 조회
      const settingList = await getSettingList();

      if (!settingList || settingList.length === 0) {
        throw new Error('설정 가능한 단말기가 없습니다.');
      }

      // TODO: 여러개일때 화면에 띄울예정. 현재는 1개라 [0]으로 가져옴
      const firstSetting = settingList[0];
      if (!firstSetting) {
        throw new Error('설정 가능한 단말기가 없습니다.');
      }
      const vanId = firstSetting.vanId;

      // 2) 단말기 설정
      await settingVan(vanId.toString());

      // 3) 설정 확인
      const currentVanId = await getCurrentVan();

      if (currentVanId !== vanId) {
        throw new Error('단말기 설정 확인 실패');
      }

      return currentVanId;
    },
    [sdk, getSettingList, settingVan, getCurrentVan]
  );

  /**
   * 단말기 연동 확인
   * connect로 확인 후 실패 시 재시도 로직 포함
   * @returns 단말기 연동 가능 여부
   */
  const checkTerminalConnection = useCallback(
    async (): Promise<boolean> => {
      try {
        // 1) 단말기 연결 확인
        const vanId = await getCurrentVan();
        await connectTerminal(vanId);
        return true; // 연결 성공
      } catch (connectError: any) {
        // 연결 실패 시 재시도 로직
        try {
          // 2) 현재 단말기 정보 조회 (statusCode 확인을 위해 직접 호출)
          const currentVanResponse = await sdk.devices.getCurrentVan();

          // 3) statusCode가 3001이면 초기 설정 필요
          if (currentVanResponse.statusCode === 3001) {
            try {
              // 초기 설정 진행
              await setVanInit();
              // 설정 성공 시 연결만 확인
              const vanId = await getCurrentVan();
              await connectTerminal(vanId);
              return true;
            } catch (initError: any) {
              // 초기 설정 실패 시 관리자페이지 띄우고 false 반환
              window.open(ADMIN_PAGE_URL, '_blank');
              return false;
            }
          }

          // 4) statusCode가 3001이 아니고 vanId를 제대로 가져온 경우
          if (currentVanResponse.statusCode === 200 && currentVanResponse.result?.vanId !== undefined && currentVanResponse.result?.vanId !== null) {
            const vanId = currentVanResponse.result.vanId;
            // 단말기 재설정
            await settingVan(vanId.toString());
            // 연결 재확인
            await connectTerminal(vanId);
            return true;
          }

          // 5) 그 외의 경우 실패
          return false;
        } catch (retryError: any) {
          // 재시도 실패
          return false;
        }
      }
    },
    [sdk, getCurrentVan, connectTerminal, settingVan, setVanInit]
  );

  return {
    requestCardPayment,
    requestCashReceipt,
    getCurrentVan,
    settingVan,
    setVanInit,
    connectTerminal,
    checkTerminalConnection,
    cancelCardPayment,
    cancelCashReceipt,
    getSettingList,
  };
}

