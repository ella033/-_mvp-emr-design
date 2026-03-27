import { useClear } from '@/contexts/ClearContext';

/**
 * 컴포넌트의 enabled/disabled 상태를 관리하는 훅
 */
export const useComponentState = () => {
  const { isEnabled } = useClear();

  // 입력 필드에 적용할 props
  const getInputProps = () => ({
    disabled: !isEnabled,
    readOnly: !isEnabled,
    className: !isEnabled ? 'opacity-50 cursor-not-allowed' : '',
  });

  // 버튼에 적용할 props
  const getButtonProps = () => ({
    disabled: !isEnabled,
    className: !isEnabled ? 'opacity-50 cursor-not-allowed' : '',
  });

  // Select에 적용할 props
  const getSelectProps = () => ({
    disabled: !isEnabled,
    className: !isEnabled ? 'opacity-50 cursor-not-allowed' : '',
  });

  // Textarea에 적용할 props
  const getTextareaProps = () => ({
    disabled: !isEnabled,
    readOnly: !isEnabled,
    className: !isEnabled ? 'opacity-50 cursor-not-allowed' : '',
  });

  // 체크박스/라디오에 적용할 props
  const getCheckboxProps = () => ({
    disabled: !isEnabled,
    className: !isEnabled ? 'opacity-50 cursor-not-allowed' : '',
  });

  // 컨테이너 div에 적용할 props (전체 섹션 disable)
  const getContainerProps = (existingClassName = '') => ({
    className: `${existingClassName} ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`.trim(),
    'data-disabled': !isEnabled,
  });

  // 일반적인 disabled 상태
  const disabled = !isEnabled;

  return {
    isEnabled,
    disabled,
    getInputProps,
    getButtonProps,
    getSelectProps,
    getTextareaProps,
    getCheckboxProps,
    getContainerProps,
  };
}; 