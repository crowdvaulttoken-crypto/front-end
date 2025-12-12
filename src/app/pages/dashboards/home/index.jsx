import { Page } from "components/shared/Page";
import { useNavigate } from "react-router";
import { useState, useEffect } from 'react';
import { useSmartContract } from "../../../../hooks/useSmartContract";
// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
import { Button,Circlebar } from "components/ui";

import {
  ChartBarIcon,
  CircleStackIcon,
  CurrencyDollarIcon,
  ChevronDoubleUpIcon,
  CubeTransparentIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export function Home() {
  const navigate = useNavigate();
  const {
    ethers,
    address,
    bnbBalance,
    usdtBalance,
    vaultBalance,
    walletData,
    affiliateData,
    CrowdVaultContract,
    activateVIP,
    collect
  } = useSmartContract();
  const [vx, setVx] = useState({"amount":10,"cap":0,"coolDown":0});
  const [vip0, setVip0] = useState({"amount":10,"cap":0,"coolDown":0});
  const [vip1, setVip1] = useState({"amount":50,"cap":150,"coolDown":0});
  const [vip2, setVip2] = useState({"amount":100,"cap":300,"coolDown":0});
  const [vip3, setVip3] = useState({"amount":200,"cap":600,"coolDown":0});
  const [vip4, setVip4] = useState({"amount":400,"cap":1200,"coolDown":0});
  const [vip5, setVip5] = useState({"amount":800,"cap":2400,"coolDown":0});
  const [vip6, setVip6] = useState({"amount":1600,"cap":4800,"coolDown":0});
  const [vip7, setVip7] = useState({"amount":3200,"cap":9600,"coolDown":0});
  const [vip8, setVip8] = useState({"amount":6400,"cap":19200,"coolDown":0});
  const [loaded, setLoaded] = useState(false)

  const [v0Percent, setV0Percent] = useState(0);
  const [v0CoolDown, setV0CoolDown] = useState(0);
  const [v0Collect, setV0Collect] = useState(0);

  const [v1Percent, setV1Percent] = useState(0);
  const [v1CoolDown, setV1CoolDown] = useState(0);
  const [v1Collect, setV1Collect] = useState(0);

  const [v2Percent, setV2Percent] = useState(0);
  const [v2CoolDown, setV2CoolDown] = useState(0);
  const [v2Collect, setV2Collect] = useState(0);

  const [v3Percent, setV3Percent] = useState(0);
  const [v3CoolDown, setV3CoolDown] = useState(0);
  const [v3Collect, setV3Collect] = useState(0);

  const [v4Percent, setV4Percent] = useState(0);
  const [v4CoolDown, setV4CoolDown] = useState(0);
  const [v4Collect, setV4Collect] = useState(0);

  const [v5Percent, setV5Percent] = useState(0);
  const [v5CoolDown, setV5CoolDown] = useState(0);
  const [v5Collect, setV5Collect] = useState(0);

  const [v6Percent, setV6Percent] = useState(0);
  const [v6CoolDown, setV6CoolDown] = useState(0);
  const [v6Collect, setV6Collect] = useState(0);

  const [v7Percent, setV7Percent] = useState(0);
  const [v7CoolDown, setV7CoolDown] = useState(0);
  const [v7Collect, setV7Collect] = useState(0);

  const [v8Percent, setV8Percent] = useState(0);
  const [v8CoolDown, setV8CoolDown] = useState(0);
  const [v8Collect, setV8Collect] = useState(0);

  useEffect(() => {
    const loadVip = async () => {
      if ( address!="0x0000000000000000000000000000000000000000" && CrowdVaultContract ){
        setLoaded(true);
        const now = Math.floor(Date.now() / 1000);

        const vx = await CrowdVaultContract.vaults(address,0);
        setVx(vx);
        const v0 = await CrowdVaultContract.getVaultData(address,0);
        setVip0(v0);
        setV0CoolDown(v0.coolDown);
        
        setV0Percent (((((parseInt(v0.amount)*3)-parseInt(v0.cap))/ (parseInt(v0.amount)*3))*100).toFixed(2)) ;
        setV0Collect( (parseInt((now - parseInt(v0.coolDown)) / 86400)) * parseInt(v0.amount) * 0.02 );

        const v1 = await CrowdVaultContract.getVaultData(address,1);
        setVip1(v1);
        setV1CoolDown(v1.coolDown);
        setV1Percent (((((parseInt(v1.amount)*3)-parseInt(v1.cap)) / (parseInt(v1.amount)*3))*100).toFixed(2));
        setV1Collect( (parseInt((now - parseInt(v1.coolDown)) / 86400)) * parseInt(v1.amount) * 0.02 );

        const v2 = await CrowdVaultContract.getVaultData(address,2);
        setVip2(v2);
        setV2CoolDown(v2.coolDown);
        setV2Percent (((((parseInt(v2.amount)*3)-parseInt(v2.cap)) / (parseInt(v2.amount)*3))*100).toFixed(2));
        setV2Collect( (parseInt((now - parseInt(v2.coolDown)) / 86400)) * parseInt(v2.amount) * 0.02 );        

        const v3 = await CrowdVaultContract.getVaultData(address,3);
        setVip3(v3);
        setV3CoolDown(v3.coolDown);
        setV3Percent (((((parseInt(v3.amount)*3)-parseInt(v3.cap)) / (parseInt(v3.amount)*3))*100).toFixed(2));
        setV3Collect( (parseInt((now - parseInt(v3.coolDown)) / 86400)) * parseInt(v3.amount) * 0.02 );
        
        const v4 = await CrowdVaultContract.getVaultData(address,4);
        setVip4(v4);
        setV4CoolDown(v4.coolDown);
        setV4Percent( ((((parseInt(v4.amount)*3)-parseInt(v4.cap)) / (parseInt(v4.amount)*3))*100).toFixed(2) );
        setV4Collect( (parseInt((now - parseInt(v4.coolDown)) / 86400)) * parseInt(v4.amount) * 0.02 );
        
        const v5 = await CrowdVaultContract.getVaultData(address,5);
        setVip5(v5);
        setV5CoolDown(v5.coolDown);
        setV5Percent( ((((parseInt(v5.amount)*3)-parseInt(v5.cap)) / (parseInt(v5.amount)*3))*100).toFixed(2) );
        setV5Collect( (parseInt((now - parseInt(v5.coolDown)) / 86400)) * parseInt(v5.amount) * 0.02 );

        const v6 = await CrowdVaultContract.getVaultData(address,6);
        setVip6(v6);
        setV6CoolDown(v6.coolDown);
        setV6Percent( ((((parseInt(v6.amount)*3)-parseInt(v6.cap)) / (parseInt(v6.amount)*3))*100).toFixed(2) );
        setV6Collect( (parseInt((now - parseInt(v6.coolDown)) / 86400)) * parseInt(v6.amount) * 0.02 );

        const v7 = await CrowdVaultContract.getVaultData(address,7);
        setVip7(v7);
        setV7CoolDown(v7.coolDown);
        setV7Percent( ((((parseInt(v7.amount)*3)-parseInt(v7.cap)) / (parseInt(v7.amount)*3))*100).toFixed(2) );
        setV7Collect( (parseInt((now - parseInt(v7.coolDown)) / 86400)) * parseInt(v7.amount) * 0.02 );

        const v8 = await CrowdVaultContract.getVaultData(address,8);
        setVip8(v8);
        setV8CoolDown(v8.coolDown);
        setV8Percent( ((((parseInt(v8.amount)*3)-parseInt(v8.cap)) / (parseInt(v8.amount)*3))*100).toFixed(2) );
        setV8Collect( (parseInt((now - parseInt(v8.coolDown)) / 86400)) * parseInt(v8.amount) * 0.02 );
      }
    }
    if( loaded==false ){
      loadVip();
    }
    return () => {
      
    }
  }, [address,CrowdVaultContract,loaded,ethers]);

  const [isOpen, { open, close }] = useDisclosure(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [action, setAction] = useState(false);
  const [customTitle, setCustomTitle] = useState(false);
  const [customError, setCustomError] = useState('');
  const [customPending, setCustomPending] = useState(false);
  const [collectlvl, setCollectLvl] = useState(0);
  const state = error ? "error" : success ? "success" : "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: customTitle!=false?customTitle:'Please Confirm',
      description: customPending!=false?customPending:'Click ok to confirm request.',
      actionText: "Ok",
    },
    success: {
      title: customTitle!=false?customTitle:'Sucess',
      description: "Thank You.",
    },
    error: {
      description: `${customError}`,
    },
  };

  const onOk = async () => {
    setConfirmLoading(true);
    var hash = false;
    if( action == 'activate' ){
      hash = await activateVIP();
      setCustomTitle(`Activate Rewards`);
      if( !hash ){ setCustomError(`Transfer Failed`); }
      setCustomTitle(false);
    }
    if( action == 'collect' ){
      setCustomTitle(`Collect Rewards`);
      setCustomPending(`Collect VIP ${collectlvl} `);
      hash = await collect(collectlvl);
      if( !hash ){ setCustomError(`Collect Failed`); }
      setCustomPending(false)
      setCustomTitle(false);
    }

    if( hash==true ){
      setConfirmLoading(false);
      setSuccess(true);
      setError(false);
      setCustomPending(false)
      navigate("/dashboards");
    }
    else {
      setConfirmLoading(false);
      setError(true);
      setCustomPending(false)
    }
  };  

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      if(parseInt( vip0.coolDown) > 0 ) { setV0CoolDown(now - parseInt(vip0.coolDown)); } else {  setV0CoolDown(0); }
      if(parseInt( vip1.coolDown) > 0 ) { setV1CoolDown(now - parseInt(vip1.coolDown)); } else {  setV1CoolDown(0); }
      if(parseInt( vip2.coolDown) > 0 ) { setV2CoolDown(now - parseInt(vip2.coolDown)); } else {  setV2CoolDown(0); }
      if(parseInt( vip3.coolDown) > 0 ) { setV3CoolDown(now - parseInt(vip3.coolDown)); } else {  setV3CoolDown(0); }
      if(parseInt( vip4.coolDown) > 0 ) { setV4CoolDown(now - parseInt(vip4.coolDown)); } else {  setV4CoolDown(0); }
      if(parseInt( vip5.coolDown) > 0 ) { setV5CoolDown(now - parseInt(vip5.coolDown)); } else {  setV5CoolDown(0); }
      if(parseInt( vip6.coolDown) > 0 ) { setV6CoolDown(now - parseInt(vip6.coolDown)); } else {  setV6CoolDown(0); }
      if(parseInt( vip7.coolDown) > 0 ) { setV7CoolDown(now - parseInt(vip7.coolDown)); } else {  setV7CoolDown(0); }
      if(parseInt( vip8.coolDown) > 0 ) { setV8CoolDown(now - parseInt(vip8.coolDown)); } else {  setV8CoolDown(0); }
    }, 1000);
    return () => clearInterval(interval);
  }, [vip0,vip1,vip2,vip3,vip4,vip5,vip6,vip7,vip8]);

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Page title="Home">

      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="flex flex-wrap justify-start gap-0">
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/1 lg:w-1/5">
              <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 sm:p-5">
                <div  className="flex flex-wrap justify-start mb-10">
                  <Button color="primary" isGlow isIcon className="size-12">
                    <ChevronDoubleUpIcon className="size-9" />
                  </Button>
                </div>
                <div  className="flex flex-wrap justify-start text-sm">
                    <h3>VIP {affiliateData.level>0?(parseInt(affiliateData.level)-1):'0'}</h3>
                </div>
                <div className="flex flex-wrap justify-start text-lg">
                    &nbsp;
                </div>
              </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-1/2 md:w-1/2 lg:w-1/5">
              <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 sm:p-5">
                <div  className="flex flex-wrap justify-start mb-10">
                  <Button color="primary" isGlow isIcon className="size-12">
                    <CubeTransparentIcon className="size-9" />
                  </Button>
                </div>
                <div  className="flex flex-wrap justify-start text-sm">
                    <h3>BNB Balance</h3>
                </div>
                <div className="flex flex-wrap justify-start text-lg">
                    ${parseFloat(bnbBalance).toFixed(4)}
                </div>                
              </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-1/2 md:w-1/2 lg:w-1/5">
              <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 sm:p-5">
                <div  className="flex flex-wrap justify-start mb-10">
                  <Button color="primary" isGlow isIcon className="size-12">
                    <CircleStackIcon className="size-9" />
                  </Button>
                </div>
                <div  className="flex flex-wrap justify-start text-sm">
                    <h3>USDT Balance</h3>
                </div>
                <div className="flex flex-wrap justify-start text-lg">
                    ${parseFloat(usdtBalance).toFixed(4)} 
                </div>
              </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-1/2 md:w-1/2 lg:w-1/5">
              <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 sm:p-5">
                <div  className="flex flex-wrap justify-start mb-10">
                  <Button color="primary" isGlow isIcon className="size-12">
                    <CurrencyDollarIcon className="size-9" />
                  </Button>
                </div>
                <div  className="flex flex-wrap justify-start text-sm">
                    <h3>Available Balance</h3>
                </div>
                <div className="flex flex-wrap justify-start text-lg">
                    ${parseFloat(vaultBalance).toFixed(4)} 
                </div>                
              </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-1/2 md:w-1/2 lg:w-1/5">
              <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 sm:p-5">
                <div  className="flex flex-wrap justify-start mb-10">
                  <Button color="primary" isGlow isIcon className="size-12">
                    <ChartBarIcon className="size-9" />
                  </Button>
                </div>
                <div  className="flex flex-wrap justify-start text-sm">
                    <h3>Total Income</h3>
                </div>
                <div className="flex flex-wrap justify-start text-lg">
                    ${parseFloat(walletData.totalIncome).toFixed(4)} 
                </div>
              </div>
          </div>          
        </div>
        <div className="flex flex-wrap justify-start gap-0">
          <div className={ (vip0.amount>0 && vip0.cap>0 ) || parseInt(vip0.amount)==0 ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 0 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip0.amount>0?parseInt(vx[1])/1e18:30}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v0Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v0CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v0Percent)?v0Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v0Percent)?v0Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip0.amount==0?'activate':'collect');
                  setCollectLvl(0);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip0.amount==0 ?'Activate 10 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip1.amount)>0 && parseFloat(vip1.cap)>0 ) || (parseInt(vip1.amount)==0 && parseInt(vip0.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 1 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip1.amount>0?vip1.cap:150}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v1Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v1CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v1Percent)?v1Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v1Percent)?v1Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip1.amount==0?'activate':'collect');
                  setCollectLvl(1);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip1.amount==0 ?'Activate 50 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip2.amount)>0 && parseFloat(vip2.cap)>0 ) || (parseInt(vip2.amount)==0 && parseInt(vip1.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 2 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip2.amount>0?vip2.cap:300}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v2Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v2CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v2Percent)?v2Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v2Percent)?v2Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip2.amount==0?'activate':'collect');
                  setCollectLvl(2);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip2.amount==0 ?'Activate 100 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip3.amount)>0 && parseFloat(vip3.cap)>0 ) || (parseInt(vip3.amount)==0 && parseInt(vip2.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 3 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip3.amount>0?vip3.cap:600}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v3Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v3CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v3Percent)?v3Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v3Percent)?v3Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip3.amount==0?'activate':'collect');
                  setCollectLvl(3);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip3.amount==0 ?'Activate 200 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip4.amount)>0 && parseFloat(vip4.cap)>0 ) || (parseInt(vip4.amount)==0 && parseInt(vip3.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 4 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip4.amount>0?vip4.cap:1200}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v4Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v4CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v4Percent)?v4Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v4Percent)?v4Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip4.amount==0?'activate':'collect');
                  setCollectLvl(4);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip4.amount==0 ?'Activate 400 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip5.amount)>0 && parseFloat(vip5.cap)>0 ) || (parseInt(vip5.amount)==0 && parseInt(vip4.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 5 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip5.amount>0?vip5.cap:2400}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v5Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v5CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v5Percent)?v5Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v5Percent)?v5Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip5.amount==0?'activate':'collect');
                  setCollectLvl(5);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip5.amount==0 ?'Activate 800 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip6.amount)>0 && parseFloat(vip6.cap)>0 ) || (parseInt(vip6.amount)==0 && parseInt(vip5.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 6 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip6.amount>0?vip6.cap:4800}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v6Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v6CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v6Percent)?v6Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v6Percent)?v6Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip6.amount==0?'activate':'collect');
                  setCollectLvl(6);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip6.amount==0 ?'Activate 1600 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip7.amount)>0 && parseFloat(vip7.cap)>0 ) || (parseInt(vip7.amount)==0 && parseInt(vip6.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 7 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip7.amount>0?vip7.cap:9600}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v7Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v7CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v7Percent)?v7Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v7Percent)?v7Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip7.amount==0?'activate':'collect');
                  setCollectLvl(7);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip7.amount==0 ?'Activate 3200 USDT':'Collect'}
              </Button>
            </div>
          </div>
          <div className={ (parseInt(vip7.amount)>0) ? "px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3":"hidden"} >
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">VIP 8 Capping</div>
                  <div className="truncate font-medium text-lg mb-1">${vip8.amount>0?vip8.cap:19200}</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">${v8Collect.toFixed(2)}</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">{formatTime( parseInt(v8CoolDown) )}</div>
                </div>
                <Circlebar color="secondary" value={100-(!isNaN(v8Percent)?v8Percent:0)} isActive>
                  <span className="text-lg font-medium text-white">{!isNaN(v8Percent)?v8Percent:0}%</span>
                </Circlebar>
              </div>
              <Button onClick={() => {
                  setAction(vip8.amount==0?'activate':'collect');
                  setCollectLvl(8);
                  setSuccess(false);
                  setError(false);
                  open(); }
                }
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                {vip8.amount==0 ?'Activate 6400 USDT':'Collect'}
              </Button>
            </div>
          </div>
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