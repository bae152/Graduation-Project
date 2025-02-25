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
    if (nodeCount < 1 || nodeCount > 1000) {
      setError("节点数必须在1-1000之间");
      return;
    }

    try {
      // 显示加载状态（可选）
      setError("");
      setDownloadUrl("");

      // 发送参数到后端API
      const response = await post("/api/parameter", { nodeCount });

      // 检查响应有效性
      if (!response || !response.downloadUrl) {
        throw new Error("无效响应");
      }
      setDownloadUrl(response.downloadUrl);
    } catch (err) {
      console.error("完整错误日志:", err);
      setError(`仿真失败: ${err.message || "未知错误"}`);
    }
  };

  return (
    <>
      <h2>水下传感器网络配置</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="nodeCount">节点数量:</label>
          <input
            type="number"
            id="nodeCount"
            value={nodeCount}
            onChange={handleNodeCountChange}
            min="1"
            max="1000"
            required
          />
        </div>
        <button type="submit">启动仿真</button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {downloadUrl && (
        <div className="success-message">
          <p>仿真已完成！</p>
          <a href={downloadUrl} download={`simulation-node${nodeCount}.pcap`}>
            <button>下载 PCAP 文件</button>
          </a>
        </div>
      )}
    </>
  );
};

export default Parameter;
