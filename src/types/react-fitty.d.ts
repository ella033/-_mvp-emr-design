declare module "react-fitty" {
  import React from "react";

  /**
   * 텍스트를 부모 컨테이너 너비에 맞게 자동으로 크기 조절하는 컴포넌트
   */
  export const ReactFitty: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      /** 최소 폰트 사이즈 (px), 기본값: 16 */
      minSize?: number;
      /** 최대 폰트 사이즈 (px), 기본값: 512 */
      maxSize?: number;
      /** 최소 폰트 사이즈 도달 시 줄바꿈 허용 여부, 기본값: false */
      wrapText?: boolean;
    } & React.RefAttributes<HTMLElement>
  >;
}
