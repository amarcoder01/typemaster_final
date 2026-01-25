import { useRef, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Share2, Check, ChevronDown, FileImage, FileText, Copy, Clipboard, Sparkles, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getTypingPerformanceRating, triggerCelebration } from "@/lib/share-utils";
import { generateVerificationQRCode } from "@/lib/qr-code-utils";
import { jsPDF } from "jspdf";

interface StressCertificateProps {
  wpm: number;
  accuracy: number;
  consistency: number;
  difficulty: string;
  stressScore: number;
  maxCombo: number;
  completionRate: number;
  survivalTime: number;
  activeChallenges: number;
  duration: number;
  username?: string;
  date?: Date;
  verificationId?: string; // Server-generated verification ID
  minimal?: boolean; // Only show download button, hide full share area
}

interface TierVisuals {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  borderGradient: [string, string, string];
  sealColor: string;
  accentColor: string;
}

const TIER_VISUALS: Record<string, TierVisuals> = {
  Diamond: {
    primaryColor: "#00d4ff",
    secondaryColor: "#9be7ff",
    glowColor: "rgba(0, 212, 255, 0.5)",
    borderGradient: ["#00d4ff", "#9be7ff", "#00d4ff"],
    sealColor: "#00d4ff",
    accentColor: "#ff6b6b",
  },
  Platinum: {
    primaryColor: "#c0c0c0",
    secondaryColor: "#e8e8e8",
    glowColor: "rgba(192, 192, 192, 0.5)",
    borderGradient: ["#a0a0a0", "#e8e8e8", "#a0a0a0"],
    sealColor: "#c0c0c0",
    accentColor: "#ff6b6b",
  },
  Gold: {
    primaryColor: "#ffd700",
    secondaryColor: "#ffed4a",
    glowColor: "rgba(255, 215, 0, 0.5)",
    borderGradient: ["#b8860b", "#ffd700", "#b8860b"],
    sealColor: "#ffd700",
    accentColor: "#ff6b6b",
  },
  Silver: {
    primaryColor: "#a8a8a8",
    secondaryColor: "#d4d4d4",
    glowColor: "rgba(168, 168, 168, 0.5)",
    borderGradient: ["#808080", "#d4d4d4", "#808080"],
    sealColor: "#a8a8a8",
    accentColor: "#ff6b6b",
  },
  Bronze: {
    primaryColor: "#cd7f32",
    secondaryColor: "#daa06d",
    glowColor: "rgba(205, 127, 50, 0.5)",
    borderGradient: ["#8b4513", "#cd7f32", "#8b4513"],
    sealColor: "#cd7f32",
    accentColor: "#ff6b6b",
  },
};

// Stress-themed motivational messages based on score
const getStressQuote = (stressScore: number): string => {
  if (stressScore >= 90) return "Unbreakable Under Pressure";
  if (stressScore >= 80) return "Master of Chaos";
  if (stressScore >= 70) return "Stress Warrior";
  if (stressScore >= 60) return "Pressure Performer";
  if (stressScore >= 50) return "Rising Under Fire";
  if (stressScore >= 40) return "Steady Progress";
  return "Building Resilience";
};

