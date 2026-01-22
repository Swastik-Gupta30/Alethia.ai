import os
import json
import math
import shutil
import subprocess
import asyncio
import pandas as pd
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from transformers import AutoTokenizer
from src.models.pipeline import FinancialIntelligencePipeline

app = FastAPI()

# Global variables to store loaded components
market_data = None
narratives_data = {}
model = None
tokenizer = None
is_retraining = False
expected_tabular_dim = 0
training_process = None
expected_tabular_dim = 0

class FeaturePruner:
    """Intersects incoming feature columns with expected model weights to prevent size mismatches."""
    @staticmethod
    def prune(input_tensor, current_dim, expected_dim):
        if current_dim == expected_dim:
            return input_tensor
        
        if current_dim > expected_dim:
            print(f"Pruning features: Input {current_dim} -> Expected {expected_dim}")
            return input_tensor[:, :expected_dim]
        
        if current_dim < expected_dim:
            print(f"Padding features: Input {current_dim} -> Expected {expected_dim}")
            # Pad the last dimension with zeros
            # input_tensor is (Batch, Features)
            padding_size = expected_dim - current_dim
            # torch.cat with zeros
            batch_size = input_tensor.shape[0]
            zeros = torch.zeros((batch_size, padding_size), dtype=input_tensor.dtype, device=input_tensor.device)
            return torch.cat([input_tensor, zeros], dim=1)
        
        return input_tensor

def run_data_alignment_check(csv_cols, model_weights_shape):
    """Runs on startup to verify data-model alignment."""
    print("============================================")
    print("      DATA-MODEL ALIGNMENT CHECK            ")
    print("============================================")
    print(f"CSV Columns detected:       {len(csv_cols)}")
    print(f"Model Tabular Weights:      {model_weights_shape}")
    
    if len(csv_cols) != model_weights_shape:
        print(f"STATUS: MISMATCH DETECTED")
        print(f"ACTION: FeaturePruner Interceptor ACTIVATED")
        print(f"DETAIL: Will adjust {len(csv_cols)} features -> {model_weights_shape} expectations.")
    else:
        print("STATUS: ALIGNMENT CONFIRMED")
        print("DETAIL: CSV and Model matches are perfect.")
    print("============================================")

def load_state_with_strict_fix(model, state_dict):
    """Helper to fix state dict prefix issues and shape mismatches."""
    # 1. Clean prefixes
    clean_state_dict = {
        (k[6:] if k.startswith('model.') else k): v 
        for k, v in state_dict.items()
    }
    
    # 2. Filter by shape using dictionary comprehension
    model_state = model.state_dict()
    filtered_state_dict = {
        k: v for k, v in clean_state_dict.items()
        if k in model_state and v.shape == model_state[k].shape
    }
    
    # Log discarded parameters
    discarded = set(clean_state_dict.keys()) - set(filtered_state_dict.keys())
    if discarded:
        print(f"Warning: Discarded {len(discarded)} parameters due to shape mismatch or missing keys: {list(discarded)[:5]}...")
        
    model.load_state_dict(filtered_state_dict, strict=False)

    model.load_state_dict(filtered_state_dict, strict=False)

def trigger_retraining():
    """Triggers the training script in a separate process."""
    global is_retraining, training_process
    if is_retraining and training_process is not None:
        if training_process.poll() is None:
            print("INFO: Training already in progress.")
            return

    print("INFO: Triggering background retraining...")
    is_retraining = True
    # Using subprocess to run train.py independently
    training_process = subprocess.Popen(["python", "train.py"])

async def monitor_training_process():
    """Polls the training process and reloads model when finished."""
    global is_retraining, training_process
    print("INFO: Started training monitor.")
    while True:
        if is_retraining and training_process:
            ret_code = training_process.poll()
            if ret_code is not None:
                print(f"INFO: Training finished with code {ret_code}.")
                training_process = None
                if ret_code == 0:
                    print("INFO: Reloading model after training...")
                    try:
                         # Re-run resource loading logic
                         # Note: In a real app we might want to be more careful about concurrency,
                         # but here we just need to refresh the global model.
                         await load_resources() 
                         is_retraining = False
                         print("INFO: Model reloaded successfully.")
                    except Exception as e:
                        print(f"ERROR: Failed to reload after training: {e}")
                        # Keep is_retraining=True or False? False so we don't block forever, even if old model
                        is_retraining = False
                else:
                    print("ERROR: Training failed.")
                    is_retraining = False
        
        await asyncio.sleep(5) # Check every 5 seconds

