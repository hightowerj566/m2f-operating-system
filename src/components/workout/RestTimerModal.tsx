import { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";

function pad(n: number) { return String(n).padStart(2, "0"); }

export function RestTimerModal({ seconds, onClose, onComplete }: { seconds: number; onClose: () => void; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Create AudioContext on first user interaction (required for mobile)
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  };

  // Prime audio context on first tap (mobile Safari requirement)
  useEffect(() => {
    const prime = () => {
      try { getAudioCtx(); } catch {}
      window.removeEventListener('touchstart', prime);
      window.removeEventListener('click', prime);
    };
    window.addEventListener('touchstart', prime, { once: true });
    window.addEventListener('click', prime, { once: true });
    return () => {
      window.removeEventListener('touchstart', prime);
      window.removeEventListener('click', prime);
    };
  }, []);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setRunning(false);
      try {
        const ctx = getAudioCtx();
        const playBeep = (time: number, freq: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
          osc.start(time);
          osc.stop(time + dur);
        };
        playBeep(ctx.currentTime, 880, 0.15);
        playBeep(ctx.currentTime + 0.2, 880, 0.15);
        playBeep(ctx.currentTime + 0.4, 1100, 0.3);
      } catch {}
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, timeLeft]);

  const toggle = () => setRunning(r => !r);
  const reset = () => { setTimeLeft(seconds); setRunning(false); };

  const pct = ((seconds - timeLeft) / seconds) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md bg-card border-t border-border rounded-t-3xl px-6 pt-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Rest Timer</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--gold))" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * pct) / 100}
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-foreground tabular-nums">{mins > 0 ? `${mins}:${pad(secs)}` : secs}</span>
              <span className="text-xs text-muted-foreground mt-0.5">seconds</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mb-8">
          <button onClick={() => setTimeLeft(t => Math.max(0, t - 15))} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"><Minus className="w-3 h-3" /> 15s</button>
          <button onClick={() => setTimeLeft(t => t + 15)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"><Plus className="w-3 h-3" /> 15s</button>
        </div>
        <div className="flex gap-3">
          <button onClick={reset} className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"><RotateCcw className="w-4 h-4" /> Reset</button>
          <button onClick={toggle} className="flex items-center justify-center gap-2 flex-[2] py-3 rounded-xl bg-primary text-primary-foreground font-bold transition-colors">
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
          </button>
        </div>
        {timeLeft === 0 && <p className="text-center text-primary font-bold mt-4 animate-pulse">✓ Rest complete!</p>}
      </div>
    </div>
  );
}
