import { useState } from "react";
import { ApiDocRoute } from "../components/ApiDocRoute";

export const ApiDocsPage = () => (
  <div className="container mx-auto my-2 mb-32 flex max-w-2xl flex-1 flex-col space-y-8">
    <ApiDocRoute
      path="/api/leds"
      requestType={{
        type: "http",
        method: "GET",
      }}
      description="Gets the current state of every LED"
      buildRequestParams={() => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds`,
      })}
    />
    <ApiDocRoute
      path="/api/leds/:id"
      requestType={{
        type: "http",
        method: "GET",
      }}
      description="Gets the current state of one LED"
      params={[{ label: "id", initial: "0", description: "Index of the LED" }]}
      buildRequestParams={({ id }) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds/${id}`,
      })}
    />
    <ApiDocRoute
      path="/api/leds/:id"
      requestType={{
        type: "http",
        method: "POST",
      }}
      description="Sets the color of a LED"
      params={[
        { label: "id", initial: "0", description: "Index of the LED" },
        { label: "red", initial: "255" },
        { label: "green", initial: "255" },
        { label: "blue", initial: "255" },
      ]}
      buildRequestParams={({ id, red, green, blue }) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds/${id}`,
        body: new URLSearchParams({
          red,
          green,
          blue,
        }),
      })}
    />
    <ApiDocRoute
      path="/api/leds/ws"
      requestType={{
        type: "websocket",
      }}
      description={<WsDocRouteDescription />}
      params={[
        {
          label: "colors_only",
          description:
            "true/false - assumed false - if to only include colors in snapshots",
        },
        {
          label: "snapshot_interval",
          description:
            "Interval in ms that snapshots are sent - when there are updates. 100 is assumed and values less than 100 will be ignored.",
        },
      ]}
      buildRequestParams={({ colors_only, snapshot_interval }) => {
        const queryParams = new URLSearchParams(
          Object.entries({
            colors_only,
            snapshot_interval,
          }).filter(([, value]) => value),
        );
        console.log(queryParams);
        return {
          url: `${import.meta.env.VITE_API_BASE_URL}/leds/ws?${queryParams}`,
        };
      }}
    />
  </div>
);

const WsDocRouteDescription = () => {
  const [detailsExposed, setDetailsExposed] = useState(false);

  return (
    <>
      Connects to a websocket endpoint where routine full LED snapshots are
      delivered and LED updates can be sent.
      <br />
      <br />
      <button
        className={`flex cursor-pointer items-start rounded-l-md pr-2 text-stone-400`}
        onClick={() => setDetailsExposed((detailsExposed) => !detailsExposed)}
      >
        &nbsp;
        <span className="font-mono">{detailsExposed ? "v" : ">"}</span>
        &nbsp; Further details
      </button>
      {detailsExposed && (
        <div className="m-2 rounded-md bg-stone-100 p-2">
          Snapshots w/ timestamps (assumed by default when connecting) are
          BINARY websocket payloads that take on the following form:
          {/* prettier-ignore */}
          <pre className="font-mono">
            ----------------------------------------------------------------<br />
            | LED 0                                                 | LED 1 ...<br />
            ----------------------------------------------------------------<br />
            |  Byte 0  |  Byte 1  |  Byte 2  |   Byte 3 - Byte 10   |       ...<br />
            ----------------------------------------------------------------<br />
            |    R     |    G     |    B     |Timestamp (Big Endian)|       ...<br />
            ----------------------------------------------------------------<br />
          </pre>
          <br />
          And snapshots wo/ timestamps:
          {/* prettier-ignore */}
          <pre className="font-mono">
            -----------------------------------------<br />
            | LED 0                          | LED 1 ...<br />
            -----------------------------------------<br />
            |  Byte 0  |  Byte 1  |  Byte 2  |       ...<br />
            -----------------------------------------<br />
            |    R     |    G     |    B     |       ...<br />
            -----------------------------------------<br />
          </pre>
          <br />
          LED updates can be SENT w/ BINARY websocket payloads in the following
          form:
          {/* prettier-ignore */}
          <pre className="font-mono">
            --------------------------------------------------------<br />
            |   Byte 0 - Byte 1   |  Byte 2  |  Byte 3  |  Byte 4  |<br />
            --------------------------------------------------------<br />
            |Id/Index (Big Endian)|    R     |    G     |    B     |<br />
            --------------------------------------------------------<br />
          </pre>
        </div>
      )}
      <br />
    </>
  );
};
