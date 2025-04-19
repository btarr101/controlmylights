import Color from "ts-color-class";
import EaselProvider from "./providers/EaselProvider";
import PointerProvider from "./providers/PointerProvider";
import LedProvier from "./providers/LedProvider";
import { loadEasel, SavedEasel } from "./repo/easel";
import { EaselSaver } from "./components/EaselSaver";
import ApiProvider from "./providers/ApiProvider";
import { LedSyncer } from "./components/LedSyncer";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { LightControllerPage } from "./pages/LightControllerPage";
import { ApiDocsPage } from "./pages/ApiDocsPage";
import { Navbar } from "./components/Navbar";
import BreakpointsProvider from "./providers/BreakpointsProvider";

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
    <BrowserRouter>
      <PointerProvider>
        <BreakpointsProvider>
          <EaselProvider
            initialSplotchIndex={savedEasel.activeSplotchIndex}
            initialColors={savedEasel.colors.map((hex) => new Color(hex))}
          >
            <LedProvier>
              <EaselSaver />
              <ApiProvider>
                <LedSyncer />
                <div className="pattern-zigzag pattern-stone-100 pattern-bg-white pattern-size-4 fixed top-0 right-0 bottom-0 left-0 -z-10 min-h-screen" />
                <div className="fixed top-0 right-0 bottom-0 left-0 flex flex-col overflow-scroll">
                  <Navbar />
                  <Routes>
                    <Route index element={<LightControllerPage />} />
                    <Route path="apidocs" element={<ApiDocsPage />} />
                    <Route
                      path="*"
                      element={<Navigate to="/" replace={true} />}
                    />
                  </Routes>
                </div>
              </ApiProvider>
            </LedProvier>
          </EaselProvider>
        </BreakpointsProvider>
      </PointerProvider>
    </BrowserRouter>
  );
};
