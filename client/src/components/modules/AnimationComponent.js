import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./AnimationComponent.css";

const AnimationComponent = ({
  nodes,
  senders,
  sinks,
  log,
  range,
  setNodeId,
  giveDataRate,
  handleParseAll,
}) => {
  // 合并普通节点、发送节点与接收节点到一起
  const [typedNodes, setTypedNodes] = useState([]);
  useEffect(() => {
    const mergedNodes = [...nodes].map((node) => ({ ...node, type: "normal" }));
    if (senders.length > 0) {
      mergedNodes.push({
        id: nodes.length, // 确保唯一ID
        x: senders[0].x,
        y: senders[0].y,
        type: "source",
      });
    }
    if (sinks.length > 0) {
      mergedNodes.push({
        id: nodes.length + 1, // 确保唯一ID
        x: sinks[0].x,
        y: sinks[0].y,
        type: "sink",
      });
    }
    setTypedNodes(mergedNodes);
  }, [nodes, senders, sinks]);

  // 计算数据范围并转换坐标
  const canvasWidth = 800;
  const canvasHeight = 600;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  typedNodes.forEach((node) => {
    if (node.x < minX) minX = node.x;
    if (node.x > maxX) maxX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.y > maxY) maxY = node.y;
  });
  if (typedNodes.length === 0) {
    // 默认范围
    minX = 0;
    maxX = canvasWidth;
    minY = 0;
    maxY = canvasHeight;
  }
  const dataWidth = maxX - minX || 1;
  const dataHeight = maxY - minY || 1;
  // 计算缩放比例，预留 10% 边距
  const scaleX = canvasWidth / dataWidth;
  const scaleY = canvasHeight / dataHeight;
  const scaleFactor = Math.min(scaleX, scaleY) * 0.7;
  // 计算偏移量，使内容居中
  const offsetX = (canvasWidth - dataWidth * scaleFactor) / 2;
  const offsetY = (canvasHeight - dataHeight * scaleFactor) / 2;
  // 坐标转换函数：原始 -> 画布坐标
  const transformCoord = (x, y) => ({
    x: (x - minX) * scaleFactor + offsetX,
    y: (y - minY) * scaleFactor + offsetY,
  });

  // 仿真时间与日志控制相关逻辑
  // 每个节点的波纹事件存为数组，事件为 { key, startTime }
  const [nodeWaveStatus, setNodeWaveStatus] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef(null);
  const waveDuration = 1; // 每个动画波持续 1 秒（仿真时间）

  const togglePlayPause = () => setIsPlaying((prev) => !prev);
  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentIndex(0);
    setNodeWaveStatus({});
  };

  // 定时更新 currentTime（仿真时间）
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 0.1);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  // 根据日志触发波纹事件（记录开始时间）
  useEffect(() => {
    if (log.length === 0 || currentIndex >= log.length) return;
    const nextLog = log[currentIndex];
    if (currentTime >= nextLog.time) {
      setNodeWaveStatus((prev) => {
        const newStatus = { ...prev };
        if (!newStatus[nextLog.nodeId]) {
          newStatus[nextLog.nodeId] = [];
        }
        const waveEvent = { key: Date.now() + Math.random(), startTime: currentTime };
        newStatus[nextLog.nodeId].push(waveEvent);
        return newStatus;
      });
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentTime, log, currentIndex]);

  // 每次更新 currentTime 时，清理已过期的波纹事件
  useEffect(() => {
    setNodeWaveStatus((prev) => {
      const newStatus = {};
      for (const nodeId in prev) {
        newStatus[nodeId] = prev[nodeId].filter(
          (event) => currentTime - event.startTime < waveDuration
        );
      }
      return newStatus;
    });
  }, [currentTime]);

  return (
    <div className="simulation-container">
      <div className="controls">
        <button onClick={handleParseAll}>解析日志文件</button>
        <button onClick={togglePlayPause}>{isPlaying ? "暂停" : "开始"}</button>
        <button onClick={resetSimulation}>重置</button>
        <span>时间: {currentTime.toFixed(2)} 秒</span>
      </div>
      <div className="simulation-area">
        <Axes
          minX={minX}
          maxX={maxX}
          minY={minY}
          maxY={maxY}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          scaleFactor={scaleFactor}
          offsetX={offsetX}
          offsetY={offsetY}
          typedNodes={typedNodes}
        />
        {typedNodes.map((node) => {
          const pos = transformCoord(node.x, node.y);
          // 取出该节点当前的波纹事件
          const activeWaves = nodeWaveStatus[node.id] || [];
          return (
            <NodeComponent
              key={node.id}
              node={node}
              position={pos}
              range={range ? range * scaleFactor : 0} // 将后端 range 也按比例缩放
              activeWaves={activeWaves}
              setNodeId={setNodeId}
            />
          );
        })}
      </div>
    </div>
  );
};

