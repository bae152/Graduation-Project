/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

const { exec } = require("child_process"); // 用于执行 shell 命令
const fs = require("fs"); // 用于文件操作
const path = require("path"); // 用于处理文件路径

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
router.post("/parameter", (req, res) => {
  const { nodeCount } = req.body;

  // 校验节点数
  if (!nodeCount || isNaN(nodeCount) || nodeCount <= 0) {
    return res.status(400).json({ error: "无效的节点数" });
  }

  // 假设执行 ns-3 脚本来生成 pcap 文件
  const ns3Command = ` docker exec 5e9 bash -c "cd /workspace/workspace/ns-allinone-3.40/ns-3.40 && ./ns3 run 'scratch/mysecond.cc --nCsma=${nodeCount}'"`;
  // 执行仿真脚本
  exec(ns3Command, (err, stdout, stderr) => {
    if (err) {
      console.error("仿真失败", stderr);
      return res.status(500).json({ error: "仿真启动失败" });
    }
    // 假设生成的 pcap 文件路径
    //const pcapFilePath = path.join(VOLUME_PATH, `second-${nodeCount}-0.pcap`);
    const testFilePath = path.join(
      "C:",
      "Users",
      "Frank Leon",
      "Desktop",
      "mybroadcastMAC_example.xml"
    );
    // 如果 pcap 文件生成成功
    if (fs.existsSync(pcapFilePath)) {
      console.log("测试文件存在，路径:", testFilePath); // 添加日志确认路径
      res.json({ url: `/downloads/${path.basename(pcapFilePath)}` }); // 返回文件的下载路径
    } else {
      console.error("测试文件不存在，路径:", testFilePath);
      res.status(500).json({ error: "生成 pcap 文件失败" });
    }
  });
});

router.get("/downloads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(VOLUME_PATH, filename);
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "文件不存在" });
  }

  // 设置响应头，触发浏览器下载
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("文件下载失败", err);
      res.status(500).json({ error: "文件下载失败" });
    }
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
