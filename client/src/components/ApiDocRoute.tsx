import { Fragment, useCallback, useMemo, useState } from "react";
import { match, P } from "ts-pattern";

export type Method = "GET" | "POST" | "WS";

export type Param = {
  type: "Path" | "Query";
  label: string;
};

export type ApiDocRouteProps = {
  path: string;
  method: Method;
  params?: string[];
  buildFetchParams: (paramValues?: Record<string, string>) => FetchParams;
};

type FetchParams = {
  url: string;
  body?: BodyInit;
};

type DocResponse = {
  statusCode: number;
  body: unknown;
};

type DocResult =
  | {
      error: Error;
    }
  | DocResponse;

// TODO: Reorg to support WS doc
export const ApiDocRoute = ({
  path,
  method,
  params,
  buildFetchParams,
}: ApiDocRouteProps) => {
  const [paramValues, setParamValues] = useState(
    Object.fromEntries((params ?? []).map((param) => [param, ""])),
  );

  const fetchParams = useMemo(() => {
    return buildFetchParams(paramValues);
  }, [buildFetchParams, paramValues]);

  const [result, setResult] = useState<DocResult>();

  const handleRequest = useCallback(async () => {
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
      statusCode: response.status,
      body,
    });
  }, [fetchParams.body, fetchParams.url, method]);

  return (
    <section className="space-y-2">
      <p className="text-2xl">{path}</p>

      {params && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "auto minmax(0,1fr)",
          }}
        >
          {params.map((param, index) => (
            <Fragment key={index}>
              <label className="w-min">{param}</label>
              <input
                className="w-min border"
                value={paramValues[param]}
                onChange={(event) => {
                  setParamValues({
                    ...paramValues,
                    [param]: event.target.value,
                  });
                }}
              />
            </Fragment>
          ))}
        </div>
      )}
      <div className="space-x-2">
        <button
          className={`rounded border p-1 hover:cursor-pointer ${match(method)
            .with("GET", () => "bg-green-300 hover:bg-green-500")
            .with("POST", () => "bg-blue-300 hover:bg-blue-500")
            .with("WS", () => "bg-purple-300 hover:bg-purple-500")
            .exhaustive()}`}
          type="button"
          onClick={handleRequest}
        >
          {method}
        </button>
        {result !== undefined && (
          <button
            className="rounded border bg-gray-100 p-1 hover:cursor-pointer hover:bg-gray-300"
            type="button"
            onClick={() => setResult(undefined)}
          >
            Clear
          </button>
        )}
      </div>
      {match(result)
        .with({ error: P.select("err") }, ({ err }) => (
          <div className="rounded border bg-red-400 p-2">{err.message}</div>
        ))
        .with(undefined, () => null)
        .otherwise((response) => (
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
        ))}
    </section>
  );
};
