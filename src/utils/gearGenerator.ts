import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type { GearParameters } from "../types/gear.types";

/**
 * Calculate involute function: inv(α) = tan(α) - α
 */
function involute(alpha: number): number {
  return Math.tan(alpha) - alpha;
}

/**
 * Calculate angle at given radius for involute curve
 * Returns the involute offset from base position
 */
function involuteAtRadius(
  baseRadius: number,
  r: number,
  pitchRadius: number
): number {
  if (r <= baseRadius) return 0;

  const alphaAtR = Math.acos(Math.min(baseRadius / r, 1));
  const alphaAtPitch = Math.acos(Math.min(baseRadius / pitchRadius, 1));

  // Offset relative to pitch circle position
  return involute(alphaAtR) - involute(alphaAtPitch);
}

/**
 * Generate a proper spur gear profile
 */
function createGearShape(params: GearParameters): THREE.Shape {
  const { teethCount, module: m, backlash, profileShift } = params;

  // Get geometry values from single source of truth
  const geo = calculateGearGeometryValues(params);
  const { pitchRadius, baseRadius, outerRadius, rootRadius, pressureAngle } =
    geo;

  // Angular pitch (angle between teeth)
  const angularPitch = (2 * Math.PI) / teethCount;

  // Tooth thickness at pitch circle (half the circular pitch minus backlash)
  // Profile shift increases tooth thickness: thickness = (π/2 + 2×x×tan(α)) × m
  // where x is profile shift coefficient and α is pressure angle
  const baseToothThickness = (Math.PI * m) / 2 - backlash;
  const profileShiftThicknessIncrease =
    2 * profileShift * m * Math.tan(pressureAngle);
  const toothThicknessAtPitch =
    baseToothThickness + profileShiftThicknessIncrease;
  const halfToothAngleAtPitch = toothThicknessAtPitch / (2 * pitchRadius);

  const shape = new THREE.Shape();
  const points: { x: number; y: number }[] = [];

  // For each tooth, we generate a complete tooth profile
  for (let i = 0; i < teethCount; i++) {
    // Angle to center of this tooth
    const toothCenterAngle = i * angularPitch;

    // Calculate involute offsets at key radii
    const invOffsetAtRoot = involuteAtRadius(
      baseRadius,
      rootRadius,
      pitchRadius
    );
    const invOffsetAtOuter = involuteAtRadius(
      baseRadius,
      outerRadius,
      pitchRadius
    );

    // === Calculate actual angular positions for this tooth ===
    // Involute curves TOWARD tooth center as radius increases (tooth gets narrower at tip)
    // Left flank: angle INCREASES (clockwise toward center) as we go outward
    // Right flank: angle DECREASES (counter-clockwise toward center) as we go outward

    // Left flank at root (where tooth starts) - wider here
    const leftFlankRootAngle =
      toothCenterAngle - halfToothAngleAtPitch + invOffsetAtRoot;

    // Left flank at tip - narrower here
    const leftFlankTipAngle =
      toothCenterAngle - halfToothAngleAtPitch + invOffsetAtOuter;
    // Right flank at tip - narrower here
    const rightFlankTipAngle =
      toothCenterAngle + halfToothAngleAtPitch - invOffsetAtOuter;

    // Previous tooth's right flank at root (for the gap arc)
    const prevToothRightAngle =
      toothCenterAngle - angularPitch + halfToothAngleAtPitch - invOffsetAtRoot;

    // === ROOT ARC (gap between teeth) ===
    // Smooth arc from previous tooth's right flank to this tooth's left flank
    const rootSteps = 8;
    for (let j = 0; j <= rootSteps; j++) {
      const t = j / rootSteps;
      const angle =
        prevToothRightAngle + t * (leftFlankRootAngle - prevToothRightAngle);
      points.push({
        x: rootRadius * Math.cos(angle),
        y: rootRadius * Math.sin(angle),
      });
    }

    // === LEFT FLANK (rises from root to tip) ===
    const flankSteps = 16;
    for (let j = 1; j <= flankSteps; j++) {
      const t = j / flankSteps;
      const r = rootRadius + t * (outerRadius - rootRadius);
      const invOffset = involuteAtRadius(baseRadius, r, pitchRadius);

      // Left flank: angle increases (curves clockwise toward tooth center) as we go up
      const angle = toothCenterAngle - halfToothAngleAtPitch + invOffset;

      points.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
      });
    }

    // === TIP LAND ===
    // Only add tip points if there's meaningful tip width
    const tipWidth = rightFlankTipAngle - leftFlankTipAngle;
    if (tipWidth > 0.001) {
      const tipSteps = 4;
      for (let j = 1; j < tipSteps; j++) {
        const t = j / tipSteps;
        const angle = leftFlankTipAngle + t * tipWidth;
        points.push({
          x: outerRadius * Math.cos(angle),
          y: outerRadius * Math.sin(angle),
        });
      }
    }

    // === RIGHT FLANK (descends from tip to root) ===
    for (let j = flankSteps; j >= 1; j--) {
      const t = j / flankSteps;
      const r = rootRadius + t * (outerRadius - rootRadius);
      const invOffset = involuteAtRadius(baseRadius, r, pitchRadius);

      // Right flank: angle decreases (curves counter-clockwise toward tooth center) as we go up
      const angle = toothCenterAngle + halfToothAngleAtPitch - invOffset;

      points.push({
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
      });
    }
  }

  if (points.length > 0) {
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
  }

  // Note: Hole will be added later using CSG subtraction after helix twist
  return shape;
}

