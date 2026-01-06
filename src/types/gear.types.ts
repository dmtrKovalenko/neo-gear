export type HoleType =
  | "none"
  | "round"
  | "keyed"
  | "d-shaft"
  | "hex"
  | "square";

export interface GearParameters {
  teethCount: number;
  module: number;
  rootDiameter: number; // Root diameter (solid gear body base)
  outerDiameter: number; // Outer diameter (tooth tips)
  pressureAngle: number;
  backlash: number;
  clearance: number;
  boreDiameter: number;
  holeType: HoleType;
  keyWidth: number; // For keyed holes
  keyDepthRatio: number; // For keyed holes: depth as ratio of width (0.5 = depth is half of width)
  keyDepth: number; // For keyed holes: absolute depth in mm (if 0, uses ratio instead)
  dShaftFlatDepth: number; // For d-shaft: how deep the flat cuts (as ratio 0-1, default 0.15)
  thickness: number;
  helixAngle: number;
  profileShift: number;
}

export const DEFAULT_GEAR_PARAMS: GearParameters = {
  teethCount: 32, // fine gear by default
  module: 2,
  rootDiameter: 59, // Calculated: max(pitchRadius - dedendum, baseRadius * 0.95) * 2
  outerDiameter: 68.0, // Calculated: (pitchRadius + addendum) * 2
  pressureAngle: 20,
  backlash: 0.1,
  clearance: 0.25,
  boreDiameter: 8,
  holeType: "round",
  keyWidth: 2, // Standard: d/4 = 8/4 = 2mm
  keyDepthRatio: 0.5, // Standard: depth = width/2
  keyDepth: 0, // 0 = use ratio, otherwise use absolute mm value
  dShaftFlatDepth: 0.15, // Standard: 15% into radius
  thickness: 10,
  helixAngle: 0,
  profileShift: 0,
};

export interface GearParameterConfig {
  key: keyof GearParameters;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit: string;
  description: string;
  type?: "number" | "select";
  options?: { value: string; label: string }[];
}

export const GEAR_PARAMETER_CONFIGS: GearParameterConfig[] = [
  {
    key: "teethCount",
    label: "Teeth Count",
    min: 4,
    max: 200,
    step: 1,
    unit: "",
    description: "Number of teeth on the gear",
  },
  {
    key: "module",
    label: "Module",
    min: 0.3,
    max: 25,
    step: 0.1,
    unit: "mm",
    description: "Ratio of pitch diameter to teeth count",
  },
  {
    key: "rootDiameter",
    label: "Root Diameter",
    min: 5,
    max: 500,
    step: 0.5,
    unit: "mm",
    description: "Diameter at base of teeth (solid gear body)",
  },
  {
    key: "outerDiameter",
    label: "Outer Diameter",
    min: 5,
    max: 500,
    step: 0.5,
    unit: "mm",
    description: "Diameter at tooth tips",
  },
  {
    key: "pressureAngle",
    label: "Pressure Angle",
    min: 14.5,
    max: 30,
    step: 0.5,
    unit: "°",
    description: "Angle of tooth engagement force",
  },
  {
    key: "backlash",
    label: "Backlash",
    min: 0,
    max: 2,
    step: 0.01,
    unit: "mm",
    description: "Gap between mating teeth",
  },
  {
    key: "clearance",
    label: "Clearance",
    min: 0.05,
    max: 1,
    step: 0.01,
    unit: "×m",
    description: "Root clearance as factor of module",
  },
  {
    key: "holeType",
    label: "Hole Type",
    type: "select",
    unit: "",
    description: "Type of shaft hole",
    options: [
      { value: "none", label: "None" },
      { value: "round", label: "Round" },
      { value: "keyed", label: "Keyed (with keyway)" },
      { value: "d-shaft", label: "D-Shaft" },
      { value: "hex", label: "Hexagonal" },
      { value: "square", label: "Square" },
    ],
  },
  {
    key: "boreDiameter",
    label: "Bore Diameter",
    min: 0,
    max: 100,
    step: 0.5,
    unit: "mm",
    description: "Central hole diameter for shaft",
  },
  {
    key: "keyWidth",
    label: "Key Width",
    min: 0.5,
    max: 20,
    step: 0.1,
    unit: "mm",
    description: "Width of keyway slot (standard: d/4)",
  },
  {
    key: "keyDepthRatio",
    label: "Key Depth Ratio",
    min: 0.1,
    max: 2,
    step: 0.05,
    unit: "ratio",
    description: "Depth as ratio of width (0.5 = half width)",
  },
  {
    key: "keyDepth",
    label: "Key Depth (mm)",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "mm",
    description: "Absolute depth in mm (0 = use ratio)",
  },
  {
    key: "dShaftFlatDepth",
    label: "D-Shaft Flat Depth",
    min: 0.05,
    max: 0.5,
    step: 0.01,
    unit: "ratio",
    description: "Flat depth as ratio of radius (0.15 = 15% standard)",
  },
  {
    key: "thickness",
    label: "Thickness",
    min: 1,
    max: 100,
    step: 0.5,
    unit: "mm",
    description: "Gear face width",
  },
  {
    key: "helixAngle",
    label: "Helix Angle",
    min: 0,
    max: 45,
    step: 1,
    unit: "°",
    description: "Angle for helical gears (0 = spur)",
  },
  {
    key: "profileShift",
    label: "Profile Shift",
    min: -1,
    max: 1,
    step: 0.05,
    unit: "×m",
    description: "Controls tooth thickness and strength",
  },
];
