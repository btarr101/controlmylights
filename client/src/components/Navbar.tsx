import { NavLink } from "react-router";
import GithubIcon from "../assets/github-mark.svg?react";
import LedIcon from "../assets/light-bulb.svg?react";
import { useLeds } from "../contexts/LedContext";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";
import { LedShadow } from "./LedShadow";

export const Navbar = () => (
  <div className="justify-left z-10 flex items-center justify-between border-b-4 bg-white p-4">
    <div />
    <div className="flex flex-row items-center">
      <NavbarLedIcon />
      <div>
        <header className="text-center text-2xl font-bold">
          Control My Lights
        </header>
        <nav className="flex justify-items-stretch">
          {[
            { label: "Controller", path: "/" },
            { label: "Api Docs", path: "/apidocs" },
          ].flatMap(({ label, path }, index) => (
            <NavLink
              key={2 * index}
              to={path}
              end
              className={({ isActive }) =>
                `m-1 flex-1 border-1 border-black text-center transition-all ${
                  isActive
                    ? "translate-[2px] cursor-default bg-stone-200 text-black"
                    : "text-blue-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:underline"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
    <button className="border-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:cursor-pointer">
      <GithubIcon className="m-2 h-8 w-8" onDragStart={() => false} />
    </button>
  </div>
);

const NavbarLedIcon = () => {
  const { leds } = useLeds();

  const prevLedCount = useRef(leds?.length);
  const [ledIndex, setLedIndex] = useState(0);
  useLayoutEffect(() => {
    const ledCount = leds?.length ?? 0;
    if (ledCount !== prevLedCount.current) {
      prevLedCount.current = ledCount;
      setLedIndex(_.random(0, ledCount, false));
    }
  }, [leds?.length]);
  const led = useMemo(() => leds?.[ledIndex], [leds, ledIndex]);

  return (
    <div className="relative">
      <div className="absolute top-[50%] left-[50%]">
        <LedShadow led={led} sizeMultiplier={1.0} />
      </div>
      <LedIcon
        className="relative h-16 w-16 stroke-black stroke-[1px] transition-colors"
        style={{
          color: led?.color.getHex() ?? "#000000",
        }}
      />
    </div>
  );
};
