// 이 파일은 Vitest 테스트 환경의 전역 설정 파일입니다.
//
// - vitest-fail-on-console: 테스트 중 console.log, console.error 등 콘솔 출력이 발생하면 테스트를 실패하게 만듭니다.
//   (불필요한 콘솔 출력이 테스트에 남지 않도록 강제)
// - @testing-library/jest-dom/vitest: jest-dom의 matcher를 Vitest 환경에서 사용할 수 있게 해줍니다.

import failOnConsole from "vitest-fail-on-console";
import "@testing-library/jest-dom/vitest";

failOnConsole({
  shouldFailOnDebug: true, // console.debug 발생 시 테스트 실패
  shouldFailOnError: true, // console.error 발생 시 테스트 실패
  shouldFailOnInfo: true, // console.info 발생 시 테스트 실패
  shouldFailOnLog: true, // console.log 발생 시 테스트 실패
  shouldFailOnWarn: true, // console.warn 발생 시 테스트 실패
});
