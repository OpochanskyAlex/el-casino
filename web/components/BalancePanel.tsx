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
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Casino Balance</p>
      <p className="text-3xl font-bold text-amber-400">{eth} <span className="text-lg font-normal text-gray-400">ETH</span></p>
      {isConnected && balance === BigInt(0) && (
        <p className="text-xs text-gray-500 mt-2">Deposit ETH to start playing</p>
      )}
    </div>
  )
}
