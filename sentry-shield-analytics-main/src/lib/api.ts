const BACKEND_URL = "https://ids-backend-3yac.onrender.com";

export interface PredictResponse {
  prediction: "Intrusion Detected" | "Normal Traffic";
  probability: number[];
}

export async function predictTraffic(
  data: Record<string, number>
): Promise<PredictResponse> {
  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
  } catch {
    throw new Error("Backend server is not reachable");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backend error (${response.status}): ${text}`);
  }

  return response.json();
}