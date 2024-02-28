const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const bytes32 = require('bytes32');
const keccak256 = require('keccak256');
const {
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('chai');

contract("PapparicoToken", async accounts => {

  let papparicoTokenInstance;
  let papparicoTreasuryInstance;
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
  
  it("Should have 'Papparico Finance' as name.", async() => {
    assert.equal(await papparicoTokenInstance.name(), "Papparico Finance", "The name wasn't 'Papparico Finance'.");
  });

  it("Should have 'PPF' as symbol.", async() => {
    assert.equal(await papparicoTokenInstance.symbol(), "PPF", "The symbol wasn't 'PPF'.");
  });

  it("Should have '18' for decimals.", async() => {
    assert.equal(await papparicoTokenInstance.decimals(), 18, "The decimals wasn't 18.");
  });

  it("Should grant the Default Admin role to the deployer.", async() => {
    let adminRole = bytes32({input: 0x00});
    let hasRole = await papparicoTokenInstance.hasRole(adminRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Default Admin role.");
  });

  it("Should grant the Minter role to the deployer.", async() => {
    let minterRole = keccak256('MINTER');
    let hasRole = await papparicoTokenInstance.hasRole(minterRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Minter role.");
  });

  it("Should return 5000000000 * 1e18 of maximum supply.", async() => {
    let maximumSupply = toBigNumber(await papparicoTokenInstance.maxSupply());

    assert.equal(maximumSupply.toString(), toBigNumber(5000000000).mul(DECIMAL_DIGITS).toString(), 
      "The maximum supply wasn't 5000000000 * 1e18.");
  });

  it("Should return 3500000000 * 1e18 of initial community supply.", async() => {
    let communitySupply = toBigNumber(await papparicoTokenInstance.remainingCommunitySupply());

    assert.equal(communitySupply.toString(), toBigNumber(3500000000).mul(DECIMAL_DIGITS).toString(), 
      "The community supply wasn't 3500000000 * 1e18.");
  });

  it("Should return 1000000000 * 1e18 of team supply.", async() => {
    let teamSupply = toBigNumber(await papparicoTokenInstance.remainingTeamSupply());

    assert.equal(teamSupply.toString(), toBigNumber(1000000000).mul(DECIMAL_DIGITS).toString(), 
      "The team supply wasn't 1000000000 * 1e18.");
  });

  it("Should return 250000000 * 1e18  of infrastructure supply.", async() => {
    let infraSupply = toBigNumber(await papparicoTokenInstance.remainingInfraSupply());

    assert.equal(infraSupply.toString(), toBigNumber(250000000).mul(DECIMAL_DIGITS).toString(), 
      "The infrastructure supply wasn't 250000000 * 1e18.");
  });

  it("Should return 250000000 * 1e18  of ecosystem supply.", async() => {
    let ecosystemSupply = toBigNumber(await papparicoTokenInstance.remainingEcosystemSupply());

    assert.equal(ecosystemSupply.toString(), toBigNumber(250000000).mul(DECIMAL_DIGITS).toString(), 
      "The ecosystem supply wasn't 250000000 * 1e18.");
  });

  it("Should not allow minting if the caller doesn't have the Minter role.", async() => {
    await expectRevert(papparicoTokenInstance.mint(deployer, 1000, 0, {from: anotherAccount}), 
      "Caller does not have the Minter role.");
  });

  it("Should not allow calling if the amount to mint is 0.", 
    async() => {
    await expectRevert(papparicoTokenInstance.mint(deployer, 0, 0), "You can't mint 0.");
  });

  it("Should not allow calling if the mint amount plus total supply is greater than maximum supply.", async() => {
    let totalSupply = toBigNumber(10000);
    let maximumSupply = toBigNumber(await papparicoTokenInstance.maxSupply());
    let amount = totalSupply.add(maximumSupply);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 0), "Minting exceeds MaxSupply.");
  });

  it("Should not allow calling if the Team Vesting minting is greater than the remaining team supply.", async() => {
    let amount = toBigNumberWithDecimals(2000000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 4 /*TEAM*/), "Exceeds the remaining team supply.");
  });

  it("Should not allow calling if the Infrastructure minting is greater than the remaining infra supply.", async() => {
    let amount = toBigNumberWithDecimals(260000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 5 /*INFRASTRUCTURE*/), "Exceeds the remaining infrastructure supply.");
  });

  it("Should not allow calling if the Ecosystem minting is greater than the remaining ecosystem supply.", async() => {
    let amount = toBigNumberWithDecimals(260000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 6 /*ECOSYSTEM*/), "Exceeds the remaining ecosystem supply.");
  });

  it("Should not allow calling if the Community minting is greater than the remaining community supply (/*TOURNAMENTS*/).", async() => {
    let amount = toBigNumberWithDecimals(4500000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 0 /*TOURNAMENTS*/), "Exceeds the remaining community supply.");
  });

  it("Should not allow calling if the Community minting is greater than the remaining community supply (/*STAKING*/).", async() => {
    let amount = toBigNumberWithDecimals(4500000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 1 /*STAKING*/), "Exceeds the remaining community supply.");
  });

  it("Should not allow calling if the Community minting is greater than the remaining community supply (/*VAULTS*/).", async() => {
    let amount = toBigNumberWithDecimals(4500000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 2 /*VAULTS*/), "Exceeds the remaining community supply.");
  });

  it("Should not allow calling if the Community minting is greater than the remaining community supply (/*THIRD_PARTY*/).", async() => {
    let amount = toBigNumberWithDecimals(4500000000);

    await expectRevert(papparicoTokenInstance.mint(deployer, amount, 3 /*THIRD_PARTY*/), "Exceeds the remaining community supply.");
  });

  it("Should mint the amount to the specified address.", async() => {
    let mintAmount = toBigNumberWithDecimals(1000000000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 0);
    
    assert.equal(await papparicoTokenInstance.balanceOf(anotherAccount), 
      mintAmount.toString(), "The amount wasn't minted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*TOURNAMENTS*/).", async() => {
    let remainingCommunitySupply = toBigNumber(await papparicoTokenInstance.remainingCommunitySupply());
    let mintAmount = toBigNumberWithDecimals(1000000000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 0 /*TOURNAMENTS*/);
    
    assert.equal(await papparicoTokenInstance.remainingCommunitySupply(), 
      remainingCommunitySupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*STAKING*/).", async() => {
    let remainingCommunitySupply = toBigNumber(await papparicoTokenInstance.remainingCommunitySupply());
    let mintAmount = toBigNumberWithDecimals(1000000000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 1 /*STAKING*/);
    
    assert.equal(await papparicoTokenInstance.remainingCommunitySupply(), 
      remainingCommunitySupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*VAULTS*/).", async() => {
    let remainingCommunitySupply = toBigNumber(await papparicoTokenInstance.remainingCommunitySupply());
    let mintAmount = toBigNumberWithDecimals(1000000000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 2 /*VAULTS*/);
    
    assert.equal(await papparicoTokenInstance.remainingCommunitySupply(), 
      remainingCommunitySupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*THIRD_PARTY*/).", async() => {
    let remainingCommunitySupply = toBigNumber(await papparicoTokenInstance.remainingCommunitySupply());
    let mintAmount = toBigNumberWithDecimals(1000000000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 3 /*THIRD_PARTY*/);
    
    assert.equal(await papparicoTokenInstance.remainingCommunitySupply(), 
      remainingCommunitySupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*TEAM*/).", async() => {
    let remainingTeamSupply = toBigNumber(await papparicoTokenInstance.remainingTeamSupply());
    let mintAmount = toBigNumberWithDecimals(500000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 4 /*TEAM*/);
    
    assert.equal(await papparicoTokenInstance.remainingTeamSupply(), 
      remainingTeamSupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*INFRASTRUCTURE*/).", async() => {
    let remainingInfraSupply = toBigNumber(await papparicoTokenInstance.remainingInfraSupply());
    let mintAmount = toBigNumberWithDecimals(500000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 5 /*INFRASTRUCTURE*/);
    
    assert.equal(await papparicoTokenInstance.remainingInfraSupply(), 
      remainingInfraSupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should mint and subtract the minted amount from the specified remaining supply (/*ECOSYSTEM*/).", async() => {
    let remainingEcosystemSupply = toBigNumber(await papparicoTokenInstance.remainingEcosystemSupply());
    let mintAmount = toBigNumberWithDecimals(500000);
    
    await papparicoTokenInstance.mint(anotherAccount, mintAmount, 6 /*ECOSYSTEM*/);
    
    assert.equal(await papparicoTokenInstance.remainingEcosystemSupply(), 
      remainingEcosystemSupply.sub(mintAmount).toString(), "The amount wasn't subtracted.");
  });

  it("Should not allow burning if the caller doesn't have the Admin role.", async() => {
    await expectRevert(papparicoTokenInstance.burn(deployer, 1000, {from: anotherAccount}), 
      "Caller does not have the Admin role.");
  });

  it("Should burn and subtract the burnt amount from the maximum supply.", async() => {
    let mintAmount = toBigNumber(1000000000).mul(DECIMAL_DIGITS);
    let burnAmount = toBigNumber(500000000).mul(DECIMAL_DIGITS);
    await papparicoTokenInstance.mint(deployer, mintAmount, 0);

    let maximumSupplyBeforeBurning = toBigNumber(await papparicoTokenInstance.maxSupply());
    await papparicoTokenInstance.burn(deployer, burnAmount);
    let maximumSupplyAfterBurning = toBigNumber(await papparicoTokenInstance.maxSupply());
    
    assert.equal(maximumSupplyAfterBurning.toString(), 
      maximumSupplyBeforeBurning.sub(burnAmount).toString(), "The amount wasn't burnt.");
  });

  it("Should not receive native token if the value sent is 0.", async() => {
    let amount = web3.utils.toWei('0', "ether");
    
    await expectRevert.unspecified(web3.eth.sendTransaction({from: deployer, 
      to: papparicoTokenInstance.address, value: amount}));
  });

  it("Should receive native token through receive() callback and send it to PapparicoTreasury.", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoTokenInstance.address, value: amount});
    
    assert.equal(await web3.eth.getBalance(papparicoTreasuryInstance.address), amount, 
      "PapparicoTreasury balance was not " + amount + ".");
  });

  it("Should not allow calling if the caller doesn't have the Admin role. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTokenInstance.sendToken(papparicoTokenInstance.address, {from: anotherAccount}), 
      "Caller does not have the Admin role.");
  });

  it("Should not send ERC20 token if the value sent is 0. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTokenInstance.sendToken(papparicoTokenInstance.address), "Can't send 0.");
  });

  it("Should send ERC20 token to PapparicoTreasury. <<-- sendToken method -->>", async() => {
    let amount = toBigNumber(1000000000).mul(DECIMAL_DIGITS);
    
    await papparicoTokenInstance.mint(anotherAccount, amount, 0);
    await papparicoTokenInstance.approve(deployer, amount, {from: anotherAccount});
    await papparicoTokenInstance.transferFrom(anotherAccount, papparicoTokenInstance.address, amount);
    await papparicoTokenInstance.sendToken(papparicoTokenInstance.address);
    
    assert.equal((await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address)).toString(), 
      amount.toString(), "PapparicoTreasury ERC20 token balance was not " + amount + ".");
  });
});
