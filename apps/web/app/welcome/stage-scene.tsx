import scene from "./stage-scene.module.css";

export function StageScene() {
  return (
    <div className={scene.layer} aria-hidden="true">
      <span className={scene.glow} />
      <span className={scene.rail} />
      <span className={scene.guide} />
      <span className={`${scene.orbit} ${scene.outer}`} />
      <span className={`${scene.orbit} ${scene.middle}`} />
      <span className={`${scene.orbit} ${scene.inner}`} />
      <span className={scene.accent} />
      <span className={`${scene.orb} ${scene.orbA}`} />
      <span className={`${scene.orb} ${scene.orbB}`} />
      <span className={`${scene.orb} ${scene.orbC}`} />
      <span className={scene.shadow} />
      <span className={scene.platform} />
      <span className={scene.rim} />
      <span className={scene.dots} />
      <span className={scene.rock} />
      <span className={scene.step} />
    </div>
  );
}
