import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type SymptomVisualKey = 'neutral' | 'head' | 'chest' | 'stomach' | 'leg' | 'arm' | 'back';
export type SymptomVisualMode = 'idle' | 'typing' | 'thinking';

interface SymptomSceneProps {
  visual_key: SymptomVisualKey;
  mode: SymptomVisualMode;
}

const build_scene_model = (visual_key: SymptomVisualKey, accent: THREE.Color) => {
  const group = new THREE.Group();

  const base_mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0f172a'),
    roughness: 0.2,
    metalness: 0.8,
    transmission: 0.3,
    thickness: 1.2,
    ior: 1.4,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
    emissive: accent.clone().multiplyScalar(0.2),
  });

  const highlight_mat = new THREE.MeshStandardMaterial({
    color: accent.clone().multiplyScalar(0.85),
    emissive: accent,
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.1,
  });

  const add_base_sphere = () => {
    const geom = new THREE.IcosahedronGeometry(1.1, 3);
    const mesh = new THREE.Mesh(geom, base_mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom, 28),
      new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.7 })
    );
    edges.scale.setScalar(1.008);
    group.add(edges);

    return mesh;
  };

  const add_pulse = (geo: THREE.BufferGeometry, pos: THREE.Vector3, scale = 1) => {
    const mesh = new THREE.Mesh(geo, highlight_mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };

  const base = add_base_sphere();

  let pulse_mesh: THREE.Mesh | null = null;

  if (visual_key === 'head') {
    pulse_mesh = add_pulse(new THREE.SphereGeometry(0.26, 24, 18), new THREE.Vector3(0.18, 0.52, 0.32), 1);
  } else if (visual_key === 'chest') {
    pulse_mesh = add_pulse(new THREE.SphereGeometry(0.3, 24, 18), new THREE.Vector3(0.0, 0.18, 0.52), 1);
  } else if (visual_key === 'stomach') {
    pulse_mesh = add_pulse(new THREE.SphereGeometry(0.28, 24, 18), new THREE.Vector3(0.0, -0.12, 0.56), 1);
  } else if (visual_key === 'back') {
    pulse_mesh = add_pulse(new THREE.SphereGeometry(0.3, 24, 18), new THREE.Vector3(0.0, 0.0, -0.6), 1);
  } else if (visual_key === 'arm') {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.85, 18), base_mat);
    upper.rotation.z = Math.PI * 0.16;
    upper.position.set(0.55, 0.1, 0.15);
    upper.castShadow = true;
    arm.add(upper);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.75, 18), base_mat);
    fore.rotation.z = Math.PI * 0.32;
    fore.position.set(0.86, -0.32, 0.12);
    fore.castShadow = true;
    arm.add(fore);
    arm.rotation.y = -0.3;
    group.add(arm);
    pulse_mesh = add_pulse(new THREE.SphereGeometry(0.2, 24, 18), new THREE.Vector3(0.78, -0.14, 0.32), 1);
  } else if (visual_key === 'leg') {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.95, 18), base_mat);
    thigh.position.set(-0.22, -0.35, 0.12);
    thigh.rotation.z = -Math.PI * 0.08;
    thigh.castShadow = true;
    leg.add(thigh);
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.85, 18), base_mat);
    calf.position.set(-0.18, -0.92, 0.18);
    calf.rotation.z = Math.PI * 0.06;
    calf.castShadow = true;
    leg.add(calf);
    leg.rotation.y = 0.25;
    group.add(leg);
    pulse_mesh = add_pulse(new THREE.SphereGeometry(0.22, 24, 18), new THREE.Vector3(-0.18, -0.78, 0.46), 1);
  }

  const raZOar = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.015, 8, 64),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 })
  );
  raZOar.rotation.x = Math.PI / 2;
  group.add(raZOar);

  const raZOA = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.01, 8, 64),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3 })
  );
  raZOA.rotation.y = Math.PI / 4;
  group.add(raZOA);

  return { group, base, pulse_mesh, raZOar, raZOA, materials: [base_mat, highlight_mat] };
};

