/**
 * Background Paths — ported from Kokonut UI (https://kokonutui.com)
 * @author @dorianbaffier · @license MIT · v2.0.0
 * Port: TS types removed, Tailwind/cn replaced with inline styles, added `style` prop.
 * Line color = inherited CSS `color` of the root (set e.g. color: var(--primary)).
 *
 * Plain-JS build (no JSX, no fetch) so it loads from a <script> tag and works when the
 * page is opened directly from disk (file://), where Chrome blocks fetching background-paths.jsx.
 * Exposed as window.BackgroundPaths for <x-import component-from-global-scope="BackgroundPaths">.
 */

const SAMPLES = 64;
const OVERSCAN = 0.06;
const DRAW_MS = 1400;
const DRAW_STAGGER_MS = 40;
const PART_RADIUS = 150;
const PART_PUSH = 8;

const LAYERS = [
  { width: 1, opacity: 0.035, phase: 0.6, pace: 0.7, part: 0.45 },
  { width: 1.25, opacity: 0.055, phase: 0.3, pace: 0.85, part: 0.75 },
  { width: 1.5, opacity: 0.075, phase: 0, pace: 1, part: 1 },
];

function lineY(s, u, layer, frame, shape, band) {
  const t = frame.time * (shape.twist ? layer.pace : 1);
  const x = u * frame.width;
  const center =
    frame.height * 0.5 +
    shape.slope * (x - frame.width / 2) +
    band * 0.1 * Math.sin(Math.PI * 2 * (0.75 * u + 0.1) + (shape.twist ? layer.phase : 0) + t * 0.35);
  const turn = 0.22 + 0.09 * Math.sin(t * 0.21 + (shape.twist ? layer.phase : 0));
  const breathe = 0.3 * Math.sin(t * 0.5 + s * 4 + layer.phase);
  const c = Math.cos(Math.PI * (u - turn) + s * (0.6 + breathe) + layer.phase);
  // twist=false keeps the factor positive, so the ribbon never flips into a second, crossing direction.
  // twist=false: one factor shared by every line and layer, so lines stay parallel and never cross.
  const twist = shape.twist ? c : 0.75 + 0.25 * Math.cos(Math.PI * (u - turn));
  // Travelling wave: a crest that rolls along the lines, so the ribbon reads as moving water.
  const travel = shape.travel * band * Math.sin(Math.PI * 2 * 1.2 * u - t * 1.4 + s * 1.2 + layer.phase);
  return center + s * shape.spread * band * twist + travel;
}

function part(x, y, frame, strength) {
  const { pointer } = frame;
  if (pointer.amount < 0.001) return y;
  const dx = x - pointer.x;
  const dy = y - pointer.y;
  const falloff = Math.exp(-(dx * dx + dy * dy) / (PART_RADIUS * PART_RADIUS));
  const side = dy / (Math.abs(dy) + 24);
  return y + side * falloff * PART_PUSH * strength * pointer.amount;
}

