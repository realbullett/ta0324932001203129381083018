// ── Tabib Product Launch — AE-Quality Motion ──
// Zoom in/out transitions, purposeful motion, no AI slop

var h = React.createElement;
var _s = React.useState;
var _e = React.useEffect;
var _r = React.useRef;

// ── Math ──────────────────────────────────────
var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
var map = function (v, a, b, c, d) { return c + ((v - a) / (b - a)) * (d - c); };
var lerp = function (a, b, t) { return a + (b - a) * t; };

// AE-style easing: fast in, slow out with overshoot
function easeOutBack(t) {
  var c1 = 1.70158;
  var c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

// ── Timeline ──────────────────────────────────
var DUR = 35;

var SEGS = [
  { id: 'void',    s: 0,    e: 1.2 },
  { id: 'title',   s: 0.8,  e: 3.8 },
  { id: 'tag',     s: 3.0,  e: 5.5 },
  { id: 'phone',   s: 4.5,  e: 9.5 },
  { id: 'scan',    s: 8.5,  e: 14.0 },
  { id: 'report',  s: 13.0, e: 19.0 },
  { id: 'langs',   s: 18.0, e: 22.5 },
  { id: 'stats',   s: 21.5, e: 26.5 },
  { id: 'steps',   s: 25.5, e: 30.0 },
  { id: 'cta',     s: 29.0, e: 34.0 },
  { id: 'end',     s: 33.0, e: 35.0 }
];

var CUTS = [0.8, 4.5, 8.5, 13.0, 18.0, 21.5, 25.5, 29.0, 33.0];

function segP(id, t) {
  for (var i = 0; i < SEGS.length; i++) {
    if (SEGS[i].id === id) return clamp(map(t, SEGS[i].s, SEGS[i].e, 0, 1), 0, 1);
  }
  return 0;
}

function vis(id, t) {
  for (var i = 0; i < SEGS.length; i++) {
    if (SEGS[i].id === id) return t >= SEGS[i].s - 0.1 && t <= SEGS[i].e + 0.1;
  }
  return false;
}

function useCtr(target, t, start, dur) {
  var val = clamp((t - start) / dur, 0, 1);
  return Math.round(easeOutCubic(val) * target);
}

// ── Streak ────────────────────────────────────
function Streak(props) {
  var p = clamp(map(props.t, props.delay, props.delay + 0.35, 0, 1));
  var o = p < 0.5 ? p * 2 : 2 - p * 2;
  return h('div', {
    style: {
      position: 'absolute', left: props.x, top: props.y,
      width: props.len, height: 1.5,
      background: 'linear-gradient(90deg, transparent, rgba(168,132,250,' + (o * 0.4) + '), transparent)',
      transform: 'rotate(' + props.angle + 'deg)',
      transformOrigin: 'left center',
      pointerEvents: 'none'
    }
  });
}

// ── Scene wrapper (opacity only, no scale) ───
function Scene(props) {
  var seg = null;
  for (var i = 0; i < SEGS.length; i++) {
    if (SEGS[i].id === props.id) { seg = SEGS[i]; break; }
  }
  if (!seg) return null;

  var p = segP(props.id, props.t);
  var v = vis(props.id, props.t);

  var opacity = v ? Math.min(
    clamp(map(p, 0, 0.06, 0, 1), 0, 1),
    clamp(map(p, 0.9, 1.0, 1, 0), 0, 1)
  ) : 0;

  return h('div', {
    style: {
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: opacity,
      pointerEvents: 'none', padding: '3vw'
    }
  }, props.children);
}

// ── Data stream ───────────────────────────────
function DataStream(props) {
  if (!vis(props.id, props.t)) return null;
  var p = segP(props.id, props.t);
  if (p < 0.1) return null;
  return h('div', {
    style: {
      position: 'absolute', left: props.x, top: '8%', width: 2, height: '84%',
      pointerEvents: 'none', opacity: Math.min(1, (p - 0.1) * 5) * 0.3,
      overflow: 'hidden'
    }
  },
    [0, 1, 2, 3].map(function (i) {
      return h('div', {
        key: i,
        style: {
          position: 'absolute', left: 0, width: 2.5, height: 2.5, borderRadius: '50%',
          background: props.color || '#a78bfa',
          boxShadow: '0 0 6px ' + (props.color || '#a78bfa'),
          animation: 'dataFlow ' + (2.2 + i * 0.6) + 's linear ' + (i * 0.55) + 's infinite'
        }
      });
    })
  );
}

// ── Main App ──────────────────────────────────
function App() {
  var state = _s(0);
  var t = state[0];
  var setT = state[1];
  var startRef = _r(performance.now());
  var rafRef = _r(null);

  _e(function () {
    function tick(now) {
      var el = (now - startRef.current) / 1000;
      if (el >= DUR) { setT(DUR); return; }
      setT(el);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(rafRef.current); };
  }, []);

  function restart() {
    startRef.current = performance.now();
    setT(0);
  }

  // ── Segment progress ───────────────────────
  var tp   = segP('title', t);
  var tagp = segP('tag', t);
  var pp   = segP('phone', t);
  var sp   = segP('scan', t);
  var rp   = segP('report', t);
  var lp   = segP('langs', t);
  var stp  = segP('stats', t);
  var stsp = segP('steps', t);
  var cp   = segP('cta', t);
  var ep   = segP('end', t);

  // ── Title ──
  var titleScale = tp < 0.3 ? lerp(3.5, 0.98, easeOutBack(clamp(tp / 0.3, 0, 1))) : 1;
  var titleOp = tp < 0.06 ? tp / 0.06 : tp > 0.88 ? (1 - tp) / 0.12 : 1;
  var glitchAmt = tp < 0.25 ? (1 - tp / 0.25) * 5 : 0;

  // ── Phone ──
  var phoneEnter = clamp(map(pp, 0, 0.15, 0, 1), 0, 1);
  var phoneExit = clamp(map(pp, 0.88, 1.0, 0, 1), 0, 1);
  var phoneOp = Math.min(phoneEnter, phoneExit);
  var phoneScale = pp < 0.15 ? lerp(0.85, 1.0, easeOutBack(clamp(pp / 0.15, 0, 1)))
    : pp > 0.88 ? lerp(1.0, 0.92, easeOutCubic(clamp((pp - 0.88) / 0.12, 0, 1))) : 1;
  var phoneRot = pp < 0.15 ? lerp(-18, -5, easeOutCubic(clamp(pp / 0.15, 0, 1)))
    : pp > 0.88 ? lerp(-5, -22, easeOutCubic(clamp((pp - 0.88) / 0.12, 0, 1))) : -5;

  // ── Scan beam ──
  var scanY = sp < 0.12 ? lerp(5, 90, easeOutCubic(clamp(sp / 0.12, 0, 1)))
    : sp > 0.88 ? lerp(90, 5, easeOutCubic(clamp((sp - 0.88) / 0.12, 0, 1)))
    : 5 + 85 * Math.sin(sp * Math.PI * 3.5);

  // ── Report bars ──
  var rb1 = rp > 0.18 ? easeOutCubic(clamp(map(rp, 0.18, 0.45, 0, 88), 0, 1)) : 0;
  var rb2 = rp > 0.26 ? easeOutCubic(clamp(map(rp, 0.26, 0.55, 0, 35), 0, 1)) : 0;
  var rb3 = rp > 0.34 ? easeOutCubic(clamp(map(rp, 0.34, 0.65, 0, 60), 0, 1)) : 0;

  // ── Stats ──
  var c1 = useCtr(500, t, 22.0, 0.8);
  var c2 = useCtr(100, t, 22.3, 0.8);
  var c3 = useCtr(30, t, 22.6, 0.8);
  var langCount = Math.round(clamp(map(lp, 0.1, 0.5, 0, 1), 0, 1) * 30);
  var prog = Math.min(t / DUR * 100, 100);

  // ── Phone chat ──
  var userMsg = "I've had a splitting headache for 3 days and my neck is stiff";
  var userShown = Math.floor(clamp(map(pp, 0.18, 0.5, 0, 1), 0, 1) * userMsg.length);
  var aiMsg = "This sounds like a tension-type headache. Low urgency. Let me ask a few follow-up questions to narrow it down.";
  var aiShown = Math.floor(clamp(map(pp, 0.68, 0.98, 0, 1), 0, 1) * aiMsg.length);

  // ── Scan data ──
  var scanData = [
    { l: 'Paracetamol 500mg', sub: 'Acetaminophen', d: 0.18, c: '#fff', sc: '#888' },
    { l: 'Expiry: 2026-08', sub: 'Pharma Corp Ltd.', d: 0.28, c: '#bbb', sc: '#666' },
    { l: 'Dosage: 1-2 tablets', sub: 'Every 4-6 hours as needed', d: 0.38, c: '#bbb', sc: '#666' },
    { l: 'Max 4g/day', sub: 'Do not exceed recommended dose', d: 0.48, c: '#fbbf24', sc: '#92400e' },
    { l: '\u26A0 Avoid with liver disease', sub: 'Consult doctor if unsure', d: 0.6, c: '#f87171', sc: '#991b1b' },
    { l: '\u2713 Safe for most adults', sub: 'Common pain reliever', d: 0.72, c: '#34d399', sc: '#065f46' }
  ];

  var reportLines = [82, 95, 68, 88, 52, 74, 60, 91];

  var LANGS = [
    'English', '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', '\u0939\u093F\u0928\u094D\u0926\u0940',
    '\u0627\u0631\u0628\u0648', 'Espa\u00F1ol', 'Fran\u00E7ais', 'Tagalog',
    '\u4E2D\u6587', '\uD55C\uAD6D\uC5B4', 'Portugu\u00EAs', 'T\u00FCrk\u00E7e',
    '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', '\u65E5\u672C\u8A9E',
    'Bahasa', '\u0E44\u0E17\u0E22', 'Italiano', 'Deutsch',
    'Kiswahili', 'Ti\u1EBFng Vi\u1EC7t', 'Polski', 'Nederlands'
  ];

  // ── Camera shake on cuts ───────────────────
  var shakeX = 0, shakeY = 0, shakeR = 0;
  for (var ci = 0; ci < CUTS.length; ci++) {
    var cd = t - CUTS[ci];
    if (cd >= 0 && cd < 0.2) {
      var shakeP = cd / 0.2;
      var shakeAmp = (1 - shakeP) * 3;
      shakeX += Math.sin(cd * 80) * shakeAmp;
      shakeY += Math.cos(cd * 60) * shakeAmp * 0.6;
      shakeR += Math.sin(cd * 50) * shakeAmp * 0.08;
    }
  }

  // ── Render ──────────────────────────────────
  return h('div', {
    style: {
      width: '100vw', height: '100vh', background: '#000',
      position: 'relative', overflow: 'hidden',
      transform: 'translate(' + shakeX + 'px,' + shakeY + 'px) rotate(' + shakeR + 'deg)'
    }
  },

    // ── Spinning rings (subtle) ──
    [300, 460].map(function (s, i) {
      return h('div', {
        key: 'ring-' + i,
        style: {
          position: 'absolute', left: '50%', top: '50%', width: s, height: s,
          borderRadius: '50%',
          border: '1px solid rgba(168,132,250,' + (0.025 + i * 0.008) + ')',
          animation: (i % 2 === 0 ? 'ringSpin ' : 'ringSpinRev ') + (40 + i * 15) + 's linear infinite',
          pointerEvents: 'none', opacity: 0.35
        }
      });
    }),

    // ── Grid ──
    h('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18,
        backgroundImage: 'linear-gradient(rgba(168,132,250,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(168,132,250,.015) 1px,transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'gridScroll 10s linear infinite',
        WebkitMaskImage: 'radial-gradient(ellipse 50% 40% at 50% 50%,black,transparent)'
      }
    }),

    // ── Streaks ──
    h(Streak, { x: '0', y: '38%', angle: -10, len: 340, delay: 0.8, t: t }),
    h(Streak, { x: '100%', y: '42%', angle: 170, len: 280, delay: 4.5, t: t }),
    h(Streak, { x: '12%', y: '0', angle: 85, len: 250, delay: 8.5, t: t }),
    h(Streak, { x: '85%', y: '100%', angle: -85, len: 260, delay: 13.0, t: t }),
    h(Streak, { x: '0', y: '58%', angle: -6, len: 400, delay: 18.0, t: t }),
    h(Streak, { x: '100%', y: '38%', angle: 174, len: 350, delay: 21.5, t: t }),
    h(Streak, { x: '40%', y: '0', angle: 88, len: 280, delay: 25.5, t: t }),
    h(Streak, { x: '0', y: '65%', angle: -4, len: 320, delay: 29.0, t: t }),
    h(Streak, { x: '100%', y: '32%', angle: 176, len: 300, delay: 33.0, t: t }),

    // ── Background orbs (subtle, slow drift) ──
    [
      { x: '20%', y: '30%', w: 260, c: 'rgba(168,132,250,.04)', dur: 14 },
      { x: '80%', y: '60%', w: 220, c: 'rgba(232,121,249,.03)', dur: 17 }
    ].map(function (o, i) {
      return h('div', {
        key: 'orb-' + i,
        style: {
          position: 'absolute', left: o.x, top: o.y, width: o.w, height: o.w,
          borderRadius: '50%', background: o.c,
          pointerEvents: 'none',
          animation: 'bgOrbDrift ' + o.dur + 's ease-in-out infinite',
          opacity: clamp(map(t, 0, 2, 0, 0.7), 0, 0.7)
        }
      });
    }),

    // ── Data streams ──
    h(DataStream, { id: 'phone', t: t, x: '7%', color: '#a78bfa' }),
    h(DataStream, { id: 'phone', t: t, x: '93%', color: '#e879f9' }),
    h(DataStream, { id: 'scan', t: t, x: '5%', color: '#34d399' }),
    h(DataStream, { id: 'scan', t: t, x: '95%', color: '#34d399' }),
    h(DataStream, { id: 'report', t: t, x: '8%', color: '#fbbf24' }),
    h(DataStream, { id: 'report', t: t, x: '92%', color: '#fbbf24' }),
    h(DataStream, { id: 'cta', t: t, x: '10%', color: '#a78bfa' }),
    h(DataStream, { id: 'cta', t: t, x: '90%', color: '#e879f9' }),
    h(DataStream, { id: 'end', t: t, x: '50%', color: '#c084fc' }),

    // ══════════════════════════════════════════
    // SCENES
    // ══════════════════════════════════════════

    // ── Void ──
    vis('void', t) && h(Scene, { id: 'void', t: t },
      h('div', {
        style: {
          width: 5 + segP('void', t) * 8,
          height: 5 + segP('void', t) * 8,
          borderRadius: '50%', background: '#a78bfa',
          boxShadow: '0 0 40px #a78bfa, 0 0 100px rgba(168,132,250,.4)',
          opacity: segP('void', t)
        }
      })
    ),

    // ── Title: TABIB ──
    vis('title', t) && h(Scene, { id: 'title', t: t },
      h('div', {
        style: {
          fontSize: 'clamp(4rem, 15vw, 13rem)', fontWeight: 900,
          letterSpacing: '-0.04em', lineHeight: 1, textAlign: 'center',
          transform: 'scale(' + titleScale + ')',
          opacity: titleOp
        }
      },
        h('span', {
          style: {
            background: 'linear-gradient(135deg,#a78bfa,#c084fc,#e879f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            textShadow: glitchAmt > 0
              ? (Math.sin(tp * 60) * glitchAmt) + 'px 0 #e879f9, '
                + (-Math.sin(tp * 60) * glitchAmt) + 'px 0 #a78bfa'
              : 'none'
          }
        }, 'TABIB')
      )
    ),

    // ── Tagline ──
    vis('tag', t) && h(Scene, { id: 'tag', t: t },
      h('div', {
        style: {
          fontSize: 'clamp(.75rem, 1.3vw, 1rem)', fontWeight: 300,
          color: '#777', letterSpacing: '0.18em', textTransform: 'uppercase',
          opacity: clamp(map(tagp, 0.1, 0.35, 0, 1), 0, 1),
          transform: 'translateY(' + ((1 - clamp(map(tagp, 0.1, 0.35, 0, 1), 0, 1)) * 15) + 'px)'
        }
      }, "Qatar's AI Health Assistant"),
      h('div', {
        style: {
          marginTop: '1rem',
          fontSize: 'clamp(.55rem, .9vw, .75rem)', color: '#444',
          letterSpacing: '0.1em',
          opacity: clamp(map(tagp, 0.45, 0.7, 0, 1), 0, 1),
          transform: 'translateY(' + ((1 - clamp(map(tagp, 0.45, 0.7, 0, 1), 0, 1)) * 10) + 'px)'
        }
      }, 'Symptoms \u00B7 Medications \u00B7 Reports \u00B7 Emergency')
    ),

    // ── Phone: Symptom Chat ──
    vis('phone', t) && h(Scene, { id: 'phone', t: t },
      h('div', { style: { perspective: '800px' } },
        h('div', {
          style: {
            width: 240, height: 480, borderRadius: 32,
            border: '2px solid rgba(255,255,255,.07)',
            background: 'linear-gradient(180deg,#0a0a12,#050508)',
            boxShadow: '0 0 50px rgba(168,132,250,.1), 0 0 100px rgba(168,132,250,.04), inset 0 0 25px rgba(0,0,0,.4)',
            overflow: 'hidden', position: 'relative',
            transform: 'perspective(800px) rotateY(' + phoneRot + 'deg) rotateX(1.5deg) scale(' + phoneScale + ')',
            opacity: phoneOp
          }
        },
          // Dynamic island
          h('div', { style: { position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 70, height: 18, borderRadius: 10, background: '#000', zIndex: 5 } }),
          // Chat
          h('div', { style: { padding: '36px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, height: '100%' } },
            h('div', { style: { fontSize: 7.5, fontWeight: 700, letterSpacing: '0.22em', color: '#3a3a3a', marginBottom: 3 } }, 'DR. TABIB'),
            // Loading dots
            h('div', { style: { display: 'flex', gap: 3, marginBottom: 4 } },
              [1, 2, 3].map(function (s) {
                return h('div', {
                  key: s,
                  style: {
                    height: 2.5, borderRadius: 2, flex: s <= 2 ? 2 : 1,
                    background: s <= Math.min(2, Math.floor(pp * 4)) ? '#a78bfa' : 'rgba(255,255,255,.05)',
                    transition: 'background .3s'
                  }
                });
              })
            ),
            // User bubble
            pp > 0.15 && h('div', {
              style: {
                alignSelf: 'flex-end', maxWidth: '85%', padding: '8px 12px',
                borderRadius: '14px 14px 4px 14px',
                background: 'rgba(168,132,250,.12)',
                border: '1px solid rgba(168,132,250,.14)',
                color: '#e0d4fa', fontSize: 10, lineHeight: 1.5,
                opacity: clamp(map(pp, 0.15, 0.22, 0, 1), 0, 1),
                transform: 'translateY(' + ((1 - clamp(map(pp, 0.15, 0.22, 0, 1), 0, 1)) * 10) + 'px)'
              }
            },
              userMsg.slice(0, userShown),
              pp > 0.15 && pp < 0.52 && h('span', {
                style: { display: 'inline-block', width: 1.5, height: '1em', background: '#a78bfa', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink .7s step-end infinite' }
              })
            ),
            // Typing indicator
            pp > 0.52 && pp < 0.68 && h('div', {
              style: {
                alignSelf: 'flex-start', padding: '8px 14px',
                borderRadius: '4px 14px 14px 14px',
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.04)',
                opacity: clamp(map(pp, 0.52, 0.58, 0, 1), 0, 1)
              }
            },
              [0, 1, 2].map(function (i) {
                return h('span', { key: i, style: { display: 'inline-block', width: 4.5, height: 4.5, borderRadius: '50%', background: '#a78bfa', margin: '0 2px', animation: 'pulse .8s ease-in-out ' + (i * 0.15) + 's infinite' } });
              })
            ),
            // AI bubble
            pp > 0.68 && h('div', {
              style: {
                alignSelf: 'flex-start', maxWidth: '88%', padding: '8px 12px',
                borderRadius: '4px 14px 14px 14px',
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.04)',
                color: '#999', fontSize: 9.5, lineHeight: 1.5,
                opacity: clamp(map(pp, 0.68, 0.78, 0, 1), 0, 1),
                transform: 'translateY(' + ((1 - clamp(map(pp, 0.68, 0.78, 0, 1), 0, 1)) * 8) + 'px)'
              }
            },
              aiMsg.slice(0, aiShown),
              pp > 0.68 && pp < 0.99 && h('span', {
                style: { display: 'inline-block', width: 1.5, height: '1em', background: '#888', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink .7s step-end infinite' }
              })
            ),
            // Chips
            pp > 0.92 && h('div', {
              style: {
                display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6,
                opacity: clamp(map(pp, 0.92, 0.98, 0, 1), 0, 1)
              }
            },
              ['One-sided?', 'Nausea?', 'Blurred vision?'].map(function (q, i) {
                return h('span', {
                  key: i,
                  style: {
                    fontSize: 7.5, padding: '3px 8px', borderRadius: 10,
                    background: 'rgba(168,132,250,.08)', color: '#a78bfa',
                    border: '1px solid rgba(168,132,250,.1)',
                    opacity: clamp(map(pp, 0.94 + i * 0.015, 0.97 + i * 0.015, 0, 1), 0, 1)
                  }
                }, q);
              })
            )
          )
        )
      )
    ),

    // ── Medication Scan ──
    vis('scan', t) && h(Scene, { id: 'scan', t: t },
      h('div', { style: { display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' } },
        // Viewfinder
        h('div', {
          style: {
            width: 220, height: 165, borderRadius: 16, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
            border: '1.5px solid rgba(168,132,250,.08)',
            opacity: clamp(map(sp, 0, 0.08, 0, 1), 0, 1),
            transform: 'scale(' + (0.88 + clamp(map(sp, 0, 0.08, 0, 1), 0, 1) * 0.12) + ')'
          }
        },
          // Corners
          [{ t: 8, l: 8, bw: '2px 0 0 2px' }, { t: 8, r: 8, bw: '2px 2px 0 0' },
           { b: 8, l: 8, bw: '0 0 2px 2px' }, { b: 8, r: 8, bw: '0 2px 2px 0' }]
            .map(function (c, i) {
              var pos = { position: 'absolute', width: 16, height: 16, borderStyle: 'solid', borderColor: '#a78bfa', borderWidth: c.bw, animation: 'cornerPulse 2.5s ease-in-out ' + (i * 0.35) + 's infinite' };
              if (c.t != null) pos.top = c.t; else pos.bottom = c.b;
              if (c.l != null) pos.left = c.l; else pos.right = c.r;
              return h('div', { key: i, style: pos });
            }),
          // Beam
          h('div', {
            style: {
              position: 'absolute', left: 0, right: 0, height: 2.5, top: scanY + '%',
              background: 'linear-gradient(90deg, transparent 0%, #a78bfa 25%, #e879f9 50%, #a78bfa 75%, transparent 100%)',
              boxShadow: '0 0 10px #a78bfa, 0 0 30px rgba(168,132,250,.25)', opacity: 0.85
            }
          }),
          // Grid
          h('div', {
            style: {
              position: 'absolute', inset: 0, opacity: 0.06,
              backgroundImage: 'linear-gradient(rgba(168,132,250,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(168,132,250,.2) 1px,transparent 1px)',
              backgroundSize: '16px 16px',
              animation: 'gridScroll 3s linear infinite'
            }
          }),
          // Center
          h('div', {
            style: {
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 40, height: 16, borderRadius: 8,
              border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.03)'
            }
          }),
          // Label
          h('div', {
            style: {
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              fontSize: 7.5, fontWeight: 700, letterSpacing: '0.15em', color: '#a78bfa',
              textTransform: 'uppercase', animation: 'scanGlow 2s ease-in-out infinite'
            }
          }, sp > 0.4 ? 'ANALYZING...' : 'SCANNING')
        ),
        // Data panel
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, width: 270 } },
          h('div', {
            style: {
              fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: '#444',
              textTransform: 'uppercase', marginBottom: 4,
              opacity: clamp(map(sp, 0.12, 0.25, 0, 1), 0, 1),
              transform: 'translateX(' + ((1 - clamp(map(sp, 0.12, 0.25, 0, 1), 0, 1)) * 15) + 'px)'
            }
          }, 'MEDICATION INFO'),
          scanData.map(function (r, i) {
            var rp2 = clamp(map(sp, r.d, r.d + 0.1, 0, 1), 0, 1);
            var settled = rp2 >= 0.95;
            return h('div', {
              key: i,
              style: {
                padding: '6px 10px', borderRadius: 8, fontSize: 10.5, fontWeight: 600,
                color: r.c, background: 'rgba(255,255,255,.02)',
                border: '1px solid rgba(255,255,255,.04)',
                opacity: rp2,
                transform: settled ? 'none' : 'translateX(' + ((1 - rp2) * 18) + 'px)',
                animation: settled ? 'waveMove 4s ease-in-out ' + (i * 0.4) + 's infinite' : 'none'
              }
            },
              h('div', null, r.l),
              h('div', { style: { fontSize: 7.5, fontWeight: 400, color: r.sc, marginTop: 2 } }, r.sub)
            );
          })
        )
      )
    ),

    // ── Clinical Report ──
    vis('report', t) && h(Scene, { id: 'report', t: t },
      h('div', { style: { display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' } },
        // Card
        h('div', {
          style: {
            background: '#fff', color: '#1e293b', borderRadius: 16, padding: 24, width: 340,
            textAlign: 'left', fontSize: 10, lineHeight: 1.6,
            boxShadow: '0 24px 70px rgba(0,0,0,.5), 0 0 40px rgba(168,132,250,.06)',
            transform: 'perspective(800px) rotateY(' + lerp(6, 0, easeOutCubic(clamp(rp / 0.18, 0, 1))) + 'deg)',
            opacity: clamp(map(rp, 0, 0.06, 0, 1), 0, 1)
          }
        },
          h('div', { style: { fontSize: 13, fontWeight: 800 } }, 'Clinical Report'),
          h('div', { style: { fontSize: 8, color: '#94a3b8', borderBottom: '2px solid #0f172a', paddingBottom: 6, marginBottom: 10 } }, 'Tabib AI \u00B7 Generated just now'),
          h('div', { style: { fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', margin: '8px 0 4px' } }, 'Diagnostic Summary'),
          reportLines.map(function (w, i) {
            var lnp = clamp(map(rp, 0.08 + i * 0.03, 0.18 + i * 0.03, 0, 1), 0, 1);
            return h('div', { key: i, style: { height: 5, borderRadius: 3, background: '#e2e8f0', margin: '2px 0', overflow: 'hidden' } },
              h('div', { style: { height: '100%', borderRadius: 3, background: '#cbd5e1', width: (w * lnp) + '%', transition: 'width .5s ease' } })
            );
          }),
          h('div', { style: { fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', margin: '10px 0 3px' } }, 'Confidence'),
          h('div', { style: { height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' } },
            h('div', { style: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', width: rb1 + '%', transition: 'width .8s ease' } })
          ),
          h('div', { style: { fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', margin: '8px 0 3px' } }, 'Risk Level'),
          h('div', { style: { height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' } },
            h('div', { style: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#10b981,#34d399)', width: rb2 + '%', transition: 'width .8s ease' } })
          ),
          h('div', { style: { fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', margin: '8px 0 3px' } }, 'Follow-up Priority'),
          h('div', { style: { height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' } },
            h('div', { style: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', width: rb3 + '%', transition: 'width .8s ease' } })
          ),
          rp > 0.78 && h('div', {
            style: {
              marginTop: 10, padding: '5px 12px', borderRadius: 8,
              background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.1)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              opacity: clamp(map(rp, 0.78, 0.88, 0, 1), 0, 1),
              transform: 'translateY(' + ((1 - clamp(map(rp, 0.78, 0.88, 0, 1), 0, 1)) * 5) + 'px)'
            }
          },
            h('span', { style: { color: '#10b981', fontWeight: 700, fontSize: 10 } }, '\u2713'),
            h('span', { style: { color: '#10b981', fontSize: 8.5, fontWeight: 600 } }, 'Doctor-Ready')
          )
        ),
        // Metrics
        h('div', {
          style: {
            display: 'flex', flexDirection: 'column', gap: 10, width: 200,
            opacity: clamp(map(rp, 0.18, 0.35, 0, 1), 0, 1),
            transform: 'translateX(' + ((1 - clamp(map(rp, 0.18, 0.35, 0, 1), 0, 1)) * 18) + 'px)'
          }
        },
          [
            { l: 'VITALS', v: 'Normal', c: '#10b981' },
            { l: 'TEMPERATURE', v: '36.8\u00B0C', c: '#a78bfa' },
            { l: 'HEART RATE', v: '72 bpm', c: '#f87171' },
            { l: 'BLOOD O2', v: '98%', c: '#3b82f6' }
          ].map(function (m, i) {
            var mp = clamp(map(rp, 0.22 + i * 0.05, 0.38 + i * 0.05, 0, 1), 0, 1);
            return h('div', {
              key: i,
              style: {
                padding: '8px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,.025)',
                border: '1px solid rgba(255,255,255,.05)',
                opacity: mp,
                transform: 'translateY(' + ((1 - mp) * 10) + 'px)'
              }
            },
              h('div', { style: { fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', color: '#444' } }, m.l),
              h('div', { style: { fontSize: 14, fontWeight: 800, color: m.c, marginTop: 2 } }, m.v)
            );
          })
        )
      )
    ),

    // ── Languages ──
    vis('langs', t) && h(Scene, { id: 'langs', t: t },
      h('div', {
        style: {
          fontSize: 'clamp(2.2rem, 7vw, 5rem)', fontWeight: 900,
          letterSpacing: '-0.03em', marginBottom: '1rem',
          opacity: clamp(map(lp, 0, 0.18, 0, 1), 0, 1),
          transform: 'scale(' + (0.85 + clamp(map(lp, 0, 0.18, 0, 1), 0, 1) * 0.15) + ')'
        }
      },
        h('span', {
          style: {
            background: 'linear-gradient(135deg,#a78bfa,#e879f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }
        }, langCount + '+'),
        ' Languages'
      ),
      h('div', {
        style: {
          fontSize: 'clamp(.6rem, .9vw, .8rem)', color: '#444',
          letterSpacing: '0.1em', marginBottom: '1rem',
          opacity: clamp(map(lp, 0.1, 0.3, 0, 1), 0, 1)
        }
      }, 'Speak your language, get answers in yours'),
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 520 } },
        LANGS.map(function (l, i) {
          var lgp = clamp(map(lp, 0.06 + i * 0.018, 0.18 + i * 0.018, 0, 1), 0, 1);
          var settled = lgp >= 0.95;
          return h('span', {
            key: i,
            style: {
              padding: '5px 12px', borderRadius: 99, fontSize: 9.5, fontWeight: 600,
              background: lgp > 0 ? 'rgba(168,132,250,.06)' : 'transparent',
              border: '1px solid rgba(168,132,250,' + (lgp * 0.14) + ')',
              color: lgp > 0 ? '#c4b5fd' : '#222',
              opacity: lgp,
              transform: settled ? 'scale(1)' : 'scale(' + (0.7 + lgp * 0.3) + ')',
              transition: settled ? 'none' : 'all .25s cubic-bezier(.4,0,.2,1)',
              animation: settled ? 'driftSlow ' + (7 + (i % 4)) + 's ease-in-out ' + (i * 0.3) + 's infinite' : 'none'
            }
          }, l);
        })
      )
    ),

    // ── Stats ──
    vis('stats', t) && h(Scene, { id: 'stats', t: t },
      h('div', {
        style: {
          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#444', marginBottom: '1.5rem',
          opacity: clamp(map(stp, 0, 0.15, 0, 1), 0, 1),
          transform: 'translateY(' + ((1 - clamp(map(stp, 0, 0.15, 0, 1), 0, 1)) * 10) + 'px)'
        }
      }, 'BY THE NUMBERS'),
      h('div', { style: { display: 'flex', gap: 'clamp(2rem, 5vw, 4.5rem)', flexWrap: 'wrap', justifyContent: 'center' } },
        [
          { n: c1 + 'M+', d: 'Health Records', c: '#a78bfa', dl: 0 },
          { n: c2 + '%', d: 'Free Forever', c: '#34d399', dl: 0.06 },
          { n: c3 + '+', d: 'Languages', c: '#fbbf24', dl: 0.12 }
        ].map(function (s, i) {
          var ssp = clamp(map(stp, 0.04 + s.dl, 0.22 + s.dl, 0, 1), 0, 1);
          var settled = ssp >= 0.95;
          return h('div', {
            key: i,
            style: {
              textAlign: 'center', opacity: ssp,
              transform: settled ? 'none' : 'translateY(' + ((1 - ssp) * 25) + 'px)',
              animation: settled ? 'counterPop 3.5s ease-in-out ' + (i * 0.5) + 's infinite' : 'none'
            }
          },
            h('div', { style: { fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1, color: s.c } }, s.n),
            h('div', { style: { fontSize: 9.5, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#444', marginTop: 6 } }, s.d)
          );
        })
      ),
      h('div', { style: { display: 'flex', gap: 10, marginTop: '2.5rem', width: '65%', maxWidth: 380 } },
        [0, 1, 2].map(function (i) {
          return h('div', { key: i, style: { flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.03)', overflow: 'hidden' } },
            h('div', {
              style: {
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg,' + ['#a78bfa', '#34d399', '#fbbf24'][i] + ',' + ['#e879f9', '#10b981', '#f59e0b'][i] + ')',
                width: stp > 0.1 ? '100%' : '0%',
                transition: 'width 1.2s cubic-bezier(.4,0,.2,1) ' + (i * 0.1) + 's'
              }
            })
          );
        })
      ),
      h('div', {
        style: {
          marginTop: '1.5rem', display: 'flex', gap: 18,
          opacity: clamp(map(stp, 0.25, 0.45, 0, 1), 0, 1)
        }
      },
        ['AI-Powered', 'Instant', 'Private'].map(function (tag, i) {
          return h('span', {
            key: i,
            style: {
              fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', color: '#3a3a3a',
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.04)',
              opacity: clamp(map(stp, 0.3 + i * 0.04, 0.45 + i * 0.04, 0, 1), 0, 1)
            }
          }, tag);
        })
      )
    ),

    // ── How it works ──
    vis('steps', t) && h(Scene, { id: 'steps', t: t },
      h('div', {
        style: {
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#444', marginBottom: '1.5rem',
          opacity: clamp(map(stsp, 0, 0.15, 0, 1), 0, 1)
        }
      }, 'HOW IT WORKS'),
      h('div', { style: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 620 } },
        [
          { n: '01', t: 'Describe', d: 'Tell Tabib how you feel in plain language', icon: '\uD83D\uDCAC', dl: 0, accent: '#a78bfa' },
          { n: '02', t: 'Analyze', d: 'AI processes your symptoms in seconds', icon: '\uD83E\uDDE0', dl: 0.1, accent: '#e879f9' },
          { n: '03', t: 'Understand', d: 'Get clear, actionable health insights', icon: '\u2728', dl: 0.2, accent: '#34d399' }
        ].map(function (f, i) {
          var fp = clamp(map(stsp, 0.03 + f.dl, 0.22 + f.dl, 0, 1), 0, 1);
          var settled = fp >= 0.95;
          return h('div', {
            key: i,
            style: {
              padding: '1.2rem 1.5rem', borderRadius: 16, minWidth: 160,
              background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.04)',
              opacity: fp,
              transform: settled ? 'none' : 'translateY(' + ((1 - fp) * 18) + 'px)'
            }
          },
            h('div', { style: { fontSize: 22, marginBottom: 6 } }, f.icon),
            h('div', { style: { fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: f.accent, marginBottom: 4 } }, f.n),
            h('div', { style: { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 } }, f.t),
            h('div', { style: { fontSize: 9.5, color: '#555', lineHeight: 1.4 } }, f.d)
          );
        })
      ),
      h('div', {
        style: {
          marginTop: '1.5rem',
          opacity: clamp(map(stsp, 0.3, 0.5, 0, 1), 0, 1)
        }
      },
        h('span', { style: { fontSize: 8, color: '#3a3a3a', letterSpacing: '0.1em', fontWeight: 600 } }, 'Less than 30 seconds')
      )
    ),

    // ── CTA ──
    vis('cta', t) && h(Scene, { id: 'cta', t: t },
      h('div', {
        style: {
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,132,250,.08), transparent 70%)',
          pointerEvents: 'none',
          animation: 'bgOrbDrift 7s ease-in-out infinite',
          opacity: cp * 0.7
        }
      }),
      h('div', {
        style: {
          fontSize: 'clamp(2rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05,
          letterSpacing: '-0.035em', textAlign: 'center',
          opacity: clamp(map(cp, 0.06, 0.22, 0, 1), 0, 1),
          transform: 'scale(' + (0.88 + clamp(map(cp, 0.06, 0.22, 0, 1), 0, 1) * 0.12) + ')'
        }
      },
        'Your health,',
        h('br'),
        h('span', {
          style: {
            background: 'linear-gradient(135deg,#a78bfa,#e879f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'textGlow 3.5s ease-in-out infinite'
          }
        }, 'decoded.')
      ),
      h('div', {
        style: {
          opacity: clamp(map(cp, 0.2, 0.35, 0, 1), 0, 1), marginTop: 14,
          fontSize: 'clamp(.8rem, 1.4vw, 1.05rem)', color: '#555', fontWeight: 300,
          letterSpacing: '0.06em',
          transform: 'translateY(' + ((1 - clamp(map(cp, 0.2, 0.35, 0, 1), 0, 1)) * 10) + 'px)'
        }
      }, 'Free for everyone in Qatar'),
      cp > 0.32 && h('a', {
        href: 'https://tabib.cc', target: '_blank', rel: 'noopener',
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', color: '#000', padding: '14px 34px', borderRadius: 14,
          fontWeight: 800, fontSize: 'clamp(.85rem, 1.3vw, 1rem)',
          letterSpacing: '0.04em', textDecoration: 'none', marginTop: '2rem',
          boxShadow: '0 0 35px rgba(168,132,250,.15)',
          opacity: clamp(map(cp, 0.32, 0.48, 0, 1), 0, 1),
          transform: 'translateY(' + ((1 - clamp(map(cp, 0.32, 0.48, 0, 1), 0, 1)) * 12) + 'px) scale(' + (0.95 + clamp(map(cp, 0.32, 0.48, 0, 1), 0, 1) * 0.05) + ')',
          animation: cp > 0.95 ? 'glowPulse 3s ease-in-out infinite' : 'none',
          cursor: 'pointer'
        }
      }, 'tabib.cc \u2192'),
      h('div', {
        style: {
          opacity: clamp(map(cp, 0.45, 0.6, 0, 1), 0, 1), marginTop: '1.4rem',
          fontSize: 10.5, color: '#3a3a3a', fontWeight: 500, letterSpacing: '0.04em',
          display: 'flex', gap: 16,
          transform: 'translateY(' + ((1 - clamp(map(cp, 0.45, 0.6, 0, 1), 0, 1)) * 8) + 'px)'
        }
      },
        h('span', null, 'No sign-up'),
        h('span', { style: { color: '#2a2a2a' } }, '\u00B7'),
        h('span', null, 'Any browser'),
        h('span', { style: { color: '#2a2a2a' } }, '\u00B7'),
        h('span', null, 'Private')
      )
    ),

    // ── End ──
    vis('end', t) && h(Scene, { id: 'end', t: t },
      h('div', {
        style: {
          fontSize: 'clamp(3rem, 12vw, 9rem)', fontWeight: 900, letterSpacing: '-0.04em',
          opacity: clamp(map(ep, 0, 0.4, 0, 1), 0, 1),
          transform: 'scale(' + (0.85 + clamp(map(ep, 0, 0.4, 0, 1), 0, 1) * 0.15) + ')'
        }
      },
        h('span', {
          style: {
            background: 'linear-gradient(135deg,#a78bfa,#e879f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'textGlow 3s ease-in-out infinite'
          }
        }, 'TABIB')
      ),
      h('div', {
        style: {
          marginTop: 10, fontSize: 'clamp(.7rem, 1.2vw, .9rem)',
          color: '#444', fontWeight: 300, letterSpacing: '0.14em',
          opacity: clamp(map(ep, 0.15, 0.5, 0, 1), 0, 1),
          transform: 'translateY(' + ((1 - clamp(map(ep, 0.15, 0.5, 0, 1), 0, 1)) * 8) + 'px)'
        }
      }, 'tabib.cc')
    ),

    // ── Flash on cuts ──
    CUTS.map(function (ts, i) {
      var fp = clamp(map(t, ts, ts + 0.12, 0, 1), 0, 1);
      var fo = fp < 0.5 ? fp * 2 : 2 - fp * 2;
      return h('div', {
        key: 'flash-' + i,
        style: {
          position: 'absolute', inset: 0, background: '#fff',
          opacity: fo * 0.08, pointerEvents: 'none', zIndex: 10
        }
      });
    }),

    // ── Progress bar ──
    h('div', {
      style: {
        position: 'fixed', bottom: 0, left: 0, height: 2.5, width: prog + '%',
        background: 'linear-gradient(90deg, #a78bfa, #e879f9)', zIndex: 100
      }
    }),

    // ── Controls ──
    h('div', {
      style: {
        position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 100,
        background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.05)',
        borderRadius: 99, padding: '4px 14px', backdropFilter: 'blur(14px)'
      }
    },
      h('button', {
        onClick: restart,
        style: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 11, padding: '2px 5px', borderRadius: 5 }
      }, '\u21BA'),
      h('span', {
        style: { fontSize: 9.5, color: '#3a3a3a', fontVariantNumeric: 'tabular-nums' }
      }, Math.floor(t) + 's / ' + DUR + 's')
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
