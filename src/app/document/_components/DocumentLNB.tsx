'use client';

import { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { components } from '@/generated/api/types';
import { useDocumentContext } from '../_contexts/DocumentContext';
import DocumentSearchSection from './DocumentSearchSection';
import DocumentListSection from './DocumentListSection';
import IssuanceHistoryTab from './IssuanceHistoryTab';
import { useFormsHierarchy } from '@/hooks/forms/use-forms-hierarchy';
import { useAddFormFavorite, useRemoveFormFavorite } from '@/hooks/forms/use-form-favorite-mutation';
import { useToastHelpers } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/use-debounce';

type FormFolderDto = components['schemas']['FormFolderDto'];
type FormItemDto = components['schemas']['FormItemDto'];

function DocumentLNBContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedFormId,
    setSelectedFormId,
    trySetSelectedFormId,
    setLoadedIssuance,
    setFormMode,
    setCurrentPage,
    setTotalPages,
  } = useDocumentContext();
  const { error: showErrorToast } = useToastHelpers();
  const showErrorToastRef = useRef(showErrorToast);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색어 디바운싱
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // React Query를 사용하여 폼 계층 구조 조회
  const { data: hierarchyData, isError: isHierarchyError } = useFormsHierarchy(debouncedSearchQuery);

  // 로컬 폴더 상태 (즐겨찾기 낙관적 업데이트용)
  const [localFolders, setLocalFolders] = useState<FormFolderDto[]>([]);

  // 즐겨찾기 추가/제거 mutation
  const addFavoriteMutation = useAddFormFavorite({
    onError: () => {
      showErrorToast('즐겨찾기 추가에 실패했습니다.');
    },
  });

  const removeFavoriteMutation = useRemoveFormFavorite({
    onError: () => {
      showErrorToast('즐겨찾기 제거에 실패했습니다.');
    },
  });

  useEffect(function syncShowErrorToastRef() {
    showErrorToastRef.current = showErrorToast;
  }, [showErrorToast]);

  // 서버 데이터를 로컬 상태에 동기화
  useEffect(function syncServerDataToLocal() {
    if (hierarchyData?.folders) {
      setLocalFolders(hierarchyData.folders);
    } else if (isHierarchyError) {
      setLocalFolders([]);
      showErrorToastRef.current('서식 목록을 불러오지 못했습니다.');
    }
  }, [hierarchyData, isHierarchyError]);

  // URL에서 초기 documentId 읽기 (초기 로드 시에만)
  useEffect(function syncFromUrl() {
    if (!searchParams) return;

    const urlDocumentId = searchParams.get('documentId');
    const nextFormId = urlDocumentId ? Number(urlDocumentId) : null;
    const isValidFormId = nextFormId !== null && Number.isFinite(nextFormId);

    const shouldSyncFromUrl = isValidFormId && selectedFormId === null;
    // selectedFormId가 아직 설정되지 않았을 때만 URL에서 읽어옴
    if (shouldSyncFromUrl) {
      setLoadedIssuance(null);
      setFormMode('edit');
      setSelectedFormId(nextFormId);
      setCurrentPage(1);
      setTotalPages(0);
    }
  }, [
    searchParams,
    selectedFormId,
    setLoadedIssuance,
    setFormMode,
    setSelectedFormId,
    setCurrentPage,
    setTotalPages,
  ]);

  function handleFormSelect(form: FormItemDto) {
    setLoadedIssuance(null);
    setFormMode('edit');
    // dirty 체크 포함하여 서식 변경 시도
    trySetSelectedFormId(form.id);
    setCurrentPage(1); // 새 서식 선택 시 첫 페이지로 리셋
    setTotalPages(0); // 페이지 수 초기화 (PrintableDocument에서 업데이트됨)

    // URL 업데이트 (히스토리에 추가하지 않음 - replace 사용)
    const params = new URLSearchParams();

    // 기존 searchParams가 있으면 모든 파라미터 복사
    if (searchParams) {
      searchParams.forEach((value, key) => {
        params.set(key, value);
      });
    }

    // documentId 설정
    params.set('documentId', String(form.id));

    // encounterId가 있으면 유지 (이미 위에서 복사됨)
    router.replace(`/document?${params.toString()}`);
  }

  const handleToggleFavorite = useCallback(async function handleToggleFavorite(formId: number) {
    if (!Number.isFinite(formId)) {
      showErrorToast('즐겨찾기 처리에 실패했습니다.');
      return;
    }

    const currentFavorite = findIsFavoriteFromFolders(localFolders, formId);
    if (currentFavorite === null) return;

    const shouldFavorite = !currentFavorite;

    // 낙관적 업데이트
    const nextFolders = updateFoldersFavorite(localFolders, formId, shouldFavorite);
    setLocalFolders(nextFolders);

    // 서버에 요청
    if (shouldFavorite) {
      addFavoriteMutation.mutate(formId, {
        onError: () => {
          // 실패 시 롤백
          setLocalFolders(localFolders);
        },
      });
    } else {
      removeFavoriteMutation.mutate(formId, {
        onError: () => {
          // 실패 시 롤백
          setLocalFolders(localFolders);
        },
      });
    }
  }, [localFolders, showErrorToast, addFavoriteMutation, removeFavoriteMutation]);

  return (
    <div
      data-testid="document-lnb"
      className="w-full h-full bg-white border-r border-gray-300 flex flex-col overflow-hidden"
      style={{ minWidth: '200px' }}
    >
      <div className="rounded-[6px] h-full overflow-hidden flex flex-col">
        <Tabs defaultValue="list" className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between bg-transparent">
            <TabsList className="bg-transparent p-0 h-[38px] rounded-none flex gap-0 w-full">
              <TabsTrigger
                value="list"
                data-testid="document-lnb-list-tab"
                className="
                  flex-1 relative h-full px-[12px] py-[10px] text-[13px] font-medium text-[#171719] rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[#180f38] data-[state=active]:font-bold data-[state=active]:shadow-none
                  after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#180f38]
                "
              >
                서식 리스트
              </TabsTrigger>
              <TabsTrigger
                value="issuance"
                data-testid="document-lnb-issuance-tab"
                className="
                  flex-1 relative h-full px-[12px] py-[10px] text-[13px] font-medium text-[#171719] rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[#180f38] data-[state=active]:font-bold data-[state=active]:shadow-none
                  after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-transparent data-[state=active]:after:bg-[#180f38]
                "
              >
                발급이력
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1 overflow-hidden m-0 p-[12px]">
            <div className="flex flex-col h-full border border-[#dbdcdf] rounded-[6px]">
              <DocumentSearchSection onSearchChange={setSearchQuery} />
              <DocumentListSection
                folders={localFolders}
                selectedFormId={selectedFormId ?? undefined}
                onFormSelectAction={handleFormSelect}
                onToggleFavoriteAction={handleToggleFavorite}
              />
            </div>
          </TabsContent>

          <TabsContent value="issuance" className="flex-1 overflow-hidden m-0 p-[12px]">
            <IssuanceHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function DocumentLNB() {
  return (
    <Suspense fallback={
      <div className="w-full h-full bg-white border-r border-gray-300 flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    }>
      <DocumentLNBContent />
    </Suspense>
  );
}

function findIsFavoriteFromFolders(
  folders: FormFolderDto[],
  formId: number
): boolean | null {
  for (const folder of folders) {
    const item = (folder.children ?? []).find((c) => c.id === formId);
    if (item) return item.isFavorite;
  }
  return null;
}

function updateFoldersFavorite(
  folders: FormFolderDto[],
  formId: number,
  shouldFavorite: boolean
): FormFolderDto[] {
  const favoriteFolderIndex = folders.findIndex((f) => f.name === '즐겨찾기');
  const resolvedFavoriteFolderIndex =
    favoriteFolderIndex >= 0 ? favoriteFolderIndex : 0;

  const nextFolders = folders.map((folder) => ({
    ...folder,
    children: (folder.children ?? []).map((child) =>
      child.id === formId ? { ...child, isFavorite: shouldFavorite } : child
    ),
  }));

  const favoriteFolder = nextFolders[resolvedFavoriteFolderIndex];
  if (!favoriteFolder) return nextFolders;

  const favoriteChildren = favoriteFolder.children ?? [];
  const isAlreadyInFavoriteFolder = favoriteChildren.some((c) => c.id === formId);

  if (shouldFavorite && !isAlreadyInFavoriteFolder) {
    const sourceItem =
      nextFolders.flatMap((f) => f.children ?? []).find((c) => c.id === formId) ??
      null;
    if (!sourceItem) return nextFolders;

    nextFolders[resolvedFavoriteFolderIndex] = {
      ...favoriteFolder,
      children: [...favoriteChildren, { ...sourceItem, isFavorite: true }],
    };
    return nextFolders;
  }

  if (!shouldFavorite && isAlreadyInFavoriteFolder) {
    nextFolders[resolvedFavoriteFolderIndex] = {
      ...favoriteFolder,
      children: favoriteChildren.filter((c) => c.id !== formId),
    };
  }

  return nextFolders;
}
