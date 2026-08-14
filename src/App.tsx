import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { Scene } from "./scene/Scene";
import { TitleBackdrop } from "./scene/TitleBackdrop";
import { MazeScene } from "./scene/MazeScene";
import { ArchiveScene } from "./scene/ArchiveScene";
import { SortScene } from "./scene/SortScene";
import { HUD } from "./ui/HUD";
import { Minimap } from "./ui/Minimap";
import { FieldNotes } from "./ui/FieldNotes";
import { AlgorithmTrace } from "./ui/AlgorithmTrace";
import { TitleScreen } from "./ui/TitleScreen";
import { MazeUI } from "./ui/MazeUI";
import { ArchiveUI } from "./ui/ArchiveUI";
import { SortUI } from "./ui/SortUI";
import { useGameStore } from "./game/store";
import "./App.css";

const CAMERA_BY_SCREEN: Record<string, { position: [number, number, number]; fov: number }> = {
  title: { position: [0, 9, 11], fov: 45 },
  playing: { position: [0, 9, 11], fov: 45 },
  maze: { position: [0, 24, 20], fov: 50 },
  archive: { position: [0, 12, 16], fov: 48 },
  sort: { position: [0, 9, 14], fov: 48 },
};

function App() {
  const screen = useGameStore((s) => s.screen);
  const level = useGameStore((s) => s.level);
  const triggerAbility = useGameStore((s) => s.triggerAbility);
  const dejaVuAt = useGameStore((s) => s.dejaVuAt);
  const [dejaVuFlash, setDejaVuFlash] = useState(false);

  useEffect(() => {
    if (screen !== "playing") return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "e" || e.key === "E") && level.ability !== "none" && level.ability !== "dfsGrapple" && level.ability !== "cycleWard") {
        triggerAbility();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, level, triggerAbility]);

  useEffect(() => {
    if (dejaVuAt === null) return;
    setDejaVuFlash(true);
    const timer = setTimeout(() => setDejaVuFlash(false), 900);
    return () => clearTimeout(timer);
  }, [dejaVuAt]);

  return (
    <div className="app-root">
      <Canvas key={screen} camera={CAMERA_BY_SCREEN[screen]} dpr={[1, 2]}>
        {screen === "title" && <TitleBackdrop />}
        {screen === "playing" && <Scene />}
        {screen === "maze" && <MazeScene />}
        {screen === "archive" && <ArchiveScene />}
        {screen === "sort" && <SortScene />}
        <EffectComposer>
          <Bloom intensity={1.1} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.65} />
          <ChromaticAberration offset={dejaVuFlash ? [0.0025, 0.0025] : [0, 0]} />
        </EffectComposer>
      </Canvas>

      {screen === "playing" && <div className={"deja-vu-overlay" + (dejaVuFlash ? " deja-vu-active" : "")} />}

      {screen === "title" && <TitleScreen />}

      {screen === "playing" && (
        <div className="ui-layer">
          <HUD />
          <div className="side-panels">
            <Minimap />
            <AlgorithmTrace />
            <FieldNotes />
          </div>
          <div className="panel controls-hint">
            Click a lit chamber to travel · <span className="ability-key">E</span> to use an ability
          </div>
        </div>
      )}

      {screen === "maze" && <MazeUI />}
      {screen === "archive" && <ArchiveUI />}
      {screen === "sort" && <SortUI />}
    </div>
  );
}

export default App;
