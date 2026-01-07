import { useState, type RefObject } from "react";
import type { Mesh } from "three";
import { MobileTabBar, type MobileTab } from "./MobileTabBar";
import { ParameterPanel } from "./ParameterPanel";
import { GearPreview } from "./GearPreview";
import type { GearParameters } from "../types/gear.types";

interface MobileLayoutProps {
  params: GearParameters;
  debouncedParams: GearParameters;
  onParamChange: (key: keyof GearParameters, value: number | string) => void;
  meshRef: RefObject<Mesh | null>;
  onExport: () => void;
}

export function MobileLayout({
  params,
  debouncedParams,
  onParamChange,
  meshRef,
  onExport,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("config");

  return (
    <>
      <div className="relative flex-1 overflow-hidden">
        {/* Config Panel */}
        <div className={activeTab === "config" ? "h-full" : "hidden"}>
          <ParameterPanel
            params={params}
            onParamChange={onParamChange}
            variant="mobile"
            onExport={onExport}
          />
        </div>

        {/* Preview - always mounted to keep mesh available for export */}
        <div
          className={
            activeTab === "preview" ? "h-full p-4 pb-24" : "invisible absolute"
          }
        >
          <div className="border-border bg-primary h-full overflow-hidden rounded-xl border">
            <GearPreview ref={meshRef} params={debouncedParams} />
          </div>
        </div>
      </div>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
