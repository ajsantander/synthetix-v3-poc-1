// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.0 < 0.8.0;

import "./Nebulav1.sol";
import "./NebulaStorage.sol";


contract NebulaV2 is NebulaV1 {
    function whoami() public pure override returns (string memory) {
        return "NebulaV2";
    }
}
