'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { components } from '@/generated/api/types';
import { Star, Folder } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

type FormFolderDto = components['schemas']['FormFolderDto'];
type FormItemDto = components['schemas']['FormItemDto'];

interface DocumentListSectionProps {
  folders: FormFolderDto[];
  selectedFormId?: number;
  onFormSelectAction: (form: FormItemDto) => void;
  onToggleFavoriteAction: (formId: number) => void;
}

export default function DocumentListSection({
  folders,
  selectedFormId,
  onFormSelectAction,
  onToggleFavoriteAction,
}: DocumentListSectionProps) {
  // FIXME: 사용자 서식은 당장 사용하지 않아 임시로 숨김 처리
  const HIDDEN_FOLDERS = ['사용자서식'];
  const visibleFolders = folders.filter(
    (folder) => !HIDDEN_FOLDERS.includes(folder.name)
  );

  function handleToggleFavorite(e: React.MouseEvent, formId: number) {
    e.stopPropagation();
    onToggleFavoriteAction(formId);
  }

  const hasAnyForm =
    visibleFolders.length > 0 &&
    visibleFolders.some((folder) => (folder.children ?? []).length > 0);

  if (!hasAnyForm) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="text-sm text-gray-400 text-center py-8">
          검색 결과가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-0">
        {visibleFolders.map((folder, folderIndex) => (
          <FolderItem
            key={`${folder.name}-${folderIndex}`}
            folder={folder}
            selectedFormId={selectedFormId}
            onFormSelectAction={onFormSelectAction}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}

function FolderItem({
  folder,
  selectedFormId,
  onFormSelectAction,
  onToggleFavorite,
}: {
  folder: FormFolderDto;
  selectedFormId?: number;
  onFormSelectAction: (form: FormItemDto) => void;
  onToggleFavorite: (e: React.MouseEvent, formId: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center px-[8px] py-2 hover:bg-[var(--violet-1)] transition-colors gap-[6px] cursor-pointer">
          <Image
            src={isOpen ? '/icon/ic_line caret-down.svg' : '/icon/ic_line caret-up.svg'}
            alt=""
            width={16}
            height={16}
            className="flex-shrink-0"
          />
          <div className="flex items-center gap-2">
            <Folder className="w-[18px] h-[14px] text-black" />
            <span className="text-sm font-bold text-black">
              {folder.name}
            </span>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0">
          {(folder.children ?? []).map((form) => {
            const isSelected = selectedFormId === form.id;

            return (
              <div
                key={form.id}
                onClick={() => onFormSelectAction(form)}
                className={`
                  flex items-center gap-2 px-[29px] py-1.5 cursor-pointer transition-colors
                  ${isSelected
                    ? 'bg-[var(--violet-1)]'
                    : 'hover:bg-[var(--violet-1)]'
                  }
                `}
              >
                <button
                  onClick={(e) => onToggleFavorite(e, form.id)}
                  className="flex-shrink-0 p-0.5 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 ${form.isFavorite
                      ? 'fill-[#4F29E5] text-[#4F29E5]'
                      : 'text-gray-300 fill-none'
                      }`}
                  />
                </button>
                <span
                  className={`text-sm truncate flex-1 leading-[1.5] ${isSelected
                    ? 'font-medium text-black'
                    : 'font-normal text-black'
                    }`}
                >
                  {form.name}
                </span>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

