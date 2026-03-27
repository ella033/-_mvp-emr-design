import Image from "next/image";

export function SignUpLeft() {
  return (
    <div className="w-1/2 flex justify-end items-center h-full">
      <Image
        src="/sign-up-main.png"
        alt="회원가입 메인 이미지"
        width={954}
        height={968}
        className="w-[954px] h-auto object-contain"
        priority
      />
    </div>
  );
}
