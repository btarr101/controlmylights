import { Options } from "react-use-websocket";

export type LedDTO = {
  color: {
    red: number;
    green: number;
    blue: number;
  };
  last_updated: Date;
};

export const websocketOptions: Options = {
  disableJson: true,
  shouldReconnect: () => true,
  heartbeat: {
    interval: 60000,
    message: "ping",
    returnMessage: "pong"
  },
};

type RawLedDTO = Omit<LedDTO, "last_updated"> & {
  last_updated: string
};

export async function getLeds(): Promise<LedDTO[]> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leds`);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const json: RawLedDTO[] = await response.json();

  return json.map(({ last_updated, ...otherData }) => ({
    ...otherData,
    // Parsing raw json sucks because it's not type hinted
    // 
    // (honestly really the DTO should not have a date, but an iso timestamp or something - but that's harder)
    // 
    // Issue was though that the initial population of leds using the API endpoint was getting ISO timestamp strings rather
    // than dates, while the websocket API was correctly parsing whatever was gotten into dates - this messed with comparing
    // timestamps on the client to choose if an led should be updated.
    last_updated: new Date(last_updated)
  }));
}
