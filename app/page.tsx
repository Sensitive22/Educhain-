"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, DollarSign, Users, Mail, Lock,
  GraduationCap, ArrowRight, X, Github, Linkedin,
  MapPin, Award, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
declare global { interface Window { ethereum?: any; } }
type LoginStep = 'initial' | 'login-form' | 'signup-form';
interface TeamMember {
  name: string; role: string; email: string; bio: string;
  expertise: string[]; achievements: string[]; location: string;
  social?: { github?: string; linkedin?: string; };
}

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS — light violet theme matching dashboard
───────────────────────────────────────────────────────── */
const T = {
  /* backgrounds */
  pageBg:       '#f6f4ff',   /* very soft violet-white */
  heroBg:       '#09051c',   /* hero stays dark for drama */
  surface:      '#ffffff',
  surfaceHover: '#faf8ff',
  /* violet palette */
  v50:  '#f5f3ff',
  v100: '#ede9fe',
  v200: '#ddd6fe',
  v300: '#c4b5fd',
  v400: '#a78bfa',
  v500: '#8b5cf6',
  v600: '#7c3aed',
  v700: '#6d28d9',
  v900: '#4c1d95',
  /* text */
  textPrimary: '#1e1b4b',   /* indigo-950 */
  textMuted:   '#6b7280',
  textDimmer:  '#9ca3af',
  textOnDark:  'rgba(255,255,255,0.88)',
  textDimDark: 'rgba(255,255,255,0.45)',
  /* border */
  border:      '#ede9fe',
  borderDark:  'rgba(139,92,246,0.18)',
  /* hero dark surface */
  heroCard:    'rgba(255,255,255,0.04)',
};

/* Gradient button style */
const primaryBtn: React.CSSProperties = {
  background: `linear-gradient(135deg, ${T.v500}, ${T.v700})`,
  color: '#fff',
  borderRadius: 999,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  border: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: `0 4px 24px rgba(109,40,217,0.28)`,
  transition: 'all 0.3s ease',
};

/* ─────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return y;
}

function useMouse() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return pos;
}

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────────────────────────────────────────────────
   REVEAL WRAPPER
───────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '', from = 'bottom' }: {
  children: React.ReactNode; delay?: number; className?: string;
  from?: 'bottom' | 'left' | 'right';
}) {
  const { ref, visible } = useReveal();
  const txMap = { bottom: '0,52px', left: '-52px,0', right: '52px,0' };
  const [dx, dy] = txMap[from].split(',');
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0,0)' : `translate(${dx},${dy})`,
      transition: `opacity 0.85s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.85s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      willChange: 'opacity,transform',
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CUSTOM CURSOR — only shown when inside .ec-landing
───────────────────────────────────────────────────────── */
function Cursor({ mouse }: { mouse: { x: number; y: number } }) {
  const [trail, setTrail] = useState({ x: -100, y: -100 });
  const [big, setBig] = useState(false);
  const trailRef = useRef({ x: -100, y: -100 });

  /* smooth lerp trail */
  useEffect(() => {
    let raf: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const loop = () => {
      trailRef.current.x = lerp(trailRef.current.x, mouse.x, 0.10);
      trailRef.current.y = lerp(trailRef.current.y, mouse.y, 0.10);
      setTrail({ x: trailRef.current.x, y: trailRef.current.y });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mouse]);

  /* scale up on interactive elements */
  useEffect(() => {
    const on = () => setBig(true);
    const off = () => setBig(false);
    const root = document.querySelector('.ec-landing');
    if (!root) return;
    const els = root.querySelectorAll('button,a,input,textarea,select');
    els.forEach(el => { el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off); });
    return () => els.forEach(el => { el.removeEventListener('mouseenter', on); el.removeEventListener('mouseleave', off); });
  });

  return (
    <>
      {/* Sharp dot — exact mouse position */}
      <div style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999,
        width: 8, height: 8, borderRadius: '50%',
        background: T.v400,
        transform: `translate(${mouse.x - 4}px, ${mouse.y - 4}px)`,
        willChange: 'transform',
        boxShadow: `0 0 8px ${T.v400}`,
      }} />
      {/* Lagging ring */}
      <div style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9998,
        width: 38, height: 38, borderRadius: '50%',
        border: `1.5px solid ${T.v400}`,
        transform: `translate(${trail.x - 19}px, ${trail.y - 19}px) scale(${big ? 1.9 : 1})`,
        opacity: big ? 0.45 : 0.22,
        transition: 'transform 0.55s cubic-bezier(.25,.46,.45,.94), opacity 0.3s ease',
        willChange: 'transform',
      }} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   NOISE OVERLAY
