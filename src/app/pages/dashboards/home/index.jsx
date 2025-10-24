import { Page } from "components/shared/Page";
import { Link } from "react-router";
import { useState, useEffect } from 'react';
import { useSmartContract } from "../../../../hooks/useSmartContract";

import { MinusIcon,PlusIcon } from "@heroicons/react/24/solid";
import { usePriceFeedBybit } from "../../../../hooks/usePriceFeedBybit";
import { usePriceFeedKraken } from "../../../../hooks/usePriceFeedKraken";
import { usePriceFeedOkx } from "../../../../hooks/usePriceFeedOkx";
import { usePriceFeedBitget } from "../../../../hooks/usePriceFeedBitget";
import { Button,Circlebar } from "components/ui";
import {
  RocketLaunchIcon,
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
  CircleStackIcon,
  CurrencyDollarIcon,
  ChevronDoubleUpIcon
} from "@heroicons/react/24/outline";

function getMinMaxPrice(prices) {
  // Filter out invalid or zero prices
  const validPrices = prices.filter(p => typeof p.price === 'number' && p.price > 0);

  if (validPrices.length === 0) {
    return { min: 0, max: 0, minExchange: '', maxExchange: '' };
  }

  // Find the lowest and highest prices with their exchanges
  const minPriceObj = validPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
  const maxPriceObj = validPrices.reduce((max, curr) => curr.price > max.price ? curr : max);

  return {
    min: minPriceObj.price,
    max: maxPriceObj.price,
    minExchange: minPriceObj.exchange,
    maxExchange: maxPriceObj.exchange
  };
}

