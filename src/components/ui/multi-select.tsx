// components/ui/multi-select.tsx
import React from 'react';
import Select, { MultiValue, components, OptionProps, MultiValueProps, Props as SelectProps } from 'react-select';

// 타입 정의
export interface OptionType {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  value: MultiValue<OptionType>;
  onChange: (selected: MultiValue<OptionType>) => void;
  options: OptionType[];
  placeholder?: string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  isClearable?: boolean;
  closeMenuOnSelect?: boolean;
  hideSelectedOptions?: boolean;
  className?: string;
  isLoading?: boolean;
  maxMenuHeight?: number;
  menuPlacement?: 'auto' | 'bottom' | 'top';
  noOptionsMessage?: (obj: { inputValue: string }) => string;
  showSelectAll?: boolean; // 전체 선택 기능 표시 여부 (기본값: true)
  selectAllLabel?: string; // 전체 선택 라벨
  showRemove?: boolean; // 개별 항목 제거 기능 표시 여부 (기본값: false)
  maxDisplayCount?: number; // 표시할 최대 뱃지 개수
  showCount?: boolean; // 선택된 항목 개수 표시 여부
}

// 전체 선택 체크박스 컴포넌트
const SelectAllOption = ({
  options,
  value,
  onChange,
  label = "전체",
  isDisabled = false
}: {
  options: OptionType[];
  value: MultiValue<OptionType>;
  onChange: (selected: MultiValue<OptionType>) => void;
  label?: string;
  isDisabled?: boolean;
}) => {
  const isAllSelected = options.length > 0 && value.length === options.length;
  const isIndeterminate = value.length > 0 && value.length < options.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isAllSelected) {
      // 전체 해제
      onChange([]);
    } else {
      // 전체 선택
      onChange(options);
    }
  };

  return (
    <div
      className="px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-[var(--violet-1)]"
      style={{ backgroundColor: 'var(--violet-1)' }}
    >
      <label className="flex items-center cursor-pointer w-full">
        <input
          type="checkbox"
          checked={isAllSelected}
          ref={(input) => {
            if (input) {
              input.indeterminate = isIndeterminate;
            }
          }}
          onChange={handleSelectAll}
          disabled={isDisabled}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span
          className="text-sm font-medium flex-1"
          style={{ color: 'var(--main-color)' }}
        >
          {label}
        </span>
        <span
          className="ml-2 text-xs text-gray-500"
          style={{ color: 'var(--main-color)', opacity: 0.7 }}
        >
          ({value.length}/{options.length})
        </span>
      </label>
    </div>
  );
};

// Custom Option 컴포넌트 (체크박스 스타일)
const CustomOption = (props: OptionProps<OptionType, true>) => {
  const { isSelected, isFocused, data, innerProps } = props;

  return (
    <components.Option {...props}>
      <div
        className={`flex items-center w-full cursor-pointer ${isFocused ? 'bg-[var(--violet-1)]' : ''}`}
        {...innerProps}
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded pointer-events-none"
        />
        <span
          className="text-sm flex-1"
          style={{ color: 'var(--gray-100)' }}
        >
          {data.label}
        </span>
      </div>
    </components.Option>
  );
};

// Custom MultiValue 컴포넌트 (선택된 항목 표시)
const CustomMultiValue = ({
  props,
  showRemove = false
}: {
  props: MultiValueProps<OptionType, true>;
  showRemove?: boolean;
}) => {
  return (
    <div
      className="inline-flex items-center px-2 py-1 rounded text-xs mr-1 mb-1 max-w-32"
      style={{
        backgroundColor: 'var(--violet-1)',
        color: 'var(--main-color)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}
    >
      <span className="truncate">{props.data.label}</span>
      {showRemove && (
        <components.MultiValueRemove {...props}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            className="ml-1 cursor-pointer hover:opacity-70"
          >
            <path
              fill="currentColor"
              d="M7 0C3.1 0 0 3.1 0 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zM10.5 9.1L9.1 10.5 7 8.4 4.9 10.5 3.5 9.1 5.6 7 3.5 4.9 4.9 3.5 7 5.6 9.1 3.5 10.5 4.9 8.4 7l2.1 2.1z"
            />
          </svg>
        </components.MultiValueRemove>
      )}
    </div>
  );
};

// 선택된 항목 개수 표시 컴포넌트
const ValueContainer = ({
  children,
  value,
  maxDisplayCount = 3,
  showCount = true,
  ...props
}: any) => {
  const selectedCount = value?.length || 0;
  const shouldShowCount = selectedCount > maxDisplayCount && showCount;

  // maxDisplayCount를 초과하는 경우 일부만 표시하고 나머지는 개수로 표시
  let displayChildren = children;
  if (selectedCount > maxDisplayCount) {
    const values = children[0];
    if (Array.isArray(values)) {
      const visibleValues = values.slice(0, maxDisplayCount);
      const hiddenCount = selectedCount - maxDisplayCount;
      displayChildren = [
        visibleValues,
        <div
          key="count-badge"
          className="inline-flex items-center px-2 py-1 rounded text-xs mr-1 mb-1"
          style={{
            backgroundColor: 'var(--violet-1)',
            color: 'var(--main-color)',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        >
          +{hiddenCount}개 더
        </div>,
        children[1] // input field
      ];
    }
  }

  return (
    <components.ValueContainer {...props}>
      {displayChildren}
    </components.ValueContainer>
  );
};

// React Select 스타일 설정
const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '40px',
    fontSize: '14px',
    borderColor: state.isFocused ? 'var(--violet-1)' : 'var(--border-1)',
    boxShadow: state.isFocused ? '0 0 0 1px var(--violet-1)' : 'none',
    '&:hover': {
      borderColor: 'var(--violet-1)'
    },
    backgroundColor: 'var(--bg-main)'
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: '2px 8px',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  }),
  input: (provided: any) => ({
    ...provided,
    margin: '0px',
    color: 'var(--gray-100)'
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    padding: '0 8px',
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    color: 'var(--main-color)',
    '&:hover': {
      color: 'var(--main-color)'
    }
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: 'var(--main-color)',
    '&:hover': {
      color: 'var(--main-color)'
    }
  }),
  placeholder: (provided: any) => ({
    ...provided,
    fontSize: '14px',
    color: 'rgba(var(--main-color-rgb), 0.6)'
  }),
  menu: (provided: any) => ({
    ...provided,
    fontSize: '14px',
    padding: 0,
    backgroundColor: 'var(--bg-main)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: '14px',
    padding: '10px 12px',
    backgroundColor: state.isSelected
      ? 'var(--violet-1)'
      : state.isFocused
        ? 'var(--violet-1)'
        : 'var(--bg-main)',
    color: 'var(--gray-100)',
    cursor: 'pointer',
    ':active': {
      backgroundColor: 'var(--violet-1)'
    }
  }),
  noOptionsMessage: (provided: any) => ({
    ...provided,
    color: 'var(--gray-100)',
    fontSize: '14px'
  })
};

// MultiSelect 컴포넌트
export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "항목을 선택하세요",
  isSearchable = true,
  isDisabled = false,
  isClearable = true,
  closeMenuOnSelect = false,
  hideSelectedOptions = false,
  className = "",
  isLoading = false,
  maxMenuHeight = 300,
  menuPlacement = 'auto',
  noOptionsMessage = ({ inputValue }) => `"${inputValue}"에 대한 검색 결과가 없습니다`,
  showSelectAll = true, // 기본적으로 전체 선택 기능 활성화
  selectAllLabel = "전체 선택",
  showRemove = false, // 기본적으로 개별 제거 기능 비활성화
  maxDisplayCount = 3,
  showCount = true,
  ...rest
}) => {

  // onChange 래퍼 함수
  const handleChange = (selected: MultiValue<OptionType>) => {
    onChange(selected);
  };
  return (
    <div className={`multi-select-wrapper ${className}`}>
      <Select
        isMulti
        value={value}
        onChange={handleChange}
        options={options}
        components={{
          Option: CustomOption,
          MultiValue: (props) => (
            <CustomMultiValue props={props} showRemove={showRemove} />
          ),
          MultiValueRemove: showRemove ? components.MultiValueRemove : () => null,
          ValueContainer: (props) => (
            <ValueContainer
              {...props}
              maxDisplayCount={maxDisplayCount}
              showCount={showCount}
            />
          ),
          Menu: showSelectAll ? ({ children, ...props }) => (
            <components.Menu {...props}>
              <SelectAllOption
                options={options}
                value={value}
                onChange={onChange}
                label={selectAllLabel}
                isDisabled={isDisabled}
              />
              {children}
            </components.Menu>
          ) : undefined
        }}
        styles={customStyles}
        placeholder={placeholder}
        closeMenuOnSelect={closeMenuOnSelect}
        hideSelectedOptions={hideSelectedOptions}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isLoading={isLoading}
        maxMenuHeight={maxMenuHeight}
        menuPlacement={menuPlacement}
        noOptionsMessage={noOptionsMessage}
        className="react-select-container"
        classNamePrefix="react-select"
        {...rest}
      />
    </div>
  );
};

// 기본 export
export default MultiSelect;