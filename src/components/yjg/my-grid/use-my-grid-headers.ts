import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MyGridHeaderType } from "./my-grid-type";
import { getInitialHeaders, saveHeaders } from "./my-grid-util";
import { useSettingsStore } from "@/store/settings-store";

type UseMyGridHeadersParams = {
  /**
   * settings-store에 저장되는 pageContext 키
   * 예) "reception.consent-list.headers"
   */
  lsKey: string;
  /**
   * 기본 헤더(개발자가 선언한 width 포함). 저장된 설정이 있으면 merge된 결과가 최종 baseWidth가 된다.
   */
  defaultHeaders: MyGridHeaderType[];
  /**
   * 화면 폭에 맞춰 표시용 width를 비율 계산으로 자동 적용할지.
   * - savedHeaders가 존재하면 이 값이 true여도 무시된다(=fittingScreen false)
   */
  fittingScreen?: boolean;
};

type UseMyGridHeadersResult = {
  /**
   * 상태로 관리되는 base headers(저장/유저 변경의 대상)
   */
  headers: MyGridHeaderType[];
  /**
   * 유저 변경으로 간주되는 setter. (초기 로드/동기화는 내부에서 별도 처리)
   */
  setHeadersAction: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  /**
   * MyGrid에 내려줄 실제 fittingScreen 값
   * (savedHeaders가 있으면 false)
   */
  fittingScreen: boolean;
  /**
   * savedHeaders 존재 여부
   */
  hasSavedHeaders: boolean;
};

/**
 * MyGrid의 헤더 저장/초기화/getInitialHeaders + fittingScreen(saveHeaders 비활성) 규칙을 캡슐화한 훅.
 *
 * 규칙:
 * - 초기 baseWidth 우선순위: savedHeaders(width) > defaultHeaders.width > defaultWidth
 * - fittingScreen=true일 때는 "표시용 width"만 변하고 base headers는 변하지 않으므로 saveHeaders를 수행하지 않는다.
 * - savedHeaders가 존재하면 fittingScreen은 무시된다(=false) 그리고 저장/변경이 정상 동작한다.
 * - settings가 늦게 로드되면(savedHeaders가 뒤늦게 생기면) 유저가 변경하기 전일 때만 1회 동기화한다.
 * - saveHeaders는 "유저가 실제로 변경한 경우"에만 수행한다.
 */
export function useMyGridHeaders(
  params: UseMyGridHeadersParams
): UseMyGridHeadersResult {
  const { lsKey, defaultHeaders, fittingScreen: requestedFittingScreen = false } =
    params;

  const savedHeaders = useSettingsStore(
    (s) => s.getSettingsByCategoryAndPageContext("grid-header", lsKey)?.settings?.headers
  ) as unknown;

  const hasSavedHeaders =
    Array.isArray(savedHeaders) && (savedHeaders as any[]).length > 0;

  const fittingScreen = requestedFittingScreen && !hasSavedHeaders;

  const [headers, setHeaders] = useState<MyGridHeaderType[]>(() =>
    getInitialHeaders(lsKey, defaultHeaders)
  );

  // settings가 늦게 로드되는 케이스를 대비: savedHeaders가 생기면 한 번만 적용(유저 변경이 없을 때만).
  const userModifiedRef = useRef(false);
  const syncingFromStoreRef = useRef(false);
  useEffect(() => {
    if (!hasSavedHeaders) return;
    if (userModifiedRef.current) return;

    syncingFromStoreRef.current = true;
    setHeaders(getInitialHeaders(lsKey, defaultHeaders));
    queueMicrotask(() => {
      syncingFromStoreRef.current = false;
    });
  }, [hasSavedHeaders, lsKey, defaultHeaders]);

  const setHeadersAction = useCallback<
    React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>
  >((next) => {
    userModifiedRef.current = true;
    setHeaders(next);
  }, []);

  // 헤더 변경 시(리사이즈/순서변경/고정 등) 500ms debounce로 서버에 저장
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (syncingFromStoreRef.current) return;
    if (!userModifiedRef.current) return;
    if (headers.length === 0) return;

    saveHeaders(lsKey, headers);
  }, [headers, fittingScreen, lsKey]);

  return useMemo(
    () => ({
      headers,
      setHeadersAction,
      fittingScreen,
      hasSavedHeaders,
    }),
    [headers, setHeadersAction, fittingScreen, hasSavedHeaders]
  );
}


