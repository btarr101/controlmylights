import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MouseContext } from "../contexts/MouseContext";

/**
 * Provides details regarding the state of the mouse.
 */
export default function MouseProvider({ children }: PropsWithChildren) {
  const [leftHeld, setLeftHeld] = useState(false);

  const handleLeftDown = useCallback(() => setLeftHeld(true), []);
  const handleLeftUp = useCallback(() => setLeftHeld(false), []);

  useEffect(() => {
    document.addEventListener("mousedown", handleLeftDown);
    document.addEventListener("mouseup", handleLeftUp);
    document.addEventListener("touchstart", handleLeftDown);
    document.addEventListener("touchend", handleLeftUp);

    return () => {
      document.removeEventListener("mousedown", () => handleLeftDown);
      document.removeEventListener("mouseup", () => handleLeftUp);
      document.removeEventListener("touchstart", () => handleLeftDown);
      document.removeEventListener("touchend", () => handleLeftUp);
    };
  }, [handleLeftDown, handleLeftUp]);

  const value = useMemo(() => ({ leftHeld }), [leftHeld]);

  return (
    <MouseContext.Provider value={value}>{children}</MouseContext.Provider>
  );
}
