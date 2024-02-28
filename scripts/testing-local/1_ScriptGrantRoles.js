//truffle exec scripts/testing-local/1_ScriptGrantRoles.js

const keccak256 = require('keccak256');
const PapparicoToken = artifacts.require("PapparicoToken");

const PapparicoStaking = artifacts.require("PapparicoStaking");
const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const PapparicoFrequentPlayerPoints = artifacts.require("PapparicoFrequentPlayerPoints");

const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoTeamVesting = artifacts.require("PapparicoTeamVesting");

module.exports = async function(callback) {

  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log("DEPLOYER: " + deployer);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoStakingInstance = await PapparicoStaking.deployed();
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();
  const papparicoTreasuryInstance = await PapparicoTreasury.deployed();
  const papparicoTeamVestingInstance = await PapparicoTeamVesting.deployed();
  const papparicoVaultsInstance = await PapparicoVaults.deployed();
  const papparicoFrequentPlayerPointsInstance = await PapparicoFrequentPlayerPoints.deployed();

  //PapparicoStaking must have MINTER role on PapparicoToken
  let minterRole = keccak256('MINTER');
  await papparicoTokenInstance.grantRole(minterRole, papparicoStakingInstance.address, {from: deployer});

  //PapparicoVaults must have MINTER role on PapparicoToken
  await papparicoTokenInstance.grantRole(minterRole, papparicoVaultsInstance.address, {from: deployer});

  //PapparicoTeamVesting must have MINTER role on PapparicoToken
  await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address, {from: deployer});

  //PapparicoTournaments must have SENDER role on PapparicoTreasury
  let senderRole = keccak256('SENDER');
  await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address, {from: deployer});

  //PapparicoTournaments must have TOURNAMENT role on PapparicoFrequentPlayerPoints
  let tournamentRole = keccak256('TOURNAMENT');
  await papparicoFrequentPlayerPointsInstance.grantRole(tournamentRole, papparicoTournamentsInstance.address, {from: deployer});

  //PapparicoTournaments must have TARGET_BENEF role on PapparicoFrequentPlayerPoints
  let targetBenefRole = keccak256('TARGET_BENEF');
  await papparicoFrequentPlayerPointsInstance.grantRole(targetBenefRole, papparicoTournamentsInstance.address, {from: deployer});

  //One user should be granted with the updater role in the PapparicoTournaments contract
  let updaterRole = keccak256('UPDATER');
  await papparicoTournamentsInstance.grantRole(updaterRole, "0x99cce66d3A39C2c2b83AfCefF04c5EC56E9B2A58", {from: deployer});
  await papparicoTournamentsInstance.grantRole(updaterRole, "0x4b930E7b3E491e37EaB48eCC8a667c59e307ef20", {from: deployer});
  await papparicoTournamentsInstance.grantRole(updaterRole, "0x02233B22860f810E32fB0751f368fE4ef21A1C05", {from: deployer});
  await papparicoTournamentsInstance.grantRole(updaterRole, "0x89c1D413758F8339Ade263E6e6bC072F1d429f32", {from: deployer});
  await papparicoTournamentsInstance.grantRole(updaterRole, "0x61bBB5135b43F03C96570616d6d3f607b7103111", {from: deployer});

  let payerRole = keccak256('PAYER');
  await papparicoTournamentsInstance.grantRole(payerRole, "0x8C4cE7a10A4e38EE96feD47C628Be1FfA57Ab96e", {from: deployer});
  await papparicoTournamentsInstance.grantRole(payerRole, "0x25c1230C7EFC00cFd2fcAA3a44f30948853824bc", {from: deployer});
  await papparicoTournamentsInstance.grantRole(payerRole, "0x709F7Ae06Fe93be48FbB90FFDDd69e2746FA8506", {from: deployer});
  await papparicoTournamentsInstance.grantRole(payerRole, "0xc0514C03D097fCbB77a74B4DA5b594bA473b6CE1", {from: deployer});
  await papparicoTournamentsInstance.grantRole(payerRole, "0x103b31135D99417A22684ED93cbbCD4ccD208046", {from: deployer});

	callback();
}