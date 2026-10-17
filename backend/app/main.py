import importlib
import logging
import os
import pathlib
import pkgutil
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env if present
load_dotenv()

from app.db import init_db
from app.seed import seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fasalsakshi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: apply schema and seed if needed
    try:
        init_db()
        seed()
        logger.info("[Startup] Database initialized and seeded successfully.")
    except Exception as e:
        logger.error(f"[Startup] Error during database init/seed: {e}")
    yield


app = FastAPI(
    title="FasalSakshi Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# Auto-discover routers in app/routers/
routers_package_path = pathlib.Path(__file__).parent / "routers"
if routers_package_path.exists():
    for _, module_name, _ in pkgutil.iter_modules([str(routers_package_path)]):
        try:
            module = importlib.import_module(f"app.routers.{module_name}")
            if hasattr(module, "router"):
                app.include_router(module.router)
                logger.info(f"[Router] Auto-included router: app.routers.{module_name}")
        except Exception as e:
            logger.warning(f"[Router] Failed to load router app.routers.{module_name}: {e}")
