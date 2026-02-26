const hre = require("hardhat");
const quais = require("quais");
const { formatEther } = require("ethers");
const PredictionMarketJson = require("../artifacts/contracts/PredictionMarket.sol/PredictionMarket.json");
const { pushMetadataToIPFS } = require("@quai/hardhat-deploy-metadata");

async function deployPredictionMarket() {
  console.log("Starting deployment...");

  const rpcUrl = hre.network.config.url;
  console.log("RPC URL:", rpcUrl);
  console.log("Network:", hre.network.name);

  // Quai provider hangs if usePathing=true while URL already contains zone path (/cyprus1, /cyprus2, ...).
  const hasZonePath = /\/cyprus\d+\/?$/i.test(rpcUrl);
  const providerOptions = { usePathing: !hasZonePath };
  console.log("Provider options:", providerOptions);

  const provider = new quais.JsonRpcProvider(
    rpcUrl,
    undefined,
    providerOptions
  );

  console.log("Provider created");

  // Get private key from environment
  const networkSpecificPkVar = `${hre.network.name.toUpperCase()}_PK`;
  let privateKey = (
    process.env[networkSpecificPkVar] ||
    process.env.ORCHARD_PK ||
    process.env.CYPRUS1_PK ||
    process.env.PRIVATE_KEY ||
    ""
  ).trim();

  if (!privateKey) {
    throw new Error("Private key not found in environment variables.");
  }

  console.log("Private key found:", true);
  console.log("Private key length:", privateKey.length);

  // Normalize private key (add 0x if missing)
  if (/^[0-9a-fA-F]{64}$/.test(privateKey)) {
    privateKey = `0x${privateKey}`;
  }

  const wallet = new quais.Wallet(privateKey, provider);
  console.log("Wallet address:", wallet.address);

  // Get balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Deployer QUAI balance:", formatEther(balance));

  if (balance === 0n) {
    throw new Error("Insufficient QUAI balance for deployment.");
  }

  // Deploy contract
  console.log("Deploying contract...");
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Get IPFS hash from hardhat-deploy-metadata
  console.log("Getting IPFS metadata...");
  const ipfsHash = await pushMetadataToIPFS(hre, "PredictionMarket");
  console.log("IPFS Hash:", ipfsHash);

  const PredictionMarket = new quais.ContractFactory(
    PredictionMarketJson.abi,
    PredictionMarketJson.bytecode,
    wallet,
    ipfsHash
  );

  const contract = await PredictionMarket.deploy(
    "Will ETH cross $4000?",
    deadline
  );

  console.log("Transaction hash:", contract.deploymentTransaction().hash);

  console.log("Waiting for deployment...");
  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  console.log("Deployed contract address:", deployedAddress);
  console.log("Deployment successful!");
}

deployPredictionMarket().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
