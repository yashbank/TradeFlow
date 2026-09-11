'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PenTool, RotateCcw, CheckCircle2, X } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: { signatureDataUrl: string; signerName: string; signedAt: string }) => void;
  title?: string;
  defaultSignerName?: string;
  roleLabel?: string;
}

export function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = 'Customer Signature on Glass',
  defaultSignerName = '',
  roleLabel = 'Customer / Authorized Representative',
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSignerName(defaultSignerName);
      setHasDrawn(false);
      setError(null);
      // Small timeout to allow modal animation to mount canvas
      setTimeout(() => {
        clearCanvas();
      }, 50);
    }
  }, [isOpen, defaultSignerName]);

  function getCanvasCoordinates(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7'; // Sky-600 / vibrant blue signature ink

    setIsDrawing(true);
    setHasDrawn(true);
    setError(null);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw baseline
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 35);
    ctx.lineTo(canvas.width - 20, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw tiny "X" indicator
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('✕ Sign above line', 24, canvas.height - 18);

    setHasDrawn(false);
  }

  function handleSave() {
    if (!signerName.trim()) {
      setError('Please provide the signer full name.');
      return;
    }
    if (!hasDrawn) {
      setError('Please sign on the canvas before submitting.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    onSave({
      signatureDataUrl,
      signerName: signerName.trim(),
      signedAt: new Date().toISOString(),
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-lg shadow-2xl border-sky-500/30 dark:border-sky-900/60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Digital Sign-Off • Legal Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
              Signer Full Name ({roleLabel})
            </label>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="min-h-[44px]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span>Draw Signature with Finger or Stylus</span>
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1 min-h-[28px]"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>

            <div className="border border-slate-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-950/70 touch-none select-none">
              <canvas
                ref={canvasRef}
                width={460}
                height={160}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-40 cursor-crosshair"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          <p className="text-[11px] text-slate-400 dark:text-zinc-500">
            By signing above, you certify that work was inspected and verified in accordance with trade industry standards.
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={handleSave}
            className="min-h-[44px] font-bold px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirm & Save Signature
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
