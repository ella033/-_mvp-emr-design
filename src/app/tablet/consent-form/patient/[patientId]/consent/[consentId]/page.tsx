"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useConsentById, useSignConsent } from "@/hooks/consent/use-create-consent";
import { ConsentsApi } from "@/lib/api/routes/consents-api";
import type { ConsentField, ConsentSignatureField } from "@/lib/api/routes/consents-api";
import { getGender } from "@/lib/patient-utils";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import ConsentHeader from "@/app/tablet/consent-form/_components/consent-header";
import SignatureModal from "@/app/tablet/consent-form/_components/signature-modal";
import { useQueryClient } from "@tanstack/react-query";
import { FIELD_EDITOR_SCALE } from "@/constants/pdf-scale";

const PdfViewer = dynamic(
  () => import("@/app/(document-dev)/_components/PdfViewer"),
  { ssr: false }
);

export default function ConsentFormDetailPage() {
  const DATE_TEXT_SCALE = 1.25;
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAutoJumpedRef = useRef(false);
  const params = useParams<{ patientId: string; consentId: string }>();
  const patientId = params?.patientId || "";
  const consentId = params?.consentId || "";
  const numericConsentId = Number(consentId);
  const [signatureImages, setSignatureImages] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfScale, setPdfScale] = useState<number | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [isPdfFullyRendered, setIsPdfFullyRendered] = useState(false);
  const [pdfSize, setPdfSize] = useState<{
    width: number;
    height: number;
    scale: number;
  } | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startScrollTop: number;
    didScroll: boolean;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const lastContainerWidthRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const signedFieldId = searchParams.get("signed");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isFinalCompleted, setIsFinalCompleted] = useState(false);
  const queryClient = useQueryClient();
  const [patientInfo, setPatientInfo] = useState<{
    id: number | string;
    name: string;
    patientNo?: string | number;
    birthDate?: string;
    gender?: number | string;
    phone1?: string;
    phone2?: string;
  } | null>(null);
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const hasInitializedCheckboxesRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomLevelRef = useRef(1);
  const pinchRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    startScrollLeft: number;
    startScrollTop: number;
    viewMidX: number;
    viewMidY: number;
  } | null>(null);
  const lastTapRef = useRef<number>(0);
  const zoomWrapperRef = useRef<HTMLDivElement | null>(null);
  const zoomStageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    router.prefetch("/tablet/consent-form/patient-list");
  }, [router]);


  useEffect(() => {
    const stored = window.sessionStorage.getItem("consent-selected-patient");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (String(parsed.id) === String(patientId)) {
        setPatientInfo({
          id: parsed.id,
          name: parsed.name || "",
          patientNo: parsed.patientNo ?? parsed.id,
          birthDate: parsed.birthDate || "",
          gender: parsed.gender ?? 0,
          phone1: parsed.phone1 || "",
          phone2: parsed.phone2 || "",
        });
      }
    } catch {
      // ignore invalid storage data
    }
  }, [patientId]);

  const handleBack = () => {
    window.sessionStorage.setItem("consent-list-transition", "back");
    router.push(`/tablet/consent-form/patient/${patientId}`);
  };

  const {
    data: consentDetail,
    isLoading: isConsentLoading,
    error: consentError,
  } = useConsentById(Number.isNaN(numericConsentId) ? undefined : numericConsentId);

  const { mutateAsync: signConsent } = useSignConsent();

  const content = consentDetail?.content;
  const pdfContent =
    content && "type" in content && content.type === "PDF" ? content : null;
  const isPdf = !!pdfContent;
  const pdfUrl = useMemo(() => {
    if (!pdfContent || !numericConsentId || Number.isNaN(numericConsentId)) return "";
    return `/api/consents/${numericConsentId}/pdf`;
  }, [pdfContent, numericConsentId]);

  const title = useMemo(
    () => consentDetail?.title || "동의서",
    [consentDetail?.title]
  );

  const signatureFields = useMemo<ConsentSignatureField[]>(() => {
    if (!pdfContent) return [];
    return pdfContent.signatureFields ?? [];
  }, [pdfContent]);

  const inputFields = useMemo<ConsentField[]>(() => {
    if (!pdfContent) return [];
    return pdfContent.fields ?? [];
  }, [pdfContent]);

  const currentPageFields = useMemo(
    () => signatureFields.filter((field) => field.page === currentPage),
    [signatureFields, currentPage]
  );

  const currentPageInputFields = useMemo(
    () => inputFields.filter((field) => field.pageNumber === currentPage),
    [inputFields, currentPage]
  );

  useEffect(() => {
    if (!signedFieldId || signatureFields.length === 0) return;
    if (hasAutoJumpedRef.current) return;
    const signedField = signatureFields.find(
      (field) => field.fieldId === signedFieldId
    );
    if (signedField && signedField.page !== currentPage) {
      setCurrentPage(signedField.page);
    }
    hasAutoJumpedRef.current = true;
  }, [searchParams, signatureFields, currentPage]);

  useEffect(() => {
    setIsPdfLoading(true);
    setIsPdfFullyRendered(false);
  }, [pdfUrl]);


  const handlePdfPageLoad = useCallback(
    (size: { width: number; height: number; scale: number }) => {
      setPdfSize((prev) => {
        if (!prev) return size;
        const isSameWidth = Math.abs(prev.width - size.width) <= 0.5;
        const isSameHeight = Math.abs(prev.height - size.height) <= 0.5;
        const isSameScale = Math.abs(prev.scale - size.scale) <= 0.0001;
        return isSameWidth && isSameHeight && isSameScale ? prev : size;
      });
    },
    []
  );

  const handlePdfPageRender = useCallback(() => {
    setIsPdfFullyRendered(true);
  }, []);

  const pageSize = useMemo(() => {
    if (!pdfContent || !pdfSize) return null;
    const pageOverride = pdfContent.pageSizes?.find(
      (size) => size.page === currentPage
    );
    const candidateWidth = pageOverride?.width ?? pdfContent.pageWidth;
    const candidateHeight = pageOverride?.height ?? pdfContent.pageHeight;
    const baseWidth =
      candidateWidth && candidateWidth >= 400 && candidateWidth <= 900
        ? candidateWidth
        : 595;
    const baseHeight =
      candidateHeight && candidateHeight >= 600 && candidateHeight <= 1200
        ? candidateHeight
        : 842;
    return { baseWidth, baseHeight };
  }, [pdfContent, pdfSize, currentPage]);

  const signatureOffset = useMemo(() => {
    return { x: 0, y: 0 };
  }, []);

  const signatureScale = useMemo(() => 3, []);
  const unsignedFieldScale = useMemo(() => 1, []);

  const resolveFieldValue = (field: ConsentField) => {
    const source = field.dataSource || "";
    const nameKey = field.name?.trim().toLowerCase() || "";
    if (source === "patient.id") {
      return patientInfo?.patientNo ?? patientInfo?.id ?? "";
    }
    if (source === "patient.name") {
      return patientInfo?.name ?? "";
    }
    if (source === "patient.birthDate") {
      const birthDate = patientInfo?.birthDate ?? "";
      if (typeof birthDate === "string" && /^\d{8}$/.test(birthDate)) {
        const year = birthDate.slice(0, 4);
        const month = birthDate.slice(4, 6);
        const day = birthDate.slice(6, 8);
        return `${year}-${month}-${day}`;
      }
      return birthDate;
    }
    if (source === "patient.gender") {
      const rawGender = patientInfo?.gender;
      if (rawGender === "M" || rawGender === "m") return "남";
      if (rawGender === "F" || rawGender === "f") return "여";
      if (rawGender == null) return "";
      const normalized = Number(rawGender);
      if (Number.isFinite(normalized)) {
        return getGender(normalized, "ko");
      }
      return String(rawGender);
    }
    if (source === "patient.phone1") {
      return patientInfo?.phone1 ?? "";
    }
    if (source === "patient.phone2") {
      return patientInfo?.phone2 ?? "";
    }
    if (
      !source &&
      (nameKey.includes("휴대폰") ||
        nameKey.includes("핸드폰") ||
        nameKey.includes("전화") ||
        nameKey.includes("폰") ||
        nameKey.includes("phone") ||
        nameKey.includes("mobile") ||
        nameKey.includes("tel"))
    ) {
      return patientInfo?.phone1 ?? patientInfo?.phone2 ?? "";
    }
    if (source === "document.issuanceNo") {
      return "";
    }
    if (nameKey === "yy" || nameKey === "yyyy" || nameKey === "mm" || nameKey === "dd") {
      const now = new Date();
      const kstOffset = 9 * 60;
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const kst = new Date(utc + kstOffset * 60000);
      const yearFull = String(kst.getFullYear());
      const yearShort = yearFull.slice(-2);
      const month = String(kst.getMonth() + 1).padStart(2, "0");
      const day = String(kst.getDate()).padStart(2, "0");
      if (nameKey === "yyyy") return yearFull;
      if (nameKey === "yy") return yearShort;
      if (nameKey === "mm") return month;
      return day;
    }
    return "";
  };

  const resolveFieldLabel = (field: ConsentField) => {
    const raw = field.name?.trim().toLowerCase();
    if (raw === "yy") return "년";
    if (raw === "mm") return "월";
    if (raw === "dd") return "일";
    return field.name;
  };

  const getOptionString = (field: ConsentField, key: string) => {
    const raw = field.options?.[key];
    return typeof raw === "string" ? raw : undefined;
  };

  const getCheckboxLabelText = (field: ConsentField) => {
    const labelText = getOptionString(field, "checkboxLabelText");
    if (labelText) return labelText;
    const labelHtml = getOptionString(field, "checkboxLabelHtml");
    if (labelHtml) {
      return labelHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return field.name ?? "";
  };

  const normalizeGenderValue = (raw: number | string | null | undefined) => {
    if (raw === "M" || raw === "m") return "male";
    if (raw === "F" || raw === "f") return "female";
    if (raw == null) return null;
    const normalized = Number(raw);
    if (normalized === 1) return "male";
    if (normalized === 2) return "female";
    return null;
  };

  const getGenderTargetFromLabel = (label: string) => {
    const normalized = label.replace(/\s+/g, "").toLowerCase();
    if (
      normalized.includes("남") ||
      normalized.includes("남자") ||
      normalized.includes("남성") ||
      normalized.includes("male") ||
      normalized === "m"
    ) {
      return "male";
    }
    if (
      normalized.includes("여") ||
      normalized.includes("여자") ||
      normalized.includes("여성") ||
      normalized.includes("female") ||
      normalized === "f"
    ) {
      return "female";
    }
    return null;
  };

  const getGenderValueFromOptions = (field: ConsentField) => {
    const genderValue = field.options?.genderValue;
    if (typeof genderValue === "string") {
      const normalized = genderValue.toLowerCase().trim();
      if (normalized === "male" || normalized === "m" || normalized === "1" || normalized === "남") {
        return "male";
      }
      if (normalized === "female" || normalized === "f" || normalized === "2" || normalized === "여") {
        return "female";
      }
    }
    if (typeof genderValue === "number") {
      if (genderValue === 1) return "male";
      if (genderValue === 2) return "female";
    }
    return null;
  };

  const getCheckboxGroupKey = (field: ConsentField) => {
    const group = field.options?.radioGroup;
    if (typeof group === "string" && group.trim()) {
      return group.trim();
    }
    return null;
  };

  const getCheckboxGroupLabel = (field: ConsentField) => {
    const label = field.options?.groupLabel;
    if (typeof label === "string" && label.trim()) {
      return label.trim();
    }
    return null;
  };

  const isRequiredGroupField = (field: ConsentField) => {
    return field.options?.requiredGroup === true;
  };

  useLayoutEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;
    const nextWidth = container.getBoundingClientRect().width;
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
    const lastWidth = lastContainerWidthRef.current;
    if (lastWidth === null || Math.abs(nextWidth - lastWidth) > 0.5) {
      lastContainerWidthRef.current = nextWidth;
      setContainerWidth(nextWidth);
    }
  }, [pdfContent]);

  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = entry.contentRect.width;
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
      const lastWidth = lastContainerWidthRef.current;
      if (lastWidth !== null && Math.abs(nextWidth - lastWidth) <= 0.5) return;
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(() => {
        lastContainerWidthRef.current = nextWidth;
        setContainerWidth(nextWidth);
        resizeRafRef.current = null;
      });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [pdfContent]);

  const getPinchDistance = (touches: TouchList) => {
    const t1 = touches[0];
    const t2 = touches[1];
    if (!t1 || !t2) return 0;
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const applyZoomToDOM = useCallback((zoom: number) => {
    const wrapper = zoomWrapperRef.current;
    const stage = zoomStageRef.current;
    const pdfW = pdfSize?.width ?? 0;
    const pdfH = pdfSize?.height ?? 0;
    if (wrapper) {
      if (zoom !== 1) {
        wrapper.style.width = `${pdfW * zoom}px`;
        wrapper.style.height = `${pdfH * zoom}px`;
      } else {
        wrapper.style.width = "";
        wrapper.style.height = "";
      }
    }
    if (stage) {
      if (zoom !== 1) {
        stage.style.transform = `scale(${zoom})`;
        stage.style.transformOrigin = "top left";
      } else {
        stage.style.transform = "";
        stage.style.transformOrigin = "";
      }
    }
  }, [pdfSize]);

  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const t1 = event.touches[0];
        const t2 = event.touches[1];
        const rect = container.getBoundingClientRect();
        pinchRef.current = {
          initialDistance: getPinchDistance(event.touches),
          initialZoom: zoomLevelRef.current,
          startScrollLeft: container.scrollLeft,
          startScrollTop: container.scrollTop,
          viewMidX: t1 && t2 ? ((t1.clientX + t2.clientX) / 2) - rect.left : 0,
          viewMidY: t1 && t2 ? ((t1.clientY + t2.clientY) / 2) - rect.top : 0,
        };
        touchStateRef.current = null;
        return;
      }
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startScrollTop: container.scrollTop,
        didScroll: false,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Pinch zoom handling
      if (event.touches.length === 2 && pinchRef.current) {
        event.preventDefault();
        const currentDistance = getPinchDistance(event.touches);
        const ratio = currentDistance / pinchRef.current.initialDistance;
        const dampedRatio = 1 + (ratio - 1) * 0.4;
        const newZoom = Math.min(3, Math.max(1, pinchRef.current.initialZoom * dampedRatio));

        // GPU-composited transform only (no layout thrashing during gesture)
        // translate offsets the zoom to center on pinch midpoint
        const stage = zoomStageRef.current;
        if (stage) {
          const { startScrollLeft, startScrollTop, viewMidX, viewMidY, initialZoom } = pinchRef.current;
          const factor = 1 - newZoom / initialZoom;
          const dx = (startScrollLeft + viewMidX) * factor;
          const dy = (startScrollTop + viewMidY) * factor;
          stage.style.transform = `translate(${dx}px, ${dy}px) scale(${newZoom})`;
          stage.style.transformOrigin = "top left";
        }

        zoomLevelRef.current = newZoom;
        return;
      }
      // Single finger scroll handling (existing logic)
      const state = touchStateRef.current;
      if (!state || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touch.clientY - state.startY;
      if (Math.abs(deltaY) > 4) {
        state.didScroll = true;
      }
      // Prevent pull-to-refresh at top
      const maxScroll = container.scrollHeight - container.clientHeight;
      const isAtTop = container.scrollTop <= 0;
      if (maxScroll > 0 && isAtTop && deltaY > 0) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      // End of pinch
      if (pinchRef.current) {
        const finalZoom = zoomLevelRef.current;
        const { initialZoom, startScrollLeft, startScrollTop, viewMidX, viewMidY } = pinchRef.current;
        pinchRef.current = null;
        // Full layout update (wrapper resize + transform) at gesture end
        applyZoomToDOM(finalZoom);
        // Scroll to keep pinch midpoint in same viewport position
        if (finalZoom !== initialZoom) {
          const contentX = (startScrollLeft + viewMidX) / initialZoom;
          const contentY = (startScrollTop + viewMidY) / initialZoom;
          container.scrollLeft = Math.max(0, contentX * finalZoom - viewMidX);
          container.scrollTop = Math.max(0, contentY * finalZoom - viewMidY);
        }
        setZoomLevel(finalZoom);
        return;
      }
      const state = touchStateRef.current;
      // Page swipe (only at zoom ~1x)
      if (state && totalPages > 1 && zoomLevelRef.current <= 1.05) {
        const touch = event.changedTouches[0];
        if (touch) {
          const deltaX = touch.clientX - state.startX;
          const deltaY = touch.clientY - state.startY;
          const absDeltaX = Math.abs(deltaX);
          const absDeltaY = Math.abs(deltaY);
          if (absDeltaX > 50 && absDeltaX > absDeltaY * 1.5) {
            if (deltaX < 0 && currentPage < totalPages) {
              setCurrentPage(currentPage + 1);
            } else if (deltaX > 0 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          }
        }
      }
      // Double-tap to reset zoom
      if (state && !state.didScroll) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          zoomLevelRef.current = 1;
          applyZoomToDOM(1);
          setZoomLevel(1);
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
      if (state) {
        window.setTimeout(() => {
          if (touchStateRef.current) {
            touchStateRef.current.didScroll = false;
          }
        }, 0);
      }
      touchStateRef.current = null;
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (touchStateRef.current?.didScroll) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    container.addEventListener("touchend", handleTouchEnd, { capture: true });
    container.addEventListener("touchcancel", handleTouchEnd, { capture: true });
    container.addEventListener("click", handleClickCapture, { capture: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart, { capture: true } as AddEventListenerOptions);
      container.removeEventListener("touchmove", handleTouchMove, { capture: true } as AddEventListenerOptions);
      container.removeEventListener("touchend", handleTouchEnd, { capture: true } as AddEventListenerOptions);
      container.removeEventListener("touchcancel", handleTouchEnd, { capture: true } as AddEventListenerOptions);
      container.removeEventListener("click", handleClickCapture, { capture: true } as AddEventListenerOptions);
    };
  }, [pdfContent, currentPage, totalPages, applyZoomToDOM]);

  useEffect(() => {
    if (!containerWidth) return;
    const baseWidth = pageSize?.baseWidth ?? pdfContent?.pageWidth ?? 595;
    const desiredScale = containerWidth / baseWidth;
    if (!Number.isFinite(desiredScale)) return;
    if (pdfScale === null || Math.abs(desiredScale - pdfScale) > 0.01) {
      setPdfScale(desiredScale);
    }
  }, [containerWidth, pageSize, pdfContent?.pageWidth, pdfScale]);

  useEffect(() => {
    zoomLevelRef.current = 1;
    applyZoomToDOM(1);
    setZoomLevel(1);
  }, [currentPage, applyZoomToDOM]);

  const missingRequiredFields = useMemo(() => {
    return signatureFields.filter(
      (field) => field.required && !signatureImages[field.fieldId]
    );
  }, [signatureFields, signatureImages]);

  const loadStoredSignatures = useMemo(() => {
    return () => {
      if (!consentId || signatureFields.length === 0) return;
      const loaded: Record<string, string> = {};
      signatureFields.forEach((field) => {
        const key = `consent-signature-${consentId}-${field.fieldId}`;
        const stored = window.sessionStorage.getItem(key);
        if (stored) {
          loaded[field.fieldId] = stored;
        }
      });
      setSignatureImages(loaded);
    };
  }, [consentId, signatureFields]);

  useEffect(() => {
    loadStoredSignatures();
  }, [loadStoredSignatures]);

  useEffect(() => {
    if (!signedFieldId) return;
    loadStoredSignatures();
  }, [signedFieldId, loadStoredSignatures]);

  useEffect(() => {
    const handleFocus = () => loadStoredSignatures();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
    };
  }, [loadStoredSignatures]);


  useEffect(() => {
    hasInitializedCheckboxesRef.current = false;
  }, [consentId, patientId]);

  useEffect(() => {
    if (!patientInfo || inputFields.length === 0) return;
    if (hasInitializedCheckboxesRef.current) return;
    const genderValue = normalizeGenderValue(patientInfo.gender);
    if (!genderValue) return;

    setCheckboxValues((prev) => {
      let next = { ...prev };
      let changed = false;
      const genderFields = inputFields.filter(
        (field) => field.type === 6 && getCheckboxGroupLabel(field) === "gender"
      );
      if (genderFields.length === 0) return prev;

      // radioGroup별로 그룹화
      const groupedFields = new Map<string, ConsentField[]>();
      genderFields.forEach((field) => {
        const groupKey = getCheckboxGroupKey(field);
        if (groupKey) {
          const list = groupedFields.get(groupKey) ?? [];
          list.push(field);
          groupedFields.set(groupKey, list);
        }
      });

      const groupHasValue = (fields: ConsentField[]) =>
        fields.some((field) => typeof prev[field.key] === "boolean");

      // 각 그룹별로 처리: 순서대로 첫 번째=남자, 두 번째=여자
      groupedFields.forEach((fieldsInGroup, groupKey) => {
        if (groupHasValue(fieldsInGroup)) return;

        // order로 정렬 (없으면 원래 순서 유지)
        const sortedFields = [...fieldsInGroup].sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          return orderA - orderB;
        });

        // 선택할 인덱스: male=0(첫번째), female=1(두번째)
        const targetIndex = genderValue === "male" ? 0 : 1;
        const targetField = sortedFields[targetIndex];

        if (targetField) {
          sortedFields.forEach((field, index) => {
            if (typeof prev[field.key] === "boolean") return;
            next[field.key] = index === targetIndex;
            changed = true;
          });
        }
      });

      return changed ? next : prev;
    });

    hasInitializedCheckboxesRef.current = true;
  }, [patientInfo, inputFields]);

  const requiredCheckboxState = useMemo(() => {
    const requiredSolo: string[] = [];
    const requiredGroups = new Map<string, string[]>();
    inputFields.forEach((field) => {
      if (field.type !== 6) return;
      if (!isRequiredGroupField(field)) return;
      const groupKey = getCheckboxGroupKey(field);
      if (groupKey) {
        const list = requiredGroups.get(groupKey) ?? [];
        list.push(field.key);
        requiredGroups.set(groupKey, list);
      } else {
        requiredSolo.push(field.key);
      }
    });
    return { requiredSolo, requiredGroups };
  }, [inputFields]);

  const missingRequiredCheckboxState = useMemo(() => {
    const missingSolo = requiredCheckboxState.requiredSolo.filter(
      (key) => !checkboxValues[key]
    );
    const missingGroups: string[] = [];
    requiredCheckboxState.requiredGroups.forEach((keys, groupKey) => {
      const hasChecked = keys.some((key) => checkboxValues[key]);
      if (!hasChecked) missingGroups.push(groupKey);
    });
    return { missingSolo, missingGroups };
  }, [requiredCheckboxState, checkboxValues]);

  const handleCompleteSignature = async () => {
    const missingCheckboxPages: number[] = [];
    missingRequiredCheckboxState.missingSolo.forEach((key) => {
      const field = inputFields.find((item) => item.key === key);
      if (field?.pageNumber) missingCheckboxPages.push(field.pageNumber);
    });
    missingRequiredCheckboxState.missingGroups.forEach((groupKey) => {
      const field = inputFields.find(
        (item) => item.options?.radioGroup === groupKey
      );
      if (field?.pageNumber) missingCheckboxPages.push(field.pageNumber);
    });

    const missingSignaturePages = missingRequiredFields.map((field) => field.page);
    const candidatePages = [...missingCheckboxPages, ...missingSignaturePages];

    if (candidatePages.length > 0) {
      const targetPage = Math.min(...candidatePages);
      if (Number.isFinite(targetPage) && targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
      if (missingCheckboxPages.length > 0) {
        window.alert("필수 동의 항목을 체크해야 서명 완료가 가능합니다.");
      } else {
        window.alert("필수 서명 영역이 남아있습니다. 서명 후 동의해야 완료할 수 있습니다.");
      }
      return;
    }
    if (!numericConsentId || Number.isNaN(numericConsentId)) return;
    const fieldsPayload = inputFields.map((field) => {
      if (field.type === 6) {
        return { key: field.key, value: checkboxValues[field.key] ?? false };
      }
      const value = resolveFieldValue(field);
      return { key: field.key, value: value ?? "" };
    });
    const signaturesPayload = Object.entries(signatureImages).map(
      ([fieldId, image]) => ({
        fieldId,
        image,
      })
    );
    const signerDeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    };
    setIsSubmitting(true);
    try {
      await signConsent({
        consentId: numericConsentId,
        data: {
          fields: fieldsPayload,
          signatures: signaturesPayload,
          signerDeviceInfo,
        },
      });
      setIsFinalCompleted(true);
      const pendingConsents = await ConsentsApi.getByPatient({
        patientId: Number(patientId),
        status: "PENDING",
        take: 20,
      });
      queryClient.invalidateQueries({
        queryKey: ["consents", "patient", Number(patientId)],
      });
      const nextConsent = pendingConsents.items.find(
        (item: { id: number }) => item.id !== numericConsentId
      );
      if (nextConsent) {
        router.replace(`/tablet/consent-form/patient/${patientId}/consent/${nextConsent.id}`);
      } else {
        router.push("/tablet/consent-form/patient-list");
      }
    } catch (error) {
      console.error("[ConsentSignature] 서명 완료 처리 실패:", error);
      setIsSubmitting(false);
    }
  };
  const isAllSigned =
    signatureFields.length > 0 && missingRequiredFields.length === 0;
  const isRequiredConsentChecked =
    missingRequiredCheckboxState.missingSolo.length === 0 &&
    missingRequiredCheckboxState.missingGroups.length === 0;
  const isReadyToComplete = isAllSigned && isRequiredConsentChecked;

  const handleSignatureSaved = () => {
    loadStoredSignatures();
    setActiveFieldId(null);
  };

  useEffect(() => {
    return () => {
      if (isFinalCompleted || !consentId || signatureFields.length === 0) return;
      signatureFields.forEach((field) => {
        const key = `consent-signature-${consentId}-${field.fieldId}`;
        window.sessionStorage.removeItem(key);
      });
    };
  }, [isFinalCompleted, consentId, signatureFields]);

  return (
    <div className="consent-slide-page">
      <ConsentHeader onBack={handleBack} backLabel="<" title={title} />

      <div className="consent-body">
        <div className="consent-title">
          내용을 확인 후 서명 영역을 눌러 서명한 후
          <br />
          서명 완료를 눌러주세요.
        </div>
        {(isConsentLoading || !consentDetail || (isPdf && !isPdfFullyRendered)) && !consentError && (
          <div className="consent-loading-full">
            <MyLoadingSpinner size="md" text="동의서 불러오는 중..." />
          </div>
        )}
        {!isConsentLoading && consentError && (
          <div className="consent-empty">동의서를 불러오지 못했습니다.</div>
        )}
        {!isConsentLoading && consentDetail && !consentError && isPdf && (
          <>
            <div
              className="consent-pdf-container"
              ref={pdfContainerRef}
              style={{
                opacity: isPdfFullyRendered ? 1 : 0,
                visibility: isPdfFullyRendered ? "visible" : "hidden",
                pointerEvents: isPdfFullyRendered ? "auto" : "none",
              }}
            >
              <div
                className="consent-pdf-zoom-wrapper"
                ref={zoomWrapperRef}
                style={{
                  width: zoomLevel !== 1 ? (pdfSize?.width ?? 0) * zoomLevel : undefined,
                  height: zoomLevel !== 1 ? (pdfSize?.height ?? 0) * zoomLevel : undefined,
                }}
              >
                <div
                  className="consent-pdf-stage"
                  ref={zoomStageRef}
                  style={{
                    width: pdfSize?.width ?? "100%",
                    height: pdfSize?.height ?? "auto",
                    transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
                    transformOrigin: "top left",
                  }}
                >
                  {pdfScale !== null && (
                  <PdfViewer
                    file={pdfUrl}
                    currentPage={currentPage}
                    onPageLoad={handlePdfPageLoad}
                    onPageRender={handlePdfPageRender}
                    onPageChange={setCurrentPage}
                    onNumPagesChange={setTotalPages}
                    onLoadingChange={setIsPdfLoading}
                    showNavigation={totalPages > 1}
                    scale={pdfScale}
                  />
                )}
                {pdfSize && pageSize && isPdfFullyRendered && (
                  <div
                    className="consent-signature-overlay"
                    style={{ width: pdfSize.width, height: pdfSize.height }}
                  >
                    {currentPageInputFields.map((field) => {
                      const scaleX = pdfSize.width / pageSize.baseWidth;
                      const scaleY = pdfSize.height / pageSize.baseHeight;
                      // NOTE: 기존(필드 좌표 그대로 렌더링) 로직
                      // const width = field.width * scaleX;
                      // const height = field.height * scaleY;
                      // const baseLeft = field.x * scaleX;
                      // const baseTop = field.y * scaleY;

                      // FieldEditor 좌표(좌상단, scale=1.5)를 PDF 포인트(좌하단)로 변환 후 렌더링
                      const pdfWidth = field.width / FIELD_EDITOR_SCALE;
                      const pdfHeight = field.height / FIELD_EDITOR_SCALE;
                      const pdfX = field.x / FIELD_EDITOR_SCALE;
                      const pdfY =
                        pageSize.baseHeight -
                        field.y / FIELD_EDITOR_SCALE -
                        field.height / FIELD_EDITOR_SCALE;
                      const width = pdfWidth * scaleX;
                      const height = pdfHeight * scaleY;
                      const baseLeft = pdfX * scaleX;
                      const baseTop =
                        (pageSize.baseHeight - pdfY - pdfHeight) * scaleY;
                      const hitPadding =
                        typeof field.options?.checkboxHitPaddingPx === "number"
                          ? field.options.checkboxHitPaddingPx
                          : 0;
                      const hitPaddingX = (hitPadding / FIELD_EDITOR_SCALE) * scaleX;
                      const hitPaddingY = (hitPadding / FIELD_EDITOR_SCALE) * scaleY;
                      const hitAreaX =
                        typeof field.options?.checkboxHitAreaX === "number"
                          ? field.options.checkboxHitAreaX
                          : null;
                      const hitAreaY =
                        typeof field.options?.checkboxHitAreaY === "number"
                          ? field.options.checkboxHitAreaY
                          : null;
                      const hitAreaWidth =
                        typeof field.options?.checkboxHitAreaWidth === "number"
                          ? field.options.checkboxHitAreaWidth
                          : null;
                      const hitAreaHeight =
                        typeof field.options?.checkboxHitAreaHeight === "number"
                          ? field.options.checkboxHitAreaHeight
                          : null;
                      const hasHitArea =
                        hitAreaX !== null &&
                        hitAreaY !== null &&
                        hitAreaWidth !== null &&
                        hitAreaHeight !== null &&
                        hitAreaWidth > 0 &&
                        hitAreaHeight > 0;
                      const hitAreaLeft = hasHitArea
                        ? baseLeft + (hitAreaX / FIELD_EDITOR_SCALE) * scaleX
                        : baseLeft - hitPaddingX;
                      const hitAreaTop = hasHitArea
                        ? baseTop + (hitAreaY / FIELD_EDITOR_SCALE) * scaleY
                        : baseTop - hitPaddingY;
                      const hitAreaW = hasHitArea
                        ? (hitAreaWidth / FIELD_EDITOR_SCALE) * scaleX
                        : width + hitPaddingX * 2;
                      const hitAreaH = hasHitArea
                        ? (hitAreaHeight / FIELD_EDITOR_SCALE) * scaleY
                        : height + hitPaddingY * 2;
                      const isCheckbox = field.type === 6;
                      const rawValue = resolveFieldValue(field);
                      const label = resolveFieldLabel(field);
                      const isDateLabel =
                        field.name?.trim().toLowerCase() === "yy" ||
                        field.name?.trim().toLowerCase() === "yyyy" ||
                        field.name?.trim().toLowerCase() === "mm" ||
                        field.name?.trim().toLowerCase() === "dd";
                      const isGuardianRelation = field.name?.includes("관계");
                      const isNameLabel =
                        field.name?.includes("성명") ||
                        field.name?.toLowerCase().includes("name");
                      const isGuardianName =
                        field.name?.includes("보호자") && field.name?.includes("성명");
                      const isGuardianRelationField = isGuardianRelation;
                      const isNameOrRelation = isNameLabel || isGuardianRelation;
                      const fontSizeBoost = 0;
                      const rawValueText = rawValue ? String(rawValue) : "";
                      const nameDisplayValue = rawValueText;
                      const isLongName =
                        (isGuardianName || isGuardianRelationField) &&
                        rawValueText.length >= 5;
                      const longNameShrink = isLongName ? -2 : 0;
                      const longNameExpand = isLongName ? width * 0.35 : 0;
                      const widthScale = isGuardianRelation ? 1.2 : 1;
                      const guardianRelationOffset = isGuardianRelation
                        ? (-13 / FIELD_EDITOR_SCALE) * scaleX
                        : 0;
                      const checkboxChecked = checkboxValues[field.key] ?? false;
                      const groupKey = isCheckbox ? getCheckboxGroupKey(field) : null;
                      return (
                        <div key={field.key}>
                          {isCheckbox ? (
                            <label
                              className="consent-input-checkbox"
                              style={{
                                left: hitAreaLeft,
                                top: hitAreaTop,
                                width: hitAreaW,
                                height: hitAreaH,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checkboxChecked}
                                onChange={(event) =>
                                  setCheckboxValues((prev) => {
                                    const nextChecked = event.target.checked;
                                    if (!groupKey || !nextChecked) {
                                      return {
                                        ...prev,
                                        [field.key]: nextChecked,
                                      };
                                    }
                                    const next = { ...prev };
                                    inputFields.forEach((item) => {
                                      if (item.type !== 6) return;
                                      if (getCheckboxGroupKey(item) !== groupKey) return;
                                      next[item.key] = item.key === field.key;
                                    });
                                    return next;
                                  })
                                }
                              />
                              <span
                                className="consent-input-checkbox-box"
                                style={{
                                  width,
                                  height,
                                }}
                              />
                              <img
                                className="consent-input-checkbox-icon"
                                src={
                                  checkboxChecked
                                    ? "/icon/ic_checkbox_checked.svg"
                                    : "/icon/ic_checkbox_unchecked.svg"
                                }
                                alt=""
                                aria-hidden="true"
                              />
                            </label>
                          ) : (
                            <div
                              className="consent-input-field"
                              style={{
                                left: baseLeft - longNameExpand,
                                transform: guardianRelationOffset
                                  ? `translateX(${guardianRelationOffset}px)`
                                  : undefined,
                                top: baseTop,
                                width: width * widthScale + longNameExpand,
                                height,
                                fontSize: field.fontSize
                                  ? (field.fontSize / FIELD_EDITOR_SCALE) *
                                  scaleX *
                                  (isDateLabel ? DATE_TEXT_SCALE : 1) +
                                  fontSizeBoost +
                                  longNameShrink
                                  : undefined,
                                fontWeight: field.fontWeight ?? undefined,
                                textAlign: isGuardianName || isGuardianRelationField
                                  ? "right"
                                  : field.textAlign ?? undefined,
                                justifyContent: isGuardianName || isGuardianRelationField
                                  ? "flex-end"
                                  : field.textAlign === "center"
                                    ? "center"
                                    : "flex-start",
                              }}
                            >
                              {nameDisplayValue}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {currentPageFields.map((field) => {
                      const scaleX = pdfSize.width / pageSize.baseWidth;
                      const scaleY = pdfSize.height / pageSize.baseHeight;
                      const signatureImage = signatureImages[field.fieldId];
                      const fieldScale = signatureImage
                        ? signatureScale
                        : unsignedFieldScale;
                      const baseWidth = (field.width / FIELD_EDITOR_SCALE) * scaleX;
                      const baseHeight = (field.height / FIELD_EDITOR_SCALE) * scaleY;
                      const width = baseWidth * fieldScale;
                      const height = baseHeight * fieldScale;
                      const baseLeft =
                        ((field.x + signatureOffset.x) / FIELD_EDITOR_SCALE) *
                        scaleX;
                      const baseTop =
                        ((field.y + signatureOffset.y) / FIELD_EDITOR_SCALE) *
                        scaleY;
                      const left = baseLeft - (width - baseWidth) / 2;
                      const top = baseTop - (height - baseHeight) / 2;
                      return (
                        <button
                          key={field.fieldId}
                          type="button"
                          className={`consent-signature-field${signatureImage ? " signed" : ""}`}
                          style={{
                            left,
                            top,
                            width,
                            height,
                          }}
                          onClick={() => setActiveFieldId(field.fieldId)}
                        >
                          {signatureImage ? (
                            <img src={signatureImage} alt="signature" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            </div>
            <div className="consent-footer">
              <button
                type="button"
                className={`consent-sign-complete${isReadyToComplete ? " signed" : ""}`}
                onClick={handleCompleteSignature}
                disabled={isSubmitting}
              >
                서명 완료
              </button>
            </div>
          </>
        )}
        {!isConsentLoading && consentDetail && !consentError && !isPdf && (
          <div className="consent-empty">PDF 형식이 아닌 동의서입니다.</div>
        )}
      </div>
      {isSubmitting && (
        <div className="consent-submitting-overlay">
          <div className="consent-submitting-modal">
            <MyLoadingSpinner size="lg" text="" />
            <div className="consent-submitting-text">
              동의서 파일을 생성 중입니다.
              <br />
              잠시만 기다려 주세요.
            </div>
          </div>
        </div>
      )}
      {activeFieldId && (
        <SignatureModal
          open={!!activeFieldId}
          consentId={consentId}
          fieldId={activeFieldId}
          onClose={() => setActiveFieldId(null)}
          onSaved={handleSignatureSaved}
        />
      )}

      <style jsx>{`
        .consent-slide-page {
          height: 100dvh;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e6e6e6;
          animation: slide-in 250ms ease-out;
          display: flex;
          flex-direction: column;
          padding: 0px 16px 28px;
          box-sizing: border-box;
          gap: 16px;
          overscroll-behavior: none;
          touch-action: pan-x pan-y;
        }
        .consent-title {
          color: var(--Gray-100_171719, #171719);
          font-feature-settings: "case" on, "cpsp" on;
          font-family: "Pretendard", sans-serif;
          font-size: 22px;
          font-style: normal;
          font-weight: 700;
          line-height: 140%;
          letter-spacing: -0.22px;
          width: 100%;
        }
        .consent-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
          position: relative;
        }
        .consent-pdf-container {
          flex: 1;
          min-height: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: auto;
          padding: 1px;
          box-sizing: border-box;
          border-radius: 6px;
          border: 1px solid var(--Line-border-1_EAEBEC, #dbdcdf);
          background: var(--Gray-White, #fff);
          touch-action: pan-x pan-y;
        }
        .consent-pdf-zoom-wrapper {
          position: relative;
          min-width: 100%;
          min-height: 100%;
        }
        .consent-pdf-stage {
          position: relative;
          background: var(--Gray-White, #fff);
          border-radius: 6px;
          overflow: hidden;
        }
        .consent-pdf-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.75);
          z-index: 3;
          pointer-events: none;
        }
        .consent-pdf-loading-standalone {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 400px;
        }
        .consent-signature-overlay {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: auto;
          z-index: 2;
        }
        .consent-input-field {
          position: absolute;
          pointer-events: none;
          background: transparent;
          border: none;
          color: #111827;
          font-weight: 600;
          display: flex;
          align-items: center;
          padding: 2px 4px;
          box-sizing: border-box;
          overflow: hidden;
          z-index: 1;
        }
        .consent-input-checkbox {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .consent-input-checkbox input {
          position: absolute;
          inset: 0;
          opacity: 0;
          margin: 0;
          cursor: pointer;
        }
        .consent-input-checkbox-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          background: transparent;
          border-radius: 4px;
          box-sizing: border-box;
          pointer-events: none;
        }
        .consent-input-checkbox-icon {
          width: 22px;
          height: 22px;
          display: block;
          pointer-events: none;
        }
        .consent-signature-field {
          position: absolute;
          pointer-events: auto;
          background: rgba(34, 197, 94, 0.35);
          border: 2px solid #16a34a;
          color: #14532d;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          overflow: hidden;
        }
        .consent-signature-field.signed {
          background: transparent;
          border-color: transparent;
          color: transparent;
        }
        .consent-signature-field img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 1;
          filter: contrast(1.6) saturate(1.3);
        }
        .consent-footer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          width: 100%;
          padding-top: 16px;
        }
        .consent-sign-complete {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 56px;
          min-height: 56px;
          min-width: 64px;
          padding: 8px 12px;
          gap: 4px;
          flex: 0 0 auto;
          width: 100%;
          box-sizing: border-box;
          border-radius: 8px;
          background: var(--Background-bg-3_EAEBEC, #eaebec);
          color: var(--Gray-400_70737C, #70737c);
          border: none;
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 140%;
          cursor: pointer;
        }
        .consent-sign-complete:disabled {
          cursor: not-allowed;
        }
        .consent-sign-complete.signed {
          background: var(--Primary-Main-Color, #180f38);
          color: var(--Gray-White, #fff);
        }
        .consent-empty {
          color: #6b7280;
          font-size: 16px;
        }
        .consent-loading-full {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.7);
          z-index: 5;
        }
        .consent-submitting-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .consent-submitting-modal {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        }
        .consent-submitting-text {
          color: var(--Gray-200_292A2D, #292a2d);
          font-family: "Pretendard", sans-serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 150%;
          text-align: center;
        }
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0.9;
          }
          to {
            transform: translateX(0%);
            opacity: 1;
          }
        }
      `}</style>
      <style jsx global>{`
        html,
        body {
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}
