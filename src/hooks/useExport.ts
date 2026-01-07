import { useState, type RefObject } from "react";
import type { Mesh } from "three";
import type { GearParameters } from "../types/gear.types";
import type {
  ExportMode,
  ExportFormat,
  STLFormat,
  VoxelQuality,
} from "../types/export.types";
import {
  exportToSTLFast,
  exportTo3MFFast,
  exportToSTLWithRepair,
  exportTo3MFWithRepair,
} from "../utils/exporters";
import { useStickyState } from "./useStickyState";

interface ExportSettings {
  exportMode: ExportMode;
  exportFormat: ExportFormat;
  stlFormat: STLFormat;
  voxelQuality: VoxelQuality;
}

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  exportMode: "optimized",
  exportFormat: "stl",
  stlFormat: "binary",
  voxelQuality: "ultra",
};

export interface ExportState {
  exportMode: ExportMode;
  exportFormat: ExportFormat;
  stlFormat: STLFormat;
  voxelQuality: VoxelQuality;
  showModal: boolean;
  progress: { stage: string; progress: number };
  isProcessing: boolean;
  isComplete: boolean;
}

export interface ExportActions {
  setExportMode: (mode: ExportMode) => void;
  setExportFormat: (format: ExportFormat) => void;
  setSTLFormat: (format: STLFormat) => void;
  setVoxelQuality: (quality: VoxelQuality) => void;
  openExport: (format?: ExportFormat) => void;
  processExport: () => Promise<void>;
  download: () => void;
  cancel: () => void;
}

export type UseExportReturn = ExportState & ExportActions;

export function useExport(
  meshRef: RefObject<Mesh | null>,
  params: GearParameters
): UseExportReturn {
  const [settings, setSettings] = useStickyState<ExportSettings>(
    "gear-ftl-export-settings",
    DEFAULT_EXPORT_SETTINGS,
    1
  );
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState({ stage: "", progress: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exportResult, setExportResult] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);

  const { exportMode, exportFormat, stlFormat, voxelQuality } = settings;

  const setExportMode = (mode: ExportMode) =>
    setSettings((prev) => ({ ...prev, exportMode: mode }));
  const setExportFormat = (format: ExportFormat) =>
    setSettings((prev) => ({ ...prev, exportFormat: format }));
  const setSTLFormat = (format: STLFormat) =>
    setSettings((prev) => ({ ...prev, stlFormat: format }));
  const setVoxelQuality = (quality: VoxelQuality) =>
    setSettings((prev) => ({ ...prev, voxelQuality: quality }));

  const resetState = () => {
    setShowModal(false);
    setIsComplete(false);
    setIsProcessing(false);
    setProgress({ stage: "", progress: 0 });
    setExportResult(null);
  };

  const openExport = (format?: ExportFormat) => {
    if (format) {
      setExportFormat(format);
    }
    setShowModal(true);
    setIsComplete(false);
    setIsProcessing(false);
    setProgress({ stage: "", progress: 0 });
    setExportResult(null);
  };

  const download = () => {
    if (!exportResult) return;

    const url = URL.createObjectURL(exportResult.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    resetState();
  };

  const cancel = () => {
    resetState();
  };

  const processExport = async () => {
    if (!meshRef.current) return;

    setIsProcessing(true);
    setProgress({ stage: "Starting export...", progress: 1 });

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      let result: { blob: Blob; filename: string };

      if (exportMode === "fast") {
        setProgress({ stage: "Exporting...", progress: 50 });

        if (exportFormat === "stl") {
          result = exportToSTLFast(meshRef.current, params, stlFormat);
        } else {
          result = exportTo3MFFast(meshRef.current, params);
        }
        setProgress({ stage: "Complete!", progress: 100 });
      } else {
        if (exportFormat === "stl") {
          result = await exportToSTLWithRepair(
            meshRef.current,
            params,
            stlFormat,
            voxelQuality,
            (stage, prog) => {
              setProgress({ stage, progress: prog });
            }
          );
        } else {
          result = await exportTo3MFWithRepair(
            meshRef.current,
            params,
            voxelQuality,
            (stage, prog) => {
              setProgress({ stage, progress: prog });
            }
          );
        }

        setProgress({ stage: "Complete!", progress: 100 });
      }

      setExportResult(result);
      setIsComplete(true);
    } catch (error) {
      console.error(error);
      alert(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`
      );
      cancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // state
    exportMode,
    exportFormat,
    stlFormat,
    voxelQuality,
    showModal,
    progress,
    isProcessing,
    isComplete,
    // actions
    setExportMode,
    setExportFormat,
    setSTLFormat,
    setVoxelQuality,
    openExport,
    processExport,
    download,
    cancel,
  };
}
