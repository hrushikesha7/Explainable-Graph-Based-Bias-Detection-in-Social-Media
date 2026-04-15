// Data transformation utilities - UPDATED VERSION
export const transformRawData = (raw) => {
    console.log("Raw Data ??????????", raw)
    if (!raw) return [];
    const out = [];

    // Process each file (file_1, file_2, etc.)
    Object.keys(raw).forEach((fileKey) => {
        const fileData = raw[fileKey] || {};

        // Check if this file has results data (has 'all' property)
        if (fileData.all) {
            const allData = fileData.all || {};

            // Process each model+dataset combination (e.g., "FairVGNN+pokec_n")
            Object.keys(allData).forEach((modelDatasetKey) => {
                const runs = allData[modelDatasetKey] || [];

                runs.forEach((run, idx) => {
                    if (run) {
                        // Extract model name and dataset from key
                        // Format is "Model+dataset" or "Model_dataset"
                        let modelName, dataset;
                        if (modelDatasetKey.includes('+')) {
                            [modelName, dataset] = modelDatasetKey.split('+');
                        } else if (modelDatasetKey.includes('_')) {
                            // Find the last underscore to split model and dataset
                            const lastUnderscore = modelDatasetKey.lastIndexOf('_');
                            modelName = modelDatasetKey.substring(0, lastUnderscore);
                            dataset = modelDatasetKey.substring(lastUnderscore + 1);
                        } else {
                            modelName = modelDatasetKey;
                            dataset = 'unknown';
                        }

                        // Extract parameters
                        const parameters = run.parameter || {};

                        out.push({
                            id: `${fileKey}_${modelDatasetKey}_${idx}`,
                            file: fileKey,
                            model: modelName,
                            dataset: dataset,
                            modelDataset: modelDatasetKey,
                            runIndex: idx,
                            ACC: tryNum(run.ACC),
                            ACC_sens0: tryNum(run.ACC_sens0),
                            ACC_sens1: tryNum(run.ACC_sens1),
                            AUCROC: tryNum(run.AUCROC),
                            AUCROC_sens0: tryNum(run.AUCROC_sens0),
                            AUCROC_sens1: tryNum(run.AUCROC_sens1),
                            F1: tryNum(run.F1),
                            F1_sens0: tryNum(run.F1_sens0),
                            F1_sens1: tryNum(run.F1_sens1),
                            SP: tryNum(run.SP),
                            EO: tryNum(run.EO),
                            time: tryNum(run.time),
                            val_loss: tryNum(run.val_loss),
                            val_ACC: tryNum(run.val_ACC),
                            val_AUCROC: tryNum(run.val_AUCROC),
                            val_F1: tryNum(run.val_F1),
                            val_SP: tryNum(run.val_SP),
                            val_EO: tryNum(run.val_EO),
                            // Add echo chamber metrics if available
                            echo_learned: run.echo_learned,
                            echo_raw: run.echo_raw,
                            opinion_polarization: run.opinion_polarization,
                            // Spread all parameters
                            ...parameters,
                        });
                    }
                });
            });
        } else {
            // This file contains only configuration parameters (like file_1)
            // We can skip these for the main visualization
            console.log(`File ${fileKey} contains only configuration data, skipping...`);
        }
    });

    console.log("Transformed rows:", out);
    return out;
};

