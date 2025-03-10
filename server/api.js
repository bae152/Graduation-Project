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

const {
  parsePcapWithTshark,
  parseNode,
  parseLogFile,
  parsePacketsByNode,
} = require("./models/parve");
const { commandGenerator } = require("./models/commandGenerator");
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

router.post("/parameter", async (req, res) => {
  const { nodeCount } = req.body;
  // 参数验证
  if (!nodeCount || nodeCount < 1 || nodeCount > 1000) {
    return res.status(400).json({ error: "节点数必须在1-1000之间" });
  }
  // 定义容器和文件路径
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

router.post(
  "/upload",
  upload.fields([
    { name: "pcap", maxCount: 1 },
    { name: "node", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { pcap, node } = req.files;
      if (pcap) {
        const packets = await parsePcapWithTshark(pcap[0].path);
        fs.unlinkSync(pcap[0].path);
        return res.json({ success: true, type: "pcap", data: packets });
      }
      if (node) {
        const nodeData = await parseNode(node[0].path);
        fs.unlinkSync(node[0].path);
        return res.json({ success: true, type: "node", data: nodeData });
      }
    } catch (error) {
      console.error("文件上传失败:", error);
      res.status(500).json({ error: error.message || "文件处理失败" });
    }
  }
);

router.get("/parseAll", async (req, res) => {
  try {
    // 从路径参数获取节点ID
    const logFilePath = path.join(process.env.WINDOWS_OUTPUT_PATH, "log.txt");
    const nodeFilePath = path.join(process.env.WINDOWS_OUTPUT_PATH, "nodes.txt");
    const logData = await parseLogFile(logFilePath);
    const nodeData = await parseNode(nodeFilePath);
    return res.json({ success: true, type: "data", nodeData: nodeData, logData: logData });
  } catch (error) {
    console.error("Error parsing All:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/submitForm", (req, res) => {
  const formData = req.body;
  console.log("接收到的表单数据:", formData);
  const conmand = commandGenerator(formData);
  console.log("生成的命令:", conmand);
  // 执行命令
  exec(conmand, (error, stdout, stderr) => {
    if (error) {
      console.error("命令执行失败:", error.message);
      return res.status(500).json({
        success: false,
        message: "命令执行失败",
        error: error.message,
        stderr: stderr,
      });
    }

    // 命令执行成功
    console.log("命令输出:", stdout);
    res.json({
      success: true,
      message: "命令执行成功",
      output: stdout,
    });
  });
});
router.get("/nodes/:nodeId/packets", async (req, res) => {
  const filePath = path.join("C:/Users/Frank Leon/Desktop/outpt/log.txt");
  try {
    // 从路径参数获取节点ID
    const nodeId = req.params.nodeId;
    const packets = await parsePacketsByNode(filePath, nodeId);
    res.json({ packets });
  } catch (error) {
    console.error("Error parsing packets:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
