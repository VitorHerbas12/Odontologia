/**
 * Background Waves: camadas de ondas suaves em canvas, para o fundo do hero.
 * Exposto como window.BackgroundWaves para <x-import component-from-global-scope="BackgroundWaves">.
 * Cor = `color` herdada do root (ex.: color: var(--accent)).
 */
(function () {
  const { useEffect, useRef } = React;

  // Camadas de trás para frente: cada uma começa mais baixa na tela e tem mais opacidade.
  const LAYERS = [
    { amp: 0.05, freq: 0.9, speed: 0.35, phase: 0.0, alpha: 0.08, y: 0.66 },
    { amp: 0.045, freq: 1.3, speed: -0.45, phase: 1.7, alpha: 0.12, y: 0.76 },
    { amp: 0.04, freq: 1.8, speed: 0.6, phase: 3.1, alpha: 0.16, y: 0.86 },
  ];

  function BackgroundWaves({ style, children = null, speed = 1 }) {
    const rootRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas && canvas.getContext("2d");
      if (!(root && canvas && ctx)) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let color = getComputedStyle(canvas).color;
      let width = 0, height = 0, time = 0, last = 0, raf = 0, visible = true;

      // Altura da crista de cada camada em um ponto x; soma de duas senoides para não ficar mecânico.
      const crest = (x, layer) => {
        const u = x / width;
        const phase = time * speed * layer.speed + layer.phase;
        return height * layer.y + height * layer.amp * (Math.sin(Math.PI * 2 * layer.freq * u + phase) + 0.45 * Math.sin(Math.PI * 2 * layer.freq * 1.9 * u - phase * 0.6));
      };

      const paint = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        LAYERS.forEach((layer) => {
          ctx.beginPath();
          ctx.moveTo(0, crest(0, layer));
          for (let x = 8; x <= width; x += 8) ctx.lineTo(x, crest(x, layer));
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.globalAlpha = layer.alpha;
          ctx.fillStyle = color;
          ctx.fill();

          // Linha da crista, um pouco mais marcada que o preenchimento.
          ctx.beginPath();
          ctx.moveTo(0, crest(0, layer));
          for (let x = 8; x <= width; x += 8) ctx.lineTo(x, crest(x, layer));
          ctx.globalAlpha = Math.min(1, layer.alpha * 2.5);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint();
      };

      const loop = (now) => {
        raf = 0;
        if (!last) last = now;
        time += Math.min((now - last) / 1000, 0.05);
        last = now;
        paint();
        if (visible) raf = requestAnimationFrame(loop);
      };
      const play = () => {
        if (!raf && visible && !reduceMotion) {
          last = 0;
          raf = requestAnimationFrame(loop);
        }
      };

      resize();
      canvas.style.opacity = "1";
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      // Para a animação quando o hero sai da tela ou a aba fica oculta.
      let onScreen = true;
      const intersection = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        visible = onScreen && !document.hidden;
        if (visible) play();
      });
      intersection.observe(root);
      const onVisibility = () => {
        visible = onScreen && !document.hidden;
        if (visible) play();
      };
      document.addEventListener("visibilitychange", onVisibility);
      const colorTimer = window.setInterval(() => {
        if (!visible) return;
        const next = getComputedStyle(canvas).color;
        if (next !== color) { color = next; paint(); }
      }, 500);
      play();

      return () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersection.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.clearInterval(colorTimer);
      };
    }, [speed]);

    return (
      <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
        <div aria-hidden="true" style={{ pointerEvents: "none", position: "absolute", inset: 0 }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", opacity: 0, transition: "opacity .8s ease-out" }} />
        </div>
        {children}
      </div>
    );
  }

  window.BackgroundWaves = BackgroundWaves;
})();
