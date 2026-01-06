import {
  useRef,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateGearGeometry } from "../utils/gearGenerator";
import type { GearParameters } from "../types/gear.types";

interface GearMeshProps {
  params: GearParameters;
  autoRotate?: boolean;
}

export const GearMesh = forwardRef<THREE.Mesh, GearMeshProps>(function GearMesh(
  { params, autoRotate = true },
  ref
) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const previousGeometry = useRef<THREE.BufferGeometry | null>(null);

  useImperativeHandle(ref, () => meshRef.current);

  const geometry = useMemo(() => {
    try {
      return generateGearGeometry(params);
    } catch (error) {
      console.error("Error generating gear:", error);
      // Return a simple cylinder as fallback
      return new THREE.CylinderGeometry(
        (params.module * params.teethCount) / 2,
        (params.module * params.teethCount) / 2,
        params.thickness,
        64
      );
    }
  }, [params]);

  // Cleanup previous geometry to prevent memory leaks
  useEffect(() => {
    if (previousGeometry.current && previousGeometry.current !== geometry) {
      previousGeometry.current.dispose();
    }
    previousGeometry.current = geometry;

    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  useEffect(() => {
    if (meshRef.current) {
      // Rotate gear to lie flat (from XY plane to XZ plane)
      meshRef.current.rotation.x = -Math.PI / 2;
    }
  }, []);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.z += delta * 0.3;
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8a9eb0"),
        metalness: 0.85,
        roughness: 0.25,
        envMapIntensity: 1.2,
      }),
    []
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
    />
  );
});
