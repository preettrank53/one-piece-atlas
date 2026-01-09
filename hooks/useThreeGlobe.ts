import { useEffect, useRef, RefObject } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { UnrealBloomPass } from 'three-stdlib';
import { latLonToVector3, getGlobeRotation } from '../utils/globeUtils';
import {
  globeVertexShader,
  globeFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from '../utils/shaders';
import type { Island } from '../utils/islandData';
import { ONE_PIECE_DATA } from '../data/onePieceData';

interface UseThreeGlobeOptions {
  containerRef: RefObject<HTMLDivElement>;
  activeIslands: Island[];
  selectedVoyage: string;
  onIslandClick?: (island: Island) => void;
  onIslandHover?: (island: Island | null) => void;
}

export const useThreeGlobe = ({
  containerRef,
  activeIslands,
  selectedVoyage,
  onIslandClick,
  onIslandHover,
}: UseThreeGlobeOptions) => {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const markersRef = useRef<Record<string, THREE.Group>>({});
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const hoveredIslandRef = useRef<Island | null>(null);
  const isDraggingRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Interactive Elements Refs
  const shipRef = useRef<THREE.Group | null>(null);
  const weatherSystemRef = useRef<THREE.Points | null>(null);
  const shipProgressRef = useRef(0);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 18;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Post-Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5,
      0.4,
      0.85
    );
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;
    bloomPass.threshold = 0.7;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // 3. Globe Texture & Mesh
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for globe canvas');
      return;
    }

    ctx.fillStyle = '#051a2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const equatorY = canvas.height / 2;
    const glGrad = ctx.createLinearGradient(0, equatorY - 50, 0, equatorY + 50);
    glGrad.addColorStop(0, 'rgba(30, 144, 255, 0)');
    glGrad.addColorStop(0.5, 'rgba(30, 144, 255, 0.3)');
    glGrad.addColorStop(1, 'rgba(30, 144, 255, 0)');
    ctx.fillStyle = glGrad;
    ctx.fillRect(0, equatorY - 80, canvas.width, 160);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(canvas.width / 2 - 5, 0, 10, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * (canvas.height / 20));
      ctx.lineTo(canvas.width, i * (canvas.height / 20));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * (canvas.width / 20), 0);
      ctx.lineTo(i * (canvas.width / 20), canvas.height);
      ctx.stroke();
    }

    const globeTexture = new THREE.CanvasTexture(canvas);
    const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
    const globeMaterial = new THREE.ShaderMaterial({
      vertexShader: globeVertexShader,
      fragmentShader: globeFragmentShader,
      uniforms: {
        globeTexture: { value: globeTexture },
        sunPosition: { value: new THREE.Vector3(10, 5, 10) },
      },
      side: THREE.FrontSide,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);
    globeRef.current = globe;

    // Atmosphere
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(5.8, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      })
    );
    scene.add(atmosphere);

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++)
      posArray[i] = (Math.random() - 0.5) * 100;
    starsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3)
    );
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        size: 0.15,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(stars);

    // Ship Setup
    const shipGroup = new THREE.Group();
    const shipHull = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.3, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shipHull.rotation.x = Math.PI / 2;
    shipGroup.add(shipHull);
    const shipGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.2),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      })
    );
    shipGroup.add(shipGlow);
    scene.add(shipGroup);
    shipRef.current = shipGroup;

    // Weather Particles (Snow/Ambience)
    const weatherGeo = new THREE.BufferGeometry();
    const weatherPos = [];
    for (let i = 0; i < 1000; i++) {
      weatherPos.push(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
    }
    weatherGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(weatherPos, 3)
    );
    const weatherMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xaaddff,
      transparent: true,
      opacity: 0.4,
    });
    const weatherSys = new THREE.Points(weatherGeo, weatherMat);
    scene.add(weatherSys);
    weatherSystemRef.current = weatherSys;

    // Raycaster & Event Listeners
    raycasterRef.current = new THREE.Raycaster();

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current && globeRef.current) {
        const deltaX = e.movementX * 0.003;
        const deltaY = e.movementY * 0.003;
        globeRef.current.rotation.y += deltaX;
        globeRef.current.rotation.x += deltaY;
      }
    };
    const handleMouseDown = () => {
      isDraggingRef.current = true;
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = () => {
      if (isDraggingRef.current) return;
      if (!raycasterRef.current || !cameraRef.current) return;

      raycasterRef.current.setFromCamera(
        new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
        cameraRef.current
      );
      const markerMeshes = Object.values(markersRef.current)
        .map(g => g.children[0])
        .filter((obj): obj is THREE.Object3D => !!obj);

      const intersects = raycasterRef.current.intersectObjects(
        markerMeshes,
        true
      );

      if (intersects.length > 0) {
        const object = intersects[0].object;
        const islandId = Object.keys(markersRef.current).find(id => {
          const group = markersRef.current[id];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return group.children.includes(object as any);
        });
        if (islandId) {
          const island = activeIslands.find(i => i.id === islandId);
          if (island) onIslandClick?.(island);
        }
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('click', handleClick);

    // Resize
    const handleResize = () => {
      if (
        !container ||
        !cameraRef.current ||
        !rendererRef.current ||
        !composerRef.current
      )
        return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      composerRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Globe Auto-rotation
      if (!isDraggingRef.current && globeRef.current) {
        globeRef.current.rotation.y += 0.0005;
      }

      // Hover Detection
      if (raycasterRef.current && cameraRef.current && !isDraggingRef.current) {
        raycasterRef.current.setFromCamera(
          new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
          cameraRef.current
        );
        const markerMeshes = Object.values(markersRef.current)
          .map(g => g.children[0])
          .filter((obj): obj is THREE.Object3D => !!obj);

        const intersects = raycasterRef.current.intersectObjects(
          markerMeshes,
          true
        );

        if (intersects.length > 0) {
          const object = intersects[0].object;
          const islandId = Object.keys(markersRef.current).find(id => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return markersRef.current[id].children.includes(object as any);
          });
          if (islandId) {
            const island = activeIslands.find(i => i.id === islandId);
            if (island && hoveredIslandRef.current?.id !== island.id) {
              hoveredIslandRef.current = island;
              onIslandHover?.(island);
              document.body.style.cursor = 'pointer';
            }
          }
        } else {
          if (hoveredIslandRef.current) {
            hoveredIslandRef.current = null;
            onIslandHover?.(null);
            document.body.style.cursor = 'default';
          }
        }
      }

      // Update Weather Particles
      if (
        weatherSystemRef.current &&
        weatherSystemRef.current.geometry.attributes.position
      ) {
        const positions = weatherSystemRef.current.geometry.attributes.position
          .array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 0.02; // Fall down
          if (positions[i + 1] < -8) positions[i + 1] = 8; // Reset top
        }
        weatherSystemRef.current.geometry.attributes.position.needsUpdate = true;
        weatherSystemRef.current.rotation.y += 0.002;
      }

      if (composerRef.current) composerRef.current.render();
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('click', handleClick);
      if (rendererRef.current?.domElement)
        container.removeChild(rendererRef.current.domElement);
    };
  }, [containerRef, activeIslands, onIslandClick, onIslandHover]);

  // Effect: Manage Markers
  useEffect(() => {
    if (!sceneRef.current) return;
    Object.values(markersRef.current).forEach(g => sceneRef.current?.remove(g));
    markersRef.current = {};
    activeIslands.forEach(island => {
      const coords = latLonToVector3(island.lat, island.lon, 5.05);
      const group = new THREE.Group();
      group.position.set(coords.x, coords.y, coords.z);
      group.lookAt(0, 0, 0);
      const geometry = new THREE.OctahedronGeometry(
        island.importance === 'Legendary' ? 0.15 : 0.1,
        0
      );
      const color = island.hasPoneglyph ? 0xffd700 : 0x00ffff;
      const material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
      });
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(
          island.importance === 'Legendary' ? 0.08 : 0.05,
          0
        ),
        new THREE.MeshBasicMaterial({ color: color })
      );
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      group.add(core);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.4, 0),
      ]);
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.5,
        })
      );
      group.add(line);
      sceneRef.current?.add(group);
      markersRef.current[island.id] = group;
    });
  }, [activeIslands]);

  // Effect: Ship Animation & Path
  useEffect(() => {
    if (!sceneRef.current || !shipRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const voyageIds = (ONE_PIECE_DATA as any).paths[selectedVoyage] || [];
    if (voyageIds.length < 2) return;

    const points = voyageIds
      .map((id: string) => {
        const island = (ONE_PIECE_DATA.islands as Island[]).find(
          i => i.id === id
        );
        if (!island) return new THREE.Vector3(0, 0, 0);
        return latLonToVector3(island.lat, island.lon, 5.1); // Slightly above surface
      })
      .filter((p: THREE.Vector3) => p.lengthSq() > 0);

    const curve = new THREE.CatmullRomCurve3(points);

    // Visualize Path (Neon Line)
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.02, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
    });
    const pathMesh = new THREE.Mesh(tubeGeo, tubeMat);
    sceneRef.current.add(pathMesh);

    // Animation Interval
    const interval = setInterval(() => {
      shipProgressRef.current = (shipProgressRef.current + 0.001) % 1;
      const pos = curve.getPoint(shipProgressRef.current);
      const tangent = curve.getTangent(shipProgressRef.current);
      if (shipRef.current) {
        shipRef.current.position.copy(pos);
        shipRef.current.lookAt(pos.clone().add(tangent));
      }
    }, 16);

    return () => {
      clearInterval(interval);
      sceneRef.current?.remove(pathMesh);
    };
  }, [selectedVoyage]);

  const flyToIsland = (island: Island) => {
    if (!globeRef.current || !cameraRef.current) return;
    const rotation = getGlobeRotation(island.lat, island.lon);
    const startRot = {
      x: globeRef.current.rotation.x,
      y: globeRef.current.rotation.y,
    };
    const startTime = Date.now();
    const duration = 1500;
    const animateFly = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      if (globeRef.current) {
        globeRef.current.rotation.x =
          startRot.x + (rotation.x - startRot.x) * ease;
        globeRef.current.rotation.y =
          startRot.y + (rotation.y - startRot.y) * ease;
      }
      if (progress < 1) requestAnimationFrame(animateFly);
    };
    animateFly();
  };

  return {
    flyToIsland,
    setLightIntensity: () => {},
    zoomIn: () => {
      if (cameraRef.current) cameraRef.current.position.z -= 2;
    },
    zoomOut: () => {
      if (cameraRef.current) cameraRef.current.position.z += 2;
    },
    resetView: () => {},
    globeRef,
  };
};
