import React, { useState, useEffect } from "react";
import "./Simulation.css";
import AnimationComponent from "../modules/AnimationComponent.js";

const Simulation = ({ setNodeId, giveDataRate }) => {
  // 状态保存后端解析返回的数据
  const [nodes, setNodes] = useState([]);
  const [sinks, setSinks] = useState([]);
  const [senders, setSenders] = useState([]);
  const [log, setLog] = useState([]);
  const [range, setRange] = useState();

  useEffect(() => {
    const savedData = sessionStorage.getItem("simulationFormData");
    if (savedData) {
      const { nodes, sinks, senders, log, range } = JSON.parse(savedData);
      setNodes(nodes);
      setSinks(sinks);
      setSenders(senders);
      setLog(log);
      setRange(range);
    }
  }, []);

  useEffect(() => {
    const data = {
      nodes,
      sinks,
      senders,
      log,
      range,
      giveDataRate,
    };
    sessionStorage.setItem("simulationFormData", JSON.stringify(data));
  }, [nodes, sinks, senders, log, range, giveDataRate]);

  // 点击按钮后调用后端接口解析所有文件
  const handleParseAll = async () => {
    try {
      // 发送 GET 请求到后端解析接口
      const response = await fetch("/api/parseAll");
      if (!response.ok) {
        throw new Error("网络响应异常");
      }
      const result = await response.json();
      console.log("解析日志文件成功：", result);
      // 根据返回数据更新状态
      setNodes(result.nodeData.nodes || []);
      setSinks(result.nodeData.sinks || []);
      setSenders(result.nodeData.senders || []);
      setLog(result.logData.log || []);
      setRange(result.logData.range);
    } catch (error) {
      console.error("解析日志文件出错：", error);
    }
  };

  return (
    <div>
      <AnimationComponent
        nodes={nodes}
        senders={senders}
        sinks={sinks}
        log={log}
        range={range}
        setNodeId={setNodeId}
        giveDataRate={giveDataRate}
        handleParseAll={handleParseAll}
      />
    </div>
  );
};

export default Simulation;
