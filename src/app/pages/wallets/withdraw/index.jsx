import { Page } from "components/shared/Page";
import { useNavigate } from "react-router";
import { useSmartContract } from "../../../../hooks/useSmartContract";
import { useEffect, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Input, Button,InputErrorMsg } from "components/ui";
import { useDisclosure } from "hooks";

export default function Home() {
  const navigate = useNavigate();
  const {
    walletData,
    withdraw
  } =  useSmartContract();  

  const [walletBalance,setWalletBalance] = useState(0);
  const [withdrawAmount,setWithdrawAmount] = useState(0);
  const [isOpen, { open, close }] = useDisclosure(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [customError, setCustomError] = useState('');
  
  const startTimestamp = parseInt(walletData.coolDown);
  const [elapsedTime, setElapsedTime] = useState(() => Math.floor(Date.now() / 1000) - startTimestamp );

  const state = error ? "error" : success ? "success" : "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: `Withdrawal Request`,
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
    else if( withdrawAmount < 5 || withdrawAmount > 100 ){
      setCustomError(`Widrawal Range Error ${withdrawAmount}`);
      
    }
    else if(walletBalance < withdrawAmount ){
      setCustomError(`Not enough rewards balance`);
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

  const onSubmit = (data) => {
    console.log(data);
    setWalletBalance(parseFloat(walletData.balance))
    setWithdrawAmount(parseFloat(data.requestAmount))
    setSuccess(false);
    setError(false);
    open();
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const minWithdrawal = 10;
  const maxWithdrawal = (parseFloat(walletData.balance))<=100? parseFloat(walletData.balance) : 100;
  const formOption = {
    requestAmount: {
      required: "Enter Amount",
      min: {
        value: `${minWithdrawal}`,
        message: `Value must not less than ${minWithdrawal}`,
      },
      max: {
        value: `${parseFloat(maxWithdrawal)}`,
        message: `Value must not greater than ${maxWithdrawal}`,
      },
    }
  };

  return (
    <Page title="Withdraw">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0 mb-10">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Withdraw
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="requestAmount">Enter the amount from {minWithdrawal} - {maxWithdrawal} CrowdVault.</label>
          <div className="mt-1.5 flex -space-x-px ">
            <Input
              placeholder="Enter amount"
              classNames={{
                root: "flex-1",
                input:
                  "relative hover:z-1 focus:z-1 ltr:rounded-r-none rtl:rounded-l-none",
              }}
              prefix={`$`}
              type="number"
              {...register("requestAmount", formOption.requestAmount)}
            />
              <Button
                color="primary"
                className="ltr:rounded-l-none rtl:rounded-r-none"
                type="submit"
              >
                Withdraw
              </Button>
          </div>
          CoolDown Timer:  {formatTime(elapsedTime)}
          <InputErrorMsg when={errors && errors?.message !== ""}>
            {errors?.requestAmount && errors.requestAmount.message}
          </InputErrorMsg>
        </form>

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