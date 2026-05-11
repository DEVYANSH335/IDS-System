import pandas as pd
import numpy as np


def preprocess_input(raw_data: dict, scaler, selected_features: list):
    """
    Prepare raw input dict for model prediction.

    Steps:
    - Convert incoming dict to DataFrame (1 row)
    - Align columns exactly to selected_features
    - Fill missing features with 0
    - Coerce all values to numeric
    - Handle NaN / inf safely
    - Apply scaler
    """

    if not isinstance(raw_data, dict):
        raise ValueError("Input data must be a dictionary")

    if not isinstance(selected_features, list):
        raise ValueError("selected_features must be a list")

    try:
        # 1️⃣ Dict → DataFrame (single row)
        df = pd.DataFrame([raw_data])

        # 2️⃣ Replace inf values
        df.replace([np.inf, -np.inf], np.nan, inplace=True)

        # 3️⃣ Align columns exactly to model features
        # Missing features → 0
        # Extra features → dropped
        df = df.reindex(columns=selected_features, fill_value=0)

        # 4️⃣ Force numeric conversion
        df = df.apply(pd.to_numeric, errors="coerce")

        # 5️⃣ Fill NaNs created by coercion
        df.fillna(0, inplace=True)

        # 6️⃣ Ensure correct shape (1, n_features)
        if df.shape[1] != len(selected_features):
            raise ValueError(
                f"Feature count mismatch: expected {len(selected_features)}, got {df.shape[1]}"
            )

        # 7️⃣ Scale features
        scaled_data = scaler.transform(df)

        return scaled_data

    except Exception as e:
        # This message will be returned as HTTP 400 from FastAPI
        raise ValueError(f"Preprocessing failed: {str(e)}") from e
