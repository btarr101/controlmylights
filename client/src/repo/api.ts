import { Options } from "react-use-websocket";

export type LedDTO = {
  color: {
    red: number;
    green: number;
    blue: number;
  };
  timestamp: Date;
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

export async function getLeds(): Promise<LedDTO[]> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leds`);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const json = await response.json();

  return json;
}
