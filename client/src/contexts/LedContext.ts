import { createContext, useContext } from "react";
import Color from "ts-color-class";

export type LedState = {
  leds?: Led[];
  setColors: (colors: Color[]) => void;
};

export type Led = {
  color: Color;
  setColor: (newColor: Color) => void;
};

export const LedContext = createContext<LedState>({
  setColors: () => {},
});

export const useLeds = () => useContext(LedContext);
