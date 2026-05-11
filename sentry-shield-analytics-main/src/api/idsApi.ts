const API_BASE = "http://127.0.0.1:8000";

interface PredictionResponse {
prediction: string;
probability: number[];
}

export async function getPrediction(data: Record<string, number>): Promise<PredictionResponse> {
const response = await fetch(`${API_BASE}/predict`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({ data }),
});

if (!response.ok) {
throw new Error("Prediction request failed");
}

return response.json();
}

export async function getTraffic() {
const response = await fetch(`${API_BASE}/traffic`);
return response.json();
}

export async function getTrafficDistribution() {
const response = await fetch(`${API_BASE}/traffic-distribution`);
return response.json();
}

export async function getTrafficAnalysis() {
const response = await fetch(`${API_BASE}/traffic-analysis`);
return response.json();
}

export async function getAlerts() {
const response = await fetch(`${API_BASE}/alerts`);
return response.json();
}

export async function createDemoAttack() {
const response = await fetch(`${API_BASE}/demo-attack`, {
method: "POST",
});
return response.json();
}

export async function getTopAttackers() {
  const response = await fetch(`${API_BASE}/top-attackers`)
  return response.json()
}
