// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CenceraUserData
 * @dev Replaces traditional database for User Profile & Settings.
 * Allows users to store their public identity on-chain.
 * WARNING: All data stored here is public. Do not store API Keys or Secrets!
 */
contract CenceraUserData {

    struct UserProfile {
        bool isRegistered;
        string name;         // Display Name (e.g. "Alice", "DeFi Fund A")
        string organization; // Organization/Tag (e.g. "Cencera Team", "Independent")
        uint40 lastActive;
    }

    mapping(address => UserProfile) private _users;

    event UserRegistered(address indexed user, string name);
    event ProfileUpdated(address indexed user, string name, string org);

    constructor() {}

    /**
     * @dev Register or Update Identity
     * @param _name Display Name
     * @param _org Organization Name (optional)
     */
    function updateProfile(string calldata _name, string calldata _org) external {
        if (!_users[msg.sender].isRegistered) {
            _users[msg.sender].isRegistered = true;
            emit UserRegistered(msg.sender, _name);
        }
        
        _users[msg.sender].name = _name;
        _users[msg.sender].organization = _org;
        _users[msg.sender].lastActive = uint40(block.timestamp);
        
        emit ProfileUpdated(msg.sender, _name, _org);
    }

    /**
     * @dev Get user's full profile
     */
    function getUserData(address user) external view returns (
        bool isRegistered,
        string memory name,
        string memory organization,
        uint40 lastActive
    ) {
        UserProfile storage u = _users[user];
        return (u.isRegistered, u.name, u.organization, u.lastActive);
    }
}
