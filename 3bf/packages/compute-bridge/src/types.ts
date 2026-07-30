export interface RhinoComputeConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

export interface InnerTreeValue {
  type: string;
  data: string;
}

export interface InnerTreeNode {
  ParamName: string;
  InnerTree: Record<string, InnerTreeValue[]>;
}

export interface ComputePayload {
  algo: string; // Base64 del archivo .gh
  pointer: string | null;
  values: InnerTreeNode[];
}

export const DEFAULT_PORTS = [5000, 6004, 5001, 5002, 5003, 6005, 8081];
