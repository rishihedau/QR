import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { api } from "../utils/api";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contractConfig";

// ============ useWallet Hook ============
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isMetaMaskAvailable = typeof window !== "undefined" && !!window.ethereum;

  const getBalance = useCallback(async (address) => {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(address);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch {
      setBalance(null);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(accounts[0]);
      setChainId(parseInt(chainIdHex, 16));
      await getBalance(accounts[0]);
    } catch (err) {
      setError(err.message || "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, [getBalance]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    // Check if already connected
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        window.ethereum.request({ method: "eth_chainId" }).then((id) => {
          setChainId(parseInt(id, 16));
        });
        getBalance(accounts[0]);
      }
    });

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        getBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16));
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, getBalance]);

  const networkName = {
    1: "Ethereum",
    11155111: "Sepolia",
    80001: "Mumbai",
    31337: "Localhost",
    137: "Polygon",
  }[chainId] || `Chain ${chainId}`;

  return {
    account,
    chainId,
    networkName,
    balance,
    isConnecting,
    error,
    isConnected: !!account,
    isMetaMaskAvailable,
    connect,
    disconnect,
  };
}

// ============ useBlockchainStats Hook ============
export function useBlockchainStats(pollInterval = 10000) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalVerifications: 0,
    blockNumber: 0,
    contractAddress: CONTRACT_ADDRESS,
    loading: true,
    error: null,
  });
  
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats((prev) => ({
        ...prev,
        ...data,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [fetchStats, pollInterval]);

  return { ...stats, refetch: fetchStats };
}

// ============ useAnimatedCounter Hook ============
export function useAnimatedCounter(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    prevTarget.current = target;
    
    if (diff === 0) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}
