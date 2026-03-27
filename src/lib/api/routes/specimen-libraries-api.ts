export const specimenLibrariesApi = {
  /** keyword 없으면 전체 목록. queryString 빈 문자열이면 ? 없이 반환 */
  list: (queryString: string) =>
    queryString ? `/specimen-libraries?${queryString}` : "/specimen-libraries",
};