export default function Home() {
  const {
    passiveData,bnbBalance,usdtBalance,walletData,affiliateData,availableEquity,passivePercent
  } = useSmartContract();
  const { bybitFeed, isConnected } = usePriceFeedBybit();
  const { krakenFeed } = usePriceFeedKraken();
  const { okxFeed } = usePriceFeedOkx();
  const { bitgetFeed } = usePriceFeedBitget();

  const okxIcon = okxFeed.color=='#95e4d2'?(<PlusIcon className="size-7"  />):(okxFeed.color=='#ff6f4a'?(<MinusIcon className="size-7"/>):'');
  const bybitIcon = bybitFeed.color=='#95e4d2'?(<PlusIcon className="size-7"  />):(bybitFeed.color=='#ff6f4a'?(<MinusIcon className="size-7"/>):'');
  const krakenIcon = krakenFeed.color=='#95e4d2'?(<PlusIcon className="size-7"  />):(krakenFeed.color=='#ff6f4a'?(<MinusIcon className="size-7"/>):'');
  const bitgetIcon = bitgetFeed.color=='#95e4d2'?(<PlusIcon className="size-7"  />):(bitgetFeed.color=='#ff6f4a'?(<MinusIcon className="size-7"/>):'');

  const [lowestPrice, setLowestPrice] = useState(1);
  const [highestPrice, setHighestPrice] = useState(0);
  const [lowestExchange, setLowestExchange] = useState('');
  const [highestExchange, setHighestExchange] = useState('');

  function calculateArbitrageProfit(capital, buyPrice, sellPrice) {
    // Calculate how much BNB we can buy with our capital
    const btcAmount = capital / buyPrice;
    
    // Calculate how much USDT we get from selling that BNB
    const sellAmount = btcAmount * sellPrice;
    
    // Calculate profit
    const profit = sellAmount - capital;
    
    return {
        buyExchange: buyPrice < sellPrice ? 'Bybit' : 'Kraken',
        sellExchange: buyPrice < sellPrice ? 'Kraken' : 'Bybit',
        btcAmount: btcAmount,
        sellAmount: sellAmount,
        profit: profit,
        profitPercentage: (profit / capital) * 100
    };
  }

  useEffect(() => {
    const { min, max, minExchange, maxExchange } = getMinMaxPrice([
      { price: parseFloat(bybitFeed.price), exchange: 'Bybit' },
      { price: parseFloat(okxFeed.price), exchange: 'OKX' },
      { price: parseFloat(krakenFeed.price), exchange: 'Kraken' },
      { price: parseFloat(bitgetFeed.price), exchange: 'Bitget' }
    ]);

    setLowestPrice(min);
    setHighestPrice(max);
    setLowestExchange(minExchange);
    setHighestExchange(maxExchange);
  }, [
    bybitFeed.price,
    okxFeed.price,
    krakenFeed.price,
    bitgetFeed.price
  ]);

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const currentCapital = availableEquity>0 ?  parseInt(availableEquity):10 ;
  //const currentMinCollection = parseFloat(currentCapital*passivePercent);
  const currentRewards = ((currentTimestamp - parseInt(passiveData.coolDown)) / 86400) * parseFloat(currentCapital*passivePercent)  ; 

  // Your specific example
  const result = calculateArbitrageProfit(currentCapital, lowestPrice, highestPrice);

  const now = Math.floor(Date.now() / 1000);
  const withdrawcooldown =  ( parseInt(now)- parseInt(walletData.coolDown) ) > 86400 ? true:false;
  const collectCooldown = ( parseInt(now)- parseInt(passiveData.coolDown) ) > 86400 ? true:false;

  return (
    <Page title="Dashboard">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0 mb-10">
          <div className="flex items-center justify-between py-3 px-5 ">
            <div className="flex flex-col">
              <Link to="/dashboards/activate" >
                <Button
                  color="primary"
                  variant="soft"
                  isGlow="true"
                  className="space-x-1 rounded-full px-3 "
                >
                  <RocketLaunchIcon className="size-5 lg:size-10 stroke-2" />
                  <span className="text-xs-plus lg:text-lg">ACTIVATE</span>
                </Button>
              </Link>
            </div>
            <div className="flex flex-col">
              <Link to="/wallets/collect" >
                <Button
                  color="primary"
                  variant="soft"
                  isGlow={collectCooldown}
                  className="space-x-1 rounded-full px-3"
                >
                  <ClockIcon className="size-5 lg:size-10 stroke-2" />
                  <span className="text-xs-plus lg:text-lg">COLLECT</span>
                </Button>
              </Link>
            </div>
            <div className="flex flex-col">
              <Link to="/wallets/withdraw" >
                <Button
                  color="primary"
                  variant="soft"
                  isGlow={withdrawcooldown}
                  className="space-x-1 rounded-full px-3"
                >
                  <BoltIcon className="size-5 lg:size-10 stroke-2" />
                  <span className="text-xs-plus lg:text-lg">WITHDRAW</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 md:grid-cols-4 sm:px-5">
            <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
              <p className="text-xs uppercase text-white/100">BNB</p>
              <div className="flex items-end justify-between space-x-2 ">
                <p className="mt-4 text-lg font-medium text-white/50">{parseFloat(bnbBalance).toFixed(5)}</p>
              </div>
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
              <p className="text-xs uppercase text-white/100">USDT</p>
              <div className="flex items-end justify-between space-x-2 ">
                <p className="mt-4 text-lg font-medium text-white/50">{parseFloat(usdtBalance).toFixed(3)}</p>
              </div>
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
              <p className="text-xs uppercase text-white/100">WNTrades</p>
              <div className="flex items-end justify-between space-x-2 ">
                <p className="mt-4 text-lg font-medium text-white/50">{parseFloat(parseInt(walletData.balance)).toFixed(3)}</p>
              </div>
            </div>
            <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
              <p className="text-xs uppercase text-white/100">Total Rewards</p>
              <div className="flex items-end justify-between space-x-2 ">
                <p className="mt-4 text-lg font-medium text-white/50">{parseFloat(parseInt(walletData.totalIncome)).toFixed(3)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 px-4 not-[]:sm:grid-cols-1 sm:px-5">
            <div className="rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
                <div className="flex items-center justify-between py-3">
                    <h2 className="text-sm-plus uppercase font-medium tracking-wide text-white/100">ARBITRAGE SCANNER RANK {affiliateData.level<10?affiliateData.level:10}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
                    <div>
                        <div className="mt-3 text-2xl font-semibold text-white/100">${parseFloat(currentCapital).toFixed(0)}</div>
                        <p className="mt-2 text-xs-plus text-white/80">PROFIT: {parseFloat(result.profit).toFixed(3)} USDT </p>
                        <p className="mt-2 text-xs-plus text-white/80">PERCENT: {parseFloat(result.profitPercentage).toFixed(3)}%</p>
                        <p className="mt-2 text-xs-plus text-white/80">PNL: {currentRewards.toFixed(4)}</p>
                    </div>                      
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                        <div>
                            <p className="text-white/100">{lowestExchange}</p>
                            <div className="mt-1 flex items-center gap-2 text-white/50">
                                <div className="flex size-7 items-center justify-center rounded-full bg-black/20"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"></path></svg></div>
                                <p className="text-base font-medium">${parseFloat(lowestPrice).toFixed(2)}</p>
                            </div>
                            <button className="btn-base mt-3 w-full rounded-lg border border-success/75 bg-success/75 px-5 py-2 text-white hover:bg-success/50 focus:bg-success/50 active:bg-success/50" type="button">BUY</button>
                        </div>
                        <div>
                            <p className="text-white/100">{highestExchange}</p>
                            <div className="mt-1 flex items-center gap-2 text-white/50">
                                <div className="flex size-7 items-center justify-center rounded-full bg-black/20"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"></path></svg></div>
                                <p className="text-base font-medium ">${parseFloat(highestPrice).toFixed(2)}</p>
                            </div>
                            <button className="btn-base mt-3 w-full rounded-lg border border-error/75 bg-error/75 px-5 py-2 text-white hover:bg-error/50 focus:bg-error/50 active:bg-error/25" type="button">SELL</button>
                        </div>
                    </div>
                </div>
            </div>   
          </div>
          
          <div className="mt-5 grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 sm:px-5">
              <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
                <p className="uppercase font-small text-white/100">Okx BNB Live Price</p>
                <div className="flex items-end justify-between space-x-2 ">
                  <div className="font-medium text-gray-900 dark:text-dark-100 ">
                    {isConnected && okxFeed.price>0 ? (
                      <div style= {{color: okxFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}} >${parseFloat(okxFeed.price).toFixed(2)}</div>
                    ) : (
                      <div>Connecting to price feed...</div>
                    )}
                  </div>
                </div>
                <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-black/50 text-center p-5">
                  <span className="text-3xl" style={{color: okxFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}}>
                    {okxIcon}
                  </span> 
                </div>
              </div>
              <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
                <p className="uppercase font-medium text-white/100">Bybit BNB Live Price</p>
                <div className="flex items-end justify-between space-x-2 ">
                  <div className="font-medium text-gray-900 dark:text-dark-100 ">
                    {isConnected && bybitFeed.price>0 ? (
                      <div style= {{color: bybitFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}} >${parseFloat(bybitFeed.price).toFixed(2)}</div>
                    ) : (
                      <div>Connecting to price feed...</div>
                    )}
                  </div>
                </div>
                <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-black/50 text-center p-5">
                  <span className="text-3xl" style={{color: bybitFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}}>
                    {bybitIcon}
                  </span>
                </div>
              </div>
              <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
                <p className="uppercase font-medium text-white/100">Kraken BNB Live Price</p>
                <div className="flex items-end justify-between space-x-2 ">
                  <div className="font-medium text-gray-900 dark:text-dark-100 ">
                    {isConnected && krakenFeed.price>0 ? (
                      <div style= {{color: krakenFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}} >${parseFloat(krakenFeed.price).toFixed(2)}</div>
                    ) : (
                      <div>Connecting to price feed...</div>
                    )}
                  </div>
                </div>
                <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-black/50 text-center p-5">
                  <span className="text-3xl" style={{color: krakenFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}}>
                    {krakenIcon}
                  </span>
                </div>
              </div>
              <div className="relative flex flex-col overflow-hidden rounded-lg bg-linear-to-br from-primary-500 to-primary-600 p-3.5">
                <p className="uppercase font-medium text-white/100">BitGet BNB Live Price</p>
                <div className="flex items-end justify-between space-x-2 ">
                  <div className="font-medium text-gray-900 dark:text-dark-100 ">
                    {isConnected && bitgetFeed.price>0 ? (
                      <div style= {{color: bitgetFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}} >${parseFloat(bitgetFeed.price).toFixed(2)}</div>
                    ) : (
                      <div>Connecting to price feed...</div>
                    )}
                  </div>
                </div>
                <div className="mask is-hexagon-2 absolute right-0 top-0 -m-3 size-16 bg-black/50 text-center p-5">
                  <span className="text-3xl" style={{color: bitgetFeed.color,fontWeight: 'bold', fontSize: '1rem', transition: 'color 0.3s ease'}}>
                    {bitgetIcon}
                  </span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </Page>
  );
}


export function Home2() {
  return (
    <Page title="Home">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="flex flex-wrap justify-start gap-0">
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/4">
              <div className="relative break-words print:border card rounded-lg border border-gray-200 dark:border-dark-600 print:border-0 p-4 sm:p-5">
                <div  className="flex flex-wrap justify-start mb-10">
                  <Button color="primary" isGlow isIcon className="size-12">
                    <ChevronDoubleUpIcon className="size-9" />
                  </Button>
                </div>
                <div  className="flex flex-wrap justify-start text-sm">
                    <h3>Current VIP</h3>
                </div>
                <div className="flex flex-wrap justify-start text-lg">
                    0
                </div>
              </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/4">
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
                    $0.00
                </div>                
              </div>
          </div>          
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/4">
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
                    $0.00
                </div>                
              </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/4">
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
                    $0.00
                </div>
              </div>
          </div>          
        </div>
        <div className="flex flex-wrap justify-start gap-0">
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3">
            <div className="rounded-lg bg-gradient-to-br from-gray-600 to-gray-600 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">Capping</div>
                  <div className="truncate font-medium text-lg mb-1">$0</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">$0.00</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">0:00:00:00</div>
                </div>                
                <Circlebar
                  value={300/300*100}
                  className="[&_.circlebar-inner-path]:stroke-white/80 [&_.circlebar-rail-path]:stroke-white/20"
                >
                  <span className="text-lg font-medium text-white">{300}%</span>
                </Circlebar>
              </div>
              <Button
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                Starter: Completed
              </Button>
            </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3">
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">Capping</div>
                  <div className="truncate font-medium text-lg mb-1">$30</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">$0.00</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">0:00:00:00</div>
                </div>
                <Circlebar
                  value={300/300*100}
                  className="[&_.circlebar-inner-path]:stroke-white/80 [&_.circlebar-rail-path]:stroke-white/20"
                >
                  <span className="text-lg font-medium text-white">{300}%</span>
                </Circlebar>
              </div>
              <Button
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                VIP1: Completed 
              </Button>
            </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3">
            <div className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-900 px-4 pb-4 pt-5 text-center ">
            <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">Capping</div>
                  <div className="truncate font-medium text-lg mb-1">$150</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">$1.00</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">01:00:00:00</div>
                </div>
                <Circlebar color="secondary" value={150/300*100} isActive>
                  <span className="text-lg font-medium text-gray-100 dark:text-dark-100">
                    {150/300*100}%
                  </span>
                </Circlebar>
              </div>
              <Button
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                VIP2: Collect
              </Button>
    
            </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3">
            <div className="rounded-lg bg-gradient-to-br from-gray-600 to-gray-600 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">Capping</div>
                  <div className="truncate font-medium text-lg mb-1">$300</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">$0.00</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">0:00:00:00</div>
                </div>                
                <Circlebar
                  value={0/300*100}
                  className="[&_.circlebar-inner-path]:stroke-white/80 [&_.circlebar-rail-path]:stroke-white/20"
                >
                  <span className="text-lg font-medium text-white">{0}%</span>
                </Circlebar>
              </div>
              <Button
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                VIP3: Activate 100 USDT
              </Button>
            </div>
          </div>

          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3">
            <div className="rounded-lg bg-gradient-to-br from-gray-600 to-gray-600 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">Capping</div>
                  <div className="truncate font-medium text-lg mb-1">$600</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">$0.00</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">0:00:00:00</div>
                </div>                
                <Circlebar
                  value={0/300*100}
                  className="[&_.circlebar-inner-path]:stroke-white/80 [&_.circlebar-rail-path]:stroke-white/20"
                >
                  <span className="text-lg font-medium text-white">{0}%</span>
                </Circlebar>
              </div>
              <Button
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                VIP4: Activate 200 USDT
              </Button>
            </div>
          </div>
          <div className="px-4 pb-4 pt-5 text-center w-full md:w-1/2 lg:w-1/3">
            <div className="rounded-lg bg-gradient-to-br from-gray-600 to-gray-600 px-4 pb-4 pt-5 text-center ">
              <div className="mx-8 flex gap-2 justify-between">
                <div className="text-md uppercase text-white text-start">
                  <div className="truncate font-medium text-sm">Capping</div>
                  <div className="truncate font-medium text-lg mb-1">$1,200</div>
                  <div className="truncate font-medium text-sm">Available</div>
                  <div className="truncate font-medium text-lg mb-1">$0.00</div>
                  <div className="truncate font-medium text-sm">CoolDown</div>
                  <div className="truncate font-medium text-lg">0:00:00:00</div>
                </div>                
                <Circlebar
                  value={0/300*100}
                  className="[&_.circlebar-inner-path]:stroke-white/80 [&_.circlebar-rail-path]:stroke-white/20"
                >
                  <span className="text-lg font-medium text-white">{0}%</span>
                </Circlebar>
              </div>
              <Button
                unstyled
                className="mt-5 w-full rounded-lg border border-white/10 bg-white/20 py-2 text-white hover:bg-white/30 focus:bg-white/30"
              >
                VIP5: Activate 400 USDT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}