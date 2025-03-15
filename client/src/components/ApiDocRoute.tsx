import {
  Fragment,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useWebSocket from "react-use-websocket";
import { match } from "ts-pattern";
import { websocketOptions } from "../repo/api";
import { createPortal } from "react-dom";

export type ApiDocRouteRequestType =
  | {
      type: "http";
      method: "GET" | "POST";
    }
  | {
      type: "websocket";
    };

export type ApiDocRouteParam<K extends string> = {
  label: K;
  description?: string;
  initial?: string;
};

export type ApiDocRouteRequestParams = {
  url: string;
  body?: BodyInit;
};

type ApiDocRouteResult =
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "http";
      response: {
        statusCode: number;
        body: unknown;
      };
    }
  | {
      type: "websocket";
    };

export type ApiDocRouteProps<K extends string> = {
  path: string;
  requestType: ApiDocRouteRequestType;
  description?: React.ReactNode;
  params?: ApiDocRouteParam<K>[];
  buildRequestParams: (params: Record<K, string>) => ApiDocRouteRequestParams;
};

export function ApiDocRoute<K extends string>({
  path,
  requestType,
  description,
  params: maybeParams,
  buildRequestParams,
}: ApiDocRouteProps<K>) {
  const params = useMemo(() => maybeParams ?? [], [maybeParams]);
  const [paramValues, setParamValues] = useState<Record<string, string>>(
    Object.fromEntries(
      params.map(({ label, initial }) => [label, initial ?? ""]),
    ),
  );
  const allParams = useMemo(
    () =>
      ({
        ...Object.fromEntries(params.map(({ label }) => [label, ""])),
        ...paramValues,
      }) as Record<K, string>,
    [paramValues, params],
  );
  const fetchParams = useMemo(
    () => buildRequestParams(allParams),
    [allParams, buildRequestParams],
  );
  const [result, setResult] = useState<ApiDocRouteResult>();

  const handleRequest = useMemo(() => {
    return match(requestType)
      .with({ type: "http" }, ({ method }) => async () => {
        let response;
        let rawBody;
        try {
          response = await fetch(fetchParams.url, {
            method,
            body: fetchParams.body,
          });
          rawBody = await response.text();
        } catch (error) {
          setResult({
            type: "error",
            error: error as Error,
          });
          return;
        }

        let body;
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }

        setResult({
          type: "http",
          response: {
            statusCode: response.status,
            body,
          },
        });
      })
      .with({ type: "websocket" }, () => () => {
        setResult({ type: "websocket" });
      })
      .exhaustive();
  }, [fetchParams.body, fetchParams.url, requestType]);

  const buttonsRef = useRef<HTMLDivElement>(null);

  return (
    <section className="space-y-2">
      <p className="text-2xl">{path}</p>
      {description && <p>{description}</p>}
      {Object.keys(params) && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "auto minmax(0,1fr)",
          }}
        >
          {params.map((param, index) => (
            <Fragment key={index}>
              <label className="w-min">{param.label}</label>
              <div className="flex flex-row space-x-2">
                <input
                  className={`h-fit w-min border ${result?.type === "websocket" && "cursor-not-allowed bg-stone-100"}`}
                  value={paramValues[param.label] ?? ""}
                  disabled={result?.type === "websocket"}
                  onChange={(event) => {
                    setParamValues({
                      ...paramValues,
                      [param.label]: event.target.value,
                    });
                  }}
                />
                {param.description && (
                  <p className="text-stone-400">({param.description})</p>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      )}
      <div ref={buttonsRef} className="space-x-2">
        {!(
          requestType.type === "websocket" && result?.type === "websocket"
        ) && (
          <button
            className={`rounded border p-1 hover:cursor-pointer ${match(
              requestType,
            )
              .with(
                { type: "http", method: "GET" },
                () => "bg-green-300 hover:bg-green-500",
              )
              .with(
                { type: "http", method: "POST" },
                () => "bg-blue-300 hover:bg-blue-500",
              )
              .with(
                { type: "websocket" },
                () => "bg-purple-300 hover:bg-purple-500",
              )
              .exhaustive()}`}
            type="button"
            onClick={handleRequest}
          >
            {match(requestType)
              .with({ type: "http" }, ({ method }) => method)
              .with({ type: "websocket" }, () => "Connect")
              .exhaustive()}
          </button>
        )}
        {result !== undefined && (
          <button
            className="rounded border bg-gray-100 p-1 hover:cursor-pointer hover:bg-gray-300"
            type="button"
            onClick={() => setResult(undefined)}
          >
            {match(result)
              .with({ type: "websocket" }, () => "Disconnect")
              .otherwise(() => "Clear")}
          </button>
        )}
      </div>
      {match(result)
        .with({ type: "error" }, ({ error }) => (
          <div className="rounded border bg-red-400 p-2">{error.message}</div>
        ))
        .with({ type: "http" }, ({ response }) => (
          <pre
            style={{
              counterReset: "line",
            }}
            className={`max-h-72 overflow-x-scroll overflow-y-scroll rounded border p-2 ${
              response.statusCode >= 200 && response.statusCode <= 299
                ? "bg-green-100"
                : "bg-red-100"
            }`}
          >
            {JSON.stringify(response, null, 2)
              .split("\n")
              .map((line, number, array) => {
                const digits = array.length.toString().length;

                return (
                  <p key={number}>
                    {number.toString().padEnd(digits)}| {line}
                  </p>
                );
              })}
          </pre>
        ))
        .with({ type: "websocket" }, () => (
          <WsDemo
            endpoint={fetchParams.url}
            freezeButtonPortal={buttonsRef}
            setError={(error) =>
              setResult({
                type: "error",
                error,
              })
            }
          />
        ))
        .otherwise(() => null)}
    </section>
  );
}

export type WsDemoProps = {
  endpoint: string;
  setError?: (error: Error) => void;
  freezeButtonPortal?: RefObject<HTMLDivElement | null>;
};

type MessageData = {
  timestamp: Date;
  hexString: string;
};

const WsDemo = ({ endpoint, setError, freezeButtonPortal }: WsDemoProps) => {
  const { lastMessage } = useWebSocket(endpoint, {
    ...websocketOptions,
    onError: () => {
      if (setError)
        setError(new Error(`WebSocket connection to '${endpoint}' failed`));
    },
  });
  const [rxMessages, setRxMessages] = useState<MessageData[]>([]);
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    if (!frozen && lastMessage !== null) {
      const timestamp = new Date();
      (async () => {
        const data = await (lastMessage.data as Blob).arrayBuffer();
        const hexString = [...new Uint8Array(data)]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join(" ");
        setRxMessages((messages) => [
          {
            timestamp,
            hexString,
          },
          ...messages.slice(0, 10),
        ]);
      })();
    }
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  const freezeButton = useMemo(
    () => (
      <button
        className={`rounded border bg-gray-100 p-1 hover:cursor-pointer ${frozen ? "bg-orange-100 hover:bg-orange-300" : "bg-teal-100 hover:bg-teal-300"}`}
        type="button"
        onClick={() => setFrozen((frozen) => !frozen)}
      >
        {frozen ? "Unfreeze" : "Freeze"}
      </button>
    ),
    [frozen],
  );

  return (
    <>
      {freezeButtonPortal?.current
        ? createPortal(freezeButton, freezeButtonPortal.current)
        : freezeButton}
      <div
        className={`grid h-max max-h-96 items-stretch overflow-scroll rounded border p-2 ${frozen && "bg-teal-50"}`}
        style={{
          gridTemplateColumns: "auto minmax(0,1fr)",
        }}
      >
        {rxMessages.map((messageData, index) => (
          <WsMessageLine
            key={messageData.timestamp.toISOString()}
            messageData={messageData}
            alt={index % 2 == 0}
          />
        ))}
      </div>
    </>
  );
};

const WsMessageLine = ({
  messageData: { timestamp, hexString },
  alt,
}: {
  messageData: MessageData;
  alt?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        className={`cursor-pointer text-stone-400 ${alt && "bg-stone-200/50"} flex items-start rounded-l-md pr-2`}
        onClick={() => setExpanded((expanded) => !expanded)}
      >
        &nbsp;
        <span className="font-mono">{expanded ? "v" : ">"}</span>
        &nbsp;
        {timestamp.toLocaleTimeString()}
      </button>
      <span
        className={`${!expanded && "overflow-hidden text-nowrap text-ellipsis whitespace-nowrap"} ${alt && "bg-stone-200/50"} rounded-r-md font-mono`}
      >
        {hexString}
      </span>
    </>
  );
};
