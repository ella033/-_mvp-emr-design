import { useState } from "react";
import { useConsentSocket } from "./use-consent-socket";
import type { ConsentRequest, ConsentData } from "../types";

export function useConsentRequests() {
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);

  // 소켓 이벤트 처리
  const { sendConsentCompleted, isConnected } = useConsentSocket({
    onConsentRequest: (data) => {
      const newRequest: ConsentRequest = {
        ...data,
        id: `consent-${Date.now()}`,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      setConsentRequests(prev => [newRequest, ...prev]);
    }
  });

  // 동의서 상태 업데이트
  const updateRequestStatus = (requestId: string, status: ConsentRequest['status']) => {
    setConsentRequests(prev => 
      prev.map(item => 
        item.id === requestId 
          ? { ...item, status }
          : item
      )
    );
  };

  // 동의서 완료 처리
  const completeRequest = (requestId: string, consentData: Omit<ConsentData, 'completedAt'>) => {
    updateRequestStatus(requestId, 'completed');

    const completedData: ConsentData = {
      ...consentData,
      completedAt: new Date().toISOString()
    };

    sendConsentCompleted(completedData);
  };

  // 동의서 시작
  const startRequest = (requestId: string) => {
    updateRequestStatus(requestId, 'in_progress');
  };

  // 요청 제거
  const removeRequest = (requestId: string) => {
    setConsentRequests(prev => prev.filter(item => item.id !== requestId));
  };

  return {
    consentRequests,
    startRequest,
    completeRequest,
    removeRequest,
    isConnected
  };
}