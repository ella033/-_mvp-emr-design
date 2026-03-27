import { useState, useMemo } from "react";
import { Search, Plus, MoreVertical } from "lucide-react";
import {
  ExtendedUser,
  UserFilterStatus,
  UserStatus,
  UserStatusLabel,
} from "../model";
import { cn } from "@/lib/utils";
import { MyButton } from "@/components/yjg/my-button";
import { StatusBadge } from "./status-badge";
import { SectionLayout } from "../../commons/section-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserActionType } from "../model/user-action-types";

interface UserListPanelProps {
  users: ExtendedUser[];
  selectedUserId: number | null;
  onSelectUser: (user: ExtendedUser) => void;
  onInviteClick: () => void;
  onAction: (type: UserActionType, user: ExtendedUser) => void;
}

export function UserListPanel({
  users,
  selectedUserId,
  onSelectUser,
  onInviteClick,
  onAction,
}: UserListPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<UserFilterStatus>("ALL");

  // Filtering & Sorting Logic
  const filteredUsers = useMemo(() => {
    let result = users;

    // 1. Filter by Status
    if (filterStatus !== "ALL") {
      result = result.filter((u) => u.uiStatus === filterStatus);
    }

    // 2. Search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(lower) ||
          (u.email || "").toLowerCase().includes(lower) ||
          (u.nameEn && u.nameEn.toLowerCase().includes(lower))
      );
    }

    // 3. Sort
    // Priority: INVITING > EXPIRED > ACTIVE > SUSPENDED > TERMINATED
    // Then by Date (Recent first)
    const statusPriority: Record<UserStatus, number> = {
      [UserStatus.INVITING]: 0,
      [UserStatus.EXPIRED]: 1,
      [UserStatus.ACTIVE]: 2,
      [UserStatus.SUSPENDED]: 3,
      [UserStatus.TERMINATED]: 4,
    };

    return result.sort((a, b) => {
      const priorityA = statusPriority[a.uiStatus];
      const priorityB = statusPriority[b.uiStatus];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Same status: sort by recent date (invitation or create date)
      // Both models have createDateTime from BaseUser. Invitation has invitationDate.
      const dateA = new Date((a.kind === 'INVITATION' ? a.invitationDate : a.createDateTime) || 0).getTime();
      const dateB = new Date((b.kind === 'INVITATION' ? b.invitationDate : b.createDateTime) || 0).getTime();
      return dateB - dateA;
    });
  }, [users, filterStatus, searchTerm]);

  return (
    <>

      <SectionLayout
        header={
          <div className="flex items-center justify-between h-[32px]">
            <h2 className="font-bold text-lg text-foreground">사용자 목록</h2>
            <MyButton
              className="h-[32px]"
              onClick={onInviteClick}
              data-testid="settings-users-invite-button"
            >
              <Plus className="w-4 h-4 mr-1" />
              사용자 초대
            </MyButton>
          </div>
        }
        className="!p-[16px] !gap-[24px]"
        body={
          <>
            <div className="flex flex-1 flex-col gap-[24px]">

              <div className="flex flex-col gap-[8px]">
                {/* Search */}
                <div className="relative h-[32px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    data-testid="settings-users-search-input"
                    placeholder="이름으로 검색하세요"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-[6px] bg-background text-foreground focus:outline-none focus:border-primary focus:border-[1px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Filters */}
                <div className="flex h-[32px] gap-3 no-scrollbar">
                  <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap text-[13px] font-[400] text-[#46474C] leading-[16.25px] tracking-[-0.13px]">
                    <input
                      type="radio"
                      name="statusFilter"
                      checked={filterStatus === "ALL"}
                      onChange={() => setFilterStatus("ALL")}
                      className="accent-slate-900"
                    />
                    전체
                  </label>
                  {(Object.keys(UserStatusLabel) as UserStatus[]).map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-1 cursor-pointer whitespace-nowrap text-[13px] font-[400] text-[#46474C] leading-[16.25px] tracking-[-0.13px]"
                    >
                      <input
                        type="radio"
                        name="statusFilter"
                        checked={filterStatus === status}
                        onChange={() => setFilterStatus(status)}
                        className="accent-slate-900"
                      />
                      {UserStatusLabel[status]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-[12px]">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      data-testid="settings-users-row"
                      className={cn(
                        "group relative flex items-center p-[12px] rounded-[6px] border cursor-pointer transition-all bg-card hover:border-primary h-[52px]",
                        selectedUserId === user.id
                          ? "border-primary"
                          : "border-border"
                      )}
                    >
                      <div className="w-[130px] overflow-hidden text-ellipsis whitespace-nowrap text-foreground text-[13px] not-italic font-bold leading-[125%] tracking-[-0.13px]">
                        {/* 이름 + 이메일 */}
                        {user.name} {user.nameEn && <span className="text-muted-foreground font-normal">({user.nameEn})</span>} {user.email}
                      </div>

                      <div className="flex flex-1 gap-[8px]">
                        <div className="flex px-[5px] py-[2px] justify-center items-center rounded-[4px] bg-muted font-[500] text-[12px] text-muted-foreground">
                          {user.type || "직업 없음"}

                        </div>
                        {user.kind === 'HOSPITAL_USER' && user.specialtyName && <span className="flex px-[5px] py-[2px] justify-center items-center rounded-[4px] bg-muted font-[500] text-[12px] text-muted-foreground"> {user.specialtyName}</span>}
                      </div>
                      <div className="flex gap-[8px] items-center justify-end">
                        <StatusBadge status={user.uiStatus} />

                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted cursor-pointer text-muted-foreground">
                                <MoreVertical className="w-4 h-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              {/* 1. ACTIVE ("사용중") */}
                              {user.uiStatus === UserStatus.ACTIVE && (
                                <>
                                  <DropdownMenuItem onClick={() => onAction("SUSPEND", user)}>
                                    사용 정지
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAction("TERMINATE", user)}>
                                    사용 종료
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* 2. INVITING ("초대중") */}
                              {user.uiStatus === UserStatus.INVITING && (
                                <>
                                  <DropdownMenuItem onClick={() => onAction("CANCEL_INVITE", user)}>
                                    초대 취소
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAction("REINVITE", user)}>
                                    다시 초대
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* 3. EXPIRED ("초대만료") */}
                              {user.uiStatus === UserStatus.EXPIRED && (
                                <>
                                  <DropdownMenuItem onClick={() => onAction("REINVITE", user)}>
                                    다시 초대
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAction("DELETE", user)}>
                                    삭제
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* 4. SUSPENDED ("사용정지") */}
                              {user.uiStatus === UserStatus.SUSPENDED && (
                                <>
                                  <DropdownMenuItem onClick={() => onAction("UNSUSPEND", user)}>
                                    사용 정지 해제
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAction("TERMINATE", user)}>
                                    사용 종료
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* 5. TERMINATED ("사용종료") */}
                              {user.uiStatus === UserStatus.TERMINATED && (
                                <DropdownMenuItem onClick={() => onAction("DELETE", user)}>
                                  삭제
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        }
      ></SectionLayout >
    </>
    // <div className="flex flex-col h-full border-r border-slate-200 bg-white">
    //   {/* Header */}
    //   <div className="p-4 border-b border-slate-100 space-y-3">
    //     <div className="flex items-center justify-between">
    //       <h2 className="font-bold text-lg text-slate-800">사용자 목록</h2>
    //       <MyButton onClick={onInviteClick}>
    //         <Plus className="w-4 h-4 mr-1" />
    //         사용자 초대
    //       </MyButton>
    //     </div>

    //     {/* Search */}
    //     <div className="relative">
    //       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    //       <input
    //         type="text"
    //         placeholder="이름으로 검색하세요"
    //         className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-300"
    //         value={searchTerm}
    //         onChange={(e) => setSearchTerm(e.target.value)}
    //       />
    //     </div>

    //     {/* Filters */}
    //     <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar text-xs">
    //       <label className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
    //         <input
    //           type="radio"
    //           name="statusFilter"
    //           checked={filterStatus === "ALL"}
    //           onChange={() => setFilterStatus("ALL")}
    //           className="accent-slate-900"
    //         />
    //         전체
    //       </label>
    //       {(Object.keys(UserStatusLabel) as UserStatus[]).map((status) => (
    //         <label
    //           key={status}
    //           className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
    //         >
    //           <input
    //             type="radio"
    //             name="statusFilter"
    //             checked={filterStatus === status}
    //             onChange={() => setFilterStatus(status)}
    //             className="accent-slate-900"
    //           />
    //           {UserStatusLabel[status]}
    //         </label>
    //       ))}
    //     </div>
    //   </div>

    //   {/* List */}

    // </div>
  );
}
