import { ExistingCert } from "@/services/certs-service";

export type Certificate = ExistingCert & {
  // Frontend computed status
  status: 'active' | 'expired';
};

export interface LoginSettings {
  autoLogin: boolean;
  password?: string;
}

// For UI state - we need to track 4 specific file slots
export type CertFiles = {
  signCert: File | null;
  signKey: File | null;
  kmCert: File | null;
  kmKey: File | null;
};
