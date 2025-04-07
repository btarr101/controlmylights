import { useEffect, useMemo, useState } from "react";
import { Led } from "../contexts/LedContext";

export const LedShadow = ({
  led,
  sizeMultiplier = 1.0,
}: {
  led?: Led;
  sizeMultiplier?: number;
}) => {
  const hex = useMemo(() => led?.color.getHex() ?? "#000000", [led?.color]);
  const size = useMemo(() => {
    const lightness = led?.color.getLightness() ?? 0;
    return (32 / 2.0) * Math.pow(lightness, 0.5) * sizeMultiplier;
  }, [led?.color, sizeMultiplier]);

  const [glow, setGlow] = useState(false);
  const [prevColor, setPrevColor] = useState(hex);
  useEffect(() => {
    if (prevColor !== hex) {
      setGlow(true);
      setTimeout(() => setGlow(false), 100);
      setPrevColor(hex);
    }
  }, [prevColor, hex]);

  return (
    <div className="relative h-0 w-0">
      <div
        className="absolute h-0 w-0 -translate-x-[50%] -translate-y-[50%] rounded-full transition-shadow"
        style={{
          boxShadow: `0px 0px 32px ${glow ? size * 1.2 : size}px ${hex}`,
        }}
      />
    </div>
  );
};
