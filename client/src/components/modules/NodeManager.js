import React, { useState } from "react";
import CoordinateInput from "./CoordinateInput";

/**
 * NodeManager 组件：
 * - 集成了添加节点、删除节点、确认节点数据的功能
 * - 不再需要单独的 NodeList/OnlineNodeAdd 父子关系
 *
 * Props:
 * - label: 用于显示标题，如“普通节点”
 * - onUploadSuccess: 点击“确定节点数据”时的回调
 * - onUploadError: 当输入不完整时的报错回调
 */
const NodeManager = ({ onUploadSuccess, onUploadError }) => {
  // 当前已添加的节点数组
  const [nodes, setNodes] = useState([]);
  // 正在输入的新节点坐标
  const [newNode, setNewNode] = useState({ x: "", y: "", z: "" });

  // 更新新节点坐标
  const handleNewNodeChange = (field, value) => {
    setNewNode((prev) => ({ ...prev, [field]: value }));
  };

  // 添加节点
  const addNode = () => {
    // 简单的校验：若有坐标未填，则触发错误回调
    if (!newNode.x || !newNode.y || !newNode.z) {
      onUploadError?.(new Error("请输入完整的节点坐标"));
      return;
    }
    // 创建新的节点对象
    const nodeData = {
      id: nodes.length, // 按输入顺序递增 ID
      x: parseFloat(newNode.x),
      y: parseFloat(newNode.y),
      z: parseFloat(newNode.z),
    };
    // 更新节点列表
    const updatedNodes = [...nodes, nodeData];
    setNodes(updatedNodes);
    // 清空输入框
    setNewNode({ x: "", y: "", z: "" });
  };

  // 删除节点
  const deleteNode = (id) => {
    // 过滤掉指定 ID 的节点，并重新编号
    const updatedNodes = nodes
      .filter((node) => node.id !== id)
      .map((node, index) => ({ ...node, id: index }));
    setNodes(updatedNodes);
  };

  // 提交节点数据
  const handleSubmit = () => {
    const result = {
      data: {
        nodes: nodes,
      },
    };
    // 调用父组件传下来的回调，通知节点数据准备就绪
    onUploadSuccess?.(result);
  };

  return (
    <div>
      {/* 输入新节点坐标 */}
      <div className="form-field">
        <CoordinateInput label="普通节点" coordinate={newNode} onChange={handleNewNodeChange} />
      </div>

      {/* 按钮区域 */}
      <button className="submit-button" type="button" onClick={addNode}>
        添加节点
      </button>
      <button className="submit-button" type="button" onClick={handleSubmit}>
        确定节点数据
      </button>

      {/* 节点列表显示 */}
      <ul>
        {nodes.map((node) => (
          <li key={node.id}>
            {`ID: ${node.id}, X: ${node.x}, Y: ${node.y}, Z: ${node.z}`}
            <button className="submit-button" type="button" onClick={() => deleteNode(node.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NodeManager;
