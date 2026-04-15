import { useState, useEffect } from 'react'
import { fetchAuditData, transformNetworkData } from '../utils/auditData'

export const useAuditData = () => {
    const [auditData, setAuditData] = useState({
        features: [],
        network: null,
        polarization: [],
        audit4Data: null,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadAuditData = async () => {
            try {
                setIsLoading(true)
                const data = await fetchAuditData()

                setAuditData({
                    features: data.audit_file_1 || [],
                    network: transformNetworkData(data.audit_file_2),
                    polarization: data.audit_file_3?.group_0_scores || [],
                    audit4Data: data.audit_file_4 || null,
                })
            } catch (err) {
                setError(err.message || 'Failed to fetch audit data')
                console.error('Error loading audit data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        loadAuditData()
    }, [])

    return { ...auditData, isLoading, error }
}