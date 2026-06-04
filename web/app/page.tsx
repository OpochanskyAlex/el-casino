'use client'
import { useCallback, useRef, useState } from 'react'
import { WalletConnect } from '@/components/WalletConnect'
import { BalancePanel } from '@/components/BalancePanel'
import { DepositForm } from '@/components/DepositForm'
import { WithdrawForm } from '@/components/WithdrawForm'
import { CoinFlipGame } from '@/components/CoinFlipGame'
import { GameHistory } from '@/components/GameHistory'
import { CONTRACT_ADDRESS, SEPOLIA_EXPLORER } from '@/lib/contract'

export default function Home() {
  const refetchBalance = useRef<() => void>(() => {})
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const handleRefetch = useCallback((fn: () => void) => {
    refetchBalance.current = fn
  }, [])

  const triggerRefetch = useCallback(() => {
    refetchBalance.current()
    setHistoryRefresh(n => n + 1)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-amber-400">🎰 El Casino</span>
            <span className="ml-2 text-xs text-gray-600">Sepolia Testnet</span>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Balance */}
        <BalancePanel onRefetch={handleRefetch} />

        {/* Deposit / Withdraw */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-5">
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Deposit</h2>
            <DepositForm onSuccess={triggerRefetch} />
          </div>
          <div className="border-t border-gray-800 pt-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Withdraw</h2>
            <WithdrawForm onSuccess={triggerRefetch} />
          </div>
        </div>

        {/* Coin flip */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">Coin Flip</h2>
          <CoinFlipGame onBalanceChange={triggerRefetch} />
        </div>

        {/* History */}
        <GameHistory refreshTrigger={historyRefresh} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Contract:</span>
            <a
              href={`${SEPOLIA_EXPLORER}/address/${CONTRACT_ADDRESS}`}
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-amber-700 hover:text-amber-500"
            >
              {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-8)}
            </a>
          </div>
          <a href="/verify" className="text-gray-500 hover:text-gray-300 transition">
            How to verify fairness →
          </a>
        </div>
      </footer>
    </div>
  )
}
