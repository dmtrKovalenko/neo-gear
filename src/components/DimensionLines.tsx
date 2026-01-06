import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import type { GearParameters } from "../types/gear.types";
import { calculateGearGeometryValues } from "../utils/gearGenerator";

const LINE_THIKNESS = 2;

interface DimensionLinesProps {
  params: GearParameters;
  visible?: boolean;
}

interface DimensionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: number;
  color?: string;
  extensionOffset?: number;
}

const createThickLine = (
  geometry: THREE.BufferGeometry,
  thickness: number,
  lineColor: string,
  opacity: number
) => {
  const positions = geometry.attributes.position;
  const points: number[] = [];

  for (let i = 0; i < positions.count; i++) {
    points.push(positions.getX(i), positions.getY(i), positions.getZ(i));
  }

  const lineGeometry = new LineGeometry();
  lineGeometry.setPositions(points);

  const lineMaterial = new LineMaterial({
    color: new THREE.Color(lineColor),
    linewidth: thickness,
    transparent: true,
    opacity: opacity,
    depthTest: false,
  });

  lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

  return new Line2(lineGeometry, lineMaterial);
};

function DimensionLine({
  start,
  end,
  label,
  offset = 0,
  color = "#00ff88",
  extensionOffset = 3,
}: DimensionLineProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { camera } = useThree();

  const midpoint = useMemo(() => {
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ] as [number, number, number];
  }, [start, end]);

  // Rotate group to face camera (Y-axis only, like compass needle)
  // and control visibility based on camera angle
  useFrame(() => {
    if (groupRef.current) {
      const groupPosition = new THREE.Vector3(
        midpoint[0],
        midpoint[1],
        midpoint[2]
      );
      const cameraPosition = camera.position.clone();

      const dx = cameraPosition.x - groupPosition.x;
      const dy = cameraPosition.y - groupPosition.y;
      const dz = cameraPosition.z - groupPosition.z;
      const totalDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const angleFromHorizontal =
        Math.abs(Math.asin(dy / totalDistance)) * (180 / Math.PI);

      // Fade out when camera is close to directly above (angle > 75 degrees)
      if (angleFromHorizontal > 75) {
        groupRef.current.visible = false;
        setIsVisible(false);
      } else {
        groupRef.current.visible = true;
        setIsVisible(true);
        // Project to XZ plane for Y-axis only rotation
        cameraPosition.y = groupPosition.y;
        groupRef.current.lookAt(cameraPosition);
      }
    }
  });

  const scaledExtension = extensionOffset;

  const lines = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(endVec, startVec);
    const dirNormalized = dir.clone().normalize();

    let perpendicular: THREE.Vector3;
    if (Math.abs(dirNormalized.y) < 0.1) {
      // Horizontal line - extend perpendicular upward
      perpendicular = new THREE.Vector3(0, scaledExtension, 0);
    } else {
      if (
        Math.abs(dirNormalized.x) < 0.01 &&
        Math.abs(dirNormalized.z) < 0.01
      ) {
        perpendicular = new THREE.Vector3(scaledExtension, 0, 0);
      } else {
        const horizontal = new THREE.Vector3(
          dirNormalized.z,
          0,
          -dirNormalized.x
        ).normalize();
        perpendicular = horizontal.multiplyScalar(scaledExtension);
      }
    }

    const startOffset = startVec.clone().add(perpendicular);
    const endOffset = endVec.clone().add(perpendicular);
    const extensionStart = new THREE.BufferGeometry().setFromPoints([
      startVec,
      startOffset,
    ]);
    const mainLine = new THREE.BufferGeometry().setFromPoints([
      startOffset,
      endOffset,
    ]);
    const extensionEnd = new THREE.BufferGeometry().setFromPoints([
      endVec,
      endOffset,
    ]);

    return {
      extensionStart,
      mainLine,
      extensionEnd,
      labelPosition: midpoint[1] + offset,
      startOffset,
      endOffset,
    };
  }, [start, end, scaledExtension, midpoint, offset]);

  return (
    <group ref={groupRef}>
      <primitive
        object={createThickLine(
          lines.extensionStart,
          LINE_THIKNESS,
          color,
          0.85
        )}
      />

      {/* Main dimension line - thicker */}
      <primitive
        object={createThickLine(
          lines.mainLine,
          LINE_THIKNESS * 1.5,
          color,
          0.95
        )}
      />

      {/* Extension line from end point to dimension line */}
      <primitive
        object={createThickLine(lines.extensionEnd, LINE_THIKNESS, color, 0.85)}
      />

      {/* Label - on the line, rotates with the group */}
      {isVisible && (
        <Html
          position={[
            (lines.startOffset.x + lines.endOffset.x) / 2,
            (lines.startOffset.y + lines.endOffset.y) / 2,
            (lines.startOffset.z + lines.endOffset.z) / 2,
          ]}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="pointer-events-none select-none"
            style={{
              padding: "6px 12px",
              background: "rgba(0,0,0,0.85)",
              border: `2px solid ${color}`,
              borderRadius: "4px",
              color: color,
              fontSize: "16px",
              fontWeight: "600",
              fontFamily: "monospace",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

export function DimensionLines({
  params,
  visible = true,
}: DimensionLinesProps) {
  if (!visible) return null;

  const geo = calculateGearGeometryValues(params);
  const {
    outerRadius,
    rootRadius,
    outerDiameter,
    rootDiameter,
    boreRadius,
    thickness,
  } = geo;

  // the gear lies flat on XZ plane (Y is up), so diameter measurements are in X direction
  const yPosition = thickness;
  const labelOffset = 3;

  // Scale extension heights as a small percentage of outer diameter
  const extensionBase = outerDiameter * 0.18; // 18% of outer diameter
  const outerExtension = extensionBase * 1.3; // Higher to avoid overlapping root diameter label
  const rootExtension = extensionBase * 0.9;
  const boreExtension = extensionBase * 0.5;
  const thicknessExtension = extensionBase * 0.4; // Shorter horizontal extension for vertical ruler

  return (
    <group>
      <DimensionLine
        start={[-outerRadius, yPosition, 2]}
        end={[outerRadius, yPosition, 2]}
        label={`Outer: ${outerDiameter.toFixed(1)}mm`}
        offset={labelOffset}
        color="#4a9eff"
        extensionOffset={outerExtension}
      />

      <DimensionLine
        start={[-rootRadius, yPosition, 1]}
        end={[rootRadius, yPosition, 1]}
        label={`Root: ${rootDiameter.toFixed(1)}mm`}
        offset={labelOffset}
        color="#00ff88"
        extensionOffset={rootExtension}
      />

      {params.boreDiameter > 0 && (
        <DimensionLine
          start={[-boreRadius, yPosition, 0]}
          end={[boreRadius, yPosition, 0]}
          label={`Bore: ${params.boreDiameter.toFixed(1)}mm`}
          offset={labelOffset}
          color="#ff6b9d"
          extensionOffset={boreExtension}
        />
      )}

      <DimensionLine
        start={[outerRadius + 1.5, 0, 0]}
        end={[outerRadius + 1.5, thickness, 0]}
        label={`T: ${thickness.toFixed(1)}mm`}
        offset={labelOffset}
        color="#ffa726"
        extensionOffset={thicknessExtension}
      />
    </group>
  );
}
