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
                <Checkbox label="I Agree DAO Governance Proposals" {...register("agree", { required: true })}
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
            <a href="##" onClick={open}>DAO Governance Proposals</a>
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
                <DialogTitle as="h3" className="text-2xl text-gray-800 dark:text-dark-100" >
                  CrowdVault
                </DialogTitle>
                <div className="text-md uppercase">Decentralized Autonomous Organization (DAO)</div>
                <div className="mt-2 text-left py-5">
                  <div className="modal">
                    <strong className="text-md uppercase">Last Updated:</strong> [October 31, 2025]<br/><br/>
                    <div className="terms-content space-y-5">
                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">1. Overview</div>
                      <div className="space-y-2">
                          <p>The DAO Treasury serves as the economic backbone of the decentralized ecosystem, enabling collective funding, community rewards, and sustainable liquidity management. All financial operations — including deposits, subscriptions, distributions, and withdrawals — <strong>are executed through verifiable smart contracts governed by DAO consensus.</strong></p>
                          <p>
                          <strong className="uppercase">The treasury’s primary objectives are:</strong><br/>
                          &bull; To provide transparent and decentralized financial management.<br/>
                          &bull; To support community-driven funding initiatives.<br/>
                          &bull; To ensure continuous sustainability through equitable distribution and reinvestment.
                          </p>
                      </div>                      

                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">2. Member Deposits</div>
                      <div className="space-y-2">
                          <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">2.1 Deposit Mechanism</p>
                          <p>Members may deposit funds into the DAO Treasury through approved channels or smart contracts. Deposits represent voluntary contributions that sustain the DAO ecosystem and enable participation in community and subscription rewards.</p>
                          <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">2.2 Deposit Allocation</p>
                          <p>40% of every deposit is reserved exclusively for Community Fundings, used to support approved community projects and initiatives.</p>
                          <p>The remaining balance sustains the DAO operations, subscription rewards, and liquidity for member withdrawals.</p>
                          <p>This structure ensures that a substantial portion of all deposits directly empowers community initiatives, while the remainder stabilizes operational sustainability.</p>
                      </div>

                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">3. VIP Subscription and Reward System</div>
                      <div className="space-y-2">
                          <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">3.1 Subscription Model</p>
                          <p>Members may subscribe to the DAO’s VIP tiers, granting access to enhanced earning mechanisms, governance privileges, and referral incentives.</p>
                          <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">3.2 Reward Distribution</p>
                          <p>Each VIP subscription triggers an automated smart contract distribution as follows:</p>
                          <p>10% Referral Bonus - Received everytime a direct referred members subscribe. Must have enough subscription capping to received.</p>
                          <p>15% Override Bonus - allocated 5% each to the first three qualifying ranks above the subscriber current rank.
                          Qualifiers must hold a higher rank than the subscriber to receive their respective override reward.
                          </p>
                          <p>This multi-tiered reward model promotes network expansion while ensuring fair compensation for higher-ranking contributors.</p>
                          <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">3.3 Subscription Earnings</p>
                          <p>All active VIP subscriptions generate 2% daily rewards, until the subscriber achieves a 300% maximum earning cap of the original subscription amount.
                            Once the 300% threshold is reached, the subscription concludes, Only VIP8 requiring renewal for continued participation.</p>                          
                      </div>
                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">4. Community Funding and Withdrawals</div>
                      <div className="space-y-2">
                        <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">4.1 Community Funding Access</p>
                        <p>Funds from the Community Funding Reserve (40%) are available solely for approved community initiatives.</p>
                        <p className="text-md uppercase font-semibold text-gray-600 dark:text-dark-100">4.2 Withdrawal Conditions</p>
                        <p>Community withdrawals may occur only when the Community Funding Reserve has sufficient liquidity. If funds are depleted or locked for ongoing projects, withdrawals will pause automatically until replenishment through new deposits.</p>
                        <p>This mechanism ensures the treasury remains solvent and sustainable.</p>
                      </div>
                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">5. Sustainability Framework</div>
                      <div className="space-y-2">
                        <p>The DAO’s sustainability is dependent on continuous participation and cooperative reinvestment by its members. The following guiding principles apply:</p>
                        <p><strong>1 Continuous Deposits:</strong> Regular deposits sustain the treasury’s liquidity and enable uninterrupted withdrawals and funding.</p>
                        <p><strong>2 Mutual Preservation:</strong> Members are encouraged to support one another — the DAO thrives when all participants contribute to maintaining the financial ecosystem.</p>
                        <p><strong>3 Treasury Health:</strong> Treasury metrics and smart contract reserves will be publicly visible, ensuring transparency and community oversight.</p>
                        <p>In essence, the DAO operates as a self-sustain economic ecosystem, where the community “support itself” through participation, reinvestment, and collective stewardship.</p>
                      </div>
                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">6. Governance Protocol</div>
                      <div className="space-y-2">
                        <p>All decisions regarding treasury allocations, funding approvals, and parameter adjustments are already implemented on the smart contract and being renounced.</p>
                        <p><strong>Governance ensures:</strong><br/>
                          &bull; Transparent fund allocation.<br/>
                          &bull; Continuous adaptability based on community consensus.</p>
                      </div>
                      <div className="text-lg uppercase font-semibold text-gray-600 dark:text-dark-100">7. Conclusion</div>
                      <div className="space-y-2">
                        <p>The DAO Treasury and Reward System are designed to balance growth, sustainability, and fairness. By linking deposits, subscriptions, and rewards into a decentralized financial loop, the DAO creates a self-sustaining ecosystem where all members benefit collectively.</p>
                        <p>Through transparency, governance, and cooperation, the community ensures the treasury remains strong — allowing every member to prosper as the DAO evolves.</p>
                        <p>Our DAO is more than a financial system — it is a living ecosystem of trust, cooperation, and mutual growth. Together, we preserve the treasury, empower our members, and ensure that community prosperity endures for generations.</p>
                      </div>
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
