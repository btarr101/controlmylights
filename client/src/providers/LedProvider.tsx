import {
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import Color from "ts-color-class";
import { LedContext, LedData, LedUpdateCallback } from "../contexts/LedContext";

export type LedProviderProps = {
  initialColors?: Color[];
};

export default function LedProvier({
  initialColors,
  children,
}: PropsWithChildren<LedProviderProps>) {
  const [ledData, setLedData] = useState<LedData[] | undefined>(() => {
    const now = new Date();
    return initialColors?.map((color) => ({
      color,
      lastUpdateTimestamp: now,
      lastUpdateSource: "client",
    }));
  });

  const updateLeds = useCallback(
    (update: (oldLeds: LedData[] | undefined) => LedData[] | undefined) =>
      setLedData(update),
    [setLedData],
  );

  const ledUpdateListeners = useRef<LedUpdateCallback[]>([]);
  const addLedUpdateListener = useCallback((callback: LedUpdateCallback) => {
    ledUpdateListeners.current.push(callback);
  }, []);
  const removeLedUpdateListener = useCallback((callback: LedUpdateCallback) => {
    const index = ledUpdateListeners.current.indexOf(callback);
    if (index !== -1) {
      ledUpdateListeners.current.splice(index, 1);
    }
  }, []);

  const value = useMemo(
    () => ({
      leds: ledData?.map((data, index) => ({
        ...data,
        setColor: (newColor: Color) =>
          updateLeds((oldLeds) => {
            const oldLed = oldLeds?.[index];
            let newLed: LedData;
            if (oldLed?.color.getHex() !== newColor.getHex()) {
              newLed = {
                color: newColor,
                lastUpdateTimestamp: new Date(),
                lastUpdateSource: "client",
              };
              ledUpdateListeners.current.forEach((callback) =>
                callback({
                  index,
                  color: newColor,
                }),
              );
            } else {
              newLed = oldLed;
            }

            return oldLeds?.map((oldLed, subIndex) =>
              index === subIndex ? newLed : oldLed,
            );
          }),
      })),
      updateLeds,
      addLedUpdateListener,
      removeLedUpdateListener,
    }),
    [ledData, updateLeds, addLedUpdateListener, removeLedUpdateListener],
  );

  return <LedContext.Provider value={value}>{children}</LedContext.Provider>;
}
