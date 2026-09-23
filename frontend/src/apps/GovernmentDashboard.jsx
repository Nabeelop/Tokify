import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Coins, 
  PlusCircle, 
  Activity, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Building2, 
  FileCode, 
  MapPin, 
  CreditCard,
  Zap,
  TrendingUp,
  Key
} from 'lucide-react';

export default function GovernmentDashboard({ schemes, onMintToken, settlementLedger }) {
  const [activeTab, setActiveTab] = useState('schemes');
  const [showMintModal, setShowMintModal] = useState(false);
  const [showSchemeModal, setShowSchemeModal] = useState(false);

  // Mint Form State
  const [mintForm, setMintForm] = useState({
    scheme_id: 'scheme_agri_2026',
    beneficiary_id: 'BEN_892104',
    amount: 2500,
    beneficiary_name: 'Ramesh Kumar',
    state_code: 'UP',
    farmer_category: 'Smallholder'
  });

  const [createdTokenResult, setCreatedTokenResult] = useState(null);

  const handleMintSubmit = (e) => {
    e.preventDefault();
    const result = onMintToken({
      scheme_id: mintForm.scheme_id,
      beneficiary_id: mintForm.beneficiary_id,
      amount: parseFloat(mintForm.amount),
      disclosable_claims: {
        beneficiary_name: mintForm.beneficiary_name,
        state_code: mintForm.state_code,
        farmer_category: mintForm.farmer_category
      }
    });
    setCreatedTokenResult(result);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 to-cyan-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Total Scheme Budget</span>
            <Coins className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2 font-heading">₹15,00,000</p>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> 100% Cryptographically Guaranteed
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 to-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Disbursed via SD-JWT</span>
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2 font-heading">₹5,55,000</p>
          <p className="text-xs text-slate-400 mt-2">Fractional burning active</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 to-purple-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Diversion Prevention</span>
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-purple-200 mt-2 font-heading">100.0%</p>
          <p className="text-xs text-purple-300/80 mt-2">CEL policy hard enforced</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900/90 to-amber-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Offline PoS Verifications</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-200 mt-2 font-heading">{settlementLedger.length + 142}</p>
          <p className="text-xs text-amber-300/80 mt-2">Zero double-spend occurrences</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'schemes'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Active Welfare Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setActiveTab('mint')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'mint'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Issue SD-JWT Tokens
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Live Settlement Ledger
          </button>
        </div>

        <button
          onClick={() => setActiveTab('mint')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-xl text-sm hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Issue New Token
        </button>
      </div>

      {/* TAB 1: Schemes List & CEL Rule View */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-800 hover:border-cyan-500/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {scheme.id}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2 font-heading">{scheme.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{scheme.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Allocated</span>
                  <p className="text-lg font-bold text-emerald-400 font-heading">₹{scheme.budget_allocated.toLocaleString()}</p>
                </div>
              </div>

              {/* CEL Constraint Engine Badge */}
              <div className="mt-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-cyan-300">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider mb-1">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" /> Embedded CEL Rule Policy (RFC 9524)
                </div>
                <p className="break-all">{scheme.cel_policy}</p>
              </div>

              {/* Attributes */}
              <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Merchant MCC</span>
                  <span className="font-semibold text-slate-200">{scheme.allowed_mccs.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Geo-fence Radius</span>
                  <span className="font-semibold text-slate-200">{scheme.geo_radius_km ? `${scheme.geo_radius_km} km` : 'National'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Expiry Period</span>
                  <span className="font-semibold text-slate-200">{scheme.expiry_days} Days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Issue SD-JWT Tokens */}
      {activeTab === 'mint' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white font-heading">Mint Programmable SD-JWT Voucher</h3>
            </div>
            
            <form onSubmit={handleMintSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Welfare Scheme</label>
                <select
                  value={mintForm.scheme_id}
                  onChange={(e) => setMintForm({...mintForm, scheme_id: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Beneficiary ID</label>
                  <input
                    type="text"
                    value={mintForm.beneficiary_id}
                    onChange={(e) => setMintForm({...mintForm, beneficiary_id: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subsidy Amount (₹)</label>
                  <input
                    type="number"
                    value={mintForm.amount}
                    onChange={(e) => setMintForm({...mintForm, amount: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-2">
                  Selective Disclosure Claims (RFC 9524)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400">Beneficiary Name (Disclosable Claim)</label>
                    <input
                      type="text"
                      value={mintForm.beneficiary_name}
                      onChange={(e) => setMintForm({...mintForm, beneficiary_name: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400">State Code</label>
                      <input
                        type="text"
                        value={mintForm.state_code}
                        onChange={(e) => setMintForm({...mintForm, state_code: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400">Farmer Category</label>
                      <input
                        type="text"
                        value={mintForm.farmer_category}
                        onChange={(e) => setMintForm({...mintForm, farmer_category: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" /> Generate & Sign SD-JWT Voucher
              </button>
            </form>
          </div>

          {/* Token Output Viewer */}
          <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white font-heading mb-4">Cryptographic SD-JWT Token Output</h3>
            
            {createdTokenResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> SD-JWT Token successfully minted & signed with RSA-256 key.
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Token JTI:</span>
                  <code className="text-xs bg-slate-900 text-cyan-400 p-2 rounded-lg block font-mono">
                    {createdTokenResult.jti}
                  </code>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">RFC 9524 Salted Disclosure Digests (_sd):</span>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-300 space-y-1">
                    {createdTokenResult.sd_digests?.map((digest, i) => (
                      <div key={i} className="truncate">
                        sha256_digest[{i}]: {digest}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Compact SD-JWT Token String:</span>
                  <textarea
                    readOnly
                    value={createdTokenResult.sd_jwt}
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                <Lock className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">No Token Generated Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">Fill the form on the left to mint an asymmetric SD-JWT token embedded with CEL rules.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Settlement Ledger */}
      {activeTab === 'ledger' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white font-heading">Deferred Batch Settlement Ledger</h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              UPI Rails Connected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">PoS Txn ID</th>
                  <th className="p-3">Token JTI</th>
                  <th className="p-3">Merchant ID</th>
                  <th className="p-3">Burn Amount</th>
                  <th className="p-3">UPI RRN</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {settlementLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No settled offline batches recorded yet. Present a token via PoS app to trigger instant UPI settlement.
                    </td>
                  </tr>
                ) : (
                  settlementLedger.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors font-mono">
                      <td className="p-3 text-cyan-400 font-bold">{tx.pos_txn_id}</td>
                      <td className="p-3 text-slate-300">{tx.jti}</td>
                      <td className="p-3 text-slate-400">{tx.merchant_id}</td>
                      <td className="p-3 text-emerald-400 font-bold">₹{tx.burn_amount}</td>
                      <td className="p-3 text-purple-300">{tx.upi_rrn}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{tx.synced_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
