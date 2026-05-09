import { Zap, Timer, Shield, Gauge, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: Timer, label: "10s Markets" },
    { icon: Gauge, label: "Sui Speed" },
    { icon: Zap, label: "Instant Payouts" },
    { icon: Shield, label: "Fully On-Chain" },
  ];

  return (
    <div className="relative py-24 md:py-32 lg:py-40 mb-12 overflow-hidden min-h-[70vh] flex items-center">
      <div
        className={`w-full text-center max-w-6xl mx-auto px-4 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Hero Title — bold geometric display, the betting exchange signature */}
        <h1
          className="font-display mb-8"
          style={{ fontWeight: 800, lineHeight: 1.05 }}
        >
          {/* First line — smaller, medium weight */}
          <span
            className="block mb-2"
            style={{
              fontSize: "clamp(1.125rem, 2.5vw, 1.75rem)",
              fontWeight: 500,
              fontStyle: "normal",
              color: "oklch(78% 0.01 270)",
              lineHeight: 1.3,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Flash betting
          </span>
          {/* Second line — large bold display, neon accent */}
          <span
            className="block"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
              fontWeight: 800,
              fontStyle: "normal",
              color: "oklch(93% 0.01 270)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            in 10 seconds
          </span>
        </h1>

        {/* Subtitle — clean body text */}
        <p
          className="max-w-xl mx-auto mb-12 leading-relaxed"
          style={{
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "oklch(78% 0.01 270)",
          }}
        >
          Blink Market delivers instant prediction markets
          <br className="hidden md:block" />
          powered by Sui blockchain
        </p>

        {/* CTA Buttons — sharp exchange primary + inline secondary */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {/* Primary CTA — sharp, uppercase, letter-tracked */}
          <button className="btn-primary-editorial group flex items-center gap-2">
            <Zap size={18} />
            Start Betting
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* Secondary CTA — inline text link */}
          <a href="#how-it-works" className="btn-secondary-editorial">
            How it works
          </a>
        </div>

        {/* Feature Pills — dark with neon borders */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.label}
              className="feature-pill flex items-center gap-2.5 px-5 py-3 text-sm font-medium"
              style={{
                borderRadius: "4px",
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <feature.icon
                size={16}
                style={{ color: "oklch(72% 0.19 195)" }}
              />
              <span style={{ color: "oklch(78% 0.01 270)" }}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        {/* Scroll indicator — minimal */}
        <div
          className="mt-20 flex flex-col items-center gap-3"
          style={{
            color: "oklch(55% 0.02 270)",
            opacity: 0.5,
            animation: "float 3s ease-in-out infinite",
          }}
        >
          <span
            className="text-xs uppercase"
            style={{
              letterSpacing: "0.2em",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            Explore Markets
          </span>
          <div
            className="w-6 h-10 rounded-full p-1.5"
            style={{ border: "1px solid currentColor" }}
          >
            <div
              className="w-1 h-2 rounded-full mx-auto"
              style={{
                background: "currentColor",
                animation: "slide-down 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
