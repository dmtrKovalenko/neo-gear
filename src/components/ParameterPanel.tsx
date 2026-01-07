import { motion } from "framer-motion";
import { ParameterInput } from "./ParameterInput";
import type { GearParameters, GearParameterConfig } from "../types/gear.types";
import { GEAR_PARAMETER_CONFIGS } from "../types/gear.types";
import {
  calculateGearDimensions as calcDimensions,
  calculateGearGeometryValues,
} from "../utils/gearGenerator";

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

interface ParameterPanelProps {
  params: GearParameters;
  onParamChange: (key: keyof GearParameters, value: number | string) => void;
  variant?: "desktop" | "mobile";
  onExport?: (format?: "stl" | "3mf") => void;
}

const parameterGroups = [
  {
    title: "Basic Parameters",
    keys: ["module", "outerDiameter", "teethCount"] as const,
  },
  {
    title: "Tooth Geometry",
    keys: ["pressureAngle", "backlash", "clearance", "profileShift"] as const,
  },
  {
    title: "Shaft Bore",
    keys: [
      "holeType",
      "boreDiameter",
      "keyWidth",
      "keyDepthRatio",
      "keyDepth",
      "dShaftFlatDepth",
      "thickness",
    ] as const,
  },
  {
    title: "Additional",
    keys: ["helixAngle"] as const,
  },
];

