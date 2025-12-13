import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LedIcon from "../../assets/light-bulb.svg?react";
import { useEasel } from "../../contexts/EaselContext";
import { useLeds } from "../../contexts/LedContext";
import { useOnPointerMoved, usePointer } from "../../contexts/PointerContext";
import { LedShadow } from "../../components/LedShadow";
import { PointerEvent as ReactPointerEvent } from "react";
import { useBreakpoints } from "../../contexts/BreakpointsContext";
import { match } from "ts-pattern";
import _ from "lodash";
import { useLedConfig } from "../../contexts/LedConfigContext";

export type CanvasConfig = {
  width: number;
  height: number;
  ledSize: number;
  margin?: number;
  top: CanvasWallConfig;
  right: CanvasWallConfig;
  bottom: CanvasWallConfig;
  left: CanvasWallConfig;
};

/**
 * Configuration for a specific wall.
 *
 * Assumes the "beginning" corner is covered, and the wall
 * includes the "ending" corner.
 */
export type CanvasWallConfig = {
  leds: number;
  startOffsetPercent?: number;
};

/**
 * Shit like this makes me hate html and css.
 */
export const LedCanvas = () => {
  const {
    ledConfig: { bgImage, lightLocations },
  } = useLedConfig();
  const { leds } = useLeds();
  const { activeSplotch } = useEasel();
  const { held } = usePointer();

  const divRef = useRef<HTMLDivElement>(null);

  // Leaving this "debuggy code here for now"
  //
  // useEffect(() => {
  //   function squareSpiralPoints(count) {
  //     const points = [];

  //     let x = 0;
  //     let y = 0;
  //     let dx = 1;
  //     let dy = 0;

  //     let segmentLength = 1;
  //     let segmentPassed = 0;
  //     let segmentCount = 0;

  //     for (let i = 0; i < count; i++) {
  //       points.push({ x, y });

  //       x += dx;
  //       y += dy;
  //       segmentPassed++;

  //       if (segmentPassed === segmentLength) {
  //         segmentPassed = 0;
  //         // rotate direction 90°
  //         [dx, dy] = [-dy, dx];
  //         segmentCount++;

  //         // increase segment length every 2 turns
  //         if (segmentCount % 2 === 0) {
  //           segmentLength++;
  //         }
  //       }
  //     }

  //     // normalize to [0,1]
  //     const xs = points.map((p) => p.x);
  //     const ys = points.map((p) => p.y);
  //     const minX = Math.min(...xs);
  //     const maxX = Math.max(...xs);
  //     const minY = Math.min(...ys);
  //     const maxY = Math.max(...ys);

  //     return points.map((p) => ({
  //       x: (p.x - minX) / (maxX - minX),
  //       y: (p.y - minY) / (maxY - minY),
  //     }));
  //   }

  //   console.log(squareSpiralPoints(500));

  //   if (!divRef.current) return;

  //   const boundingRect = divRef.current.getBoundingClientRect();
  //   const elements = divRef.current.querySelectorAll('[id^="led-hitbox"]');

  //   // elements is a NodeList
  //   console.log(
  //     [...elements]
  //       .sort(
  //         (a, b) =>
  //           parseInt(a.id.replace("led-hitbox-", "")) -
  //           parseInt(b.id.replace("led-hitbox-", "")),
  //       )
  //       .map((element) => {
  //         const rect = element.getBoundingClientRect();
  //         const x = rect.left + rect.width / 2;
  //         const y = rect.top + rect.height / 2;

  //         return {
  //           x: (x - boundingRect.x) / boundingRect.width,
  //           y: (y - boundingRect.y) / boundingRect.height,
  //         };
  //       }),
  //   );
  // }, []);

  const getLedHitboxes = useCallback((clientX: number, clientY: number) => {
    const elements = document.elementsFromPoint(clientX, clientY);

    const div = divRef.current;
    return div
      ? elements.filter((element) => element.id.startsWith("led-hitbox"))
      : [];
  }, []);

  const getClosestLed = useCallback(
    (clientX: number, clientY: number) => {
      const ledHitboxes = getLedHitboxes(clientX, clientY);
      const closestHitbox = _.maxBy(ledHitboxes, (hitbox) => {
        const rect = hitbox.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        return -Math.sqrt((x - clientX) ** 2 + (y - clientY) ** 2);
      });

      if (!closestHitbox) return null;

      const ledHitboxId = parseInt(closestHitbox.id.replace("led-hitbox-", ""));
      const led = leds?.[ledHitboxId];

      return led ?? null;
    },
    [getLedHitboxes, leds],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      const color = activeSplotch?.color;
      if (color) {
        getClosestLed(event.clientX, event.clientY)?.setColor(color);
      }
    },
    [activeSplotch?.color, getClosestLed],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const color = activeSplotch?.color;

      if (held && color) {
        getClosestLed(event.clientX, event.clientY)?.setColor(color);
      }
    },
    [activeSplotch?.color, getClosestLed, held],
  );

  useOnPointerMoved(handlePointerMove);

  const { sm, lg } = useBreakpoints();
  const ledShadowSizeMultipler = useMemo(
    () =>
      match({ sm, lg })
        .with({ lg: true }, () => 1.0)
        .with({ sm: true }, () => 0.75)
        .otherwise(() => 0.5),
    [sm, lg],
  );

  const sortedLocations = useMemo(
    () =>
      lightLocations
        .map((location, index) => ({ index, ...location }))
        .sort((a, b) => a.y - b.y),
    [lightLocations],
  );

  return (
    <div
      ref={divRef}
      onPointerDown={handlePointerDown}
      className={`relative aspect-3/2 w-full touch-pinch-zoom bg-cover bg-center`}
      style={{
        backgroundImage: `url(/${bgImage})`,
      }}
    >
      {/* Shadows */}
      {sortedLocations.map((location) => (
        <div
          key={location.index}
          style={{
            position: "absolute",
            zIndex: location.y * 100,
            top: `${location.y * 100}%`,
            left: `${location.x * 100}%`,
          }}
        >
          <LedShadow
            led={leds?.[location.index]}
            sizeMultiplier={ledShadowSizeMultipler}
          />
        </div>
      ))}
      {/* Lights */}
      {sortedLocations.map((location) => (
        <div
          key={location.index}
          style={{
            position: "absolute",
            zIndex: location.y * 100,
            top: `${location.y * 100}%`,
            left: `${location.x * 100}%`,
          }}
        >
          <LedButtonIcon index={location.index} />
        </div>
      ))}
    </div>
  );
};

const LedButtonIcon = ({ index }: { index: number }) => {
  const { leds } = useLeds();
  const led = useMemo(() => leds?.[index], [leds, index]);
  const hex = useMemo(() => led?.color.getHex() ?? "#000000", [led?.color]);

  const [float, setFloat] = useState(false);
  const [prevColor, setPrevColor] = useState(hex);
  useEffect(() => {
    if (prevColor !== hex) {
      setFloat(true);
      setTimeout(() => setFloat(false), 300);
      setPrevColor(hex);
    }
  }, [prevColor, hex]);

  return (
    <div id={`led-${index}`} className="relative h-0 w-0">
      <div
        id={`led-hitbox-${index}`}
        className="absolute h-6 w-6 -translate-x-[50%] -translate-y-[50%] rounded-full"
      />
      <LedIcon
        className={`${float ? "-translate-y-[75%]" : "-translate-y-[50%]"} absolute h-4 w-4 -translate-x-[50%] stroke-black stroke-1 transition-all sm:h-5 sm:w-5 lg:h-7 lg:w-7`}
        style={{
          color: led?.color.getHex() ?? "#000000",
        }}
        onDragStart={() => false}
      />
    </div>
  );
};
