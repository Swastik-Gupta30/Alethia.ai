import os
import sys
# Add project root and ML directory to PYTHONPATH for module imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ml_path = os.path.join(project_root, 'ML')
if ml_path not in sys.path:
    sys.path.append(ml_path)

import json
import pandas as pd
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.models.pipeline import FinancialIntelligencePipeline
from src.data.datamodule import MarketDataset

app = FastAPI()

# Load environment variables or defaults
CHECKPOINT_PATH = os.getenv(
    "CHECKPOINT_PATH",
    r"d:\\Turings-Playground\\turing_pg_project\\ML\\mlruns\\899924492415485795\\e6aeda8bd5024a9f9680486234b225c2\\checkpoints\\epoch=2-step=96.ckpt",
)
CSV_PATH = os.getenv(
    "CSV_PATH",
    r"d:\\Turings-Playground\\turing_pg_project\\ML\\market_data.csv",
)
JSON_PATH = os.getenv(
    "JSON_PATH",
    r"d:\\Turings-Playground\\turing_pg_project\\ML\\narratives.json",
)
WINDOW_SIZE = int(os.getenv("WINDOW_SIZE", "5"))

# Load model once at startup
if not os.path.isfile(CHECKPOINT_PATH):
    raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT_PATH}")
model = FinancialIntelligencePipeline.load_from_checkpoint(CHECKPOINT_PATH)
model.eval()

# Helper functions (same as inference.py)
def prepare_sample(ticker: str):
    df = pd.read_csv(CSV_PATH)
    with open(JSON_PATH, "r") as f:
        narratives = json.load(f)
    ticker_df = df[df["ticker"] == ticker]
    if ticker_df.empty:
        raise ValueError(f"Ticker '{ticker}' not found in market data.")
    dataset = MarketDataset(ticker_df.reset_index(drop=True), narratives, window_size=WINDOW_SIZE)
    sample = dataset[len(dataset) - 1]
    # Add batch dimensions expected by the model
    sample["temporal"] = sample["temporal"].unsqueeze(0)
    sample["tabular"] = sample["tabular"].unsqueeze(0)
    sample["text_input_ids"] = sample["text_input_ids"].unsqueeze(0)
    sample["text_attn_mask"] = sample["text_attn_mask"].unsqueeze(0)
    return sample

class PredictionResponse(BaseModel):
    prediction: list
    reliability_score: float
    history: list = []
    regime_id: int = 0
    is_consistent: bool = True
    narrative_summary: str = ""

@app.get("/predict/{ticker}", response_model=PredictionResponse)
async def predict(ticker: str):
    try:
        sample = prepare_sample(ticker)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    with torch.no_grad():
        out = model(sample)
    pred = out["prediction"].cpu().numpy().tolist()
    reliability = float(out["reliability_score"].cpu().numpy())
    # Dummy placeholders for fields used by frontend
    history = []  # Could be filled with recent price data if needed
    regime_id = int(out.get("regime_id", 0)) if isinstance(out.get("regime_id"), (int, float)) else 0
    is_consistent = bool(out.get("is_consistent", True))
    narrative_summary = out.get("narrative_summary", "")
    return PredictionResponse(
        prediction=pred,
        reliability_score=reliability,
        history=history,
        regime_id=regime_id,
        is_consistent=is_consistent,
        narrative_summary=narrative_summary,
    )
