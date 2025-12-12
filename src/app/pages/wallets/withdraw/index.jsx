import { Page } from "components/shared/Page";
import { useNavigate } from "react-router";
import { useSmartContract } from "../../../../hooks/useSmartContract";
import { useEffect, useState,Fragment } from "react";
import { ExclamationTriangleIcon,XMarkIcon } from "@heroicons/react/24/outline";
import {ExclamationCircleIcon,} from "@heroicons/react/24/solid";
// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
import { Button } from "components/ui";
import { ImMug,ImCart } from "react-icons/im";

import { Transition } from "@headlessui/react";

export default function Home() {
  const [isOpen1, handler1] = useDisclosure(true);
  const navigate = useNavigate();
  const {
    walletData,
    withdraw,
    CrowdVaultContract
  } =  useSmartContract();  

  const [withdrawAmount,setWithdrawAmount] = useState(0);
  const [isOpen, { open, close }] = useDisclosure(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [customError, setCustomError] = useState('');
  const [customTitle, setCustomTitle] = useState('Withdrawal Request');
  
  const startTimestamp = parseInt(walletData.coolDown);
  const [elapsedTime, setElapsedTime] = useState(() => Math.floor(Date.now() / 1000) - startTimestamp );

  const state = error ? "error" : success ? "success" : "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: `${customTitle}`,
      description: "Click ok to confirm request.",
      actionText: "Ok",
    },
    success: {
      title: "Request Processing",
      description: "Thank You.",
    },
    error: {
      description: `${customError}`,
    },
  };
  
  const onOk = async () => {
    setConfirmLoading(true);
    var hash = false;
    var blockTime = Math.floor(Date.now() / 1000);
    if( ( parseInt(walletData.coolDown)+86400) > blockTime ){
      setCustomError(`24 hrs withdrawal cooldown!`);
    }
    else if( withdrawAmount < 20 || withdrawAmount > 200 ){
      setCustomError(`Widrawal Range Error ${withdrawAmount}`);
      
    }
    else if( parseInt(walletData.balance) < withdrawAmount ){
      setCustomError(`Not enough rewards balance ${parseInt(walletData.balance)}`);
    }else{
      hash = await withdraw(withdrawAmount);
      if( !hash ){ setCustomError(`Transfer Failed`); }
    }
    if( hash==true ){
      setConfirmLoading(false);
      setSuccess(true);
      setError(false);
      navigate("/dashboards");
    }
    else {
      setConfirmLoading(false);
      setError(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      setElapsedTime(now - startTimestamp);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTimestamp]);

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const [stats, setStats] = useState({"totalUsers":0,"totalAgents":0,"contractBalance":0,"_totalDeposits":0,"_totalRewardsDistributed":0,"_totalWithdrawals":0});
  useEffect(() => {
    const readContract = async () => {
        const statss = await CrowdVaultContract.getContractStats();
        setStats(statss);
    }
    if ( CrowdVaultContract && stats.totalUsers==0 ){
      readContract();
    }
    return () => {
      
    }
  }, [CrowdVaultContract,stats] );      

  return (
    <Page title="Withdraw">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">

        { stats[2]!=null && stats[2]<20 ? 
        <Transition
          as={Fragment}
          show={isOpen1}
          leave="duration-200 transition ease-in-out"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          
        >
          <div
            role="alert"
            className="this:info flex items-center space-x-2 rounded-lg border border-this-darker p-4 text-this-darker dark:border-this-lighter dark:text-this-lighter "
          >
            <ExclamationCircleIcon className="size-9" />
            <span className="flex-1">
              <strong>Announcement:</strong> Insufficient Funds for Payout

              At this time, the available funds are no longer sufficient to support ongoing payouts.
              This situation has occurred because the overall community participation and support for the project have not reached the level required to sustain the system.

              We appreciate everyone who contributed and supported the project.
              Moving forward, stronger and more consistent community engagement is essential for long-term stability and growth.
            </span>
            <div className="contents">
              <Button
                onClick={handler1.close}
                color="info"
                variant="flat"
                className="-mr-1 size-6 shrink-0 rounded-full p-0"
              >
                <XMarkIcon className="size-4" />
              </Button>
            </div>
          </div>
        </Transition>
        :<></>
        }

        <div className="py-5 text-center lg:py-6">
          <p className="text-md uppercase">Available Balance</p>
          <h3 className="mt-1 text-xl font-semibold text-gray-600 dark:text-dark-100">${parseInt(walletData.balance)}</h3>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 lg:gap-6">
          <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 text-center sm:p-5">
            <div className="mt-8">
              <ImMug className="inline size-16 text-primary-600 dark:text-primary-400"/>
            </div>
            <div className="mt-5">
              <h4 className="text-xl font-semibold text-gray-600 dark:text-dark-100">Basic</h4>
            </div>
            <div className="mt-5">
              <span className="text-4xl tracking-tight text-primary-600 dark:text-primary-400">$20</span>
            </div>
            <div className="mt-8 space-y-4 text-center">
              <Button
                color="primary" 
                onClick={() => {
                  setWithdrawAmount(20);
                  setCustomTitle('20 USDT Withdrawal');
                  setSuccess(false);
                  setError(false);
                  open();
                }} isGlow
                className="rounded-full "
              >Withdraw</Button>
            </div>
          </div>
          <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 text-center sm:p-5">
            <div className="mt-8">
              <ImCart className="inline size-16 text-primary-600 dark:text-primary-400"/>
            </div>
            <div className="mt-5">
              <h4 className="text-xl font-semibold text-gray-600 dark:text-dark-100">Needs</h4>
            </div>
            <div className="mt-5">
              <span className="text-4xl tracking-tight text-primary-600 dark:text-primary-400">$50</span>
            </div>
            <div className="mt-8 space-y-4 text-center">
              <Button
                color="primary" 
                onClick={() => {
                  setWithdrawAmount(50);
                  setCustomTitle('50 USDT Withdrawal');
                  setSuccess(false);
                  setError(false);
                  open();
                }} isGlow
                className="rounded-full "
              >Withdraw</Button>
            </div>
          </div>
          <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 text-center sm:p-5">
            <div className="mt-8">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="inline size-16 text-primary-600 dark:text-primary-400" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M480 192H365.71L260.61 8.06A16.014 16.014 0 0 0 246.71 0h-65.5c-10.63 0-18.3 10.17-15.38 20.39L214.86 192H112l-43.2-57.6c-3.02-4.03-7.77-6.4-12.8-6.4H16.01C5.6 128-2.04 137.78.49 147.88L32 256 .49 364.12C-2.04 374.22 5.6 384 16.01 384H56c5.04 0 9.78-2.37 12.8-6.4L112 320h102.86l-49.03 171.6c-2.92 10.22 4.75 20.4 15.38 20.4h65.5c5.74 0 11.04-3.08 13.89-8.06L365.71 320H480c35.35 0 96-28.65 96-64s-60.65-64-96-64z"></path></svg>
            </div>
            <div className="mt-5">
              <h4 className="text-xl font-semibold text-gray-600 dark:text-dark-100">Wants</h4>
            </div>
            <div className="mt-5">
              <span className="text-4xl tracking-tight text-primary-600 dark:text-primary-400">$100</span>
            </div>
            <div className="mt-8 space-y-4 text-center">
              <Button
                color="primary" 
                onClick={() => {
                  setWithdrawAmount(100);
                  setCustomTitle('100 USDT Withdrawal');
                  setSuccess(false);
                  setError(false);
                  open();
                }} isGlow
                className="rounded-full "
              >Withdraw</Button>
            </div>
          </div>
          <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 text-center sm:p-5">
            <div className="mt-8">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="inline size-16 text-primary-600 dark:text-primary-400" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M499.99 176h-59.87l-16.64-41.6C406.38 91.63 365.57 64 319.5 64h-127c-46.06 0-86.88 27.63-103.99 70.4L71.87 176H12.01C4.2 176-1.53 183.34.37 190.91l6 24C7.7 220.25 12.5 224 18.01 224h20.07C24.65 235.73 16 252.78 16 272v48c0 16.12 6.16 30.67 16 41.93V416c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-32h256v32c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-54.07c9.84-11.25 16-25.8 16-41.93v-48c0-19.22-8.65-36.27-22.07-48H494c5.51 0 10.31-3.75 11.64-9.09l6-24c1.89-7.57-3.84-14.91-11.65-14.91zm-352.06-17.83c7.29-18.22 24.94-30.17 44.57-30.17h127c19.63 0 37.28 11.95 44.57 30.17L384 208H128l19.93-49.83zM96 319.8c-19.2 0-32-12.76-32-31.9S76.8 256 96 256s48 28.71 48 47.85-28.8 15.95-48 15.95zm320 0c-19.2 0-48 3.19-48-15.95S396.8 256 416 256s32 12.76 32 31.9-12.8 31.9-32 31.9z"></path></svg>
            </div>
            <div className="mt-5">
              <h4 className="text-xl font-semibold text-gray-600 dark:text-dark-100">Dreams</h4>
            </div>
            <div className="mt-5">
              <span className="text-4xl tracking-tight text-primary-600 dark:text-primary-400">$200</span>
            </div>
            <div className="mt-8 space-y-4 text-center">
              <Button
                color="primary" 
                onClick={() => {
                  setWithdrawAmount(200);
                  setCustomTitle('200 USDT Withdrawal');
                  setSuccess(false);
                  setError(false);
                  open();
                }} isGlow
                className="rounded-full "
              >Withdraw</Button>
            </div>
          </div>          
        </div>
        <div className="py-5 text-center lg:py-6">
          <p className="text-lg uppercase">Cool Down</p>
          <p className="text-xl uppercase"> {formatTime(elapsedTime)}</p>
        </div>

      </div>

      <ConfirmModal
        show={isOpen}
        onClose={close}
        messages={messages}
        onOk={onOk}
        confirmLoading={confirmLoading}
        state={state}
      />      
    </Page>
  );
}