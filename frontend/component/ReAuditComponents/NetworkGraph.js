import CytoscapeComponent from 'react-cytoscapejs'
import ChartContainer from '../ChartContainer'
import { useRef, useEffect } from 'react'  // Add this import

export const RENetworkGraph = ({ network }) => {
    const cyRef = useRef(null)  // Add a ref to track Cytoscape instance

    if (!network) {
        return (
            <div className="flex items-center justify-center h-[300px] border border-gray-200 rounded-lg">
                <p className="text-gray-500">No network data available</p>
            </div>
        )
    }

    const layout = {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
    }

    // Cleanup effect
    useEffect(() => {
        return () => {
            // Cleanup when component unmounts
            if (cyRef.current && !cyRef.current.destroyed()) {
                cyRef.current.destroy()
            }
        }
    }, [])

    return (
        <ChartContainer title={"Ego Network: User 65965 & Top Recommendations"}>
            <div className="text-xs font-medium text-center">Checking for Homophily / Eco Chambers</div>
            <br />
            <CytoscapeComponent
                key={JSON.stringify(network.elements)}  // Force re-render on new data
                elements={network.elements}
                style={{
                    width: '100%',
                    height: '300px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                }}
                layout={layout}
                stylesheet={[
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'background-color': '#6366f1',
                            'color': '#ffffff',
                            'font-size': '10px',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'width': 30,
                            'height': 30,
                        },
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#cbd5e1',
                            'target-arrow-color': '#cbd5e1',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                        },
                    },
                ]}
                cy={(cy) => {
                    if (cy && !cy.destroyed()) {
                        cyRef.current = cy  // Store reference

                        // Remove any existing listeners first
                        cy.removeAllListeners()

                        cy.on('tap', 'node', (evt) => {
                            const node = evt.target
                            console.log('Selected node:', node.data())
                        })

                        // Fit to viewport after a small delay
                        setTimeout(() => {
                            if (cy && !cy.destroyed()) {
                                cy.fit()
                            }
                        }, 100)
                    }
                }}
            />
        </ChartContainer>
    )
}