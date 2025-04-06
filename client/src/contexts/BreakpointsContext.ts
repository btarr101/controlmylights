import { createContext, useContext } from "react";

export type BreakpointsState = {
	sm: boolean;
	md: boolean;
	lg: boolean;
	xl: boolean;
	xxl: boolean;
};

export const BreakpointsContext = createContext<BreakpointsState>({
	sm: false,
	md: false,
	lg: false,
	xl: false,
	xxl: false,
});

export const useBreakpoints = () => useContext(BreakpointsContext);
