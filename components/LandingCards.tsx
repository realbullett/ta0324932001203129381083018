import React, { useRef, useEffect, useState } from 'react';

const cards = [
  {
    title: 'Understand Before You Go',
    desc: 'Describe your symptoms in any language. Tabib analyzes, translates, and tells you what might be going on before the appointment.',
  },
  {
    title: 'Know Your Medication',
    desc: 'Snap a photo. Get expiry dates, active ingredients, proper dosage, and warnings in seconds.',
  },
  {
    title: 'Report, Not a Lecture',
    desc: 'Skip the explanation. Tabib generates a clinical report your doctor can read in 3 minutes.',
  },
];

const POSITIONS = [
  { x: -180, y: 12, angle: -22, scale: 0.88, z: 40, opacity: 0.7 },
  { x: 0,    y: 0,  angle: 0,   scale: 1,    z: 60, opacity: 1 },
  { x: 180,  y: 12, angle: 22,  scale: 0.88, z: 40, opacity: 0.7 },
] as const;

export function LandingCards() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [order, setOrder] = useState<[number, number, number]>([0, 1, 2]);

  useEffect(() => {
    if (hasAnimated.current) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            observer.disconnect();
            scene.style.opacity = '1';
            timerRef.current = setInterval(() => {
              setOrder((prev) => [prev[1], prev[2], prev[0]]);
            }, 3000);
            break;
          }
        }
      },
      { threshold: 0.15 }
    );

    const timerRef = { current: undefined as ReturnType<typeof setInterval> | undefined };
    observer.observe(scene);
    return () => {
      observer.disconnect();
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="relative w-full flex justify-center items-center overflow-hidden py-10"
      style={{ opacity: 0, perspective: '1100px', perspectiveOrigin: '50% 45%', height: '380px' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[450px] h-[280px] rounded-full bg-cyan-400/[0.06] blur-[100px]" />
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[200px] h-[120px] rounded-full bg-white/[0.03] blur-[60px]" />
      </div>

      <div
        className="relative"
        style={{ transformStyle: 'preserve-3d' as const, width: '240px', height: '320px' }}
      >
        {cards.map((c, cardIdx) => {
          const slotIdx = order.indexOf(cardIdx);
          const pos = POSITIONS[slotIdx];
          return (
            <div
              key={cardIdx}
              className="absolute inset-0 rounded-2xl overflow-hidden cursor-default card-shine"
              style={{
                transform: `translateX(${pos.x}px) translateY(${pos.y}px) rotateY(${pos.angle}deg) translateZ(${pos.z}px) scale(${pos.scale})`,
                transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                backfaceVisibility: 'hidden',
                zIndex: slotIdx === 1 ? 3 : 2,
                opacity: pos.opacity,
                animationDelay: `${cardIdx * 0.6}s`,
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.06) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: slotIdx === 1
                    ? '0 8px 40px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
                />
                <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-cyan-300/[0.04] blur-[30px]" />

                <div>
                  <h3 className="text-[15px] font-semibold text-white/90 mb-2.5 leading-snug">{c.title}</h3>
                  <p className="text-white/40 text-[12px] leading-relaxed">{c.desc}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {POSITIONS.map((_, j) => (
                    <div
                      key={j}
                      className="h-[2px] rounded-full"
                      style={{
                        width: j === slotIdx ? '20px' : '8px',
                        background: j === slotIdx
                          ? 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))'
                          : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[360px] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      <style>{`
        .card-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 42%,
            rgba(255, 255, 255, 0.04) 46%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.04) 54%,
            transparent 58%
          );
          background-size: 250% 100%;
          animation: shine-sweep 4s ease-in-out infinite;
          pointer-events: none;
          border-radius: inherit;
        }
        @keyframes shine-sweep {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
