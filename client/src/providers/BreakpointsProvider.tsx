import { useMediaQuery } from "react-responsive";
import { BreakpointsContext } from "../contexts/BreakpointsContext";
import { useMemo } from "react";

export default function BreakpointsProvider({
  children,
}: React.PropsWithChildren) {
  // tailwind defaults, would like to load these from config but since v4
  // tailwind just has a css file.
  const sm = useMediaQuery({ query: "(min-width: 640px)" });
  const md = useMediaQuery({ query: "(min-width: 768px)" });
  const lg = useMediaQuery({ query: "(min-width: 1024px)" });
  const xl = useMediaQuery({ query: "(min-width: 1280px)" });
  const xxl = useMediaQuery({ query: "(min-width: 1536px)" });

  const value = useMemo(
    () => ({
      sm,
      md,
      lg,
      xl,
      xxl,
    }),
    [sm, md, lg, xl, xxl],
  );

  return (
    <BreakpointsContext.Provider value={value}>
      {children}
    </BreakpointsContext.Provider>
  );
}
