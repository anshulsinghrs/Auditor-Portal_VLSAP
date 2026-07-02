import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Compass, Layers, Grid } from "lucide-react";
import { StreetViewImage } from "../types";

interface ImageViewerProps {
  image: StreetViewImage;
  protocol: "A" | "B";
  onToggleProtocol: (p: "A" | "B") => void;
}

export default function ImageViewer({ image, protocol, onToggleProtocol }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset viewport state on image or protocol change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setActiveSlice(null);
  }, [image.id, protocol]);

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
              {protocol === "A" ? "Prot. A: Panorama" : "Prot. B: 4 Slices"}
            </span>
          </div>
          
          {/* Protocol Toggle */}
          <div className="bg-slate-900/90 backdrop-blur-sm p-0.5 rounded border border-white/10 flex">
            <button
              onClick={() => onToggleProtocol("A")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                protocol === "A" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
              }`}
              title="Wide continuous panorama"
            >
              <Layers className="h-2.5 w-2.5 inline mr-0.5" /> Panorama
            </button>
            <button
              onClick={() => onToggleProtocol("B")}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                protocol === "B" ? "bg-white text-slate-950" : "text-slate-300 hover:text-white"
              }`}
              title="Four directional cardinal views"
            >
              <Grid className="h-2.5 w-2.5 inline mr-0.5" /> 4 Slices
            </button>
          </div>
        </div>

        {/* Viewport operations */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {protocol === "A" && (
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
          )}

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
        onWheel={protocol === "A" ? handleWheel : undefined}
        onMouseDown={protocol === "A" ? handleMouseDown : undefined}
        onMouseMove={protocol === "A" ? handleMouseMove : undefined}
        onMouseUp={protocol === "A" ? handleMouseUp : undefined}
        onMouseLeave={protocol === "A" ? handleMouseUp : undefined}
      >
        {protocol === "A" ? (
          /* PROTOCOL A: PANORAMA VIEW WITH INTERACTIVE DRAG/ZOOM */
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
        ) : (
          /* PROTOCOL B: CARDINAL DIRECTIONAL SLICES (4 VIEWPORT GRID) */
          <div className="w-full h-full p-2 pt-11 grid grid-cols-2 gap-1.5">
            {(Object.keys(image.protocolB_Urls) as Array<keyof typeof image.protocolB_Urls>).map((dir) => (
              <div 
                key={dir}
                onClick={() => setActiveSlice(dir)}
                className="relative bg-black/40 border border-white/10 rounded overflow-hidden group cursor-pointer hover:border-amber-500/50 transition-all duration-200"
              >
                <img 
                  src={image.protocolB_Urls[dir]} 
                  alt={`${dir} slice`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {/* Direction label overlay */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 border border-white/10 rounded-sm text-[9px] text-white font-mono uppercase tracking-wider">
                  {dir} ({(dir === "North" ? "0°" : dir === "East" ? "90°" : dir === "South" ? "180°" : "270°")})
                </div>
                {/* Hover inspect banner */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                  <span className="px-2 py-1 bg-black/80 border border-white/20 rounded text-[10px] text-amber-300 font-semibold shadow-none">
                    Click to Inspect
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* Protocol B zoomed-in slice modal */}
      {activeSlice && (
        <div 
          className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-6 animate-fade-in"
          onClick={() => setActiveSlice(null)}
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase rounded-md">
              INSPECTING: {activeSlice} View
            </span>
            <button 
              onClick={() => setActiveSlice(null)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md border border-white/10 transition-colors cursor-pointer"
            >
              Close View [Esc]
            </button>
          </div>
          
          <img 
            src={image.protocolB_Urls[activeSlice as keyof typeof image.protocolB_Urls]} 
            alt="Expanded Slice" 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg border border-white/10 shadow-2xl"
            referrerPolicy="no-referrer"
          />
          
          <div className="mt-4 text-center max-w-lg text-xs text-gray-400 leading-relaxed font-sans">
            Press anywhere or escape to return to grid. Scroll / drag parameters reset during slice inspection.
          </div>
        </div>
      )}
    </div>
  );
}
