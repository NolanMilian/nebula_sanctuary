import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { NebulaCareRegistry } from "../types/contracts/NebulaCareRegistry";
import { NebulaCareRegistry__factory } from "../types/factories/contracts/NebulaCareRegistry__factory";

describe("NebulaCareRegistry", function () {
  let deployer: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let vet: HardhatEthersSigner;
  let contract: NebulaCareRegistry;
  let contractAddress: string;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    [deployer, alice, vet] = signers;
    await deployments.fixture(["NebulaCareRegistry"]);
    const deployment = await deployments.get("NebulaCareRegistry");
    contractAddress = deployment.address;
    contract = NebulaCareRegistry__factory.connect(contractAddress, deployer);
    await contract.connect(deployer).setVerifier(vet.address, true);
  });

  it("creates a pet and adds encrypted log vital", async function () {
    const tx = await contract
      .connect(alice)
      .registerCompanion("ipfs://profile-1", new Array<string>(), 0);
    const receipt = await tx.wait();
    const event = receipt!.logs
      .map((log) => contract.interface.parseLog(log))
      .find((parsed) => parsed?.name === "CompanionRegistered");
    expect(event).to.not.be.undefined;
    const companionId = Number(event?.args?.companionId);

    const encryptedVital = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(BigInt(5200)) // e.g., 5.2kg encoded as grams
      .encrypt();

    const logTx = await contract
      .connect(alice)
      .recordStoryWithVital(
        companionId,
        "ipfs://log-1",
        1,
        encryptedVital.handles[0],
        encryptedVital.inputProof
      );
    await logTx.wait();

    const [sumEncrypted, countEncrypted] = await contract
      .connect(alice)
      .getCompanionVitalSummary(companionId);
    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      sumEncrypted,
      contractAddress,
      alice
    );
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      countEncrypted,
      contractAddress,
      alice
    );

    expect(clearSum).to.equal(BigInt(5200));
    expect(clearCount).to.equal(BigInt(1));

    const [log] = await contract.getStories(companionId, 0, 10);
    expect(log.hasEncryptedVital).to.equal(true);
  });

  it("allows vet to verify a log entry", async function () {
    const petTx = await contract
      .connect(alice)
      .registerCompanion("ipfs://profile-2", [], 0);
    const receipt = await petTx.wait();
    const petEvent = receipt!.logs
      .map((log) => contract.interface.parseLog(log))
      .find((parsed) => parsed?.name === "CompanionRegistered");
    const companionId = Number(petEvent?.args?.companionId);

    const logTx = await contract
      .connect(alice)
      .recordStory(companionId, "ipfs://log-plain", 3);
    const logReceipt = await logTx.wait();
    const logEvent = logReceipt!.logs
      .map((log) => contract.interface.parseLog(log))
      .find((parsed) => parsed?.name === "StoryCaptured");
    const storyId = Number(logEvent?.args?.storyId);

    await expect(
      contract.connect(vet).attestStory(storyId, "ipfs://verify", true)
    )
      .to.emit(contract, "StoryAttested")
      .withArgs(companionId, storyId, vet.address, "ipfs://verify", true);

    const [log] = await contract.getStories(companionId, 0, 1);
    expect(log.verified).to.equal(true);
    expect(log.verifier).to.equal(vet.address);
  });
});

