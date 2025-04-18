import { createContext, useContext, useEffect } from "react";
import Color from "ts-color-class";

export type LedState = {
  leds?: Led[];
  setColors: (colors: Color[]) => void;
  addLedUpdateListener: (callback: LedUpdateCallback) => void;
  removeLedUpdateListener: (callback: LedUpdateCallback) => void;
};

export type Led = {
  color: Color;
  setColor: (newColor: Color) => void;
};

export type LedUpdate = {
  index: number,
  color: Color
}

export type LedUpdateCallback = (ledUpdate: LedUpdate) => void;

export const LedContext = createContext<LedState>({
  setColors: () => {},
  addLedUpdateListener: () => {},
  removeLedUpdateListener: () => {}
});

export const useLeds = () => useContext(LedContext);

export const useLedUpdated = (callback: LedUpdateCallback) => {
  const { addLedUpdateListener, removeLedUpdateListener } = useLeds();
    useEffect(() => {
      addLedUpdateListener(callback);
      return () => {
        removeLedUpdateListener(callback);
      };
    }, [addLedUpdateListener, removeLedUpdateListener, callback]);
}
