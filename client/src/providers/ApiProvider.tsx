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

  const [latestReceivedLeds, setLatestReceivedLeds] = useState<LedDTO[]>();
  useEffect(() => {
    if (lastMessage?.data) {
      (async () => {
        const buffer = await (lastMessage.data as Blob).arrayBuffer();
        const array = new Uint8Array(buffer);

        const parsedLedDTOs = _.chunk(array, 11).map(
          ([red, green, blue, ...timestampBytes]) => {
            // ---------------------------------------------------------
            // |  Byte 0  |  Byte 1  |  Byte 2  |   Byte 3 - Byte 10   |
            // ---------------------------------------------------------
            // |    R     |    G     |    B     |      Timestamp       |
            // ---------------------------------------------------------
            const dataView = new DataView(
              new Uint8Array(timestampBytes).buffer,
            );
            const last_updated = new Date(
              Number(dataView.getBigUint64(0, false)) * 1000,
            );
            return {
              color: { red, green, blue } as {
                red: number;
                green: number;
                blue: number;
              },
              last_updated,
            };
          },
        );

        setLatestReceivedLeds(parsedLedDTOs);
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
        latestReceivedLeds,
      }) as ApiState,
    [latestReceivedLeds, sendMessage],
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
