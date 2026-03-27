export type ClaimFormFieldKey =
  | "medicalInstitutionNumber"
  | "applicationNumber"
  | "writerName"
  | "memo";

export type MaterialClaimItemFieldKey =
  | "claimCode"
  | "name"
  | "specification"
  | "unit"
  | "upperLimitAmount"
  | "purchaseDate"
  | "purchaseQuantity"
  | "unitPrice"
  | "totalAmount"
  | "prepayType"
  | "vendorName"
  | "vendorBusinessNumber";

export type PreparationClaimItemFieldKey =
  | "preparationType"
  | "administrationRoute"
  | "code"
  | "name"
  | "specification"
  | "unit"
  | "claimPrice"
  | "priceAppliedDate"
  | "reportDate"
  | "mainEfficacyGroup"
  | "usageMethod"
  | "efficacy";

const FIELD_ERROR_KEYWORDS: Record<ClaimFormFieldKey, string[]> = {
  medicalInstitutionNumber: [
    "요양기관번호",
    "요양기관 번호",
    "요양기관코드",
    "기관번호",
    "medicalinstitutionnumber",
    "medical institution number",
  ],
  applicationNumber: [
    "신청번호",
    "신청 번호",
    "applicationnumber",
    "application number",
  ],
  writerName: ["작성자", "작성자명", "writername", "writer name"],
  memo: ["메모", "memo"],
};

const MATERIAL_ITEM_FIELD_ERROR_KEYWORDS: Record<
  MaterialClaimItemFieldKey,
  string[]
> = {
  claimCode: ["청구코드", "재료코드", "claimcode", "code"],
  name: ["한글명칭", "품명", "재료명", "productname", "name"],
  specification: ["규격", "specification"],
  unit: ["단위", "unit"],
  upperLimitAmount: ["상한금액", "상한 금액", "upperlimitamount", "upper limit"],
  purchaseDate: ["구입일자", "구입 일자", "purchasedate", "purchase date"],
  purchaseQuantity: ["구입량", "구입 수량", "purchasequantity", "purchase quantity"],
  unitPrice: ["개당단가", "단가", "unitprice", "unit price"],
  totalAmount: ["총실구입가", "총 구입가", "purchaseprice", "totalamount", "total amount"],
  prepayType: ["선납구분", "선납 구분", "prepaytype", "prepay type"],
  vendorName: ["구입기관명", "구입처 상호", "구입처", "suppliername", "vendorname"],
  vendorBusinessNumber: [
    "구입기관사업장등록번호",
    "구입기관 사업장 등록번호",
    "구입처 사업자등록번호",
    "사업자등록번호",
    "supplierbiznumber",
    "vendorbusinessnumber",
  ],
};

const PREPARATION_ITEM_FIELD_ERROR_KEYWORDS: Record<
  PreparationClaimItemFieldKey,
  string[]
> = {
  preparationType: ["조제", "제제", "mixturetype", "preparationtype"],
  administrationRoute: ["투여형태", "투여 형태", "administrationtype", "administrationroute"],
  code: ["코드", "조제/제제코드", "drugcode", "code"],
  name: ["품명", "약품명", "productname", "name"],
  specification: ["규격", "specification"],
  unit: ["단위", "unit"],
  claimPrice: ["청구가", "claimprice", "claim price"],
  priceAppliedDate: ["가격적용일", "적용일", "priceeffectivedate", "price applied"],
  reportDate: ["신고일", "reportdate", "report date"],
  mainEfficacyGroup: ["주요효능군", "주요 효능군", "majorefficacygroup"],
  usageMethod: ["용법/용량", "용법용량", "dosage", "usagemethod"],
  efficacy: ["효능", "효과", "efficacy"],
};

const normalizeClaimApiErrors = (claimApiErrors?: string[]) => {
  if (!Array.isArray(claimApiErrors)) return [];
  return claimApiErrors
    .map((errorMessage) => String(errorMessage).trim())
    .filter((errorMessage) => errorMessage.length > 0);
};

const includesKeyword = (sourceText: string, keywords: string[]) => {
  const lowerCaseSourceText = sourceText.toLowerCase();
  return keywords.some((keyword) =>
    lowerCaseSourceText.includes(keyword.toLowerCase())
  );
};

const normalizeErrorCodeText = (sourceText: string): string => {
  return sourceText.replace(/[^a-z0-9]/gi, "").toLowerCase();
};

const normalizeKoreanText = (sourceText: string): string => {
  return sourceText.replace(/\s+/g, "").trim();
};

const parseFieldTokensFromErrorMessage = (errorMessage: string): string[] => {
  const tokens: string[] = [];
  const bracketPattern = /\[([^\]]+)\]/g;
  const fieldPattern = /field\s*[:=]\s*([a-zA-Z0-9_.-]+)/gi;
  const codePattern = /(?:code|error)\s*[:=]\s*([a-zA-Z0-9_.-]+)/gi;

  for (const pattern of [bracketPattern, fieldPattern, codePattern]) {
    const matches = errorMessage.matchAll(pattern);
    for (const match of matches) {
      const rawToken = String(match[1] ?? "").trim();
      if (rawToken.length > 0) {
        tokens.push(rawToken);
      }
    }
  }

  return tokens;
};

const extractKoreanFieldLabel = (errorMessage: string): string | null => {
  const patterns = [
    /^(.+?)이\(가\)/,
    /^(.+?)가\)/,
    /^(.+?)은\(는\)/,
    /^(.+?)을\(를\)/,
  ];

  for (const pattern of patterns) {
    const matched = errorMessage.match(pattern);
    const candidate = String(matched?.[1] ?? "").trim();
    if (candidate.length > 0) {
      return candidate;
    }
  }

  return null;
};

