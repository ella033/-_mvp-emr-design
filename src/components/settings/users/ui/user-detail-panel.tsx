import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InputDate from "@/components/ui/input-date";
import { MyButton } from "@/components/yjg/my-button";
import { MySwitch } from "@/components/yjg/my-switch";
import { Loader2 } from "lucide-react";
import { SectionLayout } from "../../commons/section-layout";
import { ExtendedUser, UserFieldConfig, UserStatus, GetRolesResponseDto, HospitalUser, InvitationUser } from "../model";
import { userManagementApi } from "../api/user.api";
import { StatusBadge } from "./status-badge";
import { SettingPageHeader } from "../../commons/setting-page-header";
import { UserActionType } from "../model/user-action-types";
import { getFileUrl } from "@/lib/file-utils";
import { useUserDetail } from "../hooks/use-user-management";


interface UserDetailPanelProps {
  userId: number;
  userKind: 'HOSPITAL_USER' | 'INVITATION';
  onAction: (type: UserActionType, user: ExtendedUser) => void;
  onSaveUser: (userId: number, data: any) => void;
  fieldConfig?: UserFieldConfig;
  renderFooter?: (props: { isSaving: boolean; handleSave: () => void }) => React.ReactNode;
  onClose?: () => void;
}

export function UserDetailPanel({
  userId,
  userKind,
  onAction,
  onSaveUser,
  fieldConfig = {},
  renderFooter,
  onClose,
}: UserDetailPanelProps) {
  // 1. Internal Data Fetching
  const { data: user, isLoading } = useUserDetail(userId, userKind === 'INVITATION');

  // 2. Local State for Editing
  const [formData, setFormData] = useState<{
    hireDate: string;
    resignationDate: string;
    isActive: boolean;
    roleId: number | null;
  }>({
    hireDate: "",
    resignationDate: "",
    isActive: true,
    roleId: null
  });

  const [roles, setRoles] = useState<GetRolesResponseDto[]>([]);

  // 3. Effects
  useEffect(() => {
    userManagementApi.getRoles().then(setRoles).catch(console.error);
  }, []);

  // Effect to sync local state with fetched user data
  useEffect(() => {
    if (user && user.kind === 'HOSPITAL_USER') {
      setFormData({
        hireDate: user.hireDate?.split('T')[0] || "",
        resignationDate: user.resignationDate?.split('T')[0] || "",
        isActive: user.isActive ?? true,
        roleId: null
      });
    } else if (user && user.kind === 'INVITATION') {
      setFormData({
        hireDate: user.invitationDate?.split('T')[0] || "",
        resignationDate: "",
        isActive: false,
        roleId: null
      });
    }
  }, [user]);

  // 5. Handlers
  const handleSave = () => {
    if (!user) return;
    if (user.kind !== 'HOSPITAL_USER') return;

    const payload = {
      isActive: formData.isActive,
      hireDate: formData.hireDate, // Valid date string YYYY-MM-DD
      resignationDate: formData.resignationDate || null, // Valid date string YYYY-MM-DD or null
      terminateImmediately: false,
    };

    // CRITICAL: Always use the Stable ID passed via Props, not the potentially unstable one from the internal fetch/map
    console.log("Saving User with ID:", userId, payload);
    onSaveUser(userId, payload);
  };

  // 6. derived state helper
  // We pass 'user' to action handler? Ideally we pass the ID and let the hook handle it.
  // But useUserActionController expects a User object to show names etc in modal.
  // So we pass the 'user' object for display, but ensure the Action Controller uses the ID correctly internally?
  // Let's check useUserActionController - it extracts userId from the user object.
  // We should ideally wrap handleAction to force the correct ID if we suspect the user object is bad.
  // But since we fixed the mapping and 'user' comes from useUserDetail which we trust now, it should be fine.
  // HOWEVER, for safety, let's construct a safe user object if needed? User object from 'user' query should be correct now with the previous fix.

  // 7. Loading & Error States
  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background" data-testid="settings-user-detail-panel">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background text-muted-foreground" data-testid="settings-user-detail-panel">
        사용자를 찾을 수 없습니다.
      </div>
    );
  }

  // 8. Derived State
  const handleSuspendToggle = (checked: boolean) => {
    const newActiveState = !checked;
    setFormData(prev => ({ ...prev, isActive: newActiveState }));
  };

  const isSuspended = !formData.isActive;
  // Fallback status if user.uiStatus is missing for some reason
  const isInviting = user.uiStatus === UserStatus.INVITING;
  const isExpired = user.uiStatus === UserStatus.EXPIRED;
  const isTerminated = user.uiStatus === UserStatus.TERMINATED;

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto" data-testid="settings-user-detail-panel">
        <SectionLayout
          className="!p-[16px]"
          header={
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  사용자 정보
                </h2>
                <StatusBadge status={user.uiStatus} className="text-xs px-2 py-1" />
              </div>
            </>
          }
          body={
            <>
              <div className="flex flex-col gap-[24px]">
                {(user.kind === 'INVITATION') ? (
                  <InvitationUserCard user={user as InvitationUser} />
                ) : (
                  <HospitalUserCard
                    user={user as HospitalUser}
                    formData={formData}
                    setFormData={setFormData}
                    isSuspended={isSuspended}
                    handleSuspendToggle={handleSuspendToggle}
                  />
                )}
              </div>
            </>
          }
          footer={
            renderFooter ? renderFooter({ isSaving: false, handleSave: () => { } }) : (
              (user.kind === 'HOSPITAL_USER' && user.isOwner) ? null : (
                <div className="flex justify-between items-center gap-2 pt-4 w-full">
                  <div className="flex justify-start">
                    {isTerminated && (
                      <MyButton className="h-[32px]" variant="danger" onClick={() => onAction("DELETE", user)}>삭제</MyButton>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {(isInviting || isExpired) ? (
                      <>
                        <MyButton variant="outline" className="h-[32px]" onClick={() => onAction("CANCEL_INVITE", user)}>초대 취소</MyButton>
                        <MyButton variant="outline" className="h-[32px]" onClick={() => onAction("REINVITE", user)}>다시 초대</MyButton>
                      </>
                    ) : (
                      <>
                        <MyButton variant="outline" className="h-[32px]" onClick={() => onClose?.()}>취소</MyButton>
                        <MyButton className="h-[32px]" onClick={handleSave}>저장</MyButton>
                      </>
                    )}
                  </div>
                </div>
              )
            )
          }
        ></SectionLayout>
      </div>
    </>
  );
}

