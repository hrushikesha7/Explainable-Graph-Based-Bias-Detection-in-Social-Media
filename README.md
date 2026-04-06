# Fairness-Aware Graph Learning Benchmark

A benchmark framework for evaluating fairness-aware graph neural network algorithms, with a focus on the **FairVGNN** (Fair Variational Graph Neural Network), **FairGNN** and comparsion with vanilla **GNN** model.

## Overview

This project implements and evaluates graph learning models that aim to achieve both high predictive performance and fairness across different demographic groups. The FairVGNN model uses adversarial training with feature masking to learn fair representations while maintaining classification accuracy.

## Project Structure

```
.
├── train.py                    # Main training script
├── dataloading.py              # Dataset loading utilities
├── algorithms/
│   ├── FairVGNN.py            # FairVGNN algorithm implementation
    ├── FairGNN.py            # FairGNN algorithm implementation
    ├── GNN.py                # GNN algorithm implementation
├── metrics_echo.py            # Pre-Exposure Echo chamber and polarization metrics
├── metrics_opinion.py         # Pre-Exposure Opinion polarization metrics
├── metrics_learned_graph.py   # Pre-Exposure Learned graph construction utilities
└── dataset/                    # Dataset files
```

## Installation

### Prerequisites

- Python 3.7 or higher
- CUDA-capable GPU (recommended for faster training)
- pip package manager

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Fairness-Aware-Graph-Learning-Benchmark-main
```

### Step 2: Install Dependencies

Install the required Python packages:

```bash
pip install torch torchvision torchaudio
pip install torch-geometric
pip install torch-scatter torch-sparse -f https://data.pyg.org/whl/torch-<TORCH_VERSION>.html
pip install numpy pandas scipy scikit-learn matplotlib tqdm networkx
```

**Note**: Replace `<TORCH_VERSION>` with your PyTorch version (e.g., `2.0.0`). For CUDA versions, use:
```bash
pip install torch-scatter torch-sparse -f https://data.pyg.org/whl/torch-<TORCH_VERSION>+<CUDA_VERSION>.html
```

**Alternative**: If you have a `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### Step 3: Prepare Datasets

Ensure your dataset files are placed in the `dataset/` directory. For example:
- `dataset/pokec/` - Pokec dataset files

The `dataloading.py` script will automatically load datasets from the appropriate directories.

### Step 4: Verify Installation

Test that all imports work correctly:

```bash
python -c "from algorithms.FairVGNN import FairVGNN; print('Installation successful!')"
```

## Quick Start

### Step 1: Configure Dataset

* Important Step: Before running, edit `train.py` to set your desired model and dataset:

```python
dataset = 'pokec_n'      # Options: 'pokec_n', 'pokec_z'
model = 'FairVGNN'             # Options: 'GNN', 'FairGNN', 'FairVGNN'
```

### Step 2: Run Training

#### Basic Usage

```bash
python train.py
```

This will use default parameters (param1=0.0, param2=0.0).

#### With Optimal Parameters

If you have a `param.json` file with optimal parameters:

```bash
python train.py --use_optimal
```

#### With Custom Parameters

```bash
python train.py --param1 <top_k> --param2 <alpha>
```

Where:
- `top_k`: Number of top correlated features to mask (default: 0.0)
- `alpha`: Fairness-accuracy tradeoff parameter (default: 0.0)

**Example:**
```bash
python train.py --param1 10 --param2 1.0
```

### Step 3: View Results

After training completes, you'll see:
- Performance metrics (accuracy, AUC-ROC, F1)
- Fairness metrics (parity, equality)
- Echo chamber metrics (On RAW and Learned GRAPH)
- Polarization metrics (On Model Predictions/ test set)
- Results are also saved to `save_dict_<model_name>_avg.json`

## Understanding the Output

When you run the training script, you'll see several types of metrics. Here's what they mean:

### 1. Dataset Loading Information

```
Loading region_job_2 dataset from ./dataset/pokec/
729129                    # Total number of edges in the graph
(66569, 66569)            # Adjacency matrix shape (nodes × nodes)
torch.Size([66569, 266])   # Feature matrix: 66,569 nodes with 266 features each
torch.Size([66569])        # Labels: one label per node
torch.Size([66569])        # Sensitive attribute: one value per node
torch.Size([500])          # Training set size: 500 nodes
```

### 2. Training Progress

```
100%|████████████████| 50/50 [04:03<00:00, 4.87s/it]
```

This shows the training progress bar. In this example:
- 50 epochs completed
- Total time: 4 minutes 3 seconds
- Average time per epoch: ~4.87 seconds

### 3. Echo Chamber & Polarization Metrics

These metrics measure how segregated the graph is based on sensitive attributes and predictions.

#### Raw Graph Metrics

```
[RAW GRAPH] Echo/Polar stats:
```

- **edges_total**: Total number of edges in the graph (517,047)
- **intra_edges**: Edges connecting nodes within the same sensitive group (492,754)
- **inter_edges**: Edges connecting nodes across different sensitive groups (24,293)
- **p_intra_sens**: Proportion of edges within same sensitive group (0.953 = 95.3%)
  - *Higher values indicate more segregation by sensitive attribute*
