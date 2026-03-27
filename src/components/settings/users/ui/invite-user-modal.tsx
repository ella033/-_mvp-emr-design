import { useState, useEffect } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { Loader2 } from "lucide-react";
import { userManagementApi } from "../api/user.api";
import { GetRolesResponseDto } from "../model";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, roleId: string) => void;
}

export function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [roles, setRoles] = useState<GetRolesResponseDto[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingRoles(true);
      userManagementApi.getRoles()
        .then(data => {
          setRoles(data);
        })
        .catch(err => {
          console.error("Failed to fetch roles", err);
        })
        .finally(() => {
          setIsLoadingRoles(false);
        });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!email || !roleId) return;

    setIsSending(true);
    try {
      await onInvite(email, roleId);
      handleClose();
    } catch (e) {
      console.error(e);
      // Error handling should be done in parent via onError or throw
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRoleId("");
    onClose();
  }

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={handleClose}
      title="사용자 초대"
      width="560px"
      height="auto"
      minHeight="280px"
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-1 flex-col gap-[20px] p-[14px]">
          {/* Email */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-bold text-foreground leading-[16px]">
              이메일 <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-bold text-foreground leading-[16px]">
              권한 <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                style={{
                  color: roleId ? "inherit" : "var(--muted-foreground)"
                }}
                disabled={isLoadingRoles}
              >
                <option value="" disabled className="text-muted-foreground">
                  {isLoadingRoles ? "권한 불러오는 중..." : "권한 선택"}
                </option>
                {roles.map(role => (
                  <option key={role.id} value={role.id} className="text-foreground">
                    {role.name}
                  </option>
                ))}
              </select>
              {/* Dropdown Arrow */}
              <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-[8px] p-[16px]">
          <button
            onClick={handleClose}
            className="h-[32px] px-[12px] border border-border rounded-[4px] bg-background text-[13px] text-foreground hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!email || !roleId || isSending}
            className="h-[32px] px-[12px] rounded-[4px] bg-primary text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px]"
          >
            {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : "초대"}
          </button>
        </div>
      </div>
    </MyPopup>
  );
}
