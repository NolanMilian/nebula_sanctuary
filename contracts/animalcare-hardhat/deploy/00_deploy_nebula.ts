import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployment = await deploy("NebulaCareRegistry", {
    from: deployer,
    args: [deployer],
    log: true
  });

  log(`NebulaCareRegistry deployed at ${deployment.address}`);
};

export default func;
func.id = "deploy_nebula_care_registry";
func.tags = ["NebulaCareRegistry"];

