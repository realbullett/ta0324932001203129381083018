import React, { useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { MessageSquare, Search, Pill, FileText } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: MessageSquare,
    title: 'Describe Your Symptoms',
    desc: 'Tell Tabib what you\'re feeling in your own language — type or use your voice.',
    video: '/step1.mp4',
  },
  {
    num: '02',
    icon: Search,
    title: 'Get Your Analysis',
    desc: 'Receive possible conditions, urgency levels, and personalized health guidance.',
    video: '/step2.mp4',
  },
  {
    num: '03',
    icon: Pill,
    title: 'Verify Medications',
    desc: 'Snap a photo of any medication to get expiry dates, dosage, and warnings.',
    video: '/step3.mp4',
  },
  {
    num: '04',
    icon: FileText,
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

  const videoBox = (src: string) => (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
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

  const textBox = (step: typeof steps[number]) => {
    const Icon = step.icon;
    return (
      <div className="flex flex-col justify-center py-4 md:py-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400 mb-3">
          Step {step.num}
        </span>
        <div className="flex items-center gap-3 mb-3">
          <Icon size={18} className="text-purple-400 shrink-0" />
          <h3 className="text-lg md:text-xl font-bold text-white">{step.title}</h3>
        </div>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-md">
          {step.desc}
        </p>
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
                  {videoBox(step.video)}
                  {textBox(step)}
                </>
              ) : (
                <>
                  {textBox(step)}
                  {videoBox(step.video)}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
