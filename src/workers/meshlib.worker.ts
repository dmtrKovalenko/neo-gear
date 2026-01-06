import { createMeshSDK } from "as-mesh";
import type { MeshSDK } from "as-mesh";

let meshSDK: MeshSDK | null = null;

interface MeshLibMesh {
  points: any;
  topology: any;
  averageEdgeLength: () => number;
  holePerimiter: (edge: any) => number;
  delete: () => void;
}

async function initMeshLib(): Promise<MeshSDK> {
  if (!meshSDK) {
    self.postMessage({
      type: "log",
      message: "Initializing MeshLib SDK in worker...",
    });

    meshSDK = await createMeshSDK();
    self.postMessage({
      type: "log",
      message: "MeshLib SDK initialized successfully",
    });
  }
  return meshSDK;
}

function createMeshLibMesh(
  vertices: Float32Array,
  indices: Uint32Array,
  sdk: MeshSDK
): MeshLibMesh {
  self.postMessage({
    type: "log",
    message: `Converting to MeshLib: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`,
  });

  const mesh = sdk.Mesh.fromTrianglesArray(vertices, indices, true);
  self.postMessage({ type: "log", message: "MeshLib mesh created" });

  return mesh as MeshLibMesh;
}

function extractMeshData(
  mesh: MeshLibMesh,
  sdk: MeshSDK
): { vertices: Float32Array; indices: Uint32Array } {
  const points = mesh.points;
  const vertCount = points.size();

  const vertices = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    const vertId = new sdk.VertId(i);
    const point = points.get(vertId);
    vertices[i * 3] = point.x;
    vertices[i * 3 + 1] = point.y;
    vertices[i * 3 + 2] = point.z;
  }

  const topology = mesh.topology;
  const allTriVerts = topology.getAllTriVerts();
  const triangleCount = allTriVerts.size();

  const indices = new Uint32Array(triangleCount * 3);
  for (let i = 0; i < triangleCount; i++) {
    const tri = allTriVerts.get(i);
    indices[i * 3] = tri[0].get();
    indices[i * 3 + 1] = tri[1].get();
    indices[i * 3 + 2] = tri[2].get();
  }

  return { vertices, indices };
}

