import React from 'react';
import { Clock, Coffee, X, AlertCircle } from 'lucide-react';

interface ClosureCardProps {
  type: 'break' | 'closure';
  title: string;
  startTime: string;
  endTime: string;
  reason?: string;
  slotClosureId?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const ClosureCard: React.FC<ClosureCardProps> = ({
  type,
  title,
  startTime,
  endTime,
  reason,
  style,
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'break':
        return <Coffee className="w-3 h-3" />;
      case 'closure':
        return <X className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'break':
        return {
          background: 'bg-[var(--bg-1)]',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600'
        };
      case 'closure':
        return {
          background: 'bg-[var(--bg-3)]',
          border: 'border-gray-100',
          text: 'text-gray-500',
          icon: 'text-gray-400'
        };
      default:
        return {
          background: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-600'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`absolute left-0 right-0 z-15 overflow-hidden 
        ${colors.background} ${colors.border} ${className}`}
      style={style}
    >
      <div className="h-full flex flex-col justify-center">
        <div className={`items-center gap-1 ${colors.text}`}>

        </div>
      </div>

      {/* 패턴 오버레이 - 휴게시간일 때만 빗금 처리 */}
      {type === 'break' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              var(--bg-4) 4px,
              var(--bg-4) 6px
            )`
          }}
        />
      )}

    </div>
  );
}; 