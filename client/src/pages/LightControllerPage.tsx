import { LedCanvas } from "../LedCanvas";
import { LedEasel } from "../LedEasel";

export const LightControllerPage = () => (
  <div className="container mx-auto my-2 flex max-w-2xl flex-1 flex-col items-center justify-evenly gap-4">
    <LedCanvas />
    <LedEasel />
  </div>
);