───────────────────────────────────────────────────────── */
function Noise() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.032, mixBlendMode: 'overlay' }}>
      <svg width="100%" height="100%">
        <filter id="fn2"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#fn2)" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAGNETIC BUTTON
───────────────────────────────────────────────────────── */
function MagBtn({ children, style = {}, onClick }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} onClick={onClick} style={{ transition: 'transform 0.45s cubic-bezier(.25,.46,.45,.94)', ...style }}
      onMouseMove={e => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.28;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = `translate(${x}px,${y}px) scale(1.04)`;
      }}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = 'translate(0,0) scale(1)'; }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const { ref, visible } = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start: number;
    const dur = 1800;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────
   3-D TILT CARD
───────────────────────────────────────────────────────── */
function Tilt({ children, style = {}, className = '' }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={className}
      style={{ transition: 'transform 0.55s cubic-bezier(.25,.46,.45,.94)', transformStyle: 'preserve-3d', ...style }}
      onMouseMove={e => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
      }}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale(1)'; }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARALLAX ORB
───────────────────────────────────────────────────────── */
function Orb({ top, left, size, color, blur, scrollY = 0, scrollRate = 0, normX = 0, normY = 0, mxR = 0, myR = 0 }: {
  top: number; left: number; size: number; color: string; blur: number;
  scrollY?: number; scrollRate?: number; normX?: number; normY?: number; mxR?: number; myR?: number;
}) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      top: `calc(${top}% + ${scrollY * scrollRate}px)`,
      left: `${left}%`,
      width: size, height: size,
      background: color,
      filter: `blur(${blur}px)`,
      opacity: 0.42,
      transform: `translate(-50%,-50%) translate(${normX * mxR * 36}px, ${normY * myR * 36}px)`,
      transition: 'transform 1s cubic-bezier(.25,.46,.45,.94)',
      willChange: 'transform',
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION CHIP LABEL
───────────────────────────────────────────────────────── */
function Chip({ label, light = false }: { label: string; light?: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 14px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: "'DM Sans', sans-serif",
      background: light ? T.v100 : 'rgba(139,92,246,0.12)',
      border: `1px solid ${light ? T.v200 : 'rgba(139,92,246,0.22)'}`,
      color: light ? T.v700 : T.v300,
    }}>
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────── */
function SectionHead({ chip, title, sub, light = false }: {
  chip: string; title: string; sub: string; light?: boolean;
}) {
  return (
    <Reveal>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <Chip label={chip} light={light} />
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem,4.5vw,3.2rem)',
          fontWeight: 900,
          letterSpacing: '-0.035em',
          color: light ? T.textPrimary : '#fff',
          margin: '18px 0 12px',
        }}>
          {title}
        </h2>
        <p style={{ color: light ? T.textMuted : T.textDimDark, fontSize: 16, fontFamily: "'DM Sans', sans-serif", maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
          {sub}
        </p>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────
   GRID LINES (hero only)
───────────────────────────────────────────────────────── */
function Grid() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {[18, 36, 54, 72].map(p => <div key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(139,92,246,0.07)' }} />)}
      {[25, 50, 75].map(p => <div key={p} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: 'rgba(139,92,246,0.07)' }} />)}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────────────── */
function Nav({ scrollY, onLogin, onSignup }: { scrollY: number; onLogin: () => void; onSignup: () => void }) {
  const scrolled = scrollY > 60;
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 48px',
      backdropFilter: scrolled ? 'blur(18px) saturate(1.4)' : 'none',
      background: scrolled ? 'rgba(9,5,28,0.78)' : 'transparent',
      borderBottom: `1px solid ${scrolled ? T.borderDark : 'transparent'}`,
      transition: 'all 0.5s cubic-bezier(.16,1,.3,1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.v500},${T.v700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 18px rgba(139,92,246,0.42)` }}>
          <GraduationCap size={17} color="#fff" />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#fff', fontSize: 17, letterSpacing: '-0.01em' }}>EduChain</span>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        {['features', 'about', 'contact'].map(s => (
          <button key={s} onClick={() => scrollTo(s)} style={{
            background: 'none', border: 'none', color: T.textDimDark, fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em', textTransform: 'capitalize', transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = T.textDimDark)}
          >{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onLogin} style={{ background: 'none', border: 'none', color: T.textDimDark, fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = T.textDimDark)}
        >Log in</button>
        <MagBtn onClick={onSignup} style={{ ...primaryBtn, padding: '10px 22px', fontSize: 13 }}>
          Get Started <ArrowRight size={13} />
        </MagBtn>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────
   HERO  (dark — keeps the dramatic feel)
───────────────────────────────────────────────────────── */
function Hero({ scrollY, mouse, onSignup }: { scrollY: number; mouse: { x: number; y: number }; onSignup: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const W = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const H = typeof window !== 'undefined' ? window.innerHeight : 900;
  const nx = (mouse.x / W) - 0.5;
  const ny = (mouse.y / H) - 0.5;

  const fade = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(36px)',
    transition: `opacity 1s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 1s cubic-bezier(.16,1,.3,1) ${delay}ms`,
  });

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: T.heroBg }}>
      <Noise />
      <Grid />

      {/* Mouse + scroll parallax orbs */}
      <Orb top={18} left={13} size={640} color={`radial-gradient(circle,${T.v600},${T.v900} 55%,transparent)`} blur={130} scrollY={scrollY} scrollRate={-0.07} normX={nx} normY={ny} mxR={1} myR={1} />
      <Orb top={74} left={83} size={520} color={`radial-gradient(circle,#5b21b6,#1e1b4b 55%,transparent)`} blur={115} scrollY={scrollY} scrollRate={0.04} normX={nx} normY={ny} mxR={-0.7} myR={-0.7} />
      <Orb top={45} left={58} size={300} color={`radial-gradient(circle,${T.v400},${T.v600} 55%,transparent)`} blur={90} scrollY={scrollY} scrollRate={-0.03} normX={nx} normY={ny} mxR={0.5} myR={0.5} />
      <Orb top={28} left={72} size={170} color={`radial-gradient(circle,${T.v300},${T.v500})`} blur={60} scrollY={scrollY} scrollRate={0.06} normX={nx} normY={ny} mxR={-0.4} myR={-0.4} />

      {/* Decorative spinning rings */}
      <div style={{ position: 'absolute', top: '42%', left: '50%', width: 560, height: 560, borderRadius: '50%', border: `1px solid rgba(139,92,246,0.13)`, pointerEvents: 'none', zIndex: 1, transform: `translate(-50%,-50%) translateY(${scrollY * 0.12}px)`, animation: 'ec-spin 32s linear infinite' }} />
      <div style={{ position: 'absolute', top: '42%', left: '50%', width: 780, height: 780, borderRadius: '50%', border: `1px solid rgba(139,92,246,0.06)`, pointerEvents: 'none', zIndex: 1, transform: `translate(-50%,-50%) translateY(${scrollY * 0.08}px)`, animation: 'ec-spin 55s linear infinite reverse' }} />

      {/* Content — scrolls up with parallax */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 780, padding: '0 24px', transform: `translateY(${scrollY * -0.18}px)`, willChange: 'transform' }}>

        {/* Badge */}
        <div style={{ ...fade(80), display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 999, border: `1px solid rgba(139,92,246,0.35)`, background: 'rgba(139,92,246,0.1)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.v400, display: 'inline-block', boxShadow: `0 0 8px ${T.v400}`, animation: 'ec-pulse 2s ease infinite' }} />
          <span style={{ color: T.v300, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.05em' }}>
            Blockchain-powered education
          </span>
        </div>

        {/* H1 */}
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(3rem,9vw,7.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.94, margin: '0 0 28px', color: '#fff' }}>
          <span style={{ display: 'block', ...fade(220) }}>Learn Without</span>
          <span style={{
            display: 'block', ...fade(400),
            background: `linear-gradient(90deg,${T.v400},${T.v300},${T.v500})`,
            backgroundSize: '200%', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
            animation: 'ec-shimmer 4s linear infinite',
          }}>
            Boundaries.
          </span>
        </h1>

        {/* Sub */}
        <p style={{ ...fade(540), color: T.textDimDark, fontSize: 18, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, maxWidth: 520, margin: '0 auto 44px' }}>
          EduChain connects teachers and learners directly through decentralized technology — no middlemen, no barriers, just knowledge.
        </p>

        {/* CTAs */}
        <div style={{ ...fade(660), display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <MagBtn onClick={onSignup} style={{ ...primaryBtn, padding: '16px 34px', fontSize: 15 }}>
            Start Learning Free <ArrowRight size={16} />
          </MagBtn>
          <MagBtn
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '16px 34px', borderRadius: 999, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
              border: `1px solid rgba(255,255,255,0.16)`, background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.78)', fontWeight: 600, transition: 'background 0.3s',
            }}
          >
            See How It Works
          </MagBtn>
        </div>

        {/* Stats */}
        <div style={{ ...fade(820), display: 'flex', gap: 52, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ v: 10000, s: '+', l: 'Learners' }, { v: 500, s: '+', l: 'Educators' }, { v: 100, s: '%', l: 'On-Chain' }].map(({ v, s, l }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                <Counter to={v} suffix={s} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, marginTop: 4, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{ position: 'absolute', bottom: 36, left: '50%', zIndex: 2, opacity: 0.38, animation: 'ec-bounce 2s ease infinite' }}>
        <ChevronDown size={22} color="#fff" />
      </div>

      {/* Gradient transition to light sections */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, background: `linear-gradient(to bottom, transparent, ${T.pageBg})`, pointerEvents: 'none', zIndex: 2 }} />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   MARQUEE STRIP  (matches dashboard's soft violet tones)
───────────────────────────────────────────────────────── */
const TAGS = ['Smart Contracts', 'IPFS Storage', 'NFT Certificates', 'DAO Governance', 'Token Rewards', 'On-Chain Grades', 'Peer Reviews', 'Live Sessions', 'Polygon Network', 'ZK Proofs'];

function Strip() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '14px 0', background: T.v100, borderTop: `1px solid ${T.v200}`, borderBottom: `1px solid ${T.v200}` }}>
      <div style={{ display: 'flex', gap: 20, animation: 'ec-marquee 24s linear infinite', width: 'max-content', willChange: 'transform' }}>
        {[...TAGS, ...TAGS, ...TAGS].map((t, i) => (
          <span key={i} style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: '5px 14px', borderRadius: 999, border: `1px solid ${T.v200}`, background: T.surface, color: T.v700, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FEATURES  (light theme — white cards like dashboard)
───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Shield, title: 'Decentralized & Secure', desc: 'Your credentials and data are stored immutably on-chain. No single point of failure, no data breaches.', iconBg: '#f0fdf4', iconColor: '#16a34a', accent: '#dcfce7' },
  { icon: DollarSign, title: 'Affordable Subscriptions', desc: 'Payments flow directly to creators via smart contracts. No platform cuts, no hidden fees.', iconBg: '#faf5ff', iconColor: T.v600, accent: T.v100 },
  { icon: Users, title: 'Direct Connection', desc: 'Build real educator-to-learner relationships without algorithmic interference or gatekeeping.', iconBg: '#fff7ed', iconColor: '#ea580c', accent: '#ffedd5' },
];

function Features() {
  return (
    <section id="features" style={{ position: 'relative', padding: '120px 0', background: T.pageBg, overflow: 'hidden' }}>
      {/* Soft ambient blob */}
      <div style={{ position: 'absolute', top: '40%', left: '50%', width: 800, height: 600, borderRadius: '50%', background: `radial-gradient(ellipse, ${T.v100} 0%, transparent 65%)`, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 1 }}>
        <SectionHead chip="Platform Features" title="Why EduChain?" sub="We've rethought education infrastructure from the ground up." light />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px,1fr))', gap: 22 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 130}>
              <Tilt style={{ height: '100%' }}>
                <div style={{
                  height: '100%', background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: 36,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: `0 2px 8px rgba(109,40,217,0.05), 0 8px 32px rgba(109,40,217,0.04)`,
                  transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px rgba(109,40,217,0.12), 0 12px 40px rgba(109,40,217,0.08)`;
                    (e.currentTarget as HTMLElement).style.borderColor = T.v200;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 8px rgba(109,40,217,0.05), 0 8px 32px rgba(109,40,217,0.04)`;
                    (e.currentTarget as HTMLElement).style.borderColor = T.border;
                  }}
                >
                  {/* shimmer sweep on hover */}
                  <div className="ec-card-shimmer" />

                  {/* Accent top stripe */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${f.iconColor}40, ${f.iconColor}88, ${f.iconColor}40)`, borderRadius: '20px 20px 0 0' }} />

                  {/* Icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, border: `1px solid ${f.accent}` }}>
                    <f.icon size={22} color={f.iconColor} />
                  </div>

                  <h3 style={{ fontFamily: "'Syne', sans-serif", color: T.textPrimary, fontSize: 19, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
                  <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   TEAM  (light — white cards with violet avatar gradient)
───────────────────────────────────────────────────────── */
const TEAM: TeamMember[] = [
  { name: 'Gautam Shaw', role: 'Blockchain Developer', email: 'gautamsaw10@gmail.com', bio: 'Full-stack developer with deep expertise in blockchain technology and decentralized applications.', expertise: ['Smart Contracts', 'Solidity', 'Web3.js', 'React', 'Polygon'], achievements: ['Built 10+ DApps on Ethereum', 'Open-source contributor', 'Web3 conference speaker'], location: 'Mumbai, India', social: { github: 'https://github.com/gautamshaw', linkedin: 'https://linkedin.com/in/gautamshaw' } },
  { name: 'Raj Prajapati', role: 'IoT & Blockchain Specialist', email: 'rajprajapati_iot_2022@ltce.com', bio: 'IoT engineer and blockchain enthusiast building innovative educational platforms.', expertise: ['IoT Solutions', 'Blockchain Integration', 'Embedded Systems', 'Python'], achievements: ['IoT-based attendance systems', 'Published research on IoT+blockchain', 'Student IoT mentor'], location: 'Mumbai, India', social: { linkedin: 'https://linkedin.com/in/rajprajapati' } },
  { name: 'Shubham Sharma', role: 'Full-Stack Developer', email: 'contact@platform', bio: 'Product engineer focused on bridging Web2 UX with Web3 capabilities for mainstream adoption.', expertise: ['Next.js', 'TypeScript', 'Solidity', 'UX Design'], achievements: ['Led platform architecture', 'Designed onboarding flow', 'Performance optimization lead'], location: 'Mumbai, India', social: {} },
];

function Team({ onSelect }: { onSelect: (m: TeamMember) => void }) {
  return (
    <section id="about" style={{ position: 'relative', padding: '120px 0', background: T.surface, overflow: 'hidden' }}>
      {/* divider */}
      <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: `linear-gradient(90deg, transparent, ${T.v200}, transparent)` }} />
      {/* ambient */}
      <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${T.v50} 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 1 }}>
        <SectionHead chip="Our Team" title="The Builders" sub="Passionate technologists making decentralized education a reality." light />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 22 }}>
          {TEAM.map((m, i) => (
            <Reveal key={i} delay={i * 110} from={(['left', 'bottom', 'right'] as const)[i]}>
              <Tilt>
                <button onClick={() => onSelect(m)} style={{
                  all: 'unset', display: 'block', width: '100%', textAlign: 'left',
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20,
                  padding: 32, position: 'relative', overflow: 'hidden',
                  boxShadow: `0 2px 8px rgba(109,40,217,0.04)`,
                  transition: 'all 0.3s ease',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = `0 8px 30px rgba(109,40,217,0.10)`;
                    el.style.borderColor = T.v200;
                    el.style.background = T.v50;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = `0 2px 8px rgba(109,40,217,0.04)`;
                    el.style.borderColor = T.border;
                    el.style.background = T.surface;
                  }}
                >
                  {/* shimmer sweep */}
                  <div className="ec-card-shimmer" />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    {/* Avatar with spinning ring */}
                    <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 16, background: `linear-gradient(135deg, ${T.v500}, ${T.v700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: '#fff' }}>
                        {m.name[0]}
                      </div>
                      {/* Spinning border ring */}
                      <div style={{ position: 'absolute', inset: -3, borderRadius: 19, border: `1.5px solid ${T.v300}`, opacity: 0.5, animation: 'ec-spin-simple 8s linear infinite', pointerEvents: 'none' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: T.textPrimary, fontSize: 15 }}>{m.name}</div>
                      <div style={{ color: T.v600, fontSize: 12, marginTop: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{m.role}</div>
                    </div>
                  </div>

                  <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>{m.bio}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textDimmer, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                    <MapPin size={10} /> {m.location}
                  </div>

                  <div className="ec-team-cta" style={{ marginTop: 14, color: T.v600, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: 0, transition: 'opacity 0.3s' }}>
                    View profile <ArrowRight size={11} />
                  </div>
                </button>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   CONTACT  (light card matching dashboard contact style)
───────────────────────────────────────────────────────── */
function Contact() {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", color: T.textPrimary,
    background: T.v50, border: `1px solid ${T.v200}`,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.25s, box-shadow 0.25s',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: T.textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' };

  return (
    <section id="contact" style={{ position: 'relative', padding: '120px 0', background: T.pageBg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: `linear-gradient(90deg, transparent, ${T.v200}, transparent)` }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${T.v100} 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 40px', position: 'relative', zIndex: 1 }}>
        <SectionHead chip="Contact" title="Get In Touch" sub="Have questions about EduChain? We'd love to hear from you." light />

        <Reveal delay={100}>
          <form onSubmit={e => e.preventDefault()} style={{ maxWidth: 640, margin: '0 auto', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: 48, boxShadow: `0 4px 24px rgba(109,40,217,0.06)` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              {[{ l: 'Your Name', t: 'text', p: 'Jane Doe' }, { l: 'Email', t: 'email', p: 'jane@example.com' }].map(({ l, t, p }) => (
                <div key={l}>
                  <label style={labelStyle}>{l}</label>
                  <input type={t} placeholder={p} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = T.v500; e.target.style.boxShadow = `0 0 0 3px ${T.v100}`; }}
                    onBlur={e => { e.target.style.borderColor = T.v200; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Subject</label>
              <input type="text" placeholder="How can we help?" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = T.v500; e.target.style.boxShadow = `0 0 0 3px ${T.v100}`; }}
                onBlur={e => { e.target.style.borderColor = T.v200; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Message</label>
              <textarea rows={5} placeholder="Tell us more…" style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => { e.target.style.borderColor = T.v500; e.target.style.boxShadow = `0 0 0 3px ${T.v100}`; }}
                onBlur={e => { e.target.style.borderColor = T.v200; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <MagBtn style={{ ...primaryBtn, width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 15 }}>
              Send Message <ArrowRight size={16} />
            </MagBtn>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${T.v500},${T.v700})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={14} color="#fff" />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: T.textPrimary, fontSize: 15 }}>EduChain</span>
      </div>
      <p style={{ color: T.textDimmer, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
        © 2025 EduChain. Built for the decentralized future of education.
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   AUTH MODAL  (dark — keeps premium feel for login)
───────────────────────────────────────────────────────── */
function AuthModal({ step, onClose, email, setEmail, password, setPassword, selectedRole, setSelectedRole, error, isAuthenticating, onLogin, onSignup, switchLogin, switchSignup }: {
  step: LoginStep; onClose: () => void; email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  selectedRole: 'student' | 'teacher' | null; setSelectedRole: (v: 'student' | 'teacher' | null) => void;
  error: string; isAuthenticating: boolean; onLogin: () => void; onSignup: () => void;
  switchLogin: () => void; switchSignup: () => void;
}) {
  if (step === 'initial') return null;
  const isLogin = step === 'login-form';

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", color: '#fff', background: 'rgba(255,255,255,0.06)',
    border: `1px solid rgba(139,92,246,0.25)`, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.25s',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0f0a24', border: `1px solid rgba(139,92,246,0.28)`, borderRadius: 28, padding: 40, position: 'relative', boxShadow: '0 0 100px rgba(109,40,217,0.30)', animation: 'ec-modal-in 0.45s cubic-bezier(.16,1,.3,1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: 'none', color: T.textDimDark }}>
          <X size={15} />
        </button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, rgba(139,92,246,0.28), rgba(109,40,217,0.28))`, border: `1px solid rgba(139,92,246,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <GraduationCap size={22} color={T.v300} />
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
            {isLogin ? 'Welcome back' : 'Join EduChain'}
          </h2>
          <p style={{ color: T.textDimDark, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            {isLogin ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {!isLogin && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {(['student', 'teacher'] as const).map(r => (
              <button key={r} onClick={() => setSelectedRole(r)} style={{
                flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textTransform: 'capitalize',
                background: selectedRole === r ? `linear-gradient(135deg,${T.v500},${T.v700})` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selectedRole === r ? T.v500 : 'rgba(139,92,246,0.22)'}`,
                color: selectedRole === r ? '#fff' : T.textDimDark,
                transition: 'all 0.25s',
              }}>{r}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {[
            { type: 'email', ph: 'Email address', val: email, set: setEmail, Icon: Mail },
            { type: 'password', ph: 'Password', val: password, set: setPassword, Icon: Lock },
          ].map(({ type, ph, val, set, Icon }) => (
            <div key={type} style={{ position: 'relative' }}>
              <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textDimDark }} />
              <input type={type} placeholder={ph} value={val} onChange={e => set(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') isLogin ? onLogin() : onSignup(); }}
                style={iStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.25)')}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <MagBtn onClick={isLogin ? onLogin : onSignup} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 14, opacity: isAuthenticating ? 0.6 : 1, pointerEvents: isAuthenticating ? 'none' : 'auto' }}>
          {isAuthenticating ? 'Processing…' : isLogin ? 'Sign In' : 'Create Account'}
        </MagBtn>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={isLogin ? switchSignup : switchLogin} style={{ background: 'none', border: 'none', color: T.v400, fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MEMBER MODAL  (light — matches dashboard card style)
───────────────────────────────────────────────────────── */
function MemberModal({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  if (!member) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 500, maxHeight: '88vh', overflowY: 'auto', background: T.surface, border: `1px solid ${T.v200}`, borderRadius: 28, padding: 40, position: 'relative', boxShadow: `0 24px 80px rgba(109,40,217,0.18)`, animation: 'ec-modal-in 0.45s cubic-bezier(.16,1,.3,1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.v100, border: `1px solid ${T.v200}`, color: T.v600 }}>
          <X size={14} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg,${T.v500},${T.v700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
            {member.name[0]}
          </div>
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", color: T.textPrimary, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{member.name}</h3>
            <p style={{ color: T.v600, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: '0 0 4px' }}>{member.role}</p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textDimmer, fontSize: 11, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
              <MapPin size={10} />{member.location}
            </p>
          </div>
        </div>

        <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", marginBottom: 24 }}>{member.bio}</p>

        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDimmer, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Expertise</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {member.expertise.map(e => (
              <span key={e} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, border: `1px solid ${T.v200}`, background: T.v50, color: T.v700, fontFamily: "'DM Sans', sans-serif" }}>{e}</span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDimmer, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Achievements</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {member.achievements.map(a => (
              <li key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: T.textMuted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                <Award size={13} color={T.v500} style={{ flexShrink: 0, marginTop: 1 }} />{a}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: T.textDimmer, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{member.email}</span>
          <div style={{ display: 'flex', gap: 14 }}>
            {member.social?.github && (
              <a href={member.social.github} target="_blank" rel="noopener" style={{ color: T.textMuted, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.v600)}
                onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>
                <Github size={17} />
              </a>
            )}
            {member.social?.linkedin && (
              <a href={member.social.linkedin} target="_blank" rel="noopener" style={{ color: T.textMuted, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.v600)}
                onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>
                <Linkedin size={17} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SPLASH SCREEN
   Phase 1 (0–600ms):   logo icon scales + fades in
   Phase 2 (600–1100ms): "EduChain" text reveals letter by letter
   Phase 3 (1100–1700ms): tagline fades in below
   Phase 4 (1700–2200ms): whole splash fades out + slides up
   After 2200ms: splash unmounts, page content visible
───────────────────────────────────────────────────────── */
function SplashScreen({ onDone }: { onDone: () => void }) {
  /* track animation phase */
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const letters = 'EduChain'.split('');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 600);   // icon done → text starts
    const t2 = setTimeout(() => setPhase(3), 1200);  // text done → tagline
    const t3 = setTimeout(() => setPhase(4), 1900);  // tagline done → exit
    const t4 = setTimeout(() => onDone(),    2500);  // exit done → unmount
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#09051c',
      /* Phase 4: fade out + slide up */
      opacity: phase === 4 ? 0 : 1,
      transform: phase === 4 ? 'translateY(-24px)' : 'translateY(0)',
      transition: phase === 4 ? 'opacity 0.55s cubic-bezier(.4,0,1,1), transform 0.55s cubic-bezier(.4,0,1,1)' : 'none',
      pointerEvents: phase === 4 ? 'none' : 'auto',
    }}>

      {/* Noise texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.035, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
        <svg width="100%" height="100%">
          <filter id="fn-splash"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#fn-splash)" />
        </svg>
      </div>

      {/* Ambient glow behind logo */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109,40,217,0.22), transparent 65%)',
        pointerEvents: 'none',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1s ease',
      }} />

      {/* Logo icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 22,
        background: `linear-gradient(135deg, ${T.v500}, ${T.v700})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 0 rgba(139,92,246,0.5)`,
        position: 'relative', zIndex: 1,
        /* Phase 1: pop in with spring */
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.4)',
        transition: 'opacity 0.55s cubic-bezier(.16,1,.3,1), transform 0.55s cubic-bezier(.16,1,.3,1)',
        animation: phase >= 1 && phase < 4 ? 'ec-splash-pulse 2.2s ease infinite' : 'none',
      }}>
        <GraduationCap size={38} color="#fff" />
      </div>

      {/* Wordmark — letters stagger in */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 0,
        marginTop: 22, position: 'relative', zIndex: 1,
        height: 52, overflow: 'hidden',
      }}>
        {letters.map((l, i) => {
          /* first 3 = "Edu" lighter weight, rest = "Chain" bold */
          const isEdu = i < 3;
          const charDelay = i * 55; /* 55ms stagger per letter */
          const show = phase >= 2;
          return (
            <span key={i} style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 42,
              fontWeight: isEdu ? 700 : 900,
              letterSpacing: '-0.03em',
              color: isEdu ? T.v300 : '#fff',
              display: 'inline-block',
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0)' : 'translateY(28px)',
              transition: `opacity 0.5s cubic-bezier(.16,1,.3,1) ${charDelay}ms, transform 0.5s cubic-bezier(.16,1,.3,1) ${charDelay}ms`,
            }}>
              {l}
            </span>
          );
        })}
      </div>

      {/* Tagline */}
      <p style={{
        marginTop: 12, position: 'relative', zIndex: 1,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13, fontWeight: 500, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(167,139,250,0.6)',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        Decentralized Education
      </p>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'rgba(139,92,246,0.12)',
      }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg, ${T.v500}, ${T.v300})`,
          width: phase === 1 ? '30%' : phase === 2 ? '60%' : phase === 3 ? '85%' : '100%',
          transition: 'width 0.6s cubic-bezier(.16,1,.3,1)',
          boxShadow: `0 0 12px ${T.v400}`,
        }} />
      </div>

      <style>{`
        @keyframes ec-splash-pulse {
          0%,100% { box-shadow: 0 0 0  0   rgba(139,92,246,0.5), 0 20px 60px rgba(109,40,217,0.3); }
          50%      { box-shadow: 0 0 0 18px rgba(139,92,246,0),   0 20px 60px rgba(109,40,217,0.3); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ROOT PAGE
   ✅ Wrapped in .ec-landing so cursor: none is scoped here
   ✅ Adds/removes ec-landing-active on body for dashboard fix
   ✅ Shows SplashScreen on first mount
───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const scrollY = useScrollY();
  const mouse = useMouse();

  const [splashDone, setSplashDone] = useState(false);
  const [step, setStep] = useState<LoginStep>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  /* ✅ Add/remove body class so CSS can restore cursor on other routes */
  useEffect(() => {
    document.body.classList.add('ec-landing-active');
    return () => document.body.classList.remove('ec-landing-active');
  }, []);

  /* Lock scroll while splash is showing */
  useEffect(() => {
    if (!splashDone) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [splashDone]);

  const openLogin = () => { setStep('login-form'); setError(''); setEmail(''); setPassword(''); };
  const openSignup = () => { setStep('signup-form'); setError(''); setEmail(''); setPassword(''); setSelectedRole(null); };
  const closeAuth = () => setStep('initial');

  const handleLogin = async () => {
  setError('');
  if (!email || !password) {
    setError('Please enter both email and password');
    return;
  }

  setIsAuthenticating(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select("role,status")
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.role) {
        if (profile?.status === "suspended") {
          await supabase.auth.signOut();
          throw new Error("Your account is suspended");
}

        // 🔥 ADMIN ADDED
        if (profile.role === 'admin') {
          window.location.href = '/dashboard/admin';
        } 
        else if (profile.role === 'teacher') {
          window.location.href = '/dashboard/teacher';
        } 
        else if (profile.role === 'student') {
          window.location.href = '/dashboard/student';
        } 
        else {
          setError('Invalid role. Contact admin.');
        }

      } else {
        setError('No role found. Please contact support.');
      }
    }
  } catch (error: any) {
    console.error('Login error:', error);
    setError(error.message || 'Login failed');
  } finally {
    setIsAuthenticating(false);
  }
};

  const handleSignup = async () => {
    setError('');
    if (!email || !password) { setError('Please enter both email and password'); return; }
    if (!selectedRole) { setError('Please select a role'); return; }
    setIsAuthenticating(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;
      if (data.user) {
        const { error: pe } = await supabase.from('profiles').upsert({ id: data.user.id, email: data.user.email!, role: selectedRole, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (pe) throw pe;
        document.body.classList.remove('ec-landing-active');
        window.location.href = selectedRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
      }
    } catch (e: any) { setError(e.message || 'Signup failed'); }
    finally { setIsAuthenticating(false); }
  };

  return (
    /* ✅ .ec-landing scopes cursor: none + all custom cursor styles */
    <div className="ec-landing">
      <Cursor mouse={mouse} />

      {/* Splash — unmounts after animation completes */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      {/* Page content fades in as splash exits */}
      <div style={{
        opacity: splashDone ? 1 : 0,
        transition: 'opacity 0.5s ease 0.1s',
        pointerEvents: splashDone ? 'auto' : 'none',
      }}>
        <Nav scrollY={scrollY} onLogin={openLogin} onSignup={openSignup} />
        <Hero scrollY={scrollY} mouse={mouse} onSignup={openSignup} />
        <Strip />
        <Features />
        <Team onSelect={setSelectedMember} />
        <Contact />
        <Footer />
      </div>

      <AuthModal
        step={step} onClose={closeAuth}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        selectedRole={selectedRole} setSelectedRole={setSelectedRole}
        error={error} isAuthenticating={isAuthenticating}
        onLogin={handleLogin} onSignup={handleSignup}
        switchLogin={openLogin} switchSignup={openSignup}
      />
      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}