// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0 < 0.8.0;

import "./Beacon.sol";


contract BeaconResolver {
    // _moduleCache[version][name] = address
    mapping(uint => mapping(bytes32 => address)) private _moduleCache;

    Beacon private _beacon;

    // TODO: protect so that it's only called once
    function initialize(address beacon) public {
        _beacon = Beacon(beacon);
    }

    function _getAppendedVersion(bytes memory data) internal pure returns (uint version) {
        uint256 len = data.length;

        assembly {
            version := mload(sub(add(data, len), 0x20))
        }
    }

    function _getModule(bytes32 name, bytes memory data) internal returns (address) {
        uint version = _getAppendedVersion(data);
        address module = _moduleCache[version][name];

        if (module == address(0)) {
            module = _beacon.getProxy(name);
            _moduleCache[version][name] = module;
        }

        return module;
    }
}
