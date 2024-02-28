const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoToken = artifacts.require("PapparicoToken");
const bytes32 = require('bytes32');
const keccak256 = require('keccak256');
const {
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('chai');

contract("PapparicoTreasury", async accounts => {

  let papparicoTreasuryInstance;
  let papparicoTokenInstance;
  const deployer = accounts[0];
  const anotherAccount = accounts[1];
  const toBigNumber = web3.utils.toBN;
  const DECIMAL_DIGITS = toBigNumber(1e18);

  beforeEach(async () => {
    papparicoTreasuryInstance = await PapparicoTreasury.new();
    papparicoTokenInstance = await PapparicoToken.new(papparicoTreasuryInstance.address);
  });

  function toBigNumberWithDecimals(number) {
    return toBigNumber(number).mul(DECIMAL_DIGITS);
  }

  it("Should grant the Default Admin role to the deployer.", async() => {
    let adminRole = bytes32({input: 0x00});
    let hasRole = await papparicoTreasuryInstance.hasRole(adminRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Default Admin role.");
  });

  it("Should grant the Sender role to the deployer.", async() => {
    let senderRole = keccak256('SENDER');
    let hasRole = await papparicoTreasuryInstance.hasRole(senderRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Sender role.");
  });

  it("Should receive native token through receive() callback.", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoTreasuryInstance.address, value: amount});
    
    assert.equal(await web3.eth.getBalance(papparicoTreasuryInstance.address), amount, 
      "PapparicoTreasury balance was not " + amount + ".");
  });

  it("Should not allow calling if the caller doesn't have the Sender role. <<-- sendNative method -->>", async() => {
    await expectRevert(papparicoTreasuryInstance.sendNative(deployer, 0, {from: anotherAccount}), 
      "Caller does not have the Token Sender role.");
  });

  it("Should not send Native Token if the value sent is 0. <<-- sendNative method -->>", async() => {
    await expectRevert(papparicoTreasuryInstance.sendNative(anotherAccount, 0), "Can't send 0.");
  });

  it("Should not send Native Token if the value sent is higher than the available balance. <<-- sendNative method -->>", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoTreasuryInstance.address, value: amount});

    await expectRevert(papparicoTreasuryInstance.sendNative(anotherAccount, "2000000000000000000"), "Not enough balance.");
  });

  it("Should send Native Token <<-- sendNative method -->>", async() => {
    let amount = web3.utils.toWei('50', "ether");
    await web3.eth.sendTransaction({from: deployer, to: papparicoTreasuryInstance.address, value: amount});
    let etherAmountBefore = toBigNumber(await web3.eth.getBalance(anotherAccount));

    await papparicoTreasuryInstance.sendNative(anotherAccount, "10000000000000000000");

    assert.equal(toBigNumber(await web3.eth.getBalance(anotherAccount)).toString(), 
      etherAmountBefore.add(toBigNumber("10000000000000000000")).toString(), "The amount was not sent.");
  });

  it("Should not allow calling if the caller doesn't have the Sender role. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTreasuryInstance.sendToken(papparicoTokenInstance.address, deployer, 0, {from: anotherAccount}), 
      "Caller does not have the Token Sender role.");
  });

  it("Should not send ERC20 Token if the value sent is 0. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTreasuryInstance.sendToken(papparicoTokenInstance.address, anotherAccount, 0), "Can't send 0.");
  });

  it("Should not send ERC20 Token if the value sent is higher than the available balance. <<-- sendToken method -->>", async() => {
    await papparicoTokenInstance.mint(papparicoTreasuryInstance.address, toBigNumberWithDecimals(10), 0);

    await expectRevert(papparicoTreasuryInstance.sendToken(papparicoTokenInstance.address, anotherAccount, 
      toBigNumberWithDecimals(15)), "Not enough balance.");
  });

  it("Should send ERC20 Token <<-- sendToken method -->>", async() => {
    await papparicoTokenInstance.mint(papparicoTreasuryInstance.address, toBigNumberWithDecimals(10), 0);
    let anotherAccountBalanceBefore = toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount));

    await papparicoTreasuryInstance.sendToken(papparicoTokenInstance.address, anotherAccount, toBigNumberWithDecimals(7));

    assert.equal(toBigNumber(await papparicoTokenInstance.balanceOf(anotherAccount)).toString(), 
      anotherAccountBalanceBefore.add(toBigNumberWithDecimals(7)).toString(), "The value was not sent.");
  });
});
