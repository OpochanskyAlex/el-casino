'use client'
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { CASINO_ABI, CONTRACT_ADDRESS } from '@/lib/contract'

export function WithdrawForm({ onSuccess }: { onSuccess: () => void }) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [validationError, setValidationError] = useState('')

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getBalance',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) { setAmount(''); reset(); onSuccess() }
  }, [isSuccess, onSuccess, reset])

  function validate(val: string): string {
    const n = parseFloat(val)
    if (!val || isNaN(n) || n <= 0) return 'Enter an amount'
    if (balance !== undefined && parseEther(val) > balance) return 'Exceeds casino balance'
    return ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate(amount)
    if (err) { setValidationError(err); return }
    setValidationError('')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    })
  }

  const noBalance = !balance || balance === BigInt(0)
  const isLoading = isPending || isConfirming
  const errorMsg = validationError || (writeError
    ? (writeError.message.includes('rejected') ? 'Transaction rejected' : 'Transaction failed')
    : '')

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Amount"
            value={amount}
            onChange={e => { setAmount(e.target.value); setValidationError('') }}
            disabled={!isConnected || noBalance || isLoading}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50 placeholder-gray-600"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ETH</span>
        </div>
        <button
          type="button"
          onClick={() => balance && setAmount(formatEther(balance))}
          disabled={noBalance || isLoading}
          className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-30 transition"
        >
          Max
        </button>
        <button
          type="submit"
          disabled={!isConnected || noBalance || isLoading}
          className="px-5 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
        >
          {isLoading ? (isPending ? 'Confirm…' : 'Withdrawing…') : 'Withdraw'}
        </button>
      </div>
      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
      {isSuccess && <p className="text-xs text-green-400">Withdrawal confirmed!</p>}
    </form>
  )
}
