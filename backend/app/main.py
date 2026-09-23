"""
Tokify FastAPI Main Application
Hybrid DPI Orchestration Layer for Selective Disclosure JSON Web Tokens (SD-JWTs)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import schemes, tokens, settlement

app = FastAPI(
    title="Tokify - Hybrid DPI Orchestration Layer",
    description="Programmable welfare subsidy disbursement using SD-JWTs (RFC 9524), CEL policy engine, and offline PoS verification.",
    version="1.0.0"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(schemes.router)
app.include_router(tokens.router)
app.include_router(settlement.router)


@app.get("/")
def root():
    return {
        "service": "Tokify Hybrid DPI Orchestration Engine",
        "version": "1.0.0",
        "rfc_spec": "RFC 9524 Selective Disclosure for JWTs",
        "status": "ONLINE",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "bloom_filter": "ready", "cel_engine": "ready"}
