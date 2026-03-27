"use client";

import React from "react";
import ExceptionSettings from "./exception_settings";
import BasicPrinterSettings from "./basic_printer_settings";

export default function DetailPrinterSettings() {
  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pr-2">
      <BasicPrinterSettings />
      <ExceptionSettings />
    </div>
  );
}