/**
 * Create D-shaft 2D profile shape
 */
function createDShaftShape(
  radius: number,
  flatRatio = 0.15
): THREE.Shape {
  const shape = new THREE.Shape();

  // Flat position from center (how far into the circle the flat cuts)
  const flatDistance = radius * (1 - flatRatio);

  // Calculate half-width of the flat chord using Pythagorean theorem
  const halfWidth = Math.sqrt(radius * radius - flatDistance * flatDistance);

  const startAngle = Math.atan2(flatDistance, -halfWidth);
  const endAngle = Math.atan2(flatDistance, halfWidth);

  shape.moveTo(-halfWidth, flatDistance);

  // Draw the circular arc (going the long way around, counterclockwise)
  // We need to go from startAngle to endAngle the long way (add 2π to endAngle)
  shape.absarc(0, 0, radius, startAngle, endAngle + 2 * Math.PI, false);

  shape.lineTo(-halfWidth, flatDistance);

  return shape;
}

/**
 * Create main hole geometry for CSG subtraction
 */
function createMainHoleGeometry(params: GearParameters): THREE.BufferGeometry {
  const radius = params.boreDiameter / 2;
  const height = params.thickness + 2; // Make it slightly longer to ensure clean subtraction
  const segments = 64;

  let geometry: THREE.BufferGeometry;

  switch (params.holeType) {
    case "round":
    case "keyed":
      geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, 0, height / 2 - 1);
      break;

    case "d-shaft": {
      const dShape = createDShaftShape(radius, params.dShaftFlatDepth);
      const extrudeSettings = {
        depth: height,
        bevelEnabled: false,
      };
      geometry = new THREE.ExtrudeGeometry(dShape, extrudeSettings);
      geometry.translate(0, 0, -1);
      break;
    }

    case "hex": {
      const hexRadius = radius * 0.95;
      geometry = new THREE.CylinderGeometry(hexRadius, hexRadius, height, 6);
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, 0, height / 2 - 1);
      break;
    }

    case "square": {
      const sideLength = radius * 1.4;
      geometry = new THREE.CylinderGeometry(
        sideLength / Math.sqrt(2),
        sideLength / Math.sqrt(2),
        height,
        4
      );
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, 0, height / 2 - 1);
      break;
    }

    default:
      geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, 0, height / 2 - 1);
  }

  return geometry;
}

/**
 * Create keyway geometry for CSG subtraction
 * Uses standard proportions: width = d/4, depth = width/2
 */
function createKeywayGeometry(params: GearParameters): THREE.BufferGeometry {
  const diameter = params.boreDiameter;
  const radius = diameter / 2;
  const height = params.thickness + 2;

  // Standard keyway proportions (ISO 773, DIN 6885, ANSI B17.1)
  // If user hasn't set custom values, use standards
  const keyWidth = params.keyWidth > 0 ? params.keyWidth : diameter / 4;

  // Depth: Use absolute value if set (> 0), otherwise calculate from ratio
  const keyDepth =
    params.keyDepth > 0 ? params.keyDepth : keyWidth * params.keyDepthRatio;

  // Make the box extend from well inside the hole to beyond the outer edge
  // This ensures it connects to the hole and extends outward
  const boxDepth = keyDepth + radius; // Long enough to cut from center through wall
  const geometry = new THREE.BoxGeometry(keyWidth, boxDepth, height);

  // Position the box so:
  // - Its bottom edge is well inside the hole (at Y = 0 or negative)
  // - It crosses the hole edge at Y = radius
  // - It extends keyDepth beyond the hole edge
  //
  // We want the outer edge of the box at Y = radius + keyDepth
  // Box height is (keyDepth + radius)
  // So box center should be at: (radius + keyDepth) - (boxDepth / 2)
  // Simplifying: (radius + keyDepth) - (keyDepth + radius) / 2 = (radius + keyDepth) / 2
  const keyCenterY = (radius + keyDepth) / 2;

  geometry.translate(0, keyCenterY, height / 2 - 1);

  return geometry;
}

