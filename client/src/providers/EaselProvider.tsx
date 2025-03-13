import { PropsWithChildren, useMemo, useState } from "react";
import Color from "ts-color-class";
import { EaselContext } from "../contexts/EaselContext";

export type EaselProviderProps = {
  initialActiveSplotchIndex?: number;
  initialColors: Color[];
};

export default function EaselProvider({
  initialActiveSplotchIndex,
  initialColors,
  children,
}: PropsWithChildren<EaselProviderProps>) {
  const [activeColorIndex, setActiveColorIndex] = useState(
    initialActiveSplotchIndex ?? 0,
  );
  const [colors, setColors] = useState<Color[]>(initialColors);

  const splotches = useMemo(
    () =>
      colors.map((color, index) => ({
        color,
        setColor: (newColor: Color) =>
          setColors(
            colors.map((color, subIndex) =>
              index == subIndex ? newColor : color,
            ),
          ),
        active: index == activeColorIndex,
        use: () => {
          setActiveColorIndex(index);
        },
      })),
    [activeColorIndex, colors],
  );
  const activeSplotch = useMemo(
    () => splotches[activeColorIndex],
    [activeColorIndex, splotches],
  );
  const value = useMemo(
    () => ({
      activeSplotch,
      activeSplotchIndex: activeColorIndex,
      splotches,
    }),
    [activeSplotch, activeColorIndex, splotches],
  );

  return (
    <EaselContext.Provider value={value}>{children}</EaselContext.Provider>
  );
}
