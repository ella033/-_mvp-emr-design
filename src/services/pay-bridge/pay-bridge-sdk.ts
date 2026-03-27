import type {
  ApiResponseBase,
  CashReceiptCancelRequest,
  CashReceiptRequest,
  DeviceSetting,
  PaymentRequest,
  SearchPaymentRequest,
  SearchPaymentListRequest,
  PaymentCancelRequest,
  PaymentRequestResult,
  SearchPaymentIdRequest,
  DevicesSetting,
  SearchPaymentResult
} from './pay-bridge-types';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import moment from 'moment';

const INTERFACE_PORT = 24000;

//Axios Request Config 확장 속성 정의
declare module 'axios' {
  export interface AxiosRequestConfig {
    //프로그레스 표기 여부
    showProgress?: boolean;

    //오류 팝업 표기 여부
    showErrorPop?: boolean;
  }
}

const globalOptions = {
  baseURL: `https://localhost:${INTERFACE_PORT}`,
};

async function setApiHost() {
  if (globalOptions.baseURL) return;

  for (let i = 0; i < 100; i++) {
    try {

      globalOptions.baseURL = `https://localhost:${INTERFACE_PORT + i}`;

      const res = await axios.get(`${globalOptions.baseURL}/ping`, {
        timeout: 500,
      });

      if (res.data === 'pong') return;
    } catch { }
  }

  throw new Error('Paybridge API 서비스가 동작하지 않습니다.');
}

/**
 * 모델 데이터 속성변환처리
 * - ISO 8601 형식의 날짜 문자열을 로컬 날짜 형식으로 변환
 * - (비활성화) 숫자만 있는 문자열을 number로 변환
 * @param obj
 */
function convertModelDataTypes<T>(obj: any) {
  const isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*Z)?$/;

  const isIsoDateString = (value: any): boolean => {
    return value && typeof value === 'string' && isoDateFormat.test(value);
  };

  const handleDates = (body: any) => {
    if (body === null || body === undefined || typeof body !== 'object')
      return body;
    for (const key of Object.keys(body)) {
      const value = body[key];

      if (isIsoDateString(value))
        body[key] = value.indexOf('Z') === -1 ? moment(value) : new Date(value);
      else if (typeof value === 'object') handleDates(value);
    }
  };

  const handleBigints = (body: any) => {
    if (body === null || body === undefined || typeof body !== 'object')
      return body;

    for (const key of Object.keys(body)) {
      const value = body[key];

      if (value && typeof value === 'string' && !/[^0-9^\-^.]/.test(value)) {
        const numVal = parseInt(value);
        if (numVal.toString() === value) body[key] = numVal;
      } else if (typeof value === 'object') handleBigints(value);
    }
  };

  handleDates(obj);
  //handleBigints(obj);
}

export class PaybridgeSDK {
  private api?: AxiosInstance;

  private axiosActions = {
    getJwtAction: () => '',
    errorAction: (errMsg: string, errObj: any, showErrorPop: boolean) => { },
    showDimmerAction: () => { },
    hideDimmerAction: () => { },
    httpErrorAction: (response: AxiosResponse) => true,
    finishAction: (response: AxiosResponse) => { },
  };

  constructor() { }