// Helper Component for the new design
// Helper Component for the Figma design
function FigmaDetailField({ label, value, subValue, isWrapper = true }: { label: string, value: string, subValue?: string, isWrapper?: boolean }) {
  const content = (
    <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
      <div className="self-stretch inline-flex justify-start items-start gap-1">
        <div className="justify-start text-neutral-900 text-[13px] font-normal font-['Pretendard'] leading-4">{label}</div>
      </div>
      <div className="self-stretch justify-center text-neutral-900 text-sm font-medium font-['Pretendard'] leading-[17.50px]">
        {value}
        {subValue && <div>{subValue}</div>}
      </div>
    </div>
  );

  if (!isWrapper) return content;

  return (
    <>
      {content}
    </>
  );
}

// ----------------------------------------------------------------------
// Sub-Component: Hospital User Card (Existing Functionality)
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// Sub-Component: HospitalUserCard
// ----------------------------------------------------------------------
function HospitalUserCard({ user, formData, setFormData, isSuspended, handleSuspendToggle }: {
  user: HospitalUser;
  formData: any;
  setFormData: any;
  isSuspended: boolean;
  handleSuspendToggle: (checked: boolean) => void;
}) {
  const imgSrc = getFileUrl(user.profileFileInfo?.uuid);


  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[12px]">

        <SettingPageHeader
          className="text-[#171719] text-[14px] font-bold leading-[17.5px] tracking-[-0.14px] "
          title="기본 정보"
        />
        {/* Card Container */}
        <div className="self-stretch p-3 rounded-md outline outline-1 outline-offset-[-1px] outline-black flex flex-col justify-start items-start gap-4 bg-white">

          {/* Header Row */}
          <div className="self-stretch flex justify-between items-center">

            {/* Avatar & Name & Position */}
            <div className="flex justify-start items-center gap-3">
              <div className="w-[42px] h-[42px] relative">
                <Avatar className="w-[42px] h-[42px] rounded-full absolute left-0 top-0">
                  {/* profileFileInfo (Camel) id/uuid */}
                  <Avatar className="w-[42px] h-[42px] rounded-full absolute left-0 top-0">
                    {/* profileFileInfo (Camel) id/uuid */}
                    <AvatarImage src={imgSrc} className="object-cover" />
                    <AvatarFallback className="text-lg bg-muted text-muted-foreground">{(user.name || "").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <AvatarFallback className="text-lg bg-muted text-muted-foreground">{(user.name || "").charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex justify-start items-center gap-2">
                <div className="justify-center text-neutral-900 text-[15px] font-bold font-['Pretendard'] leading-[21px]">
                  {user.name} {user.nameEn && <span className="font-normal text-neutral-500">({user.nameEn})</span>}
                </div>

                {/* Position Badge - Use positionName (mapped from typeName) */}
                <div className="px-[5px] py-0.5 bg-gray-200 rounded-sm flex justify-center items-center gap-0.5">
                  <div className="h-4 flex justify-start items-center gap-0.5">
                    <div className="text-center justify-center text-neutral-900 text-xs font-medium font-['Pretendard'] leading-[15px]">
                      {user.positionName || "직업"}
                    </div>
                  </div>
                </div>

                {/* Owner Badge */}
                {user.isOwner && (
                  <div className="px-[5px] py-0.5 bg-blue-50 rounded-sm flex justify-center items-center gap-0.5">
                    <div className="h-4 flex justify-start items-center gap-0.5">
                      <div className="text-center text-blue-600 text-xs font-medium font-['Pretendard'] leading-[15px]">
                        소유자
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Meta Info: Role | Start Date */}
            <div className="flex justify-start items-center gap-2">
              <div className="flex justify-end items-start gap-2">
                <div className="flex justify-start items-start gap-1">
                  <div className="justify-start text-zinc-700 text-[13px] font-normal font-['Pretendard'] leading-4">권한</div>
                </div>
                <div className="justify-center text-zinc-700 text-[13px] font-bold font-['Pretendard'] leading-4">{user.roleName || "-"}</div>
              </div>

              <div className="w-px h-4 bg-zinc-300" />

              <div className="flex justify-end items-start gap-1">
                <div className="flex justify-start items-center gap-1">
                  <div className="justify-start text-neutral-900 text-[13px] font-normal font-['Pretendard'] leading-4">사용 시작일</div>
                </div>
                <div className="h-4 flex justify-end items-center gap-1">
                  <div className="justify-center text-zinc-700 text-[13px] font-bold font-['Pretendard'] leading-4">
                    {/* Hospital User uses hireDate */}
                    {user.hireDate?.split('T')[0] || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="self-stretch h-px flex flex-col justify-start items-start">
            <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-zinc-300" />
          </div>

          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <FigmaDetailField label="아이디" value={user.email} />
            <FigmaDetailField label="전화번호" value={user.mobile || "-"} />
            <FigmaDetailField label="생년월일" value={user.birthDate || "-"} />
          </div>

          <div className="self-stretch inline-flex justify-start items-center gap-2">
            <FigmaDetailField label="주소" value={`${user.zipcode ? `(${user.zipcode}) ` : ""}${user.address1 || "-"}`} subValue={user.address2 || undefined} />
            <FigmaDetailField label="면허번호" value={user.licenseNo || "-"} />

            <div className="flex-1">
              {user.isOwner ? (
                /* Owner: Show Specialty if Doctor */
                user.positionName === '의사' ? (
                  <FigmaDetailField label="전문의 과목" value={user.specialtyName || "-"} isWrapper={false} />
                ) : <div />
              ) : (
                /* Not Owner: Show Resignation Date */
                <FigmaDetailField label="사용 종료일" value={user.resignationDate?.split('T')[0] || "-"} isWrapper={false} />
              )}
            </div>
          </div>

          {(user.positionName === '의사' && user.specialtyCertNo) && (
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <FigmaDetailField label="전문의 자격번호" value={user.specialtyCertNo} />
              <div className="flex-1" />
              <div className="flex-1" />
            </div>
          )}

        </div>
      </div>

      {!user.isOwner && (
        <div className="flex flex-col gap-[12px]">

          <SettingPageHeader
            className="text-[#171719] text-[14px] font-bold leading-[17.5px] tracking-[-0.14px] "
            title="사용기간 정보"
          />
          <div className="flex">
            <div className="flex flex-1 flex-col gap-[24px]">
              <div className="flex flex-col gap-[8px]">
                <label className="text-[#171719] text-[13px] font-normal leading-[125%] tracking-[-0.13px]">사용 종료일</label>
                <div className="relative">
                  <InputDate
                    className="flex flex-col justify-center self-stretch h-[32px] px-2 rounded-[6px] border border-[#C2C4C8] bg-white text-[13px] font-normal leading-[125%] tracking-[-0.13px]"
                    value={formData.resignationDate}
                    onChange={(val) => setFormData((prev: any) => ({ ...prev, resignationDate: val || "" }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MySwitch
                  checked={isSuspended}
                  onCheckedChange={handleSuspendToggle}
                />
                <label className="text-[#171719] text-[13px] font-normal leading-[125%] tracking-[-0.13px]" onClick={() => handleSuspendToggle(!isSuspended)}>
                  사용 정지
                </label>
              </div>
            </div>
            <div className="flex flex-1">
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-Component: InvitationUserCard
// ----------------------------------------------------------------------
function InvitationUserCard({ user }: { user: InvitationUser }) {
  const isInviting = user.uiStatus === UserStatus.INVITING;
  const isExpired = user.uiStatus === UserStatus.EXPIRED;

  // Header content shared but minimal in inviting
  const renderHeader = () => (
    <div className="self-stretch flex justify-between items-center mb-4">
      <div className="flex justify-start items-center gap-3">
        <div className="w-[42px] h-[42px] relative">
          <Avatar className="w-[42px] h-[42px] rounded-full border border-[#C2C4C8]">
            <AvatarImage src={"/settings/invite_profile_image.svg"} />
          </Avatar>
        </div>
        <div className="flex flex-col justify-center gap-0.5">
          <div className="text-neutral-900 text-[15px] font-bold font-['Pretendard'] leading-[21px]">
            {user.invitedEmail}
          </div>
        </div>
      </div>

      <div className="flex justify-start items-center gap-2 text-[13px]">
        <div className="flex gap-1 text-zinc-700">
          <span>권한</span>
          <span className="font-bold">{user.roleName || "-"}</span>
        </div>
        <div className="w-px h-3 bg-zinc-300 mx-1"></div>
        <div className="flex gap-1">
          <span>사용 시작일</span>
          {/* InvitationUser uses invitationDate (mapped from usageStartDate) */}
          <span className="font-bold text-zinc-700">{user.invitationDate?.split('T')[0] || "-"}</span>
        </div>
      </div>
    </div>
  )

  if (isInviting) {
    return (
      <div className="flex flex-col gap-[12px]">
        <SettingPageHeader
          className="text-[#171719] text-[14px] font-bold leading-[17.5px] tracking-[-0.14px]"
          title="기본 정보"
        />
        <div className="self-stretch p-3 rounded-md outline outline-1 outline-offset-[-1px] outline-black bg-white flex flex-col h-[300px] relative overflow-hidden">
          {renderHeader()}

          <div className="self-stretch h-px bg-zinc-100 mb-8" />

          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative w-[120px] h-[100px] flex items-center justify-center">
              <img src="/settings/invite_image.svg" alt="초대이미지" />

            </div>
            <div className="text-zinc-600 text-sm font-medium">현재 초대 중 상태입니다</div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col gap-[12px]">
        <SettingPageHeader
          className="text-[#171719] text-[14px] font-bold leading-[17.5px] tracking-[-0.14px]"
          title="기본 정보"
        />

        {/* Expired Warning Banner */}
        <div className="w-full p-3 bg-red-50 rounded text-red-500 text-[13px] flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 14A6 6 0 1 0 8 2A6 6 0 0 0 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          초대가 만료되었습니다. 초대 링크를 다시 보내주세요.
        </div>

        {/* Expired Card */}
        <div className="self-stretch p-3 rounded-md outline outline-1 outline-offset-[-1px] outline-black bg-white flex flex-col">

          <div className="self-stretch flex justify-between items-center mb-4">
            <div className="flex justify-start items-center gap-3">
              <Avatar className="w-[42px] h-[42px] rounded-full">
                <AvatarImage src={undefined} />
                <AvatarFallback>{(user.invitedEmail || "").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold">{user.invitedEmail || user.email}</span>
                {/* Invitation does NOT have positionName usually. Show Role? Or nothing */}
              </div>
            </div>

            <div className="flex justify-start items-center gap-2 text-[13px]">
              <div className="flex gap-1 text-zinc-700">
                <span>권한</span>
                <span className="font-bold">{user.roleName || "-"}</span>
              </div>
              <div className="w-px h-3 bg-zinc-300 mx-1"></div>
              <div className="flex gap-1">
                <span>사용 시작일</span>
                <span className="font-bold text-zinc-700">{user.invitationDate?.split('T')[0] || "-"}</span>
              </div>
            </div>
          </div>

          <div className="self-stretch h-px bg-zinc-200 mb-4" />

          {/* Simplified Grid for Invitation - Only have Email and ExpiresAt */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[13px]">아이디</span>
              <span className="text-sm font-medium">{user.invitedEmail || user.email}</span>
            </div>

            {/* Empty placeholders removed or simplified */}

            <div className="flex flex-col gap-1">
              <span className="text-[13px]">초대 만료일</span>
              <span className="text-sm font-medium">{user.endDate?.split('T')[0] || "-"}</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
