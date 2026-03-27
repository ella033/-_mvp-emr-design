import { Certificate, LoginSettings } from "../model/types";

const MOCK_DELAY = 500;

export const fetchCertificate = async (): Promise<Certificate | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return mock data or null to simulate no certificate
      resolve({
        fileName: "hospital_cert_2024_Subject만료일별칭D-Day...",
        registeredDate: "2025-11-20",
        expirationDate: "2028-11-20",
        daysRemaining: 365,
        status: 'active'
      });
    }, MOCK_DELAY);
  });
};

export const fetchLoginSettings = async (): Promise<LoginSettings> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        autoLogin: false,
        password: ''
      });
    }, MOCK_DELAY);
  });
};

export const registerCertificate = async (file: File, password: string): Promise<Certificate> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        fileName: file.name,
        registeredDate: new Date().toISOString().split('T')[0],
        expirationDate: "2026-12-31",
        daysRemaining: 365,
        status: 'active'
      });
    }, MOCK_DELAY);
  });
};

export const deleteCertificate = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, MOCK_DELAY);
  });
};

export const updateLoginSettings = async (settings: LoginSettings): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Updated settings:", settings);
      resolve();
    }, MOCK_DELAY);
  });
};
