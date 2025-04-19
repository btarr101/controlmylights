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

const config: CanvasConfig = {
  width: 960,
  height: 640,
  ledSize: 24,
  margin: 12,
  top: {
    leds: 38,
    startOffsetPercent: 20,
  },
  right: {
    leds: 32,
  },
  bottom: {
    leds: 49,
  },
  left: {
    leds: 31,
  },
} as const;

/**
 * Shit like this makes me hate html and css.
 */
export const LedCanvas = () => {
  const { leds } = useLeds();
  const { activeSplotch } = useEasel();
  const { held } = usePointer();

  const divRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={divRef}
      onPointerDown={handlePointerDown}
      className="relative aspect-3/2 w-full touch-pinch-zoom bg-[url(/room.webp)] bg-cover bg-center"
    >
      <div className="absolute left-[15%] flex h-0 w-[85%] items-center justify-between">
        <div />
        {[...Array(config.top.leds)].map((_, index) => (
          <LedShadow
            led={leds?.[index]}
            key={index}
            sizeMultiplier={ledShadowSizeMultipler}
          />
        ))}
      </div>
      <div className="absolute right-0 flex h-full w-0 flex-col items-center justify-between">
        <div />
        {[...Array(config.right.leds)].map((_, index) => (
          <LedShadow
            led={leds?.[index + config.top.leds]}
            key={index}
            sizeMultiplier={ledShadowSizeMultipler}
          />
        ))}
      </div>
      <div className="absolute bottom-0 flex h-0 w-full flex-row-reverse items-center justify-between">
        <div />
        {[...Array(config.bottom.leds)].map((_, index) => (
          <LedShadow
            led={leds?.[index + config.top.leds + config.right.leds]}
            key={index}
            sizeMultiplier={ledShadowSizeMultipler}
          />
        ))}
      </div>
      <div className="absolute left-0 flex h-full w-0 flex-col-reverse items-center justify-between">
        <div />
        {[...Array(config.left.leds)].map((_, index) => (
          <LedShadow
            led={
              leds?.[
                index + config.top.leds + config.right.leds + config.bottom.leds
              ]
            }
            key={index}
            sizeMultiplier={ledShadowSizeMultipler}
          />
        ))}
      </div>
      {/* Lights */}
      <div className="absolute left-[15%] flex w-[85%] items-center justify-between bg-blue-300">
        <div />
        {[...Array(config.top.leds)].map((_, index) => (
          <LedButtonIcon index={index} key={index} />
        ))}
      </div>
      <div className="absolute right-0 flex h-full w-0 flex-col items-center justify-between">
        <div />
        {[...Array(config.right.leds)].map((_, index) => (
          <LedButtonIcon index={index + config.top.leds} key={index} />
        ))}
      </div>
      <div className="absolute left-0 flex h-full w-0 flex-col items-center justify-between">
        {[...Array(config.left.leds)].map((_, index) => (
          <LedButtonIcon
            index={
              config.left.leds -
              1 -
              index +
              config.top.leds +
              config.right.leds +
              config.bottom.leds
            }
            key={index}
          />
        ))}
        <div />
      </div>
      <div className="absolute bottom-0 flex h-0 w-full flex-row-reverse items-center justify-between">
        <div />
        {[...Array(config.bottom.leds)].map((_, index) => (
          <LedButtonIcon
            index={index + config.top.leds + config.right.leds}
            key={index}
          />
        ))}
      </div>
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
