// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PapparicoVaults.sol";
import "./PapparicoTreasury.sol";
import "./PapparicoFrequentPlayerPoints.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";

contract PapparicoTournaments is AccessControl, ReentrancyGuard, IPapparicoPayable {

  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  bytes32 constant CREATOR = keccak256("CREATOR");
  bytes32 constant UPDATER = keccak256("UPDATER");
  bytes32 constant PAYER = keccak256("PAYER");
  uint256 constant HPERC = 1e4;
  
  enum Status {
    SCH,
    REG,
    LIVE,
    FIN,
    CANC
  }
  
  enum EType {
    FREE,
    PD_TICK,
    PD
  }

  enum EReq {
    NO_REQ,
    V_48M
  }

  struct MainData {
    Status status;
    EType eType;
    EReq eReq;
    
    IERC20 eToken;
    IERC20 przToken;

    uint256 regPrice;
    uint256 regPricePts;
    uint256 przPool;
    uint256 highestPrz;
    uint256 percTreasury;
    bool exists;
  }

  struct RegData {
    uint256 minRegs;
    uint256 maxRegs;
    uint256 currRegs;
  }

  struct UserReg {
    bool paid;
    uint256 regTime;
    uint256 deregTime;
  }

  struct UserPrz {
    uint256 prz;
    uint256 pts;
    bool paid;
    bool claimed;
    bool claimedPts;
  }

  mapping(uint256 => MainData) public mainData;
  mapping(uint256 => RegData) public regData;
  mapping(uint256 => mapping(address => UserReg)) public userRegs;
  mapping(uint256 => mapping(address => UserPrz)) public userPrizes;
  
  PapparicoVaults private immutable vaults;
  PapparicoTreasury private immutable treasury;
  PapparicoFrequentPlayerPoints private immutable frequentPoints;
  
  constructor(PapparicoVaults _vaults, PapparicoTreasury _treasury,
    PapparicoFrequentPlayerPoints _frequentPoints) {

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(CREATOR, msg.sender);
    _grantRole(UPDATER, msg.sender);
    _grantRole(PAYER, msg.sender);

    vaults = _vaults;
    treasury = _treasury;
    frequentPoints = _frequentPoints;
  }

  function register(uint256 _id, bool _usePoints) external nonReentrant validateReg(_id, _usePoints) {
    userRegs[_id][msg.sender].regTime = block.timestamp;
    regData[_id].currRegs++;
    userPrizes[_id][msg.sender].pts = calculatePoints(_id);
    
    if (isRegPayable(_id, _usePoints)) {
      userRegs[_id][msg.sender].paid = true;

      uint256 deduction = Math.mulDiv(mainData[_id].regPrice, mainData[_id].percTreasury, HPERC);
      
      mainData[_id].eToken.safeTransferFrom(msg.sender, address(this), mainData[_id].regPrice);
      
      if (deduction > 0) {
        mainData[_id].eToken.safeTransfer(address(treasury), deduction);
      }
    } else if (mainData[_id].eType == EType.PD_TICK) {
      userRegs[_id][msg.sender].paid = false;
      frequentPoints.usePoints(msg.sender, mainData[_id].regPricePts);
    }
    emit Regd(msg.sender, _id, userRegs[_id][msg.sender].regTime);
  }

  function deregister(uint256 _id) external nonReentrant validateDereg(_id) {
    userRegs[_id][msg.sender].deregTime = block.timestamp;
    regData[_id].currRegs--;
    userPrizes[_id][msg.sender].pts = 0;
  
    if (userRegs[_id][msg.sender].paid) {

      uint256 deduction = Math.mulDiv(mainData[_id].regPrice, mainData[_id].percTreasury, HPERC);

      if (deduction > 0) {
        treasury.sendToken(mainData[_id].eToken, address(this), deduction);
      }

      mainData[_id].eToken.safeTransfer(msg.sender, mainData[_id].regPrice);
    } else if (mainData[_id].eType == EType.PD_TICK) {
      frequentPoints.unusePoints(msg.sender, mainData[_id].regPricePts);
    }
    emit Deregd(msg.sender, _id, userRegs[_id][msg.sender].deregTime);
  }

  function calculatePoints(uint256 _id) internal view returns (uint256) {
    EReq eReq = mainData[_id].eReq;
    EType eType = mainData[_id].eType;

    uint256 eReqPts;
    uint256 eTypePts;
    if (eReq == EReq.NO_REQ) {
      eReqPts = 1;
    } else {
      eReqPts = 10;
    }
    if (eType == EType.FREE) {
      eTypePts = 1;
    } else {
      eTypePts = 10;
    }

    return eTypePts + eReqPts;
  }

  function claimPrize(uint256 _id) external nonReentrant validateClaim(_id) {
    uint256 prize = userPrizes[_id][msg.sender].prz;
    userPrizes[_id][msg.sender].prz = 0;
    userPrizes[_id][msg.sender].claimed = true;
    if (prize >= mainData[_id].przPool) {
      mainData[_id].przPool = 0;
    } else {
      mainData[_id].przPool = mainData[_id].przPool.sub(prize);
    }
    _getPts(_id);
    mainData[_id].przToken.safeTransfer(msg.sender, prize);
    emit Claimed(msg.sender, _id, mainData[_id].przToken, prize);
  }

  function claimPts(uint256 _id) external nonReentrant validateClaimPts(_id) {
    _getPts(_id);
  }

  function _getPts(uint256 _id) private {
    uint256 pts = userPrizes[_id][msg.sender].pts;
    if (pts > 0) {
      userPrizes[_id][msg.sender].pts = 0;
      userPrizes[_id][msg.sender].claimedPts = true;
      frequentPoints.addPoints(msg.sender, pts);
      emit PointsClaimed(msg.sender, _id, pts, block.timestamp);
    }
  }

  function create(uint256 _id, MainData memory _mainData, 
    RegData memory _regData) external onlyCreator() validateCreation(_id) {

    _mainData.status = Status.SCH;
    _mainData.exists = true;
    _regData.currRegs = 0;
    mainData[_id] = _mainData;
    regData[_id] = _regData;
    emit Crtd(_id, block.timestamp); 
  }

  function update(uint256 _id, uint256 _status, bool _onlyStatus, 
    uint256 _przPool, uint256 _highestPrz) external onlyUpdater() {

    require(_status >= 0 && _status <= 4, "ISTS");
    require(exists(_id), "NEX");
    mainData[_id].status = Status(_status);
    emit UpdStatus(_id, _status);
    if (!_onlyStatus) {
      mainData[_id].przPool = _przPool;
      mainData[_id].highestPrz = _highestPrz;
      emit UpdPrize(_id, _przPool, _highestPrz);
    }
  }

  function payPrize(address _user, uint256 _id, uint256 _prz) external 
    onlyPayer() validatePayPrize(_user, _id, _prz) {

    userPrizes[_id][_user].paid = true;
    userPrizes[_id][_user].prz = _prz;
    emit Paid(_user, _id, _prz);
  }

  function isRegPayable(uint256 _id, bool _usePoints) private view returns (bool) {
    if (mainData[_id].eType == EType.FREE) {
      return false;
    }
    if (mainData[_id].eType == EType.PD) {
      return true;
    }
    return !_usePoints;
  }

  function getTotalRegs(uint256 _id) public view returns (uint256) {
    return regData[_id].currRegs;
  }

  function getRegTime(uint256 _id, address _user) public view returns (uint256 regTime, uint256 deregTime) {
    return (userRegs[_id][_user].regTime, userRegs[_id][_user].deregTime);
  }

  function getPrize(uint256 _id, address _user) public view returns (uint256) {
    return userPrizes[_id][_user].prz;
  }

  function getPts(uint256 _id, address _user) public view returns (uint256) {
    return userPrizes[_id][_user].pts;
  }

  function exists(uint256 _id) public view returns (bool) {
    return mainData[_id].exists;
  }

  function isRegd(uint256 _id, address _user) public view returns (bool) {
    return userRegs[_id][_user].regTime > userRegs[_id][_user].deregTime;
  }

  function isRegPaid(uint256 _id, address _user) public view returns (bool) {
    return userRegs[_id][_user].paid;
  }

  function isRegsOpen(uint256 _id) public view returns (bool) {
    if (mainData[_id].eType == EType.FREE || 
       (mainData[_id].eType == EType.PD && regData[_id].maxRegs > 0)) {

      return regData[_id].currRegs < regData[_id].maxRegs;
    }
    return true;
  }

  function isMeetReq(uint256 _id, address _user) public view returns (bool) {
    if (mainData[_id].eReq == EReq.V_48M) {
      return vaults.isDepV( _user, PapparicoVaults.VType.V_48M);
    }
    return true;
  }

  function getStatus(uint256 _id) public view returns (Status) {
    return mainData[_id].status;
  }

  function hasPrize(uint256 _id, address _user) public view returns (bool) {
    return userPrizes[_id][_user].prz > 0;
  }

  function isPrizePaid(uint256 _id, address _user) public view returns (bool) {
    return userPrizes[_id][_user].paid;
  }

  function claimed(uint256 _id, address _user) public view returns (bool) {
    return userPrizes[_id][_user].claimed;
  }

  function hasPts(uint256 _id, address _user) public view returns (bool) {
    return userPrizes[_id][_user].pts > 0;
  }

  function claimedPts(uint256 _id, address _user) public view returns (bool) {
    return userPrizes[_id][_user].claimedPts;
  }

  receive() external payable override { }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    PayableUtils.sendToken(_token, address(treasury));
  }

  modifier onlyCreator() {
    require(hasRole(CREATOR, msg.sender), "NCrt");
    _;
  }

  modifier onlyUpdater() {
    require(hasRole(UPDATER, msg.sender), "NUpd");
    _;
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NAdm");
    _;
  }

  modifier onlyPayer() {
    require(hasRole(PAYER, msg.sender), "NPay");
    _;
  }

  modifier validateReg(uint256 _id, bool _usePoints) {
    require(exists(_id), "NEX");
    require(getStatus(_id) != Status.FIN, "FIN");
    require(getStatus(_id) != Status.CANC, "CANC");
    require(getStatus(_id) == Status.REG, "RNStarted");
    require(isRegsOpen(_id), "RClosed");
    require(!isRegd(_id, msg.sender), "REG");
    require(isMeetReq(_id, msg.sender), "NMet");
    if (_usePoints) {
      require(mainData[_id].eType == EType.PD_TICK, "NAcc");
      uint256 entryPts = mainData[_id].regPricePts;
      uint256 availablePts = frequentPoints.userAccruedPoints(msg.sender);
      require(availablePts >= entryPts, "InsuffPts");
    }
    _;
  }

  modifier validateDereg(uint256 _id) {
    require(exists(_id), "NEX");
    require(getStatus(_id) != Status.FIN, "FIN");
    require(getStatus(_id) != Status.LIVE, "PRG");
    require(isRegd(_id, msg.sender), "NREG");
    _;
  }

  modifier validateClaim(uint256 _id) {
    require(!claimed(_id, msg.sender), "CLMD");
    require(exists(_id), "NEX");
    require(getStatus(_id) == Status.FIN, "NFIN");
    require(isRegd(_id, msg.sender), "NREG");
    require(address(mainData[_id].przToken) != address(0), "NPRZ");
    require(hasPrize(_id, msg.sender), "NPRZ");
    require(mainData[_id].przPool > 0, "NPRZ.POOL");
    _;
  }

  modifier validateClaimPts(uint256 _id) {
    require(!claimedPts(_id, msg.sender), "CLMD");
    require(exists(_id), "NEX");
    require(getStatus(_id) == Status.FIN, "NFIN");
    require(isRegd(_id, msg.sender), "NREG");
    require(hasPts(_id, msg.sender), "NPTS");
    _;
  }

  modifier validatePayPrize(address _user, uint256 _id, uint256 _prz) {
    require(exists(_id), "NEX");
    require(isRegd(_id, _user), "NREG");
    require(getStatus(_id) == Status.FIN, "NFIN");
    require(!userPrizes[_id][_user].paid, "PAID");
    require(_prz <= mainData[_id].highestPrz, "IPRZ");
    _;
  }

  modifier validateCreation(uint256 _id) {
    require(!exists(_id), "EX");
    _;
  }

  event Crtd(uint256 indexed _id, uint256 _time);
  event UpdStatus(uint256 indexed _id, uint256 _status);
  event UpdPrize(uint256 indexed _id, uint256 _przPool, uint256 _percMaxPrz);
  event Regd(address indexed _user, uint256 indexed _id, uint256 _regTime);
  event Deregd(address indexed _user, uint256 indexed _id, uint256 _deregTime);
  event Claimed(address indexed _user, uint256 indexed _id, IERC20 _tkn, uint256 _prz);
  event Paid(address indexed _user, uint256 indexed _id, uint256 _prz);
  event PointsClaimed(address indexed _user, uint256 indexed _id, uint256 _pts, uint256 _time);
}
