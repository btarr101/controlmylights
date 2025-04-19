import { LedCanvas } from "./LedCanvas";
import { LedEasel } from "./LedEasel";

export const LightControllerPage = () => (
  <div className="container mx-auto my-2 flex h-full max-w-3xl flex-1 touch-pinch-zoom flex-col items-center justify-evenly gap-8 px-8 py-4 md:max-w-6xl md:flex-row md:px-4">
    <LedCanvas />
    <LedEasel />
  </div>
);
