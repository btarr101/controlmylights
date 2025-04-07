import { createContext, useContext } from "react";

export const orderedBreakpoints = [
	"xxl", "xl", "lg", "md", "sm",
] as const;

type Breakpoint = typeof orderedBreakpoints[number];

export type BreakpointsState = Record<Breakpoint, boolean>;

export const BreakpointsContext = createContext<BreakpointsState>({
	sm: false,
	md: false,
	lg: false,
	xl: false,
	xxl: false,
});

export const useBreakpoints = () => useContext(BreakpointsContext);
