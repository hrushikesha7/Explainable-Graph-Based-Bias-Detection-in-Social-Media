'use client'
import { useState, useEffect } from 'react'
import FeatureImportanceChart from '../../component/FeatureImportanceChart'
import NetworkGraph from '../../component/NetworkGraph'
import PolarizationChart from '../../component/PolarizationChart'
import FairnessMetrics from '../../component/FairnessMetrics'
import DashboardLayout from './DashboardLayout'
import { useAuditData } from '@/hooks/useAuditData'

export default function DashboardPage() {
    const {
        features,
        network,
        polarization,
        audit4Data,
        isLoading,
        error
    } = useAuditData()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-red-800">Error Loading Data</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout title="Model Audit Dashboard">
            <FeatureImportanceChart features={features} />
            <NetworkGraph network={network} />
            <PolarizationChart polarization={polarization} />
            <FairnessMetrics audit4Data={audit4Data} />
        </DashboardLayout>
    )
}