#!/usr/bin/env python3
"""Runner script for FasalSakshi ML Microservice."""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting FasalSakshi ML Service on http://{host}:{port}...")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
