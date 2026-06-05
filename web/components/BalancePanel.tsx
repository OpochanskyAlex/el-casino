'use client'
import { useAccount, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CASINO_ABI, CONTRACT_ADDRESS } from '@/lib/contract'

export function BalancePanel({ onRefetch }: { onRefetch?: (fn: () => void) => void }) {
  const { address, isConnected } = useAccount()

  const { data: balance, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getBalance',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  if (onRefetch && refetch) onRefetch(refetch)

  const eth = balance !== undefined ? parseFloat(formatEther(balance)).toFixed(4) : '—'

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden relative">
      {/* Full image, natural aspect ratio, nothing cropped */}
      <img src="/eto_casion.png" alt="" className="w-full block" />

      {/* Compact balance block, left-aligned, wraps its own text */}
      <div className="absolute inset-0 flex items-end p-4">
        <div className="inline-block rounded-xl bg-black/65 backdrop-blur-sm px-4 py-3">
          <p className="text-xs text-gray-300 uppercase tracking-widest mb-1">Casino Balance</p>
          <p className="text-3xl font-bold text-amber-400">
            {eth} <span className="text-lg font-normal text-gray-300">ETH</span>
          </p>
          {isConnected && balance === BigInt(0) && (
            <p className="text-xs text-gray-400 mt-1">Deposit ETH to start playing</p>
          )}
        </div>
      </div>
    </div>
  )
}
