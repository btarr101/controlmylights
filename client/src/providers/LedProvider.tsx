import {
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import Color from "ts-color-class";
import { LedContext, LedUpdateCallback } from "../contexts/LedContext";

export type LedProviderProps = {
  initialColors?: Color[];
};

export default function LedProvier({
  initialColors,
  children,
}: PropsWithChildren<LedProviderProps>) {
  const [colors, setColors] = useState(initialColors);

  const ledUpdateListeners = useRef<LedUpdateCallback[]>([]);
  const addLedUpdateListener = useCallback((callback: LedUpdateCallback) => {
    console.log(ledUpdateListeners);
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
          ledUpdateListeners.current.forEach((callback) =>
            callback({
              index,
              color: newColor,
            }),
          );
        },
      })),
      setColors,
      addLedUpdateListener,
      removeLedUpdateListener,
    }),
    [colors, addLedUpdateListener, removeLedUpdateListener],
  );

  return <LedContext.Provider value={value}>{children}</LedContext.Provider>;
}
