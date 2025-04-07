import Color from "ts-color-class";
import { Splotch, useEasel } from "../../contexts/EaselContext";
import { HexColorPicker } from "react-colorful";
import { useMemo } from "react";
import _ from "lodash";
import "./LedEasel.css";

export const LedEasel = () => {
  const { activeSplotch, splotches } = useEasel();

  const splotchesPerRow = useMemo(
    () => Math.round(Math.sqrt(splotches.length)),
    [splotches],
  );

  return (
    activeSplotch && (
      <div className="flex flex-row items-center md:flex-col">
        <HexColorPicker
          className="border-1 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
          color={activeSplotch.color.getHex()}
          onChange={(hex) => activeSplotch.setColor(new Color(hex))}
        />
        <div className="flex flex-col justify-center space-y-6 p-6">
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
    <div className="flex h-9 w-9 items-center justify-center">
      <button
        className={`rounded-full border-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-[width,height] ${
          splotch.active ? "h-9 w-9" : "h-7 w-7 cursor-pointer"
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
    </div>
  );
};
