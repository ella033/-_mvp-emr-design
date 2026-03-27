"use client";

import { useConsentRequests, ConsentRequestCard } from "@/domains/consent";

export default function TabletConsentPage() {
  const { consentRequests, startRequest, completeRequest, isConnected } = useConsentRequests();

  const handleCardClick = (request: any) => {
    console.log('동의서 작성:', request);
    startRequest(request.id);
  };

  return (
    <div className="space-y-6" data-testid="tablet-consent-page">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          동의서 작성 대기
        </h1>
        <p className="text-gray-600">
          접수에서 요청된 동의서를 작성해주세요
        </p>
        <div className="mt-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? '🟢 연결됨' : '🔴 연결 끊어짐'}
          </span>
        </div>
      </div>

      {consentRequests.length === 0 ? (
        <div className="text-center py-16" data-testid="tablet-consent-empty-state">
          <div className="text-gray-400 text-xl mb-4">
            📋
          </div>
          <p className="text-gray-500">
            대기 중인 동의서 요청이 없습니다
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="tablet-consent-request-list">
          {consentRequests.map((request) => (
            <ConsentRequestCard
              key={request.id}
              request={request}
              onClick={() => handleCardClick(request)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
