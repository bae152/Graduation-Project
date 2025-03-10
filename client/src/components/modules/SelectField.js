import React from "react";
import "./SelectField.css"; // 引入对应CSS文件

const SelectField = ({ label, value, onChange, options, required = false }) => {
  return (
    <div className="select-field">
      <label className="select-field-label">{label}：</label>
      <select className="select-field-select" value={value} onChange={onChange} required={required}>
        <option key={label} value="" disabled>
          请选择
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;
