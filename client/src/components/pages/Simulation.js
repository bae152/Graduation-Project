import React, { useState } from "react";
import Network3D from "../modules/Network3D";
import "./Simulation.css";

const Simulation = (props) => {
  const [selectedNodeFile, setSelectedNodeFile] = useState(null);
  const [selectedLogFile, setSelectedLogFile] = useState(null);
  //const [nodePackets, setnodePackets] = useState([]);
  //const [logPackets, setlogPackets] = useState([]);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [sinks, setSinks] = useState([]);
  const [senders, setSenders] = useState([]);
  // 为每个上传区域编写独立的处理函数
  const handleNodeFileChange = (e) => {
    const file = e.target.files[0];
    if (file?.name.endsWith(".txt")) {
      setSelectedNodeFile(file);
    } else {
      alert("仅支持 txt 文件");
      setSelectedNodeFile(null);
    }
  };

  const handleLogFileChange = (e) => {
    const file = e.target.files[0];
    if (file?.name.endsWith(".txt")) {
      setSelectedLogFile(file);
    } else {
      alert("仅支持 txt 文件");
      setSelectedLogFile(null);
    }
  };

  const handleNodeUpload = async () => {
    if (!selectedNodeFile) {
      alert("请选择文件！");
      return;
    }

    setNodeLoading(true);

    // ✅ 正确封装文件读取逻辑
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // ✅ 确保事件监听在函数内部
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsedNodes = [];
          const parsedSinks = [];
          const parsedSenders = [];

          // ✅ 改进后的正则表达式
          content.split("\n").forEach((line, index) => {
            const trimmedLine = line.trim();

            // 跳过空行
            if (trimmedLine === "") {
              console.log(`第 ${index + 1} 行为空，已跳过`);
              return;
            }
            const match = trimmedLine.match(
              /(Node|Sink|Sender)\s+(\d+):\s*\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/
            );
            if (!match) {
              throw new Error(`第 ${index + 1} 行格式错误`);
            }
            // 解构匹配结果
            const [, type, id, x, y, z] = match;

            const nodeData = {
              id: parseInt(id),
              x: parseFloat(x),
              y: parseFloat(y),
              z: parseFloat(z),
            };

            // 分类存储
            switch (type.toLowerCase()) {
              case "node":
                parsedNodes.push(nodeData);
                break;
              case "sink":
                parsedSinks.push(nodeData);
                break;
              case "sender":
                parsedSenders.push(nodeData);
                break;
              default:
                throw new Error(`未知节点类型: ${type}`);
            }
          });

          // 更新所有状态
          setNodes(parsedNodes);
          setSinks(parsedSinks);
          setSenders(parsedSenders);

          console.log("解析结果：", {
            nodes: parsedNodes,
            sinks: parsedSinks,
            senders: parsedSenders,
          });

          setNodeLoading(false);
          resolve();
        } catch (error) {
          setNodeLoading(false);
          alert(error.message);
          reject(error);
        }
      };

      reader.onerror = () => {
        setNodeLoading(false);
        alert("文件读取失败");
        reject(new Error("文件读取错误"));
      };

      reader.readAsText(selectedNodeFile);
    });
  };

  const handleLogUpload = async () => {
    if (!selectedLogFile) {
      alert("请选择文件！");
      return;
    }

    setLogLoading(true);
    const formData = new FormData();
    formData.append("txt", selectedLogFile);

    try {
      const response = await fetch("/api/logUpload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "日志解析失败");
      }

      // 转换数据结构
      const formattedTimeline = data.timeline.map((event) => ({
        ...event,
        from: {
          x: event.coords[0],
          y: event.coords[1],
          z: event.coords[2] || 0,
        },
        to: null, // 接收端坐标需要根据节点ID匹配
      }));

      // 关联接收节点坐标
      const nodeMap = [...nodes, ...sinks, ...senders].reduce((acc, node) => {
        acc[node.id.toString().padStart(4, "0")] = node;
        return acc;
      }, {});

      const completeTimeline = formattedTimeline.map((event) => ({
        ...event,
        to: nodeMap[event.receiverId]?.position,
      }));

      setLogPackets(completeTimeline);
    } catch (error) {
      console.error("错误:", error);
      alert(error.message);
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <div className="simulation-container">
      <div>节点文件上传</div>
      <div className="upload-section">
        <input type="file" onChange={handleNodeFileChange} accept=".txt" className="file-input" />
        <button onClick={handleNodeUpload} disabled={nodeLoading} className="upload-button">
          {nodeLoading ? "解析中..." : "上传并解析"}
        </button>
      </div>
      <div>日志文件上传</div>
      <div className="upload-section">
        <input type="file" onChange={handleLogFileChange} accept=".txt" className="file-input" />
        <button onClick={handleLogUpload} disabled={logLoading} className="upload-button">
          {logLoading ? "解析中..." : "上传并解析"}
        </button>
      </div>

      {/* 3D 可视化区域 */}
      <div className="visualization-section">
        {nodes.length + sinks.length + senders.length > 0 ? (
          <Network3D nodes={nodes} sinks={sinks} senders={senders} />
        ) : (
          <div className="visualization-placeholder">
            <p>⏳ 请先上传节点文件查看3D网络</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Simulation;
