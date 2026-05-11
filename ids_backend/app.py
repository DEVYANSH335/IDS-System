from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import json
import os
import threading
from utils.flow_extractor import attack_sources

from utils.preprocess import preprocess_input
from utils.flow_extractor import start_sniffer, traffic_stats, alerts, traffic_distribution, traffic_analysis, add_demo_attack

print("🔥 RUNNING FINAL app.py 🔥")

# -------------------

# FastAPI app

# -------------------

app = FastAPI(
title="AI Intrusion Detection System",
version="1.0.0"
)

# -------------------

# CORS configuration

# -------------------

ALLOW_ALL = os.environ.get("ALLOW_ALL_ORIGINS", "true").lower() in ("1", "true", "yes")

if ALLOW_ALL:
 cors_origins = ["*"]
else:
 cors_origins = [
"http://localhost:8080",
"http://127.0.0.1:8080",
]

print(f"🔐 CORS allow_origins set to: {cors_origins}")

app.add_middleware(
CORSMiddleware,
allow_origins=cors_origins,
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)

# -------------------

# Load model

# -------------------

MODEL_PATH = "model/rf_ids_model.pkl"
SCALER_PATH = "model/scaler.pkl"
FEATURES_PATH = "model/selected_features.json"

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    with open(FEATURES_PATH, "r") as f:
        selected_features = json.load(f)

    print("✅ Model, scaler, and features loaded")

except Exception as e:
    print("❌ Failed to load model:", e)
    raise e

# -------------------

# Start network sniffer

# -------------------

threading.Thread(
target=start_sniffer,
args=(model, scaler, selected_features),
daemon=True
).start()

print("📡 Network packet capture started")
print("📡 Live network monitoring started")

# -------------------

# Input schema

# -------------------

class TrafficData(BaseModel):
 data: dict

# -------------------

# Routes

# -------------------

@app.get("/")
def root():
 return {"message": "IDS Backend Running"}

@app.get("/traffic")
def get_traffic():
 return traffic_stats

@app.get("/traffic-distribution")
def get_traffic_distribution():
 return traffic_distribution

@app.get("/traffic-analysis")
def get_traffic_analysis():
 return traffic_analysis

@app.get("/alerts")
def get_alerts():
 return alerts

@app.post("/demo-attack")
def demo_attack():
 return add_demo_attack()

@app.get("/top-attackers")
def get_top_attackers():

    sorted_attackers = sorted(
        attack_sources.items(),
        key=lambda x: x[1],
        reverse=True
    )

    top = sorted_attackers[:5]

    return [
        {
            "ip": ip,
            "count": count
        }
        for ip, count in top
    ]

@app.post("/predict")
async def predict(request: Request):
    try:
        body = await request.json()

        if isinstance(body, dict) and "data" in body:
            data_obj = body["data"]
        else:
            data_obj = body

        processed_data = preprocess_input(
            data_obj,
            scaler,
            selected_features
        )

        prediction = model.predict(processed_data)[0]

        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(processed_data)[0].tolist()
        else:
            probability = []

        return {
            "prediction": "Intrusion Detected" if prediction == 1 else "Normal Traffic",
            "probability": probability
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