export const SymptomScene: React.FC<SymptomSceneProps> = ({ visual_key, mode }) => {
  const host_ref = useRef<HTMLDivElement>(null);
  const mouse_ref = useRef({ x: 0, y: 0 });

  const accent = useMemo(() => {
    if (mode === 'thinking') return new THREE.Color('#ec4899');
    if (mode === 'typing') return new THREE.Color('#8b5cf6');
    return new THREE.Color('#3b82f6');
  }, [mode]);

  useEffect(() => {
    const host = host_ref.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.2, 4.1);

    const key_light = new THREE.DirectionalLight(0xffffff, 1.5);
    key_light.position.set(3.5, 4.0, 4.2);
    key_light.castShadow = true;
    key_light.shadow.mapSize.set(1024, 1024);
    scene.add(key_light);

    const fill_light = new THREE.DirectionalLight(accent, 0.8);
    fill_light.position.set(-4.0, 1.2, 2.6);
    scene.add(fill_light);

    const rim_light = new THREE.PointLight(accent, 1.5, 20);
    rim_light.position.set(0.0, 1.4, -2.6);
    scene.add(rim_light);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x050505, 0.7);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.ShadowMaterial({ opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    scene.add(floor);

    const { group, base, pulse_mesh, raZOar, raZOA, materials } = build_scene_model(visual_key, accent);
    group.position.y = -0.2;
    scene.add(group);

    const stars_geom = new THREE.BufferGeometry();
    const stars_count = 520;
    const star_positions = new Float32Array(stars_count * 3);
    for (let i = 0; i < stars_count; i++) {
      const r = 2.4 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      star_positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      star_positions[i * 3 + 1] = r * Math.cos(phi);
      star_positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    stars_geom.setAttribute('position', new THREE.BufferAttribute(star_positions, 3));
    const stars_mat = new THREE.PointsMaterial({
      color: accent.clone().multiplyScalar(0.95),
      size: 0.015,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(stars_geom, stars_mat);
    scene.add(stars);

    let raf = 0;
    let t0 = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();

    const on_resize = () => resize();
    window.addEventListener('resize', on_resize);

    const on_pointer_move = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouse_ref.current = { x: nx, y: ny };
    };
    host.addEventListener('pointermove', on_pointer_move);

    const animate = (now: number) => {
      const dt = (now - t0) / 1000;
      t0 = now;

      const m = mouse_ref.current;
      const target_rx = -m.y * 0.3;
      const target_ry = m.x * 0.45;
      group.rotation.x += (target_rx - group.rotation.x) * (1 - Math.pow(0.0009, dt * 60));
      group.rotation.y += (target_ry - group.rotation.y) * (1 - Math.pow(0.0009, dt * 60));
      group.rotation.z = Math.sin(now * 0.0008) * 0.1;
      group.position.y = -0.2 + Math.sin(now * 0.0015) * 0.08;

      raZOar.rotation.x += dt * 0.2;
      raZOar.rotation.y += dt * 0.1;
      raZOA.rotation.y -= dt * 0.15;
      raZOA.rotation.z += dt * 0.25;

      stars.rotation.y += dt * 0.2;
      stars.rotation.x = Math.sin(now * 0.0004) * 0.12;
      stars_mat.opacity = 0.45 + 0.25 * (0.5 + 0.5 * Math.sin(now * 0.002));

      const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);
      const thinking_amp = mode === 'thinking' ? 1.5 : mode === 'typing' ? 1.25 : 1.0;
      base.scale.setScalar(1.0 + pulse * 0.04 * thinking_amp);

      if (pulse_mesh) {
        const s = 1.0 + pulse * 0.4 * thinking_amp;
        pulse_mesh.scale.setScalar(s);
        const mat = pulse_mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.8 + pulse * 1.2 * thinking_amp;
        mat.needsUpdate = true;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', on_resize);
      host.removeEventListener('pointermove', on_pointer_move);
      scene.traverse((obj) => {
        const any_obj = obj as unknown as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        if (any_obj.geometry) any_obj.geometry.dispose();
        if (any_obj.material) {
          if (Array.isArray(any_obj.material)) any_obj.material.forEach((m) => m.dispose());
          else any_obj.material.dispose();
        }
      });
      materials.forEach((m) => m.dispose());
      stars_geom.dispose();
      stars_mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [visual_key, accent, mode]);

  return <div ref={host_ref} className="h-full w-full" />;
};
