import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import type { GearParameters } from "../types/gear.types";
import { calculateGearGeometryValues } from "../utils/gearGenerator";

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

      // Calculate horizontal distance from camera to group
      const dx = cameraPosition.x - groupPosition.x;
      const dz = cameraPosition.z - groupPosition.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

      // Fade out when camera is close to directly above
      if (horizontalDistance < 5) {
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

  // Use fixed extension offset for constant visual height (not scaled with gear size)
  const scaledExtension = extensionOffset;

  // Calculate lines to create a rectangular frame around the measurement
  const lines = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(endVec, startVec);
    const dirNormalized = dir.clone().normalize();

    // Determine the perpendicular direction based on the measurement direction
    let perpendicular: THREE.Vector3;

    // For horizontal measurements (in XZ plane), extend upward in Y
    if (Math.abs(dirNormalized.y) < 0.1) {
      // Horizontal line - extend perpendicular upward
      perpendicular = new THREE.Vector3(0, scaledExtension, 0);
    } else {
      // Vertical line - extend perpendicular outward in XZ plane
      const horizontal = new THREE.Vector3(
        dirNormalized.z,
        0,
        -dirNormalized.x
      ).normalize();
      perpendicular = horizontal.multiplyScalar(scaledExtension);
    }

    // Create offset points for the dimension line (elevated from the actual geometry)
    const startOffset = startVec.clone().add(perpendicular);
    const endOffset = endVec.clone().add(perpendicular);

    // Create the rectangular frame:
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

  // Fixed line thickness for consistent visual appearance
  const lineThickness = 2;

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

    // Resolution needs to be set for Line2
    lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

    return new Line2(lineGeometry, lineMaterial);
  };

  return (
    <group ref={groupRef}>
      {/* Extension line from start point to dimension line */}
      <primitive
        object={createThickLine(
          lines.extensionStart,
          lineThickness,
          color,
          0.85
        )}
      />

      {/* Main dimension line - thicker */}
      <primitive
        object={createThickLine(
          lines.mainLine,
          lineThickness * 1.5,
          color,
          0.95
        )}
      />

      {/* Extension line from end point to dimension line */}
      <primitive
        object={createThickLine(lines.extensionEnd, lineThickness, color, 0.85)}
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

  // The gear lies flat on XZ plane (Y is up), so diameter measurements are in X direction
  // Position dimensions at the top face of the gear
  const yPosition = thickness;
  const labelOffset = 3;

  // Scale extension heights as a small percentage of outer diameter
  // This keeps them visually proportional regardless of gear size
  const extensionBase = outerDiameter * 0.18; // 18% of outer diameter
  const outerExtension = extensionBase * 1.2; // Higher to avoid overlapping root diameter label
  const rootExtension = extensionBase * 0.8;
  const boreExtension = extensionBase * 0.5;
  const thicknessExtension = extensionBase;

  return (
    <group>
      {/* Outer Diameter - through the center with small Z offset for separation */}
      <DimensionLine
        start={[-outerRadius, yPosition, 2]}
        end={[outerRadius, yPosition, 2]}
        label={`Outer: ${outerDiameter.toFixed(1)}mm`}
        offset={labelOffset}
        color="#4a9eff"
        extensionOffset={outerExtension}
      />

      {/* Root Diameter - through the center with small Z offset */}
      <DimensionLine
        start={[-rootRadius, yPosition, 1]}
        end={[rootRadius, yPosition, 1]}
        label={`Root: ${rootDiameter.toFixed(1)}mm`}
        offset={labelOffset}
        color="#00ff88"
        extensionOffset={rootExtension}
      />

      {/* Bore Diameter - through the center */}
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

      {/* Thickness - vertical line on the side */}
      <DimensionLine
        start={[outerRadius + extensionBase, 0, 0]}
        end={[outerRadius + extensionBase, thickness, 0]}
        label={`T: ${thickness.toFixed(1)}mm`}
        offset={labelOffset}
        color="#ffa726"
        extensionOffset={thicknessExtension}
      />
    </group>
  );
}
