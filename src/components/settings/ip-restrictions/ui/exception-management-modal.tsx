import { useCallback, useMemo, useState, useEffect } from "react";
import { Loader2, Search, X } from "lucide-react";

import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import { useUsersByHospital } from "@/hooks/user/use-users-by-hospital";
import type { ExemptUser } from "@/types/ip-restrictions";
import type { UserManager } from "@/types/user-types";

interface ExceptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: number;
  initialExemptUsers: ExemptUser[];
  onSave: (userIds: number[]) => Promise<void>;
}

export function ExceptionManagementModal({
  isOpen,
  onClose,
  hospitalId,
  initialExemptUsers,
  onSave,
}: ExceptionManagementModalProps) {
  const [exemptUsers, setExemptUsers] =
    useState<ExemptUser[]>(initialExemptUsers);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setExemptUsers(initialExemptUsers);
      setSelectedIds(new Set());
      setSearchTerm("");
      setSaveError(null);
    }
  }, [isOpen, initialExemptUsers]);

  const { data: allUsers = [] } = useUsersByHospital(hospitalId);

  // Filter users for search results
  // Exclude users already in the exempt list
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowerTerm = searchTerm.toLowerCase();
    return allUsers.filter((user) => {
      const isAlreadyExempt = exemptUsers.some((ex) => ex.userId === user.id);
      if (isAlreadyExempt) return false;

      return (
        user.name.toLowerCase().includes(lowerTerm) ||
        (user.departmentName &&
          user.departmentName.toLowerCase().includes(lowerTerm))
      );
    });
  }, [allUsers, searchTerm, exemptUsers]);

  const handleAddUser = (user: UserManager) => {
    const newUser: ExemptUser = {
      userId: user.id,
      userName: user.name,
      typeName: mapType(user.type), // Need mapping logic or assume generic
      roleName: user.roleName || user.positionName || "-",
      createDateTime: new Date().toISOString(), // Temporary display date
      userStatus: user.status === "ACTIVE" ? 1 : 0, // Mock status mapping
    };
    setExemptUsers((prev) => [...prev, newUser]);
    setSearchTerm("");
  };

  const mapType = (type?: string) => {
    if (type === "DOCTOR") return "의사";
    if (type === "NURSE") return "간호사";
    if (type === "NURSE_AID") return "간호조무사";
    if (type === "ADMIN") return "행정직";
    return "기타";
  };

  const handleToggleRow = (id: number) => {
    // Prevent selecting owner if needed (Design says owner is fixed/undeletable?)
    // Assuming owner check is based on role or specific flag.
    // For now, let's just allow selection. User logic to prevent owner deletion can be added if we have 'isOwner' flag.
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    setExemptUsers((prev) =>
      prev.filter((user) => !selectedIds.has(user.userId))
    );
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(exemptUsers.map((u) => u.userId));
      onClose();
    } catch (error) {
      console.error(error);
      setSaveError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title="예외 관리"
      width="600px"
      height="auto"
      fitContent
    >
      <div className="flex flex-col gap-4 p-4 text-sm text-[var(--text-primary)] min-h-[500px]">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-[var(--text-secondary)]">
            제한에 영향을 받지 않는 예외 사용자를 설정할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="사용자를 검색하세요"
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100 placeholder:text-slate-400"
            />
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-[200px] overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg z-20">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddUser(user)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {user.departmentName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {user.roleName || user.positionName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <MyButton
            className="h-[32px]"
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            삭제
          </MyButton>
        </div>

        <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center text-xs font-semibold text-slate-600">
            <div className="w-8 flex justify-center">
              {/* Header Checkbox (optional, logic complex with pagination/scroll) */}
            </div>
            <div className="flex-1 px-2">사용자명</div>
            <div className="w-24 px-2">직업</div>
            <div className="w-24 px-2">권한</div>
            <div className="w-16 px-2 text-center">상태</div>
          </div>
          <div className="overflow-y-auto flex-1 max-h-[300px]">
            {exemptUsers.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-xs py-8">
                예외 처리된 사용자가 없습니다.
              </div>
            ) : (
              exemptUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center border-b border-slate-100 last:border-b-0 hover:bg-slate-50 py-2 px-3 text-sm text-slate-800"
                >
                  <div className="w-8 flex justify-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.userId)}
                      onChange={() => handleToggleRow(user.userId)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900"
                    />
                  </div>
                  <div className="flex-1 px-2 font-medium">{user.userName}</div>
                  <div className="w-24 px-2 text-slate-600 text-xs">
                    {user.typeName}
                  </div>
                  <div className="w-24 px-2 text-slate-600 text-xs">
                    {user.roleName}
                  </div>
                  <div className="w-16 px-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                      사용중 ·
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-red-500 text-right">{saveError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <MyButton variant="outline" className="h-[32px]" onClick={onClose}>
            취소
          </MyButton>
          <MyButton
            className="h-[32px]"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                저장 중
              </>
            ) : (
              "저장"
            )}
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
