// Import Dependencies
//import { Link } from "react-router";
//import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";

// Import Dependencies
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";

// Local Imports
import Logo from "assets/appLogo.svg?react";
import { Button, Card, Checkbox, InputErrorMsg } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { schema } from "./schema";
import { Page } from "components/shared/Page";

import { useDisclosure } from "hooks";



// ----------------------------------------------------------------------

export default function SignIn() {
  const [ isOpen, { open, close } ] = useDisclosure(false);
  const { login, errorMessage } = useAuthContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "user",
      password: "pass",
      agree: false,
    },
  });

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const str = urlParams.get('r');

  function isValidETHAddress(str) {
    // Regex to check valid
    let regex = new RegExp(/^(0x)?[0-9a-fA-F]{40}$/);
 
    // if str
    // is empty return false
    if (str == null) {
        return "False";
    }
 
    // Return true if the str
    // matched the ReGex
    if (regex.test(str) == true) {
        return true;
    }
    else {
        return false;
    }
  }

  async function referral(str) {
    const dynamicPattern = isValidETHAddress(str);
    if (typeof str === "string" && str.trim() !== "" && dynamicPattern) {
      localStorage.setItem("validReferral", str);
      alert(str);
    } else {
      localStorage.removeItem("validReferral");
    }
  };

  const onSubmit = (data) => {
    if (!data.agree || data.agree=='false') {
      alert("You must agree to the terms and conditions.");
      return;
    }
    login({
      username: data.username,
      password: data.password,
    });
    referral(str)
  };

  return (
    <Page title="Login">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-dark-100">
                CrowdVault
              </h2>
              <p className="text-gray-400 dark:text-dark-300">
              The crypto community helping system
              </p>
            </div>
          </div>
          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="mt-2">
                <InputErrorMsg
                  when={errorMessage && errorMessage?.message !== ""}
                >
                  {errorMessage?.message}
                </InputErrorMsg>
              </div>
              <div className="mt-4 items-center space-x-5">
                <Checkbox label="I Agree Terms and Conditions" {...register("agree", { required: true })}
                error={errors?.agree?.message}
                />
              </div>
              <Button type="submit" className="mt-5 w-full" color="primary">
                Connect Wallet
              </Button>
            </form>
          </Card>
          <div className="mt-8 flex justify-center text-xs text-gray-400 dark:text-dark-300">
            <a href="##">Privacy Notice</a>
            <div className="mx-2.5 my-0.5 w-px bg-gray-200 dark:bg-dark-500"></div>
            <a href="##" onClick={open}>Term &amp; Condition</a>
          </div>
        </div>
      </main>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
          onClose={close}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur transition-opacity dark:bg-black/40" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogPanel className="scrollbar-sm relative flex max-w-md flex-col overflow-y-auto rounded-lg bg-white px-4 py-10 text-center transition-opacity duration-300 dark:bg-dark-700 sm:px-5">
              <ExclamationTriangleIcon className="mx-auto inline size-28 shrink-0 text-warning" />
              <div className="mt-4">
                <DialogTitle
                  as="h3"
                  className="text-2xl text-gray-800 dark:text-dark-100"
                >
                  CrowdVault Terms and Conditions
                </DialogTitle>

                <div className="mt-2 text-left">
                
                <div className="modal">
                  Last Updated: [October 23, 2025]<br/><br/>
                  <div className="terms-content space-y-5">

                  </div>
                </div>

                </div>
                <Button onClick={close} color="success" className="mt-6">
                  Close
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </Page>
    
  );
}
