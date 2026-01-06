declare module "@jscadui/3mf-export" {
  export interface Header {
    title?: string;
    designer?: string;
    description?: string;
    copyright?: string;
    licenseTerms?: string;
    rating?: string;
  }

  export interface Mesh3MFSimple {
    id: string;
    vertices: Float32Array;
    indices: Uint32Array;
    name?: string;
    transform: number[]; // mat4 as array
  }

  export function to3dmodelSimple(
    meshes: Mesh3MFSimple[],
    header?: Header,
    precision?: number
  ): string;

  export const fileForContentTypes: {
    name: string;
    content: string;
  };
}
