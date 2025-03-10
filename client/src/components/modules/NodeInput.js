import React, { useState } from "react";

const NodeInput = (props) => {
  const handleSaveNode = () => {
    const newNode = { x: singleNode.x, y: singleNode.y, z: singleNode.z };
    setNodes([...nodes, newNode]);
    setSingleNode({ x: "", y: "", z: "" });
    setShowInput(false);
  };

  const handleDeleteNode = (index) => {
    const updatedNodes = nodes.filter((_, i) => i !== index);
    setNodes(updatedNodes);
  };

  // 处理接收/发送节点输入
  const handleSingleNodeChange = (e, field) => {
    setSingleNode({ ...singleNode, [field]: e.target.value });
  };

  return (
    <div>
      {type === "普通节点" ? (
        <div>
          <h3>普通节点</h3>
          <button onClick={handleAddNode} style={{ marginBottom: "8px" }}>
            +
          </button>
          {showInput && (
            <div style={{ marginBottom: "8px" }}>
              <input
                type="number"
                placeholder="X"
                value={singleNode.x}
                onChange={(e) => handleSingleNodeChange(e, "x")}
              />
              <input
                type="number"
                placeholder="Y"
                value={singleNode.y}
                onChange={(e) => handleSingleNodeChange(e, "y")}
              />
              <input
                type="number"
                placeholder="Z"
                value={singleNode.z}
                onChange={(e) => handleSingleNodeChange(e, "z")}
              />
              <button onClick={handleSaveNode}>保存</button>
            </div>
          )}
          <div style={{ maxHeight: "100px", overflowY: "auto" }}>
            {nodes.slice(-5).map((node, index) => (
              <div key={index} style={{ marginBottom: "8px" }}>
                <span>{`X: ${node.x}, Y: ${node.y}, Z: ${node.z}`}</span>
                <button onClick={() => handleDeleteNode(index)} style={{ marginLeft: "8px" }}>
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h3>{type}</h3>
          <div>
            <input
              type="number"
              placeholder="X"
              value={singleNode.x}
              onChange={(e) => handleSingleNodeChange(e, "x")}
            />
            <input
              type="number"
              placeholder="Y"
              value={singleNode.y}
              onChange={(e) => handleSingleNodeChange(e, "y")}
            />
            <input
              type="number"
              placeholder="Z"
              value={singleNode.z}
              onChange={(e) => handleSingleNodeChange(e, "z")}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeInput;
