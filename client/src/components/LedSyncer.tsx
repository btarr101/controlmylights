import { useEffect } from "react";
import { useApi } from "../contexts/ApiContext";
import { LedData, useLeds, useLedUpdated } from "../contexts/LedContext";
import Color from "ts-color-class";
import { getLeds, LedDTO } from "../repo/api";

export const LedSyncer = () => {
  const { leds } = useLeds();

  return leds === undefined ? <LedSyncInitializer /> : <LedSyncUpdater />;
};

const transformReceivedLedDTO = ({
  color: { red, green, blue },
  last_updated: timestamp,
}: LedDTO): LedData => ({
  color: new Color(red, green, blue),
  lastUpdateTimestamp: timestamp,
  lastUpdateSource: "server",
});

const LedSyncInitializer = () => {
  const { updateLeds } = useLeds();

  useEffect(() => {
    (async () => {
      const ledDTOs = await getLeds();
      updateLeds(() => ledDTOs.map(transformReceivedLedDTO));
    })();
  }, [updateLeds]);

  return null;
};

const shouldUpdateLed = (oldLed: LedData, newLed: LedData) => {
  // Newer timestamp - should update
  if (newLed.lastUpdateTimestamp >= oldLed.lastUpdateTimestamp) return true;

  // If the client set timestamp is over a second old, discard it and use the new led.
  if (
    oldLed.lastUpdateSource === "client" &&
    new Date().getTime() - oldLed.lastUpdateTimestamp.getTime() > 1000
  )
    return true;

  return false;
};

const LedSyncUpdater = () => {
  const { latestReceivedLeds, sendLedUpdate } = useApi();
  const { updateLeds } = useLeds();

  useEffect(() => {
    if (latestReceivedLeds) {
      updateLeds((oldLeds) =>
        latestReceivedLeds.map((ledDTO, index) => {
          const oldLed = oldLeds?.[index];
          const newLed = transformReceivedLedDTO(ledDTO);

          if (!oldLed) return newLed;

          const shouldUpdate = shouldUpdateLed(oldLed, newLed);

          return shouldUpdate ? newLed : oldLed;
        }),
      );
    }
  }, [latestReceivedLeds, updateLeds]);

  useLedUpdated(({ index, color }) => {
    sendLedUpdate({ id: index, color });
  });

  return null;
};
