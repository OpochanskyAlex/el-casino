/**
 * El Casino — Operator Reveal Bot
 *
 * What this does (plain English):
 *  1. Connects to Sepolia via Alchemy WebSocket.
 *  2. Applies any pending DB migrations (creates the bets table if needed).
 *  3. On startup, loads all unresolved bets from the DB and attempts to reveal them.
 *  4. Listens for BetCommitted events in real time.
 *     When one arrives, saves the secret (already stored in DB by the frontend flow —
 *     actually the secret is NOT stored here; the bot commits bets from the DB where
 *     the frontend wrote the secret before committing on-chain).
 *
 * Wait — how does the bot know the secret?
 *  The secret is generated in the player's browser and stored in localStorage.
 *  The BOT is the OPERATOR — it calls revealBet() on behalf of the casino.
 *  But in this architecture the operator's secret is not the player's secret.
 *
 * Corrected flow:
 *  - The PLAYER generates a secret in the browser.
 *  - The PLAYER commits keccak256(secret) on-chain.
 *  - The OPERATOR (this bot) calls revealBet(betId, playerSecret).
 *  - But the bot doesn't know the player's secret!
 *
 * Resolution: the frontend must pass the player's secret to the bot after committing.
 * We do this via a lightweight API endpoint the bot exposes (POST /secret).
 * The frontend calls it immediately after commitBet confirms, passing {betId, secret}.
 * The bot stores it in Postgres, then reveals it.
 *
 * This is the standard architecture for commit-reveal casinos.
 */

require('dotenv').config()
const { ethers } = require('ethers')
const { Pool } = require('pg')
const http = require('http')

// ─── Config ──────────────────────────────────────────────────────────────────

const {
  OPERATOR_PRIVATE_KEY,
  CONTRACT_ADDRESS,
  RPC_URL,
  DATABASE_URL,
  PORT = '3001',
} = process.env

if (!OPERATOR_PRIVATE_KEY || !CONTRACT_ADDRESS || !RPC_URL || !DATABASE_URL) {
  console.error('Missing required env vars. Check .env file.')
  process.exit(1)
}

const CONTRACT_ABI = [
  'event BetCommitted(uint256 indexed betId, address indexed player, uint256 amount, bytes32 commitHash, uint8 choice, uint256 blockNumber)',
  'event BetRevealed(uint256 indexed betId, address indexed player, uint8 choice, uint8 outcome, uint256 amount, uint256 payout, bytes32 secret, bytes32 blockHashUsed)',
  'function revealBet(uint256 betId, bytes32 secret) external',
  'function getBet(uint256 betId) external view returns (tuple(address player, uint256 amount, bytes32 commitHash, uint8 choice, uint256 blockNumber, uint8 status))',
]

// ─── DB ──────────────────────────────────────────────────────────────────────

const db = new Pool({ connectionString: DATABASE_URL })

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bets (
      bet_id       BIGINT PRIMARY KEY,
      player       TEXT NOT NULL,
      amount       TEXT NOT NULL,
      secret       TEXT NOT NULL,
      commit_block BIGINT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending',
      reveal_tx    TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  // Add outcome columns if this is an existing DB without them
  await db.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS choice  INT`)
  await db.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS outcome INT`)
  await db.query(`ALTER TABLE bets ADD COLUMN IF NOT EXISTS payout  TEXT`)
  console.log('[DB] Migration applied')
}

async function saveBet({ betId, player, amount, secret, commitBlock, choice }) {
  await db.query(
    `INSERT INTO bets (bet_id, player, amount, secret, commit_block, status, choice)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6)
     ON CONFLICT (bet_id) DO NOTHING`,
    [betId.toString(), player, amount.toString(), secret, commitBlock.toString(), choice ?? null]
  )
}

async function markRevealed(betId, txHash, outcome, payout) {
  await db.query(
    `UPDATE bets SET status = 'revealed', reveal_tx = $2, outcome = $3, payout = $4, updated_at = NOW() WHERE bet_id = $1`,
    [betId.toString(), txHash, outcome ?? null, payout != null ? payout.toString() : null]
  )
}

