//truffle exec scripts/testing-local/6_ScriptCreateTournaments.js

const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTestTokenOne = artifacts.require("PapparicoTestTokenOne");
const PapparicoTestTokenTwo = artifacts.require("PapparicoTestTokenTwo");
const PapparicoTestTokenThree = artifacts.require("PapparicoTestTokenThree");

const { toBN } = require('web3-utils');
const toBigNumber = toBN;
const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function(callback) {
  
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log("DEPLOYER: " + deployer);
  
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoTestTokenOneInstance = await PapparicoTestTokenOne.deployed();
  const papparicoTestTokenTwoInstance = await PapparicoTestTokenTwo.deployed();
  const papparicoTestTokenThreeInstance = await PapparicoTestTokenThree.deployed();
  const chainId = 5777; //IMPORTANT, CHANGE IF IT'S NECESSARY
  
  let batchTournamentDtoGroup = {
    tournaments: []
  };

  ////////////////////////////////////////////--->>>CREATE A FREEROLL (VAULT 1 MONTH)<<<---////////////////////////////////////////////
  let currentBlockNumber = await web3.eth.getBlockNumber();
  let block = await web3.eth.getBlock(currentBlockNumber);

  let timeNow = block.timestamp;

  let tournamentId = block.timestamp;
  let gameId = 1;
  let description = "Earn Papparico Token (PPF)";
  let status = 0;
  let entryType = 0;
  let entryRequirements = 2;
  let entryToken = "0x0000000000000000000000000000000000000000";
  let entryTokenSymbol = "FREE";
  let prizeToken = papparicoTokenInstance.address;
  let prizeTokenSymbol = "PPF";
  let registrationPrice = 0;
  let registrationPricePoints = 0;
  let fixedPrize = true;
  let guaranteedPrizePool = 70000;
  let placesPaid = 7;
  let lowestPrize = 0;
  let highestPrizePercentOfTotalPrize = 0;
  let progressionRatio = 3;
  let totalPrize = guaranteedPrizePool;
  let percentTreasuryDeduction = 2000;
  let minRegistrations = 0;
  let maxRegistrations = 10;
  let registrationStartTime = timeNow + 300;
  let tournamentStartTime = timeNow + 1200;
  let preStartDuration = 300;
  let tournamentDuration = 3600;
  let timeAmountPaymentStart = 600;
  let humanlyPossibleScoreWithinRateLimit = 8500;
  
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////////--->>>CREATE A FREEROLL (VAULT 48 MONTHS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token Three (PPFTH)";
  status = 0;
  entryType = 0;
  entryRequirements = 6;
  entryToken = "0x0000000000000000000000000000000000000000";
  entryTokenSymbol = "FREE";
  prizeToken = papparicoTestTokenThreeInstance.address;
  prizeTokenSymbol = "PPFTH";
  registrationPrice = 0;
  registrationPricePoints = 0;
  fixedPrize = true;
  guaranteedPrizePool = 9500000;
  placesPaid = 6;
  lowestPrize = 0;
  highestPrizePercentOfTotalPrize = 0;
  progressionRatio = 1.3; 
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 3000;
  minRegistrations = 0;
  maxRegistrations = 10;
  registrationStartTime = timeNow + 450;
  tournamentStartTime = timeNow + 1100;
  preStartDuration = 300;
  tournamentDuration = 750;
  timeAmountPaymentStart = 800;
  humanlyPossibleScoreWithinRateLimit = 8500;

  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime,  preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////--->>>CREATE A PAID (MAX AND MIN REGISTRATIONS SET)<<<---////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token (PPF)";
  status = 0;
  entryType = 2;
  entryRequirements = 0;
  entryToken = papparicoTokenInstance.address;
  entryTokenSymbol = "PPF";
  prizeToken = papparicoTokenInstance.address;
  prizeTokenSymbol = "PPF";
  registrationPrice = 1000;
  registrationPricePoints = 0;
  fixedPrize = false;
  guaranteedPrizePool = 70000;
  placesPaid = 2;
  lowestPrize = 20000;
  highestPrizePercentOfTotalPrize = 4000;
  progressionRatio = 2.5; 
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2000;
  minRegistrations = 4;
  maxRegistrations = 4;
  registrationStartTime = timeNow + 200;
  tournamentStartTime = 0; // MAX REGISTRATIONS IS GREATER THAN ZERO
  preStartDuration = 300;
  tournamentDuration = 500;
  timeAmountPaymentStart = 150;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime,  preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  ///////////////////////////////////////--->>>CREATE A PAID (MAX REGISTRATIONS NOT SET)<<<---//////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token (PPF)";
  status = 0;
  entryType = 2;
  entryRequirements = 0;
  entryToken = papparicoTokenInstance.address;
  entryTokenSymbol = "PPF";
  prizeToken = papparicoTokenInstance.address;
  prizeTokenSymbol = "PPF";
  registrationPrice = 20000;
  registrationPricePoints = 0;
  fixedPrize = false;
  guaranteedPrizePool = 80000;
  placesPaid = 0;
  lowestPrize = 10000;
  highestPrizePercentOfTotalPrize = 4000;
  progressionRatio = 2; 
  totalPrize = 0;
  percentTreasuryDeduction = 2000;
  minRegistrations = 5;
  maxRegistrations = 0;
  registrationStartTime = timeNow + 250;
  tournamentStartTime = timeNow + 8000;
  preStartDuration = 300;
  tournamentDuration = 620;
  timeAmountPaymentStart = 450;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime,  preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  //////////////////////////////////////--->>>CREATE A PAID (MAX AND MIN REGISTRATION SET)<<<---///////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token One (PPFO)";
  status = 0;
  entryType = 2;
  entryRequirements = 0;
  entryToken = papparicoTokenInstance.address;
  entryTokenSymbol = "PPF";
  prizeToken = papparicoTestTokenOneInstance.address;
  prizeTokenSymbol = "PPFO";
  registrationPrice = 4000;
  registrationPricePoints = 0;
  fixedPrize = false;
  guaranteedPrizePool = 9600;
  placesPaid = 2;
  lowestPrize = 1000;
  highestPrizePercentOfTotalPrize = 4000;
  progressionRatio = 3;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2000;
  minRegistrations = 3;
  maxRegistrations = 3;
  registrationStartTime = timeNow + 400;
  tournamentStartTime = 0; // MAX REGISTRATIONS IS GREATER THAN ZERO
  preStartDuration = 300;
  tournamentDuration = 700;
  timeAmountPaymentStart = 0;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(  
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime,  preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  console.log(JSON.stringify(batchTournamentDtoGroup, null, 2));
  batchTournamentDtoGroup.tournaments = [];
  
  ////////////////////////////////////##############################################################////////////////////////////////////

	callback();
}

async function createTournament(
  papparicoTournamentsInstance, deployer,

  tournamentId, status, entryType, entryRequirements, entryToken, 
  prizeToken, registrationPrice, registrationPricePoints,
  highestPrizePercentOfTotalPrize, percentTreasuryDeduction,
  
  minRegistrations, maxRegistrations) {
  
  mainData = {
    status: status,
    eType: entryType,
    eReq: entryRequirements,
    eToken: entryToken,
    przToken: prizeToken,
    regPrice: toBigNumberWithDecimals(registrationPrice).toString(),
    regPricePts: registrationPricePoints,
    percMaxPrz: highestPrizePercentOfTotalPrize,  //PERCENT
    percTreasury: percentTreasuryDeduction,       //PERCENT
    exists: true
  }

  registrationData = {
    minRegs: minRegistrations,
    maxRegs: maxRegistrations,
    currRegs: 0
  }

  await papparicoTournamentsInstance.create(tournamentId, mainData, registrationData, {from: deployer});
}

function getTournamentBackendVersion(
  chainId,

  tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, entryTokenSymbol,
  prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints, fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
  percentTreasuryDeduction, minRegistrations, maxRegistrations,
  
  registrationStartTime, tournamentStartTime, preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit) {

    let tournament = {
      id: null,
      chainId: chainId,
      tournamentId: tournamentId,
      gameId: gameId,
      description: description,
      entryType: parseEntryType(entryType),
      entryRequirements: parseEntryRequirements(entryRequirements),
      status: parseStatus(status),
      entryToken: entryToken,
      entryTokenSymbol: entryTokenSymbol,
      prizeToken: prizeToken,
      prizeTokenSymbol: prizeTokenSymbol,
      registrationPrice: toBigNumberWithDecimals(registrationPrice).toString(),
      registrationPricePoints: registrationPricePoints,
      fixedPrize: fixedPrize,
      guaranteedPrizePool: toBigNumberWithDecimals(guaranteedPrizePool).toString(),
      placesPaid: placesPaid,
      lowestPrize: toBigNumberWithDecimals(lowestPrize).toString(),
      highestPrizePercentOfTotalPrize: highestPrizePercentOfTotalPrize,
      progressionRatio: progressionRatio, 
      percentTreasuryDeduction: percentTreasuryDeduction,
      minRegistrations: minRegistrations,
      maxRegistrations: maxRegistrations,
      registrationStartTime: registrationStartTime,
      tournamentStartTime: tournamentStartTime,
      preStartDuration: preStartDuration,
      tournamentDuration: tournamentDuration,
      timeAmountPaymentStart: timeAmountPaymentStart,
      humanlyPossibleScoreWithinRateLimit: humanlyPossibleScoreWithinRateLimit
    }

    return tournament;
}

function toBigNumberWithDecimals(number) {
  return toBigNumber(number).mul(DECIMAL_DIGITS);
}

function parseEntryType(entryType) {
  if (entryType == 0) {
    return "FREEROLL";
  }
  if (entryType == 1) {
    return "PAID_OR_TICKET";
  }
  return "PAID";
}

function parseEntryRequirements(entryRequirements) {
  if (entryRequirements == 0) {
    return "NO_REQUIREMENTS";
  }
  if (entryRequirements == 1) {
    return "STAKING";
  }
  if (entryRequirements == 2) {
    return "VAULT_1M";
  }
  if (entryRequirements == 3) {
    return "VAULT_6M";
  }
  if (entryRequirements == 4) {
    return "VAULT_12M";
  }
  if (entryRequirements == 5) {
    return "VAULT_24M";
  }
  return "VAULT_48M";
}

function parseStatus(status) {
  return status == 0 ? "SCHEDULED" : "REGISTERING";
}

function delaySeconds(time) {
  console.log("Waiting " + (time / 1000).toString() + " seconds to avoid Too Many Requests - 429");
  sleep(time);
}