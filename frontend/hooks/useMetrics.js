'use client'
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/metrics";

export function useMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();

                if (isMounted) {
                    setData(json);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Failed to fetch metrics");
                    setData(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMetrics();

        return () => {
            isMounted = false;
        };
    }, []);

    return { data, loading, error };
}
