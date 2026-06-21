import { useEffect, useRef } from "react";

interface MatrixRainProps {
  theme: "deep-purple" | "matrix-green" | "cyber-blue" | "crimson-ghost";
  enabled: boolean;
}

export default function MatrixRain({ theme, enabled }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Map theme to hex color coordinates for rain text
    const themeColors = {
      "deep-purple": { primary: "rgba(168, 85, 247, 0.45)", secondary: "rgba(168, 85, 247, 0.15)", glow: "#ea580c" },
      "matrix-green": { primary: "rgba(34, 197, 94, 0.45)", secondary: "rgba(34, 197, 94, 0.15)", glow: "#22c55e" },
      "cyber-blue": { primary: "rgba(6, 182, 212, 0.45)", secondary: "rgba(6, 182, 212, 0.15)", glow: "#38bdf8" },
      "crimson-ghost": { primary: "rgba(239, 68, 68, 0.45)", secondary: "rgba(239, 68, 68, 0.15)", glow: "#f43f5e" },
    };

    const colors = themeColors[theme] || themeColors["deep-purple"];

    // Unicode Hacker/Matrix Characters (Japanese Hiragana, Katakana, Matrix Codes)
    const characters = "010342598717ABCDEFGHIJKLMNØPQRSTÙVWXYZΩΨΦΞ☠☣⚡⚙✔";
    const charArray = characters.split("");

    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);

    // Initial drops y-coordinates array
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // stagger starting spots
    }

    let animationId: number;
    const draw = () => {
      // Clear canvas with trace opacity to produce rain trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Randomly make some characters highlight brightly as lead drops
        if (Math.random() > 0.985) {
          ctx.fillStyle = colors.glow;
          ctx.shadowBlur = 8;
          ctx.shadowColor = colors.glow;
        } else {
          ctx.fillStyle = Math.random() > 0.4 ? colors.primary : colors.secondary;
          ctx.shadowBlur = 0;
        }

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(char, x, y);

        // Reset drop to the top with randomized negative delay after going offscreen
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += 0.85; // Speed multiplier
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [theme, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.27] z-0"
      id="matrix-rain-canvas"
    />
  );
}
