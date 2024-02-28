const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoStaking = artifacts.require("PapparicoStaking");

const bytes32 = require('bytes32');
const keccak256 = require('keccak256');
const {
    expectRevert, // Assertions for transactions that should fail
    time
} = require('@openzeppelin/test-helpers');

const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('chai');

contract("PapparicoStaking", async accounts => {

  let papparicoTokenInstance;
  let papparicoTreasuryInstance;
  let papparicoStakingInstance;
  const deployer = accounts[0];
  const anotherAccount = accounts[1];
  const user002 = accounts[2];
  const user003 = accounts[3];
  const user004 = accounts[4];
  const user005 = accounts[5];
  const user006 = accounts[6];
  const user007 = accounts[7];
  const user008 = accounts[8];
  const user009 = accounts[9];
  const toBigNumber = web3.utils.toBN;
    
  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  const SECONDS_IN_A_DAY = 86400;
  
  beforeEach(async () => {
    papparicoTreasuryInstance = await PapparicoTreasury.new();
    papparicoTokenInstance = await PapparicoToken.new(papparicoTreasuryInstance.address);
    papparicoStakingInstance = await PapparicoStaking.new(papparicoTokenInstance.address, papparicoTreasuryInstance.address);
  });

  function toBigNumberWithDecimals(number) {
    return toBigNumber(number).mul(DECIMAL_DIGITS);
  }

  async function mint(address, amount) {
    await papparicoTokenInstance.mint(address, amount, 1);
  }

  async function stake(userAddress, amount) {
    await papparicoTokenInstance.approve(papparicoStakingInstance.address, amount, {from: userAddress});
    await papparicoStakingInstance.stake(amount, {from: userAddress});
  }

  async function withdraw(userAddress, amount) {
    await papparicoStakingInstance.withdraw(amount, {from: userAddress});
  }

  async function withdrawAll(userAddress) {
    await papparicoStakingInstance.withdrawAll({from: userAddress});
  }

  async function claim(userAddress) {
    await papparicoStakingInstance.claim({from: userAddress});
  }

  it("Should create the contract in uninitialized mode.", async() => {
    assert.equal(await papparicoStakingInstance.isInitialized(), false);
  });

  it("Should create the contract with non-started emissions.", async() => {
    assert.equal(await papparicoStakingInstance.isEmissionsStarted(), false);
  });

  it("Should not allow calling initialize if the caller does not have the admin role.", async() => {
    await expectRevert.unspecified(papparicoStakingInstance.initialize(1, 1, {from: anotherAccount}));
  });

  it("Should not allow calling initialize if the future block number is less than current block number.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();

    await expectRevert(papparicoStakingInstance.initialize(currentBlockNumber - 1, 1), "Invalid future block number");
  });

  it("Should not allow calling initialize if the rewardEmissionPerBlock is 0.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();

    await expectRevert(papparicoStakingInstance.initialize(currentBlockNumber * 2, 0), "Should be greater than 0");
  });

  it("Should call initialize properly.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoStakingInstance.initialize(currentBlockNumber * 2, 1);

    assert.equal(await papparicoStakingInstance.isInitialized(), true);
  });

  it("Should not allow calling initialize twice.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoStakingInstance.initialize(currentBlockNumber * 2, 1);

    await expectRevert(papparicoStakingInstance.initialize(1, 1), "Already initialized");
  });

  it("Should not allow staking the amount 0.", async() => {
    await expectRevert(stake(user006, 0), "You can't stake 0.");
  });

  it("Should not allow staking without enough funds.", async() => {
    await mint(user006, toBigNumberWithDecimals(5000));
    await papparicoTokenInstance.approve(papparicoStakingInstance.address, toBigNumberWithDecimals(5000), {from: user006});

    await expectRevert(papparicoStakingInstance.stake(toBigNumberWithDecimals(6000), {from: user006}), "Not enough funds");
  });

  it("Should allow staking when the requirements are met.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    let contractBalanceBefore = await papparicoTokenInstance.balanceOf(papparicoStakingInstance.address);

    await mint(anotherAccount, amountAnotherAccount);
    await stake(anotherAccount, amountAnotherAccount);
    await mint(user006, amountUser006);
    await stake(user006, amountUser006);

    let contractBalanceAfter = await papparicoTokenInstance.balanceOf(papparicoStakingInstance.address);

    assert.equal(toBigNumber(await papparicoStakingInstance.totalStakedAllUsers()), 
      (amountAnotherAccount.add(amountUser006)).toString(), "Those values weren't staked.");
    assert.equal(toBigNumber(contractBalanceAfter), 
      (contractBalanceBefore.add(amountAnotherAccount).add(amountUser006)).toString(), "Those values weren't staked.");
  });

  it("Should set the userId when the user stakes for the first time.", async() => {
    let idCounter = toBigNumber(await papparicoStakingInstance.idCounter());
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    await mint(anotherAccount, amountAnotherAccount);
    await stake(anotherAccount, amountAnotherAccount);
    await mint(user006, amountUser006);
    await stake(user006, amountUser006);

    assert.equal(toBigNumber(await papparicoStakingInstance.userIds(anotherAccount)).toString(), 
      (idCounter.add(toBigNumber(1))).toString(), "The id was not set.");

    assert.equal(toBigNumber(await papparicoStakingInstance.userIds(user006)).toString(), 
      (idCounter.add(toBigNumber(2))).toString(), "The id was not set.");
  });

  it("Should not reset the userId when the user stakes from the second time.", async() => {
    await mint(anotherAccount, toBigNumberWithDecimals(10000));
    await stake(anotherAccount, toBigNumberWithDecimals(2000));
    let userId = toBigNumber(await papparicoStakingInstance.userIds(anotherAccount));
    await stake(anotherAccount, toBigNumberWithDecimals(2000));
    let userIdAfter = toBigNumber(await papparicoStakingInstance.userIds(anotherAccount));

    assert.equal(userId.toString(), userIdAfter.toString(), "The id's were not equals.");
  });

  it("Should store the user address when the user stakes for the first time.", async() => {
    let usersBefore = await papparicoStakingInstance.getUsers();
    await mint(anotherAccount, toBigNumberWithDecimals(10000));
    await stake(anotherAccount, toBigNumberWithDecimals(2000));
    let usersAfter = await papparicoStakingInstance.getUsers();
    let userId = await papparicoStakingInstance.userIds(anotherAccount);

    assert.isEmpty(usersBefore, "The user was stored.");
    assert.equal(usersAfter[userId - 1], anotherAccount, "The user was not stored.");
  });

  it("Should not store the user address again when the user stakes from the second time.", async() => {
    await mint(anotherAccount, toBigNumberWithDecimals(10000));
    await stake(anotherAccount, toBigNumberWithDecimals(2000));
    let users = await papparicoStakingInstance.getUsers();
    await stake(anotherAccount, toBigNumberWithDecimals(2000));
    let usersAfter = await papparicoStakingInstance.getUsers();
    let userId = await papparicoStakingInstance.userIds(anotherAccount);

    assert.equal(users[userId - 1], anotherAccount, "The user was not stored.");
    assert.equal(usersAfter[userId - 1], anotherAccount, "The user was not stored.");
    assert.equal(users.length, usersAfter.length, "The user was stored again.");
  });

  it("Should not emit rewards when the contract is not initialized.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    await mint(anotherAccount, amountAnotherAccount);
    await stake(anotherAccount, amountAnotherAccount);
    await mint(user006, amountUser006);
    await stake(user006, amountUser006);
    //Advances the time in 100 days
    await time.increase(time.duration.days(100));

    let rewardAnotherAccount = await papparicoStakingInstance.rewardsOf(anotherAccount);
    let rewardUser006 = await papparicoStakingInstance.rewardsOf(user006);

    assert.equal((rewardAnotherAccount.add(rewardUser006)).toString(), toBigNumber(0).toString(), "Values weren't 0.");
  });

  it("Should not emit rewards when the emissions did not start.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoStakingInstance.initialize(currentBlockNumber + 30, 1);
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    await mint(anotherAccount, amountAnotherAccount);
    await stake(anotherAccount, amountAnotherAccount);
    await mint(user006, amountUser006);
    await stake(user006, amountUser006);
    //Advances the time in 100 days
    await time.increase(time.duration.days(100));

    let rewardAnotherAccount = await papparicoStakingInstance.rewardsOf(anotherAccount);
    let rewardUser006 = await papparicoStakingInstance.rewardsOf(user006);

    assert.equal((rewardAnotherAccount.add(rewardUser006)).toString(), toBigNumber(0).toString(), "Values weren't 0.");
  });

  it("Should not allow withdraw when the amount is 0.", async() => {
    await expectRevert(withdraw(anotherAccount, 0), "You can't withdraw 0");
  });

  it("Should not allow withdraw when the amount is higher than stakes.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await stake(anotherAccount, amountAnotherAccount);
    
    await expectRevert(withdraw(anotherAccount, toBigNumberWithDecimals(10500)), "Invalid amount");
  });

  it("Should allow withdraw when requirements are met.", async() => {
    let userWalletAmount = toBigNumberWithDecimals(10300);
    let amountToWithdraw = toBigNumberWithDecimals(6000);
    await mint(anotherAccount, userWalletAmount);
    await stake(anotherAccount, userWalletAmount);

    await withdraw(anotherAccount, amountToWithdraw);
    
    assert.equal(toBigNumber(await papparicoStakingInstance.stakesOf(anotherAccount)).toString(), 
      userWalletAmount.sub(amountToWithdraw).toString(), "The amount was not withdrawn.");
  });

  it("Should withdraw and transfer the amount to the user's wallet.", async() => {
    let userWalletAmount = toBigNumberWithDecimals(10300);
    let amountToWithdraw = toBigNumberWithDecimals(6000);
    await mint(anotherAccount, userWalletAmount);
    await stake(anotherAccount, userWalletAmount);

    await withdraw(anotherAccount, amountToWithdraw);
    
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      amountToWithdraw.toString(), "The amount was not withdrawn.");
  });

  it("Should withdraw and send the discount fees (when it's set) to PapparicoTreasury.", async() => {
    let userWalletAmount = toBigNumberWithDecimals(10300);
    let amountToWithdraw = toBigNumberWithDecimals(6000);
    let setWithdrawalFee = 20 * 100; //20%
    let discountFee = amountToWithdraw.mul(toBigNumber(20)).div(toBigNumber(100));
    await papparicoStakingInstance.setWithdrawalFee(setWithdrawalFee);
    await mint(anotherAccount, userWalletAmount);
    await stake(anotherAccount, userWalletAmount);
    let papparicoTreasuryBalanceBefore = toBigNumberWithDecimals(await papparicoTokenInstance
      .balanceOf(papparicoTreasuryInstance.address));

    await withdraw(anotherAccount, amountToWithdraw);
    
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address)).toString(), 
      papparicoTreasuryBalanceBefore.add(discountFee).toString(), "The fees was not sent to PapparicoTreasury.");
  });

  it("Should withdraw and discount fees when it's set.", async() => {
    let userWalletAmount = toBigNumberWithDecimals(10300);
    let amountToWithdraw = toBigNumberWithDecimals(6000);
    let setWithdrawalFee = 20 * 100; //20%
    let withdrawnAmount = amountToWithdraw.sub(amountToWithdraw.mul(toBigNumber(20)).div(toBigNumber(100)));
    await papparicoStakingInstance.setWithdrawalFee(setWithdrawalFee);
    await mint(anotherAccount, userWalletAmount);
    await stake(anotherAccount, userWalletAmount);

    await withdraw(anotherAccount, amountToWithdraw);
    
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      withdrawnAmount.toString(), "The fees discount was not performed.");
  });

  it("Should withdraw all the staked funds when the user requests Withdraw All.", async() => {
    let userWalletAmount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, userWalletAmount);
    await stake(anotherAccount, userWalletAmount);

    await withdrawAll(anotherAccount);
    
    assert.equal(toBigNumber(await papparicoStakingInstance.stakesOf(anotherAccount)).toString(), 
      toBigNumber(0).toString(), "WithdrawAll did not withdraw the funds.");
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      userWalletAmount.toString(), "WithdrawAll did not transfer all the funds to the user's wallet.");
  }); 

  it("Should withdraw and claim the rewards when the user requests Withdraw All.", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoStakingInstance.address);
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await mint(anotherAccount, toBigNumberWithDecimals(1000000));
    let userWalletAmount = await papparicoTokenInstance.balanceOf(anotherAccount);
    await stake(anotherAccount, userWalletAmount);
    await papparicoStakingInstance.initialize(currentBlockNumber + 10, 1000);
    currentBlockNumber = await web3.eth.getBlockNumber();
    await time.advanceBlockTo(currentBlockNumber + 30);
    await time.increase(time.duration.days(1500));
    let accruedRewards = toBigNumber(await papparicoStakingInstance.rewardsOf(anotherAccount));

    await withdrawAll(anotherAccount);

    assert.equal(toBigNumber(await papparicoStakingInstance.stakesOf(anotherAccount)).toString(), 
      toBigNumber(0).toString(), "WithdrawAll did not withdraw the funds.");
    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).div(DECIMAL_DIGITS).toNumber(), 
      toBigNumber(userWalletAmount).add(accruedRewards).div(DECIMAL_DIGITS).toNumber(), 10, "The accrued rewards was not added to the withdrawn amount.");
  });

  it("Should supply rewards when the remaining amount is not enough to reward the user.", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoStakingInstance.address);
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await mint(anotherAccount, toBigNumberWithDecimals(1000000));
    let userWalletAmount = await papparicoTokenInstance.balanceOf(anotherAccount);
    await stake(anotherAccount, userWalletAmount);
    let rewardEmissionPerBlock = toBigNumber(30);
    await papparicoStakingInstance.initialize(currentBlockNumber + 10, rewardEmissionPerBlock);
    currentBlockNumber = await web3.eth.getBlockNumber();
    await time.advanceBlockTo(currentBlockNumber + 30);
    await time.increase(time.duration.days(1));
    
    let emission = toBigNumber(60);
    let emissionPrecision = toBigNumber(60000);
    let avgBlockInterval = toBigNumber(6);
    let currentRewardRate = rewardEmissionPerBlock.mul(emission).div(avgBlockInterval);
    let currentUserRewards = toBigNumber(await papparicoStakingInstance.rewardsOf(anotherAccount));
    let amountToSupply = currentUserRewards.add(currentRewardRate.mul(DECIMAL_DIGITS).mul(toBigNumber(SECONDS_IN_A_DAY).mul(toBigNumber(30)))
      .div(avgBlockInterval).div(emissionPrecision));
        
    await claim(anotherAccount);

    assert.equal(toBigNumber(await papparicoStakingInstance.currentRewardsSupply()).toString(), 
      amountToSupply.sub(currentUserRewards).toString(), "The contract was not supplied.");
  });

  it("Should claim rewards.", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoStakingInstance.address);
    let decimalPrecision = toBigNumber("100000000000000000000");
    let anotherAccountAmount = toBigNumberWithDecimals(10300);
    let user002Amount = toBigNumberWithDecimals(10);
    let user003Amount = toBigNumberWithDecimals(225000);
    let user004Amount = toBigNumberWithDecimals(1750);
    let user005Amount = toBigNumberWithDecimals(10585000);
    let user006Amount = toBigNumberWithDecimals(5);
    let user007Amount = toBigNumberWithDecimals(1750);
    let user008Amount = toBigNumberWithDecimals(65000);
    let user009Amount = toBigNumberWithDecimals(187);
    
    await mint(anotherAccount, anotherAccountAmount);
    await mint(user002, user002Amount);
    await mint(user003, user003Amount);
    await mint(user004, user004Amount);
    await mint(user005, user005Amount);
    await mint(user006, user006Amount);
    await mint(user007, user007Amount);
    await mint(user008, user008Amount);
    await mint(user009, user009Amount);

    await stake(anotherAccount, anotherAccountAmount);
    await stake(user002, user002Amount);
    await stake(user003, user003Amount);
    await stake(user004, user004Amount);
    await stake(user005, user005Amount);
    await stake(user006, user006Amount);
    await stake(user007, user007Amount);
    await stake(user008, user008Amount);
    await stake(user009, user009Amount);
    
    let totalStakedAllUsers = anotherAccountAmount
      .add(user002Amount)
      .add(user003Amount)
      .add(user004Amount)
      .add(user005Amount)
      .add(user006Amount)
      .add(user007Amount)
      .add(user008Amount)
      .add(user009Amount);
    let rewardEmissionPerBlock = 100;
    let emission = 60;
    let emissionPrecision = 60000;
    await papparicoStakingInstance.initialize(await web3.eth.getBlockNumber() + 10, rewardEmissionPerBlock);

    let approximateDailyApr = ((rewardEmissionPerBlock * emission * 14400 * 100) / emissionPrecision) 
      / (totalStakedAllUsers.div(DECIMAL_DIGITS).toNumber()); //14400 = ~NUMBER OF BLOCKS PER DAY
    
    await time.advanceBlockTo(await web3.eth.getBlockNumber() + 10);
    let daysToAdvance = 365;
    await time.increase(time.duration.days(daysToAdvance));
    let deltaToleratedDiff = 5;

    await claim(anotherAccount);
    await claim(user002);
    await claim(user003);
    await claim(user004);
    await claim(user005);
    await claim(user006);
    await claim(user007);
    await claim(user008);
    await claim(user009);

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).div(decimalPrecision).toNumber(), 
      anotherAccountAmount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");
    
    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user002)).div(decimalPrecision).toNumber(), 
      user002Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user003)).div(decimalPrecision).toNumber(), 
      user003Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");
    
    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user004)).div(decimalPrecision).toNumber(), 
      user004Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user005)).div(decimalPrecision).toNumber(), 
      user005Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user006)).div(decimalPrecision).toNumber(), 
      user006Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user007)).div(decimalPrecision).toNumber(), 
      user007Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user008)).div(decimalPrecision).toNumber(), 
      user008Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user009)).div(decimalPrecision).toNumber(), 
      user009Amount.mul(toBigNumber(approximateDailyApr * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");
  });

  it("Should not allow calling setStartBlock when the user does not have the Admin role.", async() => {
    await expectRevert.unspecified(papparicoStakingInstance.setStartBlock(10, {from: anotherAccount}));
  });

  it("Should not allow calling setStartBlock when the emissions already started.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoStakingInstance.initialize(currentBlockNumber + 10, 10);
    currentBlockNumber = await web3.eth.getBlockNumber();
    await time.advanceBlockTo(currentBlockNumber + 30);
    await time.increase(time.duration.days(1));

    await expectRevert(papparicoStakingInstance.setStartBlock(10), "Emissions already started");
  });

  it("Should not allow calling setStartBlock if the block number is less than the current block.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoStakingInstance.initialize(currentBlockNumber + 10, 10);

    await expectRevert(papparicoStakingInstance.setStartBlock(currentBlockNumber - 10), "Invalid future block number");
  });

  it("Should set StartBlock.", async() => {
    await papparicoStakingInstance.initialize(await web3.eth.getBlockNumber() + 30, 10);
    let startBlockBefore = await papparicoStakingInstance.startBlock();
    let startBlockAfter = startBlockBefore + 20;
    await papparicoStakingInstance.setStartBlock(startBlockAfter);

    assert.equal(startBlockAfter, await papparicoStakingInstance.startBlock(), "The values were not equals.");
  }); 

  it("Should not allow calling setAvgBlockInterval when the user does not have the Admin role.", async() => {
    await expectRevert.unspecified(papparicoStakingInstance.setAvgBlockInterval(10, {from: anotherAccount}));
  });

  it("Should set AvgBlockInterval.", async() => {
    let avgBlockIntervalBefore = await papparicoStakingInstance.avgBlockInterval();
    let avgBlockIntervalAfter = 10;
    await papparicoStakingInstance.setAvgBlockInterval(avgBlockIntervalAfter);
    
    assert.notEqual(avgBlockIntervalBefore, await papparicoStakingInstance.avgBlockInterval(), "The values were equals.");
    assert.equal(avgBlockIntervalAfter, await papparicoStakingInstance.avgBlockInterval(), "The values were not equals.");
  });

  it("Should set RewardEmissionPerBlock when emissions is not started.", async() => {
    let rewardEmissionPerBlockBefore = await papparicoStakingInstance.rewardEmissionPerBlock();
    let rewardEmissionPerBlockAfter = 10;
    await papparicoStakingInstance.setRewardEmissionPerBlock(rewardEmissionPerBlockAfter);
    
    assert.notEqual(rewardEmissionPerBlockBefore, await papparicoStakingInstance.rewardEmissionPerBlock(), "The values were equals.");
    assert.equal(rewardEmissionPerBlockAfter, await papparicoStakingInstance.rewardEmissionPerBlock(), "The values were not equals.");
  });

  it("Should set RewardEmissionPerBlock and update the rewards of all users when emissions is started.", async() => {
    let anotherAccountAmount = toBigNumberWithDecimals(10300);
    let user002Amount = toBigNumberWithDecimals(10);
    let user003Amount = toBigNumberWithDecimals(225000);
    
    await mint(anotherAccount, anotherAccountAmount);
    await mint(user002, user002Amount);
    await mint(user003, user003Amount);

    await stake(anotherAccount, anotherAccountAmount);
    await stake(user002, user002Amount);
    await stake(user003, user003Amount);
    
    let rewardEmissionPerBlock = 100;
    await papparicoStakingInstance.initialize(await web3.eth.getBlockNumber() + 10, rewardEmissionPerBlock);
    await time.advanceBlockTo(await web3.eth.getBlockNumber() + 10);
    await time.increase(time.duration.days(5));
    let onTheFlyAnotherAccountRewards = toBigNumber(await papparicoStakingInstance.rewardsOf(anotherAccount));
    let anotherAccountAccruedRewardsBeforeUpdate = toBigNumber(await papparicoStakingInstance.userCurrentRewards(anotherAccount));
    let onTheFlyUser002Rewards = toBigNumber(await papparicoStakingInstance.rewardsOf(user002));
    let user002AccruedRewardsBeforeUpdate = toBigNumber(await papparicoStakingInstance.userCurrentRewards(user002));
    let onTheFlyUser003Rewards = toBigNumber(await papparicoStakingInstance.rewardsOf(user003));
    let user003AccruedRewardsBeforeUpdate = toBigNumber(await papparicoStakingInstance.userCurrentRewards(user003));

    await papparicoStakingInstance.setRewardEmissionPerBlock(200);

    let anotherAccountAccruedRewardsAfterUpdate = toBigNumber(await papparicoStakingInstance.userCurrentRewards(anotherAccount));
    let user002AccruedRewardsAfterUpdate = toBigNumber(await papparicoStakingInstance.userCurrentRewards(user002));
    let user003AccruedRewardsAfterUpdate = toBigNumber(await papparicoStakingInstance.userCurrentRewards(user003));
    
    assert.equal(anotherAccountAccruedRewardsBeforeUpdate, 0, "Value was not zero");
    assert.equal(user002AccruedRewardsBeforeUpdate, 0, "Value was not zero");
    assert.equal(user003AccruedRewardsBeforeUpdate, 0, "Value was not zero");
    
    assert.isAtLeast(anotherAccountAccruedRewardsAfterUpdate.div(DECIMAL_DIGITS).toNumber(), 
      onTheFlyAnotherAccountRewards.div(DECIMAL_DIGITS).toNumber(), "Values were not equals");
    assert.isAtLeast(user002AccruedRewardsAfterUpdate.div(DECIMAL_DIGITS).toNumber(), 
      onTheFlyUser002Rewards.div(DECIMAL_DIGITS).toNumber(), "Values were not equals");
    assert.isAtLeast(user003AccruedRewardsAfterUpdate.div(DECIMAL_DIGITS).toNumber(), 
      onTheFlyUser003Rewards.div(DECIMAL_DIGITS).toNumber(), "Values were not equals");
  });

  it("Should set WithdrawalFee.", async() => {
    let withdrawalFeeBefore = await papparicoStakingInstance.withdrawalFee();
    let withdrawalFeeAfter = 200;
    await papparicoStakingInstance.setWithdrawalFee(withdrawalFeeAfter);
    
    assert.notEqual(withdrawalFeeBefore, await papparicoStakingInstance.withdrawalFee(), "The values were equals.");
    assert.equal(withdrawalFeeAfter, await papparicoStakingInstance.withdrawalFee(), "The values were not equals.");
  });

  it("Should not receive native token if the value sent is 0.", async() => {
    let amount = web3.utils.toWei('0', "ether");
    
    await expectRevert.unspecified(web3.eth.sendTransaction({from: deployer, 
      to: papparicoStakingInstance.address, value: amount}));
  });

  it("Should receive native token through receive() callback and send it to PapparicoTreasury.", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoStakingInstance.address, value: amount});
    
    assert.equal(await web3.eth.getBalance(papparicoTreasuryInstance.address), amount, 
      "PapparicoTreasury balance was not " + amount + ".");
  });

  it("Should not allow calling if the caller doesn't have the Admin role. <<-- sendToken method -->>", async() => {
    await expectRevert.unspecified(papparicoStakingInstance.sendToken(papparicoTokenInstance.address, {from: anotherAccount}));
  });
});