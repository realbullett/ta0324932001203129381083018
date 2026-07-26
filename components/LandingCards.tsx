import React, { useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { Stethoscope, Pill, FileText } from 'lucide-react';

const cards = [
  {
    num: '01',
    icon: Stethoscope,
    title: 'Understand Before You Go',
    desc: 'Describe your symptoms in any language. Tabib analyzes, translates, and tells you what might be going on before the appointment.',
  },
  {
    num: '02',
    icon: Pill,
    title: 'Know Your Medication',
    desc: 'Snap a photo. Get expiry dates, active ingredients, proper dosage, and warnings in seconds.',
  },
  {
    num: '03',
    icon: FileText,
    title: 'Report, Not a Lecture',
    desc: 'Skip the explanation. Tabib generates a clinical report your doctor can read in 3 minutes.',
  },
];

export function LandingCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            observer.disconnect();
            animate(els, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 600,
              ease: 'outCubic',
              delay: stagger(120),
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-0">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 md:p-6 cursor-default transition-colors duration-300 hover:border-white/[0.14] hover:bg-white/[0.05]"
            style={{ opacity: 0 }}
          >
            <div className="flex items-start gap-4">
              <span className="text-[11px] font-bold tracking-widest text-zinc-600 mt-1 shrink-0">{c.num}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={16} className="text-zinc-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white leading-tight">{c.title}</h3>
                </div>
                <p className="text-zinc-500 text-[13px] leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
