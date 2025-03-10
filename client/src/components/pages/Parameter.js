import React, { useState, useEffect } from "react";
import SelectField from "../modules/SelectField.js";
import InputField from "../modules/InputField.js";
import FileUpload from "../modules/FileUpload.js";
import NodeManager from "../modules/NodeManager.js";
import CoordinateInput from "../modules/CoordinateInput.js";
import "./Parameter.css";

const MACPROTOCOL_OPTIONS = [{ label: "Broadcast（广播）", value: "Broadcast" }];
const ROUTINGPROTOCOL_OPTIONS = [{ label: "VBF（基于向量的转发协议）", value: "VBF" }];
const ENERGYMODE_OPTIONS = [
  { label: "AquaSimEnergyModel（水声模拟能量模型）", value: "AquaSimEnergyModel" },
];
const NODE_DISTRIBUTION_OPTIONS = [
  { label: "自定义-在线添加节点", value: "DIY-online" },
  { label: "自定义-上传节点文件", value: "DIY-upload" },
  { label: "圆形随机分布", value: "round" },
];

const Parameter = ({ setGiveDataRate }) => {
  const [macProtocol, setMacProtocol] = useState("");
  const [routingProtocol, setRoutingProtocol] = useState("");
  const [width, setWidth] = useState("");
  const [nodeDistributionMode, setNodeDistributionMode] = useState("");
  const [center, setCenter] = useState({ x: "", y: "", z: "" });
  const [sink, setSink] = useState({ x: "", y: "", z: "" });
  const [sender, setSender] = useState({ x: "", y: "", z: "" });
  const [targetPos, setTargetPos] = useState({ x: "", y: "", z: "" });
  const [radius, setRadius] = useState("");
  const [nodeCount, setNodeCount] = useState("");
  const [errors, setErrors] = useState({});
  const [nodes, setNodes] = useState([]);
  const [dataRate, setDataRate] = useState("10000");
  const [range, setRange] = useState("");
  const [energyMode, setEnergyMode] = useState("");
  const [rxPower, setRxPower] = useState("");
  const [txPower, setTxPower] = useState("");
  const [idlePower, setIdlePower] = useState("");
  const [initialEnergy, setInitialEnergy] = useState("");

  // 统一坐标更新处理函数
  const coordinateSetters = {
    center: setCenter,
    sink: setSink,
    sender: setSender,
    targetPos: setTargetPos,
  };

  const handleCoordinateChange = (type, field, value) => {
    const setter = coordinateSetters[type];
    if (setter) {
      setter((prev) => ({ ...prev, [field]: value }));
    }
  };

  // 判断坐标对象是否填写完整（x、y、z 均不为空）
  const isCoordinateComplete = (coord) => coord.x !== "" && coord.y !== "" && coord.z !== "";

  // 组件挂载时从 sessionStorage 中恢复数据（如果有）
  useEffect(() => {
    const savedData = sessionStorage.getItem("parameterFormData");
    if (savedData) {
      const data = JSON.parse(savedData);
      setMacProtocol(data.macProtocol || "");
      setRoutingProtocol(data.routingProtocol || "");
      setWidth(data.width || "");
      setEnergyMode(data.energyMode || "");
      setRxPower(data.rxPower || "");
      setTxPower(data.txPower || "");
      setIdlePower(data.idlePower || "");
      setInitialEnergy(data.initialEnergy || "");
      setNodeDistributionMode(data.nodeDistributionMode || "");
      setCenter(data.center || { x: "", y: "", z: "" });
      setSink(data.sink || { x: "", y: "", z: "" });
      setSender(data.sender || { x: "", y: "", z: "" });
      setTargetPos(data.targetPos || { x: "", y: "", z: "" });
      setRadius(data.radius || "");
      setNodeCount(data.nodeCount || "");
      setDataRate(data.dataRate || "");
      setNodes(data.nodes || []);
      setRange(data.range || "");
    }
  }, []);
  // 每当表单数据变化时，将数据存入 sessionStorage
  useEffect(() => {
    const data = {
      macProtocol,
      routingProtocol,
      width,
      nodeDistributionMode,
      center,
      sink,
      sender,
      targetPos,
      radius,
      nodeCount,
      dataRate,
      nodes,
      range,
      energyMode,
      rxPower,
      txPower,
      idlePower,
      initialEnergy,
    };
    sessionStorage.setItem("parameterFormData", JSON.stringify(data));
  }, [
    macProtocol,
    routingProtocol,
    width,
    nodeDistributionMode,
    center,
    sink,
    sender,
    targetPos,
    radius,
    nodeCount,
    dataRate,
    nodes,
    range,
    energyMode,
    rxPower,
    txPower,
    idlePower,
    initialEnergy,
  ]);

  const clearData = () => {
    sessionStorage.removeItem("parameterFormData");
    // 重新设置所有状态
    setMacProtocol("");
    setRoutingProtocol("");
    setWidth("");
    setNodeDistributionMode("");
    setCenter({ x: "", y: "", z: "" });
    setSink({ x: "", y: "", z: "" });
    setSender({ x: "", y: "", z: "" });
    setTargetPos({ x: "", y: "", z: "" });
    setRadius("");
    setNodeCount("");
    setNodes([]);
    setDataRate("10000");
    setRange("");
    setErrors({});
    setEnergyMode("");
    setRxPower("");
    setTxPower("");
    setIdlePower("");
    setInitialEnergy("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // 协议校验
    if (!macProtocol) newErrors.macProtocol = "请选择MAC协议";
    if (!routingProtocol) newErrors.routingProtocol = "请选择路由协议";
    if (routingProtocol === "VBF") {
      if (!width) newErrors.width = "请输入虚拟管道宽度";
      if (!isCoordinateComplete(targetPos)) newErrors.targetPos = "请输入完整的目标位置坐标";
    }
    if (!nodeDistributionMode) newErrors.nodeDistributionMode = "请选择节点分布模式";

    if (nodeDistributionMode === "round") {
      if (!isCoordinateComplete(center)) newErrors.center = "请输入完整的圆心坐标";
      if (!radius) newErrors.radius = "请输入半径";
      if (!nodeCount) newErrors.nodeCount = "请输入节点数量";
    }
    if (energyMode === "AquaSimEnergyModel") {
      if (!rxPower) newErrors.rxPower = "请输入接收功率";
      if (!txPower) newErrors.txPower = "请输入发射功率";
      if (!idlePower) newErrors.idlePower = "请输入空闲功率";
      if (!initialEnergy) newErrors.initialEnergy = "请输入初始能量";
    }
    if (nodeDistributionMode === "DIY-upload" || nodeDistributionMode === "DIY-online") {
      if (nodes.length === 0) newErrors.nodes = "请上传节点文件或数据";
    }
    if (!isCoordinateComplete(sender)) newErrors.sender = "请输入完整的发送坐标";
    if (!isCoordinateComplete(sink)) newErrors.sink = "请输入完整的接收坐标";
    if (!dataRate) newErrors.dataRate = "请输入数据传输速率";
    if (!range) newErrors.range = "请输入通信范围";
    // 如果有错误则终止提交
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setGiveDataRate(dataRate);
    // 构建表单数据
    const formData = {
      macProtocol,
      routingProtocol,
      width: routingProtocol === "VBF" ? width : undefined,
      targetPos: routingProtocol === "VBF" ? targetPos : undefined,
      nodeDistributionMode,
      center: nodeDistributionMode === "round" ? center : undefined,
      radius: nodeDistributionMode === "round" ? radius : undefined,
      nodeCount: nodeDistributionMode === "round" ? nodeCount : undefined,
      nodes:
        nodeDistributionMode === "DIY-upload" || nodeDistributionMode === "DIY-online"
          ? nodes
          : undefined,
      sink,
      sender,
      dataRate,
      range,
      energyMode,
      rxPower: energyMode === "AquaSimEnergyModel" ? rxPower : undefined,
      txPower: energyMode === "AquaSimEnergyModel" ? txPower : undefined,
      idlePower: energyMode === "AquaSimEnergyModel" ? idlePower : undefined,
      initialEnergy: energyMode === "AquaSimEnergyModel" ? initialEnergy : undefined,
    };

    console.log("上传表单:", formData);
    try {
      const response = await fetch("/api/submitForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.log("表单上传响应:", response.status);
      if (!response.ok) {
        throw new Error("API 请求失败");
      }
      await response.json();
      alert("表单提交成功！");
    } catch (error) {
      console.error("API 错误:", error);
      alert("表单提交失败，请重试。");
    }
  };

  const handleUploadSuccess = (result) => {
    setNodes(result.data.nodes);
    console.log("节点数据上传成功:", result);
  };

  const handleUploadError = (error) => {
    console.error("节点上传错误:", error);
  };

  const renderNodeDistributionFields = () => {
    switch (nodeDistributionMode) {
      case "DIY-online":
        return (
          <>
            <NodeManager onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />
            {errors.nodes && <div className="error-message">{errors.nodes}</div>}
          </>
        );
      case "DIY-upload":
        return (
          <>
            <FileUpload
              fieldName="node"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
            {errors.nodes && <div className="error-message">{errors.nodes}</div>}
          </>
        );
      case "round":
        return (
          <>
            <div className="form-field">
              <CoordinateInput
                label="圆心坐标"
                coordinate={center}
                onChange={(field, value) => handleCoordinateChange("center", field, value)}
              />
              {errors.center && <div className="error-message">{errors.center}</div>}
            </div>
            <div className="form-field">
              <InputField
                label="半径"
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="请输入半径"
              />
              {errors.radius && <div className="error-message">{errors.radius}</div>}
            </div>
            <div className="form-field">
              <InputField
                label="节点数量"
                type="number"
                value={nodeCount}
                onChange={(e) => setNodeCount(e.target.value)}
                placeholder="请输入节点数量"
              />
              {errors.nodeCount && <div className="error-message">{errors.nodeCount}</div>}
            </div>
          </>
        );
      default:
        return null;
    }
  };
  const renderEnergyFields = () => {
    switch (energyMode) {
      case "AquaSimEnergyModel":
        return (
          <>
            <div className="form-field">
              <InputField
                label="接收功率"
                type="number"
                value={rxPower}
                onChange={(e) => setRxPower(e.target.value)}
              />
              {errors.rxPower && <div className="error-message">{errors.rxPower}</div>}
            </div>
            <div className="form-field">
              <InputField
                label="发射功率"
                type="number"
                value={txPower}
                onChange={(e) => setTxPower(e.target.value)}
              />
              {errors.txPower && <div className="error-message">{errors.txPower}</div>}
            </div>
            <div className="form-field">
              <InputField
                label="空闲功率"
                type="number"
                value={idlePower}
                onChange={(e) => setIdlePower(e.target.value)}
              />
              {errors.idlePower && <div className="error-message">{errors.idlePower}</div>}
            </div>
            <div className="form-field">
              <InputField
                label="初始能量"
                type="number"
                value={initialEnergy}
                onChange={(e) => setInitialEnergy(e.target.value)}
              />
              {errors.initialEnergy && <div className="error-message">{errors.initialEnergy}</div>}
            </div>
          </>
        );
    }
  };

  return (
    <div className="parameter-container">
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <SelectField
            label="MAC协议"
            value={macProtocol}
            onChange={(e) => setMacProtocol(e.target.value)}
            options={MACPROTOCOL_OPTIONS}
          />
          {errors.macProtocol && <div className="error-message">{errors.macProtocol}</div>}
        </div>

        <div className="form-field">
          <SelectField
            label="路由协议"
            value={routingProtocol}
            onChange={(e) => setRoutingProtocol(e.target.value)}
            options={ROUTINGPROTOCOL_OPTIONS}
          />
          {errors.routingProtocol && <div className="error-message">{errors.routingProtocol}</div>}
        </div>

        {routingProtocol === "VBF" && (
          <>
            <div className="form-field">
              <InputField
                label="虚拟管道宽度"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
              {errors.width && <div className="error-message">{errors.width}</div>}
            </div>
            <div className="form-field">
              <CoordinateInput
                label="目标位置"
                coordinate={targetPos}
                onChange={(field, value) => handleCoordinateChange("targetPos", field, value)}
              />
              {errors.targetPos && <div className="error-message">{errors.targetPos}</div>}
            </div>
          </>
        )}

        <div className="form-field">
          <SelectField
            label="节点分布模式"
            value={nodeDistributionMode}
            onChange={(e) => setNodeDistributionMode(e.target.value)}
            options={NODE_DISTRIBUTION_OPTIONS}
          />
          {errors.nodeDistributionMode && (
            <div className="error-message">{errors.nodeDistributionMode}</div>
          )}
        </div>

        {renderNodeDistributionFields()}
        <div className="form-field">
          <SelectField
            label="能量模型"
            value={energyMode}
            onChange={(e) => setEnergyMode(e.target.value)}
            options={ENERGYMODE_OPTIONS}
          />
          {errors.energyMode && <div className="error-message">{errors.energyMode}</div>}
        </div>

        {renderEnergyFields()}

        <div className="form-field">
          <CoordinateInput
            label="接收坐标"
            coordinate={sink}
            onChange={(field, value) => handleCoordinateChange("sink", field, value)}
          />
          {errors.sink && <div className="error-message">{errors.sink}</div>}
        </div>

        <div className="form-field">
          <CoordinateInput
            label="发送坐标"
            coordinate={sender}
            onChange={(field, value) => handleCoordinateChange("sender", field, value)}
          />
          {errors.sender && <div className="error-message">{errors.sender}</div>}
        </div>

        <div className="form-field">
          <InputField
            label="节点传输范围"
            type="number"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
          {errors.range && <div className="error-message">{errors.range}</div>}
        </div>
        <>
          <button className="submit-button" type="submit">
            运行仿真
          </button>
          <button className="submit-button" type="button" onClick={() => clearData()}>
            清空数据
          </button>
        </>
      </form>
    </div>
  );
};

export default Parameter;
