// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0 < 0.8.0;

import "./NebulaStorage.sol";
import "../../BeaconResolver.sol";


contract NebulaV1 is NebulaStorage, BeaconResolver {
    bytes32 constant PULSAR_MODULE = 0x70756c7361720000000000000000000000000000000000000000000000000000;

    function recordCalldata() public {
        _recordedCalldata = msg.data;
    }

    function getRecordedCalldata() public view returns (bytes memory) {
        return _recordedCalldata;
    }

    function getAppendedVersion() public pure returns (uint) {
        return _getAppendedVersion(msg.data);
    }

    function doSomethingWithAnotherModule() public returns (address) {
        address pulsarModule = _getModule(PULSAR_MODULE, msg.data);

        return pulsarModule;
    }

    function whoami() public pure virtual returns (string memory) {
        return "NebulaV1";
    }
}
