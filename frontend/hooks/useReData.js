import { useEffect, useState } from 'react'
import {
    fetchREAuditData,
    transformNetworkData,
    transformPolarizationData,
    transformFairnessData,
} from '@/utils/reAuditData'

export const useREAuditData = () => {
    const [state, setState] = useState({
        features: [],
        recommendations: [],
        network: null,
        polarization: null,
        fairness: null,
    })

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true)

                const data = await fetchREAuditData()
                console.log("RE DATA --------------------------------", data)
                setState({
                    features: data.audit_file_1 || [],
                    recommendations: data.audit_file_4 || [],
                    network: transformNetworkData(data.audit_file_2),
                    polarization: transformPolarizationData(data.audit_file_3),
                    fairness: transformFairnessData(data.audit_file_5),
                })

            } catch (e) {
                setError(e.message || 'Failed to load RE audit data')
            } finally {
                setIsLoading(false)
            }
        }

        load()
    }, [])

    return { ...state, isLoading, error }
}
