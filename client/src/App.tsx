import Color from "ts-color-class";
import EaselProvider from "./providers/EaselProvider";
import MouseProvider from "./providers/MouseProvider";
import LedProvier from "./providers/LedProvider";
import { loadEasel, SavedEasel } from "./repo/easel";
import { EaselSaver } from "./components/EaselSaver";
import ApiProvider from "./providers/ApiProvider";
import { LedSyncer } from "./components/LedSyncer";
import { Navigate, NavLink, Route, Routes } from "react-router";
import { LightControllerPage } from "./pages/LightControllerPage";
import { ApiDocsPage } from "./pages/ApiDocsPage";
import LedIcon from "./assets/light-bulb.svg?react";
import GithubIcon from "./assets/github-mark.svg?react";

export const App = () => {
  const savedEasel =
    loadEasel() ??
    ({
      colors: [...Array(9)].map(() =>
        new Color(
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255,
          1.0,
        ).getHex(),
      ),
    } as SavedEasel);

  return (
    <MouseProvider>
      <EaselProvider
        initialSplotchIndex={savedEasel.activeSplotchIndex}
        initialColors={savedEasel.colors.map((hex) => new Color(hex))}
      >
        <LedProvier>
          <EaselSaver />
          <ApiProvider>
            <LedSyncer />
            <div className="pattern-dots pattern-stone-300 pattern-bg-white pattern-size-4 fixed top-0 right-0 bottom-0 left-0 -z-10 min-h-screen" />
            <div className="fixed top-0 right-0 bottom-0 left-0 flex flex-col overflow-scroll">
              <div className="justify-left z-10 flex items-center justify-between border-b-4 bg-white p-4">
                <div />
                <div className="flex flex-row items-center">
                  <LedIcon
                    className="h-16 w-16 stroke-black stroke-[1px]"
                    style={{
                      color: "white",
                    }}
                    onDragStart={() => false}
                  />
                  <div>
                    <header className="text-center text-2xl font-bold">
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
                                ? "cursor-default text-gray-400"
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
                              <span
                                key={2 * index + 1}
                                className="text-gray-400"
                              >
                                {" "}
                                |{" "}
                              </span>,
                            ];
                      })}
                    </nav>
                  </div>
                </div>

                <button className="border-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:cursor-pointer">
                  <GithubIcon
                    className="m-2 h-8 w-8 stroke-black stroke-1"
                    onDragStart={() => false}
                  />
                </button>
              </div>
              <Routes>
                <Route index element={<LightControllerPage />} />
                <Route path="apidocs" element={<ApiDocsPage />} />
                <Route path="*" element={<Navigate to="/" replace={true} />} />
              </Routes>
            </div>
          </ApiProvider>
        </LedProvier>
      </EaselProvider>
    </MouseProvider>
  );
};