function drawLines(ctx, frame, shape, color) {
  const { width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const band = Math.min(height, width * 1.1);
  const perLayer = Math.max(1, Math.round(shape.count / LAYERS.length));
  const xs = new Float32Array(SAMPLES + 1);
  const ys = new Float32Array(SAMPLES + 1);
  LAYERS.forEach((layer, layerIndex) => {
    ctx.lineWidth = layer.width;
    for (let i = 0; i < perLayer; i++) {
      const drawn = frame.drawn[layerIndex * perLayer + i] ?? 1;
      if (drawn <= 0) continue;
      // Interleave layers (offset by a third of a step) so they don't sit exactly on top of each other.
      const s = perLayer === 1 ? 0 : (i + (shape.twist ? 0 : layerIndex / LAYERS.length)) / (perLayer - 1) - 0.5;
      const last = Math.max(1, Math.ceil(SAMPLES * drawn));
      for (let k = 0; k <= last; k++) {
        const u = -OVERSCAN + (k / SAMPLES) * (1 + OVERSCAN * 2);
        const x = u * width;
        const y = lineY(s, u, layer, frame, shape, band);
        xs[k] = x;
        ys[k] = shape.interactive ? part(x, y, frame, layer.part) : y;
      }
      ctx.globalAlpha = Math.min(1, layer.opacity * shape.alpha * (0.45 + 0.55 * (1 - Math.abs(s) * 2)));
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let k = 1; k < last; k++) {
        const mx = (xs[k] + xs[k + 1]) / 2;
        const my = (ys[k] + ys[k + 1]) / 2;
        ctx.quadraticCurveTo(xs[k], ys[k], mx, my);
      }
      ctx.lineTo(xs[last], ys[last]);
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
}

const EASE_OUT = (t) => 1 - (1 - t) ** 3;

function BackgroundPaths({
  style,
  children = null,
  count = 42,
  spread = 1,
  angle = -8,
  speed = 1,
  interactive = true,
  mask = true,
  twist = true,
  travel = 0,
  alpha = 1,
}) {
  const rootRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext("2d");
    if (!(root && canvas && ctx)) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shape = {
      count,
      spread,
      slope: Math.tan((angle * Math.PI) / 180),
      interactive: interactive && !reduceMotion,
      twist,
      travel,
      alpha,
    };
    const perLayer = Math.max(1, Math.round(count / LAYERS.length));
    const total = perLayer * LAYERS.length;
    const frame = {
      width: 0, height: 0, time: 40,
      drawn: new Array(total).fill(reduceMotion ? 1 : 0),
      pointer: { x: 0, y: 0, amount: 0, on: false },
    };
    let color = getComputedStyle(canvas).color;
    let start = 0, last = 0, raf = 0, visible = true;
    const paint = () => drawLines(ctx, frame, shape, color);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      frame.width = rect.width;
      frame.height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    const loop = (now) => {
      raf = 0;
      if (!start) { start = now; last = now; }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      frame.time += dt * speed;
      const elapsed = now - start;
      for (let i = 0; i < frame.drawn.length; i++) {
        if (frame.drawn[i] < 1) {
          const local = (elapsed - (i % perLayer) * DRAW_STAGGER_MS) / DRAW_MS;
          frame.drawn[i] = EASE_OUT(Math.min(Math.max(local, 0), 1));
        }
      }
      const { pointer } = frame;
      pointer.amount += ((pointer.on ? 1 : 0) - pointer.amount) * 0.08;
      paint();
      const settling = frame.drawn.some((d) => d < 1) || (pointer.amount > 0.001 && !pointer.on) || pointer.on;
      if (visible && (speed > 0 || settling)) raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!raf && visible && !reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    canvas.style.opacity = "1";
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
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

    // Listen on the parent so content layered above (siblings) still parts the lines.
    const target = root.closest("section") || root.parentElement || root;
    const onMove = (event) => {
      if (event.pointerType !== "mouse" || !shape.interactive) return;
      const rect = canvas.getBoundingClientRect();
      frame.pointer.x = event.clientX - rect.left;
      frame.pointer.y = event.clientY - rect.top;
      frame.pointer.on = true;
      play();
    };
    const onLeave = () => { frame.pointer.on = false; play(); };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerleave", onLeave);
    play();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(colorTimer);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerleave", onLeave);
    };
  }, [count, spread, angle, speed, interactive, twist, travel, alpha]);

  const maskStyle = mask
    ? {
        maskImage:
          "linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent), radial-gradient(ellipse 40% 32% at 50% 50%, rgb(0 0 0 / 0.3), #000)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }
    : {};

  return React.createElement(
    "div",
    { ref: rootRef, style: { position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style } },
    React.createElement(
      "div",
      { "aria-hidden": "true", style: { pointerEvents: "none", position: "absolute", inset: 0, ...maskStyle } },
      React.createElement("canvas", {
        ref: canvasRef,
        style: { width: "100%", height: "100%", display: "block", opacity: 0, transition: "opacity .5s ease-out" },
      })
    ),
    children
  );
}

window.BackgroundPaths = BackgroundPaths;
