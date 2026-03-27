'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DocumentSearchSectionProps {
  onSearchChange: (query: string) => void;
}

export default function DocumentSearchSection({
  onSearchChange,
}: DocumentSearchSectionProps) {
  const [query, setQuery] = useState('');

  function handleSearchChange(value: string) {
    setQuery(value);
    onSearchChange(value);
  }

  return (
    <div className="w-full">
      <div className="relative border-b border-color-[#DBDCDF] py-[7px] px-[12px]">
        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-gray-400" />
        <Input
          placeholder="서식명을 검색하세요."
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-6 h-8 text-sm rounded-none shadow-none border-none"
        />
      </div>
    </div>
  );
}

