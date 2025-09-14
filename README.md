# 專案開發文件

## 專案概述
基於 NestJS 框架的新專案模板，包含多個應用程式和共享函式庫。

## 專案結構

### 應用程式 (apps)

#### new-project-template
主要應用程式，包含以下模組：

- **users 模組**
  - 功能：使用者管理，包括查詢、建立使用者等
  - 主要元件：
    - `users.controller.ts`: 處理使用者相關的 HTTP 請求
    - `users.service.ts`: 實現使用者業務邏輯
    - `users.repository.ts`: 處理使用者資料儲存和檢索
    - `entity/user.model.ts`: 使用者資料模型
    - `dto/user.dto.ts`: 資料傳輸物件

- **mq-consumer 模組**
  - 功能：訊息佇列消費者
  - 主要元件：
    - `mq-consumer.service.ts`: 處理訊息佇列相關業務邏輯

- **upload 模組**
  - 功能：檔案上傳管理
  - 主要元件：
    - `upload.service.ts`: 處理檔案上傳業務邏輯
    - `upload.repository.ts`: 管理上傳檔案的資料儲存
    - `entity/upload-files.model.ts`: 上傳檔案資料模型

### 共享函式庫 (libs)

#### payment
支付相關功能函式庫，支援多種支付方式：

- **設定檔 (`payment.config.ts`)**
  - 支援的支付方式：
    - NewebPay: 台灣支付服務
    - Aftee: 分期付款服務
    - EzPay: 電子支付服務
  - 環境變數設定：
    - 各支付平台的 API 金鑰
    - 回呼 URL 設定
    - 商戶 ID 等

#### auth
認證相關功能函式庫：
- **認證服務 (`auth.service.ts`)**
  - 支援本地登入認證
  - JWT 權杖產生與驗證
- **Line 認證服務 (`line.service.ts`)**
  - 支援 Line OAuth2 認證
  - 處理 Line 登入回呼

#### 其他共享函式庫
- **mail**: 郵件發送功能
- **redis**: Redis 快取服務
- **sms**: 簡訊發送服務
- **mq**: 訊息佇列服務
- **common**: 通用工具和例外處理
- **s3**: S3 儲存服務，用於檔案上傳

## 資料庫
專案使用 Sequelize ORM 與資料庫互動，主要模型包括：
- `UserModel`: 使用者資料模型
- `UploadFilesModel`: 上傳檔案資料模型

## 開發指南

### 環境設定
1. 確保已安裝 Node.js 和 pnpm
   ```bash
   npm install -g pnpm
   ```
2. 安裝相依套件：
   ```bash
   pnpm install
   ```
3. 設定環境變數（參考 `.env.example`）

### 啟動應用
1. 開發模式啟動：
   ```bash
   pnpm run start:dev
   ```
2. 生產模式啟動：
   ```bash
   pnpm run build
   pnpm run start:prod
   ```

### API 文件
- 啟動應用後，可透過 Swagger UI 存取 API 文件：`http://localhost:3000/api`

### 測試
1. 執行單元測試：
   ```bash
   pnpm run test
   ```
2. 執行端對端測試：
   ```bash
   pnpm run test:e2e
   ```

## 功能特點

### 使用者管理
- 使用者註冊與登入
- 手機和電子郵件驗證碼功能
- 使用者資料快取（Redis）
- Line 社群登入整合

### 檔案上傳
- 支援圖片和影片上傳
- 使用 AWS S3 儲存檔案
- 檔案類型驗證

### 支付整合
- 多種支付方式整合
- 支付回呼處理
- 交易紀錄管理

## 部署指南

### Docker 部署
1. 建構 Docker 映像檔：
   ```bash
   docker build -t new-project-template .
   ```
2. 執行容器：
   ```bash
   docker run -p 3000:3000 new-project-template
   ```

### 環境變數設定
部署前需設定以下關鍵環境變數：
- 資料庫連線資訊
- Redis 連線資訊
- AWS S3 設定
- 各支付平台設定
- Line OAuth2 設定

## 維護與故障排除

### 日誌管理
- 使用 Pino 日誌記錄器
- 日誌等級可透過環境變數設定

### 常見問題解決
- 資料庫連線問題：檢查連線字串和資料庫狀態
- Redis 快取問題：確保 Redis 服務正常運作
- 檔案上傳失敗：檢查 S3 設定和權限設定