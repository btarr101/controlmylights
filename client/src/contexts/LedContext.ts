import { createContext, useContext, useEffect } from "react";
import Color from "ts-color-class";

export type LedState = {
  leds?: Led[];
  updateLeds: (update: (oldLeds: LedData[] | undefined) => (LedData[] | undefined)) => void;
  addLedUpdateListener: (callback: LedUpdateCallback) => void;
  removeLedUpdateListener: (callback: LedUpdateCallback) => void;
};

export type LedUpdateSource = "client" | "server";

export type LedData = {
  color: Color;
  lastUpdateTimestamp: Date;
  lastUpdateSource: LedUpdateSource;
}

export type Led = LedData & {
  setColor: (color: Color) => void;
};

export type LedUpdate = {
  index: number,
  color: Color
}

export type LedUpdateCallback = (ledUpdate: LedUpdate) => void;

export const LedContext = createContext<LedState>({
  updateLeds: () => {},
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
