import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployDappRaterSchemaResolver: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  // const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const EAS_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000021";
  const DAPP_RATER_SCHEMA = "0xeaa96eb7dd9a3101cabc983cfbfcacc1594c70832d37a79b51bc43db4e4e40fb";

  //from: "0xfAf3fb18C9CFCD328B1DFDf55078C9BfE5e20740",
  await deploy("DappRaterSchemaResolver", {
    from: "0xfAf3fb18C9CFCD328B1DFDf55078C9BfE5e20740",//deployer,
    // Contract constructor arguments
    args: [EAS_CONTRACT_ADDRESS],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const schemaResolver = await hre.ethers.getContract<Contract>("DappRaterSchemaResolver", '0xfAf3fb18C9CFCD328B1DFDf55078C9BfE5e20740');
  console.log("👋 Schema resolver version: ", await schemaResolver.version());

  await deploy("DappRatingSystem", {
    from: "0xfAf3fb18C9CFCD328B1DFDf55078C9BfE5e20740", //deployer,
    args: [EAS_CONTRACT_ADDRESS, DAPP_RATER_SCHEMA],
    log: true,
    autoMine: true,
  });
};

export default deployDappRaterSchemaResolver;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployDappRaterSchemaResolver.tags = ["DappRatingSystem", "DappRaterSchemaResolver"];
