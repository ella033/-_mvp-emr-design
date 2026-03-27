'use client';

import { useState, useEffect } from 'react';
import { useHospitalStore } from '@/store/hospital-store';
import { getFileUrl } from '@/lib/file-utils';

// 모듈 레벨 캐시 (앱 전체에서 공유)
const imageCache = new Map<string, string>();

async function fetchImageAsBase64(url: string): Promise<string | null> {
  // 캐시에 있으면 즉시 반환
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        imageCache.set(url, base64); // 캐시에 저장
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function useHospitalImages() {
  const { hospital } = useHospitalStore();

  const [sealImage, setSealImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [directorSealImage, setDirectorSealImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sealUrl = getFileUrl(hospital?.sealFileinfo?.uuid);
  const logoUrl = getFileUrl(hospital?.logoFileinfo?.uuid);
  const directorSealUrl = getFileUrl(hospital?.directorSealFileinfo?.uuid);

  useEffect(function loadHospitalImages() {
    async function load() {
      setIsLoading(true);

      const [seal, logo, directorSeal] = await Promise.all([
        sealUrl ? fetchImageAsBase64(sealUrl) : null,
        logoUrl ? fetchImageAsBase64(logoUrl) : null,
        directorSealUrl ? fetchImageAsBase64(directorSealUrl) : null,
      ]);

      setSealImage(seal);
      setLogoImage(logo);
      setDirectorSealImage(directorSeal);
      setIsLoading(false);
    }

    load();
  }, [sealUrl, logoUrl, directorSealUrl]);

  return {
    sealImage, // 병원 직인 Base64
    logoImage, // 병원 로고 Base64
    directorSealImage, // 병원장 직인 Base64
    isLoading,
  };
}

