import React from "react";
import "./InputField.css"; // 引入对应的CSS

const InputField = ({ label, type, value, onChange, placeholder, required = false }) => {
  return (
    <div className="input-field">
      <label>{label}：</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};

export default InputField;
