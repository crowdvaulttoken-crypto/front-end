// Local Imports
//import Logo from "assets/appLogo.svg?react";
import crowdvaultlogo from "assets/crowdvaultlogo.png?react";
import { Progress } from "components/ui";

// ----------------------------------------------------------------------

export function SplashScreen() {
  return (
    <div className="fixed grid h-full w-full place-content-center">
      <img src={crowdvaultlogo} className="mx-auto h-25 m-5" alt="Logo" />
      <Progress
        color="primary"
        isIndeterminate
        animationDuration="1s"
        className="mt-2 h-1"
      />
    </div>
  );
}
