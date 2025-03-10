import React, { useState } from "react";

const FileUpload = ({ fieldName, onUploadSuccess, onUploadError }) => {
  const [selectedFile, setSelectedFile] = useState(null); // 存储选中的文件

  // 处理文件选择
  const handleFileChange = (event) => {
    const file = event.target.files[0]; // 获取选中的文件
    if (file) {
      setSelectedFile(file); // 更新选中的文件
    }
  };

  // 处理文件上传
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("请先选择文件！");
      return;
    }
    if (!fieldName) {
      console.error("fieldName 未定义");
      return;
    }
    try {
      const formData = new FormData(); // 创建 FormData 对象
      formData.append(fieldName, selectedFile); // 动态设置字段名
      console.log("上传文件:", selectedFile);
      // 发送上传请求
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      console.log("文件上传响应:", response);

      if (!response.ok) {
        throw new Error("上传失败！");
      }
      const result = await response.json(); // 解析响应数据
      console.log("文件上传结果:", result);
      setSelectedFile(null); // 清空选中的文件
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      console.error("处理失败:", error);
      if (onUploadError) {
        onUploadError(error);
      } else {
        alert("上传失败！");
      }
    }
  };

  return (
    <div>
      {/* 文件选择输入框 */}
      <input type="file" onChange={handleFileChange} />

      {/* 上传按钮 */}
      <button className="submit-button" type="button" onClick={handleUpload}>
        上传文件
      </button>
    </div>
  );
};

export default FileUpload;
