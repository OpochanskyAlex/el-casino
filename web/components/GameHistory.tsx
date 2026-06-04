'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { SEPOLIA_EXPLORER } from '@/lib/contract'

interface HistoryRow {
  betId: string
  choice: number
  outcome: number
  amount: bigint
  payout: bigint
  txHash: string
}

export function GameHistory({ refreshTrigger }: { refreshTrigger?: number }) {
  const { address, isConnected } = useAccount()
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!address) return
    async function load() {
      setLoading(true)
      setError('')
      try {
        const botUrl = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001'
        const res = await fetch(`${botUrl}/history?player=${address}`)
        if (!res.ok) throw new Error(`Bot returned ${res.status}`)
        const data: Array<{
          bet_id: string; choice: number; outcome: number
          amount: string; payout: string; reveal_tx: string
        }> = await res.json()
        setRows(data.map(r => ({
          betId:   r.bet_id,
          choice:  Number(r.choice),
          outcome: Number(r.outcome),
          amount:  BigInt(r.amount),
          payout:  BigInt(r.payout ?? '0'),
          txHash:  r.reveal_tx,
        })))
      } catch (err) {
        console.error('GameHistory:', err)
        setError('Could not load history')
      }
      setLoading(false)
    }
    load()
  }, [address, refreshTrigger])

  if (!isConnected) return null

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Recent Games</h2>
      </div>
      {loading ? (
        <div className="px-5 py-6 text-sm text-gray-500">Loading history…</div>
      ) : error ? (
        <div className="px-5 py-6 text-sm text-red-400">{error}</div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-6 text-sm text-gray-500">No completed rounds yet.</div>
      ) : (
        <div className="divide-y divide-gray-800">
          {rows.map(row => {
            const won = row.outcome === row.choice
            return (
              <div key={`${row.betId}-${row.txHash}`} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-mono text-xs w-8">#{row.betId}</span>
                  <span className="text-gray-400">{row.choice === 0 ? 'Heads' : 'Tails'}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {won ? 'WIN' : 'LOSS'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm ${won ? 'text-green-400' : 'text-red-400'}`}>
                    {won ? '+' : '-'}{parseFloat(formatEther(won ? row.payout : row.amount)).toFixed(4)} ETH
                  </span>
                  <a
                    href={`${SEPOLIA_EXPLORER}/tx/${row.txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-500"
                  >
                    ↗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
