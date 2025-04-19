import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PointerContext, PointerState } from "../contexts/PointerContext";

export type PointerMoveCallback = (event: PointerEvent) => void;

/**
 * Provides details regarding the state of the pointer (touch + mouse).
 */
export default function PointerProvider({ children }: PropsWithChildren) {
  const [pointerHeld, setPointerHeld] = useState(false);
  const pointerMoveListeners = useRef<PointerMoveCallback[]>([]);
  const addPointerMoveListener = useCallback(
    (callback: PointerMoveCallback) =>
      pointerMoveListeners.current.push(callback),
    [],
  );
  const removePointerMoveListener = useCallback(
    (callback: PointerMoveCallback) => {
      const index = pointerMoveListeners.current.indexOf(callback);
      if (index !== -1) {
        pointerMoveListeners.current.splice(index, 1);
      }
    },
    [],
  );

  const handlePointerDown = useCallback(() => setPointerHeld(true), []);
  const handlePointerUp = useCallback(() => setPointerHeld(false), []);
  const handlePointerMove = useCallback((event: PointerEvent) => {
    pointerMoveListeners.current.forEach((callback) => callback(event));
  }, []);

  useEffect(() => {
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handlePointerDown, handlePointerUp, handlePointerMove]);

  const value: PointerState = useMemo(
    () => ({
      held: pointerHeld,
      addPointerMoveListener,
      removePointerMoveListener,
    }),
    [pointerHeld, addPointerMoveListener, removePointerMoveListener],
  );

  return (
    <PointerContext.Provider value={value}>{children}</PointerContext.Provider>
  );
}
