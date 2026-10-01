import type { OnboardingRole } from "../../lib/onboarding";
import {
  ACESFilmicToneMapping,
  CircleGeometry,
  Clock,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  CanvasTexture,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Group,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRole, disposeObject } from "./role-objects";

const REST = 0.4;
const SPIN = (Math.PI * 2) / 9;

type Stage = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  observer: ResizeObserver;
  environment: Texture;
  dirty: boolean;
};

export function mountRole(host: HTMLElement, role: OnboardingRole, spinning: { current: boolean }): () => void {
  const stage = createStage(host);
  const object = buildRole(role);
  object.rotation.y = REST;
  const shadow = contactShadow();
  stage.scene.add(object, shadow);
  const stop = animate(stage, object, spinning);
  return () => {
    stop();
    disposeObject(object);
    disposeShadow(shadow);
    stage.environment.dispose();
    stage.observer.disconnect();
    stage.renderer.dispose();
    stage.renderer.domElement.remove();
  };
}

function createStage(host: HTMLElement): Stage {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 30);
  camera.position.set(1.35, 0.82, 4.15);
  camera.lookAt(0, 0, 0);
  const environment = lightScene(renderer, scene);
  host.replaceChildren(renderer.domElement);
  const stage = { renderer, scene, camera, environment, dirty: true } as Stage;
  stage.observer = new ResizeObserver(() => {
    resize(host, stage);
    stage.dirty = true;
  });
  stage.observer.observe(host);
  resize(host, stage);
  return stage;
}

function animate(stage: Stage, object: Group, spinning: { current: boolean }): () => void {
  const clock = new Clock();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let wasActive = false;
  stage.renderer.setAnimationLoop(() => {
    const active = spinning.current && !still.matches;
    if (active) {
      wasActive = true;
      object.rotation.y += SPIN * clock.getDelta();
      stage.renderer.render(stage.scene, stage.camera);
      stage.dirty = false;
      return;
    }
    clock.getDelta();
    if (wasActive) {
      wasActive = false;
      object.rotation.y = REST;
      stage.dirty = true;
    }
    if (!stage.dirty) return;
    stage.renderer.render(stage.scene, stage.camera);
    stage.dirty = false;
  });
  return () => stage.renderer.setAnimationLoop(null);
}

function lightScene(renderer: WebGLRenderer, scene: Scene): Texture {
  scene.add(new HemisphereLight(0xfff7ec, 0xd7b36a, 0.45));
  const key = new DirectionalLight(0xfffaf2, 1.35);
  key.position.set(3.2, 4.8, 3.4);
  const rim = new DirectionalLight(0xffe1a4, 0.65);
  rim.position.set(-3.5, 1.6, -2.4);
  scene.add(key, rim);
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const map = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = map;
  return map;
}

function contactShadow(): Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context !== null) {
    const gradient = context.createRadialGradient(64, 64, 10, 64, 64, 62);
    gradient.addColorStop(0, "rgba(120, 78, 28, 0.28)");
    gradient.addColorStop(1, "rgba(120, 78, 28, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const mesh = new Mesh(
    new CircleGeometry(0.72, 40),
    new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.78;
  return mesh;
}

function disposeShadow(shadow: Mesh): void {
  shadow.geometry.dispose();
  if (Array.isArray(shadow.material)) return;
  if (shadow.material instanceof MeshBasicMaterial && shadow.material.map !== null) {
    shadow.material.map.dispose();
  }
  shadow.material.dispose();
}

function resize(host: HTMLElement, stage: Stage): void {
  const width = Math.max(host.clientWidth, 1);
  const height = Math.max(host.clientHeight, 1);
  stage.renderer.setSize(width, height, false);
  stage.camera.aspect = width / height;
  stage.camera.updateProjectionMatrix();
}
