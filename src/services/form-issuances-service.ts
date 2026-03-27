import { ApiClient } from "@/lib/api/api-client";
import { formIssuancesApi } from "@/lib/api/api-routes";
import type { components } from "@/generated/api/types";

type GetFormIssuancesResponseDto =
  components["schemas"]["GetFormIssuancesResponseDto"];
type GetFormIssuanceByIdResponseDto =
  components["schemas"]["GetFormIssuanceByIdResponseDto"];
type CreateFormIssuanceDto = components["schemas"]["CreateFormIssuanceDto"];
type UpdateFormIssuanceDto = components["schemas"]["UpdateFormIssuanceDto"];
type FormIssuanceResultDto = components["schemas"]["FormIssuanceResultDto"];

export type GetFormIssuancesParams = {
  from: string;
  to: string;
  patientId?: number;
  formId?: number;
};

export class FormIssuancesService {
  static async getFormIssuances(
    params: GetFormIssuancesParams
  ): Promise<GetFormIssuancesResponseDto> {
    const requestParams = this.buildParams(params);
    return await ApiClient.get<GetFormIssuancesResponseDto>(
      formIssuancesApi.list(),
      requestParams
    );
  }

  static async getFormIssuanceById(
    issuanceId: number
  ): Promise<GetFormIssuanceByIdResponseDto> {
    return await ApiClient.get<GetFormIssuanceByIdResponseDto>(
      formIssuancesApi.detail(issuanceId)
    );
  }

  static async createFormIssuance(body: CreateFormIssuanceDto): Promise<FormIssuanceResultDto> {
    return await ApiClient.post<FormIssuanceResultDto>(formIssuancesApi.list(), body);
  }

  static async updateFormIssuance(
    issuanceId: number,
    body: UpdateFormIssuanceDto
  ): Promise<FormIssuanceResultDto> {
    return await ApiClient.patch<FormIssuanceResultDto>(formIssuancesApi.detail(issuanceId), body);
  }

  private static buildParams(
    params: GetFormIssuancesParams
  ): Record<string, string> {
    const requestParams: Record<string, string> = {
      from: params.from,
      to: params.to,
    };

    if (params.patientId !== undefined) {
      requestParams.patientId = String(params.patientId);
    }

    if (params.formId !== undefined) {
      requestParams.formId = String(params.formId);
    }

    return requestParams;
  }
}


