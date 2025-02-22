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
        initialColors={savedEasel.colors.map((color) => new Color(color))}
      >
        <EaselSaver />
        <div
          className="flex flex-col min-h-screen min-w-sm pattern-rectangles pattern-stone-600 pattern-bg-stone-700 
  pattern-size-6 pattern-opacity-100"
        >
          <div className="max-w-2xl container mx-auto flex flex-col justify-evenly items-center flex-1 gap-4 my-2">
            <ApiProvider>
              <LedProvier>
                <LedSyncer />
                <LedCanvas />
              </LedProvier>
            </ApiProvider>
            <LedEasel />
          </div>
        </div>
      </EaselProvider>
    </MouseProvider>
  );
};
