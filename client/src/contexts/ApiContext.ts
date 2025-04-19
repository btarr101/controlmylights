import { createContext, useContext } from "react";
import Color from "ts-color-class";
import { LedDTO } from "../repo/api";

type SendLedUpdateParams = {
  id: number;
  color: Color;
};

export type ApiState = {
  sendLedUpdate: (params: SendLedUpdateParams) => Promise<void>;
  latestReceivedLeds?: LedDTO[];
};

export const ApiContext = createContext<ApiState>({
  sendLedUpdate: async () => {},
});

export const useApi = () => useContext(ApiContext);
