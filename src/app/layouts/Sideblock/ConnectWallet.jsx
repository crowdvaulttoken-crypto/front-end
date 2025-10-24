// Import Dependencies
import {
    Popover,
    PopoverButton,
    PopoverPanel,
    Transition,
  } from "@headlessui/react";
  import {
    ArrowLeftStartOnRectangleIcon,Cog6ToothIcon,LinkIcon
  } from "@heroicons/react/24/outline";
import { useSmartContract } from "../../../hooks/useSmartContract";

  
  // Local Imports
  import { Button,Avatar } from "components/ui";
  import { setSession } from "utils/jwt";
  // ----------------------------------------------------------------------

  export function ConnectWallet() {
    const {
        address
      } =  useSmartContract(); 
    return (
      <Popover className="relative flex">
        <PopoverButton
            as={Button}
            variant="flat"
            isIcon
            className="relative size-9 rounded-full"
        >
            <Cog6ToothIcon className="size-6 text-gray-900 dark:text-dark-100" />
        </PopoverButton>
        <Transition
          enter="duration-200 ease-out"
          enterFrom="translate-y-2 opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="duration-200 ease-out"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="translate-y-2 opacity-0"
        >
          <PopoverPanel
            anchor={{ to: "bottom end", gap: 12 }}
            className="border-gray-150 shadow-soft dark:border-dark-600 dark:bg-dark-700 z-70 flex w-64 flex-col rounded-lg border bg-white transition dark:shadow-none"
          >
            {({ close }) => (
              <>
                <div className="flex flex-col pt-2 pb-5">
                  <div className="px-4 pt-4 flex">
                    <Avatar
                        classNames={{
                        display: "mask is-hexagon rounded-none",
                        }}
                        initialColor="success"
                    >
                        <LinkIcon className="size-4.5" />
                    </Avatar>
                    { address!='0x0000000000000000000000000000000000000000'? 
                        <Button className="w-full gap-2 flex justify-start" 
                        key='bottom'
                        data-tooltip
                        data-tooltip-content={address}
                        data-tooltip-place='bottom'
                        >
                            <span>{address.substring(0, 6)}...{address.substring(36, 42)}</span>
                        </Button>
                    :
                        <Button className="w-full gap-2 flex justify-start">
                        <LinkIcon className="size-4.5" />
                        <span>Connect Wallet</span>
                        </Button>
                    }
                  </div>
                  <div className="px-4 pt-4 flex">
                    <Avatar
                        classNames={{
                        display: "mask is-hexagon rounded-none",
                        }}
                        initialColor="error"
                    >
                        <ArrowLeftStartOnRectangleIcon className="size-4.5" />
                    </Avatar>
                    <Button className="w-full gap-2 flex justify-start"
                        onClick={() =>{
                            close
                            setSession(null);
                            location.reload();
                        }} 
                    >
                        
                        <span>Logout</span>
                    </Button>
                  </div>                  
                </div>
              </>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    );
  }
  