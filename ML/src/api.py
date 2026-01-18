import os
import json
import pandas as pd
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager

app = FastAPI()

# Global variables to store loaded data
market_data = {}
narratives_data = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load data on startup
    global market_data, narratives_data
    
    try:
        # Paths relative to this file (ml/src/api.py) -> ml/market_data.csv
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        market_csv_path = os.path.join(base_dir, "market_data.csv")
        narratives_json_path = os.path.join(base_dir, "narratives.json")

        if os.path.exists(market_csv_path):
            market_df = pd.read_csv(market_csv_path)
            # Group by ticker to make lookup easier or just keep raw
            # For this task, we might need recent stats. 
            # flexible logic: store user whole DF or indexed
            market_data = market_df
            print(f"Loaded market data from {market_csv_path}")
        else:
            print(f"Warning: {market_csv_path} not found")

        if os.path.exists(narratives_json_path):
            with open(narratives_json_path, "r") as f:
                narratives_list = json.load(f)
                # Convert list to dict keyed by ticker for faster lookup
                narratives_data = {item["ticker"]: item for item in narratives_list}
            print(f"Loaded narratives data from {narratives_json_path}")
        else:
             print(f"Warning: {narratives_json_path} not found")
             
    except Exception as e:
        print(f"Error loading data: {e}")
        
    yield
    # Clean up if needed

app = FastAPI(lifespan=lifespan)

@app.get("/predict/{ticker}")
def get_prediction(ticker: str):
    ticker = ticker.upper()
    
    # 1. Narratives
    narrative_info = narratives_data.get(ticker)
    if not narrative_info:
        # If we don't have this ticker at all, return 404 or a default?
        # Requirement says "Return a JSON object", probably best to 404 if invalid ticker
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found in narratives")

    # 2. Market Data
    # Filter for this ticker
    if isinstance(market_data, pd.DataFrame) and not market_data.empty:
        ticker_df = market_data[market_data['ticker'] == ticker]
    else:
        ticker_df = pd.DataFrame()

    reliability_score = 50.0
    regime = "Unknown"

    if not ticker_df.empty:
        # Mock Logic for Reliability Score:
        # Maybe use label or some volatility metric.
        # User prompt: "calculate a simple mock score based on the volatility or label column"
        
        # specific logic: if label is 1 (growth), score higher?
        # Or inverse to volatility.
        # Let's take the last label
        last_row = ticker_df.iloc[-1]
        
        # Volatility is not directly a column in the csv output in generate_data.py but used to generate price
        # We can re-calculate volatility or just use 'label'
        # 'label': 1 if price > 100 else 0
        
        # Let's simple mock: 
        # Base score 75
        # +10 if debt_ratio low (< 0.5)
        # +10 if recent price positive (label=1)
        
        base_score = 70.0
        if last_row['debt_ratio'] < 0.5:
            base_score += 15.0
        if last_row['label'] == 1:
            base_score += 10.0
            
        reliability_score = min(100.0, max(0.0, base_score))
        
        # Regime
        # If debt_ratio is high -> Volatile?
        if last_row['debt_ratio'] > 0.6:
            regime = "Volatile"
        elif last_row['label'] == 1:
            regime = "Stable Growth"
        else:
            regime = "Stable"
            
    else:
        # Fallback if no market data found but narrative exists
        reliability_score = 50.0
        regime = "No Data"

    return {
        "reliability_score": reliability_score,
        "regime": regime,
        "narrative_summary": narrative_info.get("transcript", ""),
        "is_consistent": narrative_info.get("alignment_flag", False)
    }
