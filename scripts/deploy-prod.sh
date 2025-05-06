#!/bin/bash

# 取得腳本所在目錄的絕對路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 顯示目錄資訊
echo "腳本目錄: ${SCRIPT_DIR}"

# 執行部署腳本
sh "${SCRIPT_DIR}/deploy.sh" prod main 172.233.81.160 /root/api /root/docker-compose.yaml