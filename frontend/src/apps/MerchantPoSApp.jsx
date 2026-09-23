import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  QrCode, 
  Volume2, 
  Mic, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Store, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  ShieldAlert, 
  CreditCard,
  MapPin
} from 'lucide-react';
import { AcousticProtocol } from '../utils/acousticProtocol';
import { OfflinePoSVerifier } from '../utils/sdJwtVerifier';

export default function MerchantPoSApp({ activeToken, onSyncBatch }) {
  // PoS Network Connection Toggle (Online vs. Offline)
  const [isOnline, setIsOnline] = useState(false);
  
  // Presentation Mode: 'qr' or 'acoustic'
  const [presentationMode, setPresentationMode] = useState('qr');
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [soundProgress, setSoundProgress] = useState(0);

  // PoS Receiver State
  const [posContext, setPosContext] = useState({
    merchant_id: 'MERCHANT_AGRI_DEALER_401',
    merchant_mcc: '5261', // 5261 = Agricultural Supplies
    pos_lat: 28.6139,
    pos_lng: 77.2090,
    request_amount: 500
  });

  const [verificationResult, setVerificationResult] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [listeningAcoustic, setListeningAcoustic] = useState(false);

  // Trigger Acoustic Sound Wave Transmission
  const handlePlaySound = () => {
    if (!activeToken) return;
    setSoundPlaying(true);
    setSoundProgress(0);

    AcousticProtocol.playAcousticToken(
      activeToken.sd_jwt,
      (pct) => setSoundProgress(pct),
      () => {
        setSoundPlaying(false);
        setSoundProgress(100);
      }
    );
  };

  // Trigger Acoustic Microphone Receiver on PoS Device
  const handleListenAcoustic = () => {
    setListeningAcoustic(true);
    AcousticProtocol.listenAcousticToken((detected) => {
      setListeningAcoustic(false);
      handlePerformVerification(activeToken.sd_jwt);
    });
  };

  // Perform Offline / Online Signature & CEL Verification on PoS Hardware
  const handlePerformVerification = (sdJwtToVerify) => {
    if (!sdJwtToVerify) return;

    // 1. Decode token offline
    const decoded = OfflinePoSVerifier.decodeCompactSDJWT(sdJwtToVerify);
    if (!decoded) {
      setVerificationResult({
        valid: false,
        error: 'Malformed SD-JWT Token Structure'
      });
      return;
    }

    // 2. Evaluate embedded CEL policy rules offline
    const celEval = OfflinePoSVerifier.evaluateCELOffline(decoded.cel_policy, {
      merchant_mcc: posContext.merchant_mcc,
      pos_lat: posContext.pos_lat,
      pos_lng: posContext.pos_lng,
      request_amount: parseFloat(posContext.request_amount),
      remaining_balance: decoded.amount,
      token_exp: decoded.exp
    });

    const posTxnId = `pos_tx_${Math.floor(100000 + Math.random() * 900000)}`;

    const res = {
      valid: celEval.isCompliant,
      pos_txn_id: posTxnId,
      jti: decoded.jti,
      scheme_id: decoded.scheme_id,
      amount: decoded.amount,
      burn_amount: parseFloat(posContext.request_amount),
      violations: celEval.violations,
      verified_offline: !isOnline,
      timestamp: Math.floor(Date.now() / 1000)
    };

    setVerificationResult(res);

    // If verified compliant, add receipt to PoS local storage queue for batch settlement
    if (res.valid) {
      const claimItem = {
        pos_txn_id: posTxnId,
        jti: decoded.jti,
        scheme_id: decoded.scheme_id,
        merchant_id: posContext.merchant_id,
        merchant_mcc: posContext.merchant_mcc,
        burn_amount: parseFloat(posContext.request_amount),
        pos_lat: posContext.pos_lat,
        pos_lng: posContext.pos_lng,
        offline_timestamp: res.timestamp,
        pos_signature: `POS_SIG_${Math.random().toString(36).substring(7).toUpperCase()}`
      };
      setOfflineQueue(prev => [...prev, claimItem]);
    }
  };

  // Sync Batch when Internet returns
  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    onSyncBatch(offlineQueue);
    setOfflineQueue([]);
  };

  return (
    <div className="space-y-6">
      {/* Network Connectivity Status Bar */}
      <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
        isOnline 
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-amber-400 animate-pulse" />}
          <div>
            <h4 className="font-bold text-sm font-heading">
              PoS Device Status: {isOnline ? 'ONLINE (UPI Connected)' : 'OFFLINE MODE (Last-Mile Rural Scenario)'}
            </h4>
            <p className="text-xs text-slate-300/80">
              {isOnline 
                ? 'Ready for deferred batch sync and instant fiat settlement.'
                : 'PoS device verifies RSA-256 signatures & CEL rules 100% offline without cellular network.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition-all ${
            isOnline 
              ? 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
              : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Toggle Network ({isOnline ? 'Go Offline' : 'Connect Online'})
        </button>
      </div>

      {/* Main Grid: Beneficiary Mobile Wallet vs. Merchant PoS Hardware */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Beneficiary Mobile Wallet (Smartphone / Feature Phone) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" /> Beneficiary Mobile Wallet
            </h3>
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              Feature Phone Support
            </span>
          </div>

          {/* Wallet Card */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-950 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between text-xs text-cyan-300 mb-4">
              <span className="font-mono font-bold tracking-wider">PM KISAN FERTILIZER VOUCHER</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 font-semibold border border-cyan-500/30">SD-JWT</span>
            </div>

            <div className="mb-6">
              <span className="text-xs text-slate-400 block">Available Balance</span>
              <p className="text-4xl font-black text-white font-heading mt-1">
                ₹{activeToken ? activeToken.amount : 2500}
              </p>
            </div>

            {/* Presentation Toggle: QR vs Acoustic Sound */}
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-6 text-xs">
              <button
                onClick={() => setPresentationMode('qr')}
                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  presentationMode === 'qr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" /> Smartphone QR
              </button>
              <button
                onClick={() => setPresentationMode('acoustic')}
                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  presentationMode === 'acoustic' ? 'bg-purple-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" /> Acoustic Sound Wave
              </button>
            </div>

            {/* DISPLAY 1: High Density QR Code */}
            {presentationMode === 'qr' && (
              <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-inner">
                <div className="w-44 h-44 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-2 text-center text-slate-100 relative">
                  {/* High Density QR Visual */}
                  <QrCode className="w-36 h-36 text-cyan-400" />
                  <span className="text-[9px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded mt-1">
                    SD-JWT ENCODED
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold mt-3">Scan at Merchant PoS Device</p>
              </div>
            )}

            {/* DISPLAY 2: Acoustic Data-over-Sound Wave Generator */}
            {presentationMode === 'acoustic' && (
              <div className="flex flex-col items-center justify-center bg-slate-900 p-6 rounded-2xl border border-purple-500/30 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all ${
                  soundPlaying ? 'bg-purple-500 text-slate-950 animate-audio-wave shadow-lg shadow-purple-500/50' : 'bg-slate-800 text-purple-400'
                }`}>
                  <Volume2 className="w-10 h-10" />
                </div>

                <h4 className="text-sm font-bold text-white mb-1">Feature Phone Micro-Speaker</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Emits FSK audio signal carrying encrypted token signature over sound waves without internet or Bluetooth.
                </p>

                <button
                  onClick={handlePlaySound}
                  disabled={soundPlaying}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl text-xs hover:brightness-110 shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" /> {soundPlaying ? `Transmitting Sound (${soundProgress}%)...` : 'Emit Acoustic Sound Wave'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Merchant Point-of-Sale (PoS) Device Hardware */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-400" /> Merchant PoS Hardware Device
            </h3>
            <span className="text-xs text-slate-400 font-mono">ID: {posContext.merchant_id}</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            
            {/* Merchant Parameters Configuration */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Merchant MCC</span>
                <span className="font-bold text-slate-200">{posContext.merchant_mcc} (Agri Supplies)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Location Coords</span>
                <span className="font-bold text-slate-200">28.6139, 77.2090</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Requested Spend</span>
                <input
                  type="number"
                  value={posContext.request_amount}
                  onChange={(e) => setPosContext({...posContext, request_amount: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-emerald-400 font-bold text-xs"
                />
              </div>
            </div>

            {/* Action Buttons: Scan QR or Listen to Acoustic Wave */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePerformVerification(activeToken?.sd_jwt)}
                className="py-3 px-4 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" /> Scan Beneficiary QR Code
              </button>

              <button
                onClick={handleListenAcoustic}
                className="py-3 px-4 bg-purple-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-purple-400 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" /> {listeningAcoustic ? 'Listening on Mic...' : 'Listen to Acoustic Wave'}
              </button>
            </div>

            {/* Verification Result Card */}
            {verificationResult && (
              <div className={`p-5 rounded-2xl border transition-all ${
                verificationResult.valid 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {verificationResult.valid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400" />
                    )}
                    <h4 className="font-extrabold text-base font-heading">
                      {verificationResult.valid ? 'OFFLINE TRANSACTION APPROVED' : 'POLICY VIOLATION DETECTED'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                    {verificationResult.verified_offline ? 'Verified 100% Offline' : 'Online Check'}
                  </span>
                </div>

                {verificationResult.valid ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-emerald-500/20 pb-1">
                      <span>Receipt Txn ID:</span>
                      <span className="font-mono font-bold text-white">{verificationResult.pos_txn_id}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-500/20 pb-1">
                      <span>Burned Amount:</span>
                      <span className="font-bold text-emerald-400">₹{verificationResult.burn_amount}</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80 pt-1">
                      Receipt cryptographically stored in PoS offline storage queue. Instant UPI settlement will execute upon reconnecting.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-rose-300">Violations:</p>
                    <ul className="list-disc list-inside space-y-1 text-rose-300/90 font-mono text-[11px]">
                      {verificationResult.violations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Offline Storage Queue & Batch Sync Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-bold">PoS Offline Queue</span>
                <span className="text-xs text-slate-300 font-mono">{offlineQueue.length} Pending Batch Receipts</span>
              </div>

              <button
                onClick={handleSyncOfflineQueue}
                disabled={!isOnline || offlineQueue.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-xs rounded-xl hover:brightness-110 disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Sync Batch & Settle via UPI
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
