import { createContext, useContext } from "react";
import Color from "ts-color-class";
import { LedDTO } from "../repo/api";
import { LedConfigLabel, useLedConfig } from "./LedConfigContext";

type SendLedUpdateParams = {
  id: number;
  color: Color;
};

export type ApiState = {
  sendLedUpdate: (params: SendLedUpdateParams) => Promise<void>;
  latestReceivedLeds?: LedDTO[];
};

export type FullApiState = Record<LedConfigLabel, ApiState>;

export const ApiContext = createContext<FullApiState>({
  "Christmas Tree": {
    sendLedUpdate: async () => {},
  },
  Shed: {
    sendLedUpdate: async () => {},
  },
});

export const useApi = () => {
  const { ledConfig } = useLedConfig();
  return useContext(ApiContext)[ledConfig.label];
};
