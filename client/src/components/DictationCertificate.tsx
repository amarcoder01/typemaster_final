import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Share2, Check, FileImage, FileText, ChevronDown, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTypingPerformanceRating, triggerCelebration } from "@/lib/share-utils";
import { generateVerificationQRCode } from "@/lib/qr-code-utils";
import { jsPDF } from "jspdf";

type DownloadFormat = "png" | "jpg" | "pdf";

interface DictationCertificateProps {
  wpm: number;
  accuracy: number;
  consistency: number;
  speedLevel: string;
  sentencesCompleted: number;
  totalWords: number;
  duration: number;
  username?: string;
  date?: Date;
  verificationId?: string;
  minimal?: boolean;
}

interface TierVisuals {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  borderGradient: [string, string, string];
  sealColor: string;
  accentColor: string;
  bgGradient: [string, string, string];
}

const TIER_VISUALS: Record<string, TierVisuals> = {
  Diamond: {
    primaryColor: "#00d4ff",
    secondaryColor: "#9be7ff",
    glowColor: "rgba(0, 212, 255, 0.5)",
    borderGradient: ["#00d4ff", "#9be7ff", "#00d4ff"],
    sealColor: "#00d4ff",
    accentColor: "#b388ff",
    bgGradient: ["#0a1628", "#0d2137", "#0a1628"],
  },
  Platinum: {
    primaryColor: "#e8e8e8",
    secondaryColor: "#ffffff",
    glowColor: "rgba(232, 232, 232, 0.5)",
    borderGradient: ["#c0c0c0", "#ffffff", "#c0c0c0"],
    sealColor: "#e8e8e8",
    accentColor: "#a0aec0",
    bgGradient: ["#1a1a2e", "#252540", "#1a1a2e"],
  },
  Gold: {
    primaryColor: "#ffd700",
    secondaryColor: "#ffed4a",
    glowColor: "rgba(255, 215, 0, 0.5)",
    borderGradient: ["#b8860b", "#ffd700", "#b8860b"],
    sealColor: "#ffd700",
    accentColor: "#f59e0b",
    bgGradient: ["#1a1510", "#2a2015", "#1a1510"],
  },
  Silver: {
    primaryColor: "#a8a8a8",
    secondaryColor: "#d4d4d4",
    glowColor: "rgba(168, 168, 168, 0.5)",
    borderGradient: ["#808080", "#d4d4d4", "#808080"],
    sealColor: "#a8a8a8",
    accentColor: "#94a3b8",
    bgGradient: ["#141418", "#1e1e24", "#141418"],
  },
  Bronze: {
    primaryColor: "#cd7f32",
    secondaryColor: "#daa06d",
    glowColor: "rgba(205, 127, 50, 0.5)",
    borderGradient: ["#8b4513", "#cd7f32", "#8b4513"],
    sealColor: "#cd7f32",
    accentColor: "#a0522d",
    bgGradient: ["#1a1412", "#261e1a", "#1a1412"],
  },
};

const TIER_ICONS: Record<string, string> = {
  Diamond: "◆",
  Platinum: "★",
  Gold: "✦",
  Silver: "●",
  Bronze: "■",
};

