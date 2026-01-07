import { useState } from "react";
import { motion } from "framer-motion";
import type { Mesh } from "three";
import {
  exportToSTLFast,
  exportTo3MFFast,
  exportToSTLWithRepair,
  exportTo3MFWithRepair,
} from "../utils/exporters";
import type { GearParameters } from "../types/gear.types";
import type {
  ExportMode,
  ExportFormat,
  STLFormat,
  VoxelQuality,
} from "../types/export.types";
import { ExportProgressModal } from "./ExportProgressModal";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": {
        name?: string;
        class?: string;
      };
    }
  }
}

interface ExportButtonsProps {
  meshRef: React.RefObject<Mesh | null>;
  params: GearParameters;
}

export function ExportButtons({ meshRef, params }: ExportButtonsProps) {
  const [exportMode, setExportMode] = useState<ExportMode>("optimized");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("stl");
  const [stlFormat, setSTLFormat] = useState<STLFormat>("binary");
  const [voxelQuality, setVoxelQuality] = useState<VoxelQuality>("ultra");
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState({ stage: "", progress: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exportResult, setExportResult] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);

  const handleDownload = () => {
    if (!exportResult) return;

    const url = URL.createObjectURL(exportResult.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowModal(false);
    setIsComplete(false);
    setIsProcessing(false);
    setProgress({ stage: "", progress: 0 });
    setExportResult(null);
  };

  const onCancel = () => {
    setShowModal(false);
    setIsComplete(false);
    setIsProcessing(false);
    setProgress({ stage: "", progress: 0 });
    setExportResult(null);
  };

  const handleStartExport = (format: ExportFormat) => {
    if (!meshRef.current) return;

    setExportFormat(format);
    setShowModal(true);
    setIsComplete(false);
    setIsProcessing(false);
    setProgress({ stage: "", progress: 0 });
    setExportResult(null);
  };

  const handleProcessExport = async () => {
    if (!meshRef.current) return;

    setIsProcessing(true);
    setProgress({ stage: "Starting export...", progress: 1 });

    // Small delay to ensure UI updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      let result: { blob: Blob; filename: string };

      if (exportMode === "fast") {
        setProgress({ stage: "Exporting...", progress: 50 });
        await new Promise((resolve) => setTimeout(resolve, 100));

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
            (stage, progress) => {
              console.log(`Progress: ${stage} - ${progress}%`);
              setProgress({ stage, progress });
            }
          );
        } else {
          result = await exportTo3MFWithRepair(
            meshRef.current,
            params,
            voxelQuality,
            (stage, progress) => {
              setProgress({ stage, progress });
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
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModeChange = (mode: ExportMode) => {
    setExportMode(mode);
  };

  const handleFormatChange = (format: ExportFormat) => {
    setExportFormat(format);
  };

  const handleSTLFormatChange = (format: STLFormat) => {
    setSTLFormat(format);
  };

  const handleVoxelQualityChange = (quality: VoxelQuality) => {
    setVoxelQuality(quality);
  };

  return (
    <div>
      <p className="text-ink-muted mb-3 font-mono text-xs font-bold tracking-wider uppercase">
        Export Model
      </p>
      <div className="flex gap-2">
        <motion.button
          className="border-primary-500 bg-primary-500 hover:bg-primary-600 flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => handleStartExport("stl")}
          disabled={showModal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ion-icon name="download-outline" class="text-lg"></ion-icon>
          <span>Export STL</span>
        </motion.button>

        <motion.button
          className="hover:border-primary-500 hover:text-primary-500 border-border bg-tertiary text-ink-primary flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 font-mono text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => handleStartExport("3mf")}
          disabled={showModal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ion-icon name="download-outline" class="text-lg"></ion-icon>
          <span>Export 3MF</span>
        </motion.button>
      </div>

      <ExportProgressModal
        isOpen={showModal}
        progress={progress.progress}
        stage={progress.stage}
        isComplete={isComplete}
        isProcessing={isProcessing}
        exportMode={exportMode}
        exportFormat={exportFormat}
        stlFormat={stlFormat}
        voxelQuality={voxelQuality}
        onModeChange={handleModeChange}
        onFormatChange={handleFormatChange}
        onSTLFormatChange={handleSTLFormatChange}
        onVoxelQualityChange={handleVoxelQualityChange}
        onStartExport={handleProcessExport}
        onDownload={handleDownload}
        onCancel={onCancel}
      />
    </div>
  );
}
