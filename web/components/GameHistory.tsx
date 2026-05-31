'use client'
import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi'
import { formatEther } from 'viem'
import { sepolia } from 'wagmi/chains'
import { CONTRACT_ADDRESS, SEPOLIA_EXPLORER } from '@/lib/contract'

interface HistoryRow {
  betId: string
  choice: number
  outcome: number
  amount: bigint
  payout: bigint
  txHash: string
  blockNumber: bigint
}

export function GameHistory() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: blockNumber } = useBlockNumber({ chainId: sepolia.id })
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address || !publicClient || !blockNumber) return
    async function load() {
      setLoading(true)
      try {
        const fromBlock = blockNumber! > BigInt(10000) ? blockNumber! - BigInt(10000) : BigInt(0)
        const logs = await publicClient!.getLogs({
          address: CONTRACT_ADDRESS,
          event: {
            type: 'event', name: 'BetRevealed',
            inputs: [
              {name:'betId',type:'uint256',indexed:true},{name:'player',type:'address',indexed:true},
              {name:'choice',type:'uint8',indexed:false},{name:'outcome',type:'uint8',indexed:false},
              {name:'amount',type:'uint256',indexed:false},{name:'payout',type:'uint256',indexed:false},
              {name:'secret',type:'bytes32',indexed:false},{name:'blockHashUsed',type:'bytes32',indexed:false}
            ]
          },
          args: { player: address },
          fromBlock,
          toBlock: 'latest',
        })
        const parsed = logs.slice(-20).reverse().map(l => {
          const a = l.args as { betId: bigint; choice: number; outcome: number; amount: bigint; payout: bigint }
          return {
            betId: a.betId.toString(),
            choice: Number(a.choice),
            outcome: Number(a.outcome),
            amount: a.amount,
            payout: a.payout,
            txHash: l.transactionHash,
            blockNumber: l.blockNumber,
          }
        })
        setRows(parsed)
      } catch {}
      setLoading(false)
    }
    load()
  }, [address, publicClient, blockNumber])

  if (!isConnected) return null

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Recent Games</h2>
      </div>
      {loading ? (
        <div className="px-5 py-6 text-sm text-gray-500">Loading history…</div>
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
