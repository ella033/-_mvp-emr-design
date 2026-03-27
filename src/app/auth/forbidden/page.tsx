"use client";

import { SignUpLeft } from "../sign-up/_components/sign-up-left";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-white">
      {/* Body */}
      <div className="flex flex-1 items-start self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-1 w-full h-full flex-col items-center justify-center min-h-screen text-gray-900">
          <div className="flex flex-col gap-[40px] w-[360px] ">

            <div className="flex flex-col gap-[8px] ">
              <div className="text-[#171719] font-[Pretendard] text-[22px] font-bold leading-[140%] tracking-[-0.22px]">접속 제한 안내</div>
              <div className="text-[#989BA2] font-[Pretendard] text-sm font-medium leading-[125%] tracking-[-0.14px]">현재 이 페이지에 접근할 수 없습니다. 관리자에게 문의해주세요.</div>
              <div className="flex py-[10px] px-[12px] items-center gap-[8px] self-stretch rounded-[6px] border border-red-400/0 bg-[#FEECEC]">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.599609 8.09961C0.599609 9.08452 0.793603 10.0598 1.17051 10.9697C1.54742 11.8797 2.09987 12.7065 2.79631 13.4029C3.49275 14.0993 4.31954 14.6518 5.22948 15.0287C6.13943 15.4056 7.1147 15.5996 8.09961 15.5996C9.08452 15.5996 10.0598 15.4056 10.9697 15.0287C11.8797 14.6518 12.7065 14.0993 13.4029 13.4029C14.0993 12.7065 14.6518 11.8797 15.0287 10.9697C15.4056 10.0598 15.5996 9.08452 15.5996 8.09961C15.5996 6.11049 14.8094 4.20283 13.4029 2.79631C11.9964 1.38979 10.0887 0.599609 8.09961 0.599609C6.11049 0.599609 4.20283 1.38979 2.79631 2.79631C1.38979 4.20283 0.599609 6.11049 0.599609 8.09961Z" stroke="#FF4242" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.09961 4.76562V8.09896" stroke="#FF4242" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.09961 11.4336H8.10655" stroke="#FF4242" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-[#46474C] font-[Pretendard] text-sm font-medium leading-[125%] tracking-[-0.14px]">허용되지 않은 접속입니다.</div>
              </div>
            </div>
            <button onClick={() => router.replace("/auth/sign-in")} className="flex p-[8px_12px] cursor-pointer justify-center items-center gap-1 self-stretch rounded-[4px] bg-[#180F38] overflow-hidden text-white text-center truncate font-[Pretendard] text-[13px] font-medium leading-[125%] tracking-[-0.13px]">메인 페이지로 이동</button>
          </div>
        </div>
      </div>
    </div>
  );
}
