import { PropsWithChildren, useMemo, useState } from "react";
import Color from "ts-color-class";
import { LedContext } from "../contexts/LedContext";

export type LedProviderProps = {
  initialColors?: Color[];
};

export default function LedProvier({
  initialColors,
  children,
}: PropsWithChildren<LedProviderProps>) {
  const [colors, setColors] = useState<Color[] | undefined>(initialColors);

  const value = useMemo(
    () => ({
      leds: colors?.map((color, index) => ({
        color,
        setColor: (newColor: Color) => {
          if (colors[index].getHex() == newColor.getHex()) {
            return;
          }

          const newColors = colors.map((oldColor, otherIndex) =>
            index === otherIndex ? newColor : oldColor
          );

          setColors(newColors);
        },
      })),
      setColors,
    }),
    [colors]
  );

  return <LedContext.Provider value={value}>{children}</LedContext.Provider>;
}
