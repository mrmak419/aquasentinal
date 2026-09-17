# Aqua Sentinel - AI & Data Science

This directory is dedicated to the AI/DS team members for developing time-series forecasting models and water quality anomaly detection algorithms.

## Goal
The primary objective is to pull historical telemetry data (Water Level, TDS, Turbidity) from the Supabase PostgreSQL database and build a predictive model that can forecast exactly when the water tank will run dry, as well as flag sudden contamination spikes.

## Recommended Tech Stack
- **Language:** Python
- **Environment:** Jupyter Notebooks (`.ipynb`)
- **Libraries:** 
  - `pandas` and `numpy` for data manipulation.
  - `matplotlib` or `seaborn` for visualizing tank depletion curves.
  - `Prophet` (by Meta), `statsmodels` (ARIMA), or `scikit-learn` for time-series forecasting.
  - `supabase-py` to fetch data directly from the cloud database.
