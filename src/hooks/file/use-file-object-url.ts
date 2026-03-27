import { useEffect, useMemo } from "react";
import { useDownloadFileV2 } from "./use-download-file-v2";

/**
 * UUID를 받아 브라우저에서 사용할 수 있는 Object URL을 생성하고 관리하는 Hook입니다.
 * 컴포넌트 언마운트 시 URL 리소스를 자동으로 해제합니다.
 */
export const useFileObjectUrl = (uuid?: string) => {
  const { data: downloadData, isLoading, error } = useDownloadFileV2(uuid);

  const objectUrl = useMemo(() => {
    if (!downloadData?.blob) return null;
    return URL.createObjectURL(downloadData.blob);
  }, [downloadData?.blob]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return { objectUrl, isLoading, error };
};
