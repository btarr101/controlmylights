import { useMemo, useState } from "react";

export type Method = "GET" | "POST";

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

const methodColorMap: Record<Method, { base: string; hover: string }> = {
  GET: {
    base: "bg-green-300",
    hover: "bg-green-500",
  },
  POST: {
    base: "bg-blue-300",
    hover: "bg-blue-500",
  },
};

export const ApiDocRoute = ({
  path,
  method,
  params,
  buildFetchParams,
}: ApiDocRouteProps) => {
  const [paramValues, setParamValues] = useState(
    Object.fromEntries((params ?? []).map((param) => [param, ""]))
  );

  const fetchParams = useMemo(() => {
    return buildFetchParams(paramValues);
  }, [buildFetchParams, paramValues]);

  const [response, setResponse] = useState<DocResponse>();

  return (
    <section className="space-y-2">
      <p className="text-2xl">{path}</p>
      {params &&
        params.map((param, index) => (
          <div className="space-x-2" key={index}>
            <label>{param}</label>
            <input
              className="border"
              value={paramValues[param]}
              onChange={(event) => {
                setParamValues({
                  ...paramValues,
                  [param]: event.target.value,
                });
              }}
            />
          </div>
        ))}
      <div className="space-x-2">
        <button
          className={`border rounded hover:cursor-pointer p-1 ${methodColorMap[method].base} hover:${methodColorMap[method].hover}`}
          type="button"
          onClick={async () => {
            const response = await fetch(fetchParams.url, {
              method,
              body: fetchParams.body,
            });
            const rawBody = await response.text();
            let body;
            try {
              body = JSON.parse(rawBody);
            } catch {
              body = rawBody;
            }

            setResponse({
              statusCode: response.status,
              body,
            });
          }}
        >
          {method}
        </button>
        {response !== undefined && (
          <button
            className="border rounded hover:cursor-pointer p-1 hover:bg-gray-300 bg-gray-100"
            type="button"
            onClick={() => setResponse(undefined)}
          >
            Clear
          </button>
        )}
      </div>

      {response !== undefined && (
        <pre
          style={{
            counterReset: "line",
          }}
          className={`overflow-x-scroll rounded border p-2 max-h-72 overflow-y-scroll ${
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
      )}
    </section>
  );
};
