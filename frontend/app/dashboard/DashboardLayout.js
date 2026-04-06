// app/dashboard/DashboardLayout.tsx
import React from 'react';
import Sidebar from '@/component/Sidebar';
import { Presentation } from 'lucide-react';


export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative ">
                <div className="flex">
                    {/* Sidebar */}
                    <Sidebar />

                    {/* Main Content */}
                    <div className="flex-1 p-4 md:p-8">
                        {/* Top Navigation Bar */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                                    >
                                        <Presentation size={18} />
                                        View Presentation
                                    </button>

                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-300">Group 3</div>
                                        <div className="text-xs text-gray-500">HCAT 2025/2026</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}