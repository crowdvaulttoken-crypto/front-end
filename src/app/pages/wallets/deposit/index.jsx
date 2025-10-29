import { Page } from "components/shared/Page";
import { useNavigate } from "react-router";
import { useSmartContract } from "../../../../hooks/useSmartContract";
import {  useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import { Input, Button,InputErrorMsg } from "components/ui";
import { useDisclosure } from "hooks";

export default function Home() {
  const navigate = useNavigate();
  const {
    usdtBalance,
    walletData,
    deposit
  } =  useSmartContract();  

  const [depositAmount,setDepositAmount] = useState(0);
  const [isOpen, { open, close }] = useDisclosure(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [customError, setCustomError] = useState('');
   
  const state = error ? "error" : success ? "success" : "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: `Deposit Call`,
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
      //setCustomError(`24 hrs withdrawal cooldown!`);
    }
    if( usdtBalance < depositAmount ){
      setCustomError(`No enough USDT Balance ${depositAmount}`);
    }else{
      hash = await deposit(depositAmount);
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

  const onSubmit = (data) => {
    console.log(data);
    setDepositAmount(parseInt(data.requestAmount))
    setSuccess(false);
    setError(false);
    open();
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const minDeposit = 10;
  const formOption = {
    requestAmount: {
      required: "Enter Amount",
      min: {
        value: `${minDeposit}`,
        message: `Value must not less than ${minDeposit}`,
      },
    }
  };

  return (
    <Page title="Withdraw">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0 mb-10">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Deposit
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="requestAmount">Enter the minimum amount {minDeposit} USDT {usdtBalance}</label>
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
                Deposit
              </Button>
          </div>
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