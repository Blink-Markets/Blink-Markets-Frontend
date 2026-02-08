import { Zap, Timer, Shield, Gauge, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Hero() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        { icon: Timer, label: '10s Markets', color: 'text-[#00E5A0]', bgColor: 'bg-[#00E5A0]/10' },
        { icon: Gauge, label: 'Sui Speed', color: 'text-[#4DA2FF]', bgColor: 'bg-[#4DA2FF]/10' },
        { icon: Zap, label: 'Instant Payouts', color: 'text-[#00D4FF]', bgColor: 'bg-[#00D4FF]/10' },
        { icon: Shield, label: 'Fully On-Chain', color: 'text-[#FFB84D]', bgColor: 'bg-[#FFB84D]/10' },
    ];

    return (
        <div className="relative py-24 md:py-32 lg:py-40 mb-12 overflow-hidden min-h-[70vh] flex items-center">
            {/* Sui-style Large Blue Glow Background */}
            <div className="absolute inset-0 -z-10">
                {/* Main hero glow - Large and prominent like Sui.io */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[1200px] h-[800px] opacity-80"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(77, 162, 255, 0.25) 0%, rgba(77, 162, 255, 0.12) 30%, rgba(0, 180, 255, 0.05) 60%, transparent 80%)',
                    }}
                />
                {/* Secondary ambient glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-60"
                    style={{
                        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(77, 162, 255, 0.15) 0%, transparent 70%)',
                    }}
                />
                {/* Bottom fade to dark */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-48"
                    style={{
                        background: 'linear-gradient(to top, #050B15 0%, transparent 100%)',
                    }}
                />
            </div>

            <div
                className={`w-full text-center max-w-6xl mx-auto px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
            >
                {/* Giant Hero Title - Sui.io Style */}
                <h1 className="font-display font-bold tracking-tight mb-8">
                    {/* First line - smaller text */}
                    <span
                        className="block text-4xl md:text-5xl lg:text-6xl text-foreground/90 mb-2"
                        style={{ fontWeight: 500 }}
                    >
                        Flash betting
                    </span>
                    {/* Second line - GIANT glowing text */}
                    <span className="block relative">
                        <span
                            className="text-6xl md:text-8xl lg:text-9xl font-bold"
                            style={{
                                background: 'linear-gradient(180deg, #FFFFFF 0%, #4DA2FF 50%, #00B4FF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 60px rgba(77, 162, 255, 0.5))',
                            }}
                        >
                            in 10 seconds
                        </span>
                    </span>
                </h1>

                {/* Subtitle - Clean and minimal like Sui.io */}
                <p className="text-lg md:text-xl lg:text-2xl text-foreground-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
                    Blink Market delivers instant prediction markets
                    <br className="hidden md:block" />
                    powered by Sui blockchain
                </p>

                {/* CTA Buttons - Sui.io style (one filled, one outlined) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    {/* Primary CTA - Filled */}
                    <button
                        className="group flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
                        style={{
                            background: '#FFFFFF',
                            color: '#050B15',
                            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.15)',
                        }}
                    >
                        <Zap size={20} fill="currentColor" />
                        Start Betting
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* Secondary CTA - Outlined */}
                    <button
                        className="group flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white/5"
                        style={{
                            background: 'transparent',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                    >
                        How it works
                    </button>
                </div>

                {/* Feature Pills - Horizontal row */}
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    {features.map((feature, index) => (
                        <div
                            key={feature.label}
                            className="feature-pill flex items-center gap-2.5 px-5 py-3 rounded-full border border-white/10 text-sm md:text-base font-medium transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(12px)',
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <feature.icon size={18} className={feature.color} />
                            <span className="text-foreground/80">{feature.label}</span>
                        </div>
                    ))}
                </div>

                {/* Scroll indicator */}
                <div
                    className="mt-20 flex flex-col items-center gap-3 text-foreground-tertiary opacity-50"
                    style={{ animation: 'float 3s ease-in-out infinite' }}
                >
                    <span className="text-xs uppercase tracking-[0.2em]">Explore Markets</span>
                    <div className="w-6 h-10 rounded-full border border-current/50 p-1.5">
                        <div
                            className="w-1 h-2 rounded-full bg-current mx-auto"
                            style={{ animation: 'slide-down 1.5s ease-in-out infinite' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
