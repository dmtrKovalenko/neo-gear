import type * as THREE from "three";
import { to3dmodelSimple, fileForContentTypes } from "@jscadui/3mf-export";
import { zipSync, strToU8 } from "fflate";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import type { GearParameters } from "../types/gear.types";
import type { STLFormat, VoxelQuality } from "../types/export.types";
import { trackEvent } from "./analytics";

// Voxel quality to multiplier mapping (lower = coarser, higher = finer)
const VOXEL_QUALITY_MULTIPLIERS: Record<VoxelQuality, number> = {
  low: 0.1, // Coarsest, fastest
  medium: 0.075, // Balanced
  ultra: 0.05, // Finest detail (original default), slowest
};

/**
 * Write binary STL directly from vertices and indices (no THREE.js)
 */
function createBinarySTL(
  vertices: Float32Array,
  indices: Uint32Array
): ArrayBuffer {
  const triangleCount = indices.length / 3;

  // STL binary format:
  // - 80 byte header
  // - 4 byte triangle count (uint32)
  // - For each triangle (50 bytes):
  //   - 12 bytes: normal vector (3 floats)
  //   - 12 bytes: vertex 1 (3 floats)
  //   - 12 bytes: vertex 2 (3 floats)
  //   - 12 bytes: vertex 3 (3 floats)
  //   - 2 bytes: attribute byte count (uint16, usually 0)
  const bufferSize = 80 + 4 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const header = "Binary STL created by Gear FTL Generator with MeshLib repair";
  const headerBytes = new TextEncoder().encode(header);
  for (let i = 0; i < Math.min(80, headerBytes.length); i++) {
    view.setUint8(i, headerBytes[i]);
  }

  view.setUint32(80, triangleCount, true);

  let offset = 84;

  for (let i = 0; i < triangleCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0x = vertices[i0 * 3];
    const v0y = vertices[i0 * 3 + 1];
    const v0z = vertices[i0 * 3 + 2];

    const v1x = vertices[i1 * 3];
    const v1y = vertices[i1 * 3 + 1];
    const v1z = vertices[i1 * 3 + 2];

    const v2x = vertices[i2 * 3];
    const v2y = vertices[i2 * 3 + 1];
    const v2z = vertices[i2 * 3 + 2];

    // Calculate normal using cross product
    const edge1x = v1x - v0x;
    const edge1y = v1y - v0y;
    const edge1z = v1z - v0z;

    const edge2x = v2x - v0x;
    const edge2y = v2y - v0y;
    const edge2z = v2z - v0z;

    let nx = edge1y * edge2z - edge1z * edge2y;
    let ny = edge1z * edge2x - edge1x * edge2z;
    let nz = edge1x * edge2y - edge1y * edge2x;

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length > 0) {
      nx /= length;
      ny /= length;
      nz /= length;
    }

    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;

    view.setFloat32(offset, v0x, true);
    view.setFloat32(offset + 4, v0y, true);
    view.setFloat32(offset + 8, v0z, true);
    offset += 12;

    view.setFloat32(offset, v1x, true);
    view.setFloat32(offset + 4, v1y, true);
    view.setFloat32(offset + 8, v1z, true);
    offset += 12;

    view.setFloat32(offset, v2x, true);
    view.setFloat32(offset + 4, v2y, true);
    view.setFloat32(offset + 8, v2z, true);
    offset += 12;

    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Write ASCII STL from vertices and indices
 */
function createASCIISTL(
  vertices: Float32Array,
  indices: Uint32Array,
  modelName = "model"
): string {
  const triangleCount = indices.length / 3;
  let stl = `solid ${modelName}\n`;

  for (let i = 0; i < triangleCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0x = vertices[i0 * 3];
    const v0y = vertices[i0 * 3 + 1];
    const v0z = vertices[i0 * 3 + 2];

    const v1x = vertices[i1 * 3];
    const v1y = vertices[i1 * 3 + 1];
    const v1z = vertices[i1 * 3 + 2];

    const v2x = vertices[i2 * 3];
    const v2y = vertices[i2 * 3 + 1];
    const v2z = vertices[i2 * 3 + 2];

    const edge1x = v1x - v0x;
    const edge1y = v1y - v0y;
    const edge1z = v1z - v0z;

    const edge2x = v2x - v0x;
    const edge2y = v2y - v0y;
    const edge2z = v2z - v0z;

    let nx = edge1y * edge2z - edge1z * edge2y;
    let ny = edge1z * edge2x - edge1x * edge2z;
    let nz = edge1x * edge2y - edge1y * edge2x;

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (length > 0) {
      nx /= length;
      ny /= length;
      nz /= length;
    }

    stl += `  facet normal ${nx.toExponential(6)} ${ny.toExponential(6)} ${nz.toExponential(6)}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v0x.toExponential(6)} ${v0y.toExponential(6)} ${v0z.toExponential(6)}\n`;
    stl += `      vertex ${v1x.toExponential(6)} ${v1y.toExponential(6)} ${v1z.toExponential(6)}\n`;
    stl += `      vertex ${v2x.toExponential(6)} ${v2y.toExponential(6)} ${v2z.toExponential(6)}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }

  stl += `endsolid ${modelName}\n`;
  return stl;
}

export function exportToSTLFast(
  mesh: THREE.Mesh,
  params: GearParameters,
  stlFormat: STLFormat = "binary"
): { blob: Blob; filename: string } {
  console.log(
    `=== Fast STL Export (No Repair, ${stlFormat.toUpperCase()}) ===`
  );

  const exporter = new STLExporter();
  const stlData = exporter.parse(mesh, { binary: stlFormat === "binary" });

  const pitchDiameter = (params.module * params.teethCount).toFixed(1);
  const formatSuffix = stlFormat === "ascii" ? "_ascii" : "";
  const filename = `gear_t${params.teethCount}_m${params.module}_d${pitchDiameter}mm_fast${formatSuffix}.stl`;

  const blob = new Blob([stlData], { type: "application/sla" });

  console.log(`✓ Fast ${stlFormat.toUpperCase()} STL export complete!`);
  trackEvent("stl_export", { props: { format: stlFormat, quality: "fast" } });
  return { blob, filename };
}

export function exportTo3MFFast(
  mesh: THREE.Mesh,
  params: GearParameters
): { blob: Blob; filename: string } {
  console.log("=== Fast 3MF Export (No Repair) ===");

  const position = mesh.geometry.getAttribute("position");
  let index = mesh.geometry.getIndex();

  if (!position) {
    console.error("Geometry missing position attribute");
    throw new Error("Failed to export: Invalid geometry");
  }

  if (!index) {
    console.log("Creating index for non-indexed geometry...");
    const indices = [];
    for (let i = 0; i < position.count; i++) {
      indices.push(i);
    }
    mesh.geometry.setIndex(indices);
    index = mesh.geometry.getIndex();
  }

  if (!index) {
    console.error("Failed to create index");
    throw new Error("Failed to export: Could not create index");
  }

  const vertices = new Float32Array(position.array);
  const indices = new Uint32Array(index.array);

  console.log("Fast export data:", {
    vertices: vertices.length / 3,
    triangles: indices.length / 3,
  });

  const pitchDiameter = (params.module * params.teethCount).toFixed(1);
  const modelName = `Gear_T${params.teethCount}_M${params.module}_D${pitchDiameter}`;

  const mesh3mf = [
    {
      id: "1",
      name: modelName,
      vertices,
      indices,
      transform: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Identity matrix (3x4)
    },
  ];

  const header = {
    title: modelName,
    designer: "Gear FTL Generator",
    description: `Gear: ${params.teethCount} teeth, ${params.module}mm module, ${pitchDiameter}mm pitch diameter (Fast Export)`,
    copyright: "© " + new Date().getFullYear(),
    licenseTerms: "",
    rating: "",
  };

  console.log("Generating 3MF model XML...");
  const modelXml = to3dmodelSimple(mesh3mf, header, 6);

  console.log("Creating 3MF package structure...");
  const files = {
    "[Content_Types].xml": strToU8(fileForContentTypes.content),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`),
    "3D/3dmodel.model": strToU8(modelXml),
  };

  console.log("Compressing to ZIP...");
  const zipData = zipSync(files, { level: 6 });

  console.log("Creating 3MF blob...");
  const filename = `gear_t${params.teethCount}_m${params.module}_d${pitchDiameter}mm_fast.3mf`;
  const blob = new Blob([zipData], {
    type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
  });

  console.log("✓ Fast 3MF export complete!");
  return { blob, filename };
}

async function repairMeshWithWorker(
  geometry: THREE.BufferGeometry,
  voxelQuality: VoxelQuality = "ultra",
  onProgress?: (stage: string, progress: number) => void
): Promise<{ vertices: Float32Array; indices: Uint32Array }> {
  const position = geometry.getAttribute("position");
  let index = geometry.getIndex();

  if (!position) {
    throw new Error("Geometry missing position attribute");
  }

  if (!index) {
    const indices = [];
    for (let i = 0; i < position.count; i++) {
      indices.push(i);
    }
    geometry.setIndex(indices);
    index = geometry.getIndex();
  }

  if (!index) {
    throw new Error("Failed to create index for geometry");
  }

  const vertices = new Float32Array(position.array);
  const indices = new Uint32Array(index.array);

  const worker = new Worker(
    new URL("../workers/meshlib.worker.ts", import.meta.url),
    { type: "module" }
  );

  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const {
        type,
        stage,
        progress,
        vertices: resultVertices,
        indices: resultIndices,
        message,
      } = event.data;

      if (type === "progress") {
        onProgress?.(stage, progress);
      } else if (type === "complete") {
        worker.terminate();
        resolve({
          vertices: resultVertices,
          indices: resultIndices,
        });
      } else if (type === "error") {
        worker.terminate();
        reject(new Error(message));
      } else if (type === "log") {
        console.log(`[Worker] ${message}`);
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(error.message || "Worker error"));
    };

    // Send geometry data to worker (transfer ownership for efficiency)
    const voxelMultiplier = VOXEL_QUALITY_MULTIPLIERS[voxelQuality];
    worker.postMessage(
      {
        type: "repair",
        vertices,
        indices,
        voxelMultiplier,
      },
      { transfer: [vertices.buffer, indices.buffer] }
    );
  });
}

export async function exportToSTLWithRepair(
  mesh: THREE.Mesh,
  params: GearParameters,
  stlFormat: STLFormat = "binary",
  voxelQuality: VoxelQuality = "ultra",
  onProgress?: (stage: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  console.log(
    `=== Exporting ${stlFormat.toUpperCase()} STL with MeshLib Repair (${voxelQuality} quality) ===`
  );

  const { vertices, indices } = await repairMeshWithWorker(
    mesh.geometry,
    voxelQuality,
    onProgress
  );

  console.log("Repaired mesh data:", {
    vertices: vertices.length / 3,
    triangles: indices.length / 3,
  });

  const pitchDiameter = (params.module * params.teethCount).toFixed(1);
  let stlData: ArrayBuffer | string;
  let formatSuffix = "";

  if (stlFormat === "binary") {
    console.log("Creating binary STL directly from MeshLib data...");
    stlData = createBinarySTL(vertices, indices);
  } else {
    console.log("Creating ASCII STL directly from MeshLib data...");
    const modelName = `Gear_T${params.teethCount}_M${params.module}_D${pitchDiameter}`;
    stlData = createASCIISTL(vertices, indices, modelName);
    formatSuffix = "_ascii";
  }

  const filename = `gear_t${params.teethCount}_m${params.module}_d${pitchDiameter}mm${formatSuffix}.stl`;
  const blob = new Blob([stlData], { type: "application/sla" });

  console.log(
    `✓ ${stlFormat.toUpperCase()} STL export with MeshLib repair complete!`
  );
  trackEvent("stl_export", {
    props: { format: stlFormat, quality: voxelQuality },
  });
  return { blob, filename };
}

export async function exportTo3MFWithRepair(
  mesh: THREE.Mesh,
  params: GearParameters,
  voxelQuality: VoxelQuality = "ultra",
  onProgress?: (stage: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  console.log(
    `=== Exporting 3MF with MeshLib Repair (${voxelQuality} quality) ===`
  );

  const { vertices, indices } = await repairMeshWithWorker(
    mesh.geometry,
    voxelQuality,
    onProgress
  );

  console.log("Repaired mesh data:", {
    vertices: vertices.length / 3,
    triangles: indices.length / 3,
  });

  const pitchDiameter = (params.module * params.teethCount).toFixed(1);
  const modelName = `Gear_T${params.teethCount}_M${params.module}_D${pitchDiameter}`;

  const mesh3mf = [
    {
      id: "1",
      name: modelName,
      vertices,
      indices,
      transform: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Identity matrix (3x4)
    },
  ];

  const header = {
    title: modelName,
    designer: "Gear FTL Generator",
    description: `Gear: ${params.teethCount} teeth, ${params.module}mm module, ${pitchDiameter}mm pitch diameter (MeshLib repaired)`,
    copyright: "© " + new Date().getFullYear(),
    licenseTerms: "",
    rating: "",
  };

  const modelXml = to3dmodelSimple(mesh3mf, header, 6);

  const files = {
    "[Content_Types].xml": strToU8(fileForContentTypes.content),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`),
    "3D/3dmodel.model": strToU8(modelXml),
  };

  const zipData = zipSync(files, { level: 6 });

  const filename = `gear_t${params.teethCount}_m${params.module}_d${pitchDiameter}mm.3mf`;
  const blob = new Blob([zipData], {
    type: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
  });

  return { blob, filename };
}
