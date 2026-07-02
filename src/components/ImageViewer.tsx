import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Compass, Layers } from "lucide-react";
import { StreetViewImage } from "../types";

interface ImageViewerProps {
  image: StreetViewImage;
}

export default function ImageViewer({ image }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset viewport state on image change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [image.id]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.15;
    const newScale = e.deltaY < 0 ? scale + zoomFactor : scale - zoomFactor;
    setScale(Math.max(1, Math.min(5, newScale)));
  };

  const zoomIn = () => setScale(prev => Math.min(5, prev + 0.3));
  const zoomOut = () => setScale(prev => Math.max(1, prev - 0.3));
  const resetViewport = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={`relative bg-slate-950 rounded overflow-hidden border border-slate-800 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "h-[480px] w-full"
      }`}
      id="vlsap-panorama-viewer"
    >
      {/* Header bar for controls */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 to-transparent p-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded border border-white/10 flex items-center gap-1 text-[10px] text-white font-semibold">
            <Compass className="h-3 w-3 text-amber-400 animate-spin-slow" />
            <span className="font-sans tracking-wide uppercase">
              <Layers className="h-2.5 w-2.5 inline mr-0.5" /> Panorama
            </span>
          </div>
        </div>

        {/* Viewport operations */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          <div className="flex bg-slate-900/90 backdrop-blur-sm rounded border border-white/10 p-0.5">
            <button onClick={zoomIn} className="p-1 text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button onClick={zoomOut} className="p-1 text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={resetViewport} className="p-1 text-white hover:bg-white/10 rounded transition-colors cursor-pointer" title="Reset Viewport">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-900/90 backdrop-blur-sm hover:bg-slate-800 rounded border border-white/10 text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main viewport canvas */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* PANORAMA VIEW WITH INTERACTIVE DRAG/ZOOM */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: isDragging ? "grabbing" : "grab"
          }}
        >
          <img
            ref={imageRef}
            src={image.protocolA_Url}
            alt={image.name}
            className="max-h-full max-w-none object-contain h-[380px] shadow-none pointer-events-none rounded-sm"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Informative Floating metadata bar */}
        <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-300 font-sans gap-1 pointer-events-none">
          <div>
            <div className="text-white font-semibold text-xs leading-tight flex items-center gap-1.5">
              <span>{image.name}</span>
              <span className="text-[9px] font-mono font-medium px-1 py-0.2 rounded bg-gray-850 text-gray-400">
                {image.id}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Location: {image.location}</p>
          </div>
          <div className="text-[9px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5 self-end sm:self-auto uppercase">
            Drive ID: <span className="text-amber-300">{image.driveId.substring(0, 12)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
