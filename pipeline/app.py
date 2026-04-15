from flask import Flask, jsonify
from flask_cors import CORS
import json
import os
import glob
import math

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# -----------------------------
# Utility: Sanitize NaN → None
# -----------------------------
def sanitize(obj):
    if isinstance(obj, float):
        return None if math.isnan(obj) else obj
    elif isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return obj


# -----------------------------
# Existing Metrics JSON Folder
# -----------------------------
JSON_FOLDER = './'  # or './metrics'

def load_all_metrics():
    all_metrics = {}
    json_files = sorted(
        glob.glob(os.path.join(JSON_FOLDER, '*.json'))
    )

    for idx, file_path in enumerate(json_files, start=1):
        with open(file_path, 'r') as f:
            data = json.load(f)
            all_metrics[f'file_{idx}'] = sanitize(data)

    if not all_metrics:
        all_metrics = {"error": "No JSON files found"}

    return all_metrics


# ------------------------------------
# Model Audit Results JSON Folder
# ------------------------------------
MODEL_AUDIT_FOLDER = './model_audit_results'

def load_model_audit_results():
    audit_results = {}
    json_files = sorted(
        glob.glob(os.path.join(MODEL_AUDIT_FOLDER, '*.json'))
    )

    for idx, file_path in enumerate(json_files, start=1):
        with open(file_path, 'r') as f:
            data = json.load(f)
            audit_results[f'audit_file_{idx}'] = sanitize(data)

    if not audit_results:
        audit_results = {"error": "No model audit JSON files found"}

    return audit_results

RE_AUDIT_FOLDER = './RE_model_audit'

def load_re_audit_results():
    audit_results = {}
    json_files = sorted(
        glob.glob(os.path.join(RE_AUDIT_FOLDER, '*.json'))
    )

    for idx, file_path in enumerate(json_files, start=1):
        with open(file_path, 'r') as f:
            data = json.load(f)
            audit_results[f'audit_file_{idx}'] = sanitize(data)

    if not audit_results:
        audit_results = {"error": "No model audit JSON files found"}

    return audit_results




# -----------------------------
# Load data once at startup
# -----------------------------
metrics_data = load_all_metrics()
model_audit_data = load_model_audit_results()
re_audit_data = load_re_audit_results()

# -----------------------------
# API Endpoints
# -----------------------------
@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Endpoint to get evaluation metrics"""
    return jsonify(metrics_data)


@app.route('/api/model-audit-results', methods=['GET'])
def get_model_audit_results():
    """Endpoint to get model audit results"""
    return jsonify(model_audit_data)

@app.route('/api/re-audit-results', methods=['GET'])
def get_re_audit_results():
    """Endpoint to get model audit results"""
    return jsonify(re_audit_data)


@app.route('/')
def home():
    return jsonify({"message": "FairVGNN Metrics API is running."})


if __name__ == '__main__':
    app.run(debug=True)
