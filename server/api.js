/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");
const multer = require("multer");
const { exec } = require("child_process"); // 用于执行 shell 命令
const fs = require("fs"); // 用于文件操作
const path = require("path"); // 用于处理文件路径
const upload = multer({ dest: "uploads/" });
// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|
// 解析PCAP文件的函数
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

router.post("/parameter", async (req, res) => {
  const { nodeCount } = req.body;
  // 参数验证
  if (!nodeCount || nodeCount < 1 || nodeCount > 1000) {
    return res.status(400).json({ error: "节点数必须在1-1000之间" });
  }
  // 定义容器和文件路径
  const containerId = "4f3f2549c0e564c9b4a83f1a6631f9aa0135098432119ffb1a80ebcffeea0070"; // 设置您的容器 ID
  const containerPath = `/workspace/workspace/ns-allinone-3.40/ns-3.40/output/second-${nodeCount}-0.pcap`;
  const localPath = `/mnt/c/Users/Frank\ Leon/Desktop/outpt/second-${nodeCount}-0.pcap`;

  // 执行仿真命令，在特定目录中运行
  exec(
    `wsl docker exec -w /workspace/workspace/ns-allinone-3.40/ns-3.40 ${containerId} ./ns3 run "mysecond.cc --nCsma=${nodeCount}"`,
    (err, stdout, stderr) => {
      if (err) {
        console.error("仿真执行错误:", stderr);
        return res.status(500).json({ error: "仿真执行失败" });
      }

      // 使用 docker cp 将文件复制到宿主机
      exec(
        `wsl docker cp "${containerId}:${containerPath}" "${localPath}"`,
        (err, stdout, stderr) => {
          if (err) {
            console.error("docker cp 错误:", stderr);
            return res.status(500).json({ error: "文件复制失败" });
          }

          // 返回生成的 Pcap 文件下载链接
          const downloadUrl = `http://localhost:3000/downloads/second-${nodeCount}-0.pcap`;
          console.log("文件下载链接:", downloadUrl);
          res.json({ downloadUrl: downloadUrl });
        }
      );
    }
  );
});

// 日志解析函数
const parseLogFile = (fileBuffer) => {
  const logContent = fileBuffer.toString();
  const timeline = [];

  // 正则表达式优化版
  const logRegex =
    /^([tr])\s+([\d.]+).*?SenderAddr=(\d+).*?DestAddr=(\d+).*?OriginalSource=([\d,]+)/gm;

  let match;
  while ((match = logRegex.exec(logContent)) !== null) {
    const [_, eventType, timestampStr, sender, receiver, coordsStr] = match;

    timeline.push({
      type: eventType === "t" ? "transmit" : "receive",
      timestamp: parseFloat(timestampStr),
      senderId: sender.padStart(4, "0"), // 补齐节点ID为4位
      receiverId: receiver.padStart(4, "0"),
      coords: coordsStr.split(",").map(Number),
    });
  }

  return timeline.sort((a, b) => a.timestamp - b.timestamp);
};

// 日志上传接口
router.post("/logUpload", multer().single("txt"), async (req, res) => {
  try {
    // 验证文件存在
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "未收到日志文件",
      });
    }

    // 解析日志
    const timeline = parseLogFile(req.file.buffer);

    // 验证解析结果
    if (timeline.length === 0) {
      return res.status(422).json({
        success: false,
        error: "未发现有效日志数据",
      });
    }

    res.json({
      success: true,
      timeline,
      stats: {
        startTime: timeline[0].timestamp,
        endTime: timeline[timeline.length - 1].timestamp,
        totalEvents: timeline.length,
      },
    });
  } catch (error) {
    console.error("日志解析失败:", error);
    res.status(500).json({
      success: false,
      error: `日志解析失败: ${error.message}`,
    });
  }
});

// 文件上传路由
router.post("/upload", upload.single("pcap"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const packets = await parsePcapWithTshark(filePath);

    // 删除上传的文件
    fs.unlinkSync(filePath);

    res.json({ success: true, packets });
  } catch (error) {
    res.status(500).json({ error: "解析失败，请检查文件格式" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