const isMatchedByKeywordOrToken = (
  errorMessage: string,
  keywords: string[]
): boolean => {
  const extractedKoreanFieldLabel = extractKoreanFieldLabel(errorMessage);
  if (extractedKoreanFieldLabel) {
    const normalizedLabel = normalizeKoreanText(extractedKoreanFieldLabel);
    const hasExactLabelMatch = keywords.some(
      (keyword) => normalizeKoreanText(keyword) === normalizedLabel
    );
    if (hasExactLabelMatch) {
      return true;
    }
  }

  if (includesKeyword(errorMessage, keywords)) {
    return true;
  }

  const normalizedMessage = normalizeErrorCodeText(errorMessage);
  const parsedTokens = parseFieldTokensFromErrorMessage(errorMessage).map(
    normalizeErrorCodeText
  );
  const normalizedKeywords = keywords.map(normalizeErrorCodeText);

  return normalizedKeywords.some((keyword) => {
    if (!keyword) return false;
    if (normalizedMessage.includes(keyword)) return true;
    return parsedTokens.some(
      (token) => token.includes(keyword) || keyword.includes(token)
    );
  });
};

export const mapClaimApiErrorsToFieldMessages = (
  claimApiErrors?: string[]
): Partial<Record<ClaimFormFieldKey, string>> => {
  const normalizedErrors = normalizeClaimApiErrors(claimApiErrors);

  if (normalizedErrors.length === 0) return {};

  const fieldMessages: Partial<Record<ClaimFormFieldKey, string[]>> = {};

  normalizedErrors.forEach((errorMessage) => {
    (Object.keys(FIELD_ERROR_KEYWORDS) as ClaimFormFieldKey[]).forEach(
      (fieldKey) => {
        if (
          isMatchedByKeywordOrToken(errorMessage, FIELD_ERROR_KEYWORDS[fieldKey])
        ) {
          const previousMessages = fieldMessages[fieldKey] ?? [];
          fieldMessages[fieldKey] = [...previousMessages, errorMessage];
        }
      }
    );
  });

  return (Object.keys(fieldMessages) as ClaimFormFieldKey[]).reduce<
    Partial<Record<ClaimFormFieldKey, string>>
  >((accumulator, fieldKey) => {
    const messages = fieldMessages[fieldKey] ?? [];
    if (messages.length > 0) {
      accumulator[fieldKey] = messages.join("\n");
    }
    return accumulator;
  }, {});
};

export const mapMaterialClaimApiErrorsToItemFieldMessages = (
  claimApiErrors?: string[]
): Partial<Record<MaterialClaimItemFieldKey, string>> => {
  const normalizedErrors = normalizeClaimApiErrors(claimApiErrors);
  if (normalizedErrors.length === 0) return {};

  const fieldMessages: Partial<Record<MaterialClaimItemFieldKey, string[]>> = {};

  normalizedErrors.forEach((errorMessage) => {
    (Object.keys(MATERIAL_ITEM_FIELD_ERROR_KEYWORDS) as MaterialClaimItemFieldKey[]).forEach(
      (fieldKey) => {
        if (
          isMatchedByKeywordOrToken(
            errorMessage,
            MATERIAL_ITEM_FIELD_ERROR_KEYWORDS[fieldKey]
          )
        ) {
          const previousMessages = fieldMessages[fieldKey] ?? [];
          fieldMessages[fieldKey] = [...previousMessages, errorMessage];
        }
      }
    );
  });

  return (Object.keys(fieldMessages) as MaterialClaimItemFieldKey[]).reduce<
    Partial<Record<MaterialClaimItemFieldKey, string>>
  >((accumulator, fieldKey) => {
    const messages = fieldMessages[fieldKey] ?? [];
    if (messages.length > 0) {
      accumulator[fieldKey] = messages.join("\n");
    }
    return accumulator;
  }, {});
};

export const mapPreparationClaimApiErrorsToItemFieldMessages = (
  claimApiErrors?: string[]
): Partial<Record<PreparationClaimItemFieldKey, string>> => {
  const normalizedErrors = normalizeClaimApiErrors(claimApiErrors);
  if (normalizedErrors.length === 0) return {};

  const fieldMessages: Partial<Record<PreparationClaimItemFieldKey, string[]>> =
    {};

  normalizedErrors.forEach((errorMessage) => {
    (Object.keys(
      PREPARATION_ITEM_FIELD_ERROR_KEYWORDS
    ) as PreparationClaimItemFieldKey[]).forEach((fieldKey) => {
      if (
        isMatchedByKeywordOrToken(
          errorMessage,
          PREPARATION_ITEM_FIELD_ERROR_KEYWORDS[fieldKey]
        )
      ) {
        const previousMessages = fieldMessages[fieldKey] ?? [];
        fieldMessages[fieldKey] = [...previousMessages, errorMessage];
      }
    });
  });

  return (Object.keys(fieldMessages) as PreparationClaimItemFieldKey[]).reduce<
    Partial<Record<PreparationClaimItemFieldKey, string>>
  >((accumulator, fieldKey) => {
    const messages = fieldMessages[fieldKey] ?? [];
    if (messages.length > 0) {
      accumulator[fieldKey] = messages.join("\n");
    }
    return accumulator;
  }, {});
};
