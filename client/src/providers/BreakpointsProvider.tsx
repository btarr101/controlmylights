import { useMediaQuery } from "react-responsive";
import { BreakpointsContext } from "../contexts/BreakpointsContext";
import { useMemo } from "react";

export type Breakpoints = {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
};

export default function BreakpointsProvider({
  children,
}: React.PropsWithChildren) {
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
