#!/usr/bin/env python3
"""
FloodGuard — Synthetic Hydrological Dataset Generator
Generates physically grounded urban rainfall-runoff records modeling
elevation, catchment soil saturation, drainage capacity, and dual-horizon
(30m and 60m) flood depth targets for training XGBoost models.
"""

import os
import numpy as np
import pandas as pd

# Set deterministic seed for reproducibility
np.random.seed(42)

def generate_flood_dataset(n_samples: int = 10000) -> pd.DataFrame:
    print(f"[DATA] Generating {n_samples:,} synthetic hydrological observations...")

    # Urban Zone Profiles (Elevation in meters, Drainage efficiency 0.0 - 1.0)
    zone_profiles = [
        {"zone_id": "ZONE_B", "elevation_m": 6.2,  "drainage_capacity": 0.35, "flood_hist": 0.90, "weight": 0.22},
        {"zone_id": "ZONE_C", "elevation_m": 7.1,  "drainage_capacity": 0.40, "flood_hist": 0.75, "weight": 0.20},
        {"zone_id": "ZONE_F", "elevation_m": 8.4,  "drainage_capacity": 0.50, "flood_hist": 0.65, "weight": 0.18},
        {"zone_id": "ZONE_D", "elevation_m": 12.5, "drainage_capacity": 0.70, "flood_hist": 0.40, "weight": 0.16},
        {"zone_id": "ZONE_E", "elevation_m": 16.8, "drainage_capacity": 0.85, "flood_hist": 0.20, "weight": 0.14},
        {"zone_id": "ZONE_A", "elevation_m": 19.2, "drainage_capacity": 0.95, "flood_hist": 0.10, "weight": 0.10},
    ]

    # Sample zone assignments based on weights
    weights = [z["weight"] for z in zone_profiles]
    selected_indices = np.random.choice(len(zone_profiles), size=n_samples, p=weights)
    
    zone_ids = [zone_profiles[i]["zone_id"] for i in selected_indices]
    elevations = np.array([zone_profiles[i]["elevation_m"] for i in selected_indices])
    drainages = np.array([zone_profiles[i]["drainage_capacity"] for i in selected_indices])
    hist_indices = np.array([zone_profiles[i]["flood_hist"] for i in selected_indices])

    # Weather Regimes: 40% Normal/Dry, 30% Moderate, 20% Heavy, 10% Cloudburst
    regime_choices = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.40, 0.30, 0.20, 0.10])
    rainfall_1h = np.zeros(n_samples)

    # Sample rainfall 1h based on regime
    rainfall_1h[regime_choices == 0] = np.random.uniform(0.0, 18.0, size=np.sum(regime_choices == 0))
    rainfall_1h[regime_choices == 1] = np.random.uniform(18.0, 55.0, size=np.sum(regime_choices == 1))
    rainfall_1h[regime_choices == 2] = np.random.uniform(55.0, 105.0, size=np.sum(regime_choices == 2))
    rainfall_1h[regime_choices == 3] = np.random.uniform(105.0, 165.0, size=np.sum(regime_choices == 3))

    # 3-Hour cumulative rainfall (correlated with 1h rainfall + preceding storm history)
    antecedent_factor = np.random.uniform(1.4, 2.6, size=n_samples)
    rainfall_3h = np.clip(rainfall_1h * antecedent_factor + np.random.normal(0, 4.0, size=n_samples), 0.0, 350.0)

    # Soil Saturation Percentage (0% to 100%) - increases with 3h precipitation
    soil_saturation = np.clip(
        20.0 + (rainfall_3h * 0.35) + np.random.normal(0, 6.0, size=n_samples),
        10.0,
        99.5
    )

    # Catchment Runoff Gravity Factor (lower elevations pool more water)
    slope_gradient = np.clip((20.0 - elevations) / 10.0, 0.3, 1.8)

    # Net Water Rise Rate (cm/min) physics equation:
    # Inflow proportional to rainfall, catchment slope, soil saturation
    inflow = (rainfall_1h / 60.0) * slope_gradient * (1.0 + (soil_saturation / 100.0) * 0.8) * 3.5
    # Outflow proportional to drainage capacity and base discharge
    outflow = drainages * 1.6
    water_rise_rate = inflow - outflow + np.random.normal(0, 0.15, size=n_samples)
    water_rise_rate = np.round(np.clip(water_rise_rate, -1.5, 7.5), 2)

    # Current Water Level (cm): function of preceding rainfall, rise rate, and elevation depression
    base_depth = (rainfall_3h * 0.28) * slope_gradient * (1.2 - drainages * 0.6)
    current_water_level = base_depth + (water_rise_rate * 8.0) + np.random.normal(0, 3.5, size=n_samples)
    current_water_level = np.round(np.clip(current_water_level, 0.0, 160.0), 1)

    # Prediction Targets (Dual Horizons: 30m and 60m into the future)
    # T + 30 min projection: current + (velocity * 30 min) + continued rainfall inflow - drainage
    rain_trend_30m = rainfall_1h * np.random.uniform(0.85, 1.15, size=n_samples)
    accum_30m = (rain_trend_30m / 60.0) * 30.0 * slope_gradient * 0.45 * (1.0 - drainages * 0.4)
    target_30m = current_water_level + (water_rise_rate * 30.0 * 0.72) + accum_30m + np.random.normal(0, 2.5, size=n_samples)
    target_30m = np.round(np.clip(target_30m, 0.0, 210.0), 1)

    # T + 60 min projection: current + cumulative stormwater inflow over 1 hour
    rain_trend_60m = rainfall_1h * np.random.uniform(0.75, 1.25, size=n_samples)
    accum_60m = (rain_trend_60m / 60.0) * 60.0 * slope_gradient * 0.55 * (1.0 - drainages * 0.4)
    target_60m = current_water_level + (water_rise_rate * 60.0 * 0.60) + accum_60m + np.random.normal(0, 4.0, size=n_samples)
    target_60m = np.round(np.clip(target_60m, 0.0, 240.0), 1)

    # Risk Category Label for evaluation
    risk_labels = []
    for d in target_60m:
        if d >= 90.0:
            risk_labels.append("CRITICAL")
        elif d >= 70.0:
            risk_labels.append("HIGH")
        elif d >= 50.0:
            risk_labels.append("MODERATE")
        else:
            risk_labels.append("LOW")

    df = pd.DataFrame({
        "zone_id": zone_ids,
        "rainfall_1h_mm": np.round(rainfall_1h, 1),
        "rainfall_3h_mm": np.round(rainfall_3h, 1),
        "current_water_level_cm": current_water_level,
        "water_rise_rate_cm_per_min": water_rise_rate,
        "elevation_m": np.round(elevations, 1),
        "drainage_capacity_index": np.round(drainages, 2),
        "soil_saturation_pct": np.round(soil_saturation, 1),
        "historical_flood_index": np.round(hist_indices, 2),
        "water_level_30m_cm": target_30m,
        "water_level_60m_cm": target_60m,
        "risk_level_60m": risk_labels
    })

    return df


