export interface SpecimenLibrary {
  id: number;
  code: string;
  name: string;
  /** 영문명. 빈 문자열/null이면 select 옵션에서 제외 */
  nameEn?: string | null;
}
