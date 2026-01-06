import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import type {
  ExportMode,
  ExportFormat,
  STLFormat,
  VoxelQuality,
} from "../types/export.types";
import { BlenderIcon } from "./icons/BlenderIcon";
import { PrinterIcon } from "./icons/PrinterIcon";

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: number;
  stage: string;
  isComplete: boolean;
  isProcessing: boolean;
  exportMode: ExportMode;
  exportFormat: ExportFormat;
  stlFormat: STLFormat;
  voxelQuality: VoxelQuality;
  onModeChange: (mode: ExportMode) => void;
  onFormatChange: (format: ExportFormat) => void;
  onSTLFormatChange: (format: STLFormat) => void;
  onVoxelQualityChange: (quality: VoxelQuality) => void;
  onStartExport: () => void;
  onDownload: () => void;
  onCancel: () => void;
}

export function ExportProgressModal({
  isOpen,
  progress,
  stage,
  isComplete,
  isProcessing,
  exportMode,
  exportFormat,
  stlFormat,
  voxelQuality,
  onModeChange,
  onFormatChange,
  onSTLFormatChange,
  onVoxelQualityChange,
  onStartExport,
  onDownload,
  onCancel,
}: ExportProgressModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-9999 bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            className="border-border bg-bg-secondary fixed top-1/2 left-1/2 z-10000 mx-4 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-8 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Title */}
            <Dialog.Title className="text-text-primary mb-6 font-mono text-xl font-bold">
              Export
            </Dialog.Title>

            {/* Export Mode Selector (only show if not started processing) */}
            {!isComplete && !isProcessing && (
              <div className="mb-6">
                <p className="text-text-muted mb-3 font-mono text-xs font-bold tracking-wider uppercase">
                  Export Quality
                </p>
                <div className="flex flex-col gap-2">
                  {/* Fast and Raw Option */}
                  <label
                    className={`cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                      exportMode === "fast"
                        ? "border-primary-500 bg-primary-500/10 shadow-primary-500/20 shadow-lg"
                        : "border-border bg-bg-tertiary hover:border-primary-500/50 hover:bg-primary-500/5 hover:shadow-md"
                    }`}
                  >
                    <input
                      type="radio"
                      value="fast"
                      checked={exportMode === "fast"}
                      onChange={() => onModeChange("fast")}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              exportMode === "fast"
                                ? "border-primary-500"
                                : "border-border"
                            }`}
                          >
                            {exportMode === "fast" && (
                              <div className="bg-primary-500 h-2 w-2 rounded-full" />
                            )}
                          </div>
                          <span className="text-text-primary font-mono text-sm font-bold">
                            Fast and Raw
                          </span>
                        </div>
                        <p className="text-text-muted font-mono text-xs">
                          Instant export of a perfect-looking model suitable for
                          3D modelling, but may require additional repair step
                          to 3D print.
                        </p>
                      </div>
                      <div className="shrink-0 transition-all duration-200">
                        <BlenderIcon
                          size={48}
                          className={`transition-colors duration-200 ${exportMode === "fast" ? "text-primary-500 drop-shadow-lg" : "text-text-muted"}`}
                        />
                      </div>
                    </div>
                  </label>

                  {/* Optimized for 3D Printing Option */}
                  <label
                    className={`cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                      exportMode === "optimized"
                        ? "border-primary-500 bg-primary-500/10 shadow-primary-500/20 shadow-lg"
                        : "border-border bg-bg-tertiary hover:border-primary-500/50 hover:bg-primary-500/5 hover:shadow-md"
                    }`}
                  >
                    <input
                      type="radio"
                      value="optimized"
                      checked={exportMode === "optimized"}
                      onChange={() => onModeChange("optimized")}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                              exportMode === "optimized"
                                ? "border-primary-500"
                                : "border-border"
                            }`}
                          >
                            {exportMode === "optimized" && (
                              <div className="bg-primary-500 h-2 w-2 rounded-full" />
                            )}
                          </div>
                          <span className="text-text-primary font-mono text-sm font-bold">
                            Optimized for 3D Printing
                          </span>
                        </div>
                        <p className="text-text-muted font-mono text-xs">
                          Will take some time (well, you running this in a
                          browser I demand your understanding) but it will be a
                          watertight model ready for your 3D printer.
                        </p>
                      </div>
                      <div className="shrink-0 transition-all duration-200">
                        <PrinterIcon
                          size={48}
                          className={`transition-colors duration-200 ${exportMode === "optimized" ? "text-primary-500 drop-shadow-lg" : "text-text-muted"}`}
                        />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Format Selection (only show if not started processing) */}
            {!isComplete && !isProcessing && (
              <div className="mb-6">
                <p className="text-text-muted mb-3 font-mono text-xs font-bold tracking-wider uppercase">
                  File Format
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFormatChange("stl")}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      exportFormat === "stl"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    STL
                  </button>
                  <button
                    onClick={() => onFormatChange("3mf")}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      exportFormat === "3mf"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    3MF
                  </button>
                </div>
              </div>
            )}

            {!isComplete && !isProcessing && exportFormat === "stl" && (
              <div className="mb-6">
                <p className="text-text-muted mb-3 font-mono text-xs font-bold tracking-wider uppercase">
                  File format
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSTLFormatChange("binary")}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      stlFormat === "binary"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    Binary
                  </button>
                  <button
                    onClick={() => onSTLFormatChange("ascii")}
                    className={`flex-1 rounded-lg border-2 px-4 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      stlFormat === "ascii"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    ASCII
                  </button>
                </div>
              </div>
            )}

            {/* Voxel Quality (only show for optimized mode and not processing) */}
            {!isComplete && !isProcessing && exportMode === "optimized" && (
              <div className="mb-6">
                <p className="text-text-muted mb-3 font-mono text-xs font-bold tracking-wider uppercase">
                  Mesh Quality
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onVoxelQualityChange("low")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      voxelQuality === "low"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    Low
                  </button>
                  <button
                    onClick={() => onVoxelQualityChange("medium")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      voxelQuality === "medium"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => onVoxelQualityChange("ultra")}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 font-mono text-xs font-semibold transition-all duration-200 ${
                      voxelQuality === "ultra"
                        ? "text-text-primary border-primary-500 bg-primary-500/10"
                        : "border-border bg-bg-tertiary text-text-muted hover:border-primary-500/50"
                    }`}
                  >
                    Ultra
                  </button>
                </div>
              </div>
            )}

            {/* Progress Section (show if processing) */}
            {!isComplete && isProcessing && (
              <>
                {/* Stage Text */}
                <Dialog.Description className="text-text-muted mb-4 font-mono text-sm">
                  {stage || "Processing..."}
                </Dialog.Description>

                {/* Radix UI Progress Bar */}
                <Progress.Root
                  className="bg-bg-tertiary relative mb-2 h-4 w-full overflow-hidden rounded-full shadow-inner"
                  value={progress}
                >
                  <Progress.Indicator
                    className="from-primary-500 to-primary-400 shadow-primary-500/30 h-full rounded-full bg-linear-to-r shadow-lg transition-all duration-300 ease-out"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>

                {/* Progress Percentage */}
                <p className="text-text-primary mb-6 text-right font-mono text-sm font-bold">
                  {progress.toFixed(0)}%
                </p>
              </>
            )}

            {/* Complete Message */}
            {isComplete && (
              <Dialog.Description className="text-text-muted mb-6 font-mono text-sm">
                Your gear has been processed and is ready to download!
              </Dialog.Description>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isComplete ? (
                <>
                  <button
                    onClick={onDownload}
                    className="border-primary-500 from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:shadow-primary-500/30 flex-1 rounded-lg border bg-linear-to-r px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-100"
                  >
                    Download File
                  </button>
                  <Dialog.Close asChild>
                    <button
                      onClick={onCancel}
                      className="border-border bg-bg-tertiary text-text-muted hover:border-text-primary hover:bg-bg-primary hover:text-text-primary rounded-lg border px-4 py-3 font-mono text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-100"
                    >
                      Close
                    </button>
                  </Dialog.Close>
                </>
              ) : isProcessing ? (
                <Dialog.Close asChild>
                  <button
                    onClick={onCancel}
                    className="border-border bg-bg-tertiary text-text-muted hover:border-text-primary hover:bg-bg-primary hover:text-text-primary w-full rounded-lg border px-4 py-3 font-mono text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-100"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
              ) : (
                <>
                  <button
                    onClick={onStartExport}
                    className="border-primary-500 from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:shadow-primary-500/30 flex-1 rounded-lg border bg-linear-to-r px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-100"
                  >
                    Start Export
                  </button>
                  <Dialog.Close asChild>
                    <button
                      onClick={onCancel}
                      className="border-border bg-bg-tertiary text-text-muted hover:border-text-primary hover:bg-bg-primary hover:text-text-primary rounded-lg border px-4 py-3 font-mono text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-100"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                </>
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
