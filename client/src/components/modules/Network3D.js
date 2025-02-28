// components/Network3D.jsx
import React, { useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const Node = ({ id, position, color, label, isSpecial }) => {
  return (
    <group position={position}>
      {/* 3D 球体节点 */}
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 特殊节点效果 */}
      {isSpecial && <Sparkles count={20} scale={8} size={3} speed={0.4} color={color} />}
    </group>
  );
};

// 新增自动居中组件（保持原有代码结构）
const AutoCenter = ({ nodes, sinks, senders }) => {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    // 合并所有节点数据（保持原有数据结构）
    const allNodes = [...nodes, ...sinks, ...senders].map(
      (n) => new THREE.Vector3(n.x, n.y, n.z || 0)
    );

    // 计算包围盒
    const box = new THREE.Box3().setFromPoints(allNodes);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // 自动调整相机（保持原有视角逻辑）
    camera.position.set(center.x + maxDim * 3, center.y + maxDim * 2, center.z + maxDim * 3);
    camera.lookAt(center);
    if (controls) controls.target.copy(center);
  }, [nodes, sinks, senders]);

  return null;
};

const NetworkScene = ({ nodes, sinks, senders }) => {
  console.log(nodes, sinks, senders);
  return (
    <>
      {/* 普通节点（蓝色） */}
      {nodes.map((node, index) => (
        <Node
          id={node.id}
          key={`node-${index}`}
          position={[node.x, node.y, 0]}
          color="#007bff"
          label={`Node ${node.id}`}
        />
      ))}

      {/* Sink节点（绿色+特效） */}
      {sinks.map((sink, index) => (
        <Node
          id={sink.id}
          key={`sink-${index}`}
          position={[sink.x, sink.y, 0]}
          color="#28a745"
          label={`Sink ${sink.id}`}
          isSpecial
        />
      ))}

      {/* Sender节点（红色+特效） */}
      {senders.map((sender, index) => (
        <Node
          id={sender.id}
          key={`sender-${index}`}
          position={[sender.x, sender.y, 0]}
          color="#dc3545"
          label={`Sender ${sender.id}`}
          isSpecial
        />
      ))}

      {/* 场景控制 */}
      <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.8} zoomSpeed={0.8} />
      <ambientLight intensity={0.5} />
      <pointLight position={[1000, 1000, 1000]} intensity={1} />
    </>
  );
};

export default function Network3D({ nodes, sinks, senders }) {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{
          position: [100, 100, 10], // 斜上方45度视角
          up: [0, 0, 1], // 确保Y轴朝上
          fov: 45,
          near: 1,
          far: 5000,
        }}
      >
        <AutoCenter nodes={nodes} sinks={sinks} senders={senders} />
        <NetworkScene nodes={nodes} sinks={sinks} senders={senders} />
      </Canvas>
    </div>
  );
}
