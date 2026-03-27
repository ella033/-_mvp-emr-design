import { useState, useRef, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  memo?: string;
  start: Date;
  end: Date;
  color?: string;
  patientId?: number;
  patientName?: string;
  patientPhone?: string;
  appointmentRoomId: number;
  status: number;
  isSimplePatient: boolean;
  originalData?: any;
}

export const useHoverCard = () => {
  const [hoverCard, setHoverCard] = useState<{
    visible: boolean;
    x: number;
    y: number;
    appointment: CalendarEvent;
  } | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (event: CalendarEvent, e: React.MouseEvent) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setHoverCard({
      visible: true,
      x: e.clientX + 10,
      y: e.clientY - 10,
      appointment: event
    });
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setHoverCard(null);
    }, 100);
  };

  const handleHoverCardMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleHoverCardMouseLeave = () => {
    setHoverCard(null);
  };

  return {
    hoverCard,
    setHoverCard,
    handleMouseEnter,
    handleMouseLeave,
    handleHoverCardMouseEnter,
    handleHoverCardMouseLeave
  };
};
