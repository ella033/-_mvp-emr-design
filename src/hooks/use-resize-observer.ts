import { useEffect, useRef, useState } from "react";

export function useResizeObserver<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    // 서버 사이드에서 실행되는 경우 window 객체가 없으므로 return
    if (typeof window === "undefined") return;

    const element = ref.current;

    const updateSize = () => {
      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    };

    updateSize();

    const observer = new window.ResizeObserver(() => {
      updateSize();
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref.current]);

  return [ref, size] as const;
}
