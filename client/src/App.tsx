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
        <EaselSaver />
        <div className="flex flex-col min-h-screen min-w-sm">
          <header className="text-center py-8 text-2xl">
            Control My Lights
          </header>
          <div className="max-w-2xl container mx-auto flex flex-col justify-evenly items-center flex-1 gap-4 my-2">
            <LedProvier>
              <ApiProvider>
                <LedSyncer />
              </ApiProvider>
              <LedCanvas />
            </LedProvier>
            <LedEasel />
          </div>
        </div>
      </EaselProvider>
    </MouseProvider>
  );
};