async function markFailed(betId, reason) {
  await db.query(
    `UPDATE bets SET status = 'failed', updated_at = NOW() WHERE bet_id = $1`,
    [betId.toString()]
  )
  console.error(`[DB] Bet ${betId} marked failed: ${reason}`)
}

async function getPendingBets() {
  const { rows } = await db.query(
    `SELECT * FROM bets WHERE status = 'pending' ORDER BY commit_block ASC`
  )
  return rows
}

// ─── Blockchain ───────────────────────────────────────────────────────────────

let provider
let wallet
let casino

function connect() {
  // Use HTTP provider (polling) — more reliable than WebSocket for long-running bots
  provider = new ethers.JsonRpcProvider(RPC_URL)
  wallet   = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider)
  casino   = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet)
  console.log(`[ETH] Connected. Operator: ${wallet.address}`)
}

async function revealBet(betId, secret, commitBlock) {
  const currentBlock = await provider.getBlockNumber()
  const blocksLeft   = 256 - (currentBlock - Number(commitBlock))

  if (blocksLeft <= 0) {
    console.error(`[WARN] Bet ${betId}: blockhash expired (${-blocksLeft} blocks past window)`)
    await markFailed(betId, 'blockhash_expired')
    return
  }

  if (blocksLeft <= 56) {
    console.warn(`[WARN] Bet ${betId}: only ${blocksLeft} blocks left in reveal window!`)
  }

  // Check bet is still in Committed state (status 0)
  const bet = await casino.getBet(betId)
  if (bet.status !== 0n) {
    console.log(`[ETH] Bet ${betId}: already resolved (status ${bet.status}), skipping`)
    await markRevealed(betId, 'already_resolved')
    return
  }

  console.log(`[ETH] Revealing bet ${betId} (${blocksLeft} blocks remaining)…`)
  try {
    const tx = await casino.revealBet(betId, secret)
    console.log(`[ETH] Bet ${betId}: tx sent ${tx.hash}`)
    const receipt = await tx.wait(1)
    console.log(`[ETH] Bet ${betId}: confirmed in block ${receipt.blockNumber}`)

    // Compute outcome using the same formula as the contract:
    // outcome = keccak256(secret, blockhash(commitBlock)) % 2
    let outcome, payout
    const commitBlockData = await provider.getBlock(Number(commitBlock))
    if (commitBlockData?.hash) {
      const packed = ethers.solidityPacked(['bytes32', 'bytes32'], [secret, commitBlockData.hash])
      outcome = Number(BigInt(ethers.keccak256(packed)) % 2n)

      const { rows } = await db.query('SELECT choice, amount FROM bets WHERE bet_id = $1', [betId.toString()])
      if (rows[0]) {
        const won = outcome === Number(rows[0].choice)
        const betAmountWei = BigInt(rows[0].amount)
        payout = won ? (betAmountWei * 9800n / 5000n) : 0n
      }
    }
    await markRevealed(betId, tx.hash, outcome, payout)
  } catch (err) {
    const msg = err?.reason || err?.message || String(err)
    console.error(`[ETH] Bet ${betId}: reveal failed — ${msg}`)
    await markFailed(betId, msg)
  }
}

// ─── Block monitoring (timeout warnings) ─────────────────────────────────────

async function checkTimeouts() {
  const currentBlock = await provider.getBlockNumber()
  const pending      = await getPendingBets()

  for (const bet of pending) {
    const elapsed = currentBlock - Number(bet.commit_block)
    if (elapsed >= 250) {
      console.error(`[ALERT] Bet ${bet.bet_id}: ${elapsed} blocks elapsed — player can claim refund in ${256 - elapsed} blocks!`)
    } else if (elapsed >= 200) {
      console.warn(`[WARN]  Bet ${bet.bet_id}: ${elapsed} blocks elapsed — reveal soon or player may refund`)
    }
  }
}

// ─── Resume pending bets on startup ──────────────────────────────────────────

