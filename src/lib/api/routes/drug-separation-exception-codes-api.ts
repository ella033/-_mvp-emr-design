// 의약분업 예외코드 목록 조회 (지역=1, 환자=2, 약품=3)
export const drugSeparationExceptionCodesApi = {
  list: (type: number) => `/drug-separation-exception-codes?type=${type}`,
};
