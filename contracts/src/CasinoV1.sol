// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * El Casino — provably-fair coin-flip on Ethereum Sepolia.
 *
 * How it works (plain English):
 *  1. Player deposits ETH into their casino balance.
 *  2. Player picks Heads (0) or Tails (1) and a bet amount.
 *  3. Player calls commitBet() with a hash of a secret number.
 *     Think of it like sealing an envelope: the player's choice is locked in.
 *  4. The operator (reveal bot) calls revealBet() with the original secret.
 *     Outcome = keccak256(secret, blockHash) % 2.
 *     Because neither party knew the block hash at commit time, neither can
 *     predict or manipulate the result.
 *  5. Win: player receives 1.96× their bet. Loss: bet goes to house.
 *  6. If the operator never reveals within 256 blocks, the player calls
 *     claimTimeout() for a full refund — no operator participation needed.
 */
contract CasinoV1 is Ownable, ReentrancyGuard {
    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────

    /// House edge in basis points (200 = 2 %).
    uint256 public constant HOUSE_EDGE_BPS = 200;

    /// Minimum bet / deposit: 0.001 ETH in wei.
    uint256 public constant MIN_BET = 0.001 ether;

    /// Maximum bet / deposit: 0.1 ETH in wei.
    uint256 public constant MAX_BET = 0.1 ether;

    /// How many bets a player may have awaiting reveal at once.
    uint256 public constant MAX_PENDING_BETS = 2;

    /// Blocks after which a player may claim a timeout refund.
    uint256 public constant TIMEOUT_BLOCKS = 256;

    // ─────────────────────────────────────────────
    // Data model
    // ─────────────────────────────────────────────

    enum BetStatus { Committed, Revealed, Refunded }

    struct Bet {
        address player;
        uint256 amount;
        bytes32 commitHash;  // keccak256(abi.encodePacked(secret))
        uint8   choice;      // 0 = Heads, 1 = Tails
        uint256 blockNumber; // block when commitBet() was mined
        BetStatus status;
    }

    // ─────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────

    /// Casino balance per player (in wei). Think of it as a Python dict:
    /// { address: balance_in_wei }
    mapping(address => uint256) public playerBalances;

    /// All bets ever placed, keyed by bet ID.
    mapping(uint256 => Bet) public bets;

    /// Operator's house pool (in wei).
    uint256 public houseBalance;

    /// Sum of max-payouts reserved against all pending bets.
    /// Ensures the house can always pay winners.
    uint256 public totalPendingReserved;

    /// Auto-incrementing bet ID counter.
    uint256 public nextBetId;

    /// Number of pending (unrevealed) bets per player.
    mapping(address => uint256) public pendingBetCount;

    // ─────────────────────────────────────────────
    // Events — think of these as structured log lines.
    // They are permanently recorded on-chain and readable
    // by anyone using a block explorer or RPC call.
    // ─────────────────────────────────────────────

    event Deposited(address indexed player, uint256 amount);
    event Withdrawn(address indexed player, uint256 amount);
    event BetCommitted(
        uint256 indexed betId,
        address indexed player,
        uint256 amount,
        bytes32 commitHash,
        uint8   choice,
        uint256 blockNumber
    );
    event BetRevealed(
        uint256 indexed betId,
        address indexed player,
        uint8   choice,
        uint8   outcome,      // 0 = Heads, 1 = Tails
        uint256 amount,
        uint256 payout,       // 0 on loss
        bytes32 secret,       // allows independent outcome verification
        bytes32 blockHashUsed // the entropy source
    );
    event BetRefunded(uint256 indexed betId, address indexed player, uint256 amount);
    event HouseDeposited(uint256 amount);
    event HouseWithdrawn(uint256 amount);

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─────────────────────────────────────────────
    // Player: deposit
    // ─────────────────────────────────────────────

    /**
     * Deposit ETH into the player's casino balance.
     * msg.value is the ETH sent with the transaction.
     * The contract holds it; playerBalances tracks who owns how much.
     */
    function deposit() external payable {
        require(msg.value >= MIN_BET, "Deposit below minimum");
        require(msg.value <= MAX_BET, "Deposit above maximum");
        playerBalances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // ─────────────────────────────────────────────
    // Player: withdraw
    // ─────────────────────────────────────────────

    /**
     * Withdraw ETH from the player's casino balance back to their wallet.
     * nonReentrant prevents the classic reentrancy attack where a malicious
     * contract calls withdraw() again before the first call finishes.
     * Checks-effects-interactions: balance is deducted BEFORE the ETH transfer.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(playerBalances[msg.sender] >= amount, "Insufficient casino balance");

        // Effect: deduct before transfer (CEI pattern)
        playerBalances[msg.sender] -= amount;

        // Interaction: send ETH to player
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // ─────────────────────────────────────────────
    // Player: commit bet
    // ─────────────────────────────────────────────

    /**
     * Place a bet using the commit-reveal scheme.
     *
     * The player generates a random secret off-chain, hashes it, and sends
     * the hash here. This locks in their choice without revealing their secret.
     * The block hash at this block number is not yet known, so neither party
     * can predict the outcome yet.
     *
     * @param betAmount  How much ETH to wager (must be in player's balance).
     * @param commitHash keccak256(abi.encodePacked(secret)) — sealed envelope.
     * @param choice     0 = Heads, 1 = Tails.
     */
    function commitBet(
        uint256 betAmount,
        bytes32 commitHash,
        uint8   choice
    ) external {
        require(betAmount >= MIN_BET, "Bet below minimum");
        require(betAmount <= MAX_BET, "Bet above maximum");
        require(playerBalances[msg.sender] >= betAmount, "Insufficient casino balance");
        require(pendingBetCount[msg.sender] < MAX_PENDING_BETS, "Max pending bets reached");
        require(choice == 0 || choice == 1, "Invalid choice");

        // Portfolio liquidity check: the house must be able to pay all
        // pending bets plus this new one if every player wins simultaneously.
        // Formula from ADR-004: reserve = betAmount * 196 / 100 (1.96× payout).
        // The *100 / *110 factor adds a 10% safety buffer across the portfolio.
        require(
            houseBalance * 100 >= totalPendingReserved * 110 + betAmount * 196,
            "Insufficient house liquidity"
        );

        // Deduct from player balance and create the bet record.
        playerBalances[msg.sender] -= betAmount;

        uint256 betId = nextBetId++;
        bets[betId] = Bet({
            player:      msg.sender,
            amount:      betAmount,
            commitHash:  commitHash,
            choice:      choice,
            blockNumber: block.number,
            status:      BetStatus.Committed
        });

        // Reserve the maximum possible payout against this bet.
        totalPendingReserved += betAmount * 196 / 100;
        pendingBetCount[msg.sender] += 1;

        emit BetCommitted(betId, msg.sender, betAmount, commitHash, choice, block.number);
    }

    // ─────────────────────────────────────────────
    // Operator: reveal bet
    // ─────────────────────────────────────────────

    /**
     * Reveal the outcome of a committed bet.
     * Only the contract owner (operator) can call this.
     *
     * The operator provides the original secret. The contract:
     *  1. Verifies the secret matches the committed hash.
     *  2. Uses the block hash from the commit block as entropy.
     *  3. Computes outcome = keccak256(secret, blockHash) % 2.
     *  4. Pays winner or credits house on loss.
     *
     * @param betId  The bet to resolve.
     * @param secret The original secret whose hash was committed.
     */
    function revealBet(uint256 betId, bytes32 secret) external onlyOwner {
        Bet storage bet = bets[betId];
        require(bet.status == BetStatus.Committed, "Bet not in committed state");
        require(
            keccak256(abi.encodePacked(secret)) == bet.commitHash,
            "Invalid secret"
        );

        // EVM only stores the last 256 block hashes.
        // If we're past that window, blockhash() returns bytes32(0).
        // Using zero as entropy would be insecure, so we revert here.
        // The player can call claimTimeout() for a full refund instead.
        bytes32 blockHashUsed = blockhash(bet.blockNumber);
        require(blockHashUsed != bytes32(0), "Blockhash expired; player may claim timeout");

        // Compute outcome: 0 = Heads, 1 = Tails.
        uint8 outcome = uint8(uint256(keccak256(abi.encodePacked(secret, blockHashUsed))) % 2);

        // Release the reserved liquidity for this bet.
        totalPendingReserved -= bet.amount * 196 / 100;
        pendingBetCount[bet.player] -= 1;
        bet.status = BetStatus.Revealed;

        uint256 payout = 0;
        if (outcome == bet.choice) {
            // Player wins: payout = betAmount * (10000 - 200) / 5000 = betAmount * 1.96
            // Dividing by 5000 (not 10000) because this is a coin flip with 50/50 odds.
            // Net effect: 2× multiplier × (1 - 2% house edge) = 1.96×.
            payout = bet.amount * (10000 - HOUSE_EDGE_BPS) / 5000;
            playerBalances[bet.player] += payout;
            houseBalance -= (payout - bet.amount); // house pays the net gain
        } else {
            // Player loses: bet goes to house pool.
            houseBalance += bet.amount;
        }

        emit BetRevealed(
            betId,
            bet.player,
            bet.choice,
            outcome,
            bet.amount,
            payout,
            secret,
            blockHashUsed
        );
    }

    // ─────────────────────────────────────────────
    // Player: claim timeout refund
    // ─────────────────────────────────────────────

    /**
     * If the operator has not revealed a bet within TIMEOUT_BLOCKS (256),
     * the player can call this to get a full refund.
     * This requires no operator participation — it's enforced purely by the contract.
     */
    function claimTimeout(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        require(bet.player == msg.sender, "Not your bet");
        require(bet.status == BetStatus.Committed, "Bet not in committed state");
        require(
            block.number > bet.blockNumber + TIMEOUT_BLOCKS,
            "Timeout not yet reached"
        );

        // CEI: update state before transfer.
        totalPendingReserved -= bet.amount * 196 / 100;
        pendingBetCount[msg.sender] -= 1;
        bet.status = BetStatus.Refunded;

        // Full refund to player balance.
        playerBalances[msg.sender] += bet.amount;

        emit BetRefunded(betId, msg.sender, bet.amount);
    }

    // ─────────────────────────────────────────────
    // Operator: house pool management
    // ─────────────────────────────────────────────

    /**
     * Operator deposits ETH into the house pool to fund payouts.
     */
    function houseDeposit() external payable onlyOwner {
        houseBalance += msg.value;
        emit HouseDeposited(msg.value);
    }

    /**
     * Operator withdraws from the house pool.
     * Cannot withdraw funds that are reserved against pending bets.
     */
    function houseWithdraw(uint256 amount) external onlyOwner nonReentrant {
        // Addition form to avoid underflow if a bug makes totalPendingReserved > houseBalance.
        require(houseBalance >= totalPendingReserved + amount, "Would drain reserved funds");
        houseBalance -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit HouseWithdrawn(amount);
    }

    // ─────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────

    function getBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }

    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }

    function getPendingBetCount(address player) external view returns (uint256) {
        return pendingBetCount[player];
    }
}
