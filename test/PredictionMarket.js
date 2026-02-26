const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket", function () {
  let predictionMarket;
  let owner;
  let user1;
  let user2;
  let deadline;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    deadline = Math.floor(Date.now() / 1000) + 3600;

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy("Will ETH cross $4000?", deadline);
    await predictionMarket.waitForDeployment();
  });

  describe("Correct initial question", function () {
    it("should set the correct question", async function () {
      expect(await predictionMarket.question()).to.equal("Will ETH cross $4000?");
    });
  });

  describe("buyYes increases yesPool", function () {
    it("should increase yesPool when buying yes", async function () {
      const beforeYesPool = await predictionMarket.yesPool();
      const tx = await predictionMarket.buyYes({ value: ethers.parseEther("1") });
      await tx.wait();

      const afterYesPool = await predictionMarket.yesPool();
      expect(afterYesPool).to.equal(beforeYesPool + ethers.parseEther("1"));
    });

    it("should track user yes bet", async function () {
      await predictionMarket.buyYes({ value: ethers.parseEther("1") });
      const [yesBet, noBet] = await predictionMarket.getUserBet(owner.address);
      expect(yesBet).to.equal(ethers.parseEther("1"));
    });
  });

  describe("buyNo increases noPool", function () {
    it("should increase noPool when buying no", async function () {
      const beforeNoPool = await predictionMarket.noPool();
      const tx = await predictionMarket.buyNo({ value: ethers.parseEther("1") });
      await tx.wait();

      const afterNoPool = await predictionMarket.noPool();
      expect(afterNoPool).to.equal(beforeNoPool + ethers.parseEther("1"));
    });

    it("should track user no bet", async function () {
      await predictionMarket.buyNo({ value: ethers.parseEther("1") });
      const [yesBet, noBet] = await predictionMarket.getUserBet(owner.address);
      expect(noBet).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Only owner can resolve", function () {
    it("should allow owner to resolve", async function () {
      await predictionMarket.buyYes({ value: ethers.parseEther("1") });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      const tx = await predictionMarket.resolveMarket(true);
      await tx.wait();

      expect(await predictionMarket.resolved()).to.equal(true);
      expect(await predictionMarket.outcome()).to.equal(true);
    });

    it("should revert when non-owner tries to resolve", async function () {
      await predictionMarket.connect(user1).buyYes({ value: ethers.parseEther("1") });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await expect(
        predictionMarket.connect(user1).resolveMarket(true)
      ).to.be.revertedWithCustomError(predictionMarket, "OnlyOwner");
    });
  });

  describe("Winner claims reward", function () {
    it("should allow winner to claim reward", async function () {
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);

      await predictionMarket.connect(user1).buyYes({ value: ethers.parseEther("1") });
      await predictionMarket.connect(user2).buyNo({ value: ethers.parseEther("1") });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await predictionMarket.resolveMarket(true);

      const tx = await predictionMarket.connect(user1).claimReward();
      const receipt = await tx.wait();

      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      expect(user1BalanceAfter + gasUsed).to.be.gt(user1BalanceBefore);
    });
  });

  describe("Cannot double claim", function () {
    it("should revert when trying to claim twice", async function () {
      await predictionMarket.connect(user1).buyYes({ value: ethers.parseEther("1") });
      await predictionMarket.connect(user2).buyNo({ value: ethers.parseEther("1") });

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      await predictionMarket.resolveMarket(true);

      await predictionMarket.connect(user1).claimReward();

      await expect(
        predictionMarket.connect(user1).claimReward()
      ).to.be.revertedWithCustomError(predictionMarket, "NoRewardsToClaim");
    });
  });
});