  /**
   * 새 결제연동 객체 반환
   */
  static build(options: {
    /**
     * JWT 반환 함수
     */
    getJwtAction?: () => string;
    /**
     * 오류 처리 동작
     * 요청 처리 중 오류 발생 시 동작
     * showErrorPop은 요청 별로 별도의 오류팝업 노출여부 설정을 위해 axios 기본 요청에 확장한 속성. 필요 시 활용
     */
    errorAction?: (errMsg: string, errObj: any, showErrorPop: boolean) => void;
    /**
     * 로딩중 노출 동작 - 요청 실행 전 호출됨
     */
    showDimmerAction?: () => void;
    /**
     * 로딩중 숨김 동작 - 응답 수신 후 호출됨
     */
    hideDimmerAction?: () => void;
    /**
     * http 응답 처리 동작. true를 반환하지 않으면 오류로 인식하여 중단됨
     * 사전 정의된 서버 오류에 대한 공용 처리함수로 사용
     */
    httpErrorAction?: (response: AxiosResponse) => boolean;
    /**
     * 요청 처리 완료 후 값 반환 전 실행 동작
     */
    finishAction?: (response: AxiosResponse) => void;
  }) {
    const sdk = new PaybridgeSDK();

    sdk.api = axios.create({
      validateStatus: status => true,
    });

    sdk.axiosActions = {
      ...sdk.axiosActions,
      ...options,
    };

    sdk.api.interceptors.request.use(
      async config => {
        if (config.showProgress) {
          sdk.axiosActions.showDimmerAction();
        }

        //JWT를 기본으로 사용. 기타 다른 인증방식을 사용하는 경우 수정필요
        config.headers!.Authorization =
          'Bearer ' + sdk.axiosActions.getJwtAction();
        // config.headers!['Access-Control-Allow-Origin'] = '*';
        // config.headers!['Access-Control-Allow-Credentials'] = 'true';

        return config;
      },
      err => {
        sdk.axiosActions.errorAction(err.message, err, err.config.showErrorPop);

        return Promise.reject(err.request);
      },
    );

    sdk.api.interceptors.response.use(
      async response => {
        if (response.config.showProgress) {
          sdk.axiosActions.hideDimmerAction();
        }

        if (!sdk.axiosActions.httpErrorAction(response)) {
          return Promise.reject(response);
        }

        convertModelDataTypes(response.data);

        sdk.axiosActions.finishAction(response);

        return response;
      },
      err => {
        sdk.axiosActions.hideDimmerAction();
        sdk.axiosActions.errorAction(err.message, err, err.config.showErrorPop);

        return Promise.reject(err.request);
      },
    );

    return sdk;
  }

  /**
   * 오류 응답 여부 확인
   * statusCode와 message 속성이 있는지 여부 반환
   * API 응답에서 오류 시 응답형식을 맞춰줘야 함
   * 응답타입을 중복정의해서 처리하기 귀찮아서 이렇게 처리
   * @param responseData
   * @returns
   */
  static IsErrorResponse(responseData: any) {
    return (
      responseData &&
      responseData.statusCode !== undefined &&
      responseData.message !== undefined
    );
  }

