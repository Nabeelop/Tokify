"""
Tokify Bloom Filter & Double-Spend Protection Module
Prevents double-spending of SD-JWT tokens across offline presentation batches.
Uses RedisBloom or an in-memory bitarray Bloom filter for sub-millisecond rejection.
"""

import hashlib
from typing import Set, Tuple


class BloomFilterDoubleSpendGuard:
    """
    Sub-millisecond double-spend rejection guard.
    Computes multiple cryptographic hash functions over token JTI + Claim Nonce.
    """
    def __init__(self, size: int = 100000, num_hashes: int = 4):
        self.size = size
        self.num_hashes = num_hashes
        self.bit_array = [0] * size
        self.seen_jtis: Set[str] = set()

    def _hashes(self, item: str) -> List[int]:
        indexes = []
        for i in range(self.num_hashes):
            data = f"{item}:{i}".encode('utf-8')
            h = int(hashlib.md5(data).hexdigest(), 16)
            indexes.append(h % self.size)
        return indexes

    def is_double_spend(self, jti: str, nonce: str = "") -> bool:
        """Checks if a JTI + nonce combination has already been presented/burned."""
        item = f"{jti}:{nonce}" if nonce else jti
        if item in self.seen_jtis:
            return True
            
        indexes = self._hashes(item)
        for idx in indexes:
            if self.bit_array[idx] == 0:
                return False
        return True

    def mark_burned(self, jti: str, nonce: str = "") -> None:
        """Registers a JTI + nonce as burned/spent."""
        item = f"{jti}:{nonce}" if nonce else jti
        self.seen_jtis.add(item)
        indexes = self._hashes(item)
        for idx in indexes:
            self.bit_array[idx] = 1


# Global instance for FastAPI application lifecycle
double_spend_guard = BloomFilterDoubleSpendGuard()
