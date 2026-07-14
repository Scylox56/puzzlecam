import { useEffect, useRef, useState } from "react";
import {
  startPuzzleCamEngine,
  type EngineHandle,
} from "./engine/puzzleCamEngine";
// @ts-ignore
import "./styles.css";

interface GalleryItem {
  dataUrl: string;
  index: number;
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);

  const [status, setStatus] = useState("starting camera & hand tracking…");
  const [dotState, setDotState] = useState<
    "idle" | "live" | "armed" | "solved"
  >("idle");
  const [progress, setProgress] = useState({
    visible: false,
    text: "",
    solved: false,
  });
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let cancelled = false;

    function fitCanvas() {
      const stageEl = stageRef.current;
      if (!stageEl || !canvas || !canvas.width) return;
      const vw = stageEl.clientWidth;
      const vh = stageEl.clientHeight;
      const videoAspect = canvas.width / canvas.height;
      const containerAspect = vw / vh;
      let cssWidth, cssHeight;
      if (containerAspect > videoAspect) {
        cssWidth = vw;
        cssHeight = vw / videoAspect;
      } else {
        cssHeight = vh;
        cssWidth = vh * videoAspect;
      }
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    }

    startPuzzleCamEngine(video, canvas, {
      onStatus: (text) => !cancelled && setStatus(text),
      onDotState: (s) => !cancelled && setDotState(s),
      onProgress: (visible, text, solved) =>
        !cancelled && setProgress({ visible, text, solved }),
      onGalleryAdd: (thumbCanvas, index) => {
        if (cancelled) return;
        const THUMB_W = 220;
        const scale = THUMB_W / thumbCanvas.width;
        const t = document.createElement("canvas");
        t.width = THUMB_W;
        t.height = Math.round(thumbCanvas.height * scale);
        t.getContext("2d")!.drawImage(thumbCanvas, 0, 0, t.width, t.height);
        setGallery((prev) => [
          { dataUrl: t.toDataURL("image/png"), index },
          ...prev,
        ]);
      },
      onGalleryFull: () => {},
      onReset: () => !cancelled && setGallery([]),
    })
      .then((handle) => {
        if (cancelled) {
          handle.destroy();
          return;
        }
        engineRef.current = handle;
        fitCanvas();
        window.addEventListener("resize", fitCanvas);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to start.");
      });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", fitCanvas);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  function handleReset() {
    if (window.confirm("Clear the whole photo strip and start over?")) {
      engineRef.current?.resetEverything();
    }
  }

  return (
    <div className="app">
      <div className="stage" ref={stageRef}>
        <div className="camera-area">
          <video ref={videoRef} className="hidden-video" playsInline muted />
          <canvas ref={canvasRef} className="scene-canvas" />

          {error && <div className="status-overlay error">{error}</div>}

          <div className="hud">
            <div className={`status-dot ${dotState}`} />
            <span className="status-text">{status}</span>
          </div>

          {progress.visible && (
            <div
              className={`progress-badge visible${progress.solved ? " solved" : ""}`}
            >
              {progress.text}
            </div>
          )}
        </div>

        <div className="bar">
          <div className="bar-title">Strip ({gallery.length} / 3)</div>
          <div className="gallery-strip">
            {gallery.length === 0 && (
              <div className="gallery-empty">No photos yet</div>
            )}
            {gallery.map((item) => (
              <div className="print" key={item.index}>
                <img src={item.dataUrl} alt={`Puzzle ${item.index}`} />
                <div className="print-label">
                  #{String(item.index).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
          <div className="bar-actions">
            <button
              onClick={() => engineRef.current?.downloadStrip()}
              disabled={gallery.length === 0}
            >
              Download strip
            </button>
            <button className="secondary" onClick={handleReset}>
              Reset all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
