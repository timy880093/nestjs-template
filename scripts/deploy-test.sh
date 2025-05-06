#!/bin/bash

# 取得腳本所在目錄的絕對路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 顯示目錄資訊
echo "腳本目錄: ${SCRIPT_DIR}"

# 執行部署腳本
## 如需部署不同 branch，請修改參數：dev 為想要部署的 branch
sh "${SCRIPT_DIR}/deploy.sh" test dev 172.104.112.239 /root/ticket-appeal-api-new /root/ticket-appeal-api-new/docker-compose.yaml
