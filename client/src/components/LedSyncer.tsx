import { useEffect, useRef } from "react";
import { useApi } from "../contexts/ApiContext";
import { useLeds } from "../contexts/LedContext";
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
        ({ color: { red, green, blue } }) => new Color(red, green, blue)
      );
      setColors(initialColors);
    })();
  }, [setColors]);

  return null;
};

const LedSyncUpdater = () => {
  const { latestFetchedLeds, updateLed } = useApi();
  const { setColors, leds } = useLeds();

  const timestampsRef = useRef<Date[]>([]);
  useEffect(() => {
    if (latestFetchedLeds) {
      const timestamps = timestampsRef.current;
      const newTimestamps = latestFetchedLeds.map(({ timestamp }) => timestamp);

      let diff = false;
      const newColors = latestFetchedLeds.map(({ color, timestamp }, index) => {
        const currentTimestamp = timestamps[index];
        const currentColor = leds?.[index]?.color;

        if (
          !currentColor ||
          !currentTimestamp ||
          timestamp > currentTimestamp
        ) {
          diff = true;
          return new Color(color.red, color.green, color.blue);
        } else {
          return currentColor;
        }
      });

      if (diff) {
        timestampsRef.current = newTimestamps.map((newTimestamp, index) => {
          const oldTimestamp = timestamps[index];
          return oldTimestamp && oldTimestamp > newTimestamp
            ? oldTimestamp
            : newTimestamp;
        });

        setColors(newColors);
      }
    }
  }, [latestFetchedLeds, leds, setColors]);

  const oldColors = useRef<Color[]>([]);
  useEffect(() => {
    if (leds) {
      const colors = leds.map(({ color }) => color);

      colors.forEach((color, id) => {
        if (color.getHex() !== oldColors.current[id]?.getHex()) {
          updateLed({ id, color });
        }
      });

      oldColors.current = colors;
    }
  }, [leds, oldColors, updateLed]);

  return null;
};
