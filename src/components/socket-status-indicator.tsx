"use client";
import React from "react";
import { useSocket } from "@/contexts/SocketContext";

function Dot({ color, title }: { color: string; title: string }) {
  return (
    <div className="inline-flex items-center gap-1" title={title}>
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
    </div>
  );
}

export default function SocketStatusIndicator() {
  const { socket, hospitalAgentOnline, localAgentStatus } = useSocket();

  const socketConnected = !!socket && socket.connected;

  // 녹색: 소켓 연결 + 병원 내 에이전트 1명 이상 연결 (출력 가능)
  // 노랑: 소켓 연결 + 병원 에이전트 없음
  // 빨강: 소켓 미연결
  const color = socketConnected
    ? hospitalAgentOnline
      ? "bg-green-500"
      : "bg-yellow-500"
    : "bg-red-500";

  const localHint =
    localAgentStatus === "offline"
      ? " (이 PC 에이전트 미실행)"
      : "";
  const title = socketConnected
    ? hospitalAgentOnline
      ? `Socket + 병원 에이전트 연결됨${localHint}`
      : `Socket 연결됨, 병원 에이전트 없음${localHint}`
    : "Socket 연결 끊김";

  return <Dot color={color} title={title} />;
}


