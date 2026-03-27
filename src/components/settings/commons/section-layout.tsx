import React from "react";

type SectionLayoutProps = {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  testId?: string;
};

export function SectionLayout({
  header,
  body,
  footer,
  className = "",
  testId,
}: SectionLayoutProps) {
  return (
    <section
      data-testid={testId}
      className={`flex flex-col h-full w-full border border-slate-200 rounded-lg p-4 gap-4 ${className}`}
    >
      {header && <header>{header}</header>}
      {body && (
        <div className="flex-1 flex-col gap-[12px] flex overflow-y-auto">
          {body}
        </div>
      )}
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
