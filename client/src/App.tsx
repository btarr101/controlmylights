import Color from "ts-color-class";
import { LedCanvas } from "./LedCanvas";
import { LedEasel } from "./LedEasel";
import EaselProvider from "./providers/EaselProvider";
import MouseProvider from "./providers/MouseProvider";
import LedProvier from "./providers/LedProvider";
import { loadEasel, SavedEasel } from "./repo/easel";
import { EaselSaver } from "./components/EaselSaver";
import ApiProvider from "./providers/ApiProvider";
import { LedSyncer } from "./components/LedSyncer";
import { Navigate, NavLink, Route, Routes } from "react-router";
import { ApiDocRoute } from "./components/ApiDocRoute";

export const App = () => {
  const savedEasel =
    loadEasel() ??
    ({
      colors: [...Array(9)].map(() =>
        new Color(
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255,
          1.0
        ).getHex()
      ),
    } as SavedEasel);

  return (
    <MouseProvider>
      <EaselProvider
        initialActiveSplotchIndex={savedEasel.activeSplotchIndex}
        initialColors={savedEasel.colors.map((hex) => new Color(hex))}
      >
        <LedProvier>
          <EaselSaver />
          <ApiProvider>
            <LedSyncer />
            <div className="flex flex-col min-h-screen min-w-sm">
              <div className="py-8 space-y-2">
                <header className="text-center text-2xl">
                  Control My Lights
                </header>
                <nav className="text-center">
                  {[
                    { label: "Controller", path: "/" },
                    { label: "Api Docs", path: "/apidocs" },
                  ].flatMap(({ label, path }, index, array) => {
                    const navlink = (
                      <NavLink
                        key={2 * index}
                        to={path}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "text-gray-400 cursor-default"
                            : "text-blue-400 hover:underline"
                        }
                      >
                        {label}
                      </NavLink>
                    );

                    return index + 1 === array.length
                      ? navlink
                      : [
                          navlink,
                          <span key={2 * index + 1} className="text-gray-400">
                            {" "}
                            |{" "}
                          </span>,
                        ];
                  })}
                </nav>
              </div>

              <Routes>
                <Route
                  index
                  element={
                    <div className="max-w-2xl container mx-auto flex flex-col justify-evenly items-center flex-1 gap-4 my-2">
                      <LedCanvas />
                      <LedEasel />
                    </div>
                  }
                />
                <Route
                  path="apidocs"
                  element={
                    <div className="max-w-2xl container mx-auto flex flex-col flex-1 space-y-8 my-2">
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
                          url: `${import.meta.env.VITE_API_BASE_URL}/leds/${
                            params?.id ?? ""
                          }`,
                        })}
                      />
                      <ApiDocRoute
                        path="/api/leds/:id"
                        method="POST"
                        params={["id", "red", "green", "blue"]}
                        buildFetchParams={(params) => ({
                          url: `${import.meta.env.VITE_API_BASE_URL}/leds/${
                            params?.id ?? ""
                          }`,
                          body: new URLSearchParams({
                            red: params?.red ?? "",
                            green: params?.green ?? "",
                            blue: params?.blue ?? "",
                          }),
                        })}
                      />
                    </div>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace={true} />} />
              </Routes>
            </div>
          </ApiProvider>
        </LedProvier>
      </EaselProvider>
    </MouseProvider>
  );
};
