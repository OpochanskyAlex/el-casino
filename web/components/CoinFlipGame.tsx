'use client'
import { useState, useEffect } from 'react'
import {
  useAccount, useReadContract, useWriteContract,
  useWaitForTransactionReceipt, usePublicClient, useBlockNumber
} from 'wagmi'
import { keccak256, encodePacked, formatEther, parseEther, decodeEventLog } from 'viem'
import { sepolia } from 'wagmi/chains'
import { CASINO_ABI, CONTRACT_ADDRESS, SEPOLIA_EXPLORER } from '@/lib/contract'

interface PendingBet {
  betId: string
  secret: string
  commitBlock: string
  amount: string
  choice: number
}

function storageKey(address: string) {
  return `casino_pending_${address.toLowerCase()}`
}

function loadPending(address: string): PendingBet[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(address)) || '[]')
  } catch { return [] }
}

function savePending(address: string, bets: PendingBet[]) {
  localStorage.setItem(storageKey(address), JSON.stringify(bets))
}

interface RevealedResult {
  betId: string
  outcome: number
  choice: number
  amount: bigint
  payout: bigint
  txHash: string
}

export function CoinFlipGame({ onBalanceChange }: { onBalanceChange: () => void }) {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()
  const [choice, setChoice] = useState<0 | 1>(0)
  const [betAmount, setBetAmount] = useState('')
  const [validationError, setValidationError] = useState('')
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([])
  const [result, setResult] = useState<RevealedResult | null>(null)
  const [checking, setChecking] = useState(false)

  const { data: blockNumber } = useBlockNumber({ watch: true, chainId: sepolia.id })

  const { data: casinoBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getBalance',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  const { data: pendingCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    functionName: 'getPendingBetCount' as any,
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isSuccess, isLoading: isConfirming, data: receipt } = useWaitForTransactionReceipt({ hash })

  // Load pending bets from localStorage on mount
  useEffect(() => {
    if (address) setPendingBets(loadPending(address))
  }, [address])

  // After commit tx confirmed: extract betId, save to localStorage, send secret to bot
  useEffect(() => {
    if (!isSuccess || !receipt || !address) return
    const log = receipt.logs.find(l =>
      l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
    )
    if (!log) return
    try {
      const decoded = decodeEventLog({ abi: CASINO_ABI, eventName: 'BetCommitted', data: log.data, topics: log.topics as [`0x${string}`, ...`0x${string}`[]] })
      const args = decoded.args as Record<string, unknown>
      const betId = String(args.betId)
      const secret = sessionStorage.getItem('casino_secret_pending') || ''
      if (!secret) return
      const newBet: PendingBet = {
        betId,
        secret,
        commitBlock: String(args.blockNumber),
        amount: String(args.amount),
        choice,
      }
      const updated = [...pendingBets, newBet]
      setPendingBets(updated)
      savePending(address, updated)
      sessionStorage.removeItem('casino_secret_pending')

      // Send secret to reveal bot so it can call revealBet() on-chain
      const botUrl = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001'
      fetch(`${botUrl}/secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betId,
          secret,
          player: address,
          amount: String(args.amount),
          commitBlock: String(args.blockNumber),
          choice,
        }),
      }).catch(() => {
        // Bot may not be running in dev; player can still claim timeout
        console.warn('Could not reach reveal bot — player may need to claim timeout')
      })
    } catch {}
    reset()
    setBetAmount('')
    onBalanceChange()
  }, [isSuccess, receipt, address])

  // Poll pending bets each block to check for reveal
  useEffect(() => {
    if (!pendingBets.length || !publicClient || !address || checking) return
    async function checkBets() {
      setChecking(true)
      const remaining: PendingBet[] = []
      for (const bet of pendingBets) {
        try {
          const betData = await publicClient!.readContract({
            address: CONTRACT_ADDRESS,
            abi: CASINO_ABI,
            functionName: 'getBet',
            args: [BigInt(bet.betId)],
          }) as { status: number }
          if (betData.status === 1) {
            // Revealed — fetch result from bot DB (avoids Alchemy block-range limit)
            try {
              const botUrl = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001'
              const histRes = await fetch(`${botUrl}/history?player=${address}`)
              if (histRes.ok) {
                const history: Array<{
                  bet_id: string; choice: number; outcome: number
                  amount: string; payout: string; reveal_tx: string
                }> = await histRes.json()
                const found = history.find(r => r.bet_id === bet.betId)
                if (found) {
                  setResult({
                    betId: bet.betId,
                    outcome: Number(found.outcome),
                    choice: Number(found.choice),
                    amount: BigInt(found.amount),
                    payout: BigInt(found.payout ?? '0'),
                    txHash: found.reveal_tx,
                  })
                }
              }
            } catch {}
            onBalanceChange()
          } else if (betData.status === 2) {
            onBalanceChange() // refunded
          } else {
            remaining.push(bet)
          }
        } catch {
          remaining.push(bet)
        }
      }
      if (remaining.length !== pendingBets.length) {
        setPendingBets(remaining)
        savePending(address!, remaining)
      }
      setChecking(false)
    }
    checkBets()
  }, [blockNumber])

  function handlePlay(e: React.FormEvent) {
    e.preventDefault()
    if (!address) return
    const n = parseFloat(betAmount)
    if (!betAmount || isNaN(n)) { setValidationError('Enter a bet amount'); return }
    if (n < 0.001) { setValidationError('Minimum bet is 0.001 ETH'); return }
    if (n > 0.1) { setValidationError('Maximum bet is 0.1 ETH'); return }
    if (casinoBalance !== undefined && parseEther(betAmount) > casinoBalance) {
      setValidationError('Insufficient casino balance')
      return
    }
    if (pendingCount !== undefined && Number(pendingCount) >= 2) {
      setValidationError('Max 2 pending bets at once')
      return
    }
    setValidationError('')
    setResult(null)

    // Generate secret and compute commitHash
    const secretBytes = new Uint8Array(32)
    crypto.getRandomValues(secretBytes)
    const secret = ('0x' + Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`
    const commitHash = keccak256(encodePacked(['bytes32'], [secret]))

    // Stash secret in sessionStorage until tx confirms and we get betId
    sessionStorage.setItem('casino_secret_pending', secret)

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'commitBet',
      args: [parseEther(betAmount), commitHash, choice],
    })
  }

  async function handleClaimTimeout(bet: PendingBet) {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'claimTimeout',
      args: [BigInt(bet.betId)],
    })
  }

  const isWrongNetwork = isConnected && chain?.id !== sepolia.id
  const canPlay = isConnected && !isWrongNetwork && casinoBalance && casinoBalance > BigInt(0)
  const isLoading = isPending || isConfirming

  return (
    <div className="space-y-4">
      {/* Result banner */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.outcome === result.choice
          ? 'bg-green-900/30 border-green-700'
          : 'bg-red-900/30 border-red-800'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-lg font-bold ${result.outcome === result.choice ? 'text-green-400' : 'text-red-400'}`}>
                {result.outcome === result.choice ? '🎉 You won!' : '💸 You lost'}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {result.outcome === result.choice
                  ? `+${parseFloat(formatEther(result.payout)).toFixed(4)} ETH`
                  : `-${parseFloat(formatEther(result.amount)).toFixed(4)} ETH`}
                {' · '}
                Outcome: {result.outcome === 0 ? 'Heads' : 'Tails'}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`${SEPOLIA_EXPLORER}/tx/${result.txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-amber-500 hover:text-amber-400 underline"
              >
                Verify on Etherscan
              </a>
              <button onClick={() => setResult(null)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Pending bets */}
      {pendingBets.map(bet => {
        const canTimeout = blockNumber && BigInt(bet.commitBlock) + BigInt(256) < blockNumber
        return (
          <div key={bet.betId} className="rounded-xl p-4 bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">
                  Bet #{bet.betId} — {parseFloat(formatEther(BigInt(bet.amount))).toFixed(4)} ETH
                  {' on '}{bet.choice === 0 ? 'Heads' : 'Tails'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Waiting for operator to reveal…
                </p>
              </div>
              {canTimeout && (
                <button
                  onClick={() => handleClaimTimeout(bet)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white transition"
                >
                  Claim Refund
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Game form */}
      <form onSubmit={handlePlay} className="space-y-4">
        {/* Heads / Tails */}
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as const).map(side => (
            <button
              key={side}
              type="button"
              onClick={() => setChoice(side)}
              className={`py-4 rounded-xl border-2 text-lg font-bold transition ${
                choice === side
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              {side === 0 ? '🌕 Heads' : '🌑 Tails'}
            </button>
          ))}
        </div>

        {/* Bet amount */}
        <div className="relative">
          <input
            type="number"
            step="0.001"
            min="0.001"
            max="0.1"
            placeholder="Bet amount (0.001 – 0.1)"
            value={betAmount}
            onChange={e => { setBetAmount(e.target.value); setValidationError('') }}
            disabled={!canPlay || isLoading}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-base focus:outline-none focus:border-amber-500 disabled:opacity-40 placeholder-gray-600"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ETH</span>
        </div>

        {/* House edge notice */}
        <p className="text-xs text-gray-500 text-center">
          House edge: 2% · Winning payout: 1.96× your bet
        </p>

        {validationError && <p className="text-xs text-red-400">{validationError}</p>}
        {writeError && !validationError && (
          <p className="text-xs text-red-400">
            {writeError.message.includes('rejected') ? 'Transaction rejected' : 'Transaction failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={!canPlay || isLoading}
          className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-base font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {!isConnected ? 'Connect wallet to play'
            : isWrongNetwork ? 'Switch to Sepolia'
            : !casinoBalance || casinoBalance === BigInt(0) ? 'Deposit ETH to play'
            : isLoading ? (isPending ? 'Confirm in MetaMask…' : 'Placing bet…')
            : 'Flip the coin'}
        </button>
      </form>
    </div>
  )
}
