/**
 * 크로스 윈도우 그리드 커맨드 채널
 *
 * 팝아웃 창 ↔ 부모 창 간에 진단/처방/묶음처방 추가 커맨드를 직접 전달합니다.
 * Zustand store sync와 분리하여 race condition 없이 동작합니다.
 *
 * 패턴: Producer → BroadcastChannel → Consumer (useEffect 없이 직접 전달)
 */

import type { DiseaseBase } from "@/types/chart/disease-types";
import type { OrderBase } from "@/types/chart/order-types";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";

const CHANNEL_NAME = "grid-command-channel";

export type GridCommand =
  | { type: "add-diseases"; diseases: DiseaseBase[] }
  | { type: "add-orders"; orders: OrderBase[] }
  | { type: "add-bundle"; bundle: Bundle };

type GridCommandHandler = (command: GridCommand) => void;

let _channel: BroadcastChannel | null = null;
let _handler: GridCommandHandler | null = null;

function getChannel(): BroadcastChannel {
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
    _channel.onmessage = (e: MessageEvent<GridCommand>) => {
      if (_handler && e.data?.type) {
        _handler(e.data);
      }
    };
  }
  return _channel;
}

/** 커맨드 전송 (Producer 측에서 호출) */
export function postGridCommand(command: GridCommand) {
  try {
    getChannel().postMessage(command);
  } catch {
    // 직렬화 실패 시 무시
  }
}

/**
 * 커맨드 수신 핸들러 등록 (Consumer 측에서 호출)
 * 한 번에 하나의 핸들러만 등록됩니다.
 */
export function onGridCommand(handler: GridCommandHandler) {
  getChannel(); // 채널 초기화
  _handler = handler;
}

/** 핸들러 해제 */
export function offGridCommand() {
  _handler = null;
}
