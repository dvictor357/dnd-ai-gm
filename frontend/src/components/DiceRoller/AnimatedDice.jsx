import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const AnimatedDice = forwardRef(({ diceType = 'd20', onRollComplete, initialRotation = { x: 0, y: 0, z: 0 } }, ref) => {
  const containerRef = useRef(null);
  const requestRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const diceRef = useRef();
  const [isRolling, setIsRolling] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(200, 200);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create dice geometry based on type
    let geometry;
    switch (diceType) {
      case 'd20':
        geometry = new THREE.IcosahedronGeometry(1);
        break;
      case 'd12':
        geometry = new THREE.DodecahedronGeometry(1);
        break;
      case 'd10':
        geometry = new THREE.ConeGeometry(1, 2, 10);
        break;
      case 'd8':
        geometry = new THREE.OctahedronGeometry(1);
        break;
      case 'd6':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'd4':
        geometry = new THREE.TetrahedronGeometry(1);
        break;
      default:
        geometry = new THREE.IcosahedronGeometry(1);
    }

    // Create dice material
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x444444,
      shininess: 30,
    });

    // Create dice mesh
    const dice = new THREE.Mesh(geometry, material);
    dice.rotation.set(
      initialRotation.x,
      initialRotation.y,
      initialRotation.z
    );
    scene.add(dice);
    diceRef.current = dice;

    // Animation loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [diceType, initialRotation]);

  // Expose rollDice method through ref
  useImperativeHandle(ref, () => ({
    rollDice: () => {
      if (isRolling || !diceRef.current) return;
      setIsRolling(true);

      // Random rotations
      const targetRotation = {
        x: Math.random() * Math.PI * 4,
        y: Math.random() * Math.PI * 4,
        z: Math.random() * Math.PI * 4
      };

      // Animate the dice roll
      gsap.to(diceRef.current.rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 2,
        ease: "power2.out",
        onComplete: () => {
          setIsRolling(false);
          if (onRollComplete) {
            onRollComplete();
          }
        }
      });
    }
  }));

  return (
    <div 
      ref={containerRef} 
      className={`w-[200px] h-[200px] cursor-pointer ${isRolling ? 'pointer-events-none' : ''}`}
      onClick={() => ref.current?.rollDice()}
    />
  );
});

export default AnimatedDice;
