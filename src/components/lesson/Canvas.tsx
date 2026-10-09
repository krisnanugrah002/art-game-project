'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { Eraser, Undo2 } from 'lucide-react';

type LineData = {
  tool: 'pen' | 'eraser';
  points: number[];
  color: string;
  strokeWidth: number;
};

type Color = {
  hex: string;
  name: string;
  bg: string;
};

const COLORS: Color[] = [
  { hex: '#ef4444', name: 'Crimson Red', bg: 'bg-red-500' },
  { hex: '#eab308', name: 'Cadmium Yellow', bg: 'bg-yellow-500' },
  { hex: '#3b82f6', name: 'Ultramarine Blue', bg: 'bg-blue-500' },
  { hex: '#1e293b', name: 'Lamp Black', bg: 'bg-slate-900' },
  { hex: '#ffffff', name: 'Titanium White', bg: 'bg-white' },
];

const BRUSH_SIZES = [
  { size: 6, label: 'Fine' },
  { size: 14, label: 'Medium' },
  { size: 28, label: 'Broad' },
];

export type CanvasHandle = {
  getDataURL: () => string | null;
};

interface CanvasProps {
  onStatusChange?: (status: string) => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ onStatusChange }, ref) => {
  const [lines, setLines] = useState<LineData[]>([]);
  const isDrawing = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [currentBrushSize, setCurrentBrushSize] = useState(14);
  const [isEraser, setIsEraser] = useState(false);

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      if (!stageRef.current) return null;
      return stageRef.current.toDataURL({ mimeType: 'image/png' });
    }
  }));

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handlePointerDown = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const tool = isEraser ? 'eraser' : 'pen';
    setLines(prev => [...prev, { tool, points: [pos.x, pos.y], color: isEraser ? '#ffffff' : currentColor, strokeWidth: currentBrushSize }]);
    onStatusChange?.(isEraser ? 'Erasing...' : 'Blending colors...');
  }, [currentColor, currentBrushSize, isEraser, onStatusChange]);

  const handlePointerMove = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;
    setLines(prev => {
      const newLines = [...prev];
      const last = newLines[newLines.length - 1];
      if (last) {
        newLines[newLines.length - 1] = { ...last, points: [...last.points, point.x, point.y] };
      }
      return newLines;
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
    onStatusChange?.('Stroke added • Check color when ready');
  }, [onStatusChange]);

  const handleUndo = () => {
    setLines(prev => prev.slice(0, -1));
    onStatusChange?.('Undo successful');
  };

  const handleClearCanvas = () => {
    setLines([]);
    onStatusChange?.('Canvas cleared');
  };

  const selectColor = (hex: string) => {
    setCurrentColor(hex);
    setIsEraser(false);
  };

  const toggleEraser = () => {
    setIsEraser(prev => !prev);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        {/* Target Color Preview */}
        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-2.5 shadow-sm flex items-center gap-2.5 pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 shadow-xs border-2 border-white ring-1 ring-slate-200"></div>
          <div className="leading-tight text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Tint</div>
            <div className="text-xs font-black text-slate-700">Sunset Orange</div>
          </div>
        </div>

        {/* Canvas Overlay Helper */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            id="clearCanvasBtn"
            onClick={handleClearCanvas}
            className="bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 p-1.5 rounded-lg shadow-sm transition"
            title="Clear Canvas"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        {size.width > 0 && size.height > 0 && (
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            onMouseDown={handlePointerDown}
            onMousemove={handlePointerMove}
            onMouseup={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="absolute inset-0"
            style={{ cursor: isEraser ? 'cell' : 'crosshair' }}
          >
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>

      {/* Tool Drawer */}
      <div className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-inner px-4 py-3 flex items-center gap-3 md:gap-5 z-20 shrink-0 flex-wrap justify-center">
        {/* Color Swatches */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase text-slate-400 hidden md:inline">Pigments</span>
          {COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => selectColor(color.hex)}
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full ${color.bg} transition-transform hover:scale-110 shadow-sm border border-black/10 ${
                currentColor === color.hex && !isEraser ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
              }`}
              title={color.name}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Brush Size */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase text-slate-400 hidden md:inline">Size</span>
          {BRUSH_SIZES.map(({ size: sz, label }) => (
            <button
              key={sz}
              onClick={() => setCurrentBrushSize(sz)}
              className={`p-1.5 rounded-lg transition ${
                currentBrushSize === sz
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={label}
            >
              <div
                className="rounded-full bg-current mx-auto"
                style={{ width: sz > 10 ? sz > 20 ? 20 : 14 : 8, height: sz > 10 ? sz > 20 ? 20 : 14 : 8 }}
              />
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Eraser & Undo */}
        <div className="flex items-center gap-1.5">
          <button
            id="eraserBtn"
            onClick={toggleEraser}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition ${
              isEraser ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Eraser</span>
          </button>
          <button
            id="undoBtn"
            onClick={handleUndo}
            className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            title="Undo Stroke"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;
