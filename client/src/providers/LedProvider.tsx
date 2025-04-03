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
  const [colors, setColors] = useState(initialColors);

  const value = useMemo(
    () => ({
      leds: colors?.map((color, index) => ({
        color,
        setColor: (newColor: Color) => {
          if (colors[index]?.getHex() == newColor.getHex()) {
            return;
          }

          setColors((colors) =>
            colors?.map((oldColor, subIndex) =>
              index === subIndex ? newColor : oldColor,
            ),
          );
        },
      })),
      setColors,
    }),
    [colors],
  );

  return <LedContext.Provider value={value}>{children}</LedContext.Provider>;
}
