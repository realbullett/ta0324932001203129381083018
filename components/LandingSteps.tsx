import React, { useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
const steps = [
  {
    title: 'Describe Your Symptoms',
    desc: 'Tell Tabib what you\'re feeling in your own language, whether you type or use your voice.',
    video: '/step1.mp4',
  },
  {
    title: 'Get Your Analysis',
    desc: 'Receive possible conditions, urgency levels, and personalized health guidance.',
    video: '/step2.mp4',
  },
  {
    title: 'Verify Medications',
    desc: 'Snap a photo of any medication to get expiry dates, dosage, and warnings.',
    video: '/step3.mp4',
  },
  {
    title: 'Take a Report to Your Doctor',
    desc: 'Generate a clinical report your doctor can read in minutes, not hours.',
    video: '/step4.mp4',
  },
];

export function LandingSteps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    const els = itemRefs.current.filter(Boolean) as HTMLDivElement[];
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

  const videoBox = (src: string, isEven: boolean) => (
    <div
      className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03]"
      style={{
        transform: isEven ? 'perspective(800px) rotateY(6deg)' : 'perspective(800px) rotateY(-6deg)',
      }}
    >
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );

  const textBox = (step: typeof steps[number], idx: number) => {
    return (
      <div className="flex items-start gap-4 md:gap-6 py-4 md:py-0">
        <span
          className="step-number text-[64px] md:text-[88px] font-black leading-none select-none shrink-0 tabular-nums"
          style={{ animationDelay: `${idx * -1}s` }}
        >
          {idx + 1}
        </span>
        <div className="flex flex-col justify-center pt-2">
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">{step.title}</h3>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-md">
            {step.desc}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative px-0 py-10 md:py-20">
      {/* Section heading */}
      <div className="text-center mb-12 md:mb-20">
        <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-3">
          How Tabib Works
        </h2>
        <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto">
          From symptom to report in four simple steps.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-12 md:space-y-20">
        {steps.map((step, i) => {
          const isEven = i % 2 === 0;
          return (
            <div
              key={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center"
              style={{ opacity: 0 }}
            >
              {isEven ? (
                <>
                  {videoBox(step.video, isEven)}
                  {textBox(step, i)}
                </>
              ) : (
                <>
                  {textBox(step, i)}
                  {videoBox(step.video, isEven)}
                </>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes neon-flow {
          0%   { background-position: 0% 50%; filter: drop-shadow(0 0 12px rgba(168,85,247,0.5)); }
          50%  { background-position: 100% 50%; filter: drop-shadow(0 0 20px rgba(255,255,255,0.4)); }
          100% { background-position: 0% 50%; filter: drop-shadow(0 0 12px rgba(168,85,247,0.5)); }
        }
        .step-number {
          background: linear-gradient(90deg, #7c3aed, #a855f7, #d8b4fe, #a855f7, #7c3aed);
          background-size: 200% 200%;
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: neon-flow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
