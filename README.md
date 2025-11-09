## Nebula Sanctuary 开发说明

本项目在 Zama FHEVM 模板基础上进行了深度二次创作，构建了外观焕然一新的「Nebula Sanctuary」宠物关爱 DApp，包含合约（`contracts/animalcare-hardhat`）与前端（`frontend`）两部分。

### 目录结构

```
action/
├── contracts/animalcare-hardhat   # Hardhat + FHEVM 合约工程
│   ├── contracts/NebulaCareRegistry.sol
│   ├── deploy/00_deploy_nebula.ts
│   ├── test/NebulaCareRegistry.ts
│   └── ...
└── frontend                       # Next.js + React 19 前端
    ├── app/page.tsx
    ├── components/*               # UI 组件
    ├── hooks/useNebulaSanctuary.tsx # 合约 & FHE 交互逻辑
    ├── fhevm/*                    # FHEVM 实例管理（Mock/Relayer 双模式）
    └── scripts/genabi.mjs         # ABI 同步脚本
```

### 本地 Hardhat FHE 节点流程（MockFhevmInstance）

1. 安装依赖
   ```bash
   cd contracts/animalcare-hardhat
   npm install
   ```
2. 启动本地 FHE Hardhat 节点（建议单独终端）
   ```bash
   npx hardhat node
   ```
3. 另一个终端部署合约并生成 ABI
   ```bash
   npm run deploy:localhost
   cd ../../frontend
   npm install
   npm run generate:abi
   ```
4. 启动前端
   ```bash
   npm run dev
   ```
5. 打开浏览器连接 MetaMask，切换到本地 `http://localhost:8545`。  
   前端会自动检测 Hardhat 节点并通过 `@fhevm/mock-utils` 创建 MockFhevmInstance，用于本地加密/解密。

### 部署到 Sepolia 测试网（Relayer SDK 模式）

1. 在合约项目配置 Hardhat 变量（`npx hardhat vars set ...`），确保 `MNEMONIC`、`INFURA_API_KEY`、`ETHERSCAN_API_KEY` 等可用。
2. 部署合约到 Sepolia：
   ```bash
   cd contracts/animalcare-hardhat
   npm run deploy:sepolia
   ```
3. 返回前端目录，重新生成 ABI：
   ```bash
   cd ../../frontend
   npm run generate:abi
   ```
4. 前端连接到 Sepolia 网络时将自动从 CDN 加载 `@zama-fhe/relayer-sdk`，并通过 Relayer + Gateway 完成加密/解密。

### 前端功能要点

- **钱包与模式切换**：检测当前网络的部署地址。若为本地 31337，即启用 MockFhevm；接入 Sepolia 时启用 Relayer SDK。
- **宠物档案管理**：在链上创建 / 更新档案，记录隐私级别与多主人。
- **日常日志**：支持文字 + 媒体 CID，同时可选加密数值指标（如体重）。加密数据在链上聚合，允许授权者解密。
- **FHE 解密缓存**：通过 `FhevmDecryptionSignature` 结合本地 `GenericStringStorage` 缓存 EIP-712 签名，减少重复签名弹窗。
- **UI 风格**：Tailwind 配色（暖橙 + 薄荷绿 + 奶油白），卡片玻璃态设计，时间轴动画展示日志。

### 测试

```bash
cd contracts/animalcare-hardhat
npm test
```

测试用例基于 Hardhat FHE Mock 环境，验证加密日志写入与解密流程、Vet 白名单验证等。

### 注意事项

- 前端默认携带空的 ABI/地址文件，需通过 `npm run generate:abi` 覆盖。
- Mock 模式依赖 Hardhat 节点暴露 `fhevm_relayer_metadata` RPC（由 `@fhevm/hardhat-plugin` 提供）。
- 如需多共管人/授权查看者，可在合约中调用 `grantViewer`，前端后续将补充 UI。
- 若要完善 NFT/SBT 证书，可在合约中扩展 `mintCertificatePlaceholder` 部分。

愿你在 Nebula Sanctuary 中守护每一位星际伴生者的故事！✨