  /**
   * get 요청 실행
   * @param options
   * @returns {TResult}
   */
  private async ajaxGet<TResult, TParams = void>(options: {
    url: string;
    params?: TParams;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<TResult> {
    await setApiHost();
    let reqUrl = globalOptions.baseURL + options.url;

    if (options.params) {
      for (const key in options.params) {
        if (options.params[key] === null || options.params[key] === undefined)
          continue;

        const value = moment.isDate(options.params[key])
          ? moment(options.params[key]).format('yyyy-MM-dd HH:mm:ss')
          : (options.params[key] as string);

        reqUrl += `${reqUrl.indexOf('?') != -1 ? '&' : '?'
          }${key}=${encodeURIComponent(value)}`;
      }
    }

    const response = await this.api!.get<TResult>(reqUrl, {
      showProgress: options.showProgress ?? true,
      showErrorPop: options.showErrorPop ?? true,
      ...(options.axiosConfig ?? {}),
    });

    return response.data;
  }

  /**
   * post 요청 실행
   * @param options
   * @returns {TResult}
   */
  private async ajaxPost<TResult, TParams = void>(options: {
    url: string;
    params?: TParams;
    headers?: any;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<TResult> {
    await setApiHost();

    const response = await this.api!.post<TResult>(
      globalOptions.baseURL + options.url,
      options.params ?? {},
      {
        showProgress: options.showProgress ?? true,
        showErrorPop: options.showErrorPop ?? true,
        headers: options.headers ?? {},
        ...(options.axiosConfig ?? {}),
      },
    );
    return response.data;
  }

  /**
   * put 요청 실행
   * @param options
   * @returns {TResult}
   */
  private async ajaxPut<TResult, TParams = void>(options: {
    url: string;
    params?: TParams;
    headers?: any;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<TResult> {
    await setApiHost();

    const response = await this.api!.put<TResult>(
      globalOptions.baseURL + options.url,
      options.params ?? {},
      {
        showProgress: options.showProgress ?? true,
        showErrorPop: options.showErrorPop ?? true,
        headers: options.headers ?? {},
        ...(options.axiosConfig ?? {}),
      },
    );
    return response.data;
  }

  /**
   * delete 요청 실행
   * @param options
   * @returns {TResult}
   */
  private async ajaxDelete<TResult, TParams = void>(options: {
    url: string;
    params?: TParams;
    headers?: any;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<TResult> {
    await setApiHost();

    const response = await this.api!.delete<TResult>(
      globalOptions.baseURL + options.url,
      {
        showProgress: options.showProgress ?? true,
        showErrorPop: options.showErrorPop ?? true,
        headers: options.headers ?? {},
        data: options.params ?? {},

        ...(options.axiosConfig ?? {}),
      },
    );
    return response.data;
  }

  /**
   * get 요청 결과 문자열 반환
   * @param options
   * @returns {string}
   */
  private async ajaxGetString<TParams = void>(options: {
    url: string;
    params?: TParams;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<string> {
    return await this.ajaxGet<string, TParams>({
      url: options.url,
      params: options.params,
      showProgress: options.showProgress ?? true,
      axiosConfig: {
        responseType: 'text',
        ...(options.axiosConfig ?? {}),
      },
    });
  }

  /**
   * post 요청 결과 문자열 반환
   * @param options
   * @returns {string}
   */
  private async ajaxPostString<TParams = void>(options: {
    url: string;
    params?: TParams;
    headers?: any;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<string> {
    return await this.ajaxPost<string, TParams>({
      url: options.url,
      params: options.params,
      headers: options.headers,
      showProgress: options.showProgress,
      showErrorPop: options.showErrorPop,
      axiosConfig: {
        responseType: 'text',
        ...(options.axiosConfig ?? {}),
      },
    });
  }

  /**
   * put 요청 결과 문자열 반환
   * @param options
   * @returns {string}
   */
  private async ajaxPutString<TParams = void>(options: {
    url: string;
    params?: TParams;
    headers?: any;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<string> {
    return await this.ajaxPut<string, TParams>({
      url: options.url,
      params: options.params,
      headers: options.headers,
      showProgress: options.showProgress,
      showErrorPop: options.showErrorPop,
      axiosConfig: {
        responseType: 'text',
        ...(options.axiosConfig ?? {}),
      },
    });
  }

  /**
   * delete 요청 결과 문자열 반환
   * @param options
   * @returns {string}
   */
  private async ajaxDeleteString<TParams = void>(options: {
    url: string;
    params?: TParams;
    headers?: any;
    showProgress?: boolean;
    showErrorPop?: boolean;
    axiosConfig?: AxiosRequestConfig<TParams>;
  }): Promise<string> {
    return await this.ajaxDelete<string, TParams>({
      url: options.url,
      params: options.params,
      headers: options.headers,
      showProgress: options.showProgress,
      showErrorPop: options.showErrorPop,
      axiosConfig: {
        responseType: 'text',
        ...(options.axiosConfig ?? {}),
      },
    });
  }

  /**
   * 연동 에이전트 API 호출기능
   */
  private apis = {
    system: {
      live: async () => {
        return await this.ajaxGet<ApiResponseBase<void>>({
          url: '/system/live',
        });
      },
    },

    van: {
      init: async () => {
        return await this.ajaxPost<ApiResponseBase<void>>({ url: '/van/init' });
      },

      current: async () => {
        return await this.ajaxGet<
          ApiResponseBase<{
            vanId: number;
            vanName: string;
            connectType: number;
            vanType: 1;
            connectInfo: string;
          }>
        >({
          url: '/van/current',
        });
      },

      status: async () => {
        return await this.ajaxGet<ApiResponseBase<number>>({
          url: '/van/status',
        });
      },

      stop: async () => {
        return await this.ajaxPost<ApiResponseBase<void>>({ url: '/van/stop' });
      },

      sign: async () => {
        return await this.ajaxGet<
          ApiResponseBase<{
            isSuccess: boolean;
            length: number;
            data: string;
            signImgPath: string;
          }>
        >({
          url: '/van/sign',
        });
      },

      connect: async (vanId: number) => {
        return await this.ajaxGet<ApiResponseBase<boolean>, typeof vanId>({
          url: `/van/connect?vanId=${vanId}`,
          params: vanId
        });
      },

      barcode: async () => {
        return await this.ajaxGet<ApiResponseBase<string>>({
          url: '/van/barcode',
        });
      },

      print: async (prmt: { content: string }) => {
        return await this.ajaxPost<ApiResponseBase<boolean>, typeof prmt>({
          url: '/van/print',
          params: prmt,
        });
      },

      catId: async () => {
        return await this.ajaxGet<ApiResponseBase<string>>({
          url: '/van/catId',
        });
      },

      set: async (prmt: { vanId: string }) => {
        return await this.ajaxPost<ApiResponseBase<boolean>>({
          url: `/van/set?vanId=${prmt.vanId}`,
        });
      },
    },

    credit: {
      request: async (prmt: {
        taxFreeAmount: number;
        taxAmount: number;
        vat: number;
        installmentMonths: number;
        useSign: boolean;
        signData: string;
        printSalesSlipType: number;
        printReceiptStr: string;
        simplePay: number;
      }) => {
        return await this.ajaxPost<
          ApiResponseBase<{
            approvalNumber: string;
            originApprovalNumber: string;
            approvalDate: Date;
            approvalAmount: number;
            vat: number;
            uniqueNo: string;
            installmentMonths: number;
            cardNumber: string;
            issuerCode: string;
            issuerName: string;
            acquirerCode: string;
            acquirerName: string;
            vanTransacctionNo: string;
            merchantId: string;
            catId: string;
            signData?: string;
            simplePayCode?: string;
            simplePayName?: string;
            simplePayBarcode?: string;
            catVersion?: string;
            cardType: string;
          }>,
          typeof prmt
        >({ url: '/credit/request', params: prmt });
      },

      cancel: async (prmt: {
        taxFreeAmount: number;
        taxAmount: number;
        vat: number;
        // uniqueNo: string; //(나이스 무카드 취소시 사용)
        installmentMonths: number;
        approvalNumber: string;
        approvalDate: Date;
        printReceiptStr: string;
        simplePay: number;
      }) => {
        return await this.ajaxPost<
          ApiResponseBase<{
            approvalNumber: string;
            originApprovalNumber: string;
            originApprovalDate?: Date;
            cancelApprovalDate: Date;
            cancelApprovedAmount: number;
            vat: number;
            installmentMonths: number;
            cardNumber: string;
            issuerCode: string;
            issuerName: string;
            acquirerCode: string;
            acquirerName: string;
            vanTransactionNo: string;
            merchantId: string;
            catId: string;
            //signData?: string;
            simplePayCode: string;
            simplePayName: string;
            simplePayBarcode?: string;
            cardType: string;
            catVersion?: string;
          }>,
          typeof prmt
        >({ url: '/credit/cancel', params: prmt });
      },

      cancelLast: async (prmt: {
        taxFreeAmount: number;
        taxAmount: number;
        vat: number;
        uniqueNo: string; //(나이스 무카드 취소시 사용)
        installmentMonths: number;
        approvalNumber: string;
        approvalDate: Date;
        printReceiptStr: string;
        simplePay: number;
      }) => {
        return await this.ajaxPost<
          ApiResponseBase<{
            approvalNumber: string;
            originApprovalNumber: string;
            originApprovalDate?: Date;
            cancelApprovalDate: Date;
            cancelApprovedAmount: number;
            vat: number;
            //uniqueNo: string; 
            installmentMonths: number;
            cardNumber: string;
            issuerCode: string;
            issuerName: string;
            acquirerCode: string;
            acquirerName: string;
            vanTransactionNo: string;
            merchantId: string;
            catId: string;
            signData: string;
            simplePayCode: string;
            simplePayName: string;
            simplePayBarcode?: string;
            cardType: string;
            catVersion?: string;
          }>,
          typeof prmt
        >({
          url: '/credit/cancel/last', params: prmt
        });
      },
    },

    payment: {
      list: async (prmt: SearchPaymentListRequest) => {
        const opt = {
          url: `/payment/list?approvalDate=${moment(prmt.approvalDate).format(
            'YYYY-MM-DD',
          )}`,
        };

        if (typeof prmt.payActionType !== 'undefined')
          opt.url += `&payActionType=${prmt.payActionType}`;
        if (prmt.keyword && prmt.keyword.length > 0)
          opt.url += `&keyword=${prmt.keyword}`;

        return await this.ajaxGet<
          ApiResponseBase<
            {
              isSuccess: boolean;
              vanName?: string;
              paymentId: number;
              paymentType: 'CASH' | 'CARD';
              requestType: 'APPROVE' | 'CANCEL';
              approvalNumber: string;
              approvalDate: Date;
              approvedAmount: number;
              vat: number;
              uniqueNo?: string;
              created?: string;
              canCancel: number;
            }[]
          >
        >(opt);
      },

      get: async (prmt: SearchPaymentRequest) => {
        return await this.ajaxGet<
          ApiResponseBase<{
            paymentId: number;
            isSuccess: boolean;
            returnMessage?: string;
            returnMessage2?: string;
            itemName?: string;
            vanType: number;
            connectInfo: string;
            vanId: string;
            vanName?: string;
            paymentType: 'CASH' | 'CARD';
            requestType: 'APPROVE' | 'CANCEL';
            approvalNumber: string;
            approvalDate: Date;
            approvedAmount: number;
            vat: number;
            originApprovalNumber: string;
            originApprovalDate: Date;
            issuerName: string;
            issuerCode: string;
            acquirerCode: string;
            acquirerName: string;
            merchantId: string;
            catId: string;
            catVersion: string;
            uniqueNo?: string;
            installmentMonths: number;
            cardNumber: string;
            vanTransactionNo: string;
            useSign?: boolean;
            signData?: string;
            simplePayCode?: string;
            simplePayName?: string;
            cardType?: string;
            transactionNo?: string;
            receiptType: number;
            identificationNumber?: string;
            cashReceiptMessage?: string;
            created?: Date;
            canCancel: number;
          }>
        >({
          url: `/payment/get?approvalDate=${moment(prmt.approvalDate).format(
            'YYYY-MM-DD',
          )}&approvalNumber=${prmt.approvalNumber}`,
        });
      },

      getPayment: async (prmt: SearchPaymentIdRequest) => {
        return await this.ajaxGet<ApiResponseBase<SearchPaymentResult>>({
          url: `/payment/get?paymentId=${prmt.paymentId}`,
        });
      },
      last: async () => {
        return await this.ajaxGet<
          ApiResponseBase<{
            paymentId: number;
            isSuccess: boolean;
            returnMessage?: string;
            returnMessage2?: string;
            itemName?: string;
            vanType: number;
            connectInfo: string;
            vanId: string;
            vanName?: string;
            paymentType: 'CASH' | 'CARD';
            requestType: 'APPROVE' | 'CANCEL';
            approvalNumber: string;
            approvalDate: Date;
            approvedAmount: number;
            vat: number;
            originApprovalNumber: string;
            originApprovalDate: string;
            issuerName: string;
            issuerCode: string;
            acquirerCode: string;
            acquirerName: string;
            merchantId: string;
            catId: string;
            catVersion: string;
            uniqueNo?: string;
            installmentMonths: number;
            cardNumber: string;
            vanTransactionNo: string;
            signData?: string;
            simplePayCode?: string;
            simplePayName?: string;
            cardType?: string;
            transactionNo?: string;
            receiptType: number;
            identificationNumber?: string;
            cashReceiptMessage?: string;
            created?: Date;
            canCancel: number;
          }>
        >({
          url: `/payment/last`,
        });
      },
    },

    cash: {
      request: async (prmt: {
        receiptType: 1 | 2 | 3;
        identificationNumber: string;
        identificationType: number;
        taxAmount: number;
        vat: number;
        taxFreeAmount: number;
        printSalesSlipType: number;
        printReceiptStr: string;
      }) => {
        return await this.ajaxPost<
          ApiResponseBase<{
            approvalDate: Date;
            approvedAmount: number;
            vat: number;
            approvalNumber: string;
            issuerName: string;
            transactionNo: string;
            catVersion: string;
            catId: string;
            vanNo: string;
            returnMessage?: string;
            returnMessage2?: string;
            receiptType: number;
            cashReceiptMessage?: string;
            identificationNumber: string;
          }>,
          typeof prmt
        >({
          url: '/cash/request',
          params: prmt,
        });
      },
      cancel: async (prmt: {
        receiptType: number;
        identificationNumber: string;
        taxAmount: number;
        taxFreeAmount: number;
        vat: number;
        printSalesSlipType: number;
        printReceiptStr: string;
        reasonCancel: number;
        approvalNumber: string;
        approvalDate: Date;
      }) => {
        return await this.ajaxPost<
          ApiResponseBase<{
            cancelApprovalNumber?: string;
            cancelDateTime: Date;
            originApprovalNumber?: string;
            originApprovalDate?: Date;
            cancelAmount: number;
            vat: number;
            receiptType: number;
            identificationNumber: string;
            issuerName: string;
            transactionNo: string;
            catId: string;
            vanNo: string;
            catVersion: string;
            returnMessage?: string;
            returnMessage2?: string;
            cashReceiptMessage?: string;
          }>,
          typeof prmt
        >({ url: '/cash/cancel', params: prmt });
      },
    },


    //주소체계
    setting: {
      getList: async () => {
        return await this.ajaxGet<ApiResponseBase<DevicesSetting[]>>({
          url: '/setting/get/list',
        });
      },

      setList: async (prmt: DeviceSetting[]) => {
        return await this.ajaxPost<ApiResponseBase<boolean>, typeof prmt>({
          url: '/setting/set/list',
          params: prmt,
        });
      },
    },
  };


  //---------------------------------기능---------------------------------


  /**
   * 결제처리 관련 기능
   */
  payment = {
    /**
     * 사용할 단말기 설정
     */
    setVan: async (prmt: { vanId: string }) => {
      return await this.apis.van.set(prmt);
    },

    /**
     * 카드 결제 요청 실행
     */
    request: async (prmt: PaymentRequest) => {
      //1)초기화
      const initResult = await this.apis.van.init();
      if (initResult.statusCode !== 200) return initResult;

      //2)승인요청
      const payResult = await this.apis.credit.request(prmt);

      //3)결과 확인 및 callback 처리
      if (payResult.statusCode !== 200) {
        return {
          statusCode: payResult.statusCode,
          message: payResult.message,
          result: {
            payResult: payResult.result,
            cancelResult: null
          }
        };
      }

      //4) 콜백함수 결과 false일 경우 직전결제 취소
      if (!(await prmt.callbackAction(payResult.result))) {
        const cancelResult = await this.apis.credit.cancelLast({
          taxFreeAmount: prmt.taxFreeAmount,
          taxAmount: prmt.taxAmount,
          vat: payResult.result.vat,
          uniqueNo: payResult.result.uniqueNo,
          installmentMonths: payResult.result.installmentMonths,
          approvalNumber: payResult.result.approvalNumber,
          approvalDate: payResult.result.approvalDate,
          printReceiptStr: prmt.printReceiptStr,
          simplePay: prmt.simplePay
        });

        if (cancelResult.statusCode !== 200) {
          return {
            statusCode: payResult.statusCode,
            message: payResult.message,
            result: {
              payResult: payResult.result,
              cancelResult: null
            }
          };
        }

        return {
          statusCode: payResult.statusCode,
          message: payResult.message,
          result: {
            payResult: payResult.result,
            cancelResult: cancelResult.result
          }
        };
      }

      return {
        statusCode: payResult.statusCode,
        message: payResult.message,
        result: {
          payResult: payResult.result,
          cancelResult: null
        }
      };

    },

    /**
     * Van 요청 취소
     */
    stop: async () => {
      return await this.apis.van.stop();
    },

    /**
     * 결제 진행 상태 확인
     */
    status: async () => {
      //조회
      return await this.apis.van.status();
    },

    /**
     * 결제이력 조회(관리자에서 사용)
     */
    list: async (prmt: SearchPaymentListRequest) => {
      //조회
      return await this.apis.payment.list(prmt);
    },

    /**
     * 결제이력 단건 조회(관리자에서 사용)
     */
    get: async (prmt: SearchPaymentRequest) => {
      //조회
      return await this.apis.payment.get(prmt);
    },

    /**
     * 결제이력 단건 조회(관리자에서 사용)
     */
    getPayment: async (prmt: SearchPaymentIdRequest) => {
      //조회
      var result = await this.apis.payment.getPayment(prmt);
      return result;
    },

    /**
     * 직전 결제 조회
     */
    last: async () => {
      return await this.apis.payment.last();
    },

    /**
     * 직전결제 취소요청(-> SDK 내에서 결제시 바로 사용하여 주석처리)  
    cancelLatest: async (prmt: PaymentCancelLastRequest) => {
      //취소
      const initResult = await this.apis.credit.cancelLast(prmt);
      if (initResult.statusCode !== 200) {
        return {
          statusCode: initResult.statusCode,
          message: initResult.message,
          result: null,
        };
      }
    },
    */

    /**
     * 카드 결제 취소 요청
     */
    cancel: async (prmt: PaymentCancelRequest) => {

      //1) 초기화
      const initResult = await this.apis.van.init();
      if (initResult.statusCode !== 200) {
        return {
          statusCode: initResult.statusCode,
          message: initResult.message,
          result: null,
        };
      }

      //2) 취소 요청
      return await this.apis.credit.cancel({
        taxFreeAmount: prmt.taxFreeAmount,
        taxAmount: prmt.taxAmount,
        vat: prmt.vat,
        installmentMonths: prmt.installmentMonths,
        approvalNumber: prmt.approvalNumber,
        approvalDate: prmt.approvalDate,
        printReceiptStr: prmt.printReceiptStr,
        simplePay: prmt.simplePay,
      });
    },

    cancelAdmin: async (vanId: number, prmt: PaymentCancelRequest) => {

      //1) 현재 세팅되어있는 단말기 확인 -> 없거나 해당 요청 건과 다르면 변경
      var bfVanId = -1;
      const getCurrentVan = await this.apis.van.current();
      const currentVanId = getCurrentVan.statusCode === 200 ? getCurrentVan.result?.vanId : null;

      // 1. 단말기 설정이 필요할 경우만 변경
      if (currentVanId !== vanId) {
        if (currentVanId !== null) {
          bfVanId = currentVanId;
        }

        const setVanResult = await this.apis.van.set({ vanId: vanId.toString() });

        if (setVanResult.statusCode !== 200) {
          return {
            statusCode: setVanResult.statusCode,
            message: setVanResult.message,
            result: null,
          };
        }
      }

      //2) 취소 요청
      var result = await this.apis.credit.cancel({
        taxFreeAmount: prmt.taxFreeAmount,
        taxAmount: prmt.taxAmount,
        vat: prmt.vat,
        installmentMonths: prmt.installmentMonths,
        approvalNumber: prmt.approvalNumber,
        approvalDate: prmt.approvalDate,
        printReceiptStr: prmt.printReceiptStr,
        simplePay: prmt.simplePay,
      });

      //3) 단말기 원래 값으로 변경
      if (bfVanId != vanId) {
        const setVanResult = await this.apis.van.set({ vanId: bfVanId.toString() });
        if (setVanResult.statusCode != 200) {
          //returnMsg = '단말기 변경 실패\n'+setVanResult.message;
        }
      }

      return result;
    }
  };

  /**
   * 현금영수증
   */
  cashReceipt = {
    /**
     * 현금영수증 발행
     */
    request: async (prmt: CashReceiptRequest) => {
      //1)초기화
      const initResult = await this.apis.van.init();
      if (initResult.statusCode !== 200) return initResult;

      //2)요청
      return await this.apis.cash.request(prmt);
    },

    /**
     * 현금영수증 취소
     */
    cancel: async (prmt: CashReceiptCancelRequest) => {

      //1) 초기화
      const initResult = await this.apis.van.init();
      if (initResult.statusCode !== 200) {
        return {
          statusCode: initResult.statusCode,
          message: initResult.message,
          result: null,
        };
      }

      //2) 취소 요청
      return await this.apis.cash.cancel({
        receiptType: prmt.receiptType,                    //현금영수증 타입 -> (cat 단말기 : 생략시 단말기에서 선택)
        identificationNumber: prmt.identificationNumber,  //(cat 단말기 : 생략시 단말기에서 입력)
        taxAmount: prmt.taxAmount,
        taxFreeAmount: prmt.taxFreeAmount,
        vat: prmt.vat,
        printSalesSlipType: prmt.printSalesSlipType ?? 0,     //전표출력 종류 (cat 단말기 : 생략시 단말기에서 선택)
        reasonCancel: prmt.cancelReason ?? 0,
        approvalNumber: prmt.approvalNumber,
        approvalDate: prmt.approvalDate,
        printReceiptStr: prmt.printReceiptStr ?? '',
      });
    },

    /**
     * 현금영수증 취소
     */
    cancelAdmin: async (vanId: number, prmt: CashReceiptCancelRequest) => {

      //1) 현재 세팅되어있는 단말기 확인 -> 없거나 해당 요청 건과 다르면 변경
      var bfVanId = -1;
      const getCurrentVan = await this.apis.van.current();
      const currentVanId = getCurrentVan.statusCode === 200 ? getCurrentVan.result?.vanId : null;

      // 1. 단말기 설정이 필요할 경우만 변경
      if (currentVanId !== vanId) {
        if (currentVanId !== null) {
          bfVanId = currentVanId;
        }

        const setVanResult = await this.apis.van.set({ vanId: vanId.toString() });

        if (setVanResult.statusCode !== 200) {
          return {
            statusCode: setVanResult.statusCode,
            message: setVanResult.message,
            result: null,
          };
        }
      }

      //2) 취소 요청
      var result = await this.apis.cash.cancel({
        receiptType: prmt.receiptType,                    //현금영수증 타입 -> (cat 단말기 : 생략시 단말기에서 선택)
        identificationNumber: prmt.identificationNumber,  //(cat 단말기 : 생략시 단말기에서 입력)
        taxAmount: prmt.taxAmount,
        taxFreeAmount: prmt.taxFreeAmount,
        vat: prmt.vat,
        printSalesSlipType: prmt.printSalesSlipType ?? 0,     //전표출력 종류 (cat 단말기 : 생략시 단말기에서 선택)
        reasonCancel: prmt.cancelReason ?? 0,
        approvalNumber: prmt.approvalNumber,
        approvalDate: prmt.approvalDate,
        printReceiptStr: prmt.printReceiptStr ?? '',
      });

      //3) 단말기 원래 값으로 변경
      if (bfVanId != vanId) {
        const setVanResult = await this.apis.van.set({ vanId: bfVanId.toString() });
        if (setVanResult.statusCode != 200) {
          //returnMsg = '단말기 변경 실패\n'+setVanResult.message;
        }
      }

      return result;

    },

  };

  /**
   * 설정
   */
  setting = {
    /**
     * 결제수단별 구성정보 읽어오기
     */
    getList: async () => {
      return await this.apis.setting.getList();
    },

    /**
     * 결제수단별 구성정보 설정하기
     */
    setList: async (prmt: DeviceSetting[]) => {
      return await this.apis.setting.setList(prmt);
    },

    openAdmin: async () => {
      window.open(globalOptions.baseURL, '_blank');
    }

  };

  /**
   * 기기연동기능 
   */
  devices = {
    connect: async (vanId: number) => {
      return this.apis.van.connect(vanId);
    },
    /**
     * 사인패드 서명 받기
     */
    getSign: async () => {
      return this.apis.van.sign();
    },

    /**
     * QR코드 스캔
     */
    scanQr: async () => {
      return await this.apis.van.barcode();
    },

    /**
     * 영수증 프린터 인쇄요청
     */
    printReceipt: async (prmt: { content: string }) => {
      return await this.apis.van.print(prmt);
    },

    /** 
     * 현재 단말기 정보 조회 *
    */
    getCurrentVan: async () => {
      return await this.apis.van.current();
    },

    /** 
     * 초기화 *
    */
    initVan: async () => {
      return await this.apis.van.init();
    },

    /** 
     * catid 정보 조회 *
    */
    getCatId: async () => {
      return await this.apis.van.catId();
    },

    // /**
    //  * 일반 프린터 인쇄요청 - 추후 필요시 구현
    //  */
    // print: async () => {},
  };
}
