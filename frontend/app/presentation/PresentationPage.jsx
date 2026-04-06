// app/presentation/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Filter,
    AlertTriangle,
    BarChart3,
    Network,
    Eye,
    ArrowRight,
    Shield,
    TrendingUp,
    MessageSquare
} from 'lucide-react';

const PresentationPage = () => {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Investigating Social Media Bias",
            subtitle: "Using Graph Neural Networks for Explainable Bias Detection",
            content: (
                <div className="space-y-6">
                    <div className="flex items-center justify-center mb-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                                PK
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                                Active
                            </div>
                        </div>
                    </div>
                    <p className="text-lg text-gray-300">
                        Meet <strong className="text-blue-400">Peter Kováč</strong>, a curious user on Pokec.sk
                    </p>
                    <p className="text-gray-400">
                        Peter wants to understand how social connections form and whether hidden biases affect who we connect with online.
                    </p>
                </div>
            ),
            icon: <Users size={48} className="text-blue-400" />
        },
        {
            title: "The Pokec Social Network",
            subtitle: "A Real-World Social Graph from Slovakia",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/30">
                            <h4 className="font-bold text-blue-300 mb-2">Pokec-n Dataset</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Shield size={14} className="text-yellow-400" />
                                    <span><strong>Sensitive Attribute:</strong> Nationality</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Users size={14} className="text-green-400" />
                                    <span><strong>Prediction Target:</strong> Gender</span>
                                </li>
                                <li className="text-xs text-gray-400 mt-2">
                                    66,569 users • 729,129 connections
                                </li>
                            </ul>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                            <h4 className="font-bold text-purple-300 mb-2">Pokec-z Dataset</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <Shield size={14} className="text-yellow-400" />
                                    <span><strong>Sensitive Attribute:</strong> Region</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Users size={14} className="text-green-400" />
                                    <span><strong>Prediction Target:</strong> Gender</span>
                                </li>
                                <li className="text-xs text-gray-400 mt-2">
                                    67,796 users • 882,765 connections
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Each user is a node, each friendship is an edge. We analyze how attributes like nationality and region affect connection patterns.
                    </p>
                </div>
            ),
            icon: <Network size={48} className="text-green-400" />
        },
        {
            title: "The Problem: Algorithmic Bias & Echo Chambers",
            subtitle: "How Social Media Shapes Our Connections",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={20} className="text-red-400" />
                                <h4 className="font-bold text-red-300">Echo Chambers</h4>
                            </div>
                            <p className="text-xs text-gray-300">
                                Users primarily connect with others sharing similar attributes, creating isolated information bubbles
                            </p>
                        </div>
                        <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Filter size={20} className="text-yellow-400" />
                                <h4 className="font-bold text-yellow-300">Filter Bubbles</h4>
                            </div>
                            <p className="text-xs text-gray-300">
                                Algorithms reinforce existing connections, limiting exposure to diverse perspectives
                            </p>
                        </div>
                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={20} className="text-purple-400" />
                                <h4 className="font-bold text-purple-300">Polarization</h4>
                            </div>
                            <p className="text-xs text-gray-300">
                                Groups become more extreme in their views as they're isolated from opposing perspectives
                            </p>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-300">
                            <strong className="text-blue-300">Research Question:</strong> Do social media algorithms amplify existing biases in friendship formation based on attributes like nationality and region?
                        </p>
                    </div>
                </div>
            ),
            icon: <AlertTriangle size={48} className="text-red-400" />
        },
        {
            title: "Our Solution: Explainable Graph-Based Bias Detection",
            subtitle: "Using Fairness-Aware Graph Neural Networks",
            content: (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">3</div>
                            <div className="text-xs text-gray-400">GNN Models</div>
                        </div>
                        <ArrowRight className="text-gray-500" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">4</div>
                            <div className="text-xs text-gray-400">Bias Metrics</div>
                        </div>
                        <ArrowRight className="text-gray-500" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">AI</div>
                            <div className="text-xs text-gray-400">Explainability</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-300 text-sm">Models Used:</h4>
                            <ul className="space-y-1 text-xs">
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    <span>Vanilla GNN (Baseline)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>FairGNN (Adversarial)</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>FairVGNN (Feature Masking)</span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-bold text-gray-300 text-sm">Metrics Analyzed:</h4>
                            <ul className="space-y-1 text-xs">
                                <li className="text-gray-400">• Statistical Parity</li>
                                <li className="text-gray-400">• Equality of Opportunity</li>
                                <li className="text-gray-400">• Echo Chamber Detection</li>
                                <li className="text-gray-400">• Opinion Polarization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
            icon: <BarChart3 size={48} className="text-blue-400" />
        },
        {
            title: "Key Findings from Our Research",
            subtitle: "What We Discovered About Social Media Bias",
            content: (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-red-500/20 p-2 rounded-lg">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-300 mb-1">Pokec-z Shows Extreme Homophily</h4>
                                <p className="text-sm text-gray-400">
                                    Over 95% of connections occur within the same region group, indicating strong geographic bias
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-yellow-500/20 p-2 rounded-lg">
                                <Filter size={20} className="text-yellow-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-300 mb-1">Fairness Models Reduce But Don't Eliminate Bias</h4>
                                <p className="text-sm text-gray-400">
                                    FairGNN and FairVGNN improve fairness metrics but can't fully overcome structural biases
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <MessageSquare size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-300 mb-1">Recommendation Systems Amplify Polarization</h4>
                                <p className="text-sm text-gray-400">
                                    Similarity-based recommendations increase group separation even with fairness constraints
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            icon: <Eye size={48} className="text-yellow-400" />
        },
        {
            title: "Explore the Dashboard",
            subtitle: "Interactive Analysis of Social Media Bias",
            content: (
                <div className="space-y-8 text-center">
                    <div className="animate-pulse">
                        <div className="text-6xl mb-6">📊</div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white">Ready to Explore?</h3>
                        <p className="text-gray-300">
                            Navigate to our interactive dashboard to:
                        </p>


                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
                    >
                        Launch Dashboard
                        <ArrowRight size={20} />
                    </button>
                </div>
            ),
            icon: null
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            router.push('/dashboard');
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Explainable Graph-Based Bias Detection
                            </h1>
                            <p className="text-gray-400">Human-Centered AI Research Group</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Winter Term 2025/2026</div>
                            <div className="text-xs text-gray-500">Group 3</div>
                        </div>
                    </div>
                </header>

                {/* Main Presentation */}
                <main className="relative">
                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 min-h-[600px]">
                        <div className="flex flex-col h-full">
                            {/* Slide indicator */}
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        {slides[currentSlide].icon}
                                        <div>
                                            <h2 className="text-2xl font-bold">{slides[currentSlide].title}</h2>
                                            <p className="text-gray-400">{slides[currentSlide].subtitle}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm text-gray-400">
                                        Slide {currentSlide + 1} of {slides.length}
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                        {slides.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`h-1 rounded-full transition-all duration-300 ${index === currentSlide
                                                    ? 'w-8 bg-blue-500'
                                                    : 'w-2 bg-gray-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Slide Content */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-full max-w-4xl">
                                    {slides[currentSlide].content}
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-700">
                                <button
                                    onClick={prevSlide}
                                    disabled={currentSlide === 0}
                                    className={`px-6 py-3 rounded-lg flex items-center gap-2 ${currentSlide === 0
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                >
                                    ← Previous
                                </button>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                                    >
                                        Skip to Dashboard
                                    </button>

                                    <button
                                        onClick={nextSlide}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold flex items-center gap-2 transition-all duration-300"
                                    >
                                        {currentSlide === slides.length - 1 ? (
                                            <>
                                                Launch Dashboard
                                                <ArrowRight size={20} />
                                            </>
                                        ) : (
                                            'Next →'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
                </main>

                {/* Footer */}
                <footer className="mt-12 text-center text-gray-500 text-sm">
                    <p>
                        This research uses Graph Neural Networks to detect and explain bias in social media networks.
                        Built with Next.js, Flask, and modern AI technologies.
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            Vanilla GNN
                        </span>
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            FairGNN
                        </span>
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            FairVGNN
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PresentationPage;