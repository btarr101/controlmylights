import useWebSocket from "react-use-websocket";
import { ApiContext, ApiState } from "../contexts/ApiContext";
import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import Color from "ts-color-class";

export default function ApiProvider({ children }: React.PropsWithChildren) {
  const { sendMessage, lastMessage } = useWebSocket(
    "http://localhost:8000/api/leds/ws"
  );

  const [latestColors, setLatestColors] = useState<Color[]>();
  useEffect(() => {
    if (lastMessage?.data) {
      (async () => {
        const buffer = await (lastMessage.data as Blob).arrayBuffer();
        const array = new Uint8Array(buffer);

        setLatestColors(_.chunk(array, 3).map((rgb) => new Color(rgb)));
      })();
    }
  }, [lastMessage]);

  const value = useMemo(
    () =>
      ({
        updateLed: ({ id, color }) => {
          const [red, green, blue] = color.getRGB();
          const low = id & 0xff;
          const high = (id >> 8) & 0xff;
          sendMessage(new Uint8Array([high, low, red, green, blue]));
        },
        latestColors,
      } as ApiState),
    [latestColors, sendMessage]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
