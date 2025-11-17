import React, { useEffect, useRef } from 'react';
import './AttentionHeatmap.css';

/**
 * AttentionHeatmap Component
 * Visualizes LSTM attention weights as a temporal heatmap
 * 
 * Props:
 * - detections: Array of detection objects with { type, start, end, attention }
 * - duration: Total audio duration in seconds
 * - width: Canvas width (default: 800)
 * - height: Canvas height (default: 120)
 */
export default function AttentionHeatmap({ detections = [], duration = 0, width = 800, height = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || duration <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // If no detections, show placeholder text
    if (detections.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Attention weights will appear here after analysis', width / 2, height / 2);
      return;
    }

    // Draw attention heatmap
    drawAttentionHeatmap(ctx, detections, duration, width, height);

  }, [detections, duration, width, height]);

  const drawAttentionHeatmap = (ctx, dets, dur, w, h) => {
    if (dets.length === 0) return;

    const heatmapHeight = h - 30;

    // Draw each detection's attention weights
    dets.forEach(detection => {
      if (!detection.attention || detection.attention.length === 0) return;

      const startX = (detection.start / dur) * w;
      const endX = (detection.end / dur) * w;
      const segmentWidth = (endX - startX) / detection.attention.length;

      // Normalize attention weights
      const maxAttn = Math.max(...detection.attention);
      const minAttn = Math.min(...detection.attention);
      const range = maxAttn - minAttn || 1;

      // Draw each attention weight as a vertical bar
      detection.attention.forEach((attn, i) => {
        const x = startX + (i * segmentWidth);
        const normalizedAttn = (attn - minAttn) / range;

        // Color gradient from blue (low) to red (high attention)
        const hue = (1 - normalizedAttn) * 240; // 240 = blue, 0 = red
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

        const barHeight = normalizedAttn * heatmapHeight;
        ctx.fillRect(x, h - 30 - barHeight, segmentWidth, barHeight);
      });

      // Draw border around this detection's attention region
      const regionColors = {
        'Block': 'rgba(239, 68, 68, 0.3)',
        'WP': 'rgba(59, 130, 246, 0.3)',
        'SND': 'rgba(234, 179, 8, 0.3)',
        'Pro': 'rgba(22, 163, 74, 0.3)',
        'Intrj': 'rgba(168, 85, 247, 0.3)'
      };
      
      ctx.strokeStyle = regionColors[detection.type] || '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, endX - startX, h - 30);
    });

    // Draw time axis labels
    ctx.fillStyle = '#4b5563';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const x = (i / 5) * w;
      const time = (i / 5) * dur;
      ctx.fillText(`${time.toFixed(1)}s`, x + 2, h - 5);
    }
  };

  if (duration <= 0) {
    return (
      <div className="attention-heatmap-placeholder">
        No audio data available for attention visualization
      </div>
    );
  }

  return (
    <div className="attention-heatmap-container">
      <h3 className="heatmap-title">Attention Heatmap</h3>
      <canvas
        ref={canvasRef}
        className="attention-canvas"
        aria-label="Attention heatmap visualization"
      />
    </div>
  );
}
