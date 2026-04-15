// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title G50
 * @dev Updated version of G5. ERC20 token with a dynamic floor/ceiling price
 *      mechanism. Buy at ceiling, sell at floor. Floor updates every 10 blocks
 *      based on contract ETH balance per token. Maximum ~5% downside per cycle.
 */
contract G50 {
    string public constant NAME = "G50";
    string public constant SYMBOL = "G50";
    uint8 public constant DECIMALS = 8;

    uint256 public totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 public ceiling;
    uint256 public floor;
    uint256 public lastUpdate;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event PriceUpdate(uint256 newFloor, uint256 newCeiling, uint256 blockNumber);

    constructor() {
        // ~9523 tokens per ETH to start (mirrors original G5 initialisation)
        floor = 1 ether / 10_000 / 1e8;
        _updateCeiling();
        lastUpdate = block.number;
    }

    function _updateCeiling() private {
        // ceiling is always 5% above floor  (floor * 21/20)
        ceiling = (floor * 21) / 20;
    }

    /// @notice Refreshes floor & ceiling if ≥10 blocks have passed since last update.
    function maybeUpdate() public {
        if (block.number >= lastUpdate + 10) {
            uint256 supply = totalSupply;
            if (supply > 0) {
                floor = address(this).balance / supply;
                _updateCeiling();
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

        totalSupply += amount;
        _balances[msg.sender] += amount;

        emit Mint(msg.sender, amount);
        emit Transfer(address(0), msg.sender, amount);

        maybeUpdate();
    }

    /// @notice Sell G50 tokens for ETH at the current floor price.
    /// @param value Number of token units to sell.
    function sell(uint256 value) external {
        require(value > 0, "G50: amount must be > 0");
        require(_balances[msg.sender] >= value, "G50: insufficient balance");

        maybeUpdate();

        _balances[msg.sender] -= value;
        totalSupply -= value;

        emit Burn(msg.sender, value);
        emit Transfer(msg.sender, address(0), value);

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

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= value, "G50: insufficient allowance");
        _allowances[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _allowances[msg.sender][spender] += addedValue;
        emit Approval(msg.sender, spender, _allowances[msg.sender][spender]);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 current = _allowances[msg.sender][spender];
        uint256 newVal = subtractedValue > current ? 0 : current - subtractedValue;
        _allowances[msg.sender][spender] = newVal;
        emit Approval(msg.sender, spender, newVal);
        return true;
    }

    function _transfer(address from, address to, uint256 value) private {
        require(to != address(0), "G50: transfer to zero address");
        require(_balances[from] >= value, "G50: insufficient balance");
        _balances[from] -= value;
        _balances[to] += value;
        emit Transfer(from, to, value);
    }
}
