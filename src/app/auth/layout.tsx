export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center items-center w-screen h-screen min-h-screen mt-[-40px] relative overflow-hidden">
      {/* 대각선 물결 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100"></div>

      {/* 대각선 흐르는 물결 효과 */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            linear-gradient(45deg, 
              transparent 0%, 
              rgba(59, 130, 246, 0.3) 25%, 
              transparent 50%, 
              rgba(147, 51, 234, 0.3) 75%, 
              transparent 100%
            )
          `,
          animation: "waveFlow 15s ease-in-out infinite",
        }}
      ></div>

      {/* 반대 방향 물결 효과 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(-45deg, 
              transparent 0%, 
              rgba(236, 72, 153, 0.25) 30%, 
              transparent 60%, 
              rgba(6, 182, 212, 0.25) 90%, 
              transparent 100%
            )
          `,
          animation: "waveFlow 20s ease-in-out infinite reverse",
        }}
      ></div>

      {/* 부드러운 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-br via-transparent from-white/10 to-white/5"></div>

      {/* 콘텐츠 */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
