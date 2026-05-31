import { CONTRACT_ADDRESS, SEPOLIA_EXPLORER } from '@/lib/contract'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-amber-400">🎰 El Casino</a>
          <span className="text-xs text-gray-600">Sepolia Testnet</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">How to verify we&apos;re not a scam</h1>
          <p className="text-gray-400">
            Every round is verifiable on-chain. Here&apos;s exactly how to confirm the casino
            played fair — no trust required.
          </p>
        </div>

        {/* How it works */}
        <section className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest">How it works</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <strong className="text-white">1. You commit a secret.</strong> Before placing a bet,
              your browser generates a random number (the &quot;secret&quot;) and sends only its hash to the
              contract. Think of it as sealing an envelope — the casino sees the seal but not the contents.
            </p>
            <p>
              <strong className="text-white">2. The block hash provides entropy.</strong> The block
              that contains your bet has a hash that neither you nor the casino knew in advance.
            </p>
            <p>
              <strong className="text-white">3. The casino reveals.</strong> The operator opens the
              envelope by submitting the original secret. The outcome is computed as:
            </p>
            <pre className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-amber-300 overflow-x-auto">
{`outcome = keccak256(secret, blockHash) % 2
# 0 = Heads, 1 = Tails`}
            </pre>
            <p>
              <strong className="text-white">4. Everything is public.</strong> The <code className="text-amber-300">BetRevealed</code> event
              logs the secret and blockHash used. Anyone can recompute the outcome.
            </p>
          </div>
        </section>

        {/* Limitations */}
        <section className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Honest limitations</h2>
          <p className="text-sm text-gray-300">
            <strong className="text-white">Operator griefing:</strong> The casino operator could
            theoretically refuse to reveal a losing bet (for them). However, if the operator
            doesn&apos;t reveal within 256 blocks (~51 minutes), you can call{' '}
            <code className="text-amber-300">claimTimeout()</code> for a full refund — directly
            on-chain, no operator participation required.
          </p>
          <p className="text-sm text-gray-300">
            <strong className="text-white">This is a testnet.</strong> No real money is involved.
            Randomness quality is sufficient for a testnet demo but not recommended for
            high-stakes mainnet use (a VRF oracle would be better there).
          </p>
        </section>

        {/* Verification steps */}
        <section className="rounded-xl bg-gray-900 border border-gray-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Verify a round yourself</h2>
          <ol className="space-y-3 text-sm text-gray-300 list-decimal list-inside">
            <li>
              Find a <code className="text-amber-300">BetRevealed</code> event on{' '}
              <a href={`${SEPOLIA_EXPLORER}/address/${CONTRACT_ADDRESS}#events`}
                target="_blank" rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 underline">
                Etherscan
              </a>. Copy the <code className="text-amber-300">secret</code> and{' '}
              <code className="text-amber-300">blockHashUsed</code> fields.
            </li>
            <li>Run the snippet below in Python or JS to recompute the outcome.</li>
            <li>Compare to the <code className="text-amber-300">outcome</code> field in the event. They must match.</li>
          </ol>

          <div>
            <p className="text-xs text-gray-500 mb-2">Python</p>
            <pre className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-green-400 overflow-x-auto">
{`from eth_abi.packed import encode_packed
from eth_hash.auto import keccak

secret        = bytes.fromhex("YOUR_SECRET_HEX")   # remove 0x
block_hash    = bytes.fromhex("BLOCK_HASH_HEX")     # remove 0x

packed   = encode_packed(["bytes32", "bytes32"], [secret, block_hash])
outcome  = int(keccak(packed).hex(), 16) % 2
print("Heads" if outcome == 0 else "Tails")`}
            </pre>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">JavaScript / browser console</p>
            <pre className="bg-gray-950 rounded-lg p-4 text-xs font-mono text-blue-400 overflow-x-auto">
{`import { keccak256, encodePacked } from 'viem'

const secret    = "0xYOUR_SECRET_HEX"
const blockHash = "0xBLOCK_HASH_HEX"

const hash    = keccak256(encodePacked(['bytes32','bytes32'], [secret, blockHash]))
const outcome = BigInt(hash) % 2n
console.log(outcome === 0n ? "Heads" : "Tails")`}
            </pre>
          </div>
        </section>

        {/* Contract */}
        <section className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest mb-3">Contract</h2>
          <p className="text-sm text-gray-400 mb-2">Deployed and source-verified on Sepolia:</p>
          <a
            href={`${SEPOLIA_EXPLORER}/address/${CONTRACT_ADDRESS}#code`}
            target="_blank" rel="noopener noreferrer"
            className="font-mono text-sm text-amber-500 hover:text-amber-400 break-all"
          >
            {CONTRACT_ADDRESS}
          </a>
          <p className="text-xs text-gray-600 mt-2">
            House edge: 2% (HOUSE_EDGE_BPS = 200, visible in verified source)
          </p>
        </section>
      </main>
    </div>
  )
}