async function resumePending() {
  const pending = await getPendingBets()
  if (pending.length === 0) {
    console.log('[BOT] No pending bets to resume')
    return
  }
  console.log(`[BOT] Resuming ${pending.length} pending bet(s)…`)
  for (const bet of pending) {
    await revealBet(BigInt(bet.bet_id), bet.secret, bet.commit_block)
  }
}

// ─── Event listener ──────────────────────────────────────────────────────────

function listenForBets() {
  casino.on('BetCommitted', async (betId, player, amount, commitHash, choice, blockNumber, event) => {
    console.log(`[ETH] BetCommitted: betId=${betId} player=${player} block=${blockNumber}`)
    // Secret arrives via POST /secret (see HTTP server below)
    // Store a placeholder row so the HTTP handler can update it
    // Actually the frontend sends the secret via POST /secret which calls saveBet
    // Here we just log — the actual save happens in the HTTP endpoint
  })

  casino.on('BetRevealed', (betId, player, choice, outcome, amount, payout) => {
    const side    = outcome === 0n ? 'Heads' : 'Tails'
    const won     = choice === outcome
    const payoutEth = ethers.formatEther(payout)
    console.log(`[ETH] BetRevealed: betId=${betId} outcome=${side} ${won ? `WIN payout=${payoutEth}ETH` : 'LOSS'}`)
  })

  console.log('[BOT] Listening for BetCommitted events…')
}

// ─── HTTP API (receives secrets from frontend) ───────────────────────────────
// The frontend calls POST /secret with { betId, secret, player, amount, commitBlock }
// immediately after commitBet() confirms on-chain.

function startApiServer() {
  const server = http.createServer(async (req, res) => {
    // CORS headers so the Next.js frontend can call us
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'POST' && req.url === '/secret') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', async () => {
        try {
          const { betId, secret, player, amount, commitBlock, choice } = JSON.parse(body)
          if (!betId || !secret || !player || !amount || !commitBlock) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Missing fields' }))
            return
          }
          await saveBet({ betId: BigInt(betId), player, amount: BigInt(amount), secret, commitBlock, choice })
          console.log(`[API] Received secret for bet ${betId}, queuing reveal…`)
          res.writeHead(200)
          res.end(JSON.stringify({ ok: true }))

          // Reveal asynchronously after a short delay to let the commit block be mined
          setTimeout(() => revealBet(BigInt(betId), secret, commitBlock), 15000)
        } catch (err) {
          console.error('[API] Error:', err)
          res.writeHead(500)
          res.end(JSON.stringify({ error: 'Internal error' }))
        }
      })
      return
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200)
      res.end(JSON.stringify({ status: 'ok', address: wallet?.address }))
      return
    }

    if (req.method === 'GET' && req.url?.startsWith('/history')) {
      const player = new URL(req.url, 'http://localhost').searchParams.get('player')
      if (!player) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'Missing player address' }))
        return
      }
      try {
        const { rows } = await db.query(
          `SELECT bet_id, player, amount, choice, outcome, payout, reveal_tx, updated_at
           FROM bets
           WHERE lower(player) = lower($1) AND status = 'revealed'
             AND outcome IS NOT NULL AND choice IS NOT NULL
           ORDER BY bet_id DESC LIMIT 20`,
          [player]
        )
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(rows))
      } catch (err) {
        console.error('[API] History error:', err)
        res.writeHead(500)
        res.end(JSON.stringify({ error: 'Internal error' }))
      }
      return
    }

    res.writeHead(404)
    res.end()
  })

  server.listen(parseInt(PORT), () => {
    console.log(`[API] Listening on port ${PORT}`)
  })
}

// ─── Block polling (timeout checks every ~2 minutes) ─────────────────────────

function startBlockPolling() {
  provider.on('block', async (blockNumber) => {
    if (blockNumber % 10 === 0) { // check every ~10 blocks (~2 min)
      await checkTimeouts()
    }
  })
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[BOT] El Casino Reveal Bot starting…')
  await migrate()
  connect()
  await resumePending()
  listenForBets()
  startBlockPolling()
  startApiServer()
  console.log('[BOT] Ready.')
}

main().catch(err => {
  console.error('[BOT] Fatal error:', err)
  process.exit(1)
})
