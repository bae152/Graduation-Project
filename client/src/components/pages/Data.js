import React, { useState } from "react";
import { Treebeard } from "react-treebeard"; // 使用树形结构组件库
import "./Data.css";

const Data = () => {
  const [packets, setPackets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPacket, setSelectedPacket] = useState(null); // 当前选择的数据包
  const [protocolTreeData, setProtocolTreeData] = useState(null); // 新增状态
  // 文件改变处理
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith(".pcap") || file.name.endsWith(".cap"))) {
      setSelectedFile(file);
    } else {
      alert("仅支持 .pcap/.cap 文件");
      setSelectedFile(null);
    }
  };

  // 文件上传处理
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("请选择文件！");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("pcap", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPackets(data.packets);
      } else {
        alert("数据格式错误");
        setPackets([]);
      }
    } catch (error) {
      console.error("错误:", error);
      alert("解析过程中发生错误");
      setPackets([]);
    } finally {
      setLoading(false);
    }
  };

  const formatProtocolTree = (packet) => {
    const protocols = packet.protocols.split(":");
    const protocolNodes = protocols.map((protocol) => ({
      name: protocol,
      toggled: true,
      children: getProtocolDetails(packet, protocol),
    }));

    return {
      name: "Packet",
      toggled: true,
      children: [
        {
          name: "Frame",
          toggled: true,
          children: [{ name: 111 }],
        },
        ...protocolNodes,
      ],
    };
  };

  // 协议详细信息生成函数
  const getProtocolDetails = (packet, protocol) => {
    switch (protocol.toLowerCase()) {
      case "ppp":
        return [{ name: "Type: Point-to-Point Protocol" }];
      case "ip":
        return [{ name: `Source: ${packet.ip_src}` }, { name: `Destination: ${packet.ip_dst}` }];
      case "udp":
        return [{ name: "Source Port: 9" }, { name: "Destination Port: 49153" }];
      case "discard":
        return [{ name: "Service: Discard Protocol (Port 9)" }];
      default:
        return [];
    }
  };

  return (
    <div className="data-container">
      <h1>PCAP 文件分析</h1>
      <div className="upload-section">
        <input type="file" onChange={handleFileChange} accept=".pcap,.cap" className="file-input" />
        <button onClick={handleUpload} disabled={loading} className="upload-button">
          {loading ? "解析中..." : "上传并解析"}
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p>正在解析数据包...</p>
        </div>
      ) : packets.length > 0 ? (
        <table className="packet-table">
          <thead>
            <tr>
              <th>#</th>
              <th>时间</th>
              <th>源地址</th>
              <th>目的地址</th>
              <th>协议栈</th>
              <th>长度</th>
            </tr>
          </thead>
          <tbody>
            {packets.map((packet, index) => (
              <tr
                key={index}
                onClick={() => {
                  setSelectedPacket(packet);
                  setProtocolTreeData(formatProtocolTree(packet)); // 生成协议树数据
                }}
                className={selectedPacket === packet ? "selected-row" : ""}
              >
                <td>{index + 1}</td>
                <td>{packet.time}</td>
                <td>{packet.ip_src}</td>
                <td>{packet.ip_dst}</td>
                <td>
                  {(() => {
                    const protocols = packet.protocols.split(":");
                    const lastProtocol = protocols[0];
                    return <span>{lastProtocol}</span>;
                  })()}
                </td>
                <td>{packet.len} bytes</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">请上传有效的PCAP文件</p>
      )}
      {selectedPacket && (
        <div className="protocol-tree-container">
          <h3>协议详细信息</h3>
          <Treebeard
            data={protocolTreeData}
            onToggle={(node, toggled) => {
              node.toggled = toggled; // 更新节点展开状态
              setProtocolTreeData({ ...protocolTreeData });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Data;
