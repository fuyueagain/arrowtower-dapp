// ArrowTowerFactoryModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ArrowTowerFactoryModule = buildModule("ArrowTowerFactoryModule", (m) => {
  // 参数 - 直接使用 bytes32 格式
  const deployInitialProject = m.getParameter("deployInitialProject", true);
  
  // 使用预编码的 bytes32 值作为默认值
  // "demo-project" 编码为 bytes32: 0x64656d6f2d70726f6a656374000000000000000000000000000000000000000000
  const projectIdBytes32 = m.getParameter(
    "projectIdBytes32", 
    "0x64656d6f2d70726f6a656374000000000000000000000000000000000000000000"
  );
  
  const nftName = m.getParameter("nftName", "ArrowTowerNFT");
  const nftSymbol = m.getParameter("nftSymbol", "ATN");
  const baseURI = m.getParameter("baseURI", "https://example.com/metadata/");

  // 1) 部署工厂合约
  const factory = m.contract("ArrowTowerFactory");

  // 2) 如果需要，创建初始项目
  if (deployInitialProject) {
    m.call(factory, "createProject", [
      projectIdBytes32,
      nftName,
      nftSymbol,
      baseURI,
    ], {
      // 添加事件监听器来捕获错误
      after: [factory],
      id: "createProjectCall"
    });
  }

  return {
    factory,
  };
});

export default ArrowTowerFactoryModule;