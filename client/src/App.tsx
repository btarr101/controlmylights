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
        initialActiveSplotchIndex={savedEasel.activeSplotchIndex}
        initialColors={savedEasel.colors.map((hex) => new Color(hex))}
      >
        <LedProvier>
          <EaselSaver />
          <ApiProvider>
            <LedSyncer />
            <div className="mx-1 flex min-h-screen min-w-sm flex-col justify-center">
              <div className="space-y-2 py-4">
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
                          <span key={2 * index + 1} className="text-gray-400">
                            {" "}
                            |{" "}
                          </span>,
                        ];
                  })}
                </nav>
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
