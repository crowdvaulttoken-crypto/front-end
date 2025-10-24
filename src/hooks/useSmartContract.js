import { useEffect, useState,useCallback } from "react";
import { ethers } from "ethers"; //"https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
import { erc20Abi } from "../constants/erc20Abi.constant";
import { smartContractAbi } from "../constants/smartContract.constant";

export function useSmartContract() {

  const WNTradesContractAddress = '0x720C9AafbC40ca8f8198988b6aB7CCc976B41359';
  const usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955';

  const [network, setNetwork] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('0x0000000000000000000000000000000000000000');
  const [address, setAddress] = useState('0x0000000000000000000000000000000000000000');
  const [connected, setConnected] = useState(false);
  const [WNTradesContract,setWNTradesContract] = useState(null);
  const [usdtContract,setUsdtContract] = useState(null);
  const [bnbBalance, setBnbBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [rewardsBalance, setRewardsBalance] = useState(0);
  const [upgradeAmount, setUpgradeAmount] = useState(0);
  const [regFee, setRegFee] = useState(0);
  const [brokerFee, setBrokerFee] = useState(0);
  const [affiliateData, setAffiliateData] = useState([]);
  const [brokerData, setBrokerData] = useState([]);
  const [walletData, setWalletData] = useState([]);
  const [passiveData, setPassiveData] = useState([]);
  const [availableEquity, setAvailableEquity] = useState(0);
  const [availablePassive, setAvailablePassive] = useState(0);
  const [passivePercent, setPassivePercent] = useState(0);
  const [lastCallTime, setLastCallTime] = useState(0);

  useEffect(() => {
    // Check if window.ethereum is available (MetaMask or similar)
    if (typeof window === "undefined" || !window.ethereum) {
      setConnected(false);
      console.warn('Ethereum provider not detected');
      return;
    }    
    // Create a new provider
    const newProvider =  new ethers.BrowserProvider(window.ethereum);
    setProvider(newProvider); 

    const handleNetworkChange = async () => {
      try {
        const network = await newProvider.getNetwork();
        setNetwork(network.name);
        
        if( network.name!=='bnb') {
          alert(`Please switch to BNB Smart Chain.`);
          return; 
        }

        const accounts = await newProvider.send("eth_requestAccounts", []); 
        setAccount(accounts[0]);
        const countAccounts = await newProvider.listAccounts();
        setConnected(Array.isArray(countAccounts) ? countAccounts.length > 0 : false);

        const signer = await newProvider.getSigner();
        setSigner(signer);
        
        const address = await signer.getAddress();
        setAddress(address);

        const bnbBalance = await newProvider.getBalance(address);
        setBnbBalance(ethers.formatEther(bnbBalance));

        const WNTradesContract = new ethers.Contract(WNTradesContractAddress, smartContractAbi, signer);
        setWNTradesContract(WNTradesContract);        
    
        const usdtContract = new ethers.Contract(usdtContractAddress, erc20Abi, signer);
        setUsdtContract(usdtContract);

        const usdtBalance = await usdtContract.balanceOf(address);
        setUsdtBalance(ethers.formatEther(usdtBalance,18));
    
        const upgradeAmount = await WNTradesContract.calculateUpgradeAmount(address);
        setUpgradeAmount(ethers.formatEther(upgradeAmount));
        
        const affiliateData = await WNTradesContract.getAffiliateData(address);
        setAffiliateData(affiliateData);

        const walletData = await WNTradesContract.getWalletData(address);
        setWalletData(walletData);
        setRewardsBalance((parseFloat(walletData.balance)).toFixed(2));
        setPassiveData(await WNTradesContract.getPassiveData(address));  
        setAvailableEquity(await WNTradesContract.getAvailableEquity(affiliateData.level,walletData.totalIncome ));
        setRegFee(await WNTradesContract.regFee());
        setBrokerFee(await WNTradesContract.brokerFee());

        setAvailablePassive(await WNTradesContract.getPassiveReward(address));
        setPassivePercent(parseInt(await WNTradesContract.getPassivePercent(address))/10000);

        const lastCall = await WNTradesContract.getLastCallTime(address);
        setLastCallTime(lastCall);

      } catch (error) {
        console.error(error);
      }
    };

    // Initial network check
    handleNetworkChange();  
    
    // Listen for chain changes (network changes)
    window.ethereum.on('chainChanged', handleNetworkChange);
    window.ethereum.on('accountsChanged', handleNetworkChange);
    
    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleNetworkChange);
        window.ethereum.removeListener('accountsChanged', handleNetworkChange); 
      }
    };
  },[]);

  const convertWeiToEther = (amount) =>{
    return ethers.formatEther(amount);
  }
  const getBrokerData = useCallback(async (address) =>{
    console.log(address)
    if( !address || !WNTradesContract || address!='0x0000000000000000000000000000000000000000' ) return {"parent":"","fees":0,"isActive":false,"childrenCount":0};
    const brokerData = await WNTradesContract.getBrokerData(address);
    setBrokerData(brokerData);  
    return  brokerData;
  },[WNTradesContract])

  const getLastCallTime = async (address) =>{
    if( !address || !WNTradesContract ) return {"parent":"","merchant":"","level":0};
    return await WNTradesContract.getLastCallTime(address);
  }

  const getAffiliatesData = async (address) =>{
    if( !address || !WNTradesContract ) return {"parent":"","merchant":"","level":0};
    return await WNTradesContract.affiliates(address);
  }
  const getWalletdData = async (address) =>{
    if( !address || !WNTradesContract ) return {"balance":0,"capping":0,"totalIncome":0,"coolDown":0};
    return await WNTradesContract.getAffiliateData(address);
  }

  const getPassivePercent = async (address) =>{
    if( !address || !WNTradesContract || address!='0x0000000000000000000000000000000000000000' ) return 0;
    return await WNTradesContract.getPassivePercent(address);
  }

  const registerWallet = async  (_referrer) =>{
    var registrationFee = ethers.formatEther(regFee,18);
    var activeRegFee = ethers.formatEther('1000000000000000000',18);
    try {
        if( registrationFee >= activeRegFee ){
            const approved = await approvedSpender(regFee)
            if( !approved ){ return false; }
        }
        const tx = await WNTradesContract.connect(signer).register(_referrer);
        await tx.wait();
        if( tx ){
            return true;
        }else{return false;}
    }
    catch(error){
        console.error(error);
        alert(error);
        return false
    }       
      
  }
  const activateBroker = async () => {
    try {
      const brokerFees = await WNTradesContract.brokerFee();
      var approved = false;
      if( brokerFees > walletData.balance ){
        approved = await approvedSpender( brokerFees );
      }else{
        approved = true;
      }
      if( approved==true ){
        const tx = await WNTradesContract.activateBroker();
        await tx.wait();
        if( tx ){
          console.log(`Transaction Hash: ${tx.hash}`);
          return true;
        }else{return false;}
      }
    }
    catch(error){
      console.error(error);
      alert(error);
      return false;
    }
  }
  const activateWithDeposit = async () => {
    try {
      const approved = await approvedSpender( await WNTradesContract.calculateUpgradeAmount(account) );
      if( approved==true ){
        const tx = await WNTradesContract.activateWithDeposit();
        await tx.wait();
        if( tx ){
          console.log(`Transaction Hash: ${tx.hash}`);
          return true;
        }else{return false;}
      }
    }
    catch(error){
      console.error(error);
      alert(error);
      return false;
    }
  }
  const activateWithWallet = async () => {
    try {
        const tx = await WNTradesContract.activateWithWallet();
        await tx.wait();
        if( tx ){
          console.log(`Transaction Hash: ${tx.hash}`);
          return true;
        }else{return false;}
      }
      catch(error){
        console.error(error);
        alert(error);
        return false;
      }
  }
  const withdraw = async (amount) => {
    try {
      const tx = await WNTradesContract.withdraw(ethers.parseUnits(amount.toString(), 18));
      await tx.wait();
      if( tx ){
        return true;
      }else{
        return false;
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert(error);
      return false;
    }
  }
  const transferBalance = async (recipient, amount) => {
    if( recipient=='' || amount<=0 || parseFloat(amount)>parseFloat(walletData.balance) ){ return false; }
    try {
      let tx = await WNTradesContract.transferBalance(recipient,ethers.parseUnits(amount.toString(), 18))
      await tx.wait();
      console.log('Balance transferred successfully');
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      return false;
    }
  };   
  const collectPassive = async () =>{
    try {
      let tx = await WNTradesContract.collectPassive();
      await tx.wait();
      console.log('Collect Success');
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      return false;
    }
  }
  const getPassiveReward = async (address) => {
    return await WNTradesContract.getPassiveReward(address);
  }

  const getChildren = useCallback(async (address) => {
    if (!address || !WNTradesContract) return { children: [], affiliates: [] };
  
    // Fetch children
    const childrenBatch = await WNTradesContract.getChildren(true, address, 0, 100);
  
    // Fetch level for each child
    const childrenWithLevels = await Promise.all(
      childrenBatch.map(async (child) => {
        const [parent, broker, level] = await WNTradesContract.affiliates(child);
        return {
          address: child,
          level: level,
          parent,
          broker,
        };
      })
    );
  
    // Fetch affiliate info for the root address as well
    const affiliates = await WNTradesContract.affiliates(address);
  
    return { children: childrenWithLevels, affiliates };
  }, [WNTradesContract]); // only changes if contract changes

  const fetchAffiliateData = async (rootAddress) => {
    const [parent, merchant, level, childrenCount] = await WNTradesContract.getAffiliateData(rootAddress);
    return {
      id: rootAddress,
      parent,
      merchant,
      level,
      childrenCount
    };
  };  

  const buildTree = async (rootAddress) => {
    const rootData = await fetchAffiliateData(rootAddress);
  
    const node = {
      id: rootData.id,
      title: `Level ${rootData.level}`, // Customize this title as needed
      isRoot: rootData.parent === '0x0000000000000000000000000000000000000000', // Root node check
      children: []
    };
  
    // If there are children, recursively fetch their data
    for (let i = 0; i < rootData.childrenCount; i++) {
      // For each child, fetch the child’s affiliate data and build its subtree
      const childAddress = rootData.id;  // This will change once we implement a more complex child retrieval logic
      const childNode = await buildTree(childAddress);
      node.children.push(childNode);
    }
  
    return node;
  };

  const approvedSpender = async (amount) => {
    try {
      const allowance = await usdtContract.allowance( account, WNTradesContractAddress);
      console.log(`Allowance ${ethers.formatEther(amount)} tokens for spending`);
      console.log(`Available ${allowance} allowance for spending`);
      console.log(`Available ${amount} amount for spending`);
      if (allowance < amount ) {
        //await usdtContract.approve(WNTradesContractAddress, 0)
        const tx = await usdtContract.approve(WNTradesContractAddress, amount)
        await tx.wait();
        if( tx ){
          console.log(`Approved ${ethers.formatEther(amount)} tokens for spending`);
          return true;
        }else{return false;}
      }
      return true;
    }
    catch(error){
      console.error(error);
      alert(error);
      return false;
    }      
  }

  const getFees = useCallback(async () => {
    if ( !WNTradesContract) return { brokerFee: 0, entryFee: 0 };
    const brokerFee = await WNTradesContract.brokerFee();
    const entryFee = await WNTradesContract.entryFee();
    return {
      brokerFee: ethers.formatEther(brokerFee),
      entryFee: ethers.formatEther(entryFee)
    };
  }, [WNTradesContract]); // only changes if contract changes


  return {
    network,
    provider,
    signer,
    account,
    address,
    connected,
    WNTradesContract,
    bnbBalance,
    usdtBalance,
    rewardsBalance,
    upgradeAmount,
    regFee,
    brokerFee,
    affiliateData,
    brokerData,
    walletData,
    passiveData,
    availableEquity,
    availablePassive,
    passivePercent,
    lastCallTime,
    convertWeiToEther,
    registerWallet,
    activateWithDeposit,
    activateWithWallet,
    withdraw,
    transferBalance,
    getWalletdData,
    getPassiveReward,
    getBrokerData,
    getAffiliatesData,
    getPassivePercent,
    getLastCallTime,
    collectPassive,
    fetchAffiliateData,
    activateBroker,
    buildTree,
    getChildren,
    getFees,
  };

}