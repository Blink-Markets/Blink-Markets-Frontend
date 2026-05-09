import {
  Zap,
  Timer,
  Shield,
  Gauge,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ConnectButton,
  useCurrentAccount,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { useStore } from "@nanostores/react";

export function IntroductionPage() {
  const [isVisible, setIsVisible] = useState(false);
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const connection = useStore(dAppKit.stores.$connection);
  const activeAddress = account?.address ?? connection.account?.address;
  const isUserConnected = connection.isConnected && !!activeAddress;

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
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "oklch(13% 0.02 270)" }}
    >
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      {/* Header — dark exchange bar */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "oklch(16% 0.02 270 / 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(25% 0.03 270)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <img
                src="/logo1.png"
                alt="Blink Market"
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
              style={{
                color: "oklch(78% 0.01 270)",
                textDecoration: "none",
                borderBottom: "1px solid oklch(72% 0.19 195)",
                paddingBottom: "1px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "oklch(72% 0.19 195)";
                e.currentTarget.style.borderBottomColor = "oklch(72% 0.19 195)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "oklch(78% 0.01 270)";
                e.currentTarget.style.borderBottomColor = "oklch(72% 0.19 195)";
              }}
            >
              Go to Markets
              <ArrowRight size={12} />
            </Link>

            {isUserConnected && activeAddress && (
              <div
                className="hidden md:block px-3 py-1.5 text-xs font-mono"
                style={{
                  background: "oklch(72% 0.19 195 / 0.1)",
                  color: "oklch(72% 0.19 195)",
                  borderRadius: "4px",
                  border: "1px solid oklch(72% 0.19 195 / 0.25)",
                }}
              >
                {`${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`}
              </div>
            )}

            <ConnectButton />
          </div>
        </div>
      </header>

      <main
        className="container mx-auto px-6 py-8 relative z-10"
        style={{ maxWidth: "1400px" }}
      >
        {/* Hero Section */}
        <div className="relative py-24 md:py-32 lg:py-40 mb-12 overflow-hidden min-h-[70vh] flex items-center">
          <div
            className={`w-full text-center max-w-6xl mx-auto px-4 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Hero Title — bold geometric display, the betting exchange signature */}
            <h1
              className="font-display mb-8"
              style={{ fontWeight: 800, lineHeight: 1.05 }}
            >
              {/* First line — smaller, uppercase tracked */}
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
              {/* Second line — large bold display */}
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
              <Link
                to="/"
                className="btn-primary-editorial group flex items-center gap-2"
              >
                <Zap size={18} />
                Start Betting
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

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
                Learn More
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

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="mt-24 py-20 scroll-mt-20"
          style={{ borderTop: "1px solid oklch(25% 0.03 270)" }}
        >
          <div className="text-center mb-14">
            <div className="accent-label mb-4">Simple & Fast</div>
            <h2
              className="font-display mb-4"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "oklch(93% 0.01 270)",
                letterSpacing: "-0.02em",
              }}
            >
              How It Works
            </h2>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "oklch(78% 0.01 270)", lineHeight: 1.6 }}
            >
              Flash betting made simple. Three steps to place your prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Pick Your Side",
                description:
                  "Choose your prediction for the next live event moment. Will it be Team A or Team B?",
                accentColor: "oklch(72% 0.19 155)",
              },
              {
                step: "02",
                title: "Bet Fast",
                description:
                  "You have ~10 seconds before the market closes. Select your amount and confirm instantly.",
                accentColor: "oklch(72% 0.19 195)",
              },
              {
                step: "03",
                title: "Win Instantly",
                description:
                  "Results are determined immediately. Winnings are paid out automatically to your wallet.",
                accentColor: "oklch(75% 0.16 85)",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative group p-7 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: "oklch(16% 0.02 270)",
                  border: "1px solid oklch(25% 0.03 270)",
                  borderRadius: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = item.accentColor;
                  e.currentTarget.style.boxShadow = `0 4px 24px -4px ${item.accentColor} / 0.15, 0 0 1px ${item.accentColor} / 0.4)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(25% 0.03 270)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Step number — display font, bold */}
                <div
                  className="font-display mb-4"
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    fontStyle: "normal",
                    color: item.accentColor,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.step}
                </div>

                <h3
                  className="text-xl font-display mb-3"
                  style={{ fontWeight: 500, color: "oklch(93% 0.01 270)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "oklch(55% 0.02 270)" }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section — dark exchange */}
        <section
          className="mt-16 mb-10 py-16 px-10 relative"
          style={{ borderTop: "1px solid oklch(25% 0.03 270)" }}
        >
          <div className="text-center max-w-2xl mx-auto relative z-10">
            <h2
              className="font-display mb-5"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                fontStyle: "normal",
                color: "oklch(93% 0.01 270)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Ready to make your first flash bet?
            </h2>
            <p
              className="text-base mb-8"
              style={{ color: "oklch(78% 0.01 270)", lineHeight: 1.6 }}
            >
              Connect your Sui wallet and start betting on live events with
              sub-second finality.
            </p>
            <div className="flex justify-center gap-4">
              <ConnectButton />
              <Link to="/" className="btn-secondary-editorial">
                Explore Markets
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer — dark exchange */}
      <footer
        style={{
          borderTop: "1px solid oklch(25% 0.03 270)",
          background: "oklch(13% 0.02 270)",
        }}
      >
        <div
          className="container mx-auto px-6 py-10"
          style={{ maxWidth: "1400px" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img
                src="/logo1.png"
                alt="Blink Market"
                className="h-10 w-auto"
              />
            </div>

            <p
              className="text-sm text-center flex items-center gap-2"
              style={{ color: "oklch(55% 0.02 270)" }}
            >
              Built on{" "}
              <span style={{ fontWeight: 600, color: "oklch(72% 0.19 195)" }}>
                Sui
              </span>
              {" · "}Powered by Flash Transactions{" · "}Bet Responsibly
            </p>

            <div
              className="flex items-center gap-5 text-sm"
              style={{ color: "oklch(55% 0.02 270)" }}
            >
              <a
                href="#"
                className="transition-colors duration-200"
                style={{ textDecoration: "none", color: "oklch(55% 0.02 270)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                }}
              >
                Terms
              </a>
              <a
                href="#"
                className="transition-colors duration-200"
                style={{ textDecoration: "none", color: "oklch(55% 0.02 270)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                }}
              >
                Privacy
              </a>
              <a
                href="#"
                className="transition-colors duration-200"
                style={{ textDecoration: "none", color: "oklch(55% 0.02 270)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(72% 0.19 195)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(55% 0.02 270)";
                }}
              >
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
