"use client";

import dynamic from "next/dynamic";

/**
 * agentation 패키지는 모듈 최상위 스코프에서 <style> 태그를 DOM에 직접 주입하는
 * 사이드 이펙트가 있음. 주입되는 CSS에 `svg[fill=none] { fill: none !important; }` 규칙이
 * 포함되어 있어서, 정적 import 시 NEXT_PUBLIC_ENABLE_AGENTATION=false여도
 * import만으로 스타일이 주입되어 Lucide 아이콘(Star, Circle 등)의 fill 속성이
 * 강제로 none이 되는 문제가 발생함.
 *
 * dynamic import를 사용하면 조건 분기에서 return null 이후에는
 * import("agentation") 자체가 실행되지 않으므로 사이드 이펙트를 방지할 수 있음.
 */
const Agentation = dynamic(
  () => import("agentation").then((mod) => mod.Agentation),
  { ssr: false }
);

export function AgentationWrapper() {
  // 개발 환경이 아니거나, 환경 변수가 설정되지 않으면 표시 안 함
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.NEXT_PUBLIC_ENABLE_AGENTATION !== "true"
  ) {
    return null;
  }

  return (
    <Agentation
      endpoint="http://localhost:4747"
      onSessionCreated={(sessionId: string) => {
        console.log("Agentation session started:", sessionId);
      }}
    />
  );
}
