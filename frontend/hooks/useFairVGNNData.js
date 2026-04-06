// useFairVGNNData.js - WITHOUT useMemo
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export const useFairVGNNData = () => {
    const [raw, setRaw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // State for derived data
    const [rows, setRows] = useState([]);
    const [derivedData, setDerivedData] = useState({
        metricSeries: [],
        fairnessAccuracyData: [],
        groupComparisonData: [],
        performanceDistribution: [],
        topModels: [],
        selectedRows: [],
        radarData: [],
        groupedMetrics: {}
    });

    // Helper functions
    const safeNumber = useCallback((value) => {
        if (value === null || value === undefined || value === 'nan' || isNaN(value)) {
            return null;
        }
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }, []);

    const extractModelName = useCallback((path) => {
        const modelNames = [
            'FairVGNN', 'FairGNN', 'GNN', 'CrossWalk', 'DeepWalk', 'EDITS',
            'FairEdit', 'FairWalk', 'GUIDE', 'InFoRM', 'NIFTY', 'REDRESS'
        ];

        for (const model of modelNames) {
            if (path.includes(model)) return model;
        }

        return 'unknown';
    }, []);

    const extractDatasetName = useCallback((path) => {
        const datasets = ['pokec_n', 'pokec_z', 'facebook', 'twitter'];
        for (const dataset of datasets) {
            if (path.includes(dataset)) return dataset;
        }
        return 'unknown';
    }, []);
    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching data from /api/metrics...");
                const response = await axios.get("http://localhost:5000/api/metrics");
                const x = response.data
                setRaw(x);
                console.log(response.data)
                // Transform immediately
                const transformedRows = transformData(response.data);
                setRows(transformedRows);

                // Select first 2 files by default
                const keys = Object.keys(response.data || {});
                const initialSelectedFiles = keys.slice(0, Math.min(2, keys.length));
                setSelectedFiles(initialSelectedFiles);

                // Calculate initial derived data
                const derived = calculateDerivedData(transformedRows, initialSelectedFiles);
                setDerivedData(derived);

            } catch (err) {
                console.error("Error fetching metrics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    // Transform raw data to rows
    const transformData = useCallback((rawData) => {
        // console.log("Raw data", rawData);
        if (!rawData || typeof rawData !== "object") return [];

        const out = [];

        const processFile = (fileData, fileKey) => {
            // 🔒 Skip config-only files (no experimental results)
            if (!fileData?.all || typeof fileData.all !== "object") {
                return;
            }

            Object.entries(fileData.all).forEach(([modelDatasetKey, runs]) => {
                if (!Array.isArray(runs)) return;

                // Extract model + dataset
                let model = "unknown";
                let dataset = "unknown";

                if (modelDatasetKey.includes("+")) {
                    [model, dataset] = modelDatasetKey.split("+");
                } else {
                    model = extractModelName(modelDatasetKey);
                    dataset = extractDatasetName(modelDatasetKey);
                }

                runs.forEach((run, idx) => {
                    if (!run || typeof run !== "object") return;

                    out.push({
                        id: `${fileKey}_${model}_${dataset}_${idx}`,
                        file: fileKey,
                        model,
                        dataset,
                        runIndex: idx,

                        // ---- Metrics ----
                        ACC: safeNumber(run.ACC),
                        ACC_sens0: safeNumber(run.ACC_sens0),
                        ACC_sens1: safeNumber(run.ACC_sens1),

                        AUCROC: safeNumber(run.AUCROC),
                        AUCROC_sens0: safeNumber(run.AUCROC_sens0),
                        AUCROC_sens1: safeNumber(run.AUCROC_sens1),

                        F1: safeNumber(run.F1),
                        F1_sens0: safeNumber(run.F1_sens0),
                        F1_sens1: safeNumber(run.F1_sens1),

                        SP: safeNumber(run.SP),
                        EO: safeNumber(run.EO),

                        time: safeNumber(run.time),

                        val_loss: safeNumber(run.val_loss),
                        val_ACC: safeNumber(run.val_ACC),
                        val_AUCROC: safeNumber(run.val_AUCROC),
                        val_F1: safeNumber(run.val_F1),
                        val_SP: safeNumber(run.val_SP),
                        val_EO: safeNumber(run.val_EO),

                        // ---- Extra structures ----
                        echo_learned: run.echo_learned ?? null,
                        echo_raw: run.echo_raw ?? null,
                        opinion_polarization: run.opinion_polarization ?? null,

                        // ---- Hyperparameters used in the run ----
                        ...(run.parameter || {})
                    });
                });
            });
        };

        Object.entries(rawData).forEach(([fileKey, fileData]) => {
            processFile(fileData, fileKey);
        });

        console.log(`Transformed ${out.length} rows`);
        console.log("Out", out)
        return out;
    }, [safeNumber, extractModelName, extractDatasetName]);


    // Calculate all derived data
    const calculateDerivedData = useCallback((rows, selectedFilesArray) => {
        // 1. Metric Series
        const metricSeries = rows
            .filter(r => selectedFilesArray.includes(r.file))
            .map(r => ({
                ...r,
                label: `${r.model} (${r.dataset}) - ${r.file}`
            }));

        // 2. Fairness-Accuracy Data
        const fairnessAccuracyData = rows.map(r => ({
            ...r,
            fairnessIndex: Math.sqrt(Math.pow(r.SP || 0, 2) + Math.pow(r.EO || 0, 2))
        }));

        // 3. Group Comparison Data
        const groupComparisonData = [];
        rows.filter(r => selectedFilesArray.includes(r.file)).forEach(r => {
            if (r.ACC_sens0 !== undefined) {
                groupComparisonData.push({
                    file: r.file,
                    model: r.model,
                    dataset: r.dataset,
                    group: "sens0",
                    ACC: r.ACC_sens0,
                    AUCROC: r.AUCROC_sens0,
                    F1: r.F1_sens0,
                });
            }
            if (r.ACC_sens1 !== undefined) {
                groupComparisonData.push({
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

        // 4. Performance Distribution
        const metrics = ["ACC", "AUCROC", "F1", "SP", "EO"];
        const performanceDistribution = metrics.map(metric => {
            const values = rows.map(r => r[metric]).filter(v => v !== null);
            return {
                metric,
                min: values.length > 0 ? Math.min(...values) : 0,
                max: values.length > 0 ? Math.max(...values) : 0,
                avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
                median: values.length > 0 ? values.sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0,
            };
        });

        // 5. Top Models
        const topModels = [...rows]
            .filter(r => r.ACC !== null)
            .sort((a, b) => (b.ACC || 0) - (a.ACC || 0))
            .slice(0, 5);

        const radarMetrics = ["ACC", "AUCROC", "F1", "SP", "EO"];
        const selectedRows = rows.filter(r => selectedFilesArray.includes(r.file));

        const radarData = radarMetrics.map(metric => {
            const point = { metric };
            selectedRows.slice(0, 3).forEach((row, idx) => {
                // Use file name as key since that's what RadarChartComponent expects
                point[row.file] = row[metric] || 0;
            });
            return point;
        });

        // 8. Grouped Metrics
        const firstRowWithEcho = rows.find(r => r.echo_raw || r.echo_learned) || rows[0];
        const groupedMetrics = firstRowWithEcho ? {
            "PERFORMANCE METRICS": {
                ACC: firstRowWithEcho.ACC,
                AUCROC: firstRowWithEcho.AUCROC,
                F1: firstRowWithEcho.F1,
                SP: firstRowWithEcho.SP,
                EO: firstRowWithEcho.EO,
                time: firstRowWithEcho.time,
            },
            "GROUP PERFORMANCE": {
                ACC_sens0: firstRowWithEcho.ACC_sens0,
                ACC_sens1: firstRowWithEcho.ACC_sens1,
                AUCROC_sens0: firstRowWithEcho.AUCROC_sens0,
                AUCROC_sens1: firstRowWithEcho.AUCROC_sens1,
                F1_sens0: firstRowWithEcho.F1_sens0,
                F1_sens1: firstRowWithEcho.F1_sens1,
            },
            ...(firstRowWithEcho.echo_raw ? {
                "RAW GRAPH": firstRowWithEcho.echo_raw
            } : {}),
            ...(firstRowWithEcho.echo_learned ? {
                "LEARNED GRAPH": firstRowWithEcho.echo_learned
            } : {}),
            ...(firstRowWithEcho.opinion_polarization ? {
                "OPINION POLARIZATION": firstRowWithEcho.opinion_polarization
            } : {})
        } : {};

        return {
            metricSeries,
            fairnessAccuracyData,
            groupComparisonData,
            performanceDistribution,
            topModels,
            selectedRows,
            radarData,
            groupedMetrics
        };
    }, []);



    // Update derived data when selectedFiles changes
    useEffect(() => {
        if (rows.length > 0) {
            const derived = calculateDerivedData(rows, selectedFiles);
            setDerivedData(derived);
        }
    }, [selectedFiles, rows, calculateDerivedData]);

    // Function to manually refresh data
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:5000/api/metrics");
            setRaw(response.data);

            const transformedRows = transformData(response.data);
            setRows(transformedRows);

            const derived = calculateDerivedData(transformedRows, selectedFiles);
            setDerivedData(derived);
        } catch (err) {
            console.error("Error refreshing data:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedFiles, transformData, calculateDerivedData]);

    // Get unique models and datasets (simple functions, no memo needed)
    const uniqueModels = [...new Set(rows.map(r => r.model).filter(Boolean))];
    const uniqueDatasets = [...new Set(rows.map(r => r.dataset).filter(Boolean))];

    return {
        // State
        raw,
        loading,
        rows,
        selectedFiles,

        // Setters
        setSelectedFiles: (files) => {
            setSelectedFiles(files);
            // Update derived data will happen in the useEffect
        },

        // Derived data
        ...derivedData,

        // Additional data
        uniqueModels,
        uniqueDatasets,

        // Functions
        refreshData
    };
};