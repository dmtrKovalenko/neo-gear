import { motion } from "framer-motion";
import { ParameterInput } from "./ParameterInput";
import { ExportButtons } from "./ExportButtons";
import type { GearParameters, GearParameterConfig } from "../types/gear.types";
import { GEAR_PARAMETER_CONFIGS } from "../types/gear.types";
import {
  calculateGearDimensions as calcDimensions,
  calculateGearGeometryValues,
} from "../utils/gearGenerator";
import type { Mesh } from "three";

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
  meshRef: React.RefObject<Mesh | null>;
}

const parameterGroups = [
  {
    title: "Basic Parameters",
    keys: ["teethCount", "module", "outerDiameter"] as const,
  },
  {
    title: "Tooth Geometry",
    keys: ["pressureAngle", "backlash", "clearance", "profileShift"] as const,
  },
  {
    title: "Shaft & Dimensions",
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
    title: "Advanced",
    keys: ["helixAngle"] as const,
  },
];

export function ParameterPanel({
  params,
  onParamChange,
  meshRef,
}: ParameterPanelProps) {
  const handleChange = (key: string, value: number | string) => {
    onParamChange(key as keyof GearParameters, value);
  };

  const dimensions = calcDimensions(params);

  const geo = calculateGearGeometryValues(params);

  // clearance = (pitchRadius - baseConstraintRadius) / module - 1.25 + profileShift
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

  return (
    <div className="border-border bg-bg-secondary flex h-full w-96 flex-col border-r">
      <div className="border-border border-b py-3 px-6">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <ion-icon name="cog-outline" class="text-[4rem] mt-0.5"></ion-icon>
          </motion.div>
          <div>
            <h1 className="text-text-primary font-mono text-3xl font-bold tracking-tight">
              NEO GEAR BTW
            </h1>
            <p className="text-text-muted font-mono text-sm">
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
            <h2 className="text-text-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
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
          <h2 className="text-text-muted mb-4 font-mono text-xs font-bold tracking-wider uppercase">
            Calculated Dimensions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-text-muted block font-mono text-xs">
                Pitch Diameter
              </span>
              <span className="text-text-primary font-mono text-sm font-semibold">
                {dimensions.pitchDiameter} mm
              </span>
            </div>
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-text-muted block font-mono text-xs">
                Outer Diameter
              </span>
              <span className="text-text-primary font-mono text-sm font-semibold">
                {dimensions.outerDiameter} mm
              </span>
            </div>
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-text-muted block font-mono text-xs">
                Root Diameter
              </span>
              <span className="text-text-primary font-mono text-sm font-semibold">
                {dimensions.rootDiameter} mm
              </span>
            </div>
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-text-muted block font-mono text-xs">
                Base Diameter
              </span>
              <span className="text-text-primary font-mono text-sm font-semibold">
                {dimensions.baseDiameter} mm
              </span>
            </div>
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-text-muted block font-mono text-xs">
                Tooth Height
              </span>
              <span className="text-text-primary font-mono text-sm font-semibold">
                {dimensions.toothHeight} mm
              </span>
            </div>
            <div className="bg-bg-tertiary rounded p-3">
              <span className="text-text-muted block font-mono text-xs">
                Circular Pitch
              </span>
              <span className="text-text-primary font-mono text-sm font-semibold">
                {dimensions.circularPitch} mm
              </span>
            </div>
            {params.holeType === "keyed" && (
              <div className="bg-bg-tertiary rounded p-3">
                <span className="text-text-muted block font-mono text-xs">
                  Key Depth (calc)
                </span>
                <span className="text-text-primary font-mono text-sm font-semibold">
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

      <div className="border-border border-t p-4">
        <ExportButtons meshRef={meshRef} params={params} />
      </div>
    </div>
  );
}
