//truffle exec scripts/testing-local/5_ScriptCreateTournaments.js

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
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime,  preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////////--->>>CREATE A FREEROLL (STAKING REQUIREMENTS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token (PPF)";
  status = 0;
  entryType = 0;
  entryRequirements = 1;
  entryToken = "0x0000000000000000000000000000000000000000";
  entryTokenSymbol = "FREE";
  prizeToken = papparicoTokenInstance.address;
  prizeTokenSymbol = "PPF";
  registrationPrice = 0;
  registrationPricePoints = 0;
  fixedPrize = true;
  guaranteedPrizePool = 120000;
  placesPaid = 2;
  lowestPrize = 0;
  highestPrizePercentOfTotalPrize = 0;
  progressionRatio = 2.5;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2000;
  minRegistrations = 0;
  maxRegistrations = 4;
  registrationStartTime = timeNow + 300;
  tournamentStartTime = timeNow + 800;
  preStartDuration = 300;
  tournamentDuration = 600;
  timeAmountPaymentStart = 650;
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

  /////////////////////////////////////////--->>>CREATE A FREEROLL (VAULT 6 MONTHS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token One (PPFO)";
  status = 0;
  entryType = 0;
  entryRequirements = 3;
  entryToken = "0x0000000000000000000000000000000000000000";
  entryTokenSymbol = "FREE";
  prizeToken = papparicoTestTokenOneInstance.address;
  prizeTokenSymbol = "PPFO";
  registrationPrice = 0;
  registrationPricePoints = 0;
  fixedPrize = true;
  guaranteedPrizePool = 1200000;
  placesPaid = 4;
  lowestPrize = 0;
  highestPrizePercentOfTotalPrize = 0;
  progressionRatio = 2;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2500;
  minRegistrations = 0;
  maxRegistrations = 6;
  registrationStartTime = timeNow + 360;
  tournamentStartTime = timeNow + 800;
  preStartDuration = 300;
  tournamentDuration = 600;
  humanlyPossibleScoreWithinRateLimit = 8500;
  timeAmountPaymentStart = 300;

  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(  
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime,  preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////////--->>>CREATE A FREEROLL (VAULT 24 MONTHS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token Two (PPFT)";
  status = 0;
  entryType = 0;
  entryRequirements = 5;
  entryToken = "0x0000000000000000000000000000000000000000";
  entryTokenSymbol = "FREE";
  prizeToken = papparicoTestTokenTwoInstance.address;
  prizeTokenSymbol = "PPFT";
  registrationPrice = 0;
  registrationPricePoints = 0;
  fixedPrize = true;
  guaranteedPrizePool = 900000;
  placesPaid = 3;
  lowestPrize = 0;
  highestPrizePercentOfTotalPrize = 0;
  progressionRatio = 4;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2500;
  minRegistrations = 0;
  maxRegistrations = 5;
  registrationStartTime = timeNow + 500;
  tournamentStartTime = timeNow + 1000;
  preStartDuration = 300;
  tournamentDuration = 800;
  timeAmountPaymentStart = 700;
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