def main():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    master_path = os.path.join(data_dir, "synthetic_flood_dataset.csv")
    train_path = os.path.join(data_dir, "train_split.csv")
    test_path = os.path.join(data_dir, "test_split.csv")

    df = generate_flood_dataset(10000)

    # Assertions and Quality Verification
    assert df.isnull().sum().sum() == 0, "Null values detected in dataset!"
    corr = df["rainfall_1h_mm"].corr(df["water_rise_rate_cm_per_min"])
    print(f"[DATA] Correlation between rainfall_1h and water_rise_rate: r = {corr:.3f}")
    assert corr > 0.70, f"Expected correlation > 0.70, got {corr:.3f}"

    # Verify target distributions
    print(f"[DATA] Target 30m depth range: {df['water_level_30m_cm'].min()} cm to {df['water_level_30m_cm'].max()} cm (mean: {df['water_level_30m_cm'].mean():.1f} cm)")
    print(f"[DATA] Target 60m depth range: {df['water_level_60m_cm'].min()} cm to {df['water_level_60m_cm'].max()} cm (mean: {df['water_level_60m_cm'].mean():.1f} cm)")
    print(f"[DATA] Risk Category Breakdown:\n{df['risk_level_60m'].value_counts().to_string()}")

    # 80/20 Train-Test Split (8000 / 2000)
    shuffled = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    train_df = shuffled.iloc[:8000]
    test_df = shuffled.iloc[8000:]

    # Save to disk
    df.to_csv(master_path, index=False)
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"[DATA] Generated 10,000 samples. Saved to backend/data/synthetic_flood_dataset.csv. Train/Test split: {len(train_df)}/{len(test_df)}.")


if __name__ == "__main__":
    main()
