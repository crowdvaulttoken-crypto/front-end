import { useEffect, useState,useCallback } from "react";
import { ethers } from "ethers"; //"https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
import { erc20Abi } from "../constants/erc20Abi.constant";
import { smartContractAbi } from "../constants/smartContract.constant";

export function useSmartContract() {

  const SmartContractAddress = '0xCb00624a76d66fEF68Dc156522dEf645e612b333';
  const usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955';

  const [network, setNetwork] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('0x0000000000000000000000000000000000000000');
  const [address, setAddress] = useState('0x0000000000000000000000000000000000000000');
  const [connected, setConnected] = useState(false);
  const [CrowdVaultContract,setWNTradesContract] = useState(null);
  const [USDTContract,setUsdtContract] = useState(null);
  const [bnbBalance, setBnbBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [walletData, setWalletData] = useState([]);
  const [affiliateData, setAffiliateData] = useState([]);

  const [lastBlockNumber, setLastBlockNumber] = useState(0);
  const [lastBlockTime, setLastBlockTime] = useState(0);
  const [regFee, setRegFee] = useState(0);
  const [entryFee, setEntryFee] = useState(0);
  const [agentFee, setAgentFee] = useState(0);
  const [loaded, setLoaded] = useState(true);

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

        const signer = await newProvider.getSigner();
        setSigner(signer);
        
        const address = await signer.getAddress();
        setAddress(address);

        setConnected(address == accounts[0]);

        const bnbBalance = await newProvider.getBalance(address);
        setBnbBalance(ethers.formatEther(bnbBalance));

        setWNTradesContract(new ethers.Contract(SmartContractAddress, smartContractAbi, signer));        
        setUsdtContract(new ethers.Contract(usdtContractAddress, erc20Abi, signer));
        if( CrowdVaultContract && USDTContract && loaded  ) {
          setLoaded(false);
          setWalletData(await CrowdVaultContract.getWalletData(address));
          setVaultBalance(await CrowdVaultContract.getWalletData(address).balance);

          setRegFee(await CrowdVaultContract.regFee());
          setEntryFee(await CrowdVaultContract.entryFee());
          setAgentFee(await CrowdVaultContract.agentFee());
          setLastBlockTime(await CrowdVaultContract.getLastBlockTime(address));
          setLastBlockNumber(await CrowdVaultContract.getLastBlockNumber(address));
          setWalletData(await CrowdVaultContract.getWalletData(address))
          setAffiliateData(await CrowdVaultContract.getAffiliateData(address))

          setUsdtBalance(ethers.formatEther(await USDTContract.balanceOf(address)));

          //console.log(ethers.formatEther(await USDTContract.balanceOf(address)))
        }
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
  },[CrowdVaultContract,USDTContract,loaded]);

  const convertWeiToEther = (amount) =>{
    return ethers.formatEther(amount);
  }

  const getWalletData = async () =>{
    if( !address || !CrowdVaultContract ) return {"balance":0,"totalIncome":0,"coolDown":0};
    return await CrowdVaultContract.getWalletData(address);
  }

  const getLastCallTime = async (address) =>{
    if( !address || !CrowdVaultContract ) return {"parent":"","merchant":"","level":0};
    return await CrowdVaultContract.getLastCallTime(address);
  }

  const getAffiliateData = async () =>{
    if( !address || !CrowdVaultContract ) return {"parent":"","agent":"","level":0,"childrenCount":0};
    return await CrowdVaultContract.getAffiliateData(address);
  }

  const getVaultData = async (level) =>{
    if( !address || !CrowdVaultContract ) return {"amount":10,"cap":0,"coolDown":0,"level":level};
    return await CrowdVaultContract.getVaultData(address,level);
  }

  const registerWallet = async  (_referrer) =>{
    if( !CrowdVaultContract ) return false;
    try {
        const tx = await CrowdVaultContract.connect(signer).register(_referrer);
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
  const deposit = async (amount) => {
    if( !CrowdVaultContract ) return false;
    try {
      const approved = await approvedSpender(ethers.parseUnits(amount.toString(), 18));
      if( approved==true ){
        const tx = await CrowdVaultContract.depositBalance(ethers.parseUnits(amount.toString(), 18));
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
  const activateVIP = async () => {
    if( !address || !CrowdVaultContract ) return false;
    try {
       console.log(`Signer Address: ${address}`);
        const tx = await CrowdVaultContract.activateVIP();
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
      const tx = await CrowdVaultContract.withdrawBalance(ethers.parseUnits(amount.toString(), 18));
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

  const getChildren = useCallback(async (address) => {
    if (!address || !CrowdVaultContract) return { children: [], affiliates: [] };
  
    // Fetch children
    const childrenBatch = await CrowdVaultContract.getChildren(true, address, 0, 100);
  
    // Fetch level for each child
    const childrenWithLevels = await Promise.all(
      childrenBatch.map(async (child) => {
        const [parent, agent, level] = await CrowdVaultContract.getAffiliateData(child);
        console.log(`Parent: ${parent}`)
        console.log(`agent: ${agent}`)
        console.log(`level: ${level}`)
        return {
          address: child,
          level: level,
          parent,
          agent,
        };
      })
    );
  
    // Fetch affiliate info for the root address as well
    const affiliates = await CrowdVaultContract.getAffiliateData(address);
  
    return { children: childrenWithLevels, affiliates };
  }, [CrowdVaultContract]); // only changes if contract changes

  const approvedSpender = async (amount) => {
    try {
      const allowance = await USDTContract.allowance( account, SmartContractAddress);
      // console.log(`Allowance ${ethers.formatEther(amount)} tokens for spending`);
      // console.log(`Available ${allowance} allowance for spending`);
      // console.log(`Available ${amount} amount for spending`);
      if (allowance < amount ) {
        const tx = await USDTContract.approve(SmartContractAddress, amount)
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
      return false;
    }      
  }

  const getFees = useCallback(async () => {
    if ( !CrowdVaultContract) return { brokerFee: 0, entryFee: 0 };
    const regFee = await CrowdVaultContract.regFee();
    const entryFee = await CrowdVaultContract.entryFee();
    const agentFee = await CrowdVaultContract.agentFee();
    return {
      regFee: ethers.formatEther(regFee),
      entryFee: ethers.formatEther(entryFee),
      agentFee: ethers.formatEther(agentFee)
    };
  }, [CrowdVaultContract]);

  return {
    network,
    provider,
    signer,
    account,
    address,
    connected,
    CrowdVaultContract,
    affiliateData,
    walletData,
    bnbBalance,
    usdtBalance,
    vaultBalance,
    lastBlockTime,
    lastBlockNumber,
    agentFee,
    entryFee,
    regFee,
    getWalletData,
    getAffiliateData,
    getVaultData,
    convertWeiToEther,
    registerWallet,
    getLastCallTime,
    getChildren,
    activateVIP,
    getFees,
    withdraw,
    deposit
    
  };

}