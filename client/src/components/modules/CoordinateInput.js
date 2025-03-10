import React from "react";
import "./CoordinateInput.css"; // 引入CSS
import InputField from "../modules/InputField.js";

const CoordinateInput = ({ label, coordinate, onChange }) => {
  return (
    <div className="form-field">
      {/* 第一行：标题 */}
      <div>{label}</div>

      {/* 第二行：并排的 X, Y, Z 输入区域 */}
      <div className="coordinate-fields">
        <InputField
          label="X"
          value={coordinate.x}
          onChange={(e) => onChange("x", e.target.value)}
        />
        <InputField
          label="Y"
          value={coordinate.y}
          onChange={(e) => onChange("y", e.target.value)}
        />
        <InputField
          label="Z"
          value={coordinate.z}
          onChange={(e) => onChange("z", e.target.value)}
        />
      </div>
    </div>
  );
};

export default CoordinateInput;
