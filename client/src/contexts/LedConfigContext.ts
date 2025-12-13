import { createContext, useContext } from "react";
import roomLightLocations from "./room-light-locations.json";
import treeLightLocations from "./tree-light-locations.json";

export type LightLocation = {
  x: number;
  y: number;
};

export type LedConfigEntry = {
  apiPrefix: string;
  bgImage: string;
  lightLocations: LightLocation[];
};

export type LedConfig = {
  label: LedConfigLabel;
} & LedConfigEntry;

export const ledConfigEntries = {
  "Christmas Tree": {
    apiPrefix: "/xmas",
    bgImage: "tree.webp",
    lightLocations: treeLightLocations,
  },
  Shed: {
    apiPrefix: "",
    bgImage: "room.webp",
    lightLocations: roomLightLocations,
  },
} as const satisfies Record<string, LedConfigEntry>;

export type LedConfigLabel = keyof typeof ledConfigEntries;

export type LedConfigState = {
  setLedConfig(label: LedConfigLabel): void;
  ledConfig: LedConfig;
};

export const LedConfigContext = createContext<LedConfigState>({
  setLedConfig: () => {},
  ledConfig: { label: "Christmas Tree", ...ledConfigEntries["Christmas Tree"] },
});

export const useLedConfig = () => useContext(LedConfigContext);
