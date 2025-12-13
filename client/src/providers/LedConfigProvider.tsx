import { PropsWithChildren, useMemo, useState } from "react";
import {
  LedConfigContext,
  ledConfigEntries,
  LedConfigLabel,
} from "../contexts/LedConfigContext";

export type LedConfigProviderProps = {
  initial: LedConfigLabel;
};

export const LedConfigProvider = ({
  initial,
  children,
}: PropsWithChildren<LedConfigProviderProps>) => {
  const [label, setLabel] = useState(initial);

  const ledConfig = useMemo(() => {
    const entry = ledConfigEntries[label];

    return {
      label,
      ...entry,
    };
  }, [label]);

  return (
    <LedConfigContext.Provider
      value={{
        setLedConfig: setLabel,
        ledConfig,
      }}
    >
      {children}
    </LedConfigContext.Provider>
  );
};
