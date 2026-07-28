// ── Canvas Particle Engine ────────────────────
// Runs independently, renders connected floating particles

(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const COUNT = 90;
  const CONNECT_DIST = 110;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // ── Particle class ─────────────────────────
  function Particle() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = (Math.random() - 0.5) * 0.35;
    this.radius = Math.random() * 1.6 + 0.4;
    this.alpha = Math.random() * 0.35 + 0.05;
    this.phase = Math.random() * Math.PI * 2;
  }

  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.phase += 0.02;
    if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
    }
  };

  Particle.prototype.draw = function () {
    var a = this.alpha * (0.6 + 0.4 * Math.sin(this.phase));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168,132,250,' + a + ')';
    ctx.fill();
  };

  // ── Init particles ─────────────────────────
  for (var i = 0; i < COUNT; i++) {
    particles.push(new Particle());
  }

  // ── Draw connection lines ──────────────────
  function drawConnections() {
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(168,132,250,' + (0.05 * (1 - dist / CONNECT_DIST)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  // ── Main loop ──────────────────────────────
  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    drawConnections();
    requestAnimationFrame(loop);
  }

  loop();
})();
