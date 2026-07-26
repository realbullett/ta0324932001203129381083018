import React, { useRef, useEffect, useCallback } from 'react';
import { animate, stagger, utils } from 'animejs';
import { Stethoscope, Pill, FileText, ArrowRight } from 'lucide-react';

const cards = [
  {
    icon: Stethoscope,
    title: 'Understand Before You Go',
    desc: 'Describe your symptoms in any language. Tabib analyzes, translates, and tells you what might be going on before the appointment.',
    cta: 'Start assessment',
    color: 'purple',
    rgb: '147,51,234',
  },
  {
    icon: Pill,
    title: 'Know Your Medication',
    desc: 'Snap a photo. Get expiry dates, active ingredients, proper dosage, and warnings in seconds. No guesswork.',
    cta: 'Scan medication',
    color: 'violet',
    rgb: '139,92,246',
  },
  {
    icon: FileText,
    title: 'Report, Not a Lecture',
    desc: 'Skip the 30-minute explanation. Tabib generates a clinical report your doctor can read in 3 minutes.',
    cta: 'Generate report',
    color: 'fuchsia',
    rgb: '217,70,239',
  },
];

export function LandingCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasAnimated = useRef(false);

  // Mouse-reactive tilt + glow
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    const card = cardRefs.current[idx];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    animate(card, {
      rotateY: [null, x * 12],
      rotateX: [null, -y * 12],
      duration: 300,
      ease: 'outQuad',
    });

    // Move glow to cursor
    const glow = card.querySelector('.card-glow') as HTMLElement;
    if (glow) {
      glow.style.opacity = '1';
      glow.style.background = `radial-gradient(circle 250px at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(${cards[idx].rgb},0.18), transparent 70%)`;
    }
  }, []);

  const handleMouseLeave = useCallback((idx: number) => {
    const card = cardRefs.current[idx];
    if (!card) return;
    animate(card, {
      rotateY: [null, 0],
      rotateX: [null, 0],
      duration: 600,
      ease: 'outElastic(1, .6)',
    });
    const glow = card.querySelector('.card-glow') as HTMLElement;
    if (glow) glow.style.opacity = '0';
  }, []);

  // Entry animation
  useEffect(() => {
    if (hasAnimated.current) return;
    const cardsEls = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cardsEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            observer.disconnect();

            // Cards slide up with stagger
            animate(cardsEls, {
              opacity: [0, 1],
              translateY: [60, 0],
              rotateX: [8, 0],
              scale: [0.92, 1],
              duration: 900,
              ease: 'outCubic',
              delay: stagger(180),
            });

            // Shine sweep per card with stagger
            shineRefs.current.filter(Boolean).forEach((el, i) => {
              animate(el, {
                translateX: ['-100%', '100%'],
                duration: 700,
                delay: 600 + i * 300,
                ease: 'inOutQuad',
              });
            });
          }
        });
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Idle float loop via anime.js (no CSS keyframes)
  useEffect(() => {
    const cardsEls = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cardsEls.length === 0) return;

    // Each card gets its own subtle, non-uniform float
    const offsets = [
      { y: [-4, 6, -4], r: [0.3, -0.5, 0.3], dur: 5200 },
      { y: [5, -7, 5], r: [-0.4, 0.6, -0.4], dur: 6100 },
      { y: [-6, 4, -6], r: [0.5, -0.3, 0.5], dur: 5700 },
    ];

    const anims = cardsEls.map((el, i) => {
      const o = offsets[i] || offsets[0];
      return animate(el, {
        translateY: o.y,
        rotate: o.r,
        duration: o.dur,
        ease: 'inOutSine',
        loop: true,
      });
    });

    return () => anims.forEach((a) => a.pause());
  }, []);

  return (
    <div ref={containerRef} className="perspective-container grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2 md:px-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="group relative rounded-3xl cursor-default"
            style={{ opacity: 0, transformStyle: 'preserve-3d' }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={() => handleMouseLeave(i)}
          >
            {/* Per-card cursor glow */}
            <div className="card-glow absolute inset-0 rounded-3xl pointer-events-none opacity-0 transition-opacity duration-300 z-0" />

            {/* Border gradient */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-white/[0.06] pointer-events-none" />

            {/* Card body */}
            <div className="relative rounded-3xl p-5 md:p-7 h-full bg-[rgba(10,5,25,0.6)] border border-white/[0.06] backdrop-blur-xl"
              style={{ boxShadow: `0 8px 40px rgba(${c.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.04)` }}
            >
              {/* Shine sweep overlay */}
              <div
                ref={(el) => { shineRefs.current[i] = el; }}
                className="absolute inset-0 rounded-3xl pointer-events-none z-10 overflow-hidden"
                style={{ transform: 'translateX(-100%)' }}
              >
                <div className="w-full h-full" style={{
                  background: 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 52%, transparent 62%)',
                }} />
              </div>

              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-4 md:mb-5 transition-all duration-500"
                style={{
                  background: `rgba(${c.rgb},0.12)`,
                  border: `1px solid rgba(${c.rgb},0.2)`,
                }}
              >
                <Icon size={20} style={{ color: `rgb(${c.rgb})` }} />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors duration-300">
                {c.desc}
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500"
                style={{ color: `rgb(${c.rgb})` }}
              >
                <span>{c.cta}</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
