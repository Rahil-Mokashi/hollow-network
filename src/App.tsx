import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { Scene } from "./scene/Scene";
import { HUD } from "./ui/HUD";
import { Minimap } from "./ui/Minimap";
import { FieldNotes } from "./ui/FieldNotes";
import { useGameStore } from "./game/store";
import "./App.css";

function App() {
  const level = useGameStore((s) => s.level);
  const triggerAbility = useGameStore((s) => s.triggerAbility);
  const dejaVuAt = useGameStore((s) => s.dejaVuAt);
  const [dejaVuFlash, setDejaVuFlash] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "e" || e.key === "E") && level.ability !== "none" && level.ability !== "dfsGrapple" && level.ability !== "cycleWard") {
        triggerAbility();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [level, triggerAbility]);

  useEffect(() => {
    if (dejaVuAt === null) return;
    setDejaVuFlash(true);
    const timer = setTimeout(() => setDejaVuFlash(false), 900);
    return () => clearTimeout(timer);
  }, [dejaVuAt]);

  return (
    <div className="app-root">
      <Canvas camera={{ position: [0, 9, 11], fov: 45 }} dpr={[1, 2]}>
        <Scene />
        <EffectComposer>
          <Bloom intensity={1.1} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.65} />
          <ChromaticAberration offset={dejaVuFlash ? [0.0025, 0.0025] : [0, 0]} />
        </EffectComposer>
      </Canvas>

      <div className={"deja-vu-overlay" + (dejaVuFlash ? " deja-vu-active" : "")} />

      <div className="ui-layer">
        <HUD />
        <div className="side-panels">
          <Minimap />
          <FieldNotes />
        </div>
        <div className="panel controls-hint">
          Click a lit chamber to travel · <span className="ability-key">E</span> to use an ability
        </div>
      </div>
    </div>
  );
}

export default App;
