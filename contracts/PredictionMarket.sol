// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PredictionMarket {
    error OnlyOwner();
    error MarketClosed();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error NoRewardsToClaim();
    error TransferFailed();
    error DeadlineNotPassed();

    address public owner;
    string public question;
    uint256 public deadline;
    uint256 public yesPool;
    uint256 public noPool;
    bool public resolved;
    bool public outcome;
    bool public initialized;

    mapping(address => uint256) public yesBets;
    mapping(address => uint256) public noBets;
    mapping(address => bool) public claimed;

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier marketOpen() {
        if (block.timestamp >= deadline) revert MarketClosed();
        _;
    }

    modifier marketResolved() {
        if (!resolved) revert MarketNotResolved();
        _;
    }

    modifier nonReentrant() {
        uint256 _status;
        assembly {
            _status := sload(0x00)
        }
        if (_status == 1) revert();
        assembly {
            sstore(0x00, 1)
        }
        _;
        assembly {
            sstore(0x00, 0)
        }
    }

    constructor(string memory _question, uint256 _deadline) {
        owner = msg.sender;
        question = _question;
        deadline = _deadline;
        initialized = true;
    }

    function buyYes() external payable marketOpen {
        if (msg.value == 0) revert();
        yesBets[msg.sender] += msg.value;
        yesPool += msg.value;
    }

    function buyNo() external payable marketOpen {
        if (msg.value == 0) revert();
        noBets[msg.sender] += msg.value;
        noPool += msg.value;
    }

    function resolveMarket(bool _outcome) external onlyOwner {
        if (resolved) revert MarketAlreadyResolved();
        if (block.timestamp < deadline) revert DeadlineNotPassed();
        outcome = _outcome;
        resolved = true;
    }

    function claimReward() external nonReentrant marketResolved {
        if (claimed[msg.sender]) revert NoRewardsToClaim();

        uint256 reward = 0;

        if (outcome) {
            reward = yesBets[msg.sender];
            if (reward > 0) {
                uint256 totalWinnings = yesBets[msg.sender] * (yesPool + noPool) / yesPool;
                yesBets[msg.sender] = 0;
                claimed[msg.sender] = true;
                (bool success, ) = payable(msg.sender).call{value: totalWinnings}("");
                if (!success) revert TransferFailed();
            }
        } else {
            reward = noBets[msg.sender];
            if (reward > 0) {
                uint256 totalWinnings = noBets[msg.sender] * (yesPool + noPool) / noPool;
                noBets[msg.sender] = 0;
                claimed[msg.sender] = true;
                (bool success, ) = payable(msg.sender).call{value: totalWinnings}("");
                if (!success) revert TransferFailed();
            }
        }

        if (reward == 0) revert NoRewardsToClaim();
    }

    function getUserBet(address user) external view returns (uint256 yesBet, uint256 noBet) {
        return (yesBets[user], noBets[user]);
    }
}
