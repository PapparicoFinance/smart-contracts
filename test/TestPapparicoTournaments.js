const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoStaking = artifacts.require("PapparicoStaking");
const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const bytes32 = require('bytes32');
const keccak256 = require('keccak256');
const {
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time
} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assert } = require('chai');

contract("PapparicoTournaments", async accounts => {

  let papparicoTournamentsInstance;
  let papparicoTokenInstance;
  let papparicoStakingInstance;
  let papparicoVaultsInstance;
  let papparicoTreasuryInstance;
  const deployer = accounts[0];
  const anotherAccount = accounts[1];
  const user002 = accounts[2];
  const user003 = accounts[3];
  const user004 = accounts[4];
  const user005 = accounts[5];
  const user006 = accounts[6];
  const toBigNumber = web3.utils.toBN;

  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  let mainData = { }
  let registrationData = { }
  let satelliteData = { }

  async function initializeTestingData() {
    mainData = {
      status: 0, //SCHEDULED
      eType: 0,  //FREEROLL
      eReq: 0,   //NO_REQUIREMENTS
      eToken: "0x0000000000000000000000000000000000000000",
      przToken: "0x0000000000000000000000000000000000000000",
      regPrice: 0,
      gtdPrz: toBigNumberWithDecimals(2000).toString(),
      totalPrz: 0,
      percMaxPrz: 4000, //PERCENT
      percTreasury: 0,
      exists: true
    }
  
    registrationData = {
      minRegs: 100,
      maxRegs: 1000,
      currRegs: 0
    }
  
    satelliteData = {
      isSat: false,
      satTickets: 0,
      tgSat: 0,
    }
  }

  function toBigNumberWithDecimals(number) {
    return toBigNumber(number).mul(DECIMAL_DIGITS);
  }

  async function registerUsers(amount, tournamentId) {
    for (let i = 1; i <= amount; i++) {
      await papparicoTournamentsInstance.register(tournamentId, {from: accounts[i]});
    }
  }

  beforeEach(async () => {
    papparicoTreasuryInstance = await PapparicoTreasury.new();
    papparicoTokenInstance = await PapparicoToken.new(papparicoTreasuryInstance.address);
    papparicoVaultsInstance = await PapparicoVaults.new(papparicoTokenInstance.address, papparicoTreasuryInstance.address);
    papparicoStakingInstance = await PapparicoStaking.new(papparicoTokenInstance.address, papparicoTreasuryInstance.address);
    papparicoTournamentsInstance = await PapparicoTournaments.new(papparicoStakingInstance.address, 
      papparicoVaultsInstance.address, papparicoTreasuryInstance.address);
    await initializeTestingData();
  });

  it("Should grant the Default Admin role to the deployer.", async() => {
    let adminRole = bytes32({input: 0x00});
    let hasRole = await papparicoTournamentsInstance.hasRole(adminRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Default Admin role.");
  });

  it("Should grant the Creator role to the deployer.", async() => {
    let creatorRole = keccak256('CREATOR');
    let hasRole = await papparicoTournamentsInstance.hasRole(creatorRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Creator role.");
  });

  it("Should grant the Payer role to the deployer.", async() => {
    let payerRole = keccak256('PAYER');
    let hasRole = await papparicoTournamentsInstance.hasRole(payerRole, deployer);

    assert.equal(hasRole, true, "The deployer hadn't the Creator role.");
  });

  it("Should not allow registration if the tournament does not exist.", async() => {
    await expectRevert(papparicoTournamentsInstance.register(1, {from: anotherAccount}), "NEX");
  });

  it("Should not allow registration if the user is already registered.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount});

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount}), 
      "REG");
  });

  it("Should not allow registration if the registrations did not start.", async() => {
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount}), 
      "RNStarted");
  });

  it("Should not allow registration if the EntryType is FREEROLL and MaxRegistrations is reached.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    registrationData.maxRegs = 5;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await registerUsers(5, tournamentId);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "RClosed");
  });

  it("Should not allow registration if the EntryType is TICKET and the user does not have a valid ticket.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eType = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount}), 
      "NTick");
  }); 

  it("Should not allow registration if the EntryType is PAID and MaxRegistrations is reached.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3;
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    registrationData.maxRegs = 5;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await registerUsers(5, tournamentId);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "RClosed");
  }); 

  it("Should not allow registration if the EntryRequirements is STAKING and the user is not staking.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eReq = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "NMet");
  }); 

  it("Should not allow registration if the EntryRequirements is VAULT_1M and the user does not have any value locked in vaults.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eReq = 2;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "NMet");
  }); 

  it("Should not allow registration if the EntryRequirements is VAULT_6M and the user does not have any value locked.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eReq = 3;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "NMet");
  });

  it("Should not allow registration if the EntryRequirements is VAULT_12M and the user does not have any value locked.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eReq = 4;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "NMet");
  });

  it("Should not allow registration if the EntryRequirements is VAULT_24M and the user does not have any value locked.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eReq = 4;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "NMet");
  });

  it("Should not allow registration if the EntryRequirements is VAULT_48M and the user does not have any value locked.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eReq = 5;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "NMet");
  });

  it("Should not allow registration if the tournament is finished.", async() => {
    let tournamentId = 1;
    mainData.status = 3; //FINISHED

    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.register(tournamentId, {from: user006}), 
      "FIN");
  });

  it("Should make the registration if the EntryType is FREEROLL and the user meets the requirements.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});

    assert.equal(await papparicoTournamentsInstance.isRegd(tournamentId, user006), 
      true, "The user wasn't registered.");
  });

  it("Should make the registration if the EntryType is TICKET and the user has a valid ticket.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 1; //TICKET
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId);
    
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});

    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      true, "The user wasn't registered.");
  });

  it("Should make the registration if the EntryType is PAID_OR_TICKET and the user has a valid ticket.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId);
    
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});

    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      true, "The user wasn't registered.");
  }); 

  it("Should not allow the registration if the EntryType is PAID_OR_TICKET, the user does not have a valid ticket " + 
    "and does not have enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    
    await expectRevert.unspecified(papparicoTournamentsInstance.register(targetTournamentId, {from: user006}));
  });

  it("Should make the registration if the EntryType is PAID_OR_TICKET, the user does not have a valid ticket " + 
    "and has enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(1000), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});

    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      true, "The user wasn't registered.");
  });

  it("Should not allow the registration if the EntryType is PAID and the user does not have enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3; //PAID
    mainData.regPrice = toBigNumberWithDecimals(1000).toString().toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    
    await expectRevert.unspecified(papparicoTournamentsInstance.register(targetTournamentId, {from: user006}));
  });

  it("Should make the registration if the EntryType is PAID and the user has enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3; //PAID
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});

    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      true, "The user wasn't registered.");
  });

  it("Should transfer to TournamentContract the amount of registration price minus treasury deduction, when the user register " + 
    "and EntryType is PAID_OR_TICKET and the user does not have a valid ticket and has enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    let deductionValue = mainData.regPrice * mainData.percTreasury / 10000;
    let tournamentValue = mainData.regPrice - deductionValue;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user005, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user005});
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(2500).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    let tournamentBalanceBefore = await papparicoTokenInstance.balanceOf(papparicoTournamentsInstance.address);
    let tournamentBalanceAfter = tournamentBalanceBefore.add(toBigNumber(tournamentValue).mul(toBigNumber(2)));

    await papparicoTournamentsInstance.register(targetTournamentId, {from: user005});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(papparicoTournamentsInstance.address), 
      tournamentBalanceAfter.toString(), "The transfer was not made to PapparicoTournaments.");
  });

  it("Should transfer to TournamentContract the amount of registration price minus treasury deduction, when the user register " + 
    "and EntryType is PAID and has enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3; //PAID
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    let deductionValue = mainData.regPrice * mainData.percTreasury / 10000;
    let tournamentValue = mainData.regPrice - deductionValue;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user005, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user005});
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(2500).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    let tournamentBalanceBefore = await papparicoTokenInstance.balanceOf(papparicoTournamentsInstance.address);
    let tournamentBalanceAfter = tournamentBalanceBefore.add(toBigNumber(tournamentValue).mul(toBigNumber(2)));

    await papparicoTournamentsInstance.register(targetTournamentId, {from: user005});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(papparicoTournamentsInstance.address), 
      tournamentBalanceAfter.toString(), "The transfer was not made to PapparicoTournaments.");
  });

  it("Should make the treasury deduction when the user register and EntryType is PAID_OR_TICKET and the user does not have a valid ticket " + 
    "and has enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    let deductionValue = mainData.regPrice * mainData.percTreasury / 10000;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user005, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user005});
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(2500).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    let treasuryBalanceBefore = await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address);
    let treasuryBalanceAfter = treasuryBalanceBefore.add(toBigNumber(deductionValue).mul(toBigNumber(2)));

    await papparicoTournamentsInstance.register(targetTournamentId, {from: user005});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address), 
      treasuryBalanceAfter.toString(), "The deduction was not made.");
  });

  it("Should make the treasury deduction when the user register and EntryType is PAID and the user enough funds of the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3; //PAID
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    let deductionValue = mainData.regPrice * mainData.percTreasury / 10000;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user005, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user005});
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(2500).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    let treasuryBalanceBefore = await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address);
    let treasuryBalanceAfter = treasuryBalanceBefore.add(toBigNumber(deductionValue).mul(toBigNumber(2)));

    await papparicoTournamentsInstance.register(targetTournamentId, {from: user005});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address), 
      treasuryBalanceAfter.toString(), "The deduction was not made.");
  }); 

  it("Should not allow deregistration if the tournament does not exist.", async() => {
    await expectRevert(papparicoTournamentsInstance.deregister(1, {from: anotherAccount}), 
      "NEX");
  });

  it("Should not allow deregistration if the user is not registered.", async() => {
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.deregister(tournamentId, {from: anotherAccount}), 
      "NREG");
  });

  it("Should not allow deregistration if the tournament is in progress.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount});
    await papparicoTournamentsInstance.update(tournamentId, 2);

    await expectRevert(papparicoTournamentsInstance.deregister(tournamentId, {from: anotherAccount}), 
      "PRG");
  });

  it("Should not allow deregistration if the tournament is finished.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.deregister(tournamentId, {from: anotherAccount}), 
      "FIN");
  });

  it("Should make the deregistration if the EntryType is FREEROLL.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});

    await papparicoTournamentsInstance.deregister(tournamentId, {from: user006});

    assert.equal(await papparicoTournamentsInstance.isRegd(tournamentId, user006), 
      false, "The user was registered.");
  });

  it("Should make the deregistration if the EntryType is TICKET.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 1; //TICKET
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId);
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});

    await papparicoTournamentsInstance.deregister(targetTournamentId, {from: user006});

    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      false, "The user was registered.");
  });

  it("Should make the deregistration if the EntryType is PAID_OR_TICKET and the user has a valid ticket.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId);
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});

    await papparicoTournamentsInstance.deregister(targetTournamentId, {from: user006});

    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      false, "The user was registered.");
  }); 

  it("Should make the deregistration if the EntryType is PAID_OR_TICKET, the user does not have a valid ticket, " + 
    "but the user has paid for the registration with the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    let senderRole = keccak256('SENDER');
    await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address);

    await papparicoTournamentsInstance.deregister(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      false, "The user was registered.");
  });

  it("Should make the deregistration if the EntryType is PAID and the user has paid for the registration with the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3; //PAID
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(1000).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    let senderRole = keccak256('SENDER');
    await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address);

    await papparicoTournamentsInstance.deregister(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTournamentsInstance.isRegd(targetTournamentId, user006), 
      false, "The user was registered.");
  });

  it("Should transfer back to the User the amount of registration price, when the user register " + 
    "and EntryType is PAID_OR_TICKET and the user has paid for the registration with the entry token.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(2500).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    let userBalanceBeforeDeregistration = await papparicoTokenInstance.balanceOf(user006);
    let senderRole = keccak256('SENDER');
    await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address);

    await papparicoTournamentsInstance.deregister(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(user006), 
      toBigNumber(userBalanceBeforeDeregistration).add(toBigNumber(mainData.regPrice)).toString(), 
      "The transfer was not made to the user.");
  });

  it("Should transfer back to the User the amount of registration price, when the user register and EntryType is PAID.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 3; //PAID
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.percTreasury = 2000; //20%
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);
    await papparicoTokenInstance.mint(user006, toBigNumberWithDecimals(2500).toString(), 0);
    await papparicoTokenInstance.approve(papparicoTournamentsInstance.address, mainData.regPrice, {from: user006});
    await papparicoTournamentsInstance.register(targetTournamentId, {from: user006});
    let userBalanceBeforeDeregistration = await papparicoTokenInstance.balanceOf(user006);
    let senderRole = keccak256('SENDER');
    await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address);

    await papparicoTournamentsInstance.deregister(targetTournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(user006), 
      toBigNumber(userBalanceBeforeDeregistration).add(toBigNumber(mainData.regPrice)).toString(), 
      "The transfer was not made to the user.");
  });

  it("Should not allow claim prize if the tournament does not exist.", async() => {
    await expectRevert(papparicoTournamentsInstance.claimPrize(1, {from: anotherAccount}), "NEX");
  });

  it("Should not allow claim prize if the user is not registered.", async() => {
    mainData.status = 3;
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: anotherAccount}), 
      "NREG");
  });

  it("Should not allow claim if the tournament is in progress.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: anotherAccount});

    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: anotherAccount}), 
      "NFIN");
  });

  it("Should not allow claim prize if the tournament did not finish.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});

    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006}), 
      "NFIN");
  });

  it("Should not allow claim prize if the tournament is satellite.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    satelliteData.isSat = true;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006}), 
      "NPRZ");
  });

  it("Should not allow claim prize if the tournament is satellite even if the user was qualified for ticket (ticket prizes are not claimable).", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 1; //TICKET
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId);
    
    await expectRevert(papparicoTournamentsInstance.claimPrize(satelliteTournamentId, {from: user006}), 
      "NPRZ");
  });

  it("Should not allow claim prize if the prize token is address(0).", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006}), 
      "NPRZ");
  });

  it("Should not allow claim prize if there is no prize to claim.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006}), 
      "NPRZ");
  });

  it("Should not allow claim if the prize was already claimed.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.gtdPrz = toBigNumberWithDecimals(1000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(1000).toString();;
    await papparicoTokenInstance.mint(papparicoTournamentsInstance.address, 50000, 0); 
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, tournamentId, 200, 0);
    await papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006});
    
    await expectRevert(papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006}), 
      "NPRZ");
  });

  it("Should transfer the prize when the user claims it and there is prize to be claimed.", async() => {
    let tournamentId = 1;
    let userPrize = 200;
    mainData.status = 1;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.gtdPrz = toBigNumberWithDecimals(1000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(1000).toString();
    await papparicoTokenInstance.mint(papparicoTournamentsInstance.address, 50000, 0); 
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, tournamentId, userPrize, 0);
    let userBalanceBeforeClaim = await papparicoTokenInstance.balanceOf(user006);
    await papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006});
    
    assert.equal(await papparicoTokenInstance.balanceOf(user006), 
      toBigNumber(userBalanceBeforeClaim).add(toBigNumber(userPrize)).toString(), 
      "The transfer was not made to the user.");
  });
  
  it("Should set user prize to 0 when the user claims the prize.", async() => {
    let tournamentId = 1;
    let userPrize = 200;
    mainData.status = 1;
    mainData.przToken = papparicoTokenInstance.address;
    mainData.gtdPrz = toBigNumberWithDecimals(1000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(1000).toString();
    await papparicoTokenInstance.mint(papparicoTournamentsInstance.address, 50000, 0); 
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);
    await papparicoTournamentsInstance.payPrize(user006, tournamentId, userPrize, 0);
    await papparicoTournamentsInstance.claimPrize(tournamentId, {from: user006});
    
    assert.equal(await papparicoTournamentsInstance.getPrize(tournamentId, user006), 
      toBigNumber(0).toString(), 
      "The user prize was not 0.");
  }); 

  it("Should not allow calling if the caller does not have the creator role.", async() => {
    await expectRevert(papparicoTournamentsInstance.create(1, mainData, registrationData, 
      satelliteData, {from: user006}), "NCrt");
  });

  it("Should not allow creation when the tournament already exists.", async() => {
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, 
      satelliteData), "EX");
  });

  it("Should create the tournament.", async() => {
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    assert.equal(await papparicoTournamentsInstance.exists(tournamentId), true, "The tournament did not exists.");
  });

  it("Should not allow calling if the caller does not have the payer role.", async() => {
    await expectRevert(papparicoTournamentsInstance.payPrize(user002, 1, 1, 1, {from: user006}), "NPay");
  });

  it("Should not allow paying if the tournament does not exist.", async() => {
    let tournamentId = 1;
    let prize = 1000;
    let tgSat = 0;

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, prize, 
      tgSat), "NEX");
  });

  it("Should not allow paying if the user is not registered.", async() => {
    let tournamentId = 1;
    let prize = 1000;
    let tgSat = 0;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, prize, 
      tgSat), "NREG");
  });

  it("Should not allow paying if the tournament did not finish.", async() => {
    let tournamentId = 1;
    let prize = 5;
    let tgSat = 0;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, prize, 
      tgSat), "NFIN");
  });

  it("Should not allow paying if the tournament is satellite and the prize is not 1 (ticket).", async() => {
    let tournamentId = 1;
    let prize = 5;
    let tgSat = 0;
    satelliteData.isSat = true;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, prize, 
      tgSat), "IPRZ");
  }); 

  it("Should not allow paying if the tournament is satellite and target satellite is not the same.", async() => {
    let targetTournamentId = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, 9999), "ITICK");
  });

  it("Should not allow paying if the tournament is satellite and target satellite and source satellite are not associated.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = 9999;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId), "ITICK");
  });

  it("Should not allow paying if the tournament is not satellite and prize is greater than max prize per user.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    mainData.gtdPrz = toBigNumberWithDecimals(5000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(5000).toString();
    satelliteData.isSat = false;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, 
      toBigNumberWithDecimals(6000).toString(), 0), "IPRZ");
  });

  it("Should not allow paying if the tournament is not satellite and target satellite is not 0.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    mainData.gtdPrz = toBigNumberWithDecimals(5000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(5000).toString();
    satelliteData.isSat = false;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, 
      toBigNumberWithDecimals(2000).toString(), 9999), "IPRZ");
  });

  it("Should allow paying if the tournament is satellite.", async() => {
    let targetTournamentId = 1;
    mainData.status = 1;
    mainData.eType = 2; //PAID_OR_TICKET
    mainData.regPrice = toBigNumberWithDecimals(1000).toString();
    mainData.eToken = papparicoTokenInstance.address;
    mainData.przToken = papparicoTokenInstance.address;
    await papparicoTournamentsInstance.create(targetTournamentId, mainData, registrationData, satelliteData);

    let satelliteTournamentId = 2;
    mainData.eType = 0; //FREEROLL
    satelliteData.isSat = true;
    satelliteData.satTickets = 5;
    satelliteData.tgSat = targetTournamentId;
    await papparicoTournamentsInstance.create(satelliteTournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(satelliteTournamentId, {from: user006});
    await papparicoTournamentsInstance.update(satelliteTournamentId, 2);
    await papparicoTournamentsInstance.update(satelliteTournamentId, 3);

    await papparicoTournamentsInstance.payPrize(user006, satelliteTournamentId, 1, targetTournamentId);

    assert.equal(await papparicoTournamentsInstance.getPrize(satelliteTournamentId, user006), 1, "The prize was not paid.");
  });

  it("Should not allow paying if the tournament is not satellite and prize is higher than max prize per user.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    mainData.gtdPrz = toBigNumberWithDecimals(5000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(5000).toString();
    satelliteData.isSat = false;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await expectRevert(papparicoTournamentsInstance.payPrize(user006, tournamentId, 
      toBigNumberWithDecimals(2500).toString(), 0), "IPRZ");
  });

  it("Should allow paying if the tournament is not satellite.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    mainData.eType = 0; //FREEROLL
    mainData.gtdPrz = toBigNumberWithDecimals(5000).toString();
    mainData.totalPrz = toBigNumberWithDecimals(5000).toString();
    satelliteData.isSat = false;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.register(tournamentId, {from: user006});
    await papparicoTournamentsInstance.update(tournamentId, 2);
    await papparicoTournamentsInstance.update(tournamentId, 3);

    await papparicoTournamentsInstance.payPrize(user006, tournamentId, toBigNumberWithDecimals(1500).toString(), 0);

    assert.equal(toBigNumber(await papparicoTournamentsInstance.getPrize(tournamentId, user006)).toString(), 
      toBigNumberWithDecimals(1500).toString(), "The prize was not paid.");
  });

  it("Should receive native token through receive() callback.", async() => {
    let amount = web3.utils.toWei('1', "ether");
    
    await web3.eth.sendTransaction(
      {from: deployer, to: papparicoTournamentsInstance.address, value: amount});
    
    assert.equal(await web3.eth.getBalance(papparicoTournamentsInstance.address), amount, 
      "PapparicoTournament balance was not " + amount + ".");
  });

  it("Should not allow calling if the caller doesn't have the Admin role. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTournamentsInstance.sendToken(papparicoTokenInstance.address, {from: anotherAccount}), 
      "NAdm");
  });

  it("Should not send ERC20 token if the value is 0. <<-- sendToken method -->>", async() => {
    await expectRevert(papparicoTournamentsInstance.sendToken(papparicoTokenInstance.address), "Can't send 0.");
  });

  it("Should send ERC20 token to PapparicoTreasury. <<-- sendToken method -->>", async() => {
    let amount = toBigNumber(1000000000).mul(DECIMAL_DIGITS);
    
    await papparicoTokenInstance.mint(anotherAccount, amount, 3);
    await papparicoTokenInstance.approve(deployer, amount, {from: anotherAccount});
    await papparicoTokenInstance.transferFrom(anotherAccount, papparicoTournamentsInstance.address, amount);
    await papparicoTournamentsInstance.sendToken(papparicoTokenInstance.address);
    
    assert.equal((await papparicoTokenInstance.balanceOf(papparicoTreasuryInstance.address)).toString(), 
      amount.toString(), "PapparicoTreasury ERC20 token balance was not " + amount + ".");
  });

  it("Should not allow update if the caller does not have the Updater role.", async() => {
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(tournamentId, 0, {from: anotherAccount}), "NUpd");
  });

  it("Should not allow update if the tournament is not exists.", async() => {
    let tournamentId = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(2, 0), "NEX");
  });

  it("Should not allow update if the tournament is finished.", async() => {
    let tournamentId = 1;
    mainData.status = 3;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(tournamentId, 0), "FIN");
  });

  it("Should not allow update if the tournament is cancelled.", async() => {
    let tournamentId = 1;
    mainData.status = 4;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(tournamentId, 0), "CANC");
  });

  it("Should not allow update status other than REGISTERING when the current status is SCHEDULED.", async() => {
    let tournamentId = 1;
    mainData.status = 0;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(tournamentId, 2), "IFLW");
  });

  it("Should not allow update status other than LIVE when the current status is REGISTERING.", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(tournamentId, 3), "IFLW");
  });

  it("Should not allow update status other than FINISHED when the current status is LIVE.", async() => {
    let tournamentId = 1;
    mainData.status = 2;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);

    await expectRevert(papparicoTournamentsInstance.update(tournamentId, 1), "IFLW");
  });

  it("Should allow update status when the requirements are met. Update to REGISTERING", async() => {
    let tournamentId = 1;
    mainData.status = 0;
    let registeringStatus = 1;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.update(tournamentId, registeringStatus);

    assert.equal(true, await papparicoTournamentsInstance.getStatus(tournamentId) == 1, "The status was not REGISTERING");
  });

  it("Should allow update status when the requirements are met. Update to LIVE", async() => {
    let tournamentId = 1;
    mainData.status = 1;
    let liveStatus = 2;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.update(tournamentId, liveStatus);

    assert.equal(true, await papparicoTournamentsInstance.getStatus(tournamentId) == 2, "The status was not LIVE");
  });

  it("Should allow update status when the requirements are met. Update to FINISHED", async() => {
    let tournamentId = 1;
    mainData.status = 2;
    let finishedStatus = 3;
    await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, satelliteData);
    await papparicoTournamentsInstance.update(tournamentId, finishedStatus);

    assert.equal(true, await papparicoTournamentsInstance.getStatus(tournamentId) == 3, "The status was not FINISHED");
  });
});