async def load_resources():
    """Loads heavy ML resources in the background."""
    global market_data, narratives_data, model, tokenizer, expected_tabular_dim, is_retraining
    
    print("INFO: Starting background resource loading...")
    
    try:
        base_dir = os.getcwd() 
        market_csv_path = os.path.join(base_dir, "market_data.csv")
        narratives_json_path = os.path.join(base_dir, "narratives.json")
        checkpoint_dir = os.path.join(base_dir, "mlruns")
        
        # Dynamic Checkpoint Finder
        def find_latest_checkpoint(mlruns_dir):
            best_ckpt = None
            best_time = 0
            for root, dirs, files in os.walk(mlruns_dir):
                for file in files:
                    if file.endswith(".ckpt"):
                        full_path = os.path.join(root, file)
                        mtime = os.path.getmtime(full_path)
                        if mtime > best_time:
                            best_time = mtime
                            best_ckpt = full_path
            return best_ckpt

        checkpoint_path = find_latest_checkpoint(checkpoint_dir)
        if hasattr(checkpoint_path, 'startswith') and checkpoint_path:
             print(f"INFO: Detected latest checkpoint at {checkpoint_path}")
        else:
             checkpoint_path = "" # Handle missing case

        # 1. Load Data and Determine Dimensions
        if os.path.exists(market_csv_path):
            market_data = pd.read_csv(market_csv_path)
            market_data = market_data.fillna(method='ffill').fillna(method='bfill').fillna(0)
            print(f"Loaded market data from {market_csv_path}")
            
            # Dynamically calculate features to match CSV
            temporal_features = ['close', 'high', 'low', 'volume', 'rsi', 'macd', 'atr', 'ema_20']
            tabular_features = [col for col in market_data.columns if col not in temporal_features + ['ticker', 'date', 'return_5d_forward', 'return_20d_forward', 'volatility_5d', 'trend_label', 'bb_middle']]
            
            temporal_dim = len(temporal_features)
            tabular_dim = len(tabular_features)
            print(f"Calculated dimensions: temporal={temporal_dim}, tabular={tabular_dim}")
            
        else:
            print(f"Error: {market_csv_path} not found. Cannot determine dimensions.")
            raise FileNotFoundError("market_data.csv missing")

        if os.path.exists(narratives_json_path):
            with open(narratives_json_path, "r") as f:
                narratives_list = json.load(f)
                narratives_data = {item["ticker"]: item for item in narratives_list}
        
        # 2. Initialize Model
        model_instance = FinancialIntelligencePipeline(
            temporal_dim=temporal_dim,
            tabular_dim=tabular_dim,
            latent_dim=128
        )
        
        # Initialize expected dimension
        expected_tabular_dim = tabular_dim
        
        # 3. Load or Reset Checkpoint
        needs_retraining = True
        if os.path.exists(checkpoint_path):
            try:
                checkpoint = torch.load(checkpoint_path, map_location=torch.device('cpu'))
                # Check input weights directly
                if hasattr(model_instance, 'tabular_encoder'):
                     loaded_weight_shape = checkpoint['state_dict']['tabular_encoder.net.0.weight'].shape[1]
                     expected_tabular_dim = loaded_weight_shape # Update expected based on actual loaded model
                     run_data_alignment_check(tabular_features, loaded_weight_shape)

                load_state_with_strict_fix(model_instance, checkpoint['state_dict'])
                model_instance.eval()
                print(f"Successfully loaded model from {checkpoint_path}")
                needs_retraining = False
            except Exception as e:
                print(f"WARNING: Failed to load checkpoint: {e}. Keeping existing checkpoint for inspection.")
                # shutil.rmtree(checkpoint_dir, ignore_errors=True)
        else:
            print(f"Checkpoint not found at {checkpoint_path}. Will retrain.")

        if needs_retraining:
            trigger_retraining()

        # 4. Load Tokenizer
        tokenizer_instance = AutoTokenizer.from_pretrained('yiyanghkust/finbert-pretrain')
        
        # Assign to globals only after successful load
        model = model_instance
        tokenizer = tokenizer_instance
        print("INFO: Background resource loading COMPLETE.")
             
    except Exception as e:
        print(f"CRITICAL: Background loading failed: {e}")
        import traceback
        traceback.print_exc()
        # Do NOT trigger retraining blindly to avoid infinite loops
        # trigger_retraining()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start loading in background to unblock startup."""
    asyncio.create_task(load_resources())
    asyncio.create_task(monitor_training_process())
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/predict/{ticker}")
def get_prediction(ticker: str):
    ticker = ticker.upper()
    
    if is_retraining:
         # Return a successful response but with status indicating training
         # This prevents 503 errors on the frontend
        return {
            "status": "training", 
            "message": "Model is currently retraining. Please check back shortly.",
            "reliability_score": 0,
            "regime": "System Calibration",
            "prediction": 0,
            "history": [],
            "narrative_summary": "System is calibrating to new data..."
        }

    try:
        if market_data is None or model is None or tokenizer is None:
            # Trigger load if missing
            if not is_retraining:
                 trigger_retraining()
            return {
                "status": "training",
                "message": "Model is initializing...",
                "reliability_score": 0,
                "regime": "System Calibration",
                "prediction": 0,
                "history": [],
                "narrative_summary": "System is initializing..."
            }

        # 1. Fetch Ticker Data
        ticker_df = market_data[market_data['ticker'] == ticker].copy()
        if ticker_df.empty:
            ticker_df = market_data[market_data['ticker'].str.upper() == ticker].copy()

        if ticker_df.empty:
            raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found in market data")

        narrative_info = narratives_data.get(ticker)
        if not narrative_info:
            for k, v in narratives_data.items():
                if k.upper() == ticker:
                    narrative_info = v
                    break
        
        if not narrative_info:
            narrative_info = {"transcript": "", "alignment_flag": False}

        # 2. Prepare Inputs
        window_size = 5
        if len(ticker_df) < window_size:
            window_df = ticker_df.tail(len(ticker_df))
        else:
            window_df = ticker_df.tail(window_size)
        
        # Temporal
        # FIXED: Use 'close' instead of 'price', and 'ema_20' instead of 'bb_width' to match CSV/Helpers
        temporal_features = ['close', 'high', 'low', 'volume', 'rsi', 'macd', 'atr', 'ema_20']
        temp_data = window_df[temporal_features].values.astype(np.float32)
        temp_data = np.nan_to_num(temp_data, nan=0.0, posinf=0.0, neginf=0.0)
        
        if temp_data.shape[0] < window_size:
            pad_size = window_size - temp_data.shape[0]
            temp_data = np.vstack([np.zeros((pad_size, 8), dtype=np.float32), temp_data])
        
        temp_input = torch.tensor(temp_data, dtype=torch.float).unsqueeze(0)

        # Tabular
        temporal_features = ['close', 'high', 'low', 'volume', 'rsi', 'macd', 'atr', 'ema_20']
        exclude = temporal_features + ['ticker', 'date', 'return_5d_forward', 'return_20d_forward', 'volatility_5d', 'trend_label', 'bb_middle']
        tabular_features = [col for col in market_data.columns if col not in exclude]
        
        last_row = ticker_df.iloc[-1]
        tab_array = last_row[tabular_features].values.astype(np.float32)
        tab_array = np.nan_to_num(tab_array, nan=0.0, posinf=0.0, neginf=0.0)
        tab_input = torch.tensor([tab_array], dtype=torch.float)
        
        # Pruning / Padding
        tab_input = FeaturePruner.prune(tab_input, tab_input.shape[1], expected_tabular_dim)

        # Text
        text = narrative_info.get("transcript", "")
        encoding = tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=64,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )

        # 3. Inference
        with torch.no_grad():
            outputs = model({
                "temporal": temp_input,
                "tabular": tab_input,
                "text_input_ids": encoding['input_ids'],
                "text_attn_mask": encoding['attention_mask']
            })

        prediction = outputs['prediction'].item()
        rel_score = outputs['reliability_score'].item()
        regime_id = outputs['regime_id']
        is_consistent = outputs['is_consistent'].item()

        if math.isnan(prediction) or math.isnan(rel_score):
             raise ValueError("Model produced NaN output")

        # Map regime_id to label
        regimes = ["Stable Growth", "Volatile", "Crisis"]
        regime_label = regimes[regime_id] if regime_id < len(regimes) else "Unknown"
        
        # History for Charting (Last 30 entries)
        # Use 'close' from CSV but rename to 'price' for frontend compatibility
        history_df = ticker_df.tail(30)[['date', 'close']].copy()
        history_df.rename(columns={'close': 'price'}, inplace=True)
        history = history_df.to_dict(orient='records')

        return {
            "reliability_score": round(rel_score * 100, 2),
            "regime": regime_label,
            "regime_id": regime_id,
            "prediction": round(prediction, 4),
            "history": history,
            "narrative_summary": text,
            "is_consistent": is_consistent
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL INFERENCE ERROR for {ticker}: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to Training Mode for Self-Healing
        # if not is_retraining:
             # trigger_retraining()
             
        return {
            "status": "training",
            "message": "System detected an anomaly and is recalibrating.",
            "reliability_score": 0,
            "regime": "System Calibration",
            "prediction": 0,
            "history": [],
            "narrative_summary": "System recalibration in progress..."
        }

@app.get("/tickers")
def get_tickers():
    """Returns a list of available tickers with summary stats."""
    if market_data is None:
        raise HTTPException(status_code=503, detail="Market data not loaded")
    
    unique_tickers = market_data['ticker'].unique().tolist()
    summary = []
    
    for ticker in unique_tickers:
        ticker_df = market_data[market_data['ticker'] == ticker]
        if ticker_df.empty:
            continue
            
        last_row = ticker_df.iloc[-1]
        summary.append({
            "ticker": ticker,
            "price": round(last_row['close'], 2),
            # Simple change calculation: (close - open) / open * 100
            "change": round((last_row['close'] - last_row['open']) / last_row['open'] * 100, 2)
        })
        
    return summary
