#!/usr/bin/env python3
"""
FloodGuard — XGBoost Model Training & Serialization Script
Trains dual-horizon regressors for 30-minute and 60-minute road water depth forecasting.
Evaluates R2, MAE, RMSE metrics and serializes model artifacts to backend/app/ml/artifacts/.
"""

import os
import json
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.metrics import r2_score, mean_absolute_error, root_mean_squared_error
import joblib

FEATURE_COLUMNS = [
    "rainfall_1h_mm",
    "rainfall_3h_mm",
    "current_water_level_cm",
    "water_rise_rate_cm_per_min",
    "elevation_m",
    "drainage_capacity_index",
    "soil_saturation_pct",
    "historical_flood_index"
]

def train_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    artifacts_dir = os.path.join(base_dir, "app", "ml", "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    train_file = os.path.join(data_dir, "train_split.csv")
    test_file = os.path.join(data_dir, "test_split.csv")

    if not os.path.exists(train_file) or not os.path.exists(test_file):
        master_file = os.path.join(data_dir, "synthetic_flood_dataset.csv")
        df = pd.read_csv(master_file)
        train_df = df.iloc[:8000]
        test_df = df.iloc[8000:]
    else:
        train_df = pd.read_csv(train_file)
        test_df = pd.read_csv(test_file)

    X_train = train_df[FEATURE_COLUMNS]
    X_test = test_df[FEATURE_COLUMNS]

    y_train_30 = train_df["water_level_30m_cm"]
    y_test_30 = test_df["water_level_30m_cm"]

    y_train_60 = train_df["water_level_60m_cm"]
    y_test_60 = test_df["water_level_60m_cm"]

    print("[ML] Training Dual-Horizon XGBoost Hydrological Models...")

    # Model 1: 30-minute horizon
    model_30m = XGBRegressor(
        n_estimators=160,
        learning_rate=0.06,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1
    )
    model_30m.fit(X_train, y_train_30)

    # Model 2: 60-minute horizon
    model_60m = XGBRegressor(
        n_estimators=180,
        learning_rate=0.06,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1
    )
    model_60m.fit(X_train, y_train_60)

    # Evaluate 30m Model
    pred_30 = model_30m.predict(X_test)
    r2_30 = r2_score(y_test_30, pred_30)
    mae_30 = mean_absolute_error(y_test_30, pred_30)
    rmse_30 = root_mean_squared_error(y_test_30, pred_30)

    # Evaluate 60m Model
    pred_60 = model_60m.predict(X_test)
    r2_60 = r2_score(y_test_60, pred_60)
    mae_60 = mean_absolute_error(y_test_60, pred_60)
    rmse_60 = root_mean_squared_error(y_test_60, pred_60)

    # Assertions
    assert r2_30 >= 0.92, f"Model 30m R2 ({r2_30:.3f}) below 0.92 threshold!"
    assert mae_30 <= 4.5, f"Model 30m MAE ({mae_30:.2f} cm) above 4.5 cm threshold!"
    assert r2_60 >= 0.90, f"Model 60m R2 ({r2_60:.3f}) below 0.90 threshold!"
    assert mae_60 <= 6.0, f"Model 60m MAE ({mae_60:.2f} cm) above 6.0 cm threshold!"

    # Save serialized model binaries
    path_30m = os.path.join(artifacts_dir, "model_30m.joblib")
    path_60m = os.path.join(artifacts_dir, "model_60m.joblib")
    joblib.dump(model_30m, path_30m)
    joblib.dump(model_60m, path_60m)

    # Extract & save feature importances for explainability
    importance_30 = dict(zip(FEATURE_COLUMNS, [round(float(v), 4) for v in model_30m.feature_importances_]))
    importance_60 = dict(zip(FEATURE_COLUMNS, [round(float(v), 4) for v in model_60m.feature_importances_]))

    meta = {
        "features": FEATURE_COLUMNS,
        "metrics_30m": {"r2": round(r2_30, 3), "mae": round(mae_30, 2), "rmse": round(rmse_30, 2)},
        "metrics_60m": {"r2": round(r2_60, 3), "mae": round(mae_60, 2), "rmse": round(rmse_60, 2)},
        "feature_importances_30m": importance_30,
        "feature_importances_60m": importance_60
    }

    meta_path = os.path.join(artifacts_dir, "model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print("[ML] Training complete!")
    print(f"[ML] 30m Model: R2 = {r2_30:.3f}, MAE = {mae_30:.2f} cm, RMSE = {rmse_30:.2f} cm")
    print(f"[ML] 60m Model: R2 = {r2_60:.3f}, MAE = {mae_60:.2f} cm, RMSE = {rmse_60:.2f} cm")
    print("[ML] Saved model artifacts to app/ml/artifacts/")


if __name__ == "__main__":
    train_models()
