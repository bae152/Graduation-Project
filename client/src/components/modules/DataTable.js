import React from "react";
import "./DataTable.css";

const DataTable = ({ packets }) => {
  return (
    <table className="packet-table">
      <thead>
        <tr>
          <th>#</th>
          <th>时间</th>
          <th>源地址</th>
          <th>目的地址</th>
          <th>协议栈</th>
          <th>长度</th>
          <th>信息</th>
        </tr>
      </thead>
      <tbody>
        {packets.map((packet, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{new Date(packet.frame.timestamp).toLocaleTimeString()}</td>
            <td>{packet.ethernet?.src || "N/A"}</td>
            <td>{packet.ethernet?.dst || "N/A"}</td>
            <td className="protocol-chain">
              {packet.protocolChain.split(" > ").map((proto, i) => (
                <span key={i} className={`proto ${proto.toLowerCase()} `}>
                  {proto}
                  {i < packet.protocolChain.split(" > ").length - 1 && " → "}
                </span>
              ))}
            </td>
            <td>{packet.frame.length} bytes</td>
            <td>{packet.info || "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