/**
 * Generate gear as THREE.BufferGeometry
 */
export function generateGearGeometry(
  params: GearParameters
): THREE.BufferGeometry {
  const shape = createGearShape(params);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: params.thickness,
    bevelEnabled: false,
    steps: params.helixAngle !== 0 ? Math.ceil(params.thickness * 2) : 1,
  };

  let geometry: THREE.BufferGeometry = new THREE.ExtrudeGeometry(
    shape,
    extrudeSettings
  );
  // Position gear to lie flat on ground plane (z=0 at bottom)
  // ExtrudeGeometry extrudes in +Z, so no translation needed for ground placement

  if (params.helixAngle !== 0) {
    const positionAttr = geometry.getAttribute("position");
    const positions = positionAttr.array as Float32Array;
    const twistPerUnit = (params.helixAngle * Math.PI) / 180 / params.thickness;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const twist = z * twistPerUnit; // z goes from 0 to thickness
      positions[i] = x * Math.cos(twist) - y * Math.sin(twist);
      positions[i + 1] = x * Math.sin(twist) + y * Math.cos(twist);
    }
    positionAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  if (params.holeType !== "none" && params.boreDiameter > 0) {
    const pitchRadius = (params.module * params.teethCount) / 2;
    const rootRadius = Math.max(
      pitchRadius - (1.25 + params.clearance) * params.module,
      params.module * 0.5
    );

    if (params.boreDiameter < rootRadius * 1.9) {
      const evaluator = new Evaluator();
      let gearBrush = new Brush(geometry);
      gearBrush.updateMatrixWorld();

      const holeGeometry = createMainHoleGeometry(params);
      const holeBrush = new Brush(holeGeometry);
      holeBrush.updateMatrixWorld();

      let result = evaluator.evaluate(gearBrush, holeBrush, SUBTRACTION);
      geometry = result.geometry;
      holeGeometry.dispose();

      if (params.holeType === "keyed") {
        const keyGeometry = createKeywayGeometry(params);
        gearBrush = new Brush(geometry);
        gearBrush.updateMatrixWorld();

        const keyBrush = new Brush(keyGeometry);
        keyBrush.updateMatrixWorld();

        result = evaluator.evaluate(gearBrush, keyBrush, SUBTRACTION);
        geometry = result.geometry;
        keyGeometry.dispose();
      }
    }
  }

  return geometry;
}

/**
 * Calculate raw gear dimensions (single source of truth for all gear calculations)
 */
export function calculateGearGeometryValues(params: GearParameters) {
  const {
    teethCount,
    module: m,
    pressureAngle: pressureAngleDeg,
    clearance,
    profileShift,
    boreDiameter,
    thickness,
  } = params;

  const pressureAngle = (pressureAngleDeg * Math.PI) / 180;
  const pitchRadius = (m * teethCount) / 2;
  const pitchDiameter = m * teethCount;
  const baseRadius = pitchRadius * Math.cos(pressureAngle);
  const baseDiameter = baseRadius * 2;
  const addendum = m * (1 + profileShift);
  const dedendum = m * (1.25 + clearance - profileShift);
  const outerRadius = pitchRadius + addendum;
  const outerDiameter = outerRadius * 2;
  const rootRadius = Math.max(pitchRadius - dedendum, baseRadius * 0.95);
  const rootDiameter = rootRadius * 2;
  const toothHeight = addendum + dedendum;
  const circularPitch = Math.PI * m;
  const boreRadius = boreDiameter / 2;

  return {
    // Radii (for geometry calculations)
    pitchRadius,
    baseRadius,
    outerRadius,
    rootRadius,
    boreRadius,

    // Diameters (for display)
    pitchDiameter,
    baseDiameter,
    outerDiameter,
    rootDiameter,

    // Tooth geometry
    addendum,
    dedendum,
    toothHeight,
    circularPitch,

    // Other
    pressureAngle,
    thickness,
  };
}

/**
 * Calculate gear dimensions for display (formatted strings)
 */
export function calculateGearDimensions(params: GearParameters) {
  const values = calculateGearGeometryValues(params);

  return {
    pitchDiameter: values.pitchDiameter.toFixed(2),
    baseDiameter: values.baseDiameter.toFixed(2),
    outerDiameter: values.outerDiameter.toFixed(2),
    rootDiameter: Math.max(values.rootDiameter, 0).toFixed(2),
    toothHeight: values.toothHeight.toFixed(2),
    circularPitch: values.circularPitch.toFixed(2),
  };
}
