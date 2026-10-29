/**
 * HeroTooth - Dente 3D Tecnológico & Biológico Vivo
 * Odontologia de Alta Precisão · Dr. Kenny Freitas
 *
 * Características implementadas:
 * 1. Movimento Principal: Flutuação suave (8-12px), rotação contínua sutil em Y, inclinação suave em X,
 *    e rastreamento suave do cursor sem movimentos bruscos ou estéticos de videogame.
 * 2. Efeito Interno Vivo: Pulsação lenta e orgânica das estruturas azuis e do núcleo laranja,
 *    com fluxo de energia viajando das raízes (azul) até o centro, onde se mescla ao calor âmbar/laranja.
 * 3. Scanner Médico: Feixe de luz ciano/azul com linha de precisão e aura difusa atravessando de cima a baixo,
 *    aumentando temporariamente o contraste anatômico, transparência do vidro e micropartículas.
 * 4. Reflexos & Highlights: Especularidade deslizante que reage à rotação e posição do cursor,
 *    com realces vítreos e efeito fresnel elegante nas bordas.
 * 5. Partículas Lumninosas: Motes azuis e laranjas viajando internamente pelos canais anatômicos.
 * 6. Ondas de Energia: Halos suaves periódicos nascendo no núcleo laranja e se expandindo.
 * 7. Interação com Cursor: Leve aumento de brilho, rotação proporcional e iluminação de proximidade.
 * 8. Parallax de Profundidade: Camadas com deslocamentos diferenciados (fundo, neural azul, núcleo laranja, partículas, vidro/reflexos).
 * 9. Sequência de Entrada: Fade-in suave de 1.5-2.0s com blur regressivo, ativação das bordas, ignição do núcleo e varredura inicial do scanner.
 * 10. Suporte a prefers-reduced-motion: Apresentação estática e refinada para acessibilidade.
 * 11. Fundo 100% transparente: Integrado perfeitamente sobre o Background Paths do site.
 */