export function StressCertificate({
  wpm,
  accuracy,
  consistency,
  difficulty,
  stressScore,
  maxCombo,
  completionRate,
  survivalTime,
  activeChallenges,
  duration,
  username,
  date = new Date(),
  verificationId: serverVerificationId,
  minimal = false,
}: StressCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [certificateIdCopied, setCertificateIdCopied] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<HTMLImageElement | null>(null);
  const { toast } = useToast();

  const rating = getTypingPerformanceRating(wpm, accuracy);
  const tierVisuals = TIER_VISUALS[rating.badge] || TIER_VISUALS.Bronze;
  const stressQuote = getStressQuote(stressScore);

  // Generate certificate ID (server or fallback)
  const certificateId = useMemo(() => {
    if (serverVerificationId) return serverVerificationId;
    // Fallback: Generate client-side hash with proper 3-group format
    const data = `${wpm}-${accuracy}-${stressScore}-${difficulty}-${survivalTime}-${duration}`;
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
  }, [serverVerificationId, wpm, accuracy, stressScore, difficulty, survivalTime, duration]);

  // Load QR code image for any verification ID
  useEffect(() => {
    if (certificateId) {
      generateVerificationQRCode(certificateId, 120) // Higher resolution for better visibility
        .then(dataUrl => {
          const img = new Image();
          img.onload = () => setQrCodeImage(img);
          img.onerror = () => console.error('Failed to load QR code image');
          img.src = dataUrl;
        })
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [certificateId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayName = username || "Stress Warrior";

    canvas.width = 1200;
    canvas.height = 675;

    // Premium dark gradient background with stress-themed red/orange accents
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.7
    );
    bgGradient.addColorStop(0, "#1a1a2e");
    bgGradient.addColorStop(0.3, "#1e1628");
    bgGradient.addColorStop(0.6, "#16213e");
    bgGradient.addColorStop(1, "#0f0f23");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle stress-themed pattern overlay (lightning bolts)
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = "#ff6b6b";
    for (let i = 0; i < canvas.width; i += 80) {
      for (let j = 0; j < canvas.height; j += 80) {
        if ((i + j) % 160 === 0) {
          ctx.font = "16px system-ui";
          ctx.fillText("⚡", i, j);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Elegant outer border with tier color
    const borderWidth = 6;
    const borderGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    borderGradient.addColorStop(0, "#ff6b6b");
    borderGradient.addColorStop(0.3, tierVisuals.primaryColor);
    borderGradient.addColorStop(0.7, "#ff6b6b");
    borderGradient.addColorStop(1, tierVisuals.primaryColor);

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);

    // Inner decorative border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Corner decorations with stress accent
    const cornerSize = 35;
    const cornerOffset = 15;
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 2;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(cornerOffset, cornerOffset + cornerSize);
    ctx.lineTo(cornerOffset, cornerOffset);
    ctx.lineTo(cornerOffset + cornerSize, cornerOffset);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - cornerOffset - cornerSize, cornerOffset);
    ctx.lineTo(canvas.width - cornerOffset, cornerOffset);
    ctx.lineTo(canvas.width - cornerOffset, cornerOffset + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(cornerOffset, canvas.height - cornerOffset - cornerSize);
    ctx.lineTo(cornerOffset, canvas.height - cornerOffset);
    ctx.lineTo(cornerOffset + cornerSize, canvas.height - cornerOffset);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - cornerOffset - cornerSize, canvas.height - cornerOffset);
    ctx.lineTo(canvas.width - cornerOffset, canvas.height - cornerOffset);
    ctx.lineTo(canvas.width - cornerOffset, canvas.height - cornerOffset - cornerSize);
    ctx.stroke();

    // Header: ⚡ STRESS TEST CERTIFICATE
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 28px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚡", canvas.width / 2 - 200, 65);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("STRESS TEST CERTIFICATE", canvas.width / 2 + 20, 68);

    // Decorative line under header
    const lineWidth = 500;
    const lineY = 90;
    const lineGradient = ctx.createLinearGradient(
      canvas.width / 2 - lineWidth / 2, lineY,
      canvas.width / 2 + lineWidth / 2, lineY
    );
    lineGradient.addColorStop(0, "transparent");
    lineGradient.addColorStop(0.2, "#ff6b6b");
    lineGradient.addColorStop(0.5, tierVisuals.primaryColor);
    lineGradient.addColorStop(0.8, "#ff6b6b");
    lineGradient.addColorStop(1, "transparent");

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - lineWidth / 2, lineY);
    ctx.lineTo(canvas.width / 2 + lineWidth / 2, lineY);
    ctx.stroke();

    // "This certifies that"
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "italic 20px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("This certifies that", canvas.width / 2, 135);

    // User Name - Large and prominent with glow
    ctx.save();
    ctx.shadowColor = "#ff6b6b80";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(displayName, canvas.width / 2, 185);
    ctx.restore();

    // "has demonstrated exceptional composure under pressure"
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "italic 18px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("has demonstrated exceptional composure under pressure", canvas.width / 2, 225);

    // Difficulty and challenges info
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "600 16px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty  •  ${activeChallenges} Simultaneous Challenges`, canvas.width / 2, 255);

    // "with the following results:"
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "16px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("with the following results:", canvas.width / 2, 290);

    // Performance tier badge (TOP RIGHT corner)
    const badgeX = canvas.width - 100;
    const badgeY = 80;
    const badgeRadius = 40;

    ctx.save();
    ctx.shadowColor = tierVisuals.glowColor;
    ctx.shadowBlur = 20;

    const badgeGradient = ctx.createRadialGradient(badgeX, badgeY, 0, badgeX, badgeY, badgeRadius);
    badgeGradient.addColorStop(0, tierVisuals.secondaryColor);
    badgeGradient.addColorStop(0.7, tierVisuals.primaryColor);
    badgeGradient.addColorStop(1, tierVisuals.borderGradient[0]);

    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius - 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = tierVisuals.primaryColor;
    ctx.font = "bold 14px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(rating.badge.toUpperCase(), badgeX, badgeY + 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("TIER", badgeX, badgeY + 16);

    // Stats box background
    const statsBoxX = 150;
    const statsBoxY = 310;
    const statsBoxWidth = 900;
    const statsBoxHeight = 100;

    ctx.fillStyle = "rgba(255, 107, 107, 0.05)";
    ctx.beginPath();
    ctx.roundRect(statsBoxX, statsBoxY, statsBoxWidth, statsBoxHeight, 12);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 107, 107, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(statsBoxX, statsBoxY, statsBoxWidth, statsBoxHeight, 12);
    ctx.stroke();

    // Stats Row - 4 evenly spaced columns
    const row1Y = statsBoxY + 40;
    const columnWidth = statsBoxWidth / 4;
    const col1X = statsBoxX + columnWidth / 2;
    const col2X = statsBoxX + columnWidth + columnWidth / 2;
    const col3X = statsBoxX + columnWidth * 2 + columnWidth / 2;
    const col4X = statsBoxX + columnWidth * 3 + columnWidth / 2;

    // Column 1: Stress Score
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 36px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${stressScore}`, col1X, row1Y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("STRESS SCORE", col1X, row1Y + 22);

    // Vertical divider 1
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(statsBoxX + columnWidth, statsBoxY + 20);
    ctx.lineTo(statsBoxX + columnWidth, statsBoxY + statsBoxHeight - 20);
    ctx.stroke();

    // Column 2: Max Combo
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 36px 'JetBrains Mono', monospace";
    ctx.fillText(`${maxCombo}`, col2X, row1Y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("MAX COMBO", col2X, row1Y + 22);

    // Vertical divider 2
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(statsBoxX + columnWidth * 2, statsBoxY + 20);
    ctx.lineTo(statsBoxX + columnWidth * 2, statsBoxY + statsBoxHeight - 20);
    ctx.stroke();

    // Column 3: WPM
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px 'JetBrains Mono', monospace";
    ctx.fillText(`${wpm}`, col3X, row1Y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("WPM", col3X, row1Y + 22);

    // Vertical divider 3
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(statsBoxX + columnWidth * 3, statsBoxY + 20);
    ctx.lineTo(statsBoxX + columnWidth * 3, statsBoxY + statsBoxHeight - 20);
    ctx.stroke();

    // Column 4: Accuracy
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 36px 'JetBrains Mono', monospace";
    ctx.fillText(`${accuracy}%`, col4X, row1Y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("ACCURACY", col4X, row1Y + 22);

    // Survival time display
    const survivalMinutes = Math.floor(survivalTime / 60);
    const survivalSeconds = survivalTime % 60;
    const survivalTimeStr = survivalMinutes > 0 
      ? `${survivalMinutes}:${survivalSeconds.toString().padStart(2, '0')}`
      : `${survivalSeconds}s`;

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "14px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Survived: ${survivalTimeStr}  •  ${consistency}% consistency`, canvas.width / 2, statsBoxY + statsBoxHeight + 35);

    // Earned on date
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "16px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Earned on: ${formattedDate}`, canvas.width / 2, 480);

    // Motivational quote
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "italic 22px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(`"${stressQuote}"`, canvas.width / 2, 520);

    // Signature section
    const sigY = 580;

    // Signature line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 150, sigY);
    ctx.lineTo(canvas.width / 2 + 150, sigY);
    ctx.stroke();

    // AI Coach signature
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "italic 18px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("TypeMasterAI Stress Coach", canvas.width / 2, sigY - 10);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "11px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("Official Stress Test Certification Authority", canvas.width / 2, sigY + 18);

    // Footer with certificate ID, QR code, and URL
    const footerY = canvas.height - 25;

    // Draw QR code if available (positioned on the left)
    if (qrCodeImage) {
      const qrSize = 70;
      const qrX = 45;
      const qrY = footerY - qrSize - 8;

      // QR code background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6);

      // Draw QR code
      ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);

      // "Scan to Verify" text under QR
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "9px 'DM Sans', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan to Verify", qrX + qrSize / 2, qrY + qrSize + 12);
    }

    // Certificate ID - positioned to the right of QR code
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`ID: ${certificateId}`, qrCodeImage ? 140 : 50, footerY);

    // Center URL
    ctx.textAlign = "center";
    ctx.fillText("typemasterai.com/stress-test", canvas.width / 2, footerY);

    // Stress badge on right
    ctx.textAlign = "right";
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.fillText(`⚡ ${rating.badge.toUpperCase()} CERTIFIED`, canvas.width - 50, footerY);
  }, [wpm, accuracy, difficulty, stressScore, maxCombo, completionRate, survivalTime, activeChallenges, duration, username, date, rating.badge, tierVisuals, certificateId, qrCodeImage, consistency, stressQuote]);

  const downloadCertificate = (format: "png" | "jpg" | "pdf") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const filename = `typemaster-stress-certificate-${certificateId}`;

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
    } else {
      const link = document.createElement("a");
      link.download = `${filename}.${format}`;
      link.href = canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
      link.click();
    }

    toast({
      title: "Certificate Downloaded!",
      description: `Your stress test certificate has been saved as ${format.toUpperCase()}.`,
    });

    triggerCelebration();
  };


  const copyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);

        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2000);
        triggerCelebration('small');

        toast({
          title: "Certificate Copied!",
          description: "Paste directly into social media!",
        });
      } else {
        downloadCertificate("png");
      }
    } catch {
      downloadCertificate("png");
    }
  };

  const shareCertificate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharing(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      const file = new File([blob], `TypeMasterAI_StressTest_Certificate_${stressScore}pts.png`, { type: "image/png" });

      if ('share' in navigator && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `TypeMasterAI Stress Test Certificate - ${stressQuote}`,
          text: `⚡ I conquered the Stress Test with a score of ${stressScore}!\n\n🎯 ${wpm} WPM with ${accuracy}% accuracy\n🔥 ${maxCombo}x Max Combo\n🏅 ${rating.badge} Tier\n📜 Certificate: ${certificateId}\n\nCan you handle the pressure?\n\n🔗 typemasterai.com/stress-test`,
          files: [file],
        });
        triggerCelebration('large');
        toast({
          title: "Certificate Shared!",
          description: "Your stress test achievement is on its way!",
        });
      } else {
        downloadCertificate("png");
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        downloadCertificate("png");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <div className="relative w-full overflow-hidden rounded-lg sm:rounded-xl shadow-2xl" data-testid="stress-certificate-container" style={{ boxShadow: `0 25px 50px -12px rgba(255, 107, 107, 0.3)` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ maxWidth: "100%" }}
          data-testid="stress-certificate-canvas"
        />
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/60 rounded-full backdrop-blur-sm border border-white/10">
          <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-400" />
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-red-400">
            Stress Test
          </span>
        </div>
      </div>

      {/* Minimal mode: Only download button */}
      {minimal ? (
        <div className="w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full gap-1.5 sm:gap-2 min-h-[44px] h-10 sm:h-11 text-xs sm:text-sm text-white font-semibold active:scale-[0.98] transition-all touch-manipulation"
                style={{
                  background: `linear-gradient(135deg, #ff6b6b, ${tierVisuals.primaryColor}, #ff6b6b)`,
                }}
                data-testid="button-download-certificate"
              >
                <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                <span className="truncate">Download</span>
                <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 ml-auto shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44 sm:w-48 z-[200]">
              <DropdownMenuItem onClick={() => downloadCertificate("png")} className="cursor-pointer text-xs sm:text-sm min-h-[40px] touch-manipulation">
                <FileImage className="w-4 h-4 mr-2 shrink-0" />
                Download as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCertificate("jpg")} className="cursor-pointer text-xs sm:text-sm min-h-[40px] touch-manipulation">
                <FileImage className="w-4 h-4 mr-2 shrink-0" />
                Download as JPG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCertificate("pdf")} className="cursor-pointer text-xs sm:text-sm min-h-[40px] touch-manipulation">
                <FileText className="w-4 h-4 mr-2 shrink-0" />
                Download as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-[9px] sm:text-[10px] text-center text-zinc-500 mt-1.5 sm:mt-2" data-testid="text-certificate-id">
            Certificate ID: <span className="font-mono break-all text-red-400">{certificateId}</span>
            {serverVerificationId ? (
              <span className="ml-2 text-green-500">✓ Verifiable</span>
            ) : (
              <span className="ml-2 text-yellow-500">(Not Verifiable)</span>
            )}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-2 sm:space-y-3">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg sm:rounded-xl border border-zinc-700">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-red-400" />
              <p className="text-xs sm:text-sm font-medium text-red-400">Share Your Achievement</p>
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-red-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                onClick={copyImageToClipboard}
                variant="outline"
                className="gap-1.5 sm:gap-2 min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm bg-zinc-800/50 border-zinc-600 hover:bg-zinc-700/50 hover:border-zinc-500 active:scale-[0.98] transition-all touch-manipulation"
                data-testid="button-copy-certificate"
              >
                {imageCopied ? <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-500 shrink-0" /> : <Clipboard className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-red-400 shrink-0" />}
                <span className="text-zinc-200 truncate">{imageCopied ? "Copied!" : "Copy"}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-1.5 sm:gap-2 min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm bg-zinc-800/50 border-zinc-600 hover:bg-zinc-700/50 hover:border-zinc-500 active:scale-[0.98] transition-all touch-manipulation"
                    data-testid="button-download-certificate"
                  >
                    <Download className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-400 shrink-0" />
                    <span className="text-zinc-200 truncate">Download</span>
                    <ChevronDown className="w-2.5 sm:w-3 h-2.5 sm:h-3 ml-auto shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-44 sm:w-48 z-[200]">
                  <DropdownMenuItem onClick={() => downloadCertificate("png")} className="cursor-pointer text-xs sm:text-sm min-h-[40px] touch-manipulation">
                    <FileImage className="w-4 h-4 mr-2 shrink-0" />
                    Download as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadCertificate("jpg")} className="cursor-pointer text-xs sm:text-sm min-h-[40px] touch-manipulation">
                    <FileImage className="w-4 h-4 mr-2 shrink-0" />
                    Download as JPG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadCertificate("pdf")} className="cursor-pointer text-xs sm:text-sm min-h-[40px] touch-manipulation">
                    <FileText className="w-4 h-4 mr-2 shrink-0" />
                    Download as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {'share' in navigator && (
            <Button
              onClick={shareCertificate}
              disabled={isSharing}
              className="w-full gap-1.5 sm:gap-2 min-h-[48px] h-10 sm:h-11 text-xs sm:text-sm text-white font-semibold active:scale-[0.98] transition-all touch-manipulation"
              style={{
                background: `linear-gradient(135deg, #ff6b6b, ${tierVisuals.primaryColor}, #ff6b6b)`,
              }}
              data-testid="button-share-certificate"
            >
              <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
              <span className="truncate">{isSharing ? "Sharing..." : "Share"}</span>
            </Button>
          )}

          {/* Certificate ID Copy Section */}
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Certificate ID</label>
            <div className="flex gap-2">
              <Input
                value={certificateId}
                readOnly
                className="flex-1 font-mono text-sm bg-zinc-900 border-zinc-600 text-zinc-200"
                data-testid="input-certificate-id-view"
              />
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(certificateId);
                    setCertificateIdCopied(true);
                    setTimeout(() => setCertificateIdCopied(false), 2000);
                    toast({
                      title: "Certificate ID Copied!",
                      description: "Certificate ID has been copied to clipboard.",
                    });
                  } catch {
                    toast({
                      title: "Copy Failed",
                      description: "Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                size="sm"
                variant="outline"
                className="shrink-0 border-zinc-600 hover:bg-zinc-700"
                data-testid="button-copy-certificate-id-view"
              >
                {certificateIdCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            {serverVerificationId ? (
              <p className="text-xs text-green-500 mt-2 text-center">
                ✓ Official verification ID
              </p>
            ) : (
              <p className="text-xs text-yellow-500 mt-2 text-center">
                Sign in for official verifiable certificate
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
