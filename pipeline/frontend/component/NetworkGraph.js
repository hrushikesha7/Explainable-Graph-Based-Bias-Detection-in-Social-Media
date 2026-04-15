'use client'
import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ChartContainer from './ChartContainer'

const CytoscapeComponent = dynamic(
    () => import('react-cytoscapejs'),
    { ssr: false }
)

export default function NetworkGraph({ network }) {
    const cyRef = useRef(null)

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (cyRef.current && !cyRef.current.destroyed()) {
                cyRef.current.destroy()
            }
        }
    }, [])

    // ... rest of your code stays the same

    return (
        <ChartContainer title="Local Network Structure">
            <CytoscapeComponent
                key={JSON.stringify(network)} // Important: forces clean re-render
                elements={[...network.nodes, ...network.links]}
                style={{ width: '100%', height: '300px', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                layout={layout}
                stylesheet={style}
                cy={(cy) => {
                    cyRef.current = cy
                    if (cy) {
                        cy.removeAllListeners() // Clear old listeners
                        cy.on('tap', 'node', (evt) => {
                            const node = evt.target
                            console.log('Selected node:', node.data())
                        })
                    }
                }}
            />
        </ChartContainer>
    )
}