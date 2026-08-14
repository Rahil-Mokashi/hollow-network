import { useAudioStore } from "../game/audioStore";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

export function AudioToggle() {
  const muted = useAudioStore((s) => s.muted);
  const volume = useAudioStore((s) => s.volume);
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const changeVolume = useAudioStore((s) => s.changeVolume);

  return (
    <div className="panel audio-toggle">
      <button
        className="audio-mute-btn"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
      >
        <SpeakerIcon muted={muted} />
      </button>
      <input
        type="range"
        className="audio-volume-slider"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={(e) => changeVolume(parseFloat(e.target.value))}
        aria-label="Volume"
      />
    </div>
  );
}
