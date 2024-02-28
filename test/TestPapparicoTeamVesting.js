const PapparicoTeamVesting = artifacts.require("PapparicoTeamVesting");
const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");

const bytes32 = require('bytes32');
const keccak256 = require('keccak256');
const {
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time
} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

contract("PapparicoTeamVesting", async accounts => {

  let papparicoTokenInstance;
  let papparicoTreasuryInstance;
  let papparicoTeamVestingInstance;

  const deployer = accounts[0];
  const anotherAccount = accounts[1];
  const teamAccounts = Array(accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]);
  const toBigNumber = web3.utils.toBN;
  const DECIMAL_DIGITS = toBigNumber(1e18);

  beforeEach(async () => {
    papparicoTreasuryInstance = await PapparicoTreasury.new();
    papparicoTokenInstance = await PapparicoToken.new(papparicoTreasuryInstance.address);
        
    papparicoTeamVestingInstance = await PapparicoTeamVesting.new(papparicoTokenInstance.address, 
      papparicoTreasuryInstance.address);
  });

  it("Should grant the Default Admin role to the deployer.", async() => {
    let adminRole = bytes32({input: 0x00});
    let hasRole = await papparicoTeamVestingInstance.hasRole(adminRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Default Admin role.");
  });

  it("Should grant the Supplier role to the deployer.", async() => {
    let supplierRole = keccak256('SUPPLIER');
    let hasRole = await papparicoTeamVestingInstance.hasRole(supplierRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Supplier role.");
  });

  it("Should return ~1369863.013698 * 1e18 (TeamSupply / 730) of daily vesting team.", async() => {
    let dailyVestingTeam = toBigNumber(await papparicoTeamVestingInstance.dailyVestingTeam());

    assert.equal(dailyVestingTeam.toString(), toBigNumber(1000000000).mul(DECIMAL_DIGITS).div(toBigNumber(730)).toString(), 
      "The daily vesting team wasn't ~1369863.013698 * 1e18.");
  });

  it("Should not allow calling if the caller doesn't have the Supplier role. " + 
    "<<-- distributeTeamSupply method -->>", async() => {
    await expectRevert(papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts, {from: anotherAccount}), 
      "Caller does not have the Supplier role.");
  });

  it("Should not allow calling if PapparicoTeamVesting does not have the Minter role in PapparicoToken. " + 
    "<<-- distributeTeamSupply method -->>", async() => {
    await expectRevert(papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts), 
      "Caller does not have the Minter role.");
  });

  it("Should not allow calling if the team wallets are not provided. " + 
    "<<-- distributeTeamSupply method -->>", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address);

    await expectRevert(papparicoTeamVestingInstance.distributeTeamSupply(Array()), 
      "Team wallets not provided.");
  });

  it("Should distribute the daily vesting amount to the team accounts. ", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address);

    let dailyVestingTeam = toBigNumber(await papparicoTeamVestingInstance.dailyVestingTeam());
    let amountPerTeamMember = toBigNumber(dailyVestingTeam).div(toBigNumber(teamAccounts.length));
    await papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts);

    for (let i = 0; i < teamAccounts.length; i++) {
      assert.equal(await papparicoTokenInstance.balanceOf(teamAccounts[i]), 
        amountPerTeamMember.toString(), "The amount wasn't " + amountPerTeamMember + ".");
    }
  });

  it("Should not distribute the daily vesting amount if the distribution was made last than 24h. ", async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address);

    await papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts);

    await expectRevert(papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts), 
      "The last distribution occurred last than 24h.");
  });

  //This test simulates an advancing in time of 100 days
  it("Should distribute the daily vesting amount if the time advances at least 24h since last distribution. ", 
    async() => {
    let minterRole = keccak256('MINTER');
    await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address);

    let daysToAdvance = toBigNumber(100);
    let dailyVestingTeam = toBigNumber(await papparicoTeamVestingInstance.dailyVestingTeam());
    let valuePerTeamMemberAfter101Days = dailyVestingTeam.mul(daysToAdvance.add(toBigNumber(1))).
      div(toBigNumber(teamAccounts.length));

    //Performs the very first distribution
    await papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts);
    //Advances the time in 100 days
    await time.increase(time.duration.days(100));
    //Calls distribution again
    await papparicoTeamVestingInstance.distributeTeamSupply(teamAccounts);
    
    for (let i = 0; i < teamAccounts.length; i++) {
      //Verifies the value distributed per team member
      assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(teamAccounts[i])).toString(), 
        valuePerTeamMemberAfter101Days.toString(), "The amount wasn't " + valuePerTeamMemberAfter101Days.toString() + ".");
    }
  });

  it("Should not receive native token if the value sent is 0.", async() => {
    let amount = web3.utils.toWei('0', "ether");
    
    await expectRevert.unspecified(web3.eth.sendTransaction({from: deployer, 
      to: papparicoTeamVestingInstance.address, value: amount}));
  });

  it("Should receive native token through receive() callback and send it to PapparicoTreasury.", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoTeamVestingInstance.address, value: amount});
    
    assert.equal(await web3.eth.getBalance(papparicoTreasuryInstance.address), amount, 
      "PapparicoTreasury balance was not " + amount + ".");
  });

  it("Should not allow calling if the caller doesn't have the Admin role. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTeamVestingInstance.sendToken(papparicoTokenInstance.address, {from: anotherAccount}), 
      "Caller does not have the Admin role.");
  });

  it("Should not send ERC20 token if the value is 0. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTeamVestingInstance.sendToken(papparicoTokenInstance.address), "Can't send 0.");
  });

  it("Should send ERC20 token to PapparicoTreasury. <<-- sendToken method -->>", async() => {
    let amount = toBigNumber(1000000000).mul(DECIMAL_DIGITS);
    
    await papparicoTokenInstance.mint(anotherAccount, amount, 3/*THIRD_PARTY*/);
    await papparicoTokenInstance.approve(deployer, amount, {from: anotherAccount});
    await papparicoTokenInstance.transferFrom(anotherAccount, papparicoTeamVestingInstance.address, amount);
    await papparicoTeamVestingInstance.sendToken(papparicoTokenInstance.address);
    
    assert.equal((await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address)).toString(), 
      amount.toString(), "PapparicoTreasury ERC20 token balance was not " + amount + ".");
  });
});