export function ParameterPanel({
  params,
  onParamChange,
  variant = "desktop",
  onExport,
}: ParameterPanelProps) {
  const isMobile = variant === "mobile";

  const handleChange = (key: string, value: number | string) => {
    onParamChange(key as keyof GearParameters, value);
  };

  const dimensions = calcDimensions(params);
  const geo = calculateGearGeometryValues(params);

  const baseConstraintRadius = geo.baseRadius * 0.95;
  const maxEffectiveClearance = Math.max(
    0.05,
    (geo.pitchRadius - baseConstraintRadius) / params.module -
      1.25 +
      params.profileShift
  );

  const getConfig = (key: string): GearParameterConfig | undefined => {
    const config = GEAR_PARAMETER_CONFIGS.find((c) => c.key === key);

    if (key === "clearance" && config) {
      return {
        ...config,
        max: maxEffectiveClearance,
      };
    }

    if (key === "boreDiameter" && config) {
      return {
        ...config,
        min: 0,
        max: params.rootDiameter * 0.75,
      };
    }

    return config;
  };

  // Mobile layout - single scrollable container
  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto pb-24">
        {/* Header - scrolls with content */}
        <div className="border-border border-b px-4 py-4">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <ion-icon name="cog-outline" class="text-[3rem]" />
            </motion.div>
            <div>
              <h1 className="text-ink-primary font-mono text-2xl font-bold tracking-tight">
                NEO GEAR BTW
              </h1>
              <p className="text-ink-muted font-mono text-xs">
                Parametric Gear Generator
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          {parameterGroups.map((group, groupIndex) => (
            <motion.section
              key={group.title}
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <h2 className="text-ink-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
                {group.title}
              </h2>
              <div className="space-y-4">
                {group.keys.map((key) => {
                  const config = getConfig(key);
                  if (!config) return null;

                  if (
                    (key === "keyWidth" ||
                      key === "keyDepthRatio" ||
                      key === "keyDepth") &&
                    params.holeType !== "keyed"
                  ) {
                    return null;
                  }

                  if (
                    key === "dShaftFlatDepth" &&
                    params.holeType !== "d-shaft"
                  ) {
                    return null;
                  }

                  return (
                    <ParameterInput
                      key={key}
                      config={config}
                      value={params[key]}
                      onChange={handleChange}
                    />
                  );
                })}
              </div>
            </motion.section>
          ))}

          {/* Calculated Dimensions */}
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-ink-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
              Calculated Dimensions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Pitch Diameter
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {dimensions.pitchDiameter} mm
                </span>
              </div>
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Outer Diameter
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {dimensions.outerDiameter} mm
                </span>
              </div>
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Root Diameter
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {dimensions.rootDiameter} mm
                </span>
              </div>
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Base Diameter
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {dimensions.baseDiameter} mm
                </span>
              </div>
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Tooth Height
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {dimensions.toothHeight} mm
                </span>
              </div>
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Circular Pitch
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {dimensions.circularPitch} mm
                </span>
              </div>
              {params.holeType === "keyed" && (
                <div className="bg-tertiary rounded p-3">
                  <span className="text-ink-muted block font-mono text-xs">
                    Key Depth (calc)
                  </span>
                  <span className="text-ink-primary font-mono text-sm font-semibold">
                    {(params.keyDepth > 0
                      ? params.keyDepth
                      : params.keyWidth * params.keyDepthRatio
                    ).toFixed(2)}{" "}
                    mm
                  </span>
                </div>
              )}
            </div>
          </motion.section>

          {/* Export Button */}
          {onExport && (
            <motion.section
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-ink-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
                Export Model
              </h2>
              <motion.button
                className="bg-primary-500 hover:bg-primary-600 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-mono text-sm font-semibold text-white shadow-lg transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onExport()}
              >
                <ion-icon name="download-outline" class="text-lg" />
                Export
              </motion.button>
            </motion.section>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout - sidebar with sticky header and footer
  return (
    <div className="border-border bg-secondary flex h-full w-96 flex-col border-r">
      <div className="border-border border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <ion-icon name="cog-outline" class="mt-0.5 text-[4rem]" />
          </motion.div>
          <div>
            <h1 className="text-ink-primary font-mono text-3xl font-bold tracking-tight">
              NEO GEAR BTW
            </h1>
            <p className="text-ink-muted font-mono text-sm">
              Parametric Gear Generator
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {parameterGroups.map((group, groupIndex) => (
          <motion.section
            key={group.title}
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h2 className="text-ink-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
              {group.title}
            </h2>
            <div className="space-y-4">
              {group.keys.map((key) => {
                const config = getConfig(key);
                if (!config) return null;

                if (
                  (key === "keyWidth" ||
                    key === "keyDepthRatio" ||
                    key === "keyDepth") &&
                  params.holeType !== "keyed"
                ) {
                  return null;
                }

                if (
                  key === "dShaftFlatDepth" &&
                  params.holeType !== "d-shaft"
                ) {
                  return null;
                }

                return (
                  <ParameterInput
                    key={key}
                    config={config}
                    value={params[key]}
                    onChange={handleChange}
                  />
                );
              })}
            </div>
          </motion.section>
        ))}

        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-ink-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
            Calculated Dimensions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-tertiary rounded p-3">
              <span className="text-ink-muted block font-mono text-xs">
                Pitch Diameter
              </span>
              <span className="text-ink-primary font-mono text-sm font-semibold">
                {dimensions.pitchDiameter} mm
              </span>
            </div>
            <div className="bg-tertiary rounded p-3">
              <span className="text-ink-muted block font-mono text-xs">
                Outer Diameter
              </span>
              <span className="text-ink-primary font-mono text-sm font-semibold">
                {dimensions.outerDiameter} mm
              </span>
            </div>
            <div className="bg-tertiary rounded p-3">
              <span className="text-ink-muted block font-mono text-xs">
                Root Diameter
              </span>
              <span className="text-ink-primary font-mono text-sm font-semibold">
                {dimensions.rootDiameter} mm
              </span>
            </div>
            <div className="bg-tertiary rounded p-3">
              <span className="text-ink-muted block font-mono text-xs">
                Base Diameter
              </span>
              <span className="text-ink-primary font-mono text-sm font-semibold">
                {dimensions.baseDiameter} mm
              </span>
            </div>
            <div className="bg-tertiary rounded p-3">
              <span className="text-ink-muted block font-mono text-xs">
                Tooth Height
              </span>
              <span className="text-ink-primary font-mono text-sm font-semibold">
                {dimensions.toothHeight} mm
              </span>
            </div>
            <div className="bg-tertiary rounded p-3">
              <span className="text-ink-muted block font-mono text-xs">
                Circular Pitch
              </span>
              <span className="text-ink-primary font-mono text-sm font-semibold">
                {dimensions.circularPitch} mm
              </span>
            </div>
            {params.holeType === "keyed" && (
              <div className="bg-tertiary rounded p-3">
                <span className="text-ink-muted block font-mono text-xs">
                  Key Depth (calc)
                </span>
                <span className="text-ink-primary font-mono text-sm font-semibold">
                  {(params.keyDepth > 0
                    ? params.keyDepth
                    : params.keyWidth * params.keyDepthRatio
                  ).toFixed(2)}{" "}
                  mm
                </span>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {onExport && (
        <div className="border-border border-t p-4">
          <p className="text-ink-muted mb-3 font-mono text-xs font-bold tracking-wider uppercase">
            Export Model
          </p>
          <div className="flex gap-2">
            <motion.button
              className="border-primary-500 bg-primary-500 hover:bg-primary-600 flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 font-mono text-sm font-semibold text-white transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExport("stl")}
            >
              <ion-icon name="download-outline" class="text-lg" />
              Export STL
            </motion.button>
            <motion.button
              className="hover:border-primary-500 hover:text-primary-500 border-border bg-tertiary text-ink-primary flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 font-mono text-sm font-semibold transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExport("3mf")}
            >
              <ion-icon name="download-outline" class="text-lg" />
              Export 3MF
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
