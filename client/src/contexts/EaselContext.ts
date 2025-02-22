import { createContext, useContext } from "react";
import Color from "ts-color-class";

export type EaselState = {
  activeSplotch?: Splotch;
  activeSplotchIndex?: number;
  splotches: Splotch[];
};

export type Splotch = {
  color: Color;
  setColor: (newColor: Color) => void;
} & (
  | {
	  active: true;
	}
  | {
	  active: false;
	  use: () => void;
	}
);

export const EaselContext = createContext<EaselState>({
  get activeSplotch() {
	return this.splotches[0];
  },
  splotches: [
	{
	  active: true,
	  color: new Color(255, 255, 255, 1.0),
	  setColor: () => {},
	},
  ],
});

export const useEasel = () => useContext(EaselContext);