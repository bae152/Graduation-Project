import React, { useState, useEffect } from "react";
import { Treebeard, decorators } from "react-treebeard";
import "./Data.css";
import InputField from "../modules/InputField.js";

const Data = ({ nodeId }) => {
  const [protocolTreeData, setProtocolTreeData] = useState(null); // 协议树数据
  const [selectedPacket, setSelectedPacket] = useState(null); // 当前选择的数据包
  const [packets, setPackets] = useState([]);

  useEffect(() => {
    const savedData = sessionStorage.getItem("dataFormData");
    if (savedData) {
      const { protocolTreeData, selectedPacket, packets } = JSON.parse(savedData);
      setProtocolTreeData(protocolTreeData);
      setSelectedPacket(selectedPacket);
      setPackets(packets);
    }
  }, []);

  // 每当表单数据变化时，将数据存入 sessionStorage
  useEffect(() => {
    if (!nodeId) return;
    handleGetNodePackets(); // 获取节点数据包
    setProtocolTreeData(); // 清空协议树数据
    setSelectedPacket(); // 清空当前选择的数据包
  }, [nodeId]);

  useEffect(() => {
    const data = {
      nodeId,
      packets,
      selectedPacket,
      protocolTreeData,
    };
    sessionStorage.setItem("dataFormData", JSON.stringify(data));
  }, [packets, selectedPacket, protocolTreeData]);

  // 生成协议树数据示例（此处仅示范结构，可根据实际数据调整）
  const formatProtocolTree = (packet) => {
    console.log(packet);
    return {
      name: "Frame",
      toggled: true,
      children: [
        {
          name: "物理层/Physical Layer",
          toggled: true,
          children: [
            {
              name: "时间/Time",
              value: packet.timestamp,
            },
            {
              name: "帧长度/Frame Length",
              value: packet.payload.size,
            },
            ...(packet.type === "t"
              ? [
                  {
                    name: "发射功率/Transmission Power",
                    value: packet.packetStamp.Pt,
                  },
                  {
                    name: "频率/Frequency",
                    value: packet.packetStamp.Freq,
                  },
                ]
              : []),
          ],
        },
        {
          name: "AquaSim Network Header",
          toggled: true,
          children: [
            { name: "源地址/Source Address", value: packet.aquaHeader.SenderAddr },
            { name: "目的地址/Destination Address", value: packet.aquaHeader.DestAddr },
          ],
        },
        {
          name: "MAC Header",
          toggled: true,
          children: [
            { name: "源MAC/Source MAC", value: packet.macHeader.SA },
            { name: "目的MAC/Destination MAC", value: packet.macHeader.DA },
          ],
        },
        {
          name: "Vector-Based Routing Header",
          toggled: true,
          children: [
            { name: "起点/Start Point", value: packet.vbHeader.StartPoint },
            { name: "终点/End Point", value: packet.vbHeader.EndPoint },
          ],
        },
        {
          name: "Payload",
          toggled: true,
          children: [{ name: "大小/Size", value: packet.payload.size }],
        },
      ],
    };
  };

  // 自定义 Header 装饰器：显示 name 和 value（如果存在）
  const CustomHeader = ({ style, node }) => {
    return (
      <div style={style.base}>
        <div style={style.title}>
          {node.name}
          {node.value !== undefined && (
            <span style={{ color: "gray", marginLeft: "5px" }}>: {node.value}</span>
          )}
        </div>
      </div>
    );
  };

  // 创建自定义装饰器对象，覆盖默认的 Header
  const customDecorators = {
    ...decorators,
    Header: CustomHeader,
  };

  // 当用户点击"获取数据"按钮时，根据输入的 nodeId 发起 GET 请求
  const handleGetNodePackets = async () => {
    if (!nodeId) {
      alert("请输入节点编号！");
      return;
    }
    try {
      const response = await fetch(`/api/nodes/${nodeId}/packets`);
      if (!response.ok) {
        throw new Error(`获取数据失败: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      // 假设返回格式为 { packets: [...] }
      setPackets(data.packets);
    } catch (error) {
      console.error("获取数据错误:", error);
      alert("获取数据失败：" + error.message);
    }
  };

  return (
    <div className="data-container">
      {packets.length > 0 && (
        <div className="table-container">
          <table className="packet-table">
            <thead>
              <tr>
                <th>#</th>
                <th>时间</th>
                <th>源地址</th>
                <th>目的地址</th>
                <th>协议栈</th>
                <th>关键信息</th>
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
                  <td>{packet.timestamp}</td>
                  <td>{packet.aquaHeader.SenderAddr}</td>
                  <td>{packet.aquaHeader.DestAddr}</td>
                  <td>VBF</td>
                  <td>
                    {packet.type} {packet.payload.size}bytes
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedPacket && protocolTreeData && (
        <div className="protocol-tree-container">
          <h3>协议详细信息</h3>
          <Treebeard
            data={protocolTreeData}
            decorators={customDecorators}
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
