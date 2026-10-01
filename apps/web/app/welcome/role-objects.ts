import type { OnboardingRole } from "../../lib/onboarding";
import {
  Box3,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Material,
  type Object3D,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function buildRole(role: OnboardingRole): Group {
  const group = role === "developer" ? laptop() : role === "business" ? briefcase() : role === "creator" ? shop() : guest();
  return place(group);
}

export function disposeObject(object: Object3D): void {
  const materials = new Set<Material>();
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    const list = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of list) materials.add(material);
  });
  for (const material of materials) material.dispose();
}

function laptop(): Group {
  const group = new Group();
  const metal = gold();
  const display = glow();
  group.add(block([1.92, 0.07, 1.28], [0, -0.46, 0.16], metal, 0.03));
  group.add(block([0.32, 0.012, 0.2], [0, -0.42, 0.42], display, 0.004));
  const lid = new Group();
  lid.add(block([1.62, 1.05, 0.05], [0, 0.52, 0], metal, 0.04));
  lid.add(block([1.38, 0.82, 0.015], [0, 0.53, 0.028], display, 0.02));
  lid.position.set(0, -0.42, -0.44);
  lid.rotation.x = -0.38;
  group.add(lid);
  return group;
}

function briefcase(): Group {
  const group = new Group();
  const metal = gold();
  group.add(block([1.42, 1.02, 0.42], [0, -0.08, 0], metal, 0.09));
  group.add(block([1.22, 0.38, 0.06], [0, 0.16, 0.21], metal, 0.03));
  group.add(block([0.2, 0.14, 0.045], [0, 0.02, 0.26], glow(), 0.02));
  const handle = new Mesh(new TorusGeometry(0.22, 0.05, 24, 40, Math.PI), metal);
  handle.position.set(0, 0.52, 0);
  group.add(handle);
  return group;
}

function shop(): Group {
  const group = new Group();
  const metal = gold();
  const window = glow();
  group.add(block([1.38, 0.92, 0.78], [0, -0.12, 0], metal, 0.05));
  group.add(block([1.58, 0.08, 0.92], [0, 0.4, 0.04], metal, 0.02));
  addAwning(group, metal);
  group.add(block([0.26, 0.46, 0.05], [0, -0.28, 0.4], window, 0.06));
  group.add(block([0.2, 0.18, 0.04], [-0.4, -0.1, 0.4], window, 0.03));
  group.add(block([0.2, 0.18, 0.04], [0.4, -0.1, 0.4], window, 0.03));
  group.add(block([0.62, 0.05, 0.26], [0, -0.62, 0.42], metal, 0.02));
  return group;
}

function guest(): Group {
  const group = new Group();
  const metal = gold();
  const head = new Mesh(new SphereGeometry(0.32, 64, 40), metal);
  head.position.y = 0.5;
  const shoulders = new Mesh(new SphereGeometry(0.56, 64, 40), metal);
  shoulders.scale.set(1.08, 0.56, 0.82);
  shoulders.position.y = -0.2;
  group.add(head, shoulders);
  return group;
}

function addAwning(group: Group, metal: Material): void {
  for (const x of [-0.48, -0.16, 0.16, 0.48]) {
    const scallop = new Mesh(new SphereGeometry(0.2, 28, 18), metal);
    scallop.scale.set(1.05, 0.36, 0.42);
    scallop.position.set(x, 0.3, 0.48);
    group.add(scallop);
  }
}

function block(
  size: [number, number, number],
  position: [number, number, number],
  material: Material,
  radius: number,
): Mesh {
  const mesh = new Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), material);
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

function gold(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: 0xf3d48a,
    metalness: 1,
    roughness: 0.14,
    clearcoat: 0.55,
    clearcoatRoughness: 0.16,
    reflectivity: 1,
    envMapIntensity: 1.25,
  });
}

function glow(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: 0xfff4e2,
    metalness: 0.02,
    roughness: 0.32,
    emissive: 0xffe3b0,
    emissiveIntensity: 0.45,
  });
}

function place(group: Group): Group {
  const bounds = new Box3().setFromObject(group);
  const mid = bounds.getCenter(new Vector3());
  for (const child of group.children) child.position.sub(mid);
  const size = bounds.getSize(new Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  group.scale.setScalar(longest === 0 ? 1 : 1.7 / longest);
  return group;
}