- **ei_index_sens**: External-Internal index for sensitive attribute (-0.906)
  - *Range: -1 to +1. Negative values mean more connections within groups (segregation)*
- **assort_sens**: Assortativity coefficient for sensitive attribute (0.891)
  - *Range: -1 to +1. Positive values indicate nodes connect to similar nodes*
- **assort_label**: Assortativity for ground-truth labels (0.040)
  - *Measures how much nodes with same labels connect to each other*
- **p_intra_label**: Proportion of edges within same label group (0.735)
- **assort_yhat**: Assortativity for predicted labels (0.382)
  - *Measures polarization in model predictions*
- **p_intra_yhat**: Proportion of edges where both nodes have same prediction (0.696)

#### Learned Graph Metrics (kNN from Embeddings)

```
[LEARNED GRAPH - kNN(embeddings)] Echo/Polar stats:
```

Same metrics as above, but computed on a graph constructed from the learned node embeddings using k-nearest neighbors (k=20). This shows how the model's learned representations create connections:
- **Higher assort_yhat** (0.942) indicates the model creates strong clustering by predictions
- **Higher p_intra_yhat** (0.975) means 97.5% of learned graph edges connect nodes with same predictions

### 4. Opinion Polarization Metrics

```
[OPINION POLARIZATION] (from predicted probabilities):
```

- **prob_mean**: Average predicted probability across all nodes (0.587)
- **prob_var**: Variance in predicted probabilities (0.030)
  - *Higher variance suggests more diverse predictions*
- **extreme_frac_0.1**: Fraction of nodes with very extreme predictions (<0.1 or >0.9) (0.028 = 2.8%)
- **extreme_frac_0.2**: Fraction with moderately extreme predictions (<0.2 or >0.8) (0.123 = 12.3%)
- **group_mean_gap**: Difference in average probability between sensitive groups (0.059)
  - *Measures fairness: smaller is better*
- **js_div_prob_by_sens**: Jensen-Shannon divergence between probability distributions of the two groups (0.023)
  - *Measures distributional difference: 0 = identical, 1 = completely different*

### 5. Performance Metrics

#### Overall Performance

```
[PRE-EXPOSURE METRICS]:
```
- **auc_roc**: Area Under ROC Curve (0.705)
  - *Range: 0.5 (random) to 1.0 (perfect). Higher is better*
- **Acc**: Accuracy - fraction of correct predictions (0.636 = 63.6%)
- **f1**: F1 Score - harmonic mean of precision and recall (0.640)

#### Group-Specific Performance

- **ACC_sens0**: Accuracy for sensitive group 0 (0.625 = 62.5%)
- **AUCROC_sens0**: AUC-ROC for sensitive group 0 (0.712)
- **F1_sens0**: F1 score for sensitive group 0 (0.643)
- **ACC_sens1**: Accuracy for sensitive group 1 (0.660 = 66.0%)
- **AUCROC_sens1**: AUC-ROC for sensitive group 1 (0.700)
- **F1_sens1**: F1 score for sensitive group 1 (0.634)

*These metrics help identify if the model performs differently across groups.*

### 6. Fairness Metrics
```
[FAIRNESS METRICS] TO check how fairness is the model after training:
```
#### Statistical Parity (SP) / Demographic Parity

- **parity**: Test set statistical parity (0.130)
  - *Absolute difference in positive prediction rates between groups*
  - *Formula: |P(ŷ=1|sens=0) - P(ŷ=1|sens=1)|*
  - *Lower is better (0 = perfect parity)*
- **parity_val**: Validation set statistical parity (0.076)

#### Equalized Odds (EO) / Equality of Opportunity

- **equality**: Test set equalized odds (0.100)
  - *Absolute difference in true positive rates between groups*
  - *Formula: |P(ŷ=1|y=1,sens=0) - P(ŷ=1|y=1,sens=1)|*
  - *Lower is better (0 = perfect equality)*
- **equality_val**: Validation set equalized odds (0.048)

## How FairVGNN Works

FairVGNN uses a three-component adversarial training approach:

1. **Encoder**: Graph neural network that learns node representations
2. **Classifier**: Predicts labels from representations
3. **Discriminator**: Tries to predict sensitive attributes from representations
4. **Generator**: Learns feature masks to hide sensitive information

The training process:
- **Discriminator training**: Learns to identify sensitive groups from embeddings
- **Classifier training**: Learns to predict labels accurately
- **Generator training**: Learns to mask features so discriminator can't identify sensitive groups

This creates a min-max game where the model learns fair representations that maintain predictive power.

## Key Parameters

- **top_k**: Number of top correlated features to consider for masking
- **alpha**: Fairness-accuracy tradeoff weight in validation
- **epochs**: Number of training epochs
- **d_epochs, c_epochs, g_epochs**: Epochs for discriminator, classifier, and generator training
- **K**: Number of feature mask samples for Monte Carlo estimation
- **prop**: Propagation method ('scatter' or 'spmm')
- **encoder**: Encoder type ('GCN')

## Link for the Full Report

https://1drv.ms/w/c/868546c3d9aaa83d/IQD1BPL0iibwSpOfXJ-A0zF3AfAVp3WciLZ7XG4j6O_IIe0


