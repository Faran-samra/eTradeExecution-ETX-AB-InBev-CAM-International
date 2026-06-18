import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X, Check, RotateCcw, Camera, TriangleAlert, Radio } from 'lucide-react';
import { T } from '../lib/constants.jsx';

export default function CameraHost({ request, onClose }) {
  const [phase, setPhase] = useState('requesting'); // requesting | streaming | preview | error
  const [error, setError] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const pendingFileRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setPhase('requesting'); setError(null); setFallbackMode(false); setPreviewURL(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este dispositivo no permite acceso a cámara desde el navegador.');
      setFallbackMode(true); setPhase('error'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase('streaming'); // render <video> first, then attach stream in useEffect below
    } catch (e) {
      setError('No se pudo abrir la cámara. Puedes tomar la foto con la cámara del sistema.');
      setFallbackMode(true); setPhase('error');
    }
  };

  useEffect(() => { startCamera(); return () => stopStream(); }, []);

  // Attach stream after the <video> element is mounted (phase change → DOM update → this effect)
  useEffect(() => {
    if (phase === 'streaming' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  const snap = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 1280, h = v.videoHeight || 720;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0, w, h);
    const stamp = new Date().toLocaleString('es-PA', { hour12: false });
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(10, h - 44, 320, 32);
    ctx.fillStyle = '#FFF';
    ctx.font = `bold ${Math.round(h / 45)}px sans-serif`;
    ctx.fillText('🔴 EN VIVO · ' + stamp, 18, h - 22);

    c.toBlob((blob) => {
      const file = new File([blob], `live-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      pendingFileRef.current = file;
      setPreviewURL(URL.createObjectURL(blob));
      setPhase('preview');
      stopStream();
    }, 'image/jpeg', 0.88);
  };

  const confirm = () => {
    const file = pendingFileRef.current;
    if (file && request?.onCapture) request.onCapture(file, true);
    if (previewURL) URL.revokeObjectURL(previewURL);
    onClose();
  };

  const retake = () => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(null); startCamera();
  };

  const onFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (request?.onCapture) request.onCapture(file, false);
    onClose();
  };

  const close = () => { stopStream(); if (previewURL) URL.revokeObjectURL(previewURL); onClose(); };

  return (
    <div className="fade" style={{
      position: 'fixed', inset: 0, background: 'rgba(20,28,38,.82)',
      zIndex: 9999, display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div className="pop" style={{
        background: '#0A0F15', borderRadius: 22, overflow: 'hidden',
        width: '100%', maxWidth: 420, position: 'relative',
        boxShadow: '0 30px 80px rgba(0,0,0,.6)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
          padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(0,0,0,.7), rgba(0,0,0,0))',
        }}>
          <span style={{
            background: T.danger, color: T.white, fontSize: 10.5, fontWeight: 800,
            padding: '4px 9px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.white }} />
            EN VIVO
          </span>
          <button onClick={close} className="press" style={{
            border: 'none', background: 'rgba(255,255,255,.18)', color: T.white,
            width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'grid', placeItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: '#000', aspectRatio: '3/4', position: 'relative', display: 'grid', placeItems: 'center' }}>
          {phase === 'requesting' && (
            <div style={{ textAlign: 'center', color: '#FFF' }}>
              <Loader2 size={28} className="spin" />
              <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700 }}>Solicitando acceso a la cámara…</div>
            </div>
          )}
          {phase === 'streaming' && (
            <video ref={videoRef} playsInline muted autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {phase === 'preview' && previewURL && (
            <img src={previewURL} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', color: '#FFF', padding: 24 }}>
              <TriangleAlert size={32} color={T.warn} />
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: T.white, lineHeight: 1.4 }}>{error}</div>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div style={{ padding: '16px 18px 20px', background: '#0A0F15', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {phase === 'streaming' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={snap} className="press" style={{
                width: 68, height: 68, borderRadius: '50%',
                border: `4px solid ${T.white}`, background: T.white, cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                boxShadow: '0 0 0 4px #0A0F15, 0 0 0 6px rgba(255,255,255,.3)',
              }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: T.danger }} />
              </button>
            </div>
          )}
          {phase === 'preview' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={retake} className="press" style={{
                flex: 1, border: '1px solid rgba(255,255,255,.2)', background: 'transparent',
                color: T.white, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <RotateCcw size={15} /> Repetir
              </button>
              <button onClick={confirm} className="press" style={{
                flex: 1, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`, color: T.white,
                padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <Check size={15} /> Usar foto
              </button>
            </div>
          )}
          {phase === 'error' && fallbackMode && (
            <>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFallbackFile} />
              <button onClick={() => fileRef.current?.click()} className="press" style={{
                width: '100%', border: 'none', cursor: 'pointer',
                background: T.warn, color: T.white,
                padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <Camera size={15} /> Usar cámara del sistema
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
