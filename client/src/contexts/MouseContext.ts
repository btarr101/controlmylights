import { createContext, useContext } from "react";

export type MouseState = {
  leftHeld: boolean;
};

export const MouseContext = createContext<MouseState>({ leftHeld: false });

export const useMouse = () => useContext(MouseContext);
