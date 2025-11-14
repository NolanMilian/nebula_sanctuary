import { useCallback, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { NebulaCareRegistryABI } from "@/abi/NebulaCareRegistryABI";
import { NebulaCareRegistryAddresses } from "@/abi/NebulaCareRegistryAddresses";
import type { MetaMaskEthersState } from "@/hooks/metamask/useMetaMaskEthersSigner";
import type { GenericStringStorage } from "@/hooks/useInMemoryStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";

export type CompanionSnapshot = {
  companionId: bigint;
  profileCID: string;
  privacyLevel: number;
  createdAt: bigint;
  updatedAt: bigint;
  owners: string[];
  storyCount: bigint;
  hasVitalAura: boolean;
};

export type StoryView = {
  storyId: bigint;
  companionId: bigint;
  author: string;
  logCID: string;
  eventType: number;
  timestamp: bigint;
  verified: boolean;
  verifier: string;
  verifyCID: string;
  hasEncryptedVital: boolean;
};

type VitalOrbit = {
  sum: bigint;
  count: bigint;
  average: number;
};

type UseNebulaSanctuaryParams = {
  chainState: MetaMaskEthersState;
  fhevmInstance: FhevmInstance | undefined;
  storage: GenericStringStorage;
};

const NO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useNebulaSanctuary({
  chainState,
  fhevmInstance,
  storage
}: UseNebulaSanctuaryParams) {
  const {
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    isConnected,
    connect
  } = chainState;

  const [selectedCompanionId, setSelectedCompanionId] = useState<number>();
  const [companionSnapshot, setCompanionSnapshot] = useState<CompanionSnapshot>();
  const [companionGallery, setCompanionGallery] = useState<CompanionSnapshot[]>([]);
  const [stories, setStories] = useState<StoryView[]>([]);
  const [vitalOrbit, setVitalOrbit] = useState<VitalOrbit>();
  const [decryptedVitals, setDecryptedVitals] = useState<Record<string, bigint>>({});

  const [message, setMessage] = useState<string>("");
  const [isBusy, setBusy] = useState(false);

  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const entry =
      NebulaCareRegistryAddresses[chainId.toString() as keyof typeof NebulaCareRegistryAddresses];
    if (!entry) {
      return undefined;
    }
    return entry.address;
  }, [chainId]);

  const contractRef = useRef<ethers.Contract>();

  const ensureWritableContract = useCallback(() => {
    if (!ethersSigner) return undefined;
    if (!contractAddress) return undefined;
    if (
      !contractRef.current ||
      contractRef.current.runner !== ethersSigner ||
      String(contractRef.current.target).toLowerCase() !== contractAddress.toLowerCase()
    ) {
      contractRef.current = new ethers.Contract(
        contractAddress,
        NebulaCareRegistryABI.abi,
        ethersSigner
      );
    }
    return contractRef.current;
  }, [contractAddress, ethersSigner]);

  const ensureReadonlyContract = useCallback(() => {
    if (!ethersReadonlyProvider || !contractAddress) return undefined;
    return new ethers.Contract(
      contractAddress,
      NebulaCareRegistryABI.abi,
      ethersReadonlyProvider
    );
  }, [contractAddress, ethersReadonlyProvider]);
  const loadAllCompanions = useCallback(async () => {
    const contract = ensureReadonlyContract();
    if (!contract) return;
    try {
      const nextIdBig: bigint = await contract.nextCompanionId();
      const nextId = Number(nextIdBig);
      if (Number.isNaN(nextId) || nextId === 0) {
        setCompanionGallery([]);
        return;
      }
      const gallery: CompanionSnapshot[] = [];
      for (let id = 1; id < nextId; id += 1) {
        try {
          const view = (await contract.getCompanion(id)) as CompanionSnapshot;
          gallery.push(view);
        } catch (error) {
      console.warn(`Failed to fetch companion #${id}`, error);
        }
      }
      setCompanionGallery(gallery);
    } catch (error) {
    console.warn("Failed to load companion gallery", error);
    }
  }, [ensureReadonlyContract]);


  const upsertCompanion = useCallback((view: CompanionSnapshot) => {
    setCompanionGallery((prev) => {
      const index = prev.findIndex((p) => p.companionId === view.companionId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = view;
        return next;
      }
      return [...prev, view];
    });
  }, []);

  const refreshCompanion = useCallback(
    async (companionId: number) => {
      const contract = ensureReadonlyContract();
      if (!contract) return;
      try {
        const view = (await contract.getCompanion(companionId)) as CompanionSnapshot;
        setCompanionSnapshot(view);
        upsertCompanion(view);
      } catch (error) {
        console.warn("Failed to fetch companion details", error);
      }
    },
    [ensureReadonlyContract, upsertCompanion]
  );

  const refreshStories = useCallback(
    async (companionId: number) => {
      const contract = ensureReadonlyContract();
      if (!contract) return;
      try {
        const entries = (await contract.getStories(companionId, 0, 64)) as StoryView[];
        setStories(entries);
      } catch (error) {
        console.warn("Failed to fetch chronicle log", error);
      }
    },
    [ensureReadonlyContract]
  );

  const decryptCompanionOrbit = useCallback(
    async (companionId: number) => {
      if (!fhevmInstance || !ethersSigner || !contractAddress) return;
      const contract = ensureReadonlyContract();
      if (!contract) return;
      try {
        const [sumHandle, countHandle] = await (contract
          .connect(ethersSigner) as any).getCompanionVitalSummary(companionId);

        const signature = await FhevmDecryptionSignature.loadOrCreate({
          storage,
          instance: fhevmInstance,
          contracts: [contractAddress],
          signer: ethersSigner
        });

        const decrypted = await fhevmInstance.userDecrypt(
          [
            { handle: sumHandle, contractAddress },
            { handle: countHandle, contractAddress }
          ],
          signature.privateKey,
          signature.publicKey,
          signature.signature,
          signature.contractAddresses,
          signature.userAddress,
          signature.startTimestamp,
          signature.durationDays
        );

        const rawSum = decrypted[sumHandle];
        const rawCount = decrypted[countHandle];
        const sum = typeof rawSum === "bigint" ? (rawSum as bigint) : BigInt(0);
        const count = typeof rawCount === "bigint" ? (rawCount as bigint) : BigInt(0);
        const avg =
          count === BigInt(0)
            ? 0
            : Number(sum) / Number(count) / 1000; // assume grams and convert to kilograms
        setVitalOrbit({ sum, count, average: avg });
      } catch (error) {
        console.warn("Failed to decrypt companion vital aggregate", error);
      }
    },
    [contractAddress, ensureReadonlyContract, fhevmInstance, ethersSigner, storage]
  );

  const decryptStoryVital = useCallback(
    async (storyId: number) => {
      if (!fhevmInstance || !ethersSigner || !contractAddress) return;
      try {
        const signature = await FhevmDecryptionSignature.loadOrCreate({
          storage,
          instance: fhevmInstance,
          contracts: [contractAddress],
          signer: ethersSigner
        });
        const contract = ensureReadonlyContract();
        if (!contract) return;
        const handle = await (contract
          .connect(ethersSigner) as any).getStoryVitalHandle(storyId);
        const decrypted = await fhevmInstance.userDecrypt(
          [{ handle, contractAddress }],
          signature.privateKey,
          signature.publicKey,
          signature.signature,
          signature.contractAddresses,
          signature.userAddress,
          signature.startTimestamp,
          signature.durationDays
        );
        const raw = decrypted[handle];
        const value = typeof raw === "bigint" ? (raw as bigint) : BigInt(0);
        setDecryptedVitals((prev) => ({
          ...prev,
          [storyId.toString()]: value
        }));
      } catch (error) {
        console.warn("Failed to decrypt vital from chronicle", error);
      }
    },
    [contractAddress, ensureReadonlyContract, ethersSigner, fhevmInstance, storage]
  );

  const registerCompanion = useCallback(
    async (profileCID: string, privacyLevel: number) => {
      if (!isConnected) {
        connect();
        return;
      }
      const contract = ensureWritableContract();
      if (!contract || !ethersSigner) return;
      setBusy(true);
      setMessage("Igniting a new companion in the sanctuary…");
      try {
        const tx = await contract.registerCompanion(profileCID, [], privacyLevel);
        const receipt = await tx.wait();
        const event = receipt?.logs
          .map((log: ethers.Log) => contract.interface.parseLog(log))
          .find(
            (parsed: ethers.LogDescription | null) =>
              parsed?.name === "CompanionRegistered"
          );
        if (event) {
          const companionId = Number(event.args?.companionId);
          setSelectedCompanionId(companionId);
          await refreshCompanion(companionId);
          await refreshStories(companionId);
          setMessage("Companion successfully added to the sanctuary!");
        } else {
          setMessage("No companion ID returned. Try again in a moment.");
        }
      } catch (error) {
        console.error(error);
        setMessage("Create failed. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [connect, ensureWritableContract, ethersSigner, isConnected, refreshStories, refreshCompanion]
  );

  const recordStory = useCallback(
    async (
      companionId: number,
      logCID: string,
      eventType: number,
      vitalInGrams?: number
    ) => {
      if (!isConnected) {
        connect();
        return;
      }
      const contract = ensureWritableContract();
      if (!contract || !ethersSigner) return;
      setBusy(true);
      try {
        const targetAddress = await contract.getAddress();
        if (vitalInGrams && vitalInGrams > 0 && fhevmInstance) {
        setMessage("Packaging chronicle and encrypted vital…");
          const buffer = fhevmInstance.createEncryptedInput(
            targetAddress,
            await ethersSigner.getAddress()
          );
          buffer.add64(BigInt(vitalInGrams));
          const ciphertext = await buffer.encrypt();
          const tx = await contract.recordStoryWithVital(
            companionId,
            logCID,
            eventType,
            ciphertext.handles[0],
            ciphertext.inputProof
          );
          await tx.wait();
        } else {
        setMessage("Recording chronicle on-chain…");
          const tx = await contract.recordStory(companionId, logCID, eventType);
          await tx.wait();
        }
        await refreshStories(companionId);
        await refreshCompanion(companionId);
        await decryptCompanionOrbit(companionId);
        setMessage("Chronicle saved to the chain!");
      } catch (error) {
        console.error(error);
        setMessage("Chronicle upload failed. Please retry.");
      } finally {
        setBusy(false);
      }
    },
    [
      connect,
      ensureWritableContract,
      ethersSigner,
      isConnected,
      fhevmInstance,
      refreshStories,
      refreshCompanion,
      decryptCompanionOrbit
    ]
  );

  const spotlightCompanion = useCallback(
    async (companionId: number) => {
      if (!contractAddress) return;
      setSelectedCompanionId(companionId);
      await refreshCompanion(companionId);
      await refreshStories(companionId);
      await decryptCompanionOrbit(companionId);
    },
    [contractAddress, refreshCompanion, refreshStories, decryptCompanionOrbit]
  );

  const state = useMemo(
    () => ({
      contractAddress,
      selectedCompanionId,
      companionSnapshot,
      companionGallery,
      stories,
      vitalOrbit,
      decryptedVitals,
      message,
      isBusy,
      isConnected,
      connect,
      supportsFhevm: Boolean(fhevmInstance && contractAddress),
      canTransact:
        Boolean(ethersSigner && contractAddress) &&
        sameChain.current(chainId) &&
      sameSigner.current(ethersSigner)
    }),
    [
      contractAddress,
      selectedCompanionId,
      companionSnapshot,
      companionGallery,
      stories,
      vitalOrbit,
      decryptedVitals,
      message,
      isBusy,
      isConnected,
      connect,
      fhevmInstance,
      ethersSigner,
      chainId,
      sameChain,
      sameSigner
    ]
  );

  return {
    state,
    actions: {
      registerCompanion,
      recordStory,
      spotlightCompanion,
      decryptCompanionOrbit,
      decryptStoryVital,
      refreshCompanion,
      refreshStories,
      loadAllCompanions
    }
  };
}

