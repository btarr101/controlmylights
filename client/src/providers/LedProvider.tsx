import { PropsWithChildren, useMemo, useReducer } from "react";
import Color from "ts-color-class";
import { LedContext } from "../contexts/LedContext";

export type LedProviderProps = {
  initialColors?: Color[];
};

type ReduceAction =
  | {
      type: "setColor";
      index: number;
      color: Color;
    }
  | {
      type: "setColors";
      colors: Color[];
    };

function reduce(state: Color[] | undefined, action: ReduceAction) {
  switch (action.type) {
    case "setColor":
      return state?.map((oldColor, index) =>
        index === action.index ? action.color : oldColor,
      );
    case "setColors":
      return action.colors;
  }
}

export default function LedProvier({
  initialColors,
  children,
}: PropsWithChildren<LedProviderProps>) {
  const [colors, dispatchColors] = useReducer(reduce, initialColors);

  const value = useMemo(
    () => ({
      leds: colors?.map((color, index) => ({
        color,
        setColor: (newColor: Color) => {
          if (colors[index]?.getHex() == newColor.getHex()) {
            return;
          }

          dispatchColors({ type: "setColor", index, color: newColor });
        },
      })),
      setColors: (colors: Color[]) =>
        dispatchColors({ type: "setColors", colors }),
    }),
    [colors],
  );

  return <LedContext.Provider value={value}>{children}</LedContext.Provider>;
}
