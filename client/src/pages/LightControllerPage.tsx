import { Suspense } from "react";
import { LedCanvas } from "../LedCanvas";
import { LedEasel } from "../LedEasel";

export const LightControllerPage = () => (
  <Suspense fallback={"loading"}>
    <div className="container mx-auto my-2 flex max-w-2xl flex-1 flex-col items-center justify-evenly gap-4">
      <Suspense fallback={<>Loading</>}>
        <LedCanvas />
      </Suspense>

      <LedEasel />
    </div>
  </Suspense>
);
