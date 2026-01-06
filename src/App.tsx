import { useState, useRef } from "react";
import type * as THREE from "three";
import { useDebounce } from "use-debounce";
import { ParameterPanel } from "./components/ParameterPanel";
import { GearPreview } from "./components/GearPreview";
import { DEFAULT_GEAR_PARAMS, type GearParameters } from "./types/gear.types";
import { calculateGearGeometryValues } from "./utils/gearGenerator";

import "./tailwind.css";

interface EditHistoryEntry {
  parameter: keyof GearParameters;
  timestamp: number;
}

// we keep only the last N elements to leverage the interdependency logic
const HISTORY_LENGTH = 6;
const INTERDEPENDENT_PARAMS = [
  "module",
  "teethCount",
  "outerDiameter",
] as const;

function App() {
  const [params, setParams] = useState<GearParameters>(DEFAULT_GEAR_PARAMS);
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([]);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const [debouncedParams] = useDebounce(params, 150);

  const getOldestParam = (
    currentHistory: EditHistoryEntry[],
    excludeParam: string
  ): string => {
    const relevantHistory = currentHistory.filter((entry) =>
      INTERDEPENDENT_PARAMS.includes(
        entry.parameter as (typeof INTERDEPENDENT_PARAMS)[number]
      )
    );

    const editedParams = new Set(relevantHistory.map((e) => e.parameter));

    const uneditedParams = INTERDEPENDENT_PARAMS.filter(
      (p) => !editedParams.has(p) && p !== excludeParam
    );
    if (uneditedParams.length > 0) {
      return uneditedParams[0];
    }

    const sortedByTime = [...relevantHistory]
      .filter((e) => e.parameter !== excludeParam)
      .sort((a, b) => a.timestamp - b.timestamp);

    return sortedByTime.length > 0 ? sortedByTime[0].parameter : "module";
  };

  const handleParamChange = (
    key: keyof GearParameters,
    value: number | string
  ) => {
    let newHistory = editHistory;
    if (
      INTERDEPENDENT_PARAMS.includes(
        key as (typeof INTERDEPENDENT_PARAMS)[number]
      )
    ) {
      const newEntry: EditHistoryEntry = {
        parameter: key,
        timestamp: Date.now(),
      };
      newHistory = [
        ...editHistory.filter((e) => e.parameter !== key),
        newEntry,
      ].slice(-HISTORY_LENGTH);
      setEditHistory(newHistory);
    }

    setParams((prev) => {
      const newParams = { ...prev, [key]: value };

      const calculateRootDiameter = (tempParams: GearParameters): number => {
        const geo = calculateGearGeometryValues(tempParams);
        return geo.rootDiameter;
      };

      const calculateOuterDiameter = (tempParams: GearParameters): number => {
        const geo = calculateGearGeometryValues(tempParams);
        return geo.outerDiameter;
      };

      // Formula: outerDiameter = module × (teethCount + 2 + 2 × profileShift)
      //          module = outerDiameter / (teethCount + 2 + 2 × profileShift)
      const calculateModule = (
        outerDiameter: number,
        teethCount: number,
        profileShift: number
      ): number | null => {
        const denominator = teethCount + 2 + 2 * profileShift;
        if (denominator > 0 && outerDiameter > 0) {
          const calculatedModule = outerDiameter / denominator;
          if (calculatedModule >= 0.3 && calculatedModule <= 25) {
            return calculatedModule;
          }
        }
        return null;
      };

      // Formula: teethCount = (outerDiameter / module) - 2 - 2 × profileShift
      const calculateTeethCount = (
        outerDiameter: number,
        module: number,
        profileShift: number
      ): number | null => {
        if (module > 0 && outerDiameter > 0) {
          const calculatedTeeth = outerDiameter / module - 2 - 2 * profileShift;
          if (calculatedTeeth >= 4 && calculatedTeeth <= 200) {
            return Math.round(calculatedTeeth);
          }
        }
        return null;
      };

      const isInterdependent = INTERDEPENDENT_PARAMS.includes(
        key as (typeof INTERDEPENDENT_PARAMS)[number]
      );

      if (isInterdependent) {
        const oldestParam = getOldestParam(newHistory, key);

        console.log(
          "History:",
          newHistory.map((e) => e.parameter)
        );

        if (oldestParam === "module") {
          const newModule = calculateModule(
            newParams.outerDiameter,
            newParams.teethCount,
            newParams.profileShift
          );
          if (newModule !== null) {
            newParams.module = newModule;
          }
        } else if (oldestParam === "teethCount") {
          const newTeethCount = calculateTeethCount(
            newParams.outerDiameter,
            newParams.module,
            newParams.profileShift
          );
          if (newTeethCount !== null) {
            newParams.teethCount = newTeethCount;
          }
        } else if (oldestParam === "outerDiameter") {
          newParams.outerDiameter = calculateOuterDiameter(newParams);
        }

        newParams.rootDiameter = calculateRootDiameter(newParams);
      } else if (
        key === "pressureAngle" ||
        key === "clearance" ||
        key === "profileShift"
      ) {
        // These affect rootDiameter, and profileShift also affects outerDiameter
        if (key === "profileShift") {
          newParams.outerDiameter = calculateOuterDiameter(newParams);
        }
        newParams.rootDiameter = calculateRootDiameter(newParams);
      }

      const maxBoreDiameter = newParams.rootDiameter * 0.75;
      if (newParams.boreDiameter < 0) {
        newParams.boreDiameter = 0;
      } else if (newParams.boreDiameter > maxBoreDiameter) {
        newParams.boreDiameter = maxBoreDiameter;
      }


      return newParams;
    });
  };

  return (
    <div className="flex h-full w-full">
      <ParameterPanel
        params={params}
        onParamChange={handleParamChange}
        meshRef={meshRef}
      />
      <GearPreview ref={meshRef} params={debouncedParams} />
    </div>
  );
}

export default App;
