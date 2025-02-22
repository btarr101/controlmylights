import Color from "ts-color-class";
import { Splotch, useEasel } from "./contexts/EaselContext";
import { HexColorPicker } from "react-colorful";
import { useMemo } from "react";
import _ from "lodash";

export const LedEasel = () => {
  const { activeSplotch, splotches } = useEasel();

  const splotchesPerRow = useMemo(
    () => Math.round(Math.sqrt(splotches.length)),
    [splotches]
  );

  return (
    activeSplotch && (
      <div className="flex flex-col items-center">
        <HexColorPicker
          className="border-3 border-white shadow-md rounded-xl"
          color={activeSplotch.color.getHex()}
          onChange={(hex) => activeSplotch.setColor(new Color(hex))}
        />
        <div className="flex flex-col space-y-6 justify-center p-6">
          {_.chunk(splotches, splotchesPerRow).map((splotchRow, key) => (
            <div key={key} className="flex space-x-6">
              {splotchRow.map((splotch, key) => (
                <SplotchButton key={key} splotch={splotch} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  );
};

type SplotchButtonProps = {
  splotch: Splotch;
};

const SplotchButton = ({ splotch }: SplotchButtonProps) => {
  return (
    <button
      className={`w-7 h-7 rounded-full border-2 border-white shadow-md transition-transform ${
        splotch.active ? "scale-125" : ""
      }`}
      style={{
        backgroundColor: splotch.color.getHex(),
      }}
      onClick={() => {
        if (!splotch.active) {
          splotch.use();
        }
      }}
    ></button>
  );
};
