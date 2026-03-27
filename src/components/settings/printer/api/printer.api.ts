import { PrintersService } from "@/services/printers-service";

export const printerApi = {
  getPrinters: PrintersService.getPrinters,
  syncPrinters: PrintersService.syncPrinters,
  triggerRefresh: PrintersService.triggerRefresh,
  getPrinterSettings: PrintersService.getPrinterSettings,
  updatePrinterDefaults: PrintersService.updatePrinterDefaults,
  createPrinterOverride: PrintersService.createPrinterOverride,
  updatePrinterOverride: PrintersService.updatePrinterOverride,
  deletePrinterOverride: PrintersService.deletePrinterOverride,
  getAgents: PrintersService.getAgents,
  getAgentDevices: PrintersService.getAgentDevices,
  print: PrintersService.print,
  createPrintJob: PrintersService.createPrintJob,
  createTestJob: PrintersService.createTestJob,
};
