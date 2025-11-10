// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { FHE, euint32, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title NebulaCareRegistry
 * @notice Futuristic companion registry for the Nebula Sanctuary DApp. 管理加密的宠物档案、
 *         星历照护日志、认证机构审批以及可见性授权，使用 FHEVM 保护隐私。
 *
 *         每个宠物（伴生者）都维护两类加密聚合数据：
 *         - encryptedVitalNebula: 加密后的累计生命体征（如体重、体温）
 *         - encryptedVitalOrbit: 加密后的记录次数（用于链下求平均）
 *
 *         在 Hardhat FHEVM 节点上可以借助 MockFhevmInstance 本地解密；
 *         在线上网络需结合 Relayer SDK + TFHE WASM。
 */
contract NebulaCareRegistry is ZamaEthereumConfig {
  struct CompanionProfile {
    uint256 companionId;
    string profileCID;
    uint8 privacyLevel;
    uint64 createdAt;
    uint64 updatedAt;
    address[] owners;
  }

  struct StoryEntry {
    uint256 storyId;
    uint256 companionId;
    address author;
    string logCID;
    uint8 eventType;
    uint64 timestamp;
    bool hasEncryptedVital;
    euint64 encryptedVital;
    bool verified;
    address verifier;
    string verifyCID;
  }

  struct StoryPointer {
    uint256 companionId;
    uint256 index;
    bool exists;
  }

  struct CompanionView {
    uint256 companionId;
    string profileCID;
    uint8 privacyLevel;
    uint64 createdAt;
    uint64 updatedAt;
    address[] owners;
    uint256 storyCount;
    bool hasVitalAura;
  }

  struct StoryView {
    uint256 storyId;
    uint256 companionId;
    address author;
    string logCID;
    uint8 eventType;
    uint64 timestamp;
    bool verified;
    address verifier;
    string verifyCID;
    bool hasEncryptedVital;
  }

  event CompanionRegistered(
    uint256 indexed companionId,
    address indexed creator,
    string profileCID,
    uint8 privacyLevel
  );
  event CompanionProfileRefreshed(uint256 indexed companionId, string profileCID, uint8 privacyLevel);
  event StoryCaptured(
    uint256 indexed companionId,
    uint256 indexed storyId,
    address indexed author,
    string logCID,
    uint8 eventType,
    bool withVital
  );
  event StoryAttested(
    uint256 indexed companionId,
    uint256 indexed storyId,
    address indexed verifier,
    string verifyCID,
    bool approved
  );
  event AuroraCertificateFlagged(uint256 indexed companionId, uint256 indexed storyId, string certCID);
  event ConstellationViewerGranted(uint256 indexed companionId, address indexed viewer);
  event ConstellationViewerRevoked(uint256 indexed companionId, address indexed viewer);
  event AuroraVerifierUpdated(address indexed verifier, bool approved);

  error CompanionNotFound(uint256 companionId);
  error StoryNotFound(uint256 storyId);
  error NotCompanionOwner(uint256 companionId, address caller);
  error NotAuroraAuthorized(uint256 companionId, address caller);
  error StoryAlreadyHasVital(uint256 storyId);
  error InvalidViewer(address viewer);
  error InvalidInput();

  uint256 public nextCompanionId = 1;
  uint256 public nextStoryId = 1;
  address public stardustAdmin;

  mapping(uint256 => CompanionProfile) private _companions;
  mapping(uint256 => StoryEntry[]) private _companionStories;
  mapping(uint256 => mapping(address => bool)) private _companionOwners;
  mapping(uint256 => mapping(address => bool)) private _constellationViewers;
  mapping(uint256 => address[]) private _viewerDirectory;
  mapping(address => bool) private _auroraVerifierWhitelist;
  mapping(uint256 => StoryPointer) private _storyPointers;

  mapping(uint256 => euint64) private _encryptedVitalNebula;
  mapping(uint256 => euint32) private _encryptedVitalOrbit;
  mapping(uint256 => bool) private _hasVitalAura;

  constructor(address admin_) {
    stardustAdmin = admin_;
  }

  modifier onlyAdmin() {
    require(msg.sender == stardustAdmin, "Only admin");
    _;
  }

  modifier companionExists(uint256 companionId) {
    if (_companions[companionId].companionId == 0) revert CompanionNotFound(companionId);
    _;
  }

  modifier onlyCompanionOwner(uint256 companionId) {
    if (!_companionOwners[companionId][msg.sender]) {
      revert NotCompanionOwner(companionId, msg.sender);
    }
    _;
  }

  modifier onlyAuroraAuthorized(uint256 companionId) {
    if (!_isAuroraAuthorized(companionId, msg.sender)) {
      revert NotAuroraAuthorized(companionId, msg.sender);
    }
    _;
  }

  modifier onlyVerifier() {
    require(_auroraVerifierWhitelist[msg.sender], "Not verifier");
    _;
  }

  function setAdmin(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), "Zero admin");
    stardustAdmin = newAdmin;
  }

  function setVerifier(address account, bool approved) external onlyAdmin {
    require(account != address(0), "Zero verifier");
    _auroraVerifierWhitelist[account] = approved;
    emit AuroraVerifierUpdated(account, approved);
  }

  function registerCompanion(
    string calldata profileCID,
    address[] calldata coOwners,
    uint8 privacyLevel
  ) external returns (uint256 companionId) {
    if (bytes(profileCID).length == 0) revert InvalidInput();
    if (privacyLevel > 2) revert InvalidInput();

    companionId = nextCompanionId++;

    CompanionProfile storage companion = _companions[companionId];
    companion.companionId = companionId;
    companion.profileCID = profileCID;
    companion.privacyLevel = privacyLevel;
    companion.createdAt = uint64(block.timestamp);
    companion.updatedAt = companion.createdAt;
    companion.owners.push(msg.sender);
    _companionOwners[companionId][msg.sender] = true;

    for (uint256 i = 0; i < coOwners.length; i++) {
      address owner = coOwners[i];
      if (owner == address(0) || owner == msg.sender) {
        continue;
      }
      if (!_companionOwners[companionId][owner]) {
        companion.owners.push(owner);
        _companionOwners[companionId][owner] = true;
      }
    }

    emit CompanionRegistered(companionId, msg.sender, profileCID, privacyLevel);
  }

  function refreshCompanionProfile(
    uint256 companionId,
    string calldata profileCID,
    uint8 privacyLevel
  ) external onlyCompanionOwner(companionId) companionExists(companionId) {
    if (bytes(profileCID).length == 0) revert InvalidInput();
    if (privacyLevel > 2) revert InvalidInput();

    CompanionProfile storage companion = _companions[companionId];
    companion.profileCID = profileCID;
    companion.privacyLevel = privacyLevel;
    companion.updatedAt = uint64(block.timestamp);

    emit CompanionProfileRefreshed(companionId, profileCID, privacyLevel);
  }

  function recordStory(
    uint256 companionId,
    string calldata logCID,
    uint8 eventType
  ) external onlyCompanionOwner(companionId) companionExists(companionId) returns (uint256 storyId) {
    storyId = _recordStory(companionId, logCID, eventType, msg.sender);
  }

  function recordStoryWithVital(
    uint256 companionId,
    string calldata logCID,
    uint8 eventType,
    externalEuint64 encryptedVital,
    bytes calldata inputProof
  ) external onlyCompanionOwner(companionId) companionExists(companionId) returns (uint256 storyId) {
    storyId = _recordStory(companionId, logCID, eventType, msg.sender);
    _embedVitalIntoStory(companionId, storyId, encryptedVital, inputProof, msg.sender);
  }

  function embedVitalIntoStory(
    uint256 storyId,
    externalEuint64 encryptedVital,
    bytes calldata inputProof
  ) external {
    StoryPointer memory pointer = _storyPointers[storyId];
    if (!pointer.exists) revert StoryNotFound(storyId);
    if (!_companionOwners[pointer.companionId][msg.sender]) {
      revert NotCompanionOwner(pointer.companionId, msg.sender);
    }
    _embedVitalIntoStory(pointer.companionId, storyId, encryptedVital, inputProof, msg.sender);
  }

  function trackVitalShift(
    uint256 companionId,
    externalEuint64 deltaVital,
    bytes calldata inputProof
  ) external onlyCompanionOwner(companionId) companionExists(companionId) {
    euint64 delta = FHE.fromExternal(deltaVital, inputProof);
    _encryptedVitalNebula[companionId] = FHE.add(_encryptedVitalNebula[companionId], delta);
    _shareVitalWithAllies(companionId, _encryptedVitalNebula[companionId], msg.sender);
    _hasVitalAura[companionId] = true;
  }

  function attestStory(
    uint256 storyId,
    string calldata verifyCID,
    bool approved
  ) external onlyVerifier {
    StoryPointer memory pointer = _storyPointers[storyId];
    if (!pointer.exists) revert StoryNotFound(storyId);

    StoryEntry storage entry = _companionStories[pointer.companionId][pointer.index];
    entry.verified = approved;
    entry.verifier = msg.sender;
    entry.verifyCID = verifyCID;

    emit StoryAttested(pointer.companionId, storyId, msg.sender, verifyCID, approved);
  }

  function allowConstellationViewer(uint256 companionId, address viewer)
    external
    onlyCompanionOwner(companionId)
    companionExists(companionId)
  {
    if (viewer == address(0)) revert InvalidViewer(viewer);
    _allowConstellationViewer(companionId, viewer);
  }

  function banConstellationViewer(uint256 companionId, address viewer)
    external
    onlyCompanionOwner(companionId)
    companionExists(companionId)
  {
    if (!_constellationViewers[companionId][viewer]) revert InvalidViewer(viewer);
    _constellationViewers[companionId][viewer] = false;
    emit ConstellationViewerRevoked(companionId, viewer);
  }

  function flagAuroraCertificate(
    uint256 companionId,
    uint256 storyId,
    string calldata certCID
  ) external onlyCompanionOwner(companionId) companionExists(companionId) {
    if (!_storyPointers[storyId].exists || _storyPointers[storyId].companionId != companionId) {
      revert StoryNotFound(storyId);
    }
    emit AuroraCertificateFlagged(companionId, storyId, certCID);
  }

  function getCompanion(uint256 companionId)
    external
    view
    companionExists(companionId)
    returns (CompanionView memory viewData)
  {
    CompanionProfile storage companion = _companions[companionId];
    viewData = CompanionView({
      companionId: companion.companionId,
      profileCID: companion.profileCID,
      privacyLevel: companion.privacyLevel,
      createdAt: companion.createdAt,
      updatedAt: companion.updatedAt,
      owners: companion.owners,
      storyCount: _companionStories[companionId].length,
      hasVitalAura: _hasVitalAura[companionId]
    });
  }

  function getStories(uint256 companionId, uint256 start, uint256 count)
    external
    view
    companionExists(companionId)
    returns (StoryView[] memory stories)
  {
    StoryEntry[] storage entries = _companionStories[companionId];
    if (start >= entries.length) {
      return new StoryView[](0);
    }

    uint256 end = start + count;
    if (end > entries.length) {
      end = entries.length;
    }
    uint256 size = end - start;
    stories = new StoryView[](size);

    for (uint256 i = 0; i < size; i++) {
      StoryEntry storage entry = entries[start + i];
      stories[i] = StoryView({
        storyId: entry.storyId,
        companionId: entry.companionId,
        author: entry.author,
        logCID: entry.logCID,
        eventType: entry.eventType,
        timestamp: entry.timestamp,
        verified: entry.verified,
        verifier: entry.verifier,
        verifyCID: entry.verifyCID,
        hasEncryptedVital: entry.hasEncryptedVital
      });
    }
  }

  function getStoryVitalHandle(uint256 storyId)
    external
    view
    returns (euint64 vital)
  {
    StoryPointer memory pointer = _storyPointers[storyId];
    if (!pointer.exists) revert StoryNotFound(storyId);
    if (!_isAuroraAuthorized(pointer.companionId, msg.sender)) {
      revert NotAuroraAuthorized(pointer.companionId, msg.sender);
    }
    StoryEntry storage entry = _companionStories[pointer.companionId][pointer.index];
    require(entry.hasEncryptedVital, "No vital");
    return entry.encryptedVital;
  }

  function getCompanionVitalSummary(uint256 companionId)
    external
    view
    onlyAuroraAuthorized(companionId)
    companionExists(companionId)
    returns (euint64 sum, euint32 count)
  {
    return (_encryptedVitalNebula[companionId], _encryptedVitalOrbit[companionId]);
  }

  function isCompanionGuardian(uint256 companionId, address account) external view returns (bool) {
    return _companionOwners[companionId][account];
  }

  function isConstellationViewer(uint256 companionId, address account) external view returns (bool) {
    return _constellationViewers[companionId][account];
  }

  function isAuroraVerifier(address account) external view returns (bool) {
    return _auroraVerifierWhitelist[account];
  }

  function _recordStory(
    uint256 companionId,
    string calldata logCID,
    uint8 eventType,
    address author
  ) internal returns (uint256 storyId) {
    if (bytes(logCID).length == 0) revert InvalidInput();
    CompanionProfile storage companion = _companions[companionId];

    storyId = nextStoryId++;

    StoryEntry memory entry = StoryEntry({
      storyId: storyId,
      companionId: companionId,
      author: author,
      logCID: logCID,
      eventType: eventType,
      timestamp: uint64(block.timestamp),
      hasEncryptedVital: false,
      encryptedVital: FHE.asEuint64(0),
      verified: false,
      verifier: address(0),
      verifyCID: ""
    });

    _companionStories[companionId].push(entry);
    uint256 index = _companionStories[companionId].length - 1;
    _storyPointers[storyId] = StoryPointer({ companionId: companionId, index: index, exists: true });

    companion.updatedAt = uint64(block.timestamp);

    emit StoryCaptured(companionId, storyId, author, logCID, eventType, false);
  }

  function _embedVitalIntoStory(
    uint256 companionId,
    uint256 storyId,
    externalEuint64 encryptedVital,
    bytes calldata inputProof,
    address actor
  ) internal {
    StoryPointer memory pointer = _storyPointers[storyId];
    if (!pointer.exists || pointer.companionId != companionId) revert StoryNotFound(storyId);

    StoryEntry storage entry = _companionStories[companionId][pointer.index];
    if (entry.hasEncryptedVital) revert StoryAlreadyHasVital(storyId);

    euint64 vital = FHE.fromExternal(encryptedVital, inputProof);
    entry.encryptedVital = vital;
    entry.hasEncryptedVital = true;

    _encryptedVitalNebula[companionId] = FHE.add(_encryptedVitalNebula[companionId], vital);
    _encryptedVitalOrbit[companionId] = FHE.add(
      _encryptedVitalOrbit[companionId],
      FHE.asEuint32(1)
    );
    _hasVitalAura[companionId] = true;

    _shareVitalWithAllies(companionId, vital, actor);
    _shareVitalWithAllies(companionId, _encryptedVitalNebula[companionId], actor);
    _shareCountWithAllies(companionId, _encryptedVitalOrbit[companionId], actor);

    emit StoryCaptured(companionId, storyId, entry.author, entry.logCID, entry.eventType, true);
  }

  function _allowConstellationViewer(uint256 companionId, address viewer) internal {
    if (_constellationViewers[companionId][viewer]) {
      return;
    }
    _constellationViewers[companionId][viewer] = true;
    _viewerDirectory[companionId].push(viewer);

    if (_hasVitalAura[companionId]) {
      FHE.allow(_encryptedVitalNebula[companionId], viewer);
      FHE.allow(_encryptedVitalOrbit[companionId], viewer);
    }

    StoryEntry[] storage entries = _companionStories[companionId];
    for (uint256 i = 0; i < entries.length; i++) {
      if (entries[i].hasEncryptedVital) {
        FHE.allow(entries[i].encryptedVital, viewer);
      }
    }

    emit ConstellationViewerGranted(companionId, viewer);
  }

  function _shareVitalWithAllies(
    uint256 companionId,
    euint64 value,
    address actor
  ) internal {
    FHE.allowThis(value);
    FHE.allow(value, actor);

    CompanionProfile storage companion = _companions[companionId];
    for (uint256 i = 0; i < companion.owners.length; i++) {
      FHE.allow(value, companion.owners[i]);
    }

    address[] storage viewers = _viewerDirectory[companionId];
    for (uint256 i = 0; i < viewers.length; i++) {
      address viewer = viewers[i];
      if (_constellationViewers[companionId][viewer]) {
        FHE.allow(value, viewer);
      }
    }
  }

  function _shareCountWithAllies(
    uint256 companionId,
    euint32 value,
    address actor
  ) internal {
    FHE.allowThis(value);
    FHE.allow(value, actor);

    CompanionProfile storage companion = _companions[companionId];
    for (uint256 i = 0; i < companion.owners.length; i++) {
      FHE.allow(value, companion.owners[i]);
    }

    address[] storage viewers = _viewerDirectory[companionId];
    for (uint256 i = 0; i < viewers.length; i++) {
      address viewer = viewers[i];
      if (_constellationViewers[companionId][viewer]) {
        FHE.allow(value, viewer);
      }
    }
  }

  function _isAuroraAuthorized(uint256 companionId, address account) internal view returns (bool) {
    if (_companionOwners[companionId][account]) {
      return true;
    }
    return _constellationViewers[companionId][account];
  }
}

