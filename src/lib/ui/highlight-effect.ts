import { useRef, useCallback } from "react";

/**
 * 카드 웨이브 하이라이트 애니메이션 유틸리티.
 *
 * 사용법 1 — 순수함수 (React 없이 어디서든):
 *   highlightElement(document.getElementById("my-card"));
 *
 * 사용법 2 — React 훅:
 *   const { ref, trigger } = useHighlightEffect();
 *   <div ref={ref} />
 *   trigger(); // 하이라이트 발동
 *
 * CSS 의존:
 *   - globals.css의 `.animate-blue-glow` 클래스
 *   - keyframe-animations.scss의 `@keyframes cardWaveEffect`
 *   - figma-colors.css의 `--bg-card-effect` 변수
 */

const DEFAULT_CLASS = "animate-blue-glow";
const DEFAULT_DURATION = 500; // ms, keyframe 0.5s와 일치

/**
 * DOM element에 파란 글로우 하이라이트 효과를 적용하는 순수함수.
 * React 없이 어디서든 사용 가능.
 *
 * @param el - 하이라이트할 HTML element (null이면 무시)
 * @param options.className - 적용할 애니메이션 클래스 (기본: "animate-blue-glow")
 * @param options.duration - 애니메이션 1회 지속 시간 ms (기본: 500)
 * @param options.iterationCount - 애니메이션 반복 횟수 (기본: 2, CSS 변수 --highlight-count로 전달)
 */
export function highlightElement(
  el: HTMLElement | null,
  options?: { className?: string; duration?: number; iterationCount?: number }
): void {
  if (!el) return;

  const cls = options?.className ?? DEFAULT_CLASS;
  const dur = options?.duration ?? DEFAULT_DURATION;
  const count = options?.iterationCount;

  // 이미 실행 중이면 제거 후 reflow 강제로 재시작
  el.classList.remove(cls);
  if (count != null) {
    el.style.setProperty("--highlight-count", String(count));
  } else {
    el.style.removeProperty("--highlight-count");
  }
  void el.offsetWidth;
  el.classList.add(cls);

  const cleanup = () => {
    el.classList.remove(cls);
    el.style.removeProperty("--highlight-count");
  };

  // animationend 이벤트로 정확한 타이밍에 정리
  el.addEventListener("animationend", cleanup, { once: true });

  // 안전장치: animationend 미발생 시 fallback timeout
  const totalDuration = dur * (count ?? 2);
  setTimeout(cleanup, totalDuration + 200);
}

/**
 * React 컴포넌트용 훅.
 * trigger()를 호출하면 ref로 연결된 element에 하이라이트 적용.
 *
 * @example
 * const { ref, trigger } = useHighlightEffect();
 * // ...
 * <div ref={ref}>내용</div>
 * // 이벤트 발생 시:
 * trigger();
 */
export function useHighlightEffect(
  options?: { className?: string; duration?: number; iterationCount?: number }
) {
  const elRef = useRef<HTMLElement | null>(null);

  const trigger = useCallback(() => {
    highlightElement(elRef.current, options);
  }, [options?.className, options?.duration, options?.iterationCount]);

  return { ref: elRef, trigger };
}
