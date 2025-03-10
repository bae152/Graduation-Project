const fs = require("fs"); // 用于文件操作
const path = require("path"); // 用于处理文件路径
const { exec } = require("child_process");
const { log } = require("console");
const parsePcapWithTshark = (filePath) => {
  return new Promise((resolve, reject) => {
    // tshark 命令来解析 pcap 文件
    const tsharkCommand = `tshark -r "${filePath}" -T json -E header=y -e frame.time_relative -e ip.src -e ip.dst -e eth.src -e eth.dst -e frame.len -e frame.protocols`;

    exec(tsharkCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`TShark 执行错误: ${error}`);
        return reject(`解析失败: ${stderr}`);
      }

      try {
        console.log("JSON 数据:", stdout);
        const jsonData = JSON.parse(stdout);
        console.log("JSON 数据:", jsonData);
        const packets = jsonData.map((record) => ({
          time: record._source.layers["frame.time_relative"][0], // 注意路径和数组取值
          len: record._source.layers["frame.len"][0],
          ip_src: record._source.layers["ip.src"][0],
          ip_dst: record._source.layers["ip.dst"][0],
          protocols: record._source.layers["frame.protocols"][0],
        }));

        resolve(packets);
      } catch (e) {
        console.error("JSON 解析错误:", e);
        reject(new Error("数据格式异常"));
      }
    });
  });
};

const parseNode = (filePath) => {
  return new Promise((resolve, reject) => {
    // 读取文件内容
    fs.readFile(filePath, "utf-8", (err, content) => {
      if (err) {
        reject(new Error("文件读取失败"));
        return;
      }

      try {
        const parsedNodes = [];
        const parsedSinks = [];
        const parsedSenders = [];

        // 按行解析文件内容
        content.split("\n").forEach((line, index) => {
          const trimmedLine = line.trim();
          // 跳过空行
          if (trimmedLine === "") {
            console.log(`第 ${index + 1} 行为空，已跳过`);
            return;
          }
          // 使用正则表达式匹配节点信息
          const match = trimmedLine.match(
            /(Node|Sink|Sender)\s+(\d+):\s*\(([\d-.]+),\s*([\d-.]+),\s*([\d-.]+)\)/
          );
          if (!match) {
            throw new Error(`第 ${index + 1} 行格式错误`);
          }

          // 解构匹配结果,match[0]为line，放在不管
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

        // 返回解析结果
        resolve({
          nodes: parsedNodes,
          sinks: parsedSinks,
          senders: parsedSenders,
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

const parseLogFile = (filePath) => {
  return new Promise((resolve, reject) => {
    console.log("解析文件：", filePath);
    // 读取文件内容
    fs.readFile(filePath, "utf-8", (err, content) => {
      if (err) {
        reject(new Error("文件读取失败"));
        return;
      }
      try {
        const parsedLogs = [];
        let range = null;
        let isFirstRange = true;
        const packets = content.split("(size=40)").filter((p) => p.trim().length > 0);
        // 按行解析文件内容
        packets.forEach((packet, index) => {
          const trimmedPacket = packet.trim();
          // 跳过接收数据包（以 r 开头）
          if (!trimmedPacket.startsWith("t")) return;

          // 使用正则表达式匹配关键信息
          const txRegex = /^t\s+([\d.]+)\s+\/NodeList\/(\d+).*?TxRange\((\d+)\)/;
          const match = trimmedPacket.match(txRegex);
          if (!match) {
            throw new Error(`第 ${index + 1} 行格式错误`);
          }
          const [, time, nodeId, rangeId] = match;
          if (isFirstRange) {
            range = parseInt(match[3]);
            isFirstRange = false;
          }
          parsedLogs.push({
            time: parseFloat(match[1]), // 时间戳转换为浮点数
            nodeId: parseInt(match[2]), // 节点ID转换为整数
          });
        });
        resolve({
          range: range,
          log: parsedLogs,
        });
      } catch (parseError) {
        reject(new Error("日志解析失败：" + parseError.message));
      }
    });
  });
};
// 辅助函数：解析形如 "Key(value)" 的键值对
const parseKeyValuePairs = (text) => {
  const kv = {};
  // 去除首尾括号及多余空白
  text = text.trim();
  if (text.startsWith("(") && text.endsWith(")")) {
    text = text.slice(1, -1);
  }
  // 匹配 Key(value) 形式的项
  const regex1 = /(\w+)\(([^\)]+)\)/g;
  let match;
  while ((match = regex1.exec(text)) !== null) {
    kv[match[1]] = match[2];
  }
  // 同时也匹配 Key=value 形式（例如：TxTime=+9.92e+07ns）的项
  const regex2 = /(\w+)=([^\s]+)/g;
  while ((match = regex2.exec(text)) !== null) {
    kv[match[1]] = match[2];
  }
  return kv;
};

const parsePacketsByNode = (filePath, nodeId) => {
  return new Promise((resolve, reject) => {
    // 读取文件内容
    console.log("解析文件：", filePath);
    fs.readFile(filePath, "utf-8", (err, content) => {
      if (err) {
        reject(new Error("文件读取失败"));
        return;
      }
      try {
        const packetsData = [];
        const packets = content.split(/\n(?=[tr] \d+\.\d+)/g);
        let headerRegex = "";
        packets.forEach((packet, index) => {
          if (packet.startsWith("t")) {
            headerRegex =
              /^([tr]) ([\d.]+)\s+(\S+)\s+ns3::AquaSimPacketStamp([\s\S]+?)ns3::AquaSimHeader([\s\S]+?)ns3::MacHeader([\s\S]+?)ns3::VBHeader([\s\S]+?)Payload\s+(.+)$/s;
          } else {
            headerRegex =
              /^([tr]) ([\d.]+)\s+(\S+)\s+ns3::AquaSimHeader([\s\S]+?)ns3::MacHeader([\s\S]+?)ns3::VBHeader([\s\S]+?)Payload\s+(.+)$/s;
          }
          const match = packet.match(headerRegex);

          if (!match) {
            throw new Error(`第 ${index + 1} 个包格式错误`);
          }

          const event = {};
          event.type = match[1]; // t or r
          event.timestamp = parseFloat(match[2]);
          event.devicePath = match[3].trim();
          if (event.type === "t") {
            event.packetStampRaw = match[4].trim();
            event.aquaHeaderRaw = match[5].trim();
            event.macHeaderRaw = match[6].trim();
            event.vbHeaderRaw = match[7].trim();
            event.payloadRaw = match[8].trim();
          } else {
            event.aquaHeaderRaw = match[4].trim();
            event.macHeaderRaw = match[5].trim();
            event.vbHeaderRaw = match[6].trim();
            event.payloadRaw = match[7].trim();
          }

          // 尝试解析各部分中的键值对数据
          if (event.type === "t") {
            event.packetStamp = parseKeyValuePairs(event.packetStampRaw);
          }
          event.aquaHeader = parseKeyValuePairs(event.aquaHeaderRaw);
          event.macHeader = parseKeyValuePairs(event.macHeaderRaw);
          event.vbHeader = parseKeyValuePairs(event.vbHeaderRaw);
          event.payload = parseKeyValuePairs(event.payloadRaw);

          // 如果提供了 nodeId 过滤条件，则只保留 devicePath 中包含 "/NodeList/<nodeId>/" 的记录
          if (nodeId) {
            const nodePattern = new RegExp(`/NodeList/${nodeId}/`);
            if (!nodePattern.test(event.devicePath)) {
              return;
            }
          }
          packetsData.push(event);
        });
        resolve(packetsData);
      } catch (error) {
        reject(new Error("日志解析失败：" + error.message));
      }
    });
  });
};

module.exports = {
  parsePcapWithTshark,
  parseNode,
  parseLogFile,
  parsePacketsByNode,
};
