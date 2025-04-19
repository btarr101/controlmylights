import useWebSocket from "react-use-websocket";
import { ApiContext, ApiState } from "../contexts/ApiContext";
import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { LedDTO, websocketOptions } from "../repo/api";

export default function ApiProvider({ children }: React.PropsWithChildren) {
  const { sendMessage, lastMessage } = useWebSocket(
    `${import.meta.env.VITE_API_BASE_URL}/leds/ws`,
    websocketOptions,
  );

  const [latestFetchedLeds, setLatestFetchedLeds] = useState<LedDTO[]>();
  useEffect(() => {
    if (lastMessage?.data) {
      (async () => {
        const buffer = await (lastMessage.data as Blob).arrayBuffer();
        const array = new Uint8Array(buffer);

        const parsedFetchedLeds = _.chunk(array, 11).map(
          ([red, green, blue, ...timestampBytes]) => {
            // ---------------------------------------------------------
            // |  Byte 0  |  Byte 1  |  Byte 2  |   Byte 3 - Byte 10   |
            // ---------------------------------------------------------
            // |    R     |    G     |    B     |      Timestamp       |
            // ---------------------------------------------------------
            const dataView = new DataView(
              new Uint8Array(timestampBytes).buffer,
            );
            const timestamp = new Date(
              Number(dataView.getBigUint64(0, false)) * 1000,
            );
            return {
              color: { red, green, blue } as {
                red: number;
                green: number;
                blue: number;
              },
              timestamp,
            };
          },
        );

        setLatestFetchedLeds(parsedFetchedLeds);
      })();
    }
  }, [lastMessage]);

  const value = useMemo(
    () =>
      ({
        sendLedUpdate: ({ id, color }) => {
          // ------------------------------------------------------
          // |  Byte 0 - Byte 1  |  Byte 2  |  Byte 3  |  Byte 4  |
          // ------------------------------------------------------
          // |       Index       |    R     |    G     |    B     |
          // ------------------------------------------------------
          const [red, green, blue] = color.getRGB() as [number, number, number];
          const low = id & 0xff;
          const high = (id >> 8) & 0xff;
          sendMessage(new Uint8Array([high, low, red, green, blue]));
        },
        latestReceivedLeds: latestFetchedLeds,
      }) as ApiState,
    [latestFetchedLeds, sendMessage],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
