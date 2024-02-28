//truffle exec scripts/testing-local/8_ScriptCreateTournaments.js

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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  //////////////////////////////////////--->>>CREATE A PAID OR TICKET (MAX REGISTRATIONS NOT SET)<<<---///////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token One (PPFO)";
  status = 0;
  entryType = 1;
  entryRequirements = 0;
  entryToken = papparicoTokenInstance.address;
  entryTokenSymbol = "PPF";
  prizeToken = papparicoTestTokenOneInstance.address;
  prizeTokenSymbol = "PPFO";
  registrationPrice = 3000;
  registrationPricePoints = 5;
  fixedPrize = false;
  guaranteedPrizePool = 30000;
  placesPaid = 0;
  lowestPrize = 1600;
  highestPrizePercentOfTotalPrize = 4000;
  progressionRatio = 2.6;
  totalPrize = 0;
  percentTreasuryDeduction = 2000;
  minRegistrations = 10;
  maxRegistrations = 0;
  registrationStartTime = timeNow + 400;
  tournamentStartTime = timeNow + 6000;
  preStartDuration = 300;
  tournamentDuration = 530;
  timeAmountPaymentStart = 0;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(  
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime, preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////////--->>>CREATE A PAID (NO_REQUIREMENTS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token Two (PPFT)";
  status = 0;
  entryType = 1;
  entryRequirements = 0;
  entryToken = papparicoTestTokenOneInstance.address;
  entryTokenSymbol = "PPFO";
  prizeToken = papparicoTestTokenTwoInstance.address;
  prizeTokenSymbol = "PPFT";
  registrationPrice = 400000;
  registrationPricePoints = 7;
  fixedPrize = false;
  guaranteedPrizePool = 960000;
  placesPaid = 4;
  lowestPrize = 96000;
  highestPrizePercentOfTotalPrize = 4000;
  progressionRatio = 1.4;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2000;
  minRegistrations = 4;
  maxRegistrations = 0;
  registrationStartTime = timeNow + 380;
  tournamentStartTime = timeNow + 10000;
  preStartDuration = 300;
  tournamentDuration = 600;
  timeAmountPaymentStart = 500;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(  
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime, preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////////--->>>CREATE A PAID (NO_REQUIREMENTS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token Three (PPFTH)";
  status = 0;
  entryType = 1;
  entryRequirements = 0;
  entryToken = papparicoTestTokenThreeInstance.address;
  entryTokenSymbol = "PPFTH";
  prizeToken = papparicoTestTokenThreeInstance.address;
  prizeTokenSymbol = "PPFTH";
  registrationPrice = 800000;
  registrationPricePoints = 4;
  fixedPrize = false;
  guaranteedPrizePool = 3200000;
  placesPaid = 3;
  lowestPrize = 600000;
  highestPrizePercentOfTotalPrize = 3500;
  progressionRatio = 2;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2000;
  minRegistrations = 6;
  maxRegistrations = 0;
  registrationStartTime = timeNow + 580;
  tournamentStartTime = timeNow + 8000;
  preStartDuration = 300;
  tournamentDuration = 550;
  timeAmountPaymentStart = 1200;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime, preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
  );
  ////////////////////////////////////##############################################################////////////////////////////////////

  /////////////////////////////////////////--->>>CREATE A PAID (NO_REQUIREMENTS)<<<---/////////////////////////////////////////
  currentBlockNumber = await web3.eth.getBlockNumber();
  block = await web3.eth.getBlock(currentBlockNumber);

  timeNow = block.timestamp;

  tournamentId = block.timestamp;
  gameId = 1;
  description = "Earn Papparico Token Three (PPFTH)";
  status = 0;
  entryType = 1;
  entryRequirements = 0;
  entryToken = papparicoTestTokenThreeInstance.address;
  entryTokenSymbol = "PPFTH";
  prizeToken = papparicoTestTokenThreeInstance.address;
  prizeTokenSymbol = "PPFTH";
  registrationPrice = 35000;
  registrationPricePoints = 2;
  fixedPrize = false;
  guaranteedPrizePool = 54000;
  placesPaid = 2;
  lowestPrize = 13500;
  highestPrizePercentOfTotalPrize = 3200;
  progressionRatio = 3.2;
  totalPrize = guaranteedPrizePool;
  percentTreasuryDeduction = 2000;
  minRegistrations = 2;
  maxRegistrations = 0;
  registrationStartTime = timeNow + 430;
  tournamentStartTime = timeNow + 6000; // MAX REGISTRATIONS IS GREATER THAN ZERO
  preStartDuration = 300;
  tournamentDuration = 800;
  timeAmountPaymentStart = 130;
  humanlyPossibleScoreWithinRateLimit = 8500;
  
  await createTournament(papparicoTournamentsInstance, deployer, tournamentId, status, entryType, entryRequirements, entryToken, 
    prizeToken, registrationPrice, registrationPricePoints, highestPrizePercentOfTotalPrize, percentTreasuryDeduction, minRegistrations, maxRegistrations);

  batchTournamentDtoGroup.tournaments.push(
    getTournamentBackendVersion(chainId, tournamentId, gameId, description, status, entryType, entryRequirements, entryToken, 
      entryTokenSymbol, prizeToken, prizeTokenSymbol, registrationPrice, registrationPricePoints , fixedPrize, guaranteedPrizePool, placesPaid, lowestPrize, highestPrizePercentOfTotalPrize, progressionRatio, 
      percentTreasuryDeduction, minRegistrations, maxRegistrations, 
      registrationStartTime, tournamentStartTime, preStartDuration, tournamentDuration, timeAmountPaymentStart, humanlyPossibleScoreWithinRateLimit)
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