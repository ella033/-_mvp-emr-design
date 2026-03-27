import { create } from "zustand";

interface TermsAgreeState {
  terms: boolean; // 서비스 이용약관 동의
  privacy: boolean; // 개인정보 수집 및 이용 동의
  setTermsAgreement: (terms: boolean, privacy: boolean) => void;
  resetTermsAgreement: () => void;
  isAllRequiredAgreed: () => boolean;
}

export const useTermsAgreeStore = create<TermsAgreeState>((set, get) => ({
  terms: false,
  privacy: false,

  setTermsAgreement: (terms: boolean, privacy: boolean) => {
    set({ terms, privacy });
  },

  resetTermsAgreement: () => {
    set({ terms: false, privacy: false });
  },

  isAllRequiredAgreed: () => {
    const { terms, privacy } = get();
    return terms && privacy;
  },
}));
