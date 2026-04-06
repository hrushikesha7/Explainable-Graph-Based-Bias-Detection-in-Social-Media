export const API_ENDPOINT = 'http://localhost:5000/api/re-audit-results'

export const fetchREAuditData = async () => {
    try {
        const res = await fetch(API_ENDPOINT)

        if (!res.ok) {
            throw new Error(`No problem Loading RE DATA HTTP ${res.status}`)
        }

        return await res.json()
    } catch (error) {
        console.error('Failed to fetch RE audit data:', error)
        throw error
    }
}

export const transformNetworkData = network => {
    if (!network) return null

    return {
        elements: [
            ...network.nodes.map(n => ({
                data: { id: String(n.id), label: String(n.id) },
            })),
            ...network.links.map(l => ({
                data: {
                    source: String(l.source),
                    target: String(l.target),
                },
            })),
        ],
    }
}

export const transformPolarizationData = pol => {
    if (!pol) return null

    // Ensure we have both group arrays
    if (!Array.isArray(pol.group_0_scores) || !Array.isArray(pol.group_1_scores)) {
        console.warn('Polarization data missing group scores arrays')
        return null
    }

    // Transform to the expected format for visualization
    return [
        {
            name: 'Group 0',
            values: pol.group_0_scores,
            mean: pol.group_0_scores.reduce((a, b) => a + b, 0) / pol.group_0_scores.length
        },
        {
            name: 'Group 1',
            values: pol.group_1_scores,
            mean: pol.group_1_scores.reduce((a, b) => a + b, 0) / pol.group_1_scores.length
        },
    ]
}

export const transformFairnessData = metrics => {
    if (!metrics) return null

    return [
        { name: 'Fairness Gap Before', value: metrics.fairness_gap_before },
        { name: 'Fairness Gap After', value: metrics.fairness_gap_after },
        { name: 'Mean Risk Group 0', value: metrics.mean_risk_group_0 },
        { name: 'Mean Risk Group 1', value: metrics.mean_risk_group_1 },
    ]
}
