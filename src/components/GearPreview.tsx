import { Suspense, forwardRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Grid,
  PerspectiveCamera,
  Html,
} from "@react-three/drei";
import { motion } from "framer-motion";
import type * as THREE from "three";
import { GearMesh } from "./GearMesh";
import { DimensionLines } from "./DimensionLines";
import type { GearParameters } from "../types/gear.types";
import { calculateGearGeometryValues } from "../utils/gearGenerator";
import { useStickyState } from "../hooks/useStickyState";

interface PreviewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showDimensions: boolean;
}

const DEFAULT_PREVIEW_SETTINGS: PreviewSettings = {
  autoRotate: true,
  showGrid: true,
  showAxes: false,
  showDimensions: true,
};

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

interface GearPreviewProps {
  params: GearParameters;
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="text-primary-500 animate-spin">
          <ion-icon name="cog-outline" class="text-6xl" />
        </div>
      </div>
    </Html>
  );
}

export const GearPreview = forwardRef<THREE.Mesh | null, GearPreviewProps>(
  function GearPreview({ params }, ref) {
    const [settings, setSettings] = useStickyState<PreviewSettings>(
      "neo-gear-preview-settings",
      DEFAULT_PREVIEW_SETTINGS,
      1
    );

    const { autoRotate, showGrid, showAxes, showDimensions } = settings;

    const toggleAutoRotate = () =>
      setSettings((prev) => ({ ...prev, autoRotate: !prev.autoRotate }));
    const toggleGrid = () =>
      setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
    const toggleAxes = () =>
      setSettings((prev) => ({ ...prev, showAxes: !prev.showAxes }));
    const toggleDimensions = () =>
      setSettings((prev) => ({
        ...prev,
        showDimensions: !prev.showDimensions,
      }));

    const geo = calculateGearGeometryValues(params);
    const { pitchRadius, outerDiameter } = geo;
    const cameraDistance = Math.max(pitchRadius * 3, 50);

    const gridSize = Math.max(outerDiameter * 4, 200);
    const cellSize = Math.max(Math.floor(outerDiameter / 10), 5);

    return (
      <div className="relative h-full flex-1">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <motion.button
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 ${
              autoRotate
                ? "text-primary border-white bg-white"
                : "hover:border-primary-500 hover:text-primary-500 border-border bg-secondary text-ink-primary"
            }`}
            onClick={toggleAutoRotate}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle auto-rotation"
          >
            <ion-icon name="refresh-outline" class="text-xl" />
          </motion.button>

          <motion.button
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 ${
              showGrid
                ? "text-primary border-white bg-white"
                : "hover:border-primary-500 hover:text-primary-500 border-border bg-secondary text-ink-primary"
            }`}
            onClick={toggleGrid}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle grid"
          >
            <ion-icon name="grid-outline" class="text-xl" />
          </motion.button>

          <motion.button
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 ${
              showAxes
                ? "text-primary border-white bg-white"
                : "hover:border-primary-500 hover:text-primary-500 border-border bg-secondary text-ink-primary"
            }`}
            onClick={toggleAxes}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle axes"
          >
            <ion-icon name="expand-outline" class="rotate-45 text-xl" />
          </motion.button>

          <motion.button
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-200 ${
              showDimensions
                ? "text-primary border-white bg-white"
                : "hover:border-primary-500 hover:text-primary-500 border-border bg-secondary text-ink-primary"
            }`}
            onClick={toggleDimensions}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle dimensions"
          >
            <ion-icon name="resize-outline" class="text-xl" />
          </motion.button>
        </div>

        <Canvas shadows className="h-full w-full">
          <PerspectiveCamera
            makeDefault
            position={[cameraDistance, cameraDistance * 0.9, cameraDistance]}
            fov={45}
            near={0.1}
            far={10000}
          />

          <color attach="background" args={["#0d0d0f"]} />
          <fog
            attach="fog"
            args={["#0d0d0f", cameraDistance * 3, cameraDistance * 8]}
          />

          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={100}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <directionalLight
            position={[-10, 10, -10]}
            intensity={0.5}
            color="#4a9eff"
          />
          <pointLight position={[0, -20, 0]} intensity={0.3} color="#ffa726" />

          <Suspense fallback={<LoadingSpinner />}>
            <GearMesh ref={ref} params={params} autoRotate={autoRotate} />
            <DimensionLines params={params} visible={showDimensions} />
            <Environment preset="city" />
          </Suspense>

          {showGrid && (
            <Grid
              position={[0, -0.1, 0]}
              args={[gridSize, gridSize]}
              cellSize={cellSize}
              cellThickness={0.75}
              cellColor="#3d2a1a"
              sectionSize={cellSize * 5}
              sectionThickness={1.25}
              sectionColor="#5c3d22"
              fadeDistance={gridSize}
              fadeStrength={1}
              followCamera={false}
            />
          )}

          {showAxes && <axesHelper args={[pitchRadius * 2]} />}

          <OrbitControls
            makeDefault
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={1500}
            target={[0, params.thickness / 2, 0]}
          />
        </Canvas>

        {/* Info cards - hidden on mobile to avoid tab bar overlap */}
        <div className="absolute bottom-4 left-4 z-10 hidden gap-3 md:flex">
          <div className="border-border bg-secondary/90 rounded-lg border px-4 py-2 backdrop-blur-sm">
            <span className="text-ink-muted block font-mono text-xs">
              Teeth
            </span>
            <span className="font-mono text-lg font-bold">
              {params.teethCount}
            </span>
          </div>
          <div className="border-border bg-secondary/90 rounded-lg border px-4 py-2 backdrop-blur-sm">
            <span className="text-ink-muted block font-mono text-xs">
              Module
            </span>
            <span className="font-mono text-lg font-bold">
              {params.module}mm
            </span>
          </div>
          <div className="border-border bg-secondary/90 rounded-lg border px-4 py-2 backdrop-blur-sm">
            <span className="text-ink-muted block font-mono text-xs">
              Pressure Angle
            </span>
            <span className="font-mono text-lg font-bold">
              {params.pressureAngle}°
            </span>
          </div>
          <div className="border-border bg-secondary/90 rounded-lg border px-4 py-2 backdrop-blur-sm">
            <span className="text-ink-muted block font-mono text-xs">
              Pitch Diameter
            </span>
            <span className="font-mono text-lg font-bold">
              {(params.module * params.teethCount).toFixed(1)}mm
            </span>
          </div>
        </div>
      </div>
    );
  }
);
