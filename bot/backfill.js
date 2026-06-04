/**
 * One-time backfill script.
 * Fetches all BetRevealed events from Etherscan and updates DB rows
 * that are missing choice / outcome / payout (revealed before those
 * columns were added).
 *
 * Run once:
 *   cd bot && node backfill.js
 */

require('dotenv').config()
const { ethers } = require('ethers')
const { Pool } = require('pg')

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xD450251F6a9E3bA25Ba501930Dc563877a73b95b'
const DATABASE_URL     = process.env.DATABASE_URL
const ETHERSCAN_KEY    = process.env.ETHERSCAN_API_KEY || 'G5H21MK3GAA2I53P2D38DTE8JSY4T781TS'

const BETREVEALED_TOPIC = '0xa50ec674155f3910895feee5dd950e1ab71c58d1ab9003179d7bc3f4ddbf044f'
const iface = new ethers.Interface([
  'event BetRevealed(uint256 indexed betId, address indexed player, uint8 choice, uint8 outcome, uint256 amount, uint256 payout, bytes32 secret, bytes32 blockHashUsed)',
])

async function main() {
  if (!DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1) }

  const db = new Pool({ connectionString: DATABASE_URL })

  const url = `https://api.etherscan.io/v2/api?chainid=11155111&module=logs&action=getLogs` +
    `&address=${CONTRACT_ADDRESS}&topic0=${BETREVEALED_TOPIC}` +
    `&fromBlock=0&toBlock=latest&apikey=${ETHERSCAN_KEY}`

  console.log('Fetching BetRevealed events from Etherscan…')
  const res  = await fetch(url)
  const json = await res.json()

  if (json.status === '0' && json.message !== 'No records found') {
    console.error('Etherscan error:', json.message, json.result)
    process.exit(1)
  }

  const events = json.result || []
  console.log(`Found ${events.length} BetRevealed event(s)`)
  if (events.length === 0) { await db.end(); return }

  let updated = 0
  for (const log of events) {
    try {
      const parsed  = iface.parseLog({ topics: log.topics, data: log.data })
      const betId   = parsed.args.betId.toString()
      const choice  = Number(parsed.args.choice)
      const outcome = Number(parsed.args.outcome)
      const payout  = parsed.args.payout.toString()
      const txHash  = log.transactionHash

      const { rowCount } = await db.query(
        `UPDATE bets
         SET choice = $2, outcome = $3, payout = $4, reveal_tx = COALESCE(reveal_tx, $5), updated_at = NOW()
         WHERE bet_id = $1 AND (outcome IS NULL OR choice IS NULL)`,
        [betId, choice, outcome, payout, txHash]
      )

      if (rowCount > 0) {
        updated++
        console.log(`  Bet ${betId}: choice=${choice === 0 ? 'Heads' : 'Tails'} outcome=${outcome === 0 ? 'Heads' : 'Tails'} payout=${ethers.formatEther(payout)} ETH — updated`)
      } else {
        console.log(`  Bet ${betId}: already has data or not in DB — skipped`)
      }
    } catch (err) {
      console.error(`  Error processing log:`, err.message)
    }
  }

  console.log(`\nDone. ${updated} bet(s) backfilled.`)
  await db.end()
}

main().catch(err => { console.error(err); process.exit(1) })