// 坐标轴组件，显示 x 轴和 y 轴及刻度标签（原始坐标值）
const Axes = ({
  minX,
  maxX,
  minY,
  maxY,
  canvasWidth,
  canvasHeight,
  scaleFactor,
  offsetX,
  offsetY,
  typedNodes,
}) => {
  const xTickCount = 5;
  const yTickCount = 5;
  const xTicks = [];
  const yTicks = [];
  for (let i = 0; i < xTickCount; i++) {
    const t = i / (xTickCount - 1);
    const value = minX + t * (maxX - minX);
    const pos = (value - minX) * scaleFactor + offsetX;
    xTicks.push({ pos, value: value.toFixed(2) });
  }
  for (let i = 0; i < yTickCount; i++) {
    const t = i / (yTickCount - 1);
    const value = minY + t * (maxY - minY);
    const pos = (value - minY) * scaleFactor + offsetY;
    yTicks.push({ pos, value: value.toFixed(2) });
  }
  return (
    <>
      {typedNodes.length > 0 && (
        <>
          <div className="axis x-axis" style={{ width: canvasWidth, left: 0, top: 0 }}>
            {xTicks.map((tick, index) => (
              <div key={index} className="tick" style={{ left: tick.pos - 10 }}>
                {tick.value}
              </div>
            ))}
          </div>
          <div className="axis y-axis" style={{ height: canvasHeight, left: 0, top: 0 }}>
            {yTicks.map((tick, index) => (
              <div key={index} className="tick" style={{ top: tick.pos - 10 }}>
                {tick.value}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

const NodeComponent = ({ node, position, range, activeWaves, setNodeId }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { x, y } = position;
  const navigate = useNavigate();

  const handleNodeClick = (nodeId) => {
    setNodeId(nodeId);
    navigate("/data");
  };
  // 根据 node.type 设置颜色：source-绿色，sink-红色，normal-黑色；如果有任一波纹事件，则设为亮绿色
  let color = "black";
  if (node.type === "source") color = "green";
  if (node.type === "sink") color = "red";
  if (activeWaves.length > 0) color = "limegreen";

  return (
    <div
      className="node-wrapper"
      style={{ left: x, top: y }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="node"
        style={{ backgroundColor: color }}
        onClick={() => handleNodeClick(node.id)}
      >
        {/* 渲染所有当前的动画波 */}
        {activeWaves.map((event) => (
          <motion.div
            key={event.key}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: -range,
              top: -range,
              width: 2 * range,
              height: 2 * range,
              borderRadius: "50%",
              background: "rgba(0, 255, 0, 0.3)",
              transform: "translate(-50%, -50%)",
              overflow: "hidden",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
      {showTooltip && (
        <div className="tooltip">
          <span>节点 {node.id + 1}</span>
          <br />
          <span>
            ({node.x}, {node.y}, {node.z})
          </span>
        </div>
      )}
    </div>
  );
};

export default AnimationComponent;
