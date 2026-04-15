// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/g50erc20.sol";

/**
 * @title DevSeed
 * @notice Development seeding script. Each scenario function deploys a fresh
 *         G50ERC20 and seeds it to a specific state useful for dapp development.
 *
 * Run via Makefile:  make s0  …  make s4
 * Or directly:
 *   forge script script/DevSeed.s.sol --sig "s3()" \
 *     --rpc-url http://localhost:8545 --broadcast \
 *     --private-key <ANVIL_PK_0>
 *
 * Scenarios
 *   s0  Fresh deploy — no activity
 *   s1  Three early buyers
 *   s2  Buys + first price update (floor recalculated)
 *   s3  Mixed buys & sells across two price cycles
 *   s4  Heavy activity — many cycles, significant price movement
 */
contract DevSeed is Script {
    // ── Anvil deterministic accounts (mnemonic: test test test … junk) ────────
    uint256 constant ALICE_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant BOB_PK = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant CAROL_PK = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 constant DAVE_PK = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 constant EVE_PK = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b;

    address constant ALICE = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant BOB = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant CAROL = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address constant DAVE = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address constant EVE = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    G50ERC20 g50;

    // ── Internal helpers ──────────────────────────────────────────────────────

    function _deploy() internal {
        vm.startBroadcast(ALICE_PK);
        g50 = new G50ERC20();
        vm.stopBroadcast();

        console.log("G50ERC20:", address(g50));
    }

    /// @dev Buy tokens. Each call is its own broadcast (own block on anvil).
    function _buy(uint256 pk, uint256 ethAmount) internal {
        vm.startBroadcast(pk);
        g50.buy{value: ethAmount}();
        vm.stopBroadcast();
    }

    /// @dev Sell entire token balance for `user`.
    function _sellAll(uint256 pk, address user) internal {
        uint256 bal = g50.balanceOf(user);
        if (bal == 0) return;
        vm.startBroadcast(pk);
        g50.sell(bal);
        vm.stopBroadcast();
    }

    /// @dev Sell half of `user`'s token balance.
    ///      Balance is read inside the broadcast so the amount is derived from
    ///      the actual on-chain state at execution time, not from the simulation
    ///      snapshot (which can diverge after many cycles).
    function _sellHalf(uint256 pk, address user) internal {
        vm.startBroadcast(pk);
        uint256 half = g50.balanceOf(user) / 2;
        if (half > 0) g50.sell(half);
        vm.stopBroadcast();
    }

    /**
     * @dev Advance the chain by 10 blocks and trigger a price update.
     *
     *      forge simulation freezes block.number at the chain head, so
     *      maybeUpdate() always looks like a no-op during simulation and gets
     *      a ~23k gas estimate. On broadcast it fires (~46k gas) and hits the
     *      limit. --gas-estimate-multiplier 500 in the Makefile covers it.
     *
     *      approve(BOB, 0) provides fixed-cost block advancement (one block
     *      per transaction on Anvil) with no protocol side-effects.
     *
     *      vm.roll() is a simulation-only cheat code that advances block.number
     *      in the simulation so maybeUpdate() fires and updates floor/ceiling
     *      during the simulation pass — keeping simulated balances in sync with
     *      what will actually happen on-chain. It does NOT add a broadcast tx.
     */
    function _tick() internal {
        vm.startBroadcast(ALICE_PK);
        for (uint256 i = 0; i < 10; i++) {
            g50.approve(BOB, 0); // mines a block, fixed gas, no protocol effect
        }
        vm.roll(block.number + 11); // keep simulation block.number in sync with on-chain
        g50.maybeUpdate();
        vm.stopBroadcast();
    }

    function _printState() internal view {
        uint256 floorWei = g50.floor();
        uint256 ceilWei = g50.ceiling();
        uint256 supply = g50.totalSupply();
        uint256 ethBalance = address(g50).balance;

        console.log("=== Contract state ===");
        console.log("address :", address(g50));
        console.log("floor   :", floorWei, "wei/unit");
        console.log("ceiling :", ceilWei, "wei/unit");
        console.log("supply  :", supply, "units");
        console.log("ETH     :", ethBalance, "wei");
        console.log("--- Balances (units) ---");
        console.log("ALICE  ", g50.balanceOf(ALICE));
        console.log("BOB    ", g50.balanceOf(BOB));
        console.log("CAROL  ", g50.balanceOf(CAROL));
        console.log("DAVE   ", g50.balanceOf(DAVE));
        console.log("EVE    ", g50.balanceOf(EVE));
    }

    // ── Scenarios ─────────────────────────────────────────────────────────────

    /// @notice s0 — fresh deploy, no activity.
    function s0() external {
        _deploy();
        _printState();
    }

    /// @notice s1 — three early buyers, no price update yet.
    function s1() external {
        _deploy();
        _buy(ALICE_PK, 2 ether);
        _buy(BOB_PK, 1 ether);
        _buy(CAROL_PK, 0.5 ether);
        _printState();
    }

    /// @notice s2 — buys then first price update (floor recalculated from ETH/supply).
    function s2() external {
        _deploy();
        _buy(ALICE_PK, 2 ether);
        _buy(BOB_PK, 1 ether);
        _buy(CAROL_PK, 0.5 ether);
        _tick();
        _printState();
    }

    /// @notice s3 — mixed buys & sells across two price cycles.
    function s3() external {
        _deploy();

        // — cycle 1 —
        _buy(ALICE_PK, 3 ether);
        _buy(BOB_PK, 2 ether);
        _buy(CAROL_PK, 1 ether);
        _tick(); // floor ↓ slightly (sells reduce ETH/supply ratio)
        _sellHalf(BOB_PK, BOB);

        // — cycle 2 —
        _buy(DAVE_PK, 1.5 ether);
        _buy(CAROL_PK, 0.5 ether);
        _tick();
        _sellHalf(ALICE_PK, ALICE);

        _printState();
    }

    /// @dev Deterministic pseudo-random uint in [lo, hi] (inclusive).
    function _rand(uint256 seed, uint256 lo, uint256 hi) internal pure returns (uint256) {
        if (hi <= lo) return lo;
        return lo + (uint256(keccak256(abi.encodePacked(seed))) % (hi - lo + 1));
    }

    /// @notice s4 — heavy activity, jittered amounts, many price cycles.
    ///
    ///  Fixed 4 buyers each cycle with ±30 % jitter on their base amount.
    ///  All 4 sell half after each tick.
    ///  EVE enters late with a large buy to stress the ceiling.
    function s4() external {
        _deploy();

        // vm.deal warms EVE's account in the forge simulation fork —
        // cold accounts (never transacted) can read as 0 balance even
        // when Anvil has them funded, causing a spurious OutOfFunds.
        vm.deal(EVE, 500 ether);

        for (uint256 i = 0; i < 10; i++) {
            // ±30 % jitter on base amounts
            _buy(ALICE_PK, _rand(i * 4 + 0, 1.4 ether, 2.6 ether));
            _buy(BOB_PK,   _rand(i * 4 + 1, 1.05 ether, 1.95 ether));
            _buy(CAROL_PK, _rand(i * 4 + 2, 0.7 ether, 1.3 ether));
            _buy(DAVE_PK,  _rand(i * 4 + 3, 0.35 ether, 0.65 ether));
            _tick();
            _sellHalf(ALICE_PK, ALICE);
            _sellHalf(BOB_PK,   BOB);
        }

        _buy(EVE_PK, 10 ether);
        _tick();
        _sellHalf(EVE_PK, EVE);

        _printState();
    }
}
