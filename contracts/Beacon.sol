// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0 < 0.8.0;

import "./Proxy.sol";


contract Beacon {
    uint256 private _version;

    mapping(bytes32 => address) private _proxies;
    mapping(address => address) private _implementations;

    event ProxyCreated(address proxy);

    // TODO: protect with modifier
    function upgrade(bytes32[] memory names, address[] memory newImplementations) public {
        uint len = names.length;
        for (uint i; i < len; i++) {
            bytes32 name = names[i];
            address implementation = newImplementations[i];

            address proxy = _proxies[name];
            if (proxy == address(0)) {
                proxy = _createProxy(name);
                _implementations[proxy] = implementation;
            } else {
                // TODO: Upgrade implementation for existing proxy.
            }
        }

        _version++;
    }

    function _createProxy(bytes32 name) private returns (address) {
        address proxyAddress = address(new Proxy());
        _proxies[name] = proxyAddress;

        emit ProxyCreated(proxyAddress);

        return proxyAddress;
    }

    function getProxy(bytes32 name) public view returns (address) {
        return _proxies[name];
    }

    function getImplementation(address proxy) public view returns (address) {
        return _implementations[proxy];
    }

    function getVersion() public view returns (uint) {
        return _version;
    }

    function getImplementationAndVersionForSender() public view returns (address, uint) {
        return (getImplementation(msg.sender), _version);
    }
}
