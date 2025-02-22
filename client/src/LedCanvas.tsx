import { Layer, Image, Rect, Group, Circle } from "react-konva";
import { ResponsiveStage } from "./components/ResponsiveStage";
import useImage from "use-image";
import { useLeds } from "./contexts/LedContext";
import { useEasel } from "./contexts/EaselContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMouse } from "./contexts/MouseContext";
import { Portal } from "react-konva-utils";
import Konva from "konva";

export const LedCanvas = () => {
  const horizontalLeds = 50;
  const verticalLeds = 25;
  const ledSize = 24;

  const canvasWidth = 960;
  const canvasHeight = 540;

  const ledHorizontalSpacing = Math.floor(
    (canvasWidth - ledSize) / (horizontalLeds - 1)
  );
  const ledVerticalSpacing = Math.floor(
    (canvasHeight - ledSize) / (verticalLeds - 1)
  );

  const unusedWidth =
    canvasWidth - ledSize - ledHorizontalSpacing * (horizontalLeds - 1);
  const unusedHeight =
    canvasHeight - ledSize - ledVerticalSpacing * (verticalLeds - 1);
  return (
    <div className="w-full border-white border-3 rounded-xl bg-stone-800 shadow-lg">
      <ResponsiveStage
        width={canvasWidth}
        height={canvasHeight}
        className="w-full max-w-8xl mx-auto"
      >
        <Layer name="glow-layer" />
        <Layer>
          <Group>
            {[...Array(horizontalLeds - 1)].map((_, index) => (
              <LedButton
                key={index}
                index={index}
                size={ledSize}
                x={(index + 1) * ledHorizontalSpacing + unusedWidth / 2}
                y={unusedHeight / 2}
              />
            ))}
            {[...Array(verticalLeds - 1)].map((_, index) => (
              <LedButton
                key={index}
                index={index + horizontalLeds - 1}
                size={ledSize}
                x={canvasWidth - ledSize - unusedWidth / 2}
                y={(index + 1) * ledVerticalSpacing + unusedHeight / 2}
              />
            ))}
            {[...Array(horizontalLeds - 1)].map((_, index) => (
              <LedButton
                key={index}
                index={index + horizontalLeds + verticalLeds - 2}
                size={ledSize}
                x={
                  canvasWidth -
                  ledSize -
                  (index + 1) * ledHorizontalSpacing -
                  unusedWidth / 2
                }
                y={canvasHeight - ledSize - unusedHeight / 2}
              />
            ))}
            {[...Array(verticalLeds - 1)].map((_, index) => (
              <LedButton
                key={index}
                index={
                  index + horizontalLeds + verticalLeds + horizontalLeds - 3
                }
                size={ledSize}
                x={unusedWidth / 2}
                y={
                  canvasHeight -
                  ledSize -
                  (index + 1) * ledVerticalSpacing -
                  unusedHeight / 2
                }
              />
            ))}
            <Group name="hue-group" globalCompositeOperation="source-atop" />
          </Group>
        </Layer>
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

  const [previousHex, setPreviousHex] = useState<string>();
  useEffect(() => {
    const baseRadius = (size / 2.0) * Math.pow(lightness, 0.5);

    if (previousHex !== ledHex) {
      const glowCircle = glowCircleRef.current;
      if (glowCircle) {
        glowCircle.to({
          width: baseRadius * 4,
          height: baseRadius * 4,
          duration: 0,
          onFinish: () =>
            glowCircle.to({
              width: baseRadius * 2,
              height: baseRadius * 2,
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
          onMouseDown={handlePaintStart}
          onMouseEnter={handlePaint}
          onTouchStart={handlePaintStart}
          onPointerEnter={handlePaint}
        />
      </Portal>
    </>
  );
};
