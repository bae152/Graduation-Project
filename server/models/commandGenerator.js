const commandGenerator = (formData) => {
  const containerId = process.env.containerId;
  let command = `wsl docker exec -w /workspace/workspace/ns-allinone-3.40/ns-3.40 ${containerId} ./ns3 run `;
  // `wsl docker exec -w /workspace/workspace/ns-allinone-3.40/ns-3.40 ${containerId} ./ns3 run "mysecond.cc --nCsma=${nodeCount}"`;
  command += `"UnifiedVBF.cc `;
  if (formData.routingProtocol === "VBF") {
    command += ` --routing=VBF `;
    command += `--width=${formData.width} --targetPos=${formData.targetPos.x},${formData.targetPos.y},${formData.targetPos.z} `;
  }

  if (formData.macProtocol === "Broadcast") {
    command += `--mac=Broadcast `;
  }

  if (formData.energyMode === "AquaSimEnergyModel") {
    command += `--energyModel=AquaSimEnergyModel `;
    command += `--txPower=${formData.txPower} `;
    command += `--rxPower=${formData.rxPower} `;
    command += `--idlePower=${formData.idlePower} `;
    command += `--initialEnergy=${formData.initialEnergy} `;
  }
  if (
    formData.nodeDistributionMode == "DIY-upload" ||
    formData.nodeDistributionMode == "DIY-online"
  ) {
    const nodestr = formData.nodes.map((node) => `${node.x},${node.y},${node.z}`).join(";");

    command += `--nodesPosition=${nodestr} `;
  } else if (formData.nodeDistributionMode == "round") {
    command += `--center=${formData.center.x},${formData.center.y},${formData.center.z} `;
    command += `--radius=${formData.radius} `;
    command += `--nodes=${formData.nodeCount} `;
  }

  command += `--sinksPosition=${formData.sink.x},${formData.sink.y},${formData.sink.z} `;
  command += `--sendersPosition=${formData.sender.x},${formData.sender.y},${formData.sender.z} `;
  command += `--range=${formData.range} `;
  command += `--dataRate=${formData.dataRate} `;
  command += `"`;
  return command;
};

module.exports = {
  commandGenerator,
};
