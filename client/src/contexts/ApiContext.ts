import { createContext, useContext } from "react";
import Color from "ts-color-class"

type UpdateLedParams = {
	id: number,
	color: Color
}

export type ApiState = {
	updateLed: (params: UpdateLedParams) => Promise<void>;
	latestColors?: Color[];
}

export const ApiContext = createContext<ApiState>({
	updateLed: async () => {}
});

export const useApi = () => useContext(ApiContext);
