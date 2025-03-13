import { ApiDocRoute } from "../components/ApiDocRoute";

export const ApiDocsPage = () => (
  <div className="container mx-auto my-2 flex max-w-2xl flex-1 flex-col space-y-8">
    <ApiDocRoute
      path="/api/leds"
      method="GET"
      buildFetchParams={() => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds`,
      })}
    />
    <ApiDocRoute
      path="/api/leds/:id"
      method="GET"
      params={["id"]}
      buildFetchParams={(params) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds/${params?.id ?? ""}`,
      })}
    />
    <ApiDocRoute
      path="/api/leds/:id"
      method="POST"
      params={["id", "red", "green", "blue"]}
      buildFetchParams={(params) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds/${params?.id ?? ""}`,
        body: new URLSearchParams({
          red: params?.red ?? "",
          green: params?.green ?? "",
          blue: params?.blue ?? "",
        }),
      })}
    />
    <ApiDocRoute
      path="/api/leds/ws"
      method="WS"
      params={["id", "red", "green", "blue"]}
      buildFetchParams={() => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/leds/ws`,
      })}
    />
  </div>
);
