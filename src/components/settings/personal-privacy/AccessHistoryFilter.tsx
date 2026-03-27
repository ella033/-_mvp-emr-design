"use client";

import InputDateRange from "@/components/ui/input-date-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FilterContainer, 
  FilterRow, 
  FilterItem, 
  FilterLabel, 
  FilterDescription 
} from "./commons/filter-components";

export const CLEAR_VALUE = "__ALL__";

interface AccessHistoryFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (range: { from: string; to: string }) => void;
  userId?: string;
  onUserChange: (value: string) => void;
  users: { id: string; name: string }[];
}

export function AccessHistoryFilter({
  startDate,
  endDate,
  onDateChange,
  userId,
  onUserChange,
  users,
}: AccessHistoryFilterProps) {
  return (
    <FilterContainer>
      <FilterRow>
        <FilterItem width="300px">
          <FilterLabel>사용자</FilterLabel>
          <Select
            value={userId ?? CLEAR_VALUE}
            onValueChange={onUserChange}
          >
            <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>전체</SelectItem>
              {users?.filter(user => user.id !== "undefined" && user.id).map((user, idx) => (
                <SelectItem key={`${user.id}-${idx}`} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterItem>
        
        <FilterItem className="flex-1">
          <FilterLabel>조회 기간</FilterLabel>
          <InputDateRange
            fromValue={startDate}
            toValue={endDate}
            onChange={onDateChange}
            className="w-[300px]"
          />
          <FilterDescription>(기본 1개월 조회)</FilterDescription>
        </FilterItem>
      </FilterRow>
    </FilterContainer>
  );
}