async function repairMesh(
  vertices: Float32Array,
  indices: Uint32Array,
  voxelMultiplier = 0.05
) {
  try {
    self.postMessage({
      type: "log",
      message: `Repair starting with voxel multiplier: ${voxelMultiplier}`,
    });
    self.postMessage({
      type: "progress",
      stage: "Initializing MeshLib...",
      progress: 0,
    });
    const sdk = await initMeshLib();

    self.postMessage({
      type: "progress",
      stage: "Converting geometry...",
      progress: 5,
    });
    const originalMesh = createMeshLibMesh(vertices, indices, sdk);

    // STEP 1: Fill holes
    self.postMessage({
      type: "progress",
      stage: "Finding holes...",
      progress: 10,
    });
    const holeEdges = originalMesh.topology.findHoleRepresentiveEdges(null);
    const holeCount = holeEdges.size();

    if (holeCount > 0) {
      const avgEdgeLength = originalMesh.averageEdgeLength();
      const maxHolePerimeter = avgEdgeLength * 3.0;

      const edgeVec = new sdk.VectorEdgeId();
      let smallHoleCount = 0;

      for (let i = 0; i < holeCount; i++) {
        const edge = holeEdges.get(i);
        const perimeter = originalMesh.holePerimiter(edge);

        if (perimeter < maxHolePerimeter) {
          edgeVec.push_back(edge);
          smallHoleCount++;
        }
      }

      if (smallHoleCount > 0) {
        self.postMessage({
          type: "progress",
          stage: "Filling holes...",
          progress: 15,
        });
        const fillParams = new sdk.FillHoleParams();
        fillParams.metric = sdk.getUniversalMetric(originalMesh as any);
        fillParams.makeDegenerateBand = false;
        fillParams.maxPolygonSubdivisions = 0;

        sdk.fillHoles(originalMesh as any, edgeVec, fillParams);
        fillParams.delete();
      }

      edgeVec.delete();
      holeEdges.delete();
    }

    // STEP 2: Pass 1 - Sharpening mode
    self.postMessage({
      type: "progress",
      stage: "Preparing rebuild...",
      progress: 20,
    });

    const avgEdgeLength = originalMesh.averageEdgeLength();
    const voxelSize = avgEdgeLength * voxelMultiplier;
    self.postMessage({
      type: "log",
      message: `Using voxel size: ${voxelSize} (avgEdgeLength: ${avgEdgeLength})`,
    });

    const rebuildSettings1 = new sdk.RebuildMeshSettings();
    rebuildSettings1.voxelSize = voxelSize;
    rebuildSettings1.closeHolesInHoleWindingNumber = false;
    rebuildSettings1.windingNumberThreshold = 0.5;
    rebuildSettings1.windingNumberBeta = 2.0;
    rebuildSettings1.signMode = sdk.SignDetectionModeShort.Auto;
    rebuildSettings1.offsetMode = sdk.OffsetMode.Sharpening;
    rebuildSettings1.decimate = false;
    rebuildSettings1.preSubdivide = false;

    const progressCallback1 = sdk.ProgressCallback.create(
      (progress: number) => {
        let percent;

        if (progress < 0.5) {
          percent = progress * 80; // this is scaled to 40%
        } else {
          percent = 40 + progress * 10; // this is the last 10%
        }

        self.postMessage({
          type: "progress",
          stage: "Making your model watertight",
          progress: percent,
        });
        return true;
      }
    );
    rebuildSettings1.progress = progressCallback1;

    const meshPart1 = new sdk.MeshPart(originalMesh as any, null);
    const rebuildResult1 = sdk.rebuildMesh(meshPart1 as any, rebuildSettings1);

    if (rebuildResult1.hasError()) {
      throw new Error(`Rebuild failed: ${rebuildResult1.error()}`);
    }

    const pass1Mesh = rebuildResult1.value();

    progressCallback1.delete();
    rebuildSettings1.delete();
    meshPart1.delete();
    originalMesh.delete();

    // STEP 3: Pass 2 - Standard cleanup
    const rebuildSettings2 = new sdk.RebuildMeshSettings();
    rebuildSettings2.voxelSize = voxelSize;
    rebuildSettings2.closeHolesInHoleWindingNumber = false;
    rebuildSettings2.windingNumberThreshold = 0.5;
    rebuildSettings2.windingNumberBeta = 2.0;
    rebuildSettings2.signMode = sdk.SignDetectionModeShort.Auto;
    rebuildSettings2.offsetMode = sdk.OffsetMode.Standard;
    rebuildSettings2.decimate = false;
    rebuildSettings2.preSubdivide = true;

    const progressCallback2 = sdk.ProgressCallback.create(
      (progress: number) => {
        const percent = 50 + progress * 45; // 50-95%
        self.postMessage({
          type: "progress",
          stage: "Fixing self-intersections and optimizng mesh",
          progress: percent,
        });
        return true;
      }
    );
    rebuildSettings2.progress = progressCallback2;

    const meshPart2 = new sdk.MeshPart(pass1Mesh as any, null);
    const rebuildResult2 = sdk.rebuildMesh(meshPart2 as any, rebuildSettings2);

    if (rebuildResult2.hasError()) {
      throw new Error(`Rebuild failed: ${rebuildResult1.error()}`);
    }

    const finalMesh = rebuildResult2.value();
    self.postMessage({
      type: "progress",
      stage: "Preparing for download",
      progress: 95,
    });
    const meshData = extractMeshData(finalMesh as MeshLibMesh, sdk);

    progressCallback2.delete();
    rebuildSettings2.delete();
    meshPart2.delete();
    pass1Mesh.delete();
    finalMesh.delete();

    self.postMessage(
      {
        type: "complete",
        vertices: meshData.vertices,
        indices: meshData.indices,
      },
      { transfer: [meshData.vertices.buffer, meshData.indices.buffer] }
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

self.onmessage = async (event) => {
  const { type, vertices, indices, voxelMultiplier } = event.data;

  if (type === "repair") {
    await repairMesh(vertices, indices, voxelMultiplier);
  }
};
