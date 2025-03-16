import { Layer, Image, Rect, Group, Circle } from "react-konva";
import { ResponsiveStage } from "./components/ResponsiveStage";
import useImage from "use-image";
import { useLeds } from "./contexts/LedContext";
import { useEasel } from "./contexts/EaselContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMouse } from "./contexts/MouseContext";
import { Portal } from "react-konva-utils";
import Konva from "konva";

export type CanvasConfig = {
  width: number;
  height: number;
  ledSize: number;
  margin?: number;
  topConfig: CanvasWallConfig;
  rightConfig: CanvasWallConfig;
  bottomConfig: CanvasWallConfig;
  leftConfig: CanvasWallConfig;
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

const canvasConfig: CanvasConfig = {
  width: 960,
  height: 640,
  ledSize: 24,
  margin: 12,
  topConfig: {
    leds: 38,
    startOffsetPercent: 20,
  },
  rightConfig: {
    leds: 32,
  },
  bottomConfig: {
    leds: 49,
  },
  leftConfig: {
    leds: 31,
  },
} as const;

const calculateSpacing = (length: number, size: number, count: number) =>
  (length - size) / count;

export const LedCanvas = () => {
  // Stick this rendering in an async function...
  // Apparently react just works with promises! Which is awesome!
  const renderLeds = useMemo(() => {
    // God, I am so sorry for the sins you are about to witness below...
    const {
      width,
      height,
      ledSize,
      margin: maybeMargin,
      topConfig,
      rightConfig,
      bottomConfig,
      leftConfig,
    } = canvasConfig;

    const margin = maybeMargin ?? 0;
    const doubleMargin = margin * 2;

    const topRatio = 1 - (topConfig.startOffsetPercent ?? 0) / 100;
    const topWidth = (width - doubleMargin) * topRatio;
    const topSpacing = calculateSpacing(topWidth, ledSize, topConfig.leds);
    const rightSpacing = calculateSpacing(
      height - doubleMargin,
      ledSize,
      rightConfig.leds,
    );
    const bottomSpacing = calculateSpacing(
      width - doubleMargin,
      ledSize,
      bottomConfig.leds,
    );
    const leftSpacing = calculateSpacing(
      height - doubleMargin,
      ledSize,
      leftConfig.leds,
    );

    return async () => (
      <Layer>
        {[...Array(topConfig.leds)].map((_, index) => (
          <LedButton
            key={index}
            index={index}
            size={ledSize}
            x={
              margin +
              (index + 1) * topSpacing +
              (width - doubleMargin) * (1 - topRatio)
            }
            y={margin}
          />
        ))}
        {/* Note that none of the other sides are handling the offset ratio... */}
        {[...Array(rightConfig.leds)].map((_, index) => (
          <LedButton
            key={index}
            index={index + topConfig.leds}
            size={ledSize}
            x={width - ledSize - margin}
            y={-1 + margin + (index + 1) * rightSpacing}
          />
        ))}
        {[...Array(bottomConfig.leds)].map((_, index) => (
          <LedButton
            key={index}
            index={index + topConfig.leds + rightConfig.leds}
            size={ledSize}
            y={height - ledSize - margin}
            x={1 + -margin + width - ledSize + (index + 1) * -bottomSpacing}
          />
        ))}
        {[...Array(leftConfig.leds)].map((_, index) => (
          <LedButton
            key={index}
            index={
              index + topConfig.leds + rightConfig.leds + bottomConfig.leds
            }
            size={ledSize}
            x={margin}
            y={1 + -margin + height - ledSize + (index + 1) * -leftSpacing}
          />
        ))}
        <Group
          name="hue-group"
          globalCompositeOperation="source-atop"
          opacity={0.5}
        />
        <Group
          name="top-group"
          globalCompositeOperation="source-over"
          opacity={0.5}
        />
      </Layer>
    );
  }, []);

  return (
    <div className="w-full border-1 bg-[url(/room.jpg)] bg-cover bg-center">
      <ResponsiveStage
        width={canvasConfig.width}
        height={canvasConfig.height}
        className="max-w-8xl mx-auto w-full"
      >
        <Layer name="glow-layer" listening={false} />
        <Layer name="outline-layer" listening={false} />
        {renderLeds()}
      </ResponsiveStage>
    </div>
  );
};

const LedButton = ({
  index,
  size,
  x,
  y,
}: {
  index: number;
  size: number;
  x: number;
  y: number;
}) => {
  const [lightBulbImage] = useImage("/light-bulb.svg");
  const { leftHeld } = useMouse();
  const { activeSplotch } = useEasel();
  const { leds } = useLeds();

  const { led, ledHex, lightness } = useMemo(() => {
    const led = leds?.at(index);
    const color = led?.color;
    const ledHex = color?.getHex();
    const lightness = color?.getLightness() ?? 0;

    return { led, ledHex, lightness };
  }, [leds, index]);

  const ref = useRef<Konva.Circle>(null);
  const glowCircleRef = useRef<Konva.Circle>(null);

  const handlePaintStart = useCallback(() => {
    if (activeSplotch && led) {
      led.setColor(activeSplotch.color);
    }
  }, [activeSplotch, led]);

  const handlePaint = useCallback(() => {
    if (leftHeld) {
      handlePaintStart();
    }
  }, [handlePaintStart, leftHeld]);

  const handleMouseEnter = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent>) => {
      handlePaint();

      const container = event.target.getStage()?.container();
      if (container) {
        container.style.cursor = "pointer";
      }
    },
    [handlePaint],
  );

  const handleMouseLeave = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent>) => {
      const container = event.target.getStage()?.container();
      if (container) {
        container.style.cursor = "default";
      }
    },
    [],
  );

  const handleMouseDown = useCallback(() => {
    handlePaintStart();
  }, [handlePaintStart]);

  const [previousHex, setPreviousHex] = useState<string>();
  useEffect(() => {
    const baseRadius = (size / 2.0) * Math.pow(lightness, 0.5);

    if (previousHex !== ledHex) {
      const glowCircle = glowCircleRef.current;
      if (glowCircle) {
        glowCircle.to({
          width: baseRadius * 6,
          height: baseRadius * 6,
          duration: 0.1,
          onFinish: () =>
            glowCircle.to({
              width: baseRadius * 4,
              height: baseRadius * 4,
              duration: 0.3,
            }),
        });
      }

      setPreviousHex(ledHex);
    }
  }, [ledHex, previousHex, size, lightness]);

  return (
    <>
      <Portal selector=".glow-layer">
        <Circle
          ref={glowCircleRef}
          // We don't actually care about drawing the circle,
          // just the "shadow". So this is just to draw it off screen.
          x={-size}
          y={-size}
          shadowOffsetX={x + size + size / 2}
          shadowOffsetY={y + size + size / 2}
          // radius is controlled by use effect
          fill="#ffffff"
          shadowEnabled={true}
          shadowBlur={48}
          shadowColor={ledHex}
          listening={false}
        />
      </Portal>
      <Portal selector=".outline-layer">
        <Image
          image={lightBulbImage}
          width={size + 2}
          height={size + 2}
          x={-size}
          y={-size}
          shadowOffsetX={x - 1 + size}
          shadowOffsetY={y - 1 + size}
          shadowColor="black"
          opacity={1.0}
          shadowBlur={0.0}
          listening={false}
        />
      </Portal>
      <Image image={lightBulbImage} width={size} height={size} x={x} y={y} />
      <Portal selector=".hue-group">
        <Rect
          fill={ledHex ?? "000000"}
          width={size}
          height={size}
          x={x}
          y={y}
          listening={false}
        />
      </Portal>
      <Portal selector=".top-group">
        <Circle
          ref={ref}
          stroke={"ff0000"}
          strokeWidth={0}
          x={x + size / 2}
          y={y + size / 2}
          radius={size / 1.5}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handlePaintStart}
          onPointerEnter={handlePaint}
          listening={true}
        />
      </Portal>
    </>
  );
};
