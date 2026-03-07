"use client";

import { useRef, useEffect, useState } from "react";

/** Print area aspect ratio (width × height) e.g. tops front/back 38×43 */
const PRINT_ASPECT = 38 / 43;
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 400;
/** Product template for front placement (may 404 if images not added) */
const DEFAULT_PRODUCT_IMAGE = "/placement-guidance/Print_Position_Front_Large.png";

type Props = {
  artworkUrl: string | null | undefined;
  productImageUrl?: string | null;
  className?: string;
};

export function ArtworkMockupCanvas({
  artworkUrl,
  productImageUrl = DEFAULT_PRODUCT_IMAGE,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [productImageLoaded, setProductImageLoaded] = useState<HTMLImageElement | null>(null);
  const [artworkImageLoaded, setArtworkImageLoaded] = useState<HTMLImageElement | null>(null);
  const [productImageError, setProductImageError] = useState(false);

  useEffect(() => {
    if (!productImageUrl || productImageError) {
      setProductImageLoaded(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setProductImageLoaded(img);
    img.onerror = () => setProductImageError(true);
    img.src = productImageUrl;
  }, [productImageUrl, productImageError]);

  useEffect(() => {
    if (!artworkUrl) {
      setArtworkImageLoaded(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setArtworkImageLoaded(img);
    img.onerror = () => setArtworkImageLoaded(null);
    img.src = artworkUrl;
  }, [artworkUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;
    canvas.width = w;
    canvas.height = h;

    // Print area: centered, max size preserving aspect 38×43
    const maxPrintWidth = w * 0.85;
    const maxPrintHeight = h * 0.7;
    let printW = maxPrintWidth;
    let printH = printW / PRINT_ASPECT;
    if (printH > maxPrintHeight) {
      printH = maxPrintHeight;
      printW = printH * PRINT_ASPECT;
    }
    const printX = (w - printW) / 2;
    const printY = (h - printH) / 2;

    // 1) Background: product image or placeholder
    if (productImageLoaded) {
      ctx.drawImage(productImageLoaded, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#e5e5e5";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#d4d4d4";
      ctx.lineWidth = 2;
      ctx.strokeRect(printX, printY, printW, printH);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(printX, printY, printW, printH);
    }

    // 2) Artwork in print area
    if (artworkImageLoaded) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(printX, printY, printW, printH);
      ctx.clip();
      // Scale artwork to cover print area (cover) or fit (contain) – use contain so full design visible
      const aw = artworkImageLoaded.naturalWidth;
      const ah = artworkImageLoaded.naturalHeight;
      const artAspect = aw / ah;
      let drawW = printW;
      let drawH = printH;
      if (artAspect > printW / printH) {
        drawH = printW / artAspect;
      } else {
        drawW = printH * artAspect;
      }
      const drawX = printX + (printW - drawW) / 2;
      const drawY = printY + (printH - drawH) / 2;
      ctx.drawImage(artworkImageLoaded, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

  }, [productImageLoaded, artworkImageLoaded]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full max-w-[320px] h-auto border border-off-black/20 rounded bg-off-white/30"
        style={{ width: "100%", maxWidth: CANVAS_WIDTH, height: "auto" }}
      />
    </div>
  );
}
