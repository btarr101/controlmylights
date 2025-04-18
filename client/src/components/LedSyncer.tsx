import { useEffect } from "react";
import { useApi } from "../contexts/ApiContext";
import { useLeds, useLedUpdated } from "../contexts/LedContext";
import Color from "ts-color-class";
import { getLeds } from "../repo/api";

export const LedSyncer = () => {
  const { leds } = useLeds();

  return leds === undefined ? <LedSyncInitializer /> : <LedSyncUpdater />;
};

const LedSyncInitializer = () => {
  const { setColors } = useLeds();

  useEffect(() => {
    (async () => {
      const fetchedLeds = await getLeds();
      const initialColors = fetchedLeds.map(
        ({ color: { red, green, blue } }) => new Color(red, green, blue),
      );
      setColors(initialColors);
    })();
  }, [setColors]);

  return null;
};

const LedSyncUpdater = () => {
  const { latestFetchedLeds, updateLed } = useApi();
  const { setColors, leds } = useLeds();

  useEffect(() => {
    if (latestFetchedLeds) {
      const newColors: Color[] = [];
      let diff = false;

      latestFetchedLeds.forEach(({ color: { red, green, blue } }, index) => {
        const newColor = new Color(red, green, blue);

        const oldColor = leds?.[index]?.color;
        diff = diff || newColor.getHex() !== oldColor?.getHex();

        newColors.push(newColor);
      });

      // avoid infinite re-render
      if (diff) {
        setColors(newColors);
      }
    }
  }, [latestFetchedLeds, leds, setColors]);

  useLedUpdated(({ index, color }) => {
    updateLed({ id: index, color });
  });

  return null;
};
