import React, { useState } from 'react';
import GovernmentDashboard from './apps/GovernmentDashboard';
import MerchantPoSApp from './apps/MerchantPoSApp';
import { ShieldCheck, Building2, Store, Github, ExternalLink, Activity } from 'lucide-react';

export default function App() {
  const [activeRole, setActiveRole] = useState('government'); // 'government' | 'merchant_pos'

  // Default Mock Schemes
  const [schemes, setSchemes] = useState([
    {
      id: "scheme_agri_2026",
      name: "PM Kisan Fertilizer Subsidy 2026",
      description: "Direct subsidy voucher for registered farmers, restricted to fertilizer & seed merchants.",
      budget_allocated: 500000.0,
      budget_disbursed: 125000.0,
      cel_policy: "mcc in ['5261', '5191'] && geo_distance_km(lat, lng, 28.6139, 77.2090) <= 100.0 && now() <= exp",
      allowed_mccs: ["5261", "5191"],
      geo_center_lat: 28.6139,
      geo_center_lng: 77.2090,
      geo_radius_km: 100.0,
      expiry_days: 30
    },
    {
      id: "scheme_health_2026",
      name: "Ayushman Bharat Essential Medicine Voucher",
      description: "Targeted health voucher for essential medicines at verified pharmacies.",
      budget_allocated: 1000000.0,
      budget_disbursed: 430000.0,
      cel_policy: "mcc in ['5912', '8099'] && now() <= exp",
      allowed_mccs: ["5912", "8099"],
      geo_center_lat: null,
      geo_center_lng: null,
      geo_radius_km: null,
      expiry_days: 60
    }
  ]);

  // Default Active Beneficiary Token for demonstration
  const [activeToken, setActiveToken] = useState({
    jti: "tok_agri_98214a",
    amount: 2500,
    sd_jwt: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJHT0ktREJUIiwic3ViIjoiQkVOXzg5MjEwNCIsImp0aSI6InRva19hZ3JpXzk4MjE0YSIsInNjaGVtZV9pZCI6InNjaGVtZV9hZ3JpXzIwMjYiLCJhbW91bnQiOjI1MDAsImNlbF9wb2xpY3kiOiJtY2MgaW4gWydmMjYxJywgJzUxOTEnXSAmJiBub3coKSA8PSBleHAiLCJpYXQiOjE3NTg2NTAwMDAsImV4cCI6MTc5MDE4NjAwMCwiX3NkIjpbImdBNWZMSHNKSDFRdVpHUWkyVFRzclEiLCJTVWZ4aG1hN2V1MWpUT1lIdGFndnJnIl0sIl9zZF9hbGciOiJzaGEyNTYifQ~W1s1TWlOczNWWldZSWl5dWJzUSIsImJlbmVmaWNpYXJ5X25hbWUiLCJSYW1lc2ggS3VtYXIiXQ~W1s4RmhjTkE4aVhKWTFXdnpRZyIsInN0YXRlX2NvZGUiLCJVUCIu",
    disclosable_claims: {
      beneficiary_name: "Ramesh Kumar",
      state_code: "UP"
    }
  });

  // Settlement Ledger Stream
  const [settlementLedger, setSettlementLedger] = useState([
    {
      pos_txn_id: "pos_tx_881920",
      jti: "tok_agri_98214a",
      scheme_id: "scheme_agri_2026",
      merchant_id: "MERCHANT_AGRI_DEALER_401",
      burn_amount: 500,
      upi_rrn: "UPI492104928172",
      status: "SETTLED_VIA_UPI",
      synced_at: "2026-09-23T21:45:00Z"
    }
  ]);

  const handleMintToken = (data) => {
    const compactToken = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJHT0ktREJUIiwic3ViIjoi${btoa(data.beneficiary_id)}...~W1s...~`;
    const tokenObj = {
      jti: `tok_${Math.random().toString(36).substring(7)}`,
      amount: data.amount,
      sd_jwt: compactToken,
      disclosable_claims: data.disclosable_claims,
      sd_digests: ["sha256_digest_1_salt_a91", "sha256_digest_2_salt_b02"],
      public_key: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
    };
    setActiveToken(tokenObj);
    return tokenObj;
  };

  const handleSyncBatch = (claimsBatch) => {
    const newRecords = claimsBatch.map(c => ({
      pos_txn_id: c.pos_txn_id,
      jti: c.jti,
      scheme_id: c.scheme_id,
      merchant_id: c.merchant_id,
      burn_amount: c.burn_amount,
      upi_rrn: `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      status: "SETTLED_VIA_UPI",
      synced_at: new Date().toISOString()
    }));

    setSettlementLedger(prev => [...newRecords, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              T
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight font-heading text-white flex items-center gap-2">
                Tokify <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">SD-JWT DPI</span>
              </h1>
            </div>
          </div>

          {/* Ecosystem View Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveRole('government')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                activeRole === 'government'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Government Dashboard
            </button>
            <button
              onClick={() => setActiveRole('merchant_pos')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                activeRole === 'merchant_pos'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> Merchant PoS & Wallet App
            </button>
          </div>

          <a
            href="https://github.com/Nabeelop/tokify"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
          >
            <Github className="w-4 h-4" /> Nabeelop/tokify <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeRole === 'government' ? (
          <GovernmentDashboard
            schemes={schemes}
            onMintToken={handleMintToken}
            settlementLedger={settlementLedger}
          />
        ) : (
          <MerchantPoSApp
            activeToken={activeToken}
            onSyncBatch={handleSyncBatch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Tokify. Hybrid DPI Orchestration Layer for Selective Disclosure Subsidies (RFC 9524).</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>CEL Rule Engine</span>
            <span>•</span>
            <span>Acoustic Data-over-Sound</span>
            <span>•</span>
            <span>UPI Settlement Rails</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
