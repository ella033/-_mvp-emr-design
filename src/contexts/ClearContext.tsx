"use client";

import React, { createContext, useContext, useCallback, useRef, ReactNode, useState } from 'react';

// Clear 함수 타입 정의
type ClearFunction = () => void | Promise<void>;

// Context 타입 정의
interface ClearContextType {
  // Clear 함수 등록
  registerClear: (id: string, clearFn: ClearFunction) => void;
  // Clear 함수 해제
  unregisterClear: (id: string) => void;
  // 모든 등록된 clear 함수 실행
  clearAll: () => Promise<void>;
  // 특정 clear 함수 실행
  clearById: (id: string) => Promise<void>;
  // 등록된 clear 함수들의 ID 목록
  getRegisteredIds: () => string[];
  // Enabled/Disabled 상태 관리
  setEnabled: (enabled: boolean) => void;
  isEnabled: boolean;
}

// Context 생성
const ClearContext = createContext<ClearContextType | null>(null);

// Provider 컴포넌트
interface ClearProviderProps {
  children: ReactNode;
  initialEnabled?: boolean;
}

export const ClearProvider: React.FC<ClearProviderProps> = ({
  children,
  initialEnabled = true
}) => {
  const clearFunctionsRef = useRef<Map<string, ClearFunction>>(new Map());
  const [isEnabled, setIsEnabledState] = useState<boolean>(initialEnabled);

  const registerClear = useCallback((id: string, clearFn: ClearFunction) => {
    clearFunctionsRef.current.set(id, clearFn);

  }, []);

  const unregisterClear = useCallback((id: string) => {
    const existed = clearFunctionsRef.current.delete(id);

  }, []);

  const clearAll = useCallback(async () => {
    const functions = Array.from(clearFunctionsRef.current.entries());

    for (const [, clearFn] of functions) {
      try {
        await clearFn();
      } catch (error) {
        console.error(`  ❌ clear 실패:`, error);
      }
    }
  }, []);

  const clearById = useCallback(async (id: string) => {
    const clearFn = clearFunctionsRef.current.get(id);
    if (clearFn) {
      try {
        await clearFn();
      } catch (error) {
        console.error(`❌ ${id} Clear 실패:`, error);
      }
    } else {

    }
  }, []);

  const getRegisteredIds = useCallback(() => {
    return Array.from(clearFunctionsRef.current.keys());
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);

  }, []);

  const contextValue: ClearContextType = {
    registerClear,
    unregisterClear,
    clearAll,
    clearById,
    getRegisteredIds,
    setEnabled,
    isEnabled,
  };

  return (
    <ClearContext.Provider value={contextValue}>
      {children}
    </ClearContext.Provider>
  );
};

// Hook for using the clear context
export const useClear = (componentId?: string) => {
  const context = useContext(ClearContext);

  if (!context) {
    throw new Error('useClear must be used within a ClearProvider');
  }

  // 컴포넌트별 clear 함수 등록/해제를 위한 유틸리티 함수들
  const registerMyClear = useCallback((clearFn: ClearFunction) => {
    if (componentId) {
      context.registerClear(componentId, clearFn);
    }
  }, [context, componentId]);

  const unregisterMyClear = useCallback(() => {
    if (componentId) {
      context.unregisterClear(componentId);
    }
  }, [context, componentId]);

  return {
    ...context,
    // 컴포넌트 전용 함수들
    registerMyClear,
    unregisterMyClear,
  };
}; 