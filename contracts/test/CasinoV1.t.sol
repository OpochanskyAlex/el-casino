// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CasinoV1.sol";

contract CasinoV1Test is Test {
    CasinoV1 casino;

    address owner   = address(this);
    address player1 = address(0x1);
    address player2 = address(0x2);

    // Allow the test contract to receive ETH from houseWithdraw.
    receive() external payable {}

    uint256 constant HOUSE_SEED = 0.8 ether;

    // ── helpers ──────────────────────────────────────────────────────────────

    /// Commit a bet and return betId extracted from the event.
    function _commit(
        address player,
        uint256 amount,
        bytes32 secret,
        uint8   choice
    ) internal returns (uint256 betId) {
        bytes32 commitHash = keccak256(abi.encodePacked(secret));
        vm.prank(player);
        casino.commitBet(amount, commitHash, choice);
        betId = casino.nextBetId() - 1;
    }

    /// Advance past the blockhash window so blockhash() returns non-zero at commitBlock.
    /// We roll forward by 1 block so the commit block hash is available.
    function _rollForReveal(uint256 commitBlock) internal {
        vm.roll(commitBlock + 1);
    }

    /// Roll past the 256-block timeout window.
    function _rollPastTimeout(uint256 commitBlock) internal {
        vm.roll(commitBlock + 257);
    }

    // ── setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        casino = new CasinoV1();

        // Fund the house pool.
        casino.houseDeposit{value: HOUSE_SEED}();

        // Give test players some ETH.
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
    }

    // ── deposit ───────────────────────────────────────────────────────────────

    function test_deposit_creditsBalance() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();
        assertEq(casino.getBalance(player1), 0.05 ether);
    }

    function test_deposit_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit CasinoV1.Deposited(player1, 0.05 ether);
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();
    }

    function test_deposit_belowMin_reverts() public {
        vm.prank(player1);
        vm.expectRevert("Deposit below minimum");
        casino.deposit{value: 0.0009 ether}();
    }

    function test_deposit_aboveMax_succeeds() public {
        vm.prank(player1);
        casino.deposit{value: 0.5 ether}();
        assertEq(casino.getBalance(player1), 0.5 ether);
    }

    function test_deposit_atMin_succeeds() public {
        vm.prank(player1);
        casino.deposit{value: 0.001 ether}();
        assertEq(casino.getBalance(player1), 0.001 ether);
    }

    function test_deposit_atMax_succeeds() public {
        vm.prank(player1);
        casino.deposit{value: 0.1 ether}();
        assertEq(casino.getBalance(player1), 0.1 ether);
    }

    // ── withdraw ──────────────────────────────────────────────────────────────

    function test_withdraw_happyPath() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        uint256 before = player1.balance;
        vm.prank(player1);
        casino.withdraw(0.05 ether);

        assertEq(casino.getBalance(player1), 0);
        assertEq(player1.balance, before + 0.05 ether);
    }

    function test_withdraw_emitsEvent() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        vm.expectEmit(true, false, false, true);
        emit CasinoV1.Withdrawn(player1, 0.05 ether);
        vm.prank(player1);
        casino.withdraw(0.05 ether);
    }

    function test_withdraw_insufficientBalance_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.01 ether}();

        vm.prank(player1);
        vm.expectRevert("Insufficient casino balance");
        casino.withdraw(0.02 ether);
    }

    function test_withdraw_zero_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.01 ether}();

        vm.prank(player1);
        vm.expectRevert("Amount must be greater than zero");
        casino.withdraw(0);
    }

    function test_withdraw_partial() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        vm.prank(player1);
        casino.withdraw(0.02 ether);
        assertEq(casino.getBalance(player1), 0.03 ether);
    }

    // ── commitBet ─────────────────────────────────────────────────────────────

    function test_commitBet_happyPath() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret = keccak256("mysecret");
        bytes32 hash   = keccak256(abi.encodePacked(secret));

        vm.prank(player1);
        casino.commitBet(0.05 ether, hash, 0);

        CasinoV1.Bet memory bet = casino.getBet(0);
        assertEq(bet.player,    player1);
        assertEq(bet.amount,    0.05 ether);
        assertEq(bet.commitHash, hash);
        assertEq(bet.choice,    0);
        assertEq(uint8(bet.status), uint8(CasinoV1.BetStatus.Committed));
    }

    function test_commitBet_emitsEvent() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret = keccak256("mysecret");
        bytes32 hash   = keccak256(abi.encodePacked(secret));

        vm.expectEmit(true, true, false, true);
        emit CasinoV1.BetCommitted(0, player1, 0.05 ether, hash, 0, block.number);
        vm.prank(player1);
        casino.commitBet(0.05 ether, hash, 0);
    }

    function test_commitBet_deductsPlayerBalance() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 hash = keccak256(abi.encodePacked(keccak256("s")));
        vm.prank(player1);
        casino.commitBet(0.05 ether, hash, 1);

        assertEq(casino.getBalance(player1), 0);
    }

    function test_commitBet_updatesPendingReserved() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(keccak256("s"))), 0);

        assertEq(casino.totalPendingReserved(), 0.05 ether * 196 / 100);
    }

    function test_commitBet_belowMin_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.01 ether}();

        vm.prank(player1);
        vm.expectRevert("Bet below minimum");
        casino.commitBet(0.0009 ether, bytes32(0), 0);
    }

    function test_commitBet_aboveMax_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.1 ether}();
        // Give extra so balance check doesn't fire first
        vm.deal(address(casino), 1 ether);

        vm.prank(player1);
        vm.expectRevert("Bet above maximum");
        casino.commitBet(0.11 ether, bytes32(0), 0);
    }

    function test_commitBet_insufficientBalance_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.01 ether}();

        vm.prank(player1);
        vm.expectRevert("Insufficient casino balance");
        casino.commitBet(0.05 ether, bytes32(0), 0);
    }

    function test_commitBet_maxPendingReached_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.1 ether}();

        bytes32 h = keccak256(abi.encodePacked(keccak256("s")));
        // First two succeed (MAX_PENDING_BETS = 2)
        vm.prank(player1);
        casino.commitBet(0.02 ether, h, 0);
        vm.prank(player1);
        casino.commitBet(0.02 ether, h, 0);

        // Third should fail
        vm.prank(player1);
        vm.expectRevert("Max pending bets reached");
        casino.commitBet(0.02 ether, h, 0);
    }

    function test_commitBet_invalidChoice_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        vm.prank(player1);
        vm.expectRevert("Invalid choice");
        casino.commitBet(0.05 ether, bytes32(0), 2);
    }

    function test_commitBet_insufficientLiquidity_reverts() public {
        // Deploy fresh casino with no house funds.
        CasinoV1 broke = new CasinoV1();
        vm.deal(player1, 1 ether);
        vm.prank(player1);
        broke.deposit{value: 0.05 ether}();

        vm.prank(player1);
        vm.expectRevert("Insufficient house liquidity");
        broke.commitBet(0.05 ether, bytes32(0), 0);
    }

    // ── revealBet ─────────────────────────────────────────────────────────────

    function test_revealBet_playerWins() public {
        bytes32 secret      = bytes32(uint256(42));
        uint256 commitBlock = block.number;

        // Pre-compute outcome at commitBlock+1 so we can pick the winning choice.
        vm.roll(commitBlock + 1);
        bytes32 bh       = blockhash(commitBlock);
        uint8   outcome  = uint8(uint256(keccak256(abi.encodePacked(secret, bh))) % 2);

        // Roll back and place the bet with the winning choice.
        vm.roll(commitBlock);
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), outcome);
        uint256 betId = casino.nextBetId() - 1;

        vm.roll(commitBlock + 1);
        casino.revealBet(betId, secret);

        uint256 expectedPayout = 0.05 ether * 9800 / 5000;
        assertEq(casino.getBalance(player1), expectedPayout);
    }

    function test_revealBet_playerLoses_houseGains() public {
        bytes32 secret      = bytes32(uint256(42));
        uint256 commitBlock = block.number;

        // Pre-compute outcome at commitBlock+1 so we can pick the losing choice.
        vm.roll(commitBlock + 1);
        bytes32 bh          = blockhash(commitBlock);
        uint8   outcome     = uint8(uint256(keccak256(abi.encodePacked(secret, bh))) % 2);
        uint8   losingChoice = outcome == 0 ? 1 : 0;

        // Roll back and place the bet with the losing choice.
        vm.roll(commitBlock);
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), losingChoice);
        uint256 betId = casino.nextBetId() - 1;

        uint256 houseBefore = casino.houseBalance();
        vm.roll(commitBlock + 1);
        casino.revealBet(betId, secret);

        assertEq(casino.getBalance(player1), 0);
        assertEq(casino.houseBalance(), houseBefore + 0.05 ether);
    }

    function test_revealBet_wrongSecret_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret     = bytes32(uint256(42));
        bytes32 commitHash = keccak256(abi.encodePacked(secret));
        uint256 commitBlock = block.number;

        vm.prank(player1);
        casino.commitBet(0.05 ether, commitHash, 0);
        uint256 betId = casino.nextBetId() - 1; // capture before expectRevert

        _rollForReveal(commitBlock);
        vm.expectRevert("Invalid secret");
        casino.revealBet(betId, bytes32(uint256(99)));
    }

    function test_revealBet_blockhashExpired_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret     = bytes32(uint256(42));
        bytes32 commitHash = keccak256(abi.encodePacked(secret));
        uint256 commitBlock = block.number;

        vm.prank(player1);
        casino.commitBet(0.05 ether, commitHash, 0);
        uint256 betId = casino.nextBetId() - 1;

        // Roll past 256 blocks so blockhash returns 0.
        vm.roll(commitBlock + 257);
        vm.expectRevert("Blockhash expired; player may claim timeout");
        casino.revealBet(betId, secret);
    }

    function test_revealBet_onlyOwner() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();
        bytes32 secret = bytes32(uint256(42));
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), 0);
        uint256 betId = casino.nextBetId() - 1; // capture before prank

        vm.prank(player1);
        vm.expectRevert();
        casino.revealBet(betId, secret);
    }

    function test_revealBet_clearsPendingReserved() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret     = bytes32(uint256(7));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), 0);
        uint256 betId = casino.nextBetId() - 1;

        _rollForReveal(commitBlock);
        casino.revealBet(betId, secret);

        assertEq(casino.totalPendingReserved(), 0);
        assertEq(casino.getPendingBetCount(player1), 0);
    }

    function test_revealBet_emitsBetRevealed() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret     = bytes32(uint256(42));
        bytes32 commitHash = keccak256(abi.encodePacked(secret));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, commitHash, 0);
        uint256 betId = casino.nextBetId() - 1;

        _rollForReveal(commitBlock);
        bytes32 bh = blockhash(commitBlock);
        uint8 outcome = uint8(uint256(keccak256(abi.encodePacked(secret, bh))) % 2);
        uint256 payout = (outcome == 0) ? 0.05 ether * 9800 / 5000 : 0;

        vm.expectEmit(true, true, false, true);
        emit CasinoV1.BetRevealed(betId, player1, 0, outcome, 0.05 ether, payout, secret, bh);
        casino.revealBet(betId, secret);
    }

    // ── claimTimeout ──────────────────────────────────────────────────────────

    function test_claimTimeout_happyPath() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret = bytes32(uint256(42));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), 0);
        uint256 betId = casino.nextBetId() - 1;

        _rollPastTimeout(commitBlock);

        vm.prank(player1);
        casino.claimTimeout(betId);

        assertEq(casino.getBalance(player1), 0.05 ether);
        assertEq(casino.totalPendingReserved(), 0);
        assertEq(uint8(casino.getBet(betId).status), uint8(CasinoV1.BetStatus.Refunded));
    }

    function test_claimTimeout_emitsEvent() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret = bytes32(uint256(42));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), 0);
        uint256 betId = casino.nextBetId() - 1;

        _rollPastTimeout(commitBlock);

        vm.expectEmit(true, true, false, true);
        emit CasinoV1.BetRefunded(betId, player1, 0.05 ether);
        vm.prank(player1);
        casino.claimTimeout(betId);
    }

    function test_claimTimeout_tooEarly_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret = bytes32(uint256(42));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), 0);
        uint256 betId = casino.nextBetId() - 1;

        vm.roll(commitBlock + 100);
        vm.prank(player1);
        vm.expectRevert("Timeout not yet reached");
        casino.claimTimeout(betId);
    }

    function test_claimTimeout_notYourBet_reverts() public {
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();

        bytes32 secret = bytes32(uint256(42));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, keccak256(abi.encodePacked(secret)), 0);
        uint256 betId = casino.nextBetId() - 1;

        _rollPastTimeout(commitBlock);

        vm.prank(player2);
        vm.expectRevert("Not your bet");
        casino.claimTimeout(betId);
    }

    // ── houseDeposit / houseWithdraw ─────────────────────────────────────────

    function test_houseDeposit_creditsHouseBalance() public {
        uint256 before = casino.houseBalance();
        casino.houseDeposit{value: 0.1 ether}();
        assertEq(casino.houseBalance(), before + 0.1 ether);
    }

    function test_houseDeposit_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit CasinoV1.HouseDeposited(0.1 ether);
        casino.houseDeposit{value: 0.1 ether}();
    }

    function test_houseDeposit_onlyOwner() public {
        vm.prank(player1);
        vm.expectRevert();
        casino.houseDeposit{value: 0.1 ether}();
    }

    function test_houseWithdraw_happyPath() public {
        uint256 ownerBefore = owner.balance;
        casino.houseWithdraw(0.1 ether);
        assertEq(casino.houseBalance(), HOUSE_SEED - 0.1 ether);
        assertEq(owner.balance, ownerBefore + 0.1 ether);
    }

    function test_houseWithdraw_emitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit CasinoV1.HouseWithdrawn(0.1 ether);
        casino.houseWithdraw(0.1 ether);
    }

    function test_houseWithdraw_drainGuard_reverts() public {
        // Commit a bet so totalPendingReserved > 0.
        vm.prank(player1);
        casino.deposit{value: 0.1 ether}();
        vm.prank(player1);
        casino.commitBet(0.1 ether, keccak256(abi.encodePacked(bytes32(uint256(1)))), 0);

        // Try to withdraw entire house balance.
        vm.expectRevert("Would drain reserved funds");
        casino.houseWithdraw(HOUSE_SEED);
    }

    function test_houseWithdraw_onlyOwner() public {
        vm.prank(player1);
        vm.expectRevert();
        casino.houseWithdraw(0.01 ether);
    }

    // ── end-to-end sequence ───────────────────────────────────────────────────

    function test_e2e_depositCommitRevealWithdraw() public {
        // Deposit
        vm.prank(player1);
        casino.deposit{value: 0.05 ether}();
        assertEq(casino.getBalance(player1), 0.05 ether);

        // Commit
        bytes32 secret     = bytes32(uint256(123));
        bytes32 commitHash = keccak256(abi.encodePacked(secret));
        uint256 commitBlock = block.number;
        vm.prank(player1);
        casino.commitBet(0.05 ether, commitHash, 0);
        uint256 betId = casino.nextBetId() - 1;
        assertEq(casino.getBalance(player1), 0);

        // Reveal
        _rollForReveal(commitBlock);
        casino.revealBet(betId, secret);

        // Balance should be either payout (win) or 0 (loss).
        bytes32 bh = blockhash(commitBlock);
        uint8 outcome = uint8(uint256(keccak256(abi.encodePacked(secret, bh))) % 2);
        if (outcome == 0) {
            assertEq(casino.getBalance(player1), 0.05 ether * 9800 / 5000);
        } else {
            assertEq(casino.getBalance(player1), 0);
        }

        // Withdraw whatever balance remains
        uint256 bal = casino.getBalance(player1);
        if (bal > 0) {
            uint256 walletBefore = player1.balance;
            vm.prank(player1);
            casino.withdraw(bal);
            assertEq(player1.balance, walletBefore + bal);
        }
    }

    function test_e2e_multiplePendingBets() public {
        vm.prank(player1);
        casino.deposit{value: 0.1 ether}();

        bytes32 s1 = bytes32(uint256(11));
        bytes32 s2 = bytes32(uint256(22));
        uint256 cb = block.number;

        vm.startPrank(player1);
        casino.commitBet(0.04 ether, keccak256(abi.encodePacked(s1)), 0);
        casino.commitBet(0.04 ether, keccak256(abi.encodePacked(s2)), 1);
        vm.stopPrank();

        assertEq(casino.getPendingBetCount(player1), 2);

        _rollForReveal(cb);
        casino.revealBet(0, s1);
        casino.revealBet(1, s2);

        assertEq(casino.getPendingBetCount(player1), 0);
        assertEq(casino.totalPendingReserved(), 0);
    }

    function test_e2e_betAtMinAndMax() public {
        vm.prank(player1);
        casino.deposit{value: 0.001 ether}();
        vm.prank(player1);
        casino.deposit{value: 0.1 ether}();

        // Min bet
        bytes32 sMin = bytes32(uint256(1));
        uint256 cb   = block.number;
        vm.prank(player1);
        casino.commitBet(0.001 ether, keccak256(abi.encodePacked(sMin)), 0);
        uint256 bidMin = casino.nextBetId() - 1;

        // Max bet
        bytes32 sMax = bytes32(uint256(2));
        vm.prank(player1);
        casino.commitBet(0.1 ether, keccak256(abi.encodePacked(sMax)), 0);
        uint256 bidMax = casino.nextBetId() - 1;

        _rollForReveal(cb);
        casino.revealBet(bidMin, sMin);
        casino.revealBet(bidMax, sMax);

        assertEq(casino.totalPendingReserved(), 0);
    }
}
