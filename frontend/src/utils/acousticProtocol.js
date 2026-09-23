/**
 * Tokify Acoustic Data-over-Sound Protocol
 * Uses Web Audio API to modulate/demodulate cryptographic signatures into audio tones.
 * Allows feature phones (without NFC, Bluetooth, or Internet) to transmit offline token claims via sound waves.
 */

// Frequency Shift Keying (FSK) frequency parameters
const FREQ_BASE = 1800; // Base frequency in Hz (Audible near-ultrasonic range)
const FREQ_BIT_0 = 1800;
const FREQ_BIT_1 = 2400;
const BIT_DURATION_MS = 60;

export class AcousticProtocol {
  /**
   * Encodes a string payload (e.g. JTI + Compact Signature) into audio frequency pulses.
   */
  static playAcousticToken(payloadStr, onProgress, onComplete) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      alert("Web Audio API is not supported in this browser.");
      return;
    }
    
    const ctx = new AudioCtx();
    const encoder = new TextEncoder();
    const bytes = encoder.encode(payloadStr.substring(0, 32)); // Transmit 32-byte header/signature slice
    
    // Convert bytes to bit array
    const bits = [];
    for (const b of bytes) {
      for (let i = 7; i >= 0; i--) {
        bits.push((b >> i) & 1);
      }
    }
    
    let currentBitIndex = 0;
    const totalBits = bits.length;
    
    function playNextBit() {
      if (currentBitIndex >= totalBits) {
        ctx.close();
        if (onComplete) onComplete();
        return;
      }
      
      const bit = bits[currentBitIndex];
      const freq = bit === 1 ? FREQ_BIT_1 : FREQ_BIT_0;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Envelope to prevent audio click artifacts
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (BIT_DURATION_MS / 1000) - 0.005);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (BIT_DURATION_MS / 1000));
      
      currentBitIndex++;
      if (onProgress) {
        onProgress(Math.round((currentBitIndex / totalBits) * 100));
      }
      
      setTimeout(playNextBit, BIT_DURATION_MS);
    }
    
    playNextBit();
  }

  /**
   * Simulates microphone acoustic listening and demodulation on PoS hardware.
   */
  static listenAcousticToken(onDetected, onStatus) {
    if (onStatus) onStatus("Listening on microphone for Acoustic Sound Wave...");
    
    // Simulate high-reliability acoustic demodulation after 2.5 seconds of listening
    const timer = setTimeout(() => {
      if (onDetected) {
        onDetected({
          protocol: "Acoustic-FSK-1.0",
          detected_frequency_hz: 2400,
          confidence: 0.994,
          payload_header: "ACOUSTIC_SD_JWT_BURST"
        });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }
}
