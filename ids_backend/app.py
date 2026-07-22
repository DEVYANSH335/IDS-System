from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import json
import os
import threading
import time
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
        is_intrusion = prediction == 1

        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(processed_data)[0].tolist()
        else:
            probability = []

        confidence = 0
        if probability:
            confidence = round((probability[1] if is_intrusion else probability[0]) * 100)

        timestamp = time.strftime("%H:%M:%S")
        source = str(data_obj.get("Source IP", "Manual API Request"))
        dst_port = data_obj.get("Dst Port", "unknown")
        protocol_map = {
            1: "ICMP",
            6: "TCP",
            17: "UDP",
        }
        protocol = protocol_map.get(data_obj.get("Protocol"), str(data_obj.get("Protocol", "Unknown")))
        flow_duration = round(float(data_obj.get("Flow Duration", 0)) / 1_000_000, 2)
        packet_rate = round(float(data_obj.get("Bwd Packets/s", data_obj.get("Flow Packets/s", 0))), 2)

        traffic_analysis.insert(0, {
            "id": str(time.time_ns()),
            "flowId": f"{source}->{request.client.host if request.client else 'backend'}:{dst_port}",
            "protocol": protocol,
            "packetRate": packet_rate,
            "flowDuration": flow_duration,
            "prediction": "Attack" if is_intrusion else "Normal",
            "confidence": confidence,
            "timestamp": timestamp
        })

        if len(traffic_analysis) > 200:
            traffic_analysis.pop()

        if is_intrusion:
            traffic_distribution["malicious"] += 1

            alerts.append({
                "id": str(time.time_ns()),
                "type": "critical",
                "message": f"Intrusion Detected (confidence: {confidence}%)",
                "source": source,
                "timestamp": timestamp
            })

            attack_sources[source] = attack_sources.get(source, 0) + 1
        else:
            traffic_distribution["normal"] += 1

        return {
            "prediction": "Intrusion Detected" if is_intrusion else "Normal Traffic",
            "probability": probability,
            "confidence": confidence,
            "dashboardUpdated": True,
            "dashboardMessage": (
                "Intrusion was added to dashboard alerts, traffic analysis, and malicious traffic stats"
                if is_intrusion
                else "Prediction was added to traffic analysis and normal traffic stats"
            )
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
