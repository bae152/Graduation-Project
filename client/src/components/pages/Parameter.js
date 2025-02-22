import React, { useState } from "react";

import { post } from "../../utilities.js";
import "./Parameter.css";

const Parameter = (props) => {
  const [nodeCount, setNodeCount] = useState(0);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleNodeCountChange = (event) => {
    setNodeCount(Number(event.target.value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟网络延迟
    if (nodeCount <= 100) {
      setDownloadUrl(`http://localhost:3000/downloads/second-${nodeCount}-0.pcap`);
      setError("");
      return;
    }
    try {
      const response = await post("/api/parameter", { nodeCount });

      setDownloadUrl(response.url);
    } catch (error) {
      console.error("完整错误信息:", error); // 显示完整错误
      setError("无法启动仿真: " + (error.message || "未知错误"));
    }
  };

  return (
    <>
      <h2>输入节点数量</h2>
      <form onSubmit={handleSubmit}>
        <input
          /* type="number"*/
          value={nodeCount}
          onChange={handleNodeCountChange}
          placeholder="节点数"
          min="1"
        />
        <button type="submit">启动仿真</button>
      </form>
      {error && <p>{error}</p>}
      {downloadUrl && (
        <div>
          <p>仿真完成！</p>
          <a href={downloadUrl} download="simulation.pcap">
            点击下载 second-{nodeCount}-0.pcap 文件
          </a>
        </div>
      )}
    </>
  );
};

export default Parameter;
