import { ApiClient } from '@/lib/api/api-client';
import { formsApi } from '@/lib/api/api-routes';
import type { components } from '@/generated/api/types';

type GetFormFavoritesResponseDto =
  components['schemas']['GetFormFavoritesResponseDto'];
type GetFormByIdResponseDto = components['schemas']['GetFormByIdResponseDto'];
type GetFormsSearchResponseDto =
  components['schemas']['GetFormsSearchResponseDto'];
type BulkUpdateFormFieldsDto =
  components['schemas']['BulkUpdateFormFieldsDto'];

export class FormsService {
  static async getFormsHierarchy(
    formName?: string
  ): Promise<GetFormFavoritesResponseDto> {
    const trimmedFormName = formName?.trim();
    const params = trimmedFormName ? { formName: trimmedFormName } : undefined;

    return await ApiClient.get<GetFormFavoritesResponseDto>(
      formsApi.hierarchy(),
      params
    );
  }

  static async searchForms(formName?: string): Promise<GetFormsSearchResponseDto> {
    const trimmedFormName = formName?.trim();
    const params = trimmedFormName ? { formName: trimmedFormName } : undefined;

    return await ApiClient.get<GetFormsSearchResponseDto>(formsApi.search(), params);
  }

  static async addFavorite(formId: number): Promise<void> {
    await ApiClient.post<void>(formsApi.favorites(), { formId });
  }

  static async removeFavorite(formId: number): Promise<void> {
    await ApiClient.delete<void>(formsApi.favorite(formId));
  }

  static async getFormById(formId: number, options?: { raw?: boolean }): Promise<GetFormByIdResponseDto> {
    const params = options?.raw ? { raw: 'true' } : undefined;
    return await ApiClient.get<GetFormByIdResponseDto>(formsApi.form(formId), params);
  }

  static async getFormByIdWithPatient(
    formId: number,
    patientId: number
  ): Promise<GetFormByIdResponseDto> {
    return await ApiClient.get<GetFormByIdResponseDto>(
      formsApi.formWithPatient(formId, patientId)
    );
  }

  static async bulkUpdateFormFields(
    data: BulkUpdateFormFieldsDto
  ): Promise<void> {
    await ApiClient.put<void>(formsApi.fields(), data);
  }

  static async bulkUpdateFormFieldsForAdmin(
    data: BulkUpdateFormFieldsDto
  ): Promise<void> {
    // FIXME: 임시로 ForAdmin API 사용 중이며, 추후 삭제 예정
    await ApiClient.put<void>(formsApi.fieldsForAdmin(), data);
  }

}


