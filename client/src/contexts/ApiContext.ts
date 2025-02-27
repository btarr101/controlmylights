import { createContext, useContext } from "react";
import Color from "ts-color-class"
import { FetchedLed } from "../repo/api";

type UpdateLedParams = {
	id: number,
	color: Color
}

export type ApiState = {
	updateLed: (params: UpdateLedParams) => Promise<void>;
	latestFetchedLeds?: FetchedLed[];
}

export const ApiContext = createContext<ApiState>({
	updateLed: async () => {}
});

export const useApi = () => useContext(ApiContext);
