const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoVaults = artifacts.require("PapparicoVaults");

const bytes32 = require('bytes32');
const keccak256 = require('keccak256');
const {
    expectRevert, // Assertions for transactions that should fail
    time
} = require('@openzeppelin/test-helpers');

const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('chai');

contract("PapparicoVaults", async accounts => {

  let papparicoTokenInstance;
  let papparicoTreasuryInstance;
  let papparicoVaultsInstance;
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
    papparicoVaultsInstance = await PapparicoVaults.new(papparicoTokenInstance.address, papparicoTreasuryInstance.address);
  });

  function toBigNumberWithDecimals(number) {
    return toBigNumber(number).mul(DECIMAL_DIGITS);
  }

  async function mint(address, amount) {
    await papparicoTokenInstance.mint(address, amount, 1);
  }

  async function deposit(userAddress, amount, vaultType) {
    await papparicoTokenInstance.approve(papparicoVaultsInstance.address, amount, {from: userAddress});
    await papparicoVaultsInstance.deposit(amount, vaultType, {from: userAddress});
  }

  async function withdraw(userAddress, vaultType, id) {
    await papparicoVaultsInstance.withdraw(vaultType, id, {from: userAddress});
  }

  async function upgrade(userAddress, sourceVaultType, id, targetVaultType) {
    await papparicoVaultsInstance.upgrade(sourceVaultType, id, targetVaultType, {from: userAddress});
  }

  async function claim(userAddress) {
    await papparicoVaultsInstance.claim({from: userAddress});
  }

  async function depositsOf(userAddress, vaultType) {
    let deposits = await papparicoVaultsInstance.depositsOf(userAddress, vaultType);
    let sum = toBigNumber(0);
    for (let i = 0; i < deposits.length; i++) {
      sum = sum.add(toBigNumber(deposits[i].depositedValue));
    }
    return toBigNumber(sum);
  }

  async function depositBucketsOf(userAddress, vaultType) {
    return await papparicoVaultsInstance.depositsOf(userAddress, vaultType);
  }

  it("Should create the contract in uninitialized mode.", async() => {
    assert.equal(await papparicoVaultsInstance.isInitialized(), false);
  });

  it("Should create the contract with non-started emissions.", async() => {
    assert.equal(await papparicoVaultsInstance.isEmissionsStarted(), false);
  });

  it("Should not allow calling initialize if the caller does not have the admin role.", async() => {
    await expectRevert.unspecified(papparicoVaultsInstance.initialize(1, 1, {from: anotherAccount}));
  });

  it("Should not allow calling initialize if the future block number is less than current block number.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();

    await expectRevert(papparicoVaultsInstance.initialize(currentBlockNumber - 1, 1), "Invalid future block number");
  });

  it("Should not allow calling initialize if the rewardEmissionPerBlock is 0.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();

    await expectRevert(papparicoVaultsInstance.initialize(currentBlockNumber * 2, 0), "Should be greater than 0");
  });

  it("Should allow calling initialize if the caller has the admin role.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoVaultsInstance.initialize(currentBlockNumber * 2, 1);

    assert.equal(await papparicoVaultsInstance.isInitialized(), true);
  });

  it("Should not allow calling initialize twice.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoVaultsInstance.initialize(currentBlockNumber * 2, 1);

    await expectRevert(papparicoVaultsInstance.initialize(1, 1), "Already initialized");
  });

  it("Should not allow deposit the amount 0.", async() => {
    await expectRevert(deposit(user006, 0, 0), "You can't deposit 0."); //3rd PARAM = VAULT_1M
  });

  it("Should not allow deposit without enough funds.", async() => {
    await mint(user006, toBigNumberWithDecimals(5000));
    await papparicoTokenInstance.approve(papparicoVaultsInstance.address, toBigNumberWithDecimals(5000), {from: user006});

    await expectRevert(papparicoVaultsInstance.deposit(toBigNumberWithDecimals(6000), 0, {from: user006}), "Not enough funds"); //2rd PARAM = VAULT_1M
  });

  it("Should not allow deposit with invalid VaultType.", async() => {
    await mint(user006, toBigNumberWithDecimals(5000));
    await papparicoTokenInstance.approve(papparicoVaultsInstance.address, toBigNumberWithDecimals(5000), {from: user006});

    await expectRevert.unspecified(papparicoVaultsInstance.deposit(toBigNumberWithDecimals(6000), 10, {from: user006})); //2rd PARAM = INVALID (0..4)
  });

  it("Should allow deposit when the requirements are met.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser002 = toBigNumberWithDecimals(500);
    let amountUser003 = toBigNumberWithDecimals(25);
    let amountUser004 = toBigNumberWithDecimals(321654);
    let amountUser005 = toBigNumberWithDecimals(8500);
    let contractBalanceBefore = await papparicoTokenInstance.balanceOf(papparicoVaultsInstance.address);

    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0); //3rd PARAM 0 = VAULT_1M
    
    await mint(user002, amountUser002);
    await deposit(user002, amountUser002, 1);               //3rd PARAM 1 = VAULT_6M

    await mint(user003, amountUser003);
    await deposit(user003, amountUser003, 2);               //3rd PARAM 2 = VAULT_12M

    await mint(user004, amountUser004);
    await deposit(user004, amountUser004, 3);               //3rd PARAM 3 = VAULT_24M
    
    await mint(user005, amountUser005);
    await deposit(user005, amountUser005, 4);               //3rd PARAM 4 = VAULT_48M

    let contractBalanceAfter = await papparicoTokenInstance.balanceOf(papparicoVaultsInstance.address);

    assert.equal(toBigNumber(await papparicoVaultsInstance.totalDepositedAllUsers()), 
      (amountAnotherAccount
        .add(amountUser002)
        .add(amountUser003)
        .add(amountUser004)
        .add(amountUser005)).toString(), "Those values weren't deposited.");
    assert.equal(toBigNumber(contractBalanceAfter), 
        (contractBalanceBefore
          .add(amountAnotherAccount)
          .add(amountUser002)
          .add(amountUser003)
          .add(amountUser004)
          .add(amountUser005)).toString(), "Those values weren't deposited.");
  });

  it("Should deposit on specifics vaults.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser002 = toBigNumberWithDecimals(500);
    let amountUser003 = toBigNumberWithDecimals(25);
    let amountUser004 = toBigNumberWithDecimals(321654);
    let amountUser005 = toBigNumberWithDecimals(8500);

    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0); //3rd PARAM 0 = VAULT_1M
    
    await mint(user002, amountUser002);
    await deposit(user002, amountUser002, 1);               //3rd PARAM 1 = VAULT_6M

    await mint(user003, amountUser003);
    await deposit(user003, amountUser003, 2);               //3rd PARAM 2 = VAULT_12M

    await mint(user004, amountUser004);
    await deposit(user004, amountUser004, 3);               //3rd PARAM 3 = VAULT_24M
    
    await mint(user005, amountUser005);
    await deposit(user005, amountUser005, 4);               //3rd PARAM 4 = VAULT_48M
    
    assert.equal(toBigNumber(await depositsOf(anotherAccount, 0)).toString(), amountAnotherAccount.toString(), "Value was not deposited.");
    assert.equal(toBigNumber(await depositsOf(user002, 1)).toString(), amountUser002.toString(), "Value was not deposited.");
    assert.equal(toBigNumber(await depositsOf(user003, 2)).toString(), amountUser003.toString(), "Value was not deposited.");
    assert.equal(toBigNumber(await depositsOf(user004, 3)).toString(), amountUser004.toString(), "Value was not deposited.");
    assert.equal(toBigNumber(await depositsOf(user005, 4)).toString(), amountUser005.toString(), "Value was not deposited.");
  });

  it("Should deposit on multiple vaults.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser002 = toBigNumberWithDecimals(15300);

    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(1000), 0);
    await deposit(anotherAccount,  toBigNumberWithDecimals(780), 1);
    await deposit(anotherAccount, toBigNumberWithDecimals(1000), 2);
    await deposit(anotherAccount,  toBigNumberWithDecimals(750), 2);
    await deposit(anotherAccount, toBigNumberWithDecimals(1000), 3);
    await deposit(anotherAccount, toBigNumberWithDecimals(1000), 3);
    
    await mint(user002, amountUser002);
    await deposit(user002, toBigNumberWithDecimals(2500), 0);
    await deposit(user002, toBigNumberWithDecimals(1000), 0);
    await deposit(user002,  toBigNumberWithDecimals(150), 0);
    await deposit(user002, toBigNumberWithDecimals(3000), 1);
    await deposit(user002,  toBigNumberWithDecimals(100), 1);
    await deposit(user002,   toBigNumberWithDecimals(50), 1);
    await deposit(user002,  toBigNumberWithDecimals(173), 2);
    await deposit(user002,  toBigNumberWithDecimals(120), 3);
    await deposit(user002,  toBigNumberWithDecimals(400), 4);
    await deposit(user002,  toBigNumberWithDecimals(500), 4);
        
    assert.equal(toBigNumber(await depositsOf(anotherAccount, 0)).toString(), toBigNumberWithDecimals(1000).toString(), "Value was not deposited in Vault 1M.");
    assert.equal(toBigNumber(await depositsOf(anotherAccount, 1)).toString(), toBigNumberWithDecimals(780).toString(), "Value was not deposited in Vault 6M.");
    assert.equal(toBigNumber(await depositsOf(anotherAccount, 2)).toString(), toBigNumberWithDecimals(1750).toString(), "Value was not deposited in Vault 12M.");
    assert.equal(toBigNumber(await depositsOf(anotherAccount, 3)).toString(), toBigNumberWithDecimals(2000).toString(), "Value was not deposited in Vault 24M.");

    assert.equal(toBigNumber(await depositsOf(user002, 0)).toString(), toBigNumberWithDecimals(3650).toString(), "Value was not deposited in Vault 1M.");
    assert.equal(toBigNumber(await depositsOf(user002, 1)).toString(), toBigNumberWithDecimals(3150).toString(), "Value was not deposited in Vault 6M.");
    assert.equal(toBigNumber(await depositsOf(user002, 2)).toString(), toBigNumberWithDecimals(173).toString(), "Value was not deposited in Vault 12M.");
    assert.equal(toBigNumber(await depositsOf(user002, 3)).toString(), toBigNumberWithDecimals(120).toString(), "Value was not deposited in Vault 24M.");
    assert.equal(toBigNumber(await depositsOf(user002, 4)).toString(), toBigNumberWithDecimals(900).toString(), "Value was not deposited in Vault 48M.");
  });

  it("Should set the userId when the user deposits for the first time.", async() => {
    let idCounter = toBigNumber(await papparicoVaultsInstance.idCounter());
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0); //3rd PARAM 0 = VAULT_1M
    await mint(user006, amountUser006);
    await deposit(user006, amountUser006, 1); //3rd PARAM 4 = VAULT_6M

    assert.equal(toBigNumber(await papparicoVaultsInstance.userIds(anotherAccount)).toString(), 
      (idCounter.add(toBigNumber(1))).toString(), "The id was not set.");

    assert.equal(toBigNumber(await papparicoVaultsInstance.userIds(user006)).toString(), 
      (idCounter.add(toBigNumber(2))).toString(), "The id was not set.");
  });

  it("Should not reset the userId when the user deposits from the second time.", async() => {
    await mint(anotherAccount, toBigNumberWithDecimals(10000));
    await deposit(anotherAccount, toBigNumberWithDecimals(2000), 0);
    let userId = toBigNumber(await papparicoVaultsInstance.userIds(anotherAccount));
    await deposit(anotherAccount, toBigNumberWithDecimals(2000), 1);
    let userIdAfter = toBigNumber(await papparicoVaultsInstance.userIds(anotherAccount));

    assert.equal(userId.toString(), userIdAfter.toString(), "The id's were not equals.");
  });

  it("Should store the user address when the user deposits for the first time.", async() => {
    let usersBefore = await papparicoVaultsInstance.getUsers();
    await mint(anotherAccount, toBigNumberWithDecimals(10000));
    await deposit(anotherAccount, toBigNumberWithDecimals(2000), 0);
    let usersAfter = await papparicoVaultsInstance.getUsers();
    let userId = await papparicoVaultsInstance.userIds(anotherAccount);

    assert.isEmpty(usersBefore, "The user was stored.");
    assert.equal(usersAfter[userId - 1], anotherAccount, "The user was not stored.");
  });

  it("Should not store the user address again when the user deposits from the second time.", async() => {
    await mint(anotherAccount, toBigNumberWithDecimals(10000));
    await deposit(anotherAccount, toBigNumberWithDecimals(2000), 0);
    let users = await papparicoVaultsInstance.getUsers();
    await deposit(anotherAccount, toBigNumberWithDecimals(2000), 1);
    let usersAfter = await papparicoVaultsInstance.getUsers();
    let userId = await papparicoVaultsInstance.userIds(anotherAccount);

    assert.equal(users[userId - 1], anotherAccount, "The user was not stored.");
    assert.equal(usersAfter[userId - 1], anotherAccount, "The user was not stored.");
    assert.equal(users.length, usersAfter.length, "The user was stored again.");
  });

  it("Should not emit rewards when the contract is not initialized.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    await mint(user006, amountUser006);
    await deposit(user006, amountUser006, 4);
    //Advances the time in 100 days
    await time.increase(time.duration.days(100));

    let rewardAnotherAccount = await papparicoVaultsInstance.rewardsOf(anotherAccount);
    let rewardUser006 = await papparicoVaultsInstance.rewardsOf(user006);

    assert.equal((rewardAnotherAccount.add(rewardUser006)).toString(), toBigNumber(0).toString(), "Values weren't 0.");
  });

  it("Should not emit rewards when the emissions did not start.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoVaultsInstance.initialize(currentBlockNumber + 30, 1);
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    let amountUser006 = toBigNumberWithDecimals(3585);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    await mint(user006, amountUser006);
    await deposit(user006, amountUser006, 1);
    //Advances the time in 100 days
    await time.increase(time.duration.days(100));

    let rewardAnotherAccount = await papparicoVaultsInstance.rewardsOf(anotherAccount);
    let rewardUser006 = await papparicoVaultsInstance.rewardsOf(user006);

    assert.equal((rewardAnotherAccount.add(rewardUser006)).toString(), toBigNumber(0).toString(), "Values weren't 0.");
  });

  it("Should not allow withdraw when the user does not have deposits.", async() => {
    await expectRevert(withdraw(anotherAccount, 0, 0), "No deposits.");
  });

  it("Should not allow withdraw with invalid VaultType.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);

    await expectRevert.unspecified(withdraw(anotherAccount, 8, 0)); //2rd PARAM = INVALID (0..4)
  });

  it("Should not allow withdraw when the deposit id does not exist.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    
    await expectRevert(withdraw(anotherAccount, 0, 5), "Invalid deposit."); //5 = INVALID DEPOSIT ID
  }); 

  it("Should not allow withdraw before 'locked until' time (VAULT 1M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    await time.increase(time.duration.days(29));
    
    await expectRevert(withdraw(anotherAccount, 0, 0), "You can't withdraw before 'locked until' time.");
  });

  it("Should not allow withdraw before 'locked until' time (VAULT 6M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 1);
    await time.increase(time.duration.days(179));
    
    await expectRevert(withdraw(anotherAccount, 1, 0), "You can't withdraw before 'locked until' time.");
  });

  it("Should not allow withdraw before 'locked until' time (VAULT 12M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 2);
    await time.increase(time.duration.days(359));
    
    await expectRevert(withdraw(anotherAccount, 2, 0), "You can't withdraw before 'locked until' time.");
  });

  it("Should not allow withdraw before 'locked until' time (VAULT 24M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 3);
    await time.increase(time.duration.days(729));
    
    await expectRevert(withdraw(anotherAccount, 3, 0), "You can't withdraw before 'locked until' time.");
  });

  it("Should not allow withdraw before 'locked until' time (VAULT 48M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 4); //0 = VAULT TYPE
    await time.increase(time.duration.days(1459));
    
    await expectRevert(withdraw(anotherAccount, 4, 0), "You can't withdraw before 'locked until' time.");
  });

  it("Should allow withdraw when requirements are met (VAULT 1M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    await time.increase(time.duration.days(31));

    let depositBeforeWithdrawal = await depositsOf(anotherAccount, 0);
    await withdraw(anotherAccount, 0, 0);
    let depositAfterWithdrawal = await depositsOf(anotherAccount, 0);
    
    assert.equal(depositBeforeWithdrawal.toString(), amountAnotherAccount.toString(), "The amount was not deposited.");
    assert.equal(depositAfterWithdrawal.toString(), 0, "The amount was not withdrawn.");
  });

  it("Should allow withdraw when requirements are met (VAULT 6M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 1);
    await time.increase(time.duration.days(187));

    let depositBeforeWithdrawal = await depositsOf(anotherAccount, 1);
    await withdraw(anotherAccount, 1, 0);
    let depositAfterWithdrawal = await depositsOf(anotherAccount, 1);
    
    assert.equal(depositBeforeWithdrawal.toString(), amountAnotherAccount.toString(), "The amount was not deposited.");
    assert.equal(depositAfterWithdrawal.toString(), 0, "The amount was not withdrawn.");
  });

  it("Should allow withdraw when requirements are met (VAULT 12M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 2);
    await time.increase(time.duration.days(367));

    let depositBeforeWithdrawal = await depositsOf(anotherAccount, 2);
    await withdraw(anotherAccount, 2, 0);
    let depositAfterWithdrawal = await depositsOf(anotherAccount, 2);
    
    assert.equal(depositBeforeWithdrawal.toString(), amountAnotherAccount.toString(), "The amount was not deposited.");
    assert.equal(depositAfterWithdrawal.toString(), 0, "The amount was not withdrawn.");
  });

  it("Should allow withdraw when requirements are met (VAULT 24M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 3);
    await time.increase(time.duration.days(732));

    let depositBeforeWithdrawal = await depositsOf(anotherAccount, 3);
    await withdraw(anotherAccount, 3, 0);
    let depositAfterWithdrawal = await depositsOf(anotherAccount, 3);
    
    assert.equal(depositBeforeWithdrawal.toString(), amountAnotherAccount.toString(), "The amount was not deposited.");
    assert.equal(depositAfterWithdrawal.toString(), 0, "The amount was not withdrawn.");
  });

  it("Should allow withdraw when requirements are met (VAULT 48M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 4);
    await time.increase(time.duration.days(1464));

    let depositBeforeWithdrawal = await depositsOf(anotherAccount, 4);
    await withdraw(anotherAccount, 4, 0);
    let depositAfterWithdrawal = await depositsOf(anotherAccount, 4);
    
    assert.equal(depositBeforeWithdrawal.toString(), amountAnotherAccount.toString(), "The amount was not deposited.");
    assert.equal(depositAfterWithdrawal.toString(), 0, "The amount was not withdrawn.");
  });

  it("Should withdraw and transfer the amount to the user's wallet (VAULT 1M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(4300), 0);
    let remainingFundsAfterDeposit = await papparicoTokenInstance.balanceOf(anotherAccount);
    await time.increase(time.duration.days(31));

    await withdraw(anotherAccount, 0, 0);
    
    assert.equal(remainingFundsAfterDeposit.toString(), 
      amountAnotherAccount.sub(toBigNumberWithDecimals(4300)), "The amount was not deposited.");
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      amountAnotherAccount.toString(), "The amount was not withdrawn.");
  });

  it("Should withdraw and transfer the amount to the user's wallet (VAULT 6M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(4300), 1);
    let remainingFundsAfterDeposit = await papparicoTokenInstance.balanceOf(anotherAccount);
    await time.increase(time.duration.days(187));

    await withdraw(anotherAccount, 1, 0);
    
    assert.equal(remainingFundsAfterDeposit.toString(), 
      amountAnotherAccount.sub(toBigNumberWithDecimals(4300)), "The amount was not deposited.");
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      amountAnotherAccount.toString(), "The amount was not withdrawn.");
  });

  it("Should withdraw and transfer the amount to the user's wallet (VAULT 12M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(4300), 2);
    let remainingFundsAfterDeposit = await papparicoTokenInstance.balanceOf(anotherAccount);
    await time.increase(time.duration.days(367));

    await withdraw(anotherAccount, 2, 0);
    
    assert.equal(remainingFundsAfterDeposit.toString(), 
      amountAnotherAccount.sub(toBigNumberWithDecimals(4300)), "The amount was not deposited.");
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      amountAnotherAccount.toString(), "The amount was not withdrawn.");
  });

  it("Should withdraw and transfer the amount to the user's wallet (VAULT 24M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(4300), 3);
    let remainingFundsAfterDeposit = await papparicoTokenInstance.balanceOf(anotherAccount);
    await time.increase(time.duration.days(732));

    await withdraw(anotherAccount, 3, 0);
    
    assert.equal(remainingFundsAfterDeposit.toString(), 
      amountAnotherAccount.sub(toBigNumberWithDecimals(4300)), "The amount was not deposited.");
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      amountAnotherAccount.toString(), "The amount was not withdrawn.");
  });

  it("Should withdraw and transfer the amount to the user's wallet (VAULT 48M).", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(4300), 4);
    let remainingFundsAfterDeposit = await papparicoTokenInstance.balanceOf(anotherAccount);
    await time.increase(time.duration.days(1464));

    await withdraw(anotherAccount, 4, 0);
    
    assert.equal(remainingFundsAfterDeposit.toString(), 
      amountAnotherAccount.sub(toBigNumberWithDecimals(4300)), "The amount was not deposited.");
    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      amountAnotherAccount.toString(), "The amount was not withdrawn.");
  });

  it("Should remove the deposit when withdraw.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(300), 0);
    await time.increase(time.duration.days(20));
    await deposit(anotherAccount, toBigNumberWithDecimals(1500), 0);
    await time.increase(time.duration.days(45));
    await deposit(anotherAccount, toBigNumberWithDecimals(265), 0);
    
    let depositsBefore = await depositBucketsOf(anotherAccount, 0);
    let deposit0 = depositsBefore[0];
    let deposit1 = depositsBefore[1];
    let deposit2 = depositsBefore[2];
    await withdraw(anotherAccount, 0, 1);
    let depositsAfter = await depositBucketsOf(anotherAccount, 0);

    let deposit0Found = depositsAfter.find(element => 
      element.depositedValue == deposit0.depositedValue && 
      element.depositDate == deposit0.depositDate && 
      element.lockedUntil == deposit0.lockedUntil);

    let deposit2Found = depositsAfter.find(element => 
      element.depositedValue == deposit2.depositedValue && 
      element.depositDate == deposit2.depositDate && 
      element.lockedUntil == deposit2.lockedUntil);

    assert.isUndefined(depositsAfter.find(element => 
      element.depositedValue == deposit1.depositedValue && 
      element.depositDate == deposit1.depositDate && 
      element.lockedUntil == deposit1.lockedUntil), "The deposit1 was found");
    
    assert.equal(deposit0Found.depositedValue, deposit0.depositedValue, "The deposit0 was not found");
    assert.equal(deposit0Found.depositDate, deposit0.depositDate, "The deposit0 was not found");
    assert.equal(deposit0Found.lockedUntil, deposit0.lockedUntil, "The deposit0 was not found");

    assert.equal(deposit2Found.depositedValue, deposit2.depositedValue, "The deposit2 was not found");
    assert.equal(deposit2Found.depositDate, deposit2.depositDate, "The deposit2 was not found");
    assert.equal(deposit2Found.lockedUntil, deposit2.lockedUntil, "The deposit2 was not found");
  });

  it("Should supply rewards when the remaining amount is not enough to reward the user.", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoVaultsInstance.address);
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await mint(anotherAccount, toBigNumberWithDecimals(1000000));
    let userWalletAmount = await papparicoTokenInstance.balanceOf(anotherAccount);
    await deposit(anotherAccount, userWalletAmount, 0);
    let rewardEmissionPerBlock = toBigNumber(30);
    await papparicoVaultsInstance.initialize(currentBlockNumber + 10, rewardEmissionPerBlock);
    currentBlockNumber = await web3.eth.getBlockNumber();
    await time.advanceBlockTo(currentBlockNumber + 30);
    await time.increase(time.duration.days(1));
    
    let emission = toBigNumber(60);
    let emissionPrecision = toBigNumber(60000);
    let avgBlockInterval = toBigNumber(6);
    let currentRewardRate = rewardEmissionPerBlock.mul(emission).div(avgBlockInterval);
    let currentUserRewards = toBigNumber(await papparicoVaultsInstance.rewardsOf(anotherAccount));
    let amountToSupply = currentUserRewards.add(currentRewardRate.mul(DECIMAL_DIGITS).mul(toBigNumber(96)).mul(toBigNumber(SECONDS_IN_A_DAY).mul(toBigNumber(30)))
      .div(avgBlockInterval).div(emissionPrecision));
        
    await claim(anotherAccount);

    assert.equal(toBigNumber(await papparicoVaultsInstance.currentRewardsSupply()).toString(), 
      amountToSupply.sub(currentUserRewards).toString(), "The contract was not supplied.");
  });

  it("Should claim rewards.", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoVaultsInstance.address);
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

    await deposit(anotherAccount, anotherAccountAmount, 0);
    await deposit(user002, user002Amount, 0);
    await deposit(user003, user003Amount, 0);
    await deposit(user004, user004Amount, 1);
    await deposit(user005, user005Amount, 2);
    await deposit(user006, user006Amount, 2);
    await deposit(user007, user007Amount, 3);
    await deposit(user008, user008Amount, 4);
    await deposit(user009, user009Amount, 4);
    
    let totalDepositedAllUsers = anotherAccountAmount
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
    await papparicoVaultsInstance.initialize(await web3.eth.getBlockNumber() + 10, rewardEmissionPerBlock);

    let approximateDailyAprVault1M = ((rewardEmissionPerBlock * emission * 14400 * 100) / emissionPrecision) 
      / (totalDepositedAllUsers.div(DECIMAL_DIGITS).toNumber()); //14400 = ~NUMBER OF BLOCKS PER DAY

    let approximateDailyAprVault6M = ((rewardEmissionPerBlock * emission * 14400 * 100 * 12) / emissionPrecision) 
      / (totalDepositedAllUsers.div(DECIMAL_DIGITS).toNumber());

    let approximateDailyAprVault12M = ((rewardEmissionPerBlock * emission * 14400 * 100 * 24) / emissionPrecision) 
      / (totalDepositedAllUsers.div(DECIMAL_DIGITS).toNumber());
    
    let approximateDailyAprVault24M = ((rewardEmissionPerBlock * emission * 14400 * 100 * 48) / emissionPrecision) 
      / (totalDepositedAllUsers.div(DECIMAL_DIGITS).toNumber());

    let approximateDailyAprVault48M = ((rewardEmissionPerBlock * emission * 14400 * 100 * 96) / emissionPrecision) 
      / (totalDepositedAllUsers.div(DECIMAL_DIGITS).toNumber());
    
    await time.advanceBlockTo(await web3.eth.getBlockNumber() + 10);
    let daysToAdvance = 1464;
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
      anotherAccountAmount.mul(toBigNumber(approximateDailyAprVault1M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");
    
    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user002)).div(decimalPrecision).toNumber(), 
      user002Amount.mul(toBigNumber(approximateDailyAprVault1M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user003)).div(decimalPrecision).toNumber(), 
      user003Amount.mul(toBigNumber(approximateDailyAprVault1M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");
    
    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user004)).div(decimalPrecision).toNumber(), 
      user004Amount.mul(toBigNumber(approximateDailyAprVault6M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user005)).div(decimalPrecision).toNumber(), 
      user005Amount.mul(toBigNumber(approximateDailyAprVault12M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user006)).div(decimalPrecision).toNumber(), 
      user006Amount.mul(toBigNumber(approximateDailyAprVault12M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user007)).div(decimalPrecision).toNumber(), 
      user007Amount.mul(toBigNumber(approximateDailyAprVault24M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user008)).div(decimalPrecision).toNumber(), 
      user008Amount.mul(toBigNumber(approximateDailyAprVault48M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");

    assert.approximately(toBigNumber(await papparicoTokenInstance.balanceOf(user009)).div(decimalPrecision).toNumber(), 
      user009Amount.mul(toBigNumber(approximateDailyAprVault48M * 1e18)).mul(toBigNumber(daysToAdvance))
      .div(toBigNumber(100)).div(DECIMAL_DIGITS).div(decimalPrecision).toNumber(), deltaToleratedDiff, "Value was incorrect.");
  });

  it("Should not allow upgrade when the source vault is 48M.", async() => {
    await expectRevert(upgrade(anotherAccount, 4, 0, 4), "Can't upgrade 48M vault");
  });

  it("Should not allow upgrade when the source vault is greater than target.", async() => {
    await expectRevert(upgrade(anotherAccount, 2, 0, 1), "Source vault should be less than target");
  });

  it("Should not allow upgrade when the source vault is equal to target.", async() => {
    await expectRevert(upgrade(anotherAccount, 2, 0, 2), "Source vault should be less than target");
  });

  it("Should not allow upgrade when the user does not have deposits.", async() => {
    await expectRevert(upgrade(anotherAccount, 1, 0, 2), "No deposits");
  });

  it("Should not allow upgrade when the deposit id does not exist.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    
    await expectRevert(upgrade(anotherAccount, 1, 0, 2), "No deposits.");
  });

  it("Should not allow upgrade when the deposit id is invalid.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    
    await expectRevert(upgrade(anotherAccount, 0, 1, 2), "Invalid deposit.");
  });

  it("Should upgrade, remove source vault and create new target vault.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(5750);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, amountAnotherAccount, 0);
    let depositsSourceVaultBefore = await depositBucketsOf(anotherAccount, 0);
    let depositsTargetVaultBefore = await depositBucketsOf(anotherAccount, 1);

    await upgrade(anotherAccount, 0, 0, 1);

    let depositsSourceVaultAfter = await depositBucketsOf(anotherAccount, 0);
    let depositsTargetVaultAfter = await depositBucketsOf(anotherAccount, 1);
    
    assert.equal(depositsSourceVaultBefore.length, 1, "Source vault before vault was not upgraded correctly.");
    assert.equal(depositsTargetVaultBefore.length, 0, "Target vault before was not upgraded correctly.");
    assert.equal(depositsSourceVaultAfter.length, 0, "Source vault after was not upgraded correctly.");
    assert.equal(depositsTargetVaultAfter.length, 1, "Target vault after was not deposited.");
  });

  it("Should upgrade, remove source vault and create new target vault.", async() => {
    let amountAnotherAccount = toBigNumberWithDecimals(10300);
    await mint(anotherAccount, amountAnotherAccount);
    await deposit(anotherAccount, toBigNumberWithDecimals(300), 0);
    
    let depositsSource = await depositBucketsOf(anotherAccount, 0);
    let depositSource0 = depositsSource[0];
    let depositsTarget = await depositBucketsOf(anotherAccount, 1);

    await upgrade(anotherAccount, 0, 0, 1);

    depositsSource = await depositBucketsOf(anotherAccount, 0);
    depositsTarget = await depositBucketsOf(anotherAccount, 1);
    let depositTarget0 = depositsTarget[0];

    assert.isUndefined(depositsSource.find(element => 
      element.depositedValue == depositSource0.depositedValue && 
      element.depositDate == depositSource0.depositDate && 
      element.lockedUntil == depositSource0.lockedUntil), "The deposit was not removed");

    let deposit0TargetFound = depositsTarget.find(element => 
      element.depositedValue == depositTarget0.depositedValue && 
      element.depositDate == depositTarget0.depositDate && 
      element.lockedUntil == depositTarget0.lockedUntil);
    
    assert.equal(deposit0TargetFound.depositedValue, depositTarget0.depositedValue, "The deposit0 was not found");
    assert.equal(deposit0TargetFound.depositDate, depositTarget0.depositDate, "The deposit0 was not found");
    assert.equal(deposit0TargetFound.lockedUntil, depositTarget0.lockedUntil, "The deposit0 was not found");
  });

  it("Should not allow calling setStartBlock when the user does not have the Admin role.", async() => {
    await expectRevert.unspecified(papparicoVaultsInstance.setStartBlock(10, {from: anotherAccount}));
  });

  it("Should not allow calling setStartBlock when the emissions already started.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoVaultsInstance.initialize(currentBlockNumber + 10, 10);
    currentBlockNumber = await web3.eth.getBlockNumber();
    await time.advanceBlockTo(currentBlockNumber + 30);
    await time.increase(time.duration.days(1));

    await expectRevert(papparicoVaultsInstance.setStartBlock(10), "Emissions already started");
  });

  it("Should not allow calling setStartBlock if the block number is less than the current block.", async() => {
    let currentBlockNumber = await web3.eth.getBlockNumber();
    await papparicoVaultsInstance.initialize(currentBlockNumber + 10, 10);

    await expectRevert(papparicoVaultsInstance.setStartBlock(currentBlockNumber - 10), "Invalid future block number");
  });

  it("Should set StartBlock.", async() => {
    await papparicoVaultsInstance.initialize(await web3.eth.getBlockNumber() + 30, 10);
    let startBlockBefore = await papparicoVaultsInstance.startBlock();
    let startBlockAfter = startBlockBefore + 20;
    await papparicoVaultsInstance.setStartBlock(startBlockAfter);

    assert.equal(startBlockAfter, await papparicoVaultsInstance.startBlock(), "The values were not equals.");
  }); 

  it("Should not allow calling setAvgBlockInterval when the user does not have the Admin role.", async() => {
    await expectRevert.unspecified(papparicoVaultsInstance.setAvgBlockInterval(10, {from: anotherAccount}));
  });

  it("Should set AvgBlockInterval.", async() => {
    let avgBlockIntervalBefore = await papparicoVaultsInstance.avgBlockInterval();
    let avgBlockIntervalAfter = 10;
    await papparicoVaultsInstance.setAvgBlockInterval(avgBlockIntervalAfter);
    
    assert.notEqual(avgBlockIntervalBefore, await papparicoVaultsInstance.avgBlockInterval(), "The values were equals.");
    assert.equal(avgBlockIntervalAfter, await papparicoVaultsInstance.avgBlockInterval(), "The values were not equals.");
  });

  it("Should set RewardEmissionPerBlock when emissions is not started.", async() => {
    let rewardEmissionPerBlockBefore = await papparicoVaultsInstance.rewardEmissionPerBlock();
    let rewardEmissionPerBlockAfter = 10;
    await papparicoVaultsInstance.setRewardEmissionPerBlock(rewardEmissionPerBlockAfter);
    
    assert.notEqual(rewardEmissionPerBlockBefore, await papparicoVaultsInstance.rewardEmissionPerBlock(), "The values were equals.");
    assert.equal(rewardEmissionPerBlockAfter, await papparicoVaultsInstance.rewardEmissionPerBlock(), "The values were not equals.");
  });

  it("Should set RewardEmissionPerBlock and update the rewards of all users when emissions is started.", async() => {
    let anotherAccountAmount = toBigNumberWithDecimals(10300);
    let user002Amount = toBigNumberWithDecimals(10);
    let user003Amount = toBigNumberWithDecimals(225000);
    
    await mint(anotherAccount, anotherAccountAmount);
    await mint(user002, user002Amount);
    await mint(user003, user003Amount);

    await deposit(anotherAccount, anotherAccountAmount, 0);
    await deposit(user002, user002Amount, 1);
    await deposit(user003, user003Amount, 2);
    
    let rewardEmissionPerBlock = 100;
    await papparicoVaultsInstance.initialize(await web3.eth.getBlockNumber() + 10, rewardEmissionPerBlock);
    await time.advanceBlockTo(await web3.eth.getBlockNumber() + 10);
    await time.increase(time.duration.days(5));
    let onTheFlyAnotherAccountRewards = toBigNumber(await papparicoVaultsInstance.rewardsOf(anotherAccount));
    let anotherAccountAccruedRewardsBeforeUpdate = toBigNumber(await papparicoVaultsInstance.userCurrentRewards(anotherAccount));
    let onTheFlyUser002Rewards = toBigNumber(await papparicoVaultsInstance.rewardsOf(user002));
    let user002AccruedRewardsBeforeUpdate = toBigNumber(await papparicoVaultsInstance.userCurrentRewards(user002));
    let onTheFlyUser003Rewards = toBigNumber(await papparicoVaultsInstance.rewardsOf(user003));
    let user003AccruedRewardsBeforeUpdate = toBigNumber(await papparicoVaultsInstance.userCurrentRewards(user003));

    await papparicoVaultsInstance.setRewardEmissionPerBlock(200);

    let anotherAccountAccruedRewardsAfterUpdate = toBigNumber(await papparicoVaultsInstance.userCurrentRewards(anotherAccount));
    let user002AccruedRewardsAfterUpdate = toBigNumber(await papparicoVaultsInstance.userCurrentRewards(user002));
    let user003AccruedRewardsAfterUpdate = toBigNumber(await papparicoVaultsInstance.userCurrentRewards(user003));
    
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

  it("Should not receive native token if the value sent is 0.", async() => {
    let amount = web3.utils.toWei('0', "ether");
    
    await expectRevert.unspecified(web3.eth.sendTransaction({from: deployer, 
      to: papparicoVaultsInstance.address, value: amount}));
  });

  it("Should receive native token through receive() callback and send it to PapparicoTreasury.", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoVaultsInstance.address, value: amount});
    
    assert.equal(await web3.eth.getBalance(papparicoTreasuryInstance.address), amount, 
      "PapparicoTreasury balance was not " + amount + ".");
  });

  it("Should not allow calling if the caller doesn't have the Admin role. <<-- sendToken method -->>", async() => {
    await expectRevert.unspecified(papparicoVaultsInstance.sendToken(papparicoTokenInstance.address, {from: anotherAccount}));
  });
});