import { ORION_MOMENTUM_SERIES_ADDRESS } from "@/config/contracts";
import { bytesToHex, getAddress } from "viem";
import type { Address } from "viem";

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

let fhevmInstance: any = null;

/**
 * Get SDK from window (loaded via static script tag in HTML)
 * SDK 0.3.0-5 is loaded via static script tag in index.html
 */
const getSDK = (): any => {
  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires browser environment");
  }

  // Check for both uppercase and lowercase versions
  const sdk = window.RelayerSDK || window.relayerSDK;

  if (!sdk) {
    throw new Error("RelayerSDK not loaded. Please ensure the script tag is in your HTML.");
  }

  return sdk;
};

/**
 * Initialize FHE instance (singleton pattern)
 */
export const initializeFHE = async (provider?: any): Promise<any> => {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires browser environment");
  }

  // Get Ethereum provider from multiple sources (supporting different wallets)
  const ethereumProvider = provider ||
    window.ethereum ||
    window.okxwallet?.provider ||
    window.okxwallet;

  if (!ethereumProvider) {
    throw new Error("No Ethereum provider found. Please connect your wallet first.");
  }

  try {
    const sdk = getSDK();
    const { initSDK, createInstance, SepoliaConfig } = sdk;

    await initSDK();

    const config = { ...SepoliaConfig, network: ethereumProvider };
    fhevmInstance = await createInstance(config);

    return fhevmInstance;
  } catch (error) {
    console.error("[FHE] Initialization failed:", error);
    throw error;
  }
};

/**
 * Get FHE instance if it exists
 */
export const getFHEInstance = (): any => {
  return fhevmInstance;
};

/**
 * Check if FHE is ready
 */
export const isFheReady = (): boolean => {
  return fhevmInstance !== null;
};

/**
 * Encrypt a bid amount (uint64) for auction
 */
export async function encryptBidAmount(
  bidAmount: bigint,
  userAddress: Address
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> {
  if (!isFheReady()) {
    await initializeFHE();
  }
  const instance = getFHEInstance();
  if (!instance) {
    throw new Error("FHE SDK not initialized");
  }

  const contractAddr = getAddress(ORION_MOMENTUM_SERIES_ADDRESS);
  const userAddr = getAddress(userAddress);

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add64(bidAmount);

  const { handles, inputProof } = await input.encrypt();

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`
  };
}

/**
 * Decrypt publicly available handles using the relayer SDK
 */
export async function publicDecryptHandles(handles: `0x${string}`[]) {
  if (handles.length === 0) {
    throw new Error("No handles provided for public decryption");
  }

  if (!isFheReady()) {
    await initializeFHE();
  }

  const instance = getFHEInstance();
  if (!instance) {
    throw new Error("FHE SDK not initialized");
  }

  const result = await instance.publicDecrypt(handles);

  const normalized: Record<string, number> = {};
  Object.entries(result.clearValues || {}).forEach(([handle, value]) => {
    const key = handle.toLowerCase();
    normalized[key] = typeof value === "bigint" ? Number(value) : Number(value);
  });

  const values = handles.map((handle) => normalized[handle.toLowerCase()] ?? 0);

  return {
    values,
    abiEncoded: result.abiEncodedClearValues as `0x${string}`,
    proof: result.decryptionProof as `0x${string}`
  };
}
