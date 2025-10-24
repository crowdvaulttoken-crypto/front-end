import { Page } from "components/shared/Page";
import { useNavigate } from "react-router";
import { useSmartContract } from "../../../../hooks/useSmartContract";
import { useEffect, useState } from "react";
import { Button, Input, InputErrorMsg } from "components/ui";
import { useForm } from "react-hook-form";
import { Delayed } from "components/shared/Delayed";
import { BellAlertIcon } from "@heroicons/react/24/solid";

import { Transition } from "@headlessui/react";
import { Fragment } from "react"

// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function Activate() {
  const navigate = useNavigate();
  const {
    address,
    bnbBalance,
    usdtBalance,
    rewardsBalance,
    affiliateData,
    registrationFee,
    upgradeAmount,
    lastCallTime,
    registerWallet,
    activateWithDeposit,
    activateWithWallet,
    availablePassive
  } = useSmartContract();  

  const isRegistered = affiliateData.parent=='0x0000000000000000000000000000000000000000'?false:true;
  const nextUpgradeAmount = upgradeAmount;
  const nextRank = affiliateData.level<10?parseInt(affiliateData.level) + 1:10; 
  const [yourwalletaddress,setYourWalletAddress] = useState(address);
  const [referralWallet,setReferralWallet] = useState("");
  //const [openCountry,setOpenCountry] = useState([]);
  const [inputErrors,setinputErrors] = useState("");
  const [isOpen, { open, close }] = useDisclosure(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [customError, setCustomError] = useState(false);
  const [transaction,setTransaction] = useState('register');
  const [isOpen2, handler2] = useDisclosure(true);
  const state = error ? "error" : success ? "success" : "pending";
  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: ` Send request `,
      description:"Click ok to confirm request.",
      actionText: "Ok",
    },
    success: {
      title: "Request Processing",
      description:"Activation Completed",
    },
    error: {
      description: customError.length>0? `${customError}` :  `Ensure internet is on and retry. Contact support if issue remains.`,
    },
  };

  useEffect(() => {
    async function init() {
      setYourWalletAddress(address);
      setReferralWallet(referralWallet);
      setinputErrors(inputErrors);
      setTransaction(transaction);
      if( isOpen==false ){
        setConfirmLoading(false);
      }
    }
    init();
  },[isOpen,address,transaction,inputErrors,referralWallet]);  

  var currentTime = Math.floor(Date.now() / 1000);
  const onOk = async () => {
    setConfirmLoading(true);
    if( currentTime < parseInt(lastCallTime)+60 ){
      setCustomError('60 Seconds CoolDown. Try Again Later');
      setConfirmLoading(false);
      setSuccess(false);
      setError(true);
      return;
    }
    var hash = false;
    if( transaction=='register' ){
      if(parseFloat(usdtBalance) < 10 ) { 
        setCustomError('You must have at least 10 USDT');
        setConfirmLoading(false);
        setSuccess(false);
        setError(true);
        return;
      }
      hash = await registerWallet(referralWallet);
      if( !hash ) setCustomError('Failed to register');
    }
    if( transaction=='activatebyusdt' ){
      if( parseFloat(usdtBalance) < parseFloat(nextUpgradeAmount) ) { 
        setCustomError(`You must have at least ${nextUpgradeAmount} USDT `);
        setConfirmLoading(false);
        setSuccess(false);
        setError(true);
        return;
      }      
      hash =  await  activateWithDeposit();
      if( !hash ) setCustomError('Failed to deposit');
    }
    if( transaction=='activatebywallet' ){
      if( parseFloat(rewardsBalance) < parseFloat(nextUpgradeAmount) ) { 
        setCustomError(`You must have at least ${rewardsBalance} < ${nextUpgradeAmount} USDT `);
        setConfirmLoading(false);
        setSuccess(false);
        setError(true);
        return;
      }   
      hash = await activateWithWallet();
      if( !hash ) setCustomError('Failed to deduct balance');
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
 
  const formOption = {
    yourwalletaddress: { required: `Your wallet is required` },
    referralWallet: { 
      required: `Referral wallet is required`, 
      pattern: {
        value: /^0x[a-fA-F0-9]{40}$/i,
        message: `Invalid Wallet Address`,
      },
    }
  };
  
  const onSubmit = async (data) => {
    console.log(data)
    setReferralWallet(data.referralWallet)
    setSuccess(false);
    setError(false);
    open();
  };

  return (
    <Page title="Join and Activate">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="grid grid-cols-3 gap-4 min-w-0 mb-5 p-5">
            <Button className="mt-5">BNB {parseFloat(bnbBalance).toFixed(4)}</Button>
            <Button className="mt-5">USDT {parseFloat(usdtBalance).toFixed(2)}</Button>
            <Button className="mt-5">Rewards {parseFloat(rewardsBalance).toFixed(2)}</Button>
          </div>
          
          <Delayed wait={3000}>
          { !isRegistered ?
            <>
            <div className="mt-5 grid grid-cols-1 gap-4 px-4 sm:grid-cols-1 sm:px-5 text-gray-900 dark:text-dark-100">
              <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
                <p className="text-xl uppercase font-medium"> Register Your Account  </p>
                <div className="flex items-end justify-between space-x-2 ">
                  <div className="mt-4 text-s font-medium text-gray-900 dark:text-dark-100 ">
                  <p><strong>Info: </strong> Register your wallet to join our community.</p>
                  <p><strong>About: </strong>You will create an account, network, and wallet.</p>
                  <p><strong>Benefits: </strong>You will get the privillege to earn rewards by joining the programs.</p>
                  <p><strong>Requirements: </strong>To register you need a wallet address and valid sponsor.</p>
                  <p><strong>Fees:</strong> You need {registrationFee} USDT and eno ugh BNB balance for registrations.</p>          
                  </div>
                </div>
                <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-white/20 text-center p-5"></div>
              </div>
            </div>
            <div className="card mt-5 mb-10 p-5">
              <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                <div className="w-full mb-5">
                  <Input
                    name="yourwalletaddress"
                    label="Your Wallet Address"
                    placeholder="Enter Wallet Address"
                    value={yourwalletaddress || ''}
                    description="Your recognize wallet address."
                    onChange={(event) => setYourWalletAddress(event.target.value)}
                    readOnly
                  />
                </div>
                <div className="w-full mb-5">
                  <Input
                    name="referralWallet"
                    label="Referral Wallet"
                    placeholder="Enter Wallet Address"
                    description="Referral Wallet Address."
                    onChange={(event) => { setReferralWallet(event.target.value); }}
                    {...register("referralWallet", formOption.referralWallet)}
                    error={errors?.referralWallet && errors.referralWallet.message}
                  />
                </div>
                <div className="mt-2">
                  <InputErrorMsg 
                    when={inputErrors && inputErrors?.message !== ""}
                  >
                    {inputErrors}
                  </InputErrorMsg>
                </div>
                <div className="w-full">
                    <Button type="submit" className="mt-5 w-full" color="primary">
                      REGISTER
                    </Button>
                </div>
              </form>
            </div>   
            </> 
            :
            <div className="card mt-5 mb-10 p-5">
                <div className="mt-2">
                  <InputErrorMsg 
                    when={inputErrors && inputErrors?.message !== ""}
                  >
                    {inputErrors}
                  </InputErrorMsg>
                </div>

                {availablePassive>0 ? 
                <Transition
                  as={Fragment}
                  show={isOpen2}
                  leave="duration-200 transition ease-in-out"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div
                    role="alert"
                    className="flex flex-col items-center space-y-4 rounded-lg border border-primary-200 p-4 mb-5 text-primary-800 dark:border-primary-450 dark:text-dark-100 sm:flex-row sm:space-x-2 sm:space-y-0 rtl:sm:space-x-reverse"
                  >
                    <span className="flex-1 text-center sm:text-start">
                      You have available {parseInt(availablePassive)} passive rewards.
                    </span>
                    <Button
                      onClick={handler2.close}
                      color="primary"
                      className="animate-pulse space-x-2 rounded-full uppercase "
                    >
                      <BellAlertIcon className="size-4" />
                      <span>Collect before upgrade!</span>
                    </Button>
                  </div>
                </Transition>
                :""}

                <div className="hide-scrollbar min-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-500 p-5">
                  <table className="table-auto w-full text-left rtl:text-right">
                    <thead>
                      <tr className="font-semibold uppercase text-gray-800 dark:text-dark-100">
                        <th>Activation Details</th>
                        <th>Percent</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Rank {nextRank}</td>
                        <td>{nextUpgradeAmount} USDT</td>
                      </tr>
                      <tr>
                        <td>Referral Rewards</td>
                        <td>10%</td>
                      </tr>
                      <tr>
                        <td>Over-Ride Rewards Level 1</td>
                        <td>10%</td>
                      </tr>
                      <tr>
                        <td>Over-Ride Rewards Level 2</td>
                        <td>10%</td>
                      </tr>
                      <tr>
                        <td>Over-Ride Rewards Level 3</td>
                        <td>10%</td>
                      </tr> 
                      <tr className="font-semibold uppercase text-gray-800 dark:text-dark-100">
                        <td>24 Hours Passive Rewards</td>
                        <td>UP 1% - 3%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-2 px-0 sm:grid-cols-2 sm:px-2">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-1">
                    <Button className="w-full" 
                    onClick={() => {
                      setTransaction('activatebyusdt')
                      setSuccess(false);
                      setError(false);
                      open();
                    }} >Activate By USDT Balance</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-1">
                    <Button className="w-full" 
                      onClick={() => {
                        setTransaction('activatebywallet')
                        setSuccess(false);
                        setError(false);
                        open();
                      }} >Activate By Rewards Balance</Button>
                  </div>                  
                </div>              
            </div>
          }
          </Delayed>
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

export function Broker() {
  const navigate = useNavigate();
  const {
    address,
    brokerFee,
    WNTradesContract,
    activateBroker,
    convertWeiToEther
  } = useSmartContract(); 

  //const [yourwalletaddress,setYourWalletAddress] = useState(address);
  const [inputErrors,setinputErrors] = useState("");
  const [isOpen, { open, close }] = useDisclosure(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [customError, setCustomError] = useState(false);
  const [brokerData, setBrokerData] = useState([]);
  

  const state = error ? "error" : success ? "success" : "pending";
  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: ` Send request `,
      description:
        "Click ok to confirm request.",
      actionText: "Ok",
    },
    success: {
      title: "Request Processing",
      description:"Activation Completed",
    },
    error: {
      description: `${customError} Ensure internet is on and retry. Contact support if issue remains.`,
    },
  };

  useEffect(() => {
    async function init() {
      //setYourWalletAddress(address);
      if( address!=='0x0000000000000000000000000000000000000000' && WNTradesContract) {
        //var aa = await WNTradesContract.brokers(address);
        setBrokerData(await WNTradesContract.brokers(address));
      }
      setinputErrors(inputErrors);
      if( isOpen==false ){
        setConfirmLoading(false);
      }
    }
    init();
  },[address,isOpen,inputErrors,WNTradesContract]);

  const onOk = async () => {
    setConfirmLoading(true);
    var hash = false;
    hash = await activateBroker();
    if( !hash ) { 
      setCustomError('Failed to register');
    }
    if( hash==true ){
      setCustomError('Registered Complete');
      setConfirmLoading(false);
      setSuccess(true);
      setError(false);
      navigate("/dashboards/broker");
    }
    else {
      setConfirmLoading(false);
      setError(true);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  
  const onSubmit = async () => {
    console.log(`on submit:`);
    setSuccess(false);
    setError(false);
    open();
  };  
  const formOption = {
    yourwalletaddress: { required: `Your wallet is required` },
    country: { required: `Country is required` },
  };

  return (
    <Page title="Merchant Program">
      <div className="m-5">
        <div className="mt-5 grid grid-cols-1 gap-4 px-4 sm:grid-cols-1 sm:px-5">
          <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-400 to-primary-800 p-3.5">
            <p className="text-xl uppercase font-medium text-white">Country Head</p>
            <div className="flex items-end justify-between space-x-2 ">
              <p className="mt-4 text-s font-medium text-white">Enjoy all deposits under your organizations
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-5">
          <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-400 to-primary-800 p-3.5">
            <p className="text-xl uppercase font-medium text-white">Requirements</p>
            <div className="flex items-end justify-between space-x-2 ">
              <p className="mt-4 text-s font-medium text-white">{convertWeiToEther(brokerFee)} USDT</p>
              <p className="mt-4 text-s font-medium text-white">Rank 10</p>
            </div>
            <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-white/20 text-center p-5">
              <span className="text-2xl">1</span> 
            </div>
          </div>
          <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-400 to-primary-800 p-3.5">
            <p className="text-xl uppercase font-medium text-white">Country Head Incentives</p>
            <div className="flex items-end justify-between space-x-2 ">
              <p className="mt-4 text-s font-medium text-white">The country head will get 5% of the deposit and activation of accounts.
              </p>
            </div>
            <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-white/20 text-center p-5">
              <span className="text-2xl">2</span> 
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-10 p-5">
      <Delayed wait={2000}>
        { brokerData.isActive ? 
        <div className="w-full">
          <div className="mt-5 grid grid-cols-1 gap-4 px-4 sm:grid-cols-1 sm:px-5">
            <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-400 to-primary-800 p-3.5">
                <p className="text-xl uppercase font-medium text-white">MERCHANT STATUS</p>
                <p className="uppercase font-medium text-white">Merchant Fees: {(parseFloat(brokerData.fees)/100)} %  </p>
                <p className="uppercase font-medium text-white">Total Income: {(parseFloat(brokerData.totalIncome))} </p>
            </div>
          </div>
        </div>
        :
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="w-full mb-5">
            <Input
              name="yourwalletaddress"
              label="Your Wallet Address!"
              placeholder="Enter Wallet Address"
              value={address || ''}
              description="Your recognize wallet address."
              readOnly
              {...register("yourwalletaddress", formOption.yourwalletaddress)}   
              error={errors?.yourwalletaddress && errors.yourwalletaddress.message}
            />
          </div>       
          <div className="mt-2">
            <InputErrorMsg 
              when={inputErrors && inputErrors?.message !== ""}
            >
              {inputErrors}
            </InputErrorMsg>
          </div>
          <div className="w-full">
              <Button type="submit" className="mt-5 w-full" color="primary">
                ACTIVATE [{brokerData.fees}]
              </Button>
          </div>
        </form>
        }
      </Delayed>
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
