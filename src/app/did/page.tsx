"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, CloudFog, Maximize } from "lucide-react";
import { useDidQueues } from "@/hooks/did/use-did-queues";
import type { DidQueueRoom, DidPatient, DidPatientStatus } from "@/types/did-types";
import { motion } from "motion/react";

// 설정 (나중에 API나 설정에서 가져올 수 있음)
const config = {
  hospitalName: "DR GC",
  notice: "GC 목암타운의 임직원 분들을 위해 언제나 최선을 다해 진료합니다. 궁금하신 문의사항은 031-267-8500으로 문의해주세요.",
  callAlertDuration: 6000, // 소리 완료 후 팝업 유지 시간 (6초)
  callAlertSoundFile: "/sounds/call-alert.mp3", // 호출 알림 사운드 파일 경로 (있으면 사용)
};

// 사운드 파일 존재 여부 캐시
let soundFileExists: boolean | null = null;

// 사운드 파일 존재 여부 확인 (최초 1회)
function checkSoundFile() {
  if (soundFileExists !== null) return;

  fetch(config.callAlertSoundFile, { method: "HEAD" })
    .then((res) => {
      soundFileExists = res.ok;
    })
    .catch(() => {
      soundFileExists = false;
    });
}

// 호출 알림 사운드 재생
async function playCallAlertSound(patientName: string, roomName: string) {
  // 파일 존재 여부 확인 (비동기, 다음 호출부터 적용)
  checkSoundFile();

  // 차임벨 + TTS (1회)
  if (soundFileExists === true) {
    try {
      const audio = new Audio(config.callAlertSoundFile);
      audio.volume = 0.7;
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
      });
    } catch {
      await playGeneratedChime();
    }
  } else {
    await playGeneratedChime();
  }

  await speakCallAlert(patientName, roomName);
}

// TTS: 한국어 여성 음성 캐싱
let cachedVoice: SpeechSynthesisVoice | null = null;

function findKoreanFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  const koreanVoices = voices.filter((v) => v.lang.includes("ko"));
  const femaleKeywords = ["google 한국어", "yuna", "sunhi", "heami", "female", "여성"];
  const maleKeywords = ["male", "남성", "junwoo", "hyunbin"];

  for (const keyword of femaleKeywords) {
    const found = koreanVoices.find((v) => {
      const nameLower = v.name.toLowerCase();
      return nameLower.includes(keyword) && !maleKeywords.some((mk) => nameLower.includes(mk));
    });
    if (found) return found;
  }
  return koreanVoices.find((v) => !maleKeywords.some((mk) => v.name.toLowerCase().includes(mk))) || koreanVoices[0] || null;
}

// TTS 음성 안내 (1회, 여성 음성 우선)
function speakCallAlert(patientName: string, roomName: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      console.warn("이 브라우저는 음성 합성을 지원하지 않습니다.");
      resolve();
      return;
    }

    const trySpeak = () => {
      if (!cachedVoice) {
        cachedVoice = findKoreanFemaleVoice();
      }

      const message = `${patientName} 님, ${roomName}로 들어오세요.`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ko-KR";
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      if (cachedVoice) {
        utterance.voice = cachedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    };

    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    } else {
      trySpeak();
    }

    // 안전장치: 최대 5초 후 강제 resolve
    setTimeout(resolve, 5000);
  });
}

// Web Audio API로 병원 호출 알림음 생성 (도-미-솔-도 멜로디)
function playGeneratedChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;

      // 친근한 차임벨 멜로디 (도-미-솔-도)
      playTone(523.25, now, 0.4);        // 도 (C5)
      playTone(659.25, now + 0.4, 0.4);  // 미 (E5)
      playTone(783.99, now + 0.8, 0.4);  // 솔 (G5)
      playTone(1046.50, now + 1.2, 0.8); // 높은 도 (C6)

      setTimeout(resolve, 2000);
    } catch (e) {
      console.warn("호출 알림 사운드 재생 실패:", e);
      resolve();
    }
  });
}

// 이름 마스킹 (홍길동 → 홍○동, 김철 → 김○)
function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "○";
  return name[0] + "○".repeat(name.length - 2) + name[name.length - 1];
}

// 이름 길이에 따른 동적 폰트 크기 계산 (호출 팝업용)
function getNameFontSize(maskedName: string): string {
  const len = (maskedName + " 님").length;
  if (len <= 5) return "text-[120px]";
  if (len <= 8) return "text-[96px]";
  if (len <= 12) return "text-[72px]";
  return "text-[56px]";
}

// 이름 길이에 따른 동적 폰트 크기 계산 (환자 카드용)
function getCardNameFontSize(maskedName: string): string {
  const len = maskedName.length;
  if (len <= 4) return "text-[48px]";
  if (len <= 6) return "text-[40px]";
  if (len <= 10) return "text-[32px]";
  return "text-[28px]";
}

// 호출 알림 정보 타입
interface CallAlert {
  maskedName: string;  // 마스킹된 이름 (팝업 표시용)
  rawName: string;     // 원본 이름 (TTS 호출용)
  roomName: string;
};

// 상태 한글 변환
const statusLabel: Record<DidPatientStatus, string> = {
  WAITING: "대기중",
  IN_TREATMENT: "진료중",
};

// 현재 날짜/시간 포맷
function useCurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const month = time.getMonth() + 1;
  const date = time.getDate();
  const day = dayNames[time.getDay()];
  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const ampm = hours < 12 ? "오전" : "오후";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${month}월 ${date}일(${day}) ${ampm} ${displayHours.toString().padStart(2, "0")}:${minutes}`;
}

// 날씨 데이터 타입
interface WeatherData {
  temp: number;
  icon: string;
  description: string;
}

// 날씨 데이터 조회 hook (백엔드에서 병원 좌표 자동 처리)
function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/did/weather", {
          credentials: "include",
          headers: {
            "x-client-type": "did",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setWeather({
          temp: Math.round(data.main?.temp ?? 0),
          icon: data.weather?.[0]?.icon ?? "01d",
          description: data.weather?.[0]?.description ?? "",
        });
      } catch (e) {
        console.warn("날씨 정보 조회 실패:", e);
      }
    };

    fetchWeather();
    // 10분마다 갱신
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return weather;
}

// 날씨 아이콘 컴포넌트 (Lucide icons 사용)
function WeatherIcon({ icon }: { icon: string }) {
  const iconClass = "w-8 h-8";

  // OpenWeatherMap icon code mapping
  if (icon.includes("11")) return <CloudLightning className={`${iconClass} text-yellow-400`} />;
  if (icon.includes("13")) return <CloudSnow className={`${iconClass} text-gray-400`} />;
  if (icon.includes("50")) return <CloudFog className={`${iconClass} text-gray-400`} />;
  if (icon.includes("09")) return <CloudDrizzle className={`${iconClass} text-blue-400`} />;
  if (icon.includes("10")) return <CloudRain className={`${iconClass} text-blue-400`} />;
  if (icon.includes("03") || icon.includes("04")) return <Cloud className={`${iconClass} text-gray-400`} />;
  // 01 (clear) or 02 (few clouds)
  return <Sun className={`${iconClass} text-yellow-400`} />;
}

// 상단 헤더 바
function HeaderBar() {
  const currentTime = useCurrentTime();
  const weather = useWeather();

  return (
    <header className="flex flex-row justify-between items-center px-7 w-full h-[76px] bg-white border-b border-[#C2C4C8]">
      {/* 로고 영역 */}
      <div className="flex flex-row items-center">
        <img
          src="/ads/logo.svg"
          alt="Logo"
          className="h-[60px] w-auto"
        />
      </div>

      {/* 날씨 + 날짜/시간 */}
      <div className="flex flex-row items-center gap-4">
        {/* 날씨 */}
        {weather && (
          <div className="flex flex-row items-center gap-2">
            <WeatherIcon icon={weather.icon} />
            <span className="text-[22px] font-bold leading-[140%] tracking-[-0.01em] text-[#2D2D2D]">
              {weather.temp}°
            </span>
          </div>
        )}

        {/* 구분선 */}
        {weather && (
          <div className="w-[2px] h-8 bg-[#E7E7E7]" />
        )}

        {/* 날짜/시간 */}
        <span className="text-[22px] font-bold leading-[140%] tracking-[-0.01em] text-[#2D2D2D]">
          {currentTime}
        </span>
      </div>
    </header>
  );
}

// 하단 공지 바 (부드러운 좌측 슬라이딩)
function FooterBar() {
  return (
    <footer className="relative w-full h-[76px] bg-[#46474C] overflow-hidden">
      <div className="absolute top-0 left-0 h-full whitespace-nowrap flex items-center animate-marquee">
        <span className="text-[28px] font-normal leading-[140%] tracking-[-0.01em] text-[#EAEAEA] px-[50vw]">
          {config.notice}
        </span>
        <span className="text-[28px] font-normal leading-[140%] tracking-[-0.01em] text-[#EAEAEA] px-[50vw]">
          {config.notice}
        </span>
      </div>
    </footer>
  );
}

// 환자 카드
function PatientCard({ patient, number }: { patient: DidPatient; number: number }) {
  const isActive = patient.status === "IN_TREATMENT";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
      className={`
        box-border flex flex-row justify-between items-center
        px-[30px] py-0
        w-full h-[120px]
        rounded-[10px]
        animate-card-enter
        ${isActive
          ? "bg-[#EDE8FF] border-2 border-[#4F29E5]"
          : "bg-white border border-[#DBDCDF]"
        }
      `}
    >
      {/* 번호 + 이름 (왼쪽 정렬) */}
      <div className="flex flex-row items-center gap-6 min-w-0 flex-1">
        {/* 번호 뱃지 */}
        <div
          className={`
            flex flex-col justify-center items-center
            w-[60px] h-[60px] shrink-0
            rounded-[10px]
            ${isActive ? "bg-[#4F29E5]" : "bg-[#F4F4F5]"}
          `}
        >
          <span
            className={`
              text-[38px] font-medium leading-[140%] tracking-[-0.01em] text-center
              ${isActive ? "text-white" : "text-[#70737C]"}
            `}
          >
            {number}
          </span>
        </div>

        {/* 환자 이름 (마스킹) */}
        <span
          className={`
            ${getCardNameFontSize(maskName(patient.name))} leading-[140%] tracking-[-0.01em]
            text-[#2D2D2D] truncate
            ${isActive ? "font-bold" : "font-medium"}
          `}
        >
          {maskName(patient.name)}
        </span>
      </div>

      {/* 상태 (오른쪽 정렬) */}
      <span
        className={`
          text-[38px] leading-[140%] tracking-[-0.01em] text-right shrink-0
          ${isActive
            ? "font-bold text-[#4F29E5]"
            : "font-medium text-[#C2C4C8]"
          }
        `}
      >
        {statusLabel[patient.status]}
      </span>
    </motion.div>
  );
}

// 페이지당 환자 수
const PATIENTS_PER_PAGE = 6;
// 페이지 자동 전환 간격 (ms)
const PAGE_SLIDE_INTERVAL = 5000;

// 진료실 컬럼
function RoomColumn({ room, expand }: { room: DidQueueRoom; expand?: boolean }) {
  // 대기 환자 수 = 진료중 환자 제외
  const totalCount = room.patients.filter((p) => p.status === "WAITING").length;

  // 진료중 환자를 맨 위로 정렬
  const sortedPatients = [...room.patients].sort((a, b) => {
    if (a.status === "IN_TREATMENT" && b.status !== "IN_TREATMENT") return -1;
    if (a.status !== "IN_TREATMENT" && b.status === "IN_TREATMENT") return 1;
    return 0;
  });


  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sortedPatients.length / PATIENTS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageFading, setIsPageFading] = useState(false);

  // 페이지 전환 헬퍼 (페이드아웃 → 페이지 변경 → 페이드인)
  const changePage = useCallback((getNext: (prev: number) => number) => {
    setIsPageFading(true);
    setTimeout(() => {
      setCurrentPage(getNext);
      setIsPageFading(false);
    }, 300);
  }, []);

  // 환자 수 변동 시 페이지 범위 보정
  useEffect(() => {
    setCurrentPage((prev) => (prev >= totalPages ? 0 : prev));
  }, [totalPages]);

  // 진료중 환자 명단이 바뀌면 첫 페이지로 이동 (호출 팝업과 뒤 화면 일치)
  const inTreatmentNames = room.patients
    .filter((p) => p.status === "IN_TREATMENT")
    .map((p) => p.name)
    .sort()
    .join(",");
  const prevInTreatmentNamesRef = useRef(inTreatmentNames);
  useEffect(() => {
    if (inTreatmentNames !== prevInTreatmentNamesRef.current && currentPage !== 0) {
      changePage(() => 0);
    }
    prevInTreatmentNamesRef.current = inTreatmentNames;
  }, [inTreatmentNames, currentPage, changePage]);

  // 자동 페이지 전환 (2페이지 이상일 때만)
  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      changePage((prev) => (prev + 1) % totalPages);
    }, PAGE_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [totalPages, changePage]);

  const pagePatients = sortedPatients.slice(
    currentPage * PATIENTS_PER_PAGE,
    (currentPage + 1) * PATIENTS_PER_PAGE,
  );
  // 전체 리스트 기준 번호 오프셋
  const numberOffset = currentPage * PATIENTS_PER_PAGE;


  return (
    <div className={`flex flex-col items-start h-full bg-white ${expand ? "flex-1" : "w-[40%] shrink-0"}`}>
      {/* 타이틀 바 */}
      <div className="flex flex-row justify-between items-center px-14 w-full h-[130px] bg-[#46474C]">
        <div className="flex flex-row items-center gap-6">
          <span className="text-[42px] font-bold leading-[140%] tracking-[-0.01em] text-white">
            {room.roomPanel}
          </span>
          <>
            <div className="w-1 h-[42px] bg-[#70737C]" />
            <span className="text-[42px] font-bold leading-[140%] tracking-[-0.01em] text-white">
              김현호
            </span>
          </>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-medium text-white/50 font-pretendard tracking-tight">
            대기
          </span>
          <span className="text-[28px] font-bold text-white font-pretendard tracking-tight">
            {totalCount}명
          </span>
        </div>
      </div>

      {/* 환자 리스트 (페이지네이션, 부드러운 전환) */}
      <div
        className={`flex flex-col items-start px-10 py-6 gap-4 w-full flex-1 overflow-hidden transition-opacity duration-300 ease-in-out ${
          isPageFading ? "opacity-0" : "opacity-100"
        }`}
      >
        {pagePatients.map((patient, index) => (
          <PatientCard key={patient.id} patient={patient} number={numberOffset + index + 1} />
        ))}
      </div>

    </div>
  );
}

// 로딩 상태
function LoadingState() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-white">
      <span className="text-[32px] text-[#70737C]">대기열 정보를 불러오는 중...</span>
    </div>
  );
}

// 에러 상태
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-white">
      <span className="text-[32px] text-red-500">{message}</span>
    </div>
  );
}

// 빈 상태
function EmptyState() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-white">
      <span className="text-[32px] text-[#70737C]">현재 대기 중인 환자가 없습니다.</span>
    </div>
  );
}

// 광고 이미지 목록 (public/ads 폴더에 이미지 추가)
const AD_IMAGES = [
  "/ads/did-img-1.svg",
  "/ads/did-img-2.svg",
  "/ads/did-img-3.svg",
];
const AD_SLIDE_INTERVAL = 10000; // 10초

// 광고 영역 (진료실 1개일 때 표시)
function AdZone() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasImages, setHasImages] = useState(true);

  useEffect(() => {
    // 첫 번째 이미지 존재 여부 확인
    const img = new Image();
    img.onload = () => setHasImages(true);
    img.onerror = () => setHasImages(false);
    img.src = AD_IMAGES[0];
  }, []);

  useEffect(() => {
    if (!hasImages) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AD_IMAGES.length);
    }, AD_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [hasImages]);

  if (!hasImages) {
    // 광고 이미지 없으면 그라데이션 배경만 표시
    return (
      <div className="flex items-center justify-center w-[60%] h-full overflow-hidden shrink-0 bg-gradient-to-br from-[#EDE8FF] via-[#F5F3FF] to-[#E0E7FF]">
        <div className="text-[32px] text-[#70737C]">광고 영역</div>
      </div>
    );
  }

  return (
    <div className="relative w-[60%] h-full overflow-hidden shrink-0 bg-gradient-to-br from-[#EDE8FF] via-[#F5F3FF] to-[#E0E7FF]">
      {AD_IMAGES.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
        >
          <img
            src={src}
            alt={`광고 ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}


// 환자 호출 알림 팝업 (페이드인/스케일업 애니메이션)
function CallAlertPopup({
  alert,
  onClose,
  closing,
}: {
  alert: CallAlert;
  onClose: () => void;
  closing?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });
  }, []);

  // 외부에서 closing=true로 전환하면 fade-out 후 onClose 호출
  useEffect(() => {
    if (closing) {
      setIsAnimating(false);
      setTimeout(onClose, 150);
    }
  }, [closing, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-150 ease-out ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => {
        setIsAnimating(false);
        setTimeout(onClose, 150);
      }}
    >
      {/* 오버레이 */}
      <div
        className={`absolute inset-0 bg-white/80 transition-opacity duration-150 ease-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 호출 팝업 */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 w-[1020px] p-2.5 rounded-[32px] bg-gradient-to-t from-[#F2F7FF] to-white shadow-[0_0_12px_rgba(0,0,0,0.16)] border border-[#E7E7E7] transition-all duration-200 ease-out ${
          isAnimating
            ? "opacity-100 -translate-y-1/2 scale-100"
            : "opacity-0 -translate-y-[40%] scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 내부 프레임 */}
        <div
          className={`flex flex-col justify-center items-center w-full h-[580px] rounded-[28px] bg-gradient-to-t from-[#F2F7FF] to-white border-[10px] border-[#6541F2] transition-all duration-200 ease-out ${
            isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
          }`}
        >
          {/* 이름 (마스킹) */}
          <p
            className={`${getNameFontSize(alert.maskedName)} font-bold leading-[140%] text-center text-[#171719] transition-all duration-200 ease-out ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {alert.maskedName} 님
          </p>
          {/* 진료실 + 안내 문구 */}
          <p
            className={`text-[72px] font-bold leading-[140%] text-center mt-8 transition-all duration-200 ease-out ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-[#6541F2]">{alert.roomName}</span>
            <span className="text-[#171719]"> 로</span>
          </p>
          <p
            className={`text-[72px] font-bold leading-[140%] text-center text-[#171719] transition-all duration-200 ease-out ${
              isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            들어오시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function DIDPageContent() {
  const searchParams = useSearchParams();
  const roomName = searchParams.get("roomName") ?? undefined;
  const { data: rooms, isLoading, error } = useDidQueues({ refetchInterval: 1000, roomName });

  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const focusRecoveryTimerRef = useRef<number | null>(null);
  const hasShownFullscreenPromptRef = useRef(false);

  const focusDidWindow = useCallback(() => {
    window.focus();
    if (document.body.tabIndex !== -1) {
      document.body.tabIndex = -1;
    }
    document.body.focus({ preventScroll: true });
  }, []);

  const stopFocusRecovery = useCallback(() => {
    if (focusRecoveryTimerRef.current !== null) {
      window.clearInterval(focusRecoveryTimerRef.current);
      focusRecoveryTimerRef.current = null;
    }
  }, []);

  const startFocusRecovery = useCallback(() => {
    stopFocusRecovery();
    focusDidWindow();
    const endAt = Date.now() + 3000;
    focusRecoveryTimerRef.current = window.setInterval(() => {
      focusDidWindow();
      if (Date.now() >= endAt) {
        stopFocusRecovery();
      }
    }, 250);
  }, [focusDidWindow, stopFocusRecovery]);

  const showFullscreenPromptOnce = useCallback(() => {
    if (hasShownFullscreenPromptRef.current) return;
    hasShownFullscreenPromptRef.current = true;
    setShowFullscreenPrompt(true);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (isNowFullscreen) {
        stopFocusRecovery();
        setShowFullscreenPrompt(false);
        return;
      }

      const isPopup = !!window.opener;
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

      if (isPopup || isStandalone) {
        startFocusRecovery();
        showFullscreenPromptOnce();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [showFullscreenPromptOnce, startFocusRecovery, stopFocusRecovery]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) return;
    document.documentElement.requestFullscreen().catch(() => {
      showFullscreenPromptOnce();
    });
  }, [showFullscreenPromptOnce]);

  const handleScreenClick = useCallback(() => {
    // 클릭 시 소리 활성화 (브라우저 autoplay 정책 우회)
    if (!isSoundEnabledRef.current) {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance("");
        speechSynthesis.speak(utterance);
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          cachedVoice = findKoreanFemaleVoice();
        } else {
          speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.onvoiceschanged = null;
            cachedVoice = findKoreanFemaleVoice();
          };
        }
      }
      isSoundEnabledRef.current = true;
      setIsSoundEnabled(true);
    }
    if (document.fullscreenElement) return;
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  // 관리 페이지에서 전체화면 요청 수신
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "request-focus") {
        startFocusRecovery();
        return;
      }

      if (e.data?.type === "request-fullscreen") {
        if (document.fullscreenElement) return;
        // 직접 전체화면 시도 (브라우저에 따라 성공할 수 있음)
        document.documentElement.requestFullscreen().catch(() => {
          // 실패 시 클릭 유도 오버레이 표시
          showFullscreenPromptOnce();
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showFullscreenPromptOnce, startFocusRecovery]);

  useEffect(() => {
    return () => stopFocusRecovery();
  }, [stopFocusRecovery]);

  // 관리 페이지에서 열렸거나 PWA 모드일 때 자동 전체화면
  useEffect(() => {
    const isPopup = !!window.opener;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if ((isPopup || isStandalone) && !document.fullscreenElement) {
      // 자동 전체화면 시도 → 실패 시 클릭/키보드 안내
      document.documentElement.requestFullscreen().catch(() => {
        const enterFullscreen = () => {
          document.documentElement.requestFullscreen().catch(() => {});
          document.removeEventListener("click", enterFullscreen);
          document.removeEventListener("keydown", enterFullscreen);
        };
        document.addEventListener("click", enterFullscreen, { once: true });
        document.addEventListener("keydown", enterFullscreen, { once: true });
        showFullscreenPromptOnce();
      });
    }
  }, [showFullscreenPromptOnce]);

  // 소리 활성화 상태
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const isSoundEnabledRef = useRef(false);

  // 호출 알림 큐 시스템
  const [alertQueue, setAlertQueue] = useState<CallAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<CallAlert | null>(null);
  const [alertClosing, setAlertClosing] = useState(false);
  const prevPatientsRef = useRef<Map<number, { status: DidPatientStatus; room: string; calledAt: string | null }>>();

  // 소리 활성화 (클릭으로 호출)
  const enableSound = useCallback(() => {
    // TTS 엔진 미리 활성화 + 음성 캐싱
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("");
      speechSynthesis.speak(utterance);
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        cachedVoice = findKoreanFemaleVoice();
      } else {
        speechSynthesis.onvoiceschanged = () => {
          speechSynthesis.onvoiceschanged = null;
          cachedVoice = findKoreanFemaleVoice();
        };
      }
    }
    isSoundEnabledRef.current = true;
    setIsSoundEnabled(true);
  }, []);

  // 페이지 로드 시 자동으로 소리 활성화 시도
  useEffect(() => {
    if (isSoundEnabledRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === "running") {
        isSoundEnabledRef.current = true;
        setIsSoundEnabled(true);
      }
      ctx.close();
    } catch (e) {
      console.warn("[DID] AudioContext 생성 실패:", e);
    }
  }, []);

  // 알림 추가 (큐에 넣기)
  const addAlert = useCallback((alert: CallAlert) => {
    setAlertQueue((queue) => [...queue, alert]);
  }, []);

  // 큐에서 다음 알림 처리 (currentAlert가 null일 때만)
  useEffect(() => {
    if (currentAlert !== null || alertQueue.length === 0) return;

    const [nextAlert, ...remainingQueue] = alertQueue;
    setCurrentAlert(nextAlert);
    setAlertClosing(false);
    setAlertQueue(remainingQueue);

    // 최소 6초 보장, 소리가 더 길면 소리 끝난 1초 뒤 닫기
    const startTime = Date.now();
    playCallAlertSound(nextAlert.rawName, nextAlert.roomName).then(() => {
      const elapsed = Date.now() - startTime;
      const remaining = config.callAlertDuration - elapsed;
      if (remaining > 0) {
        setTimeout(() => setAlertClosing(true), remaining);
      } else {
        setTimeout(() => setAlertClosing(true), 1000);
      }
    });
  }, [alertQueue, currentAlert]);

  // 진료중으로 변경된 환자 감지
  useEffect(() => {
    if (!rooms) return;

    const prevMap = prevPatientsRef.current;
    const newMap = new Map<number, { status: DidPatientStatus; room: string; calledAt: string | null }>();

    // 현재 상태 수집 및 변경 감지
    rooms.forEach((room) => {
      room.patients.forEach((patient) => {
        const key = patient.id;
        newMap.set(key, { status: patient.status, room: room.roomPanel, calledAt: patient.calledAt });

        if (prevMap) {
          const prev = prevMap.get(key);
          // 1) WAITING -> IN_TREATMENT 전환 (기존 로직)
          // 2) 이미 IN_TREATMENT인데 calledAt이 변경된 경우 (재호출)
          const isNewCall = prev?.status === "WAITING" && patient.status === "IN_TREATMENT";
          const isRecall = prev?.status === "IN_TREATMENT" && patient.status === "IN_TREATMENT"
            && patient.calledAt && prev.calledAt !== patient.calledAt;

          if (isNewCall || isRecall) {
            addAlert({
              maskedName: maskName(patient.name),
              rawName: patient.name,
              roomName: room.roomPanel,
            });
          }
        }
      });
    });

    prevPatientsRef.current = newMap;
  }, [rooms, addAlert]);

  // 현재 알림 팝업 닫기 (다음 알림은 useEffect에서 자동 처리)
  const handleCloseAlert = useCallback(() => {
    setCurrentAlert(null);
    setAlertClosing(false);
  }, []);

  return (
    <div
      className="flex flex-col items-start w-full h-screen overflow-hidden"
      style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
      onClickCapture={handleScreenClick}
    >
      {/* 상단 헤더 */}
      <HeaderBar />

      {/* 메인 바디 - 진료실 컬럼들 */}
      <main className="flex flex-row items-stretch w-full flex-1 bg-[#989BA2] overflow-hidden">
        {(() => {
          if (isLoading) return <LoadingState />;
          if (error) return <ErrorState message={error instanceof Error ? error.message : "데이터 로드 실패"} />;
          if (!rooms || rooms.length === 0) return <EmptyState />;
          if (rooms.length === 1) {
            return (
              <>
                <AdZone />
                <RoomColumn room={rooms[0]} />
              </>
            );
          }
          return rooms.map((room, idx) => (
            <div key={room.roomPanel} className="flex flex-1 h-full">
              {idx > 0 && <div className="w-[1px] bg-gray-300 shrink-0" />}
              <RoomColumn room={room} expand />
            </div>
          ));
        })()}
      </main>

      {/* 하단 공지 바 */}
      <FooterBar />

      {/* 환자 호출 알림 팝업 */}
      {currentAlert && (
        <CallAlertPopup alert={currentAlert} onClose={handleCloseAlert} closing={alertClosing} />
      )}

      {/* 하단 우측 버튼들 */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-[#46474C] text-white rounded-full shadow-lg hover:bg-[#2D2D2D] transition-colors"
          title="전체화면"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* 전체화면 전환 오버레이 (관리 페이지에서 요청 시) */}
      {showFullscreenPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 cursor-pointer outline-none"
          tabIndex={0}
          autoFocus
          onClick={() => {
            document.documentElement.requestFullscreen().catch(() => {});
            setShowFullscreenPrompt(false);
          }}
          onKeyDown={() => {
            document.documentElement.requestFullscreen().catch(() => {});
            setShowFullscreenPrompt(false);
          }}
        >
          <div className="flex flex-col items-center gap-4 p-12 bg-white rounded-2xl shadow-2xl">
            <Maximize className="w-16 h-16 text-[#4F29E5]" />
            <p className="text-[32px] font-bold text-[#171719]">화면을 클릭하거나 아무 키를 누르면 전체화면으로 전환됩니다</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DIDPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DIDPageContent />
    </Suspense>
  );
}