export const tryNum = (v) => {
    if (v === null || v === undefined || v === "nan" || v === NaN || isNaN(v)) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// Add console logging to debug the data flow
export const getMetricSeries = (rows, selectedFiles) => {
    const filtered = rows.filter(r => selectedFiles.includes(r.file));
    console.log("getMetricSeries - Filtered rows:", filtered.length, "from selectedFiles:", selectedFiles);

    return filtered.map((r) => ({
        ...r,
        label: `${r.model} (${r.dataset}) - ${r.file}`
    }));
};

export const calculateFairnessAccuracyData = (rows) => {
    return rows.map(r => ({
        ...r,
        fairnessIndex: Math.sqrt(Math.pow(r.SP || 0, 2) + Math.pow(r.EO || 0, 2)),
        accuracyFairnessRatio: (r.ACC || 0) / (Math.sqrt(Math.pow(r.SP || 0, 2) + Math.pow(r.EO || 0, 2)) + 0.0001),
    }));
};

export const calculateGroupComparisonData = (rows, selectedFiles) => {
    const data = [];
    rows.filter(r => selectedFiles.includes(r.file)).forEach(r => {
        if (r.ACC_sens0 !== null) {
            data.push({
                id: `${r.id}_sens0`,
                file: r.file,
                model: r.model,
                dataset: r.dataset,
                group: "sens0",
                ACC: r.ACC_sens0,
                AUCROC: r.AUCROC_sens0,
                F1: r.F1_sens0,
            });
        }
        if (r.ACC_sens1 !== null) {
            data.push({
                id: `${r.id}_sens1`,
                file: r.file,
                model: r.model,
                dataset: r.dataset,
                group: "sens1",
                ACC: r.ACC_sens1,
                AUCROC: r.AUCROC_sens1,
                F1: r.F1_sens1,
            });
        }
    });
    return data;
};

export const calculatePerformanceDistribution = (rows) => {
    const metrics = ["ACC", "AUCROC", "F1", "SP", "EO", "time"];
    return metrics.map(metric => {
        const values = rows.map(r => r[metric]).filter(v => v !== null);
        if (values.length === 0) {
            return {
                metric,
                min: 0,
                max: 0,
                avg: 0,
                median: 0,
            };
        }
        return {
            metric,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        };
    });
};

export const getTopModels = (rows, metric = "ACC", count = 5) => {
    return [...rows]
        .filter(r => r[metric] !== null)
        .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
        .slice(0, count);
};

export const getSelectedRows = (rows, selectedFiles) => {
    return rows.filter(r => selectedFiles.includes(r.file));
};

export const buildRadarData = (selectedRows) => {
    const metrics = ["ACC", "AUCROC", "F1", "SP", "EO"];
    const data = metrics.map(metric => {
        const point = { metric };
        selectedRows.forEach((row, idx) => {
            // Use a unique identifier for each row
            const label = `${row.model}_${row.dataset}_${idx}`;
            const value = row[metric] || 0;
            // Normalize value (assuming metrics are in 0-1 range, adjust if needed)
            point[label] = Math.min(1, Math.max(0, value));
        });
        return point;
    });
    return data;
};

export const buildGroupedMetrics = (rows) => {
    // Find all rows with echo chamber data
    const rowsWithEcho = rows.filter(r => r.echo_raw || r.echo_learned);

    if (rowsWithEcho.length === 0) {
        return {
            "RAW GRAPH": {},
            "OPINION POLARIZATION": {},
            "LEARNED GRAPH": {},
            "PERFORMANCE METRICS": {},
        };
    }

    // Use the first row with echo data as representative
    const representativeRow = rowsWithEcho[0];
    const echoRaw = representativeRow.echo_raw || {};
    const echoLearned = representativeRow.echo_learned || {};
    const opinionPol = representativeRow.opinion_polarization || {};

    return {
        "RAW GRAPH": {
            edges_total: echoRaw.edges_total,
            intra_edges: echoRaw.intra_edges,
            inter_edges: echoRaw.inter_edges,
            p_intra_sens: echoRaw.p_intra_sens,
            ei_index_sens: echoRaw.ei_index_sens,
            assort_sens: echoRaw.assort_sens,
            assort_label: echoRaw.assort_label,
            p_intra_label: echoRaw.p_intra_label,
            assort_yhat: echoRaw.assort_yhat,
            p_intra_yhat: echoRaw.p_intra_yhat,
        },
        "OPINION POLARIZATION": {
            prob_mean: opinionPol.prob_mean,
            prob_var: opinionPol.prob_var,
            extreme_frac_0_1: opinionPol["extreme_frac_0.1"],
            extreme_frac_0_2: opinionPol["extreme_frac_0.2"],
            group_mean_gap: opinionPol.group_mean_gap,
            js_div_prob_by_sens: opinionPol.js_div_prob_by_sens,
        },
        "LEARNED GRAPH": {
            edges_total: echoLearned.edges_total,
            intra_edges: echoLearned.intra_edges,
            inter_edges: echoLearned.inter_edges,
            p_intra_sens: echoLearned.p_intra_sens,
            ei_index_sens: echoLearned.ei_index_sens,
            assort_sens: echoLearned.assort_sens,
            assort_label: echoLearned.assort_label,
            p_intra_label: echoLearned.p_intra_label,
            assort_yhat: echoLearned.assort_yhat,
            p_intra_yhat: echoLearned.p_intra_yhat,
        },
        "PERFORMANCE METRICS": {
            ACC: representativeRow.ACC,
            AUCROC: representativeRow.AUCROC,
            F1: representativeRow.F1,
            SP: representativeRow.SP,
            EO: representativeRow.EO,
            ACC_sens0: representativeRow.ACC_sens0,
            ACC_sens1: representativeRow.ACC_sens1,
            AUCROC_sens0: representativeRow.AUCROC_sens0,
            AUCROC_sens1: representativeRow.AUCROC_sens1,
            F1_sens0: representativeRow.F1_sens0,
            F1_sens1: representativeRow.F1_sens1,
            time: representativeRow.time,
        },
    };
};

// Helper function to get unique models and datasets
export const getUniqueModels = (rows) => {
    const models = new Set();
    rows.forEach(r => {
        if (r.model) models.add(r.model);
    });
    return Array.from(models);
};

export const getUniqueDatasets = (rows) => {
    const datasets = new Set();
    rows.forEach(r => {
        if (r.dataset) datasets.add(r.dataset);
    });
    return Array.from(datasets);
};

export const filterByModelAndDataset = (rows, models = [], datasets = []) => {
    return rows.filter(r => {
        const modelMatch = models.length === 0 || models.includes(r.model);
        const datasetMatch = datasets.length === 0 || datasets.includes(r.dataset);
        return modelMatch && datasetMatch;
    });
};

// NEW: Function to get all available files (excluding hyperparameter files)
export const getResultFiles = (raw) => {
    if (!raw) return [];
    return Object.keys(raw).filter(fileKey => {
        const fileData = raw[fileKey] || {};
        return fileData.all !== undefined; // Only files with results
    });
};

// NEW: Function to get hyperparameter configurations
export const getHyperparameters = (raw) => {
    if (!raw) return {};
    const hyperparams = {};

    Object.keys(raw).forEach((fileKey) => {
        const fileData = raw[fileKey] || {};
        // Check if this is a hyperparameter file (no "all" property)
        if (!fileData.all) {
            hyperparams[fileKey] = fileData;
        }
    });

    return hyperparams;
};