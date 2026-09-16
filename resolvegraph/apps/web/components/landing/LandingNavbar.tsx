'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';

export const LandingNavbar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-zinc-800/80 bg-bg-base/85 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Scroll Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-emerald-500 origin-left"
        style={{ scaleX }}
      />

      <div className="flex items-center gap-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tight shadow-subtle group-hover:bg-emerald-400 transition-colors">
            RG
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-zinc-100 leading-none">
              ResolveGraph
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
              v1.2
            </span>
          </div>
        </Link>

        {/* Section Navigation Links with Smooth Scroll */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400">
          <a href="#simulator" className="hover:text-zinc-100 transition-colors">
            Live Simulator
          </a>
          <a href="#architecture" className="hover:text-zinc-100 transition-colors">
            Architecture
          </a>
          <a href="#comparison" className="hover:text-zinc-100 transition-colors">
            Why Deterministic
          </a>
          <a href="#benchmarks" className="hover:text-zinc-100 transition-colors">
            Benchmarks
          </a>
        </nav>
      </div>

      {/* Action CTA */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all duration-150 active:scale-[0.98] shadow-subtle"
        >
          <span>Launch Console</span>
          <ArrowRight size={13} weight="bold" />
        </Link>
      </div>
    </header>
  );
};
