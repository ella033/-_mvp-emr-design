"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  LayoutGrid,
  Moon,
  Sun,
  MoreHorizontal,
  MoreVertical,
  User,
  Settings,
  Bell,
  Shield,
  FileCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function HeaderBar({ onEnterEditMode }: { onEnterEditMode?: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-[40px] items-center border-b border-[#C2C4C8] bg-white px-[16px] shrink-0">
      {/* Left - 빈 영역 */}
      <div className="flex-1" />

      {/* Right - Icons & Profile */}
      <div className="flex items-center gap-[8px]">
        {/* 1. 채팅 */}
        <button className="flex items-center justify-center p-[4px] text-[#989BA2] hover:text-[#171719] rounded-[4px] hover:bg-[#F4F4F5]" title="메시지">
          <MessageSquare className="h-[16px] w-[16px]" strokeWidth={1.6} />
        </button>

        {/* 2. 레이아웃 */}
        <button className="flex items-center justify-center p-[4px] text-[#989BA2] hover:text-[#171719] rounded-[4px] hover:bg-[#F4F4F5]" title="레이아웃 변경" onClick={onEnterEditMode}>
          <LayoutGrid className="h-[16px] w-[16px]" strokeWidth={1.6} />
        </button>

        {/* 3. 라이트/다크 */}
        <button
          className="flex items-center justify-center p-[4px] text-[#989BA2] hover:text-[#171719] rounded-[4px] hover:bg-[#F4F4F5]"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "라이트 모드" : "다크 모드"}
        >
          {isDarkMode ? <Sun className="h-[16px] w-[16px]" strokeWidth={1.6} /> : <Moon className="h-[16px] w-[16px]" strokeWidth={1.6} />}
        </button>

        {/* 4. 삼점 (세로) */}
        <button className="flex items-center justify-center p-[4px] text-[#989BA2] hover:text-[#171719] rounded-[4px] hover:bg-[#F4F4F5]" title="퀵메뉴 설정">
          <MoreVertical className="h-[16px] w-[16px]" strokeWidth={1.6} />
        </button>

        <div className="mx-[2px] h-[16px] w-px bg-[#DBDCDF]" />

        {/* 5. 사용자 프로필 — 아바타 + 이름만 */}
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center gap-[8px] rounded-[6px] px-[4px] py-[2px] hover:bg-[#F4F4F5] transition-colors"
            onClick={() => { setProfileOpen(!profileOpen); setSettingsOpen(false); }}
          >
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-[#F4A130] to-[#E8751A] shrink-0">
              <span className="text-[12px] font-bold text-white">홍</span>
            </div>
            <span className="text-[13px] font-bold text-[#171719]">홍길동</span>
          </button>

          {/* 프로필 드롭다운 */}
          {profileOpen && (
            <div className="absolute right-0 top-[40px] z-50 w-[240px] rounded-[12px] border border-[#EAEBEC] bg-white py-[4px] shadow-lg">
              {/* 프로필 정보 */}
              <div className="flex items-center gap-[12px] px-[16px] py-[12px] border-b border-[#EAEBEC]">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#F4A130] shrink-0">
                  <span className="text-[16px] font-bold text-white">홍</span>
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[14px] font-bold text-[#171719]">홍길동</span>
                  <span className="text-[12px] text-[#989BA2]">doctor@ubcare.co.kr</span>
                </div>
              </div>

              {/* 메뉴 */}
              <div className="py-[4px]">
                {/* 사용자 설정 → 서브메뉴 */}
                <div className="relative">
                  <button
                    className="flex w-full items-center gap-[10px] px-[16px] py-[8px] text-[#46474C] hover:bg-[#F8F8FA]"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    <Settings className="h-[16px] w-[16px]" />
                    <span className="flex-1 text-left text-[13px]">사용자 설정</span>
                    <ChevronRight className="h-[14px] w-[14px] text-[#989BA2]" />
                  </button>

                  {/* 사용자 설정 서브메뉴 */}
                  {settingsOpen && (
                    <div className="absolute left-[-190px] top-0 w-[180px] rounded-[8px] border border-[#EAEBEC] bg-white py-[4px] shadow-lg">
                      <SubMenuItem icon={<User className="h-[16px] w-[16px]" />} label="계정 정보" />
                      <SubMenuItem icon={<Settings className="h-[16px] w-[16px]" />} label="일반 설정" />
                      <SubMenuItem icon={<Bell className="h-[16px] w-[16px]" />} label="알림 설정" />
                      <SubMenuItem icon={<Shield className="h-[16px] w-[16px]" />} label="보안 관리" />
                      <SubMenuItem icon={<FileCheck className="h-[16px] w-[16px]" />} label="인증서 관리" />
                    </div>
                  )}
                </div>

                <button className="flex w-full items-center gap-[10px] px-[16px] py-[8px] text-[#46474C] hover:bg-[#F8F8FA]">
                  <LayoutGrid className="h-[16px] w-[16px]" />
                  <span className="text-[13px]">레이아웃 초기화</span>
                </button>
              </div>

              <div className="mx-[12px] border-t border-[#EAEBEC]" />

              <div className="py-[4px]">
                <button className="flex w-full items-center gap-[10px] px-[16px] py-[8px] text-[#FF4242] hover:bg-[#F8F8FA]">
                  <LogOut className="h-[16px] w-[16px]" />
                  <span className="text-[13px]">로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubMenuItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-[10px] px-[14px] py-[8px] text-[#46474C] hover:bg-[#F8F8FA]">
      {icon}
      <span className="text-[13px]">{label}</span>
    </button>
  );
}