export function DictationCertificate({
  wpm,
  accuracy,
  consistency,
  speedLevel,
  sentencesCompleted,
  totalWords,
  duration,
  username,
  date = new Date(),
  verificationId: serverVerificationId,
  minimal = false,
}: DictationCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<HTMLImageElement | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>("png");
  const { toast } = useToast();

  const rating = getTypingPerformanceRating(wpm, accuracy);
  const tierVisuals = TIER_VISUALS[rating.badge] || TIER_VISUALS.Bronze;
  const tierIcon = TIER_ICONS[rating.badge] || "●";

  // Generate certificate ID (server or fallback)
  const certificateId = useMemo(() => {
    if (serverVerificationId) return serverVerificationId;
    const data = `${wpm}-${accuracy}-${consistency}-${speedLevel}-${totalWords}-${duration}`;
    let hash1 = 0;
    let hash2 = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1;
      hash2 = ((hash2 << 3) + hash2) ^ char;
      hash2 = hash2 & hash2;
    }
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const absHash1 = Math.abs(hash1);
    const absHash2 = Math.abs(hash2);
    let id = "TM-";
    for (let i = 0; i < 4; i++) {
      id += chars[(absHash1 >> (i * 4)) % chars.length];
    }
    id += "-";
    for (let i = 0; i < 4; i++) {
      id += chars[(absHash1 >> ((i + 4) * 4)) % chars.length];
    }
    id += "-";
    for (let i = 0; i < 4; i++) {
      id += chars[(absHash2 >> (i * 4)) % chars.length];
    }
    return id;
  }, [serverVerificationId, wpm, accuracy, consistency, speedLevel, totalWords, duration]);

  // Load QR code image
  useEffect(() => {
    if (certificateId) {
      generateVerificationQRCode(certificateId, 120)
        .then(dataUrl => {
          const img = new Image();
          img.onload = () => setQrCodeImage(img);
          img.onerror = () => console.error('Failed to load QR code image');
          img.src = dataUrl;
        })
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [certificateId]);

  // Draw helper functions
  const drawRoundedRect = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }, []);

  const drawCornerAccent = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number, rotation: number, color: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
    // Decorative dot
    ctx.beginPath();
    ctx.arc(size * 0.3, size * 0.3, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }, []);

  const drawHeadphonesIcon = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number, color: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = "round";
    
    // Headband arc
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, Math.PI, 0, false);
    ctx.stroke();
    
    // Left ear cup
    ctx.beginPath();
    drawRoundedRect(ctx, -size * 0.5, -size * 0.1, size * 0.2, size * 0.35, size * 0.05);
    ctx.fill();
    
    // Right ear cup
    ctx.beginPath();
    drawRoundedRect(ctx, size * 0.3, -size * 0.1, size * 0.2, size * 0.35, size * 0.05);
    ctx.fill();
    
    ctx.restore();
  }, [drawRoundedRect]);

  const drawSealWithRays = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, radius: number, tierVisuals: TierVisuals, tierIcon: string, badge: string
  ) => {
    const rayCount = 16;
    
    // Outer glow
    const glowGradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
    glowGradient.addColorStop(0, tierVisuals.glowColor);
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Radiating rays
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, radius * 0.7);
      ctx.lineTo(-radius * 0.08, radius * 1.2);
      ctx.lineTo(radius * 0.08, radius * 1.2);
      ctx.closePath();
      ctx.fillStyle = tierVisuals.primaryColor + "40";
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    
    // Main seal circle
    const sealGradient = ctx.createRadialGradient(x, y - radius * 0.2, 0, x, y, radius);
    sealGradient.addColorStop(0, tierVisuals.primaryColor + "60");
    sealGradient.addColorStop(0.7, tierVisuals.primaryColor + "30");
    sealGradient.addColorStop(1, tierVisuals.primaryColor + "10");
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = sealGradient;
    ctx.fill();
    
    // Seal border
    ctx.strokeStyle = tierVisuals.primaryColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = tierVisuals.primaryColor + "80";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Tier icon
    ctx.font = `bold ${radius * 0.5}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = tierVisuals.primaryColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tierIcon, x, y - radius * 0.15);
    
    // Badge text
    ctx.font = `bold ${radius * 0.25}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(badge.toUpperCase(), x, y + radius * 0.35);
  }, []);

  const drawGlassmorphicCard = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, color: string
  ) => {
    // Card background with glassmorphism effect
    ctx.save();
    drawRoundedRect(ctx, x, y, w, h, 12);
    
    // Semi-transparent background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fill();
    
    // Subtle border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Top highlight for glass effect
    ctx.beginPath();
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + w - 12, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 12);
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.lineTo(x, y + h * 0.3);
    ctx.lineTo(x, y + 12);
    ctx.quadraticCurveTo(x, y, x + 12, y);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fill();
    
    // Accent line at bottom
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h - 4);
    ctx.lineTo(x + w * 0.8, y + h - 4);
    ctx.strokeStyle = color + "60";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    
    ctx.restore();
  }, [drawRoundedRect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawCertificate = () => {
      const width = 1200;
      const height = 900;
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size with device pixel ratio for crisp rendering
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // === BACKGROUND ===
      // Multi-layer gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, tierVisuals.bgGradient[0]);
      bgGradient.addColorStop(0.5, tierVisuals.bgGradient[1]);
      bgGradient.addColorStop(1, tierVisuals.bgGradient[2]);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle radial overlay
      const radialOverlay = ctx.createRadialGradient(width / 2, height * 0.3, 0, width / 2, height * 0.3, width * 0.8);
      radialOverlay.addColorStop(0, tierVisuals.primaryColor + "08");
      radialOverlay.addColorStop(1, "transparent");
      ctx.fillStyle = radialOverlay;
      ctx.fillRect(0, 0, width, height);

      // Decorative pattern (subtle grid)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 60) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // === BORDERS ===
      // Outer border with gradient
      const borderGradient = ctx.createLinearGradient(0, 0, width, height);
      borderGradient.addColorStop(0, tierVisuals.borderGradient[0]);
      borderGradient.addColorStop(0.5, tierVisuals.borderGradient[1]);
      borderGradient.addColorStop(1, tierVisuals.borderGradient[2]);
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, 25, 25, width - 50, height - 50, 20);
      ctx.stroke();

      // Inner border
      ctx.strokeStyle = tierVisuals.primaryColor + "40";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 15);
      ctx.stroke();

      // === CORNER ACCENTS ===
      const cornerSize = 35;
      const cornerOffset = 50;
      drawCornerAccent(ctx, cornerOffset, cornerOffset, cornerSize, 0, tierVisuals.primaryColor);
      drawCornerAccent(ctx, width - cornerOffset, cornerOffset, cornerSize, Math.PI / 2, tierVisuals.primaryColor);
      drawCornerAccent(ctx, width - cornerOffset, height - cornerOffset, cornerSize, Math.PI, tierVisuals.primaryColor);
      drawCornerAccent(ctx, cornerOffset, height - cornerOffset, cornerSize, -Math.PI / 2, tierVisuals.primaryColor);

      // === HEADER SECTION ===
      // Logo badge (top left)
      const logoX = 100;
      const logoY = 85;
      ctx.beginPath();
      ctx.arc(logoX, logoY, 30, 0, Math.PI * 2);
      const logoGradient = ctx.createRadialGradient(logoX, logoY, 0, logoX, logoY, 30);
      logoGradient.addColorStop(0, tierVisuals.primaryColor + "30");
      logoGradient.addColorStop(1, tierVisuals.primaryColor + "10");
      ctx.fillStyle = logoGradient;
      ctx.fill();
      ctx.strokeStyle = tierVisuals.primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = tierVisuals.primaryColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TM", logoX, logoY);

      // Mode badge (top right) - Dictation Mode indicator
      const badgeText = "Dictation Mode";
      ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
      const badgeWidth = ctx.measureText(badgeText).width + 50;
      const badgeX = width - 60 - badgeWidth;
      const badgeY = 60;
      
      drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 40, 20);
      ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Headphones icon in badge
      drawHeadphonesIcon(ctx, badgeX + 22, badgeY + 20, 24, "#e9d5ff");
      
      ctx.fillStyle = "#e9d5ff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, badgeX + 40, badgeY + 21);

      // === TITLE SECTION ===
      // Main title
      ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = tierVisuals.primaryColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("CERTIFICATE OF ACHIEVEMENT", width / 2, 130);

      // Subtitle with headphones icon
      ctx.font = "24px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#a855f7";
      drawHeadphonesIcon(ctx, width / 2 - 120, 195, 30, "#a855f7");
      ctx.fillText("DICTATION MASTERY", width / 2 + 15, 182);

      // Decorative line under subtitle
      const lineY = 215;
      const lineGradient = ctx.createLinearGradient(width * 0.3, lineY, width * 0.7, lineY);
      lineGradient.addColorStop(0, "transparent");
      lineGradient.addColorStop(0.2, tierVisuals.primaryColor + "60");
      lineGradient.addColorStop(0.5, tierVisuals.primaryColor);
      lineGradient.addColorStop(0.8, tierVisuals.primaryColor + "60");
      lineGradient.addColorStop(1, "transparent");
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.25, lineY);
      ctx.lineTo(width * 0.75, lineY);
      ctx.stroke();

      // === RECIPIENT SECTION ===
      ctx.font = "26px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("This certifies that", width / 2, 255);

      // Username with decorative lines
      const displayName = username || "Typing Expert";
      ctx.font = "bold 56px Georgia, serif";
      ctx.fillStyle = tierVisuals.secondaryColor;
      ctx.fillText(displayName, width / 2, 310);

      // Decorative lines around name
      const nameWidth = ctx.measureText(displayName).width;
      const nameLineY = 335;
      ctx.strokeStyle = tierVisuals.primaryColor + "40";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - nameWidth / 2 - 60, nameLineY);
      ctx.lineTo(width / 2 - nameWidth / 2 - 20, nameLineY);
      ctx.moveTo(width / 2 + nameWidth / 2 + 20, nameLineY);
      ctx.lineTo(width / 2 + nameWidth / 2 + 60, nameLineY);
      ctx.stroke();

      // Achievement text
      ctx.font = "22px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("has demonstrated exceptional listening and typing mastery", width / 2, 375);
      ctx.fillText("through the TypeMasterAI Dictation Challenge", width / 2, 405);

      // === METRICS CARDS ===
      const cardY = 455;
      const cardHeight = 100;
      const cardWidth = 160;
      const cardSpacing = 40;
      const totalCardsWidth = 4 * cardWidth + 3 * cardSpacing;
      const startX = (width - totalCardsWidth) / 2;

      const metrics = [
        { label: "SPEED", value: `${wpm}`, unit: "WPM", color: tierVisuals.primaryColor },
        { label: "ACCURACY", value: `${accuracy.toFixed(1)}`, unit: "%", color: "#a855f7" },
        { label: "CONSISTENCY", value: `${consistency}`, unit: "%", color: tierVisuals.accentColor },
        { label: "LEVEL", value: speedLevel, unit: "", color: tierVisuals.primaryColor },
      ];

      metrics.forEach((metric, index) => {
        const x = startX + index * (cardWidth + cardSpacing);
        
        // Draw glassmorphic card
        drawGlassmorphicCard(ctx, x, cardY, cardWidth, cardHeight, metric.color);
        
        // Value
        ctx.font = "bold 36px 'JetBrains Mono', monospace, system-ui";
        ctx.fillStyle = metric.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const valueText = metric.unit ? `${metric.value}${metric.unit === "WPM" ? "" : metric.unit}` : metric.value;
        ctx.fillText(valueText, x + cardWidth / 2, cardY + 40);
        
        // Unit (only for WPM)
        if (metric.unit === "WPM") {
          ctx.font = "14px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.fillText("WPM", x + cardWidth / 2, cardY + 65);
        }
        
        // Label
        ctx.font = "12px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(metric.label, x + cardWidth / 2, cardY + cardHeight - 15);
      });

      // === SESSION STATS ===
      ctx.font = "18px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94a3b8";
      const durationText = duration >= 60 
        ? `${Math.floor(duration / 60)} Min ${duration % 60 > 0 ? `${duration % 60} Sec` : ""}`
        : `${duration} Seconds`;
      ctx.fillText(
        `${sentencesCompleted} Sentences  •  ${totalWords} Words  •  ${durationText}`,
        width / 2,
        590
      );

      // === FOOTER SECTION ===
      // Achievement seal (left side)
      drawSealWithRays(ctx, 160, 740, 55, tierVisuals, tierIcon, rating.badge);

      // Branding (center)
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = tierVisuals.primaryColor;
      ctx.textAlign = "center";
      ctx.fillText("TypeMasterAI", width / 2, 700);

      ctx.font = "16px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Master Your Typing with AI", width / 2, 725);

      ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#a855f7";
      ctx.fillText("typemasterai.com/dictation-mode", width / 2, 750);

      // Issue date
      ctx.font = "14px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#64748b";
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      ctx.fillText(`Issued: ${formattedDate}`, width / 2, 780);

      // QR Code (right side)
      if (qrCodeImage) {
        const qrSize = 90;
        const qrX = width - 160 - qrSize / 2;
        const qrY = 700;

        // QR background
        ctx.fillStyle = "#ffffff";
        drawRoundedRect(ctx, qrX - qrSize / 2 - 5, qrY - qrSize / 2 - 5, qrSize + 10, qrSize + 10, 8);
        ctx.fill();

        // Draw QR code
        ctx.drawImage(qrCodeImage, qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize);

        // Scan to verify text
        ctx.font = "11px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Scan to Verify", qrX, qrY + qrSize / 2 + 18);
      }

      // === VERIFICATION SECTION ===
      // Verification badge
      const verifyY = 850;
      const verifyX = width / 2;

      // Checkmark circle
      ctx.beginPath();
      ctx.arc(verifyX - 120, verifyY, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      ctx.fill();
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Checkmark
      ctx.save();
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(verifyX - 123, verifyY);
      ctx.lineTo(verifyX - 120, verifyY + 3);
      ctx.lineTo(verifyX - 115, verifyY - 3);
      ctx.stroke();
      ctx.restore();

      // Verification text
      ctx.font = "13px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "left";
      ctx.fillText("Digitally Verified", verifyX - 105, verifyY + 4);

      // Separator
      ctx.fillStyle = "#64748b";
      ctx.fillText("•", verifyX - 5, verifyY + 4);

      // Certificate ID
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#a855f7";
      ctx.fillText(certificateId, verifyX + 10, verifyY + 4);
    };

    drawCertificate();
  }, [wpm, accuracy, consistency, speedLevel, sentencesCompleted, totalWords, duration, username, date, rating.badge, tierVisuals, tierIcon, certificateId, qrCodeImage, drawRoundedRect, drawCornerAccent, drawHeadphonesIcon, drawSealWithRays, drawGlassmorphicCard]);

  const downloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `typemaster-dictation-certificate-${certificateId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Certificate Downloaded!",
      description: "Your dictation certificate has been saved as PNG.",
    });
    triggerCelebration();
  }, [certificateId, toast]);

  const downloadJPG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `typemaster-dictation-certificate-${certificateId}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    
    toast({
      title: "Certificate Downloaded!",
      description: "Your dictation certificate has been saved as JPG.",
    });
    triggerCelebration();
  }, [certificateId, toast]);

  const downloadPDF = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = 297;
    const pdfHeight = 210;
    const canvasAspectRatio = 1200 / 900;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let imgWidth = pdfWidth;
    let imgHeight = pdfHeight;

    if (canvasAspectRatio > pdfAspectRatio) {
      imgHeight = pdfWidth / canvasAspectRatio;
    } else {
      imgWidth = pdfHeight * canvasAspectRatio;
    }

    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
    pdf.save(`typemaster-dictation-certificate-${certificateId}.pdf`);
    
    toast({
      title: "Certificate Downloaded!",
      description: "Your dictation certificate has been saved as PDF.",
    });
    triggerCelebration();
  }, [certificateId, toast]);

  const handleDownload = useCallback(() => {
    switch (selectedFormat) {
      case "png":
        downloadPNG();
        break;
      case "jpg":
        downloadJPG();
        break;
      case "pdf":
        downloadPDF();
        break;
    }
  }, [selectedFormat, downloadPNG, downloadJPG, downloadPDF]);

  const shareToSocial = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharing(true);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share && navigator.canShare({ files: [new File([blob], "certificate.png", { type: "image/png" })] })) {
        await navigator.share({
          title: "TypeMasterAI Dictation Certificate",
          text: `I achieved ${wpm} WPM with ${accuracy.toFixed(1)}% accuracy in Dictation Mode! 🎧`,
          files: [new File([blob], "certificate.png", { type: "image/png" })],
        });
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2000);
        toast({
          title: "Image Copied!",
          description: "Certificate image copied to clipboard. Paste it anywhere!",
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: "Please try downloading instead.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Canvas with responsive sizing */}
      <div className="relative w-full overflow-hidden rounded-xl border-2 border-border shadow-2xl">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ maxWidth: "100%" }}
        />
      </div>

      {/* Action buttons - responsive layout */}
      {!minimal && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
          {/* Download with format dropdown */}
          <div className="flex gap-2">
            <Button 
              onClick={handleDownload} 
              className="gap-2 flex-1 sm:flex-none" 
              data-testid="button-download-certificate"
            >
              <Download className="w-4 h-4" />
              Download {selectedFormat.toUpperCase()}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-format-dropdown">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedFormat("png")} className="gap-2">
                  <FileImage className="w-4 h-4" />
                  PNG (High Quality)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFormat("jpg")} className="gap-2">
                  <FileImage className="w-4 h-4" />
                  JPG (Compressed)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFormat("pdf")} className="gap-2">
                  <FileText className="w-4 h-4" />
                  PDF (Printable)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Share button */}
          <Button 
            onClick={shareToSocial} 
            variant="outline" 
            className="gap-2" 
            disabled={isSharing} 
            data-testid="button-share-certificate"
          >
            {imageCopied ? (
              <>
                <Check className="w-4 h-4" />
                Image Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                {isSharing ? "Sharing..." : "Share Certificate"}
              </>
            )}
          </Button>
        </div>
      )}

      {minimal && (
        <div className="flex justify-center">
          <Button onClick={downloadPNG} className="gap-2" size="sm" data-testid="button-download-certificate">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      )}

      {/* Share hint */}
      {!minimal && (
        <p className="text-sm text-muted-foreground text-center">
          Share your achievement on social media
        </p>
      )}
    </div>
  );
}
