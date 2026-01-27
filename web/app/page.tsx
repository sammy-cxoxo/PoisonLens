"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DarkVeil from "@/components/DarkVeil";

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [latchedStep, setLatchedStep] = useState(0);
  const pinnedSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!pinnedSectionRef.current) {
            ticking = false;
            return;
          }

          const section = pinnedSectionRef.current;
          const rect = section.getBoundingClientRect();
          const sectionHeight = section.offsetHeight;
          const viewportHeight = window.innerHeight;

          if (rect.top <= 0 && rect.bottom >= viewportHeight) {
            const progress = Math.abs(rect.top) / (sectionHeight - viewportHeight);
            setScrollProgress(Math.min(Math.max(progress, 0), 1));
          } else if (rect.top > 0) {
            setScrollProgress(0);
          } else {
            setScrollProgress(1);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();


    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const start = 0.05;   
  const end   = 0.40;  

  let activeProgress = 0;

  if (scrollProgress <= start) {
    activeProgress = 0;
  } else if (scrollProgress >= end) {
    activeProgress = 1;
  } else {
    activeProgress = (scrollProgress - start) / (end - start);
  }

  const rawStep = Math.floor(activeProgress * 3);

  useEffect(() => {
    setLatchedStep(prev => Math.max(prev, rawStep));
  }, [rawStep]);

  const step = latchedStep;

  const sectionHeightClass = latchedStep >= 2 ? "h-[120vh]" : "h-[200vh]";


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
              <a href="#home" className="text-sm font-medium text-white transition-colors">
                Home
              </a>
              <Link href="/scanner" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Scanner
              </Link>
              <Link href="/contact" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-all"
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
              <a href="#home" className="block text-sm font-medium text-white transition-colors">
                Home
              </a>
              <Link href="/scanner" className="block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Scanner
              </Link>
              <Link href="/contact" className="block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with DarkVeil Background */}
      <div id="home" className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-black">
        {/* DarkVeil Background */}
        <div className="absolute inset-0 z-0">
          <DarkVeil
            hueShift={200}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
            resolutionScale={0.99}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tight bg-gradient-to-br from-white via-blue-100 to-slate-300 bg-clip-text text-transparent">
            Clean Your Data
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-xl text-slate-300">
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

      {/* Scroll-Driven Pinned Section - "How It Works" */}
      <div ref={pinnedSectionRef}   className={cx("relative transition-all duration-500 ease-out", sectionHeightClass)}>
        <div className="sticky top-32 mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-4xl font-semibold text-center mb-16 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div
              className={cx(
                "rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-blue-500/10 transition-all duration-700",
                step >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-br from-white to-blue-200 bg-clip-text text-transparent">
                Test Your Data
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Upload your JSONL dataset and let our advanced algorithms scan every line for quality issues,
                security vulnerabilities, and anomalies. Get comprehensive insights in seconds.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className={cx(
                "rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 transition-all duration-700 delay-150",
                step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-br from-white to-indigo-200 bg-clip-text text-transparent">
                An Actionable Plan
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Review detailed flagged samples with severity ratings, confidence scores, and preview snippets.
                Configure intelligent cleaning rules to exclude unwanted categories automatically.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className={cx(
                "rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 transition-all duration-700 delay-300",
                step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
            >
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-br from-white to-cyan-200 bg-clip-text text-transparent">
                A Connected Ecosystem
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Export your cleaned dataset with one click, ready for training or production.
                Integrate seamlessly with your ML pipeline and maintain data quality standards effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
