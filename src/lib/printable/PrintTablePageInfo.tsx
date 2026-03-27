'use client';

import React from 'react';
import { usePrintTablePagination } from './PrintableDocument';

export function PrintTablePageInfo() {
  const pagination = usePrintTablePagination();

  if (!pagination) {
    return <span>1/1</span>;
  }

  return (
    <span>
      {pagination.pageIndex}/{pagination.totalPages}
    </span>
  );
}
