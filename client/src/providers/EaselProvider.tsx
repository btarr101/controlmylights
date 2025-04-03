import { PropsWithChildren, useMemo, useState } from "react";
import Color from "ts-color-class";
import { EaselContext } from "../contexts/EaselContext";

export type EaselProviderProps = {
  initialSplotchIndex?: number;
  initialColors: Color[];
};

export default function EaselProvider({
  initialSplotchIndex,
  initialColors,
  children,
}: PropsWithChildren<EaselProviderProps>) {
  const [splotchIndex, setSplotchIndex] = useState(initialSplotchIndex ?? 0);
  const [splotchColors, setSplotchColors] = useState<Color[]>(initialColors);

  const splotches = useMemo(
    () =>
      splotchColors.map((color, index) => ({
        color,
        setColor: (newColor: Color) =>
          setSplotchColors((colors) =>
            colors.map((color, subIndex) =>
              index == subIndex ? newColor : color,
            ),
          ),
        active: index == splotchIndex,
        use: () => setSplotchIndex(index),
      })),
    [splotchIndex, splotchColors],
  );
  const activeSplotch = useMemo(
    () => splotches[splotchIndex % splotches.length],
    [splotchIndex, splotches],
  );
  const value = useMemo(
    () => ({
      activeSplotch,
      activeSplotchIndex: splotchIndex,
      splotches,
    }),
    [activeSplotch, splotchIndex, splotches],
  );

  return (
    <EaselContext.Provider value={value}>{children}</EaselContext.Provider>
  );
}