(function () {
  // Temporário: dente branco enviado (tooth-1.png) como base. Para voltar ao dente anterior, use "assets/tooth-hero.png".
  // Temporário: camada azul (tooth-neural-blue.png) removida; restaure a linha de carregamento em Promise.all para reativá-la.
  const ASSETS = {
    hero: "assets/tooth-1.png",
    coreOrange: "assets/tooth-core-orange.png",
    specular: "assets/tooth-specular.png",
  };

  // Helper para carregar imagens com fallback
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Tenta caminho relativo com ./ caso falhe
        if (!src.startsWith("./")) {
          const retryImg = new Image();
          retryImg.onload = () => resolve(retryImg);
          retryImg.onerror = () => resolve(null);
          retryImg.src = "./" + src;
        } else {
          resolve(null);
        }
      };
      img.src = src;
    });
  }

  // Interpolação suave para trajetórias dos canais
  function getSplinePoint(points, t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const n = points.length - 1;
    const index = Math.min(Math.floor(clampedT * n), n - 1);
    const localT = clampedT * n - index;
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[Math.min(n, index + 1)];
    const p3 = points[Math.min(n, index + 2)];

    // Catmull-Rom spline
    const t2 = localT * localT;
    const t3 = t2 * localT;

    const x =
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * localT +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * localT +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    return { x, y };
  }

  // Definição dos canais anatômicos das raízes e câmara pulpar
  const CANAL_LEFT = [
    { x: 0.31, y: 0.92 }, // Ápice raiz esquerda
    { x: 0.27, y: 0.76 },
    { x: 0.28, y: 0.60 },
    { x: 0.36, y: 0.46 },
    { x: 0.47, y: 0.36 },
    { x: 0.54, y: 0.32 }, // Centro pulpar
  ];

  const CANAL_RIGHT = [
    { x: 0.64, y: 0.94 }, // Ápice raiz direita
    { x: 0.61, y: 0.77 },
    { x: 0.57, y: 0.60 },
    { x: 0.53, y: 0.46 },
    { x: 0.54, y: 0.32 }, // Centro pulpar
  ];

  const CANAL_CORONAL_LEFT = [
    { x: 0.52, y: 0.33 },
    { x: 0.40, y: 0.26 },
    { x: 0.29, y: 0.22 },
    { x: 0.25, y: 0.18 },
  ];

  const CANAL_CORONAL_RIGHT = [
    { x: 0.55, y: 0.32 },
    { x: 0.62, y: 0.25 },
    { x: 0.72, y: 0.21 },
    { x: 0.76, y: 0.19 },
  ];

  function HeroTooth() {
    const { useEffect, useRef, useState } = React;
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      let animationFrameId = null;
      let isDisposed = false;
      const startTime = performance.now();

      // Configuração de redução de movimento (Acessibilidade)
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

      // Estado de interação do cursor
      let targetMouseX = 0;
      let targetMouseY = 0;
      let mouseX = 0;
      let mouseY = 0;
      let mouseOver = 0; // 0 a 1 suave
      let targetMouseOver = 0;

      // Imagens das camadas
      let imgHero = null;
      let imgNeural = null;
      let imgCore = null;
      let imgSpecular = null;

      // Partículas internas (poucas e elegantes: ~18 no total)
      const particles = [];
      const PARTICLE_COUNT = 18;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const isOrange = i >= 11;
        const channelType = i % 4; // 0: canal esquerdo, 1: canal direito, 2: coronal esquerdo, 3: coronal direito/núcleo
        particles.push({
          progress: Math.random(),
          speed: 0.0007 + Math.random() * 0.0009,
          size: 1.2 + Math.random() * 1.8,
          alpha: 0.2 + Math.random() * 0.6,
          pulseOffset: Math.random() * Math.PI * 2,
          isOrange: isOrange,
          channelType: channelType,
          orbitAngle: Math.random() * Math.PI * 2,
          orbitRadius: 0.03 + Math.random() * 0.08,
          orbitSpeed: (0.0008 + Math.random() * 0.001) * (Math.random() > 0.5 ? 1 : -1),
        });
      }

      // Ondas periódicas de energia
      const energyWaves = [];
      let lastWaveTime = 0;

      // Estado do Scanner
      let scannerProgress = -0.3; // -0.3 a 1.3
      let isScanning = true;
      let scanCycleTimer = 0;

      // Carregar todas as camadas
      Promise.all([
        loadImage(ASSETS.hero),
        Promise.resolve(null), // camada azul temporariamente desativada
        loadImage(ASSETS.coreOrange),
        loadImage(ASSETS.specular),
      ]).then(([hero, neural, core, specular]) => {
        if (isDisposed) return;
        imgHero = hero;
        imgNeural = neural;
        imgCore = core;
        imgSpecular = specular;
        setIsLoaded(true);
        resize();
        schedule();
      });

      // Gerenciamento de dimensões e Retina / HiDPI
      let canvasW = 0;
      let canvasH = 0;
      let dpr = 1;

      const resize = () => {
        if (!container || !canvas) return;
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasW = Math.round(rect.width);
        canvasH = Math.round(rect.height);

        canvas.width = Math.round(canvasW * dpr);
        canvas.height = Math.round(canvasH * dpr);
        canvas.style.width = canvasW + "px";
        canvas.style.height = canvasH + "px";

        if (motionQuery.matches && imgHero) {
          renderStaticFrame();
        }
      };

      // Rastreamento suave do mouse
      const interactionArea = container.closest(".hero-art") || container.parentElement || container;

      const onPointerMove = (e) => {
        if (motionQuery.matches) return;
        const rect = interactionArea.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        targetMouseX = (px - 0.5) * 2; // -1 a +1
        targetMouseY = (py - 0.5) * 2; // -1 a +1
        targetMouseOver = 1;
        schedule();
      };

      const onPointerLeave = () => {
        targetMouseX = 0;
        targetMouseY = 0;
        targetMouseOver = 0;
        schedule();
      };

      interactionArea.addEventListener("pointermove", onPointerMove);
      interactionArea.addEventListener("pointerleave", onPointerLeave);
      interactionArea.addEventListener("mouseleave", onPointerLeave);

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      // Render estático para prefers-reduced-motion
      const renderStaticFrame = () => {
        if (!ctx || !imgHero) return;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvasW, canvasH);

        const toothAspect = 768 / 1024;
        let drawW = canvasW * 0.94;
        let drawH = drawW / toothAspect;
        if (drawH > canvasH * 0.94) {
          drawH = canvasH * 0.94;
          drawW = drawH * toothAspect;
        }
        const drawX = (canvasW - drawW) / 2;
        const drawY = (canvasH - drawH) / 2;

        ctx.drawImage(imgHero, drawX, drawY, drawW, drawH);
        ctx.restore();
      };

      // Loop de animação principal a 60 FPS
      const render = (currentTime) => {
        animationFrameId = null;
        if (isDisposed || !ctx || !imgHero) return;

        const time = currentTime - startTime;
        const elapsedSec = time / 1000;

        // Suavização do mouse (lerp orgânico amortecido)
        mouseX += (targetMouseX - mouseX) * 0.045;
        mouseY += (targetMouseY - mouseY) * 0.045;
        mouseOver += (targetMouseOver - mouseOver) * 0.04;

        // 1. Sequência de Entrada (0.0s a ~2.0s)
        const entranceProgress = Math.min(1, Math.max(0, elapsedSec / 1.7));
        // Curva suave ease-out cubic
        const entranceEase = 1 - Math.pow(1 - entranceProgress, 3);

        const entranceBlur = Math.max(0, (1 - entranceEase) * 12);
        const entranceOpacity = entranceProgress < 0.1 ? entranceProgress * 10 : 1;
        const entranceScale = 0.93 + 0.07 * entranceEase;

        // 2. Movimento Principal (Flutuação & Rotação 3D sutil)
        // Flutuação vertical lenta: 8–12 px de amplitude
        const floatY = Math.sin(time * 0.0016) * 9.5 * entranceEase;
        // Rotação Y contínua e ultra-suave
        const continuousRotY = Math.sin(time * 0.00085) * 3.2;
        const targetRotY = continuousRotY + mouseX * 7.5;
        // Pequena inclinação no eixo X
        const continuousRotX = Math.cos(time * 0.0012) * 1.6;
        const targetRotX = continuousRotX - mouseY * 5.5;

        // Aplicação do estilo 3D ao container
        container.style.opacity = String(entranceOpacity);
        container.style.filter = entranceBlur > 0.1 ? `blur(${entranceBlur.toFixed(1)}px)` : "none";
        container.style.transform = `perspective(1200px) translateY(${floatY.toFixed(
          2
        )}px) rotateY(${targetRotY.toFixed(2)}deg) rotateX(${targetRotX.toFixed(
          2
        )}deg) scale(${entranceScale.toFixed(3)})`;
        container.style.transformStyle = "preserve-3d";

        // Limpeza do canvas (fundo 100% transparente)
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Dimensões do dente centralizado
        const toothAspect = 768 / 1024;
        let drawW = canvasW * 0.94;
        let drawH = drawW / toothAspect;
        if (drawH > canvasH * 0.94) {
          drawH = canvasH * 0.94;
          drawW = drawH * toothAspect;
        }
        const drawX = (canvasW - drawW) / 2;
        const drawY = (canvasH - drawH) / 2;

        // Posição central do núcleo laranja em coordenadas da tela
        const coreCenterX = drawX + 0.54 * drawW;
        const coreCenterY = drawY + 0.32 * drawH;

        // 3. Parallax e deslocamentos por camada
        // Camadas internas e externas reagem com intensidades diferentes
        const parallaxBgX = -mouseX * 4;
        const parallaxBgY = -mouseY * 3;
        const parallaxNeuralX = mouseX * 4.5;
        const parallaxNeuralY = mouseY * 3.5;
        const parallaxCoreX = mouseX * 8.5;
        const parallaxCoreY = mouseY * 6.5;
        const parallaxParticlesX = mouseX * 11;
        const parallaxParticlesY = mouseY * 8;
        const parallaxSpecularX = mouseX * 15;
        const parallaxSpecularY = mouseY * 11;

        // 4. Scanner Lógico (Passa de cima a baixo)
        // Na entrada: varredura entre 0.8s e 2.2s
        if (elapsedSec < 2.4) {
          if (elapsedSec > 0.7) {
            scannerProgress = (elapsedSec - 0.7) / 1.5;
          } else {
            scannerProgress = -0.2;
          }
        } else {
          // Scanner cíclico periódico (a cada 9.5s)
          scanCycleTimer += 0.016;
          if (scanCycleTimer > 9.5) {
            scanCycleTimer = 0;
            isScanning = true;
          }
          if (isScanning) {
            scannerProgress += 0.0055;
            if (scannerProgress > 1.25) {
              isScanning = false;
              scannerProgress = -0.2;
            }
          }
        }

        const scannerActiveY = drawY + scannerProgress * drawH;
        const isScannerInTooth = scannerProgress >= -0.05 && scannerProgress <= 1.05;

        // 5. Efeito Interno Vivo: Pulsações biológicas suaves
        // Pulsação azul das estruturas
        const bluePulse = 0.78 + 0.22 * Math.sin(time * 0.0022);
        // Pulsação orgânica do núcleo laranja (batimento duplo cardiovascular)
        const orangeHeartbeat =
          0.72 +
          0.18 * Math.sin(time * 0.0028) +
          0.1 * Math.sin(time * 0.0056) +
          mouseOver * 0.15;

        // 6. Camada 0: Halo de Fundo Suave (Ambient Bloom)
        const ambientGrad = ctx.createRadialGradient(
          coreCenterX + parallaxBgX,
          coreCenterY + parallaxBgY,
          20,
          coreCenterX + parallaxBgX,
          coreCenterY + parallaxBgY,
          drawW * 0.52
        );
        ambientGrad.addColorStop(0, `rgba(14, 165, 233, ${(0.14 * bluePulse).toFixed(3)})`);
        ambientGrad.addColorStop(0.35, `rgba(56, 189, 248, ${(0.07 * bluePulse).toFixed(3)})`);
        ambientGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = ambientGrad;
        ctx.beginPath();
        ctx.arc(coreCenterX + parallaxBgX, coreCenterY + parallaxBgY, drawW * 0.52, 0, Math.PI * 2);
        ctx.fill();

        // 7. Camada 1: Dente Base (Visual Translúcido Hi-Res)
        ctx.save();
        // Leve iluminação adicional ao aproximar cursor
        if (mouseOver > 0.01) {
          ctx.filter = `brightness(${(1 + mouseOver * 0.12).toFixed(2)}) contrast(${(
            1 +
            mouseOver * 0.05
          ).toFixed(2)})`;
        }
        ctx.drawImage(imgHero, drawX, drawY, drawW, drawH);
        ctx.restore();

        // 8. Camada 2: Estrutura Neural / Canais Azuis Vivos (Lighter / Screen)
        if (imgNeural && entranceProgress > 0.35) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const neuralEntrance = Math.min(1, (entranceProgress - 0.35) / 0.5);
          ctx.globalAlpha = Math.max(0, Math.min(1, (bluePulse * 0.65 + mouseOver * 0.2) * neuralEntrance));
          ctx.drawImage(
            imgNeural,
            drawX + parallaxNeuralX * 0.3,
            drawY + parallaxNeuralY * 0.3,
            drawW,
            drawH
          );
          ctx.restore();
        }

        // 9. Camada 3: Núcleo Laranja Vivo (Cardiovascular / Impulso Energético)
        if (imgCore && entranceProgress > 0.5) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const coreEntrance = Math.min(1, (entranceProgress - 0.5) / 0.5);
          ctx.globalAlpha = Math.max(0, Math.min(1, orangeHeartbeat * coreEntrance * 0.95));
          ctx.drawImage(
            imgCore,
            drawX + parallaxCoreX * 0.45,
            drawY + parallaxCoreY * 0.45,
            drawW,
            drawH
          );

          // Brilho térmico central suave no coração do dente
          const coreWarmthGrad = ctx.createRadialGradient(
            coreCenterX + parallaxCoreX * 0.5,
            coreCenterY + parallaxCoreY * 0.5,
            5,
            coreCenterX + parallaxCoreX * 0.5,
            coreCenterY + parallaxCoreY * 0.5,
            drawW * 0.26
          );
          coreWarmthGrad.addColorStop(0, `rgba(251, 146, 60, ${(0.28 * orangeHeartbeat).toFixed(3)})`);
          coreWarmthGrad.addColorStop(0.5, `rgba(249, 115, 22, ${(0.12 * orangeHeartbeat).toFixed(3)})`);
          coreWarmthGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
          ctx.fillStyle = coreWarmthGrad;
          ctx.beginPath();
          ctx.arc(
            coreCenterX + parallaxCoreX * 0.5,
            coreCenterY + parallaxCoreY * 0.5,
            drawW * 0.26,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }

        // 10. Camada 4: Ondas de Energia Expansivas Periódicas
        // Nasce no centro pulpar e se expande suavemente
        if (elapsedSec > 2.5 && time - lastWaveTime > 6200) {
          lastWaveTime = time;
          energyWaves.push({
            birth: time,
            maxRadius: drawW * 0.55,
            duration: 3200,
          });
        }

        for (let w = energyWaves.length - 1; w >= 0; w--) {
          const wave = energyWaves[w];
          const waveAge = time - wave.birth;
          const waveProgress = waveAge / wave.duration;

          if (waveProgress >= 1) {
            energyWaves.splice(w, 1);
            continue;
          }

          // Halo circular sutil que desaparece progressivamente
          const currentRadius = 15 + wave.maxRadius * Math.sin(waveProgress * (Math.PI / 2));
          const waveAlpha = (1 - waveProgress) * 0.32 * Math.sin(waveProgress * Math.PI);

          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.lineWidth = 1.8 * (1 - waveProgress * 0.5);
          ctx.strokeStyle = `rgba(56, 189, 248, ${waveAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(
            coreCenterX + parallaxCoreX * 0.5,
            coreCenterY + parallaxCoreY * 0.5,
            currentRadius,
            currentRadius * 0.88,
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();

          // Anel secundário âmbar suave
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = `rgba(251, 146, 60, ${(waveAlpha * 0.55).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(
            coreCenterX + parallaxCoreX * 0.5,
            coreCenterY + parallaxCoreY * 0.5,
            Math.max(1, currentRadius - 8),
            Math.max(1, (currentRadius - 8) * 0.88),
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        }

        // 11. Camada 5: Partículas Luminosas Internas (Fluxo de Energia)
        if (entranceProgress > 0.6) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          particles.forEach((p) => {
            p.progress += p.speed;
            if (p.progress > 1) {
              p.progress = 0;
            }

            let pt = { x: 0.5, y: 0.5 };
            // Mapeamento ao longo dos canais anatômicos
            if (p.channelType === 0) {
              pt = getSplinePoint(CANAL_LEFT, p.progress);
            } else if (p.channelType === 1) {
              pt = getSplinePoint(CANAL_RIGHT, p.progress);
            } else if (p.channelType === 2) {
              pt = getSplinePoint(CANAL_CORONAL_LEFT, p.progress);
            } else {
              // Órbita fluida dentro do núcleo laranja
              p.orbitAngle += p.orbitSpeed;
              pt = {
                x: 0.54 + Math.cos(p.orbitAngle) * p.orbitRadius,
                y: 0.32 + Math.sin(p.orbitAngle) * (p.orbitRadius * 0.8),
              };
            }

            // Coordenadas mundiais com parallax
            const px = drawX + pt.x * drawW + parallaxParticlesX;
            const py = drawY + pt.y * drawH + parallaxParticlesY;

            // Transição de cor azul -> centro -> mistura-se com o laranja
            let pColor = "rgba(56, 189, 248,"; // Cyan
            if (p.isOrange || (pt.x > 0.46 && pt.x < 0.64 && pt.y > 0.22 && pt.y < 0.42)) {
              // Mistura com laranja no centro
              pColor = "rgba(251, 146, 60,"; // Laranja âmbar
            }

            // Intensificação ao passar pelo scanner
            let scanIntensity = 1;
            if (isScannerInTooth && Math.abs(py - scannerActiveY) < 32) {
              scanIntensity = 2.4;
            }

            const pAlpha =
              (p.alpha * (0.6 + 0.4 * Math.sin(time * 0.003 + p.pulseOffset)) * scanIntensity).toFixed(
                3
              );

            // Halo suave da partícula
            const pGrad = ctx.createRadialGradient(px, py, 0.5, px, py, p.size * 3.8);
            pGrad.addColorStop(0, `${pColor} ${pAlpha})`);
            pGrad.addColorStop(0.4, `${pColor} ${(pAlpha * 0.4).toFixed(3)})`);
            pGrad.addColorStop(1, `${pColor} 0)`);

            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(px, py, p.size * 3.8, 0, Math.PI * 2);
            ctx.fill();

            // Ponto central brilhante
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, pAlpha * 1.2)})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }

        // 12. Camada 6: Scanner Médico Tecnológico (Varredura de Precisão)
        if (isScannerInTooth && entranceProgress > 0.45) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          const scanY = scannerActiveY;
          // Largura proporcional do dente naquela altura Y para feixe anatômico
          const relY = Math.max(0, Math.min(1, (scanY - drawY) / drawH));
          const widthFactor =
            relY < 0.45
              ? 0.75 + Math.sin(relY * Math.PI) * 0.2
              : Math.max(0.3, 0.85 - (relY - 0.45) * 0.9);
          const beamW = drawW * widthFactor;
          const beamX = drawX + (drawW - beamW) / 2;

          // 1. Aura difusa do scanner (ilumina e dá contraste momentâneo)
          const auraGrad = ctx.createLinearGradient(0, scanY - 32, 0, scanY + 32);
          auraGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
          auraGrad.addColorStop(0.35, "rgba(56, 189, 248, 0.09)");
          auraGrad.addColorStop(0.5, "rgba(14, 165, 233, 0.22)");
          auraGrad.addColorStop(0.65, "rgba(56, 189, 248, 0.09)");
          auraGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

          ctx.fillStyle = auraGrad;
          ctx.fillRect(beamX - 12, scanY - 32, beamW + 24, 64);

          // 2. Linha fina de laser ciano/azul
          const lineGrad = ctx.createLinearGradient(beamX, scanY, beamX + beamW, scanY);
          lineGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
          lineGrad.addColorStop(0.15, "rgba(56, 189, 248, 0.7)");
          lineGrad.addColorStop(0.48, "rgba(224, 242, 254, 0.95)");
          lineGrad.addColorStop(0.52, "rgba(255, 255, 255, 1.0)");
          lineGrad.addColorStop(0.85, "rgba(56, 189, 248, 0.7)");
          lineGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

          ctx.fillStyle = lineGrad;
          ctx.fillRect(beamX, scanY - 1, beamW, 2);

          // 3. Brilho extra nas bordas do dente ao toque do feixe
          const edgeRadius = 6;
          [-1, 1].forEach((side) => {
            const edgeX = side === -1 ? beamX : beamX + beamW;
            const edgeGrad = ctx.createRadialGradient(edgeX, scanY, 0, edgeX, scanY, edgeRadius * 2);
            edgeGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
            edgeGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.5)");
            edgeGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
            ctx.fillStyle = edgeGrad;
            ctx.beginPath();
            ctx.arc(edgeX, scanY, edgeRadius * 2, 0, Math.PI * 2);
            ctx.fill();
          });

          // 4. Efeito de transparência cristalina e contraste anatômico aumentado na faixa do scanner
          if (imgSpecular) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(drawX, scanY - 26, drawW, 52);
            ctx.clip();
            ctx.globalAlpha = 0.45;
            ctx.drawImage(imgSpecular, drawX, drawY, drawW, drawH);
            ctx.restore();
          }

          ctx.restore();
        }

        // 13. Camada 7: Reflexos Especulares Deslizantes & Borda Vítrea (Fresnel)
        if (imgSpecular && entranceProgress > 0.4) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          // Especular reage ao movimento do cursor e da rotação
          const specAlpha = Math.min(
            1,
            (0.55 + Math.sin(time * 0.0018) * 0.12 + mouseOver * 0.3) *
              Math.min(1, (entranceProgress - 0.4) / 0.5)
          );
          ctx.globalAlpha = Math.max(0, specAlpha);

          ctx.drawImage(
            imgSpecular,
            drawX + parallaxSpecularX * 0.25,
            drawY + parallaxSpecularY * 0.25,
            drawW,
            drawH
          );

          // Highlight vítreo deslizante suave sobre a superfície translúcida
          const sheenCenterX = drawX + (0.42 + mouseX * 0.14) * drawW;
          const sheenCenterY = drawY + (0.28 + mouseY * 0.1) * drawH;
          const sheenGrad = ctx.createRadialGradient(
            sheenCenterX,
            sheenCenterY,
            12,
            sheenCenterX,
            sheenCenterY,
            drawW * 0.42
          );
          sheenGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.22 + mouseOver * 0.15).toFixed(3)})`);
          sheenGrad.addColorStop(0.4, "rgba(186, 230, 253, 0.08)");
          sheenGrad.addColorStop(1, "rgba(186, 230, 253, 0)");

          ctx.fillStyle = sheenGrad;
          ctx.beginPath();
          ctx.arc(sheenCenterX, sheenCenterY, drawW * 0.42, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // 14. Camada 8: Iluminação de Proximidade do Cursor
        if (mouseOver > 0.05) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const cursorSurfaceX = drawX + (0.5 + mouseX * 0.38) * drawW;
          const cursorSurfaceY = drawY + (0.45 + mouseY * 0.35) * drawH;

          const proximityGrad = ctx.createRadialGradient(
            cursorSurfaceX,
            cursorSurfaceY,
            8,
            cursorSurfaceX,
            cursorSurfaceY,
            drawW * 0.32
          );
          proximityGrad.addColorStop(0, `rgba(224, 242, 254, ${(0.16 * mouseOver).toFixed(3)})`);
          proximityGrad.addColorStop(0.5, `rgba(56, 189, 248, ${(0.07 * mouseOver).toFixed(3)})`);
          proximityGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

          ctx.fillStyle = proximityGrad;
          ctx.beginPath();
          ctx.arc(cursorSurfaceX, cursorSurfaceY, drawW * 0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
        schedule();
      };

      const schedule = () => {
        if (!isDisposed && !motionQuery.matches && !animationFrameId) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      const onMotionChange = () => {
        if (motionQuery.matches) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          renderStaticFrame();
        } else {
          schedule();
        }
      };

      motionQuery.addEventListener("change", onMotionChange);

      // Efeito 3D: inclinação com o mouse, balanço suave quando o mouse está parado e flutuação.
      // Aplicado ao contêiner inteiro, por cima das camadas do canvas.
      const tilt3d = { x: 0, y: 0, blend: 1 };
      let tiltFrameId = 0;
      let tiltLast = performance.now();
      const tiltStep = (now) => {
        tiltFrameId = 0;
        const dt = Math.min((now - tiltLast) / 1000, 0.05);
        tiltLast = now;
        const t = (now - startTime) / 1000;
        const rotateYGoal = targetMouseX * 14;
        const rotateXGoal = -targetMouseY * 9;
        tilt3d.x += (rotateXGoal - tilt3d.x) * (1 - Math.exp(-dt * 5));
        tilt3d.y += (rotateYGoal - tilt3d.y) * (1 - Math.exp(-dt * 5));
        tilt3d.blend += ((targetMouseOver ? 0 : 1) - tilt3d.blend) * (1 - Math.exp(-dt * 3));
        const rotateY = tilt3d.y + Math.sin(t * 0.8) * 10 * tilt3d.blend;
        const rotateX = tilt3d.x + Math.cos(t * 0.6) * 3 * tilt3d.blend;
        const lift = Math.sin(t * 1.3) * 6;
        container.style.transform =
          "perspective(900px) translate3d(0, " + lift + "px, 0) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";
        if (!isDisposed) tiltFrameId = requestAnimationFrame(tiltStep);
      };
      if (!motionQuery.matches) tiltFrameId = requestAnimationFrame(tiltStep);

      return () => {
        isDisposed = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (tiltFrameId) cancelAnimationFrame(tiltFrameId);
        container.style.transform = "";
        resizeObserver.disconnect();
        interactionArea.removeEventListener("pointermove", onPointerMove);
        interactionArea.removeEventListener("pointerleave", onPointerLeave);
        interactionArea.removeEventListener("mouseleave", onPointerLeave);
        motionQuery.removeEventListener("change", onMotionChange);
      };
    }, []);

    return React.createElement(
      "div",
      {
        ref: containerRef,
        className: "tooth-3d tooth-living-3d",
        role: "img",
        "aria-label": "Ilustração 3D de um dente branco",
        style: {
          position: "relative",
          width: "min(100%, 560px)",
          height: "100%",
          display: "grid",
          placeItems: "center",
          pointerEvents: "auto",
          userSelect: "none",
          touchAction: "none",
          willChange: "transform, filter, opacity",
        },
      },
      React.createElement("canvas", {
        ref: canvasRef,
        "aria-hidden": "true",
        style: {
          display: "block",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 1,
          pointerEvents: "auto",
        },
      })
    );
  }

  // Exportação para o ecossistema do site
  window.HeroTooth = HeroTooth;
})();
