// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title G50ERC20
 * @dev G50 rebuilt on OpenZeppelin ERC20. Buy at ceiling, sell at floor.
 *      Floor updates every 10 blocks based on contract ETH balance per token.
 *      Maximum ~5% downside per cycle.
 */
contract G50ERC20 is ERC20, ReentrancyGuard {
    uint256 public ceiling;
    uint256 public floor;
    uint256 public lastUpdate;

    event PriceUpdate(uint256 newFloor, uint256 newCeiling, uint256 blockNumber);

    constructor() ERC20("G50", "G50") {
        // 1 ETH per token at start: floor (wei per raw unit) = 1e18 / 1e8 = 1e10
        floor = 1 ether / 1e8;
        ceiling = (floor * 21) / 20;
        lastUpdate = block.number;
    }

    // ── Decimals override (OZ default is 18, G50 uses 8) ─────────────────────
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    /// @notice Refreshes floor & ceiling if ≥10 blocks have passed since last update.
    function maybeUpdate() public {
        if (block.number >= lastUpdate + 10) {
            uint256 supply = totalSupply();
            if (supply > 0) {
                floor = address(this).balance / supply;
                ceiling = (floor * 21) / 20;
            }
            lastUpdate = block.number;
            emit PriceUpdate(floor, ceiling, block.number);
        }
    }

    receive() external payable {
        buy();
    }

    /// @notice Buy G50 tokens by sending ETH. Tokens are minted at the ceiling price.
    function buy() public payable {
        require(msg.value > 0, "G50: must send ETH");
        require(ceiling > 0, "G50: ceiling not initialised");

        uint256 amount = msg.value / ceiling;
        require(amount > 0, "G50: ETH amount too small");

        _mint(msg.sender, amount);
        maybeUpdate();
    }

    /// @notice Sell G50 tokens for ETH at the current floor price.
    /// @param value Number of token units to sell.
    function sell(uint256 value) external nonReentrant {
        require(value > 0, "G50: amount must be > 0");

        maybeUpdate();

        _burn(msg.sender, value);

        uint256 ethAmount = value * floor;
        (bool ok, ) = msg.sender.call{value: ethAmount}("");
        require(ok, "G50: ETH transfer failed");
    }

    /// @notice Returns the current buy price (ceiling) in wei per token unit.
    function buyPrice() external view returns (uint256) {
        return ceiling;
    }

    /// @notice Returns the current sell price (floor) in wei per token unit.
    function sellPrice() external view returns (uint256) {
        return floor;
    }
}
