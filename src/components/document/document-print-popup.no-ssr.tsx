"use client";

import dynamic from "next/dynamic";

const DocumentPrintPopupNoSSR = dynamic(
  () =>
    import("./document-print-popup").then((module) => module.DocumentPrintPopup),
  { ssr: false },
);

export default DocumentPrintPopupNoSSR;
