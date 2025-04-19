import { createContext, useContext, useEffect } from "react";

export type PointerState = {
  held: boolean;
  addPointerMoveListener: (callback: (event: PointerEvent) => void) => void;
  removePointerMoveListener: (callback: (event: PointerEvent) => void) => void;
};

export const PointerContext = createContext<PointerState>({
  held: false,
  addPointerMoveListener: () => {},
  removePointerMoveListener: () => {}
});

export const usePointer = () => useContext(PointerContext);

export const useOnPointerMoved = (callback: (event: PointerEvent) => void) => {
  const { addPointerMoveListener, removePointerMoveListener } = usePointer();
  useEffect(() => {
    addPointerMoveListener(callback);
    return () => {
      removePointerMoveListener(callback);
    };
  }, [addPointerMoveListener, callback, removePointerMoveListener]);
}