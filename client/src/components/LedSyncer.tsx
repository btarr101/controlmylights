import { useEffect, useRef } from "react";
import { useApi } from "../contexts/ApiContext";
import { useLeds } from "../contexts/LedContext";
import Color from "ts-color-class";

export const LedSyncer = () => {
  const { latestColors, updateLed } = useApi();
  const { setColors, leds } = useLeds();

  useEffect(() => {
    if (latestColors) {
      setColors(latestColors);
    }
  }, [latestColors, setColors]);

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
