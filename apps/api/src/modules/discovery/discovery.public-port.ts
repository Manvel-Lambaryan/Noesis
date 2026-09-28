export type DiscoveryAccess = {
  rebuild(): Promise<{ indexed: number; removed: number }>;
};

export const DISCOVERY_ACCESS = Symbol("DISCOVERY_ACCESS");
