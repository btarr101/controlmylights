import Konva from "konva";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Stage, StageProps } from "react-konva";
import { Stage as StageType } from "konva/lib/Stage";

export const ResponsiveStage = ({
  width: virtualWidth = 0,
  height: virtualHeight = 0,
  scaleX = 1,
  scaleY = 1,
  children,
  ...otherProps
}: StageProps & HTMLAttributes<HTMLDivElement>) => {
  const [responsiveScale, setResponsiveScale] = useState({
    x: 1,
    y: 1,
  });
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageType>(null);

  useEffect(() => {
    const handleResize = () => {
      const stageContainer = stageContainerRef.current;
      if (stageContainer) {
        const { offsetWidth } = stageContainer;
        const responsiveScaleX = offsetWidth / (virtualWidth ?? 1);
        setResponsiveScale({
          x: responsiveScaleX,
          y: responsiveScaleX,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [virtualHeight, virtualWidth]);

  const handleMouseDown = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (stage) {
        const pointerPosition = stage?.getPointerPosition();
        const intersections = stage?.getAllIntersections(pointerPosition);

        intersections?.forEach((intersection) => {
          if (event.target._id !== intersection._id) {
            intersection.fire("mousedown", {
              ...event.evt,
              target: intersection,
            });
          }
        });
      }
    },
    []
  );

  return (
    <div ref={stageContainerRef} {...otherProps}>
      <Stage
        ref={stageRef}
        className="mx-auto w-min"
        width={scaleX * responsiveScale.x * (virtualWidth ?? 0)}
        height={scaleY * responsiveScale.y * (virtualHeight ?? 0)}
        scaleX={scaleX * responsiveScale.x}
        scaleY={scaleY * responsiveScale.y}
        onMouseDown={handleMouseDown}
      >
        {children}
      </Stage>
    </div>
  );
};
