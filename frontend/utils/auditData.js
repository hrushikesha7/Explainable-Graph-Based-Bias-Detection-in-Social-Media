export const API_ENDPOINT = 'http://localhost:5000/api/model-audit-results'

export const HARDCODED_AUDIT4_DATA = {
    fairness_gap_after: 0.015772521495819092,
    fairness_gap_before: 0.0350400604014417,
    improvement_percent: 54.987173780185195,
    mean_risk_group_0: 0.43428361415863037,
    mean_risk_group_1: 0.4185110926628113
}

export const fetchAuditData = async () => {
    try {
        const response = await fetch(API_ENDPOINT)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Fetch failed, using fallback data:', error)
        // Return fallback data structure
        return {
            audit_file_4: HARDCODED_AUDIT4_DATA
        }
    }
}

export const transformNetworkData = (network) => {
    if (!network) return null
    return {
        nodes: network.nodes.map(n => ({ data: { id: String(n.id), label: n.id } })),
        links: network.links.map(l => ({ data: { source: String(l.source), target: String(l.target) } }))
    }
}

export const transformFairnessData = (audit4Data) => {
    const data = audit4Data || HARDCODED_AUDIT4_DATA
    return {
        chartData: [
            { name: 'Fairness Gap Before', value: data.fairness_gap_before },
            { name: 'Fairness Gap After', value: data.fairness_gap_after },
            { name: 'Mean Risk Group 0', value: data.mean_risk_group_0 },
            { name: 'Mean Risk Group 1', value: data.mean_risk_group_1 }
        ],
        rawData: data
    }
}