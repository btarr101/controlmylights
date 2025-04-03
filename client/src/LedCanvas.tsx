import { useCallback, useEffect, useRef, useState } from "react";
import LedIcon from "./assets/light-bulb.svg?react";
import { useEasel } from "./contexts/EaselContext";
import { Led, useLeds } from "./contexts/LedContext";
import { useMouse } from "./contexts/MouseContext";
import { MouseEvent as ReactMouseEvent } from "react";

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

  const divRef = useRef<HTMLDivElement>(null);

  const dispatchMouseEvent = useCallback((event: ReactMouseEvent<unknown>) => {
    const elements = document.elementsFromPoint(event.clientX, event.clientY);

    const div = divRef.current;
    if (div) {
      elements
        .filter((element) => div.contains(element) && div !== element)
        .forEach((element) =>
          element.dispatchEvent(
            new MouseEvent(event.type, {
              bubbles: true,
            }),
          ),
        );
    }
  }, []);

  return (
    <div
      ref={divRef}
      className="relative m-8 aspect-3/2 w-full bg-[url(/room.jpg)] bg-cover bg-center"
      onMouseDown={dispatchMouseEvent}
      onMouseMove={dispatchMouseEvent}
    >
      <div className="absolute left-[15%] flex h-0 w-[85%] items-center justify-between">
        {[...Array(config.top.leds)].map((_, index) => (
          <LedShadow led={leds?.[index]} key={index} />
        ))}
      </div>
      <div className="absolute right-0 flex h-full w-0 flex-col items-center justify-between">
        {[...Array(config.right.leds)].map((_, index) => (
          <LedShadow led={leds?.[index + config.top.leds]} key={index} />
        ))}
      </div>
      <div className="absolute bottom-0 flex h-0 w-full items-center justify-between">
        {[...Array(config.bottom.leds)].map((_, index) => (
          <LedShadow
            led={leds?.[index + config.top.leds + config.right.leds]}
            key={index}
          />
        ))}
      </div>
      <div className="absolute left-0 flex h-full w-0 flex-col items-center justify-between">
        {[...Array(config.left.leds)].map((_, index) => (
          <LedShadow
            led={
              leds?.[
                index + config.top.leds + config.right.leds + config.bottom.leds
              ]
            }
            key={index}
          />
        ))}
      </div>
      {/* Lights */}
      <div className="absolute left-[15%] flex h-0 w-[85%] items-center justify-between">
        {[...Array(config.top.leds)].map((_, index) => (
          <LedButtonIcon led={leds?.[index]} key={index} />
        ))}
      </div>
      <div className="absolute right-0 flex h-full w-0 flex-col items-center justify-between">
        {[...Array(config.right.leds)].map((_, index) => (
          <LedButtonIcon led={leds?.[index + config.top.leds]} key={index} />
        ))}
      </div>
      <div className="absolute bottom-0 flex h-0 w-full items-center justify-between">
        {[...Array(config.bottom.leds)].map((_, index) => (
          <LedButtonIcon
            led={leds?.[index + config.top.leds + config.right.leds]}
            key={index}
          />
        ))}
      </div>
      <div className="absolute left-0 flex h-full w-0 flex-col items-center justify-between">
        {[...Array(config.left.leds)].map((_, index) => (
          <LedButtonIcon
            led={
              leds?.[
                index + config.top.leds + config.right.leds + config.bottom.leds
              ]
            }
            key={index}
          />
        ))}
      </div>
    </div>
  );
};

const LedShadow = ({ led }: { led?: Led }) => {
  const hex = led?.color.getHex() ?? "#000000";
  const lightness = led?.color.getLightness() ?? 0;
  const size = (32 / 2.0) * Math.pow(lightness, 0.5);

  const [glow, setGlow] = useState(false);
  const [prevColor, setPrevColor] = useState(hex);
  useEffect(() => {
    if (prevColor !== hex) {
      setGlow(true);
      setTimeout(() => setGlow(false), 250);
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

const LedButtonIcon = ({ led }: { led?: Led }) => {
  const { leftHeld } = useMouse();
  const { activeSplotch } = useEasel();

  return (
    <div
      className="relative h-0 w-0"
      onMouseDown={() => {
        if (activeSplotch?.color) {
          led?.setColor(activeSplotch.color);
        }
      }}
      onMouseMove={() => {
        if (leftHeld && activeSplotch?.color) {
          led?.setColor(activeSplotch.color);
        }
      }}
    >
      <div className="absolute h-6 w-6 -translate-x-[50%] -translate-y-[50%] rounded-full bg-transparent" />
      <LedIcon
        className="absolute h-4 w-4 -translate-x-[50%] -translate-y-[50%] stroke-black stroke-1 transition-transform sm:h-5 sm:w-5 lg:h-7 lg:w-7"
        style={{
          color: led?.color.getHex() ?? "#000000",
        }}
        onDragStart={() => false}
      />
    </div>
  );
};
