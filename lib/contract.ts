import { ethers } from "ethers";
import abi from "@/lib/eduChainABI.json";

export const getContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request wallet connection
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("Contract address not configured");
  }

  return new ethers.Contract(
    contractAddress,
    abi,
    signer
  );
};