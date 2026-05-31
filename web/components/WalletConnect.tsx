'use client'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const isWrongNetwork = isConnected && chain?.id !== sepolia.id
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  if (isWrongNetwork) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-red-400">Wrong network</span>
        <button
          onClick={() => switchChain({ chainId: sepolia.id })}
          disabled={isSwitching}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition disabled:opacity-50"
        >
          {isSwitching ? 'Switching…' : 'Switch to Sepolia'}
        </button>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-gray-200 font-mono">{short}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition"
        >
          Disconnect
        </button>
      </div>
    )
  }

  const injectedConnector = connectors.find(c => c.id === 'injected')

  if (!injectedConnector) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition"
      >
        Install MetaMask
      </a>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => connect({ connector: injectedConnector })}
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition disabled:opacity-50"
      >
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {connectError && (
        <span className="text-xs text-red-400">
          {connectError.message.includes('rejected') ? 'Connection rejected' : connectError.message}
        </span>
      )}
    </div>
  )
}
