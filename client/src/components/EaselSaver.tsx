import { useEffect } from "react";
import { useEasel } from "../contexts/EaselContext";
import { saveEasel } from "../repo/easel";

export const EaselSaver = () => {
  const { activeSplotchIndex, splotches } = useEasel();

  useEffect(
    () =>
      saveEasel({
        activeSplotchIndex,
        colors: splotches.map((splotch) => splotch.color.getHex()),
      }),
    [activeSplotchIndex, splotches],
  );

  return null;
};

export const EaselLoader = () => {
  const { activeSplotchIndex, splotches } = useEasel();

  useEffect(
    () =>
      saveEasel({
        activeSplotchIndex,
        colors: splotches.map((splotch) => splotch.color.getHex()),
      }),
    [activeSplotchIndex, splotches],
  );

  return null;
};
