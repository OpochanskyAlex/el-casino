'use client'
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { CASINO_ABI, CONTRACT_ADDRESS } from '@/lib/contract'

export function DepositForm({ onSuccess }: { onSuccess: () => void }) {
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [validationError, setValidationError] = useState('')

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      setAmount('')
      reset()
      onSuccess()
    }
  }, [isSuccess, onSuccess, reset])

  function validate(val: string): string {
    const n = parseFloat(val)
    if (!val || isNaN(n)) return 'Enter an amount'
    if (n < 0.001) return 'Minimum deposit is 0.001 ETH'
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
      functionName: 'deposit',
      value: parseEther(amount),
    })
  }

  const errorMsg = validationError || (writeError
    ? (writeError.message.includes('rejected') ? 'Transaction rejected' : 'Transaction failed')
    : '')

  const isLoading = isPending || isConfirming

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Min 0.001 ETH"
            value={amount}
            onChange={e => { setAmount(e.target.value); setValidationError('') }}
            disabled={!isConnected || isLoading}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50 placeholder-gray-600"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ETH</span>
        </div>
        <button
          type="submit"
          disabled={!isConnected || isLoading}
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
        >
          {isLoading ? (isPending ? 'Confirm…' : 'Depositing…') : 'Deposit'}
        </button>
      </div>
      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
      {isSuccess && <p className="text-xs text-green-400">Deposit confirmed!</p>}
      <p className="text-xs text-gray-600">
        Need test ETH?{' '}
        <a href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-500 underline">
          Alchemy faucet
        </a>
      </p>
    </form>
  )
}
