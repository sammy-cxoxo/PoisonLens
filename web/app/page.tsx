"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import Orb to prevent SSR issues and allow code splitting
const Orb = dynamic(() => import("@/components/Orb"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
});

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

// Interactive Accordion Item Component
function AccordionItem({ item, index }: { 
  item: { 
    question: string; 
    answer: string; 
    icon: string; 
    gradient: string; 
    borderColor: string;
  }; 
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 overflow-hidden transition-all duration-500",
        item.borderColor,
        isOpen ? "bg-gradient-to-br " + item.gradient : "bg-white/[0.02] hover:bg-white/[0.04]"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-6 text-left"
      >
        <span className="text-3xl">{item.icon}</span>
        <span className="flex-1 text-lg font-medium text-white">{item.question}</span>
        <svg 
          className={cx(
            "w-6 h-6 text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cx(
          "overflow-hidden transition-all duration-500 ease-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-6 pb-6 text-slate-300 leading-relaxed ml-14">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numberRefs = useRef<(HTMLDivElement | null)[]>([]);
  const emojiRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  // Scroll-linked animation using direct DOM manipulation for performance
  useEffect(() => {
    let rafId: number;
    
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        const sectionTop = rect.top;
        const animationStart = viewportHeight;
        const animationEnd = viewportHeight * 0.2;
        
        const overallProgress = Math.max(0, Math.min(1, 
          (animationStart - sectionTop) / (animationStart - animationEnd)
        ));

        // Calculate progress for each card
        const cardProgress = [
          Math.max(0, Math.min(1, overallProgress / 0.4)),
          Math.max(0, Math.min(1, (overallProgress - 0.2) / 0.4)),
          Math.max(0, Math.min(1, (overallProgress - 0.4) / 0.4)),
        ];

        // Update cards directly via refs (no state!)
        cardRefs.current.forEach((card, index) => {
          if (!card) return;
          const progress = cardProgress[index];
          
          const translateY = (1 - progress) * 120;
          const translateX = (1 - progress) * (index === 0 ? -60 : index === 2 ? 60 : 0);
          const scale = 0.7 + (progress * 0.3);
          const rotate = (1 - progress) * (index === 0 ? -8 : index === 2 ? 8 : 0);
          const blur = (1 - progress) * 10;
          
          card.style.opacity = String(Math.pow(progress, 0.5));
          card.style.transform = `translateY(${translateY}px) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`;
          card.style.filter = `blur(${blur}px)`;
        });

        // Update number badges
        numberRefs.current.forEach((num, index) => {
          if (!num) return;
          const progress = cardProgress[index];
          num.style.transform = `scale(${0.5 + progress * 0.5})`;
          num.style.opacity = String(progress);
        });

        // Update emojis
        emojiRefs.current.forEach((emoji, index) => {
          if (!emoji) return;
          const progress = cardProgress[index];
          emoji.style.transform = `scale(${0.6 + progress * 0.4}) rotate(${(1 - progress) * -20}deg)`;
        });

        // Update dots
        const dotColors = [
          { bg: 'rgb(59, 130, 246)', border: 'rgb(96, 165, 250)', shadow: 'rgba(59, 130, 246' },
          { bg: 'rgb(99, 102, 241)', border: 'rgb(129, 140, 248)', shadow: 'rgba(99, 102, 241' },
          { bg: 'rgb(6, 182, 212)', border: 'rgb(34, 211, 238)', shadow: 'rgba(6, 182, 212' },
        ];
        dotRefs.current.forEach((dot, index) => {
          if (!dot) return;
          const progress = cardProgress[index];
          const active = progress > 0.5;
          const colors = dotColors[index];
          
          dot.style.width = active ? '20px' : '16px';
          dot.style.height = active ? '20px' : '16px';
          dot.style.backgroundColor = active ? colors.bg : 'black';
          dot.style.borderColor = active ? colors.border : 'rgba(255,255,255,0.2)';
          dot.style.boxShadow = active ? `0 0 30px ${colors.shadow}, 0.8), 0 0 60px ${colors.shadow}, 0.4)` : 'none';
        });

        // Update progress line
        if (lineRef.current) {
          const lineProgress = (cardProgress[0] + cardProgress[1] + cardProgress[2]) / 3;
          lineRef.current.style.width = `${Math.max(0, Math.min(lineProgress * 83.33, 83.33))}%`;
          lineRef.current.style.boxShadow = `0 0 20px rgba(99, 102, 241, ${lineProgress * 0.8}), 0 0 40px rgba(99, 102, 241, ${lineProgress * 0.4})`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Memoize navigation items to prevent re-renders
  const navItems = useMemo(() => [
    { href: "#home", label: "Home", isActive: true },
    { href: "/scanner", label: "Scanner", isActive: false },
    { href: "/contact", label: "Contact", isActive: false },
  ], []);

  // Memoize card data
  const cards = useMemo(() => [
    {
      emoji: "🔍",
      title: "Test Your Data",
      description: "Upload your JSONL dataset and let our advanced algorithms scan every line for quality issues, security vulnerabilities, and anomalies. Get comprehensive insights in seconds.",
      borderColor: "border-blue-500/20",
      bgGradient: "from-blue-500/10",
      shadowColor: "shadow-blue-500/10",
      titleGradient: "to-blue-200",
    },
    {
      emoji: "📋",
      title: "An Actionable Plan",
      description: "Review detailed flagged samples with severity ratings, confidence scores, and preview snippets. Configure intelligent cleaning rules to exclude unwanted categories automatically.",
      borderColor: "border-indigo-500/20",
      bgGradient: "from-indigo-500/10",
      shadowColor: "shadow-indigo-500/10",
      titleGradient: "to-indigo-200",
    },
    {
      emoji: "🔗",
      title: "A Connected Ecosystem",
      description: "Export your cleaned dataset with one click, ready for training or production. Integrate seamlessly with your ML pipeline and maintain data quality standards effortlessly.",
      borderColor: "border-cyan-500/20",
      bgGradient: "from-cyan-500/10",
      shadowColor: "shadow-cyan-500/10",
      titleGradient: "to-cyan-200",
    },
  ], []);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Sticky Navigation */}
      <nav className="sticky top-4 z-50 mx-auto max-w-6xl px-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Brand */}
            <Link href="/" className="text-xl font-semibold tracking-tight">
              <span className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                PoisonLens
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                item.href.startsWith('#') ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "text-sm font-medium transition-colors",
                      item.isActive ? "text-white" : "text-slate-300 hover:text-white"
                    )}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "text-sm font-medium transition-colors",
                      item.isActive ? "text-white" : "text-slate-300 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-all"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 px-6 py-4 space-y-3">
              {navItems.map((item) => (
                item.href.startsWith('#') ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "block text-sm font-medium transition-colors",
                      item.isActive ? "text-white" : "text-slate-300 hover:text-white"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "block text-sm font-medium transition-colors",
                      item.isActive ? "text-white" : "text-slate-300 hover:text-white"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Orb Background */}
      <div id="home" className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-black">
        {/* Orb Background */}
        <div className="absolute inset-0 z-0">
          <Orb
            hoverIntensity={0.74}
            rotateOnHover
            hue={141}
            forceHoverState={false}
            backgroundColor="#000000"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-semibold tracking-tight bg-gradient-to-br from-white via-blue-100 to-slate-300 bg-clip-text text-transparent">
            Clean Your Data
          </h2>
          <p className="mt-8 max-w-2xl mx-auto text-lg text-slate-300">
            Scan JSONL datasets for quality issues, anomalies, and security risks.
            Clean and export your data with intelligent remediation rules.
          </p>
          <div className="mt-12">
            <Link
              href="/scanner"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-medium bg-white/10 text-white hover:bg-white/15 border border-white/20 shadow-lg shadow-white/5 transition-all duration-300"
            >
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* How It Works Section */}
      <div ref={sectionRef} className="relative py-24 bg-black">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-semibold text-center mb-20 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            How It Works
          </h2>

          {/* Cards container with progress line */}
          <div className="relative">
            {/* Horizontal progress line - background track */}
            <div className="absolute top-1/2 left-[8.33%] right-[8.33%] h-[2px] bg-white/10 -translate-y-1/2 z-0 hidden md:block rounded-full" />
            
            {/* Horizontal progress line - active fill */}
            <div 
              ref={lineRef}
              className="absolute top-1/2 left-[8.33%] h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 -translate-y-1/2 z-10 hidden md:block rounded-full will-change-transform"
              style={{ width: '0%' }}
            />

            {/* Progress dots at each card center */}
            <div className="absolute top-1/2 left-[16.67%] -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
              <div 
                ref={(el) => { dotRefs.current[0] = el; }}
                className="rounded-full border-2 will-change-transform"
                style={{ width: '16px', height: '16px', backgroundColor: 'black', borderColor: 'rgba(255,255,255,0.2)', transition: 'width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s' }}
              />
            </div>
            <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
              <div 
                ref={(el) => { dotRefs.current[1] = el; }}
                className="rounded-full border-2 will-change-transform"
                style={{ width: '16px', height: '16px', backgroundColor: 'black', borderColor: 'rgba(255,255,255,0.2)', transition: 'width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s' }}
              />
            </div>
            <div className="absolute top-1/2 left-[83.33%] -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
              <div 
                ref={(el) => { dotRefs.current[2] = el; }}
                className="rounded-full border-2 will-change-transform"
                style={{ width: '16px', height: '16px', backgroundColor: 'black', borderColor: 'rgba(255,255,255,0.2)', transition: 'width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
              {cards.map((card, index) => (
                <div
                  key={card.title}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  className={cx(
                    "rounded-2xl border p-10 backdrop-blur-md shadow-2xl will-change-transform",
                    card.borderColor,
                    `bg-gradient-to-br ${card.bgGradient} to-white/[0.02]`,
                    card.shadowColor,
                  )}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    opacity: 0,
                    transform: 'translateY(120px)',
                  }}
                >
                  {/* Step number */}
                  <div 
                    ref={(el) => { numberRefs.current[index] = el; }}
                    className={cx(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 will-change-transform",
                      `bg-gradient-to-br ${card.bgGradient.replace('/10', '/30')} to-white/10 border ${card.borderColor}`
                    )}
                    style={{ transform: 'scale(0.5)', opacity: 0 }}
                  >
                    {index + 1}
                  </div>
                  
                  <div 
                    ref={(el) => { emojiRefs.current[index] = el; }}
                    className="text-4xl mb-5 will-change-transform"
                    style={{ transform: 'scale(0.6) rotate(-20deg)' }}
                  >
                    {card.emoji}
                  </div>
                  <h3 className={cx(
                    "text-2xl font-semibold mb-5 bg-gradient-to-br from-white bg-clip-text text-transparent",
                    card.titleGradient
                  )}>
                    {card.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-base">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why This Matters Section */}
      <div className="relative py-32 bg-black">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-semibold text-center mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            Why This Matters
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-20">
            Bad data costs companies millions. Poisoned datasets can compromise your entire ML pipeline.
          </p>

          {/* Interactive Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[
              { value: "73%", label: "of datasets contain quality issues", color: "text-blue-400" },
              { value: "4.2M", label: "average cost of bad data per year", color: "text-indigo-400" },
              { value: "15x", label: "cheaper to prevent vs. fix issues", color: "text-cyan-400" },
              { value: "99.9%", label: "accuracy with proper cleaning", color: "text-emerald-400" },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500 cursor-default"
              >
                <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  {stat.label}
                </div>
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl ${
                  index === 0 ? 'bg-blue-500/10' : 
                  index === 1 ? 'bg-indigo-500/10' : 
                  index === 2 ? 'bg-cyan-500/10' : 
                  'bg-emerald-500/10'
                }`} />
              </div>
            ))}
          </div>

          {/* Interactive Accordion Cards */}
          <div className="space-y-4">
            {[
              {
                question: "What is data poisoning?",
                answer: "Data poisoning is the intentional manipulation of training data to compromise machine learning models. Attackers inject malicious samples that cause models to learn incorrect patterns, leading to security vulnerabilities, biased outputs, or complete model failure.",
                icon: "🛡️",
                gradient: "from-red-500/20 to-orange-500/10",
                borderColor: "hover:border-red-500/30",
              },
              {
                question: "How does bad data affect ML models?",
                answer: "Poor quality data leads to garbage-in, garbage-out scenarios. Models trained on inconsistent, duplicated, or mislabeled data exhibit reduced accuracy, unexpected behaviors, and fail to generalize. This results in costly retraining cycles and eroded trust in AI systems.",
                icon: "📉",
                gradient: "from-amber-500/20 to-yellow-500/10",
                borderColor: "hover:border-amber-500/30",
              },
              {
                question: "Why automate data cleaning?",
                answer: "Manual data inspection doesn't scale. With datasets containing millions of samples, automated scanning catches issues humans miss while reducing processing time from weeks to minutes. Consistent rule application ensures nothing slips through the cracks.",
                icon: "⚡",
                gradient: "from-blue-500/20 to-cyan-500/10",
                borderColor: "hover:border-blue-500/30",
              },
              {
                question: "What makes PoisonLens different?",
                answer: "PoisonLens combines statistical anomaly detection, semantic analysis, and security-focused scanning in one tool. We don't just find problems—we provide actionable remediation rules and one-click export of cleaned datasets ready for production.",
                icon: "✨",
                gradient: "from-indigo-500/20 to-purple-500/10",
                borderColor: "hover:border-indigo-500/30",
              },
            ].map((item, index) => (
              <AccordionItem key={item.question} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="relative py-16 bg-gradient-to-b from-black to-slate-950">
        <div className="pt-8 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-slate-500 text-sm">© 2026 PoisonLens. All rights reserved.</span>
            <div className="flex gap-6">
              <Link href="/scanner" className="text-slate-500 hover:text-white text-sm transition-colors">Scanner</Link>
              <Link href="/contact" className="text-slate-500 hover:text-white text-sm transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}