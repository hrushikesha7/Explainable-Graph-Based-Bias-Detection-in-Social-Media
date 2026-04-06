// app/component/Sidebar.tsx
'use client';

import { useState } from 'react';
import {
    BarChart3,
    Network,
    Shield,
    Target,
    Filter,
    Users,
    Settings,
    Home,
    ChevronLeft,
    ChevronRight,
    Zap,
    AlertTriangle
} from 'lucide-react';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { icon: <Home size={20} />, label: 'Dashboard', active: true },
        { icon: <Network size={20} />, label: 'Network Graph' },
        { icon: <BarChart3 size={20} />, label: 'Metrics' },
        { icon: <Shield size={20} />, label: 'Fairness' },
        { icon: <Target size={20} />, label: 'Polarization' },
        { icon: <Filter size={20} />, label: 'Echo Chambers' },
        { icon: <Users size={20} />, label: 'User Analysis' },
        { icon: <Zap size={20} />, label: 'AI Reports' },
        { icon: <AlertTriangle size={20} />, label: 'Risk Alerts' },
        { icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div className={`h-screen bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Bias Detect
                            </h1>
                            <p className="text-xs text-gray-500">HCAT Research</p>
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full mb-6 p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
                >
                    {collapsed ? <ChevronRight size={20} className="text-gray-400" /> : <ChevronLeft size={20} className="text-gray-400" />}
                </button>

                {/* Menu Items */}
                <nav className="space-y-2">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${item.active
                                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            <div className={`${item.active ? 'text-blue-400' : 'text-gray-500'}`}>
                                {item.icon}
                            </div>
                            {!collapsed && (
                                <span className="font-medium">{item.label}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Dataset Status */}
                {!collapsed && (
                    <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-300">Live Data</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Pokec-n</span>
                                <span className="text-green-400">✓ Online</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Pokec-z</span>
                                <span className="text-green-400">✓ Online</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">GNN Models</span>
                                <span className="text-blue-400">3 Active</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}