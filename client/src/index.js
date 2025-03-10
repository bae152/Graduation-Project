import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./components/App.js";

// 初始化根节点（单次调用）
const container = document.getElementById("root");
const root = createRoot(container);

// 渲染函数
function renderApp() {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

// 首次渲染
renderApp();

// 热更新配置（仅开发环境生效）
if (module.hot) {
  module.hot.accept("./components/App.js", () => {
    // 重要：复用已存在的 root 实例
    console.log("[HMR] Reloading App component...");
    renderApp();
  });
}
