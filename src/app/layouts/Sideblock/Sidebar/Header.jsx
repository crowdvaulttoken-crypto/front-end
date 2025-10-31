// Import Dependencies
import { Link } from "react-router";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

// Local Imports
//import Logo from "assets/appLogo.svg?react";
//import LogoType from "assets/logotype.svg?react";
import { Button } from "components/ui";
import { useSidebarContext } from "app/contexts/sidebar/context";
import crowdvaultlogo from "assets/crowdvaultlogo.png?react";
import crowdvaultname from "assets/crowdvaultname.png?react";
// ----------------------------------------------------------------------

export function Header() {
  const { close } = useSidebarContext();
  return (
    <header className="relative flex h-[61px] shrink-0 items-center justify-between ltr:pl-6 ltr:pr-3 rtl:pl-3 rtl:pr-6">
      <div className="flex items-center justify-start gap-4 pt-3">
        <Link to="/">
          <img src={crowdvaultlogo} className="h-8" alt="nature image" />
        </Link>
        <img src={crowdvaultname} className="h-4" alt="nature image" />
      </div>
      <div className="pt-5 xl:hidden">
        <Button
          onClick={close}
          variant="flat"
          isIcon
          className="size-6 rounded-full"
        >
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
        </Button>
      </div>
    </header>
  );
}
