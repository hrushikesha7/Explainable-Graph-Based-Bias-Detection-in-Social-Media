'use client'
// DebugComponent.js
import { useEffect, useState } from "react";
import axios from "axios";

export default function DebugComponent() {
    const [raw, setRaw] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching data from /api/metrics...");
                const response = await axios.get("http://localhost:5000/api/metrics");
                setRaw(response.data);

                // Log the structure of the first file
                const keys = Object.keys(response.data || {});
                console.log("Total files:", keys.length);

                if (keys.length > 0) {
                    const firstKey = keys[0];
                    console.log("First file key:", firstKey);
                    console.log("First file data:", response.data[firstKey]);

                    // Log the structure
                    console.log("First file keys:", Object.keys(response.data[firstKey]));

                    // Check for nested structures
                    const fileData = response.data[firstKey];
                    for (const key in fileData) {
                        console.log(`Key "${key}":`, typeof fileData[key], Array.isArray(fileData[key]));
                        if (typeof fileData[key] === 'object') {
                            console.log(`  Sub-keys of "${key}":`, Object.keys(fileData[key] || {}));
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching metrics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading debug data...</div>;
    }

    return (
        <div>
            <h1>Data Structure Debug</h1>
            <pre>{JSON.stringify(raw, null, 2)}</pre>
        </div>
    );
}