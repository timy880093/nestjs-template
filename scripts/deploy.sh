#!/usr/bin/env bash
# filepath: deploy.sh

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 環境變數
REMOTE_USER="root"
TIMEOUT=5

# 錯誤處理
set -e

# 檢查 SSH 連線
check_ssh_connection() {
    local host="$1"
    echo -e "${YELLOW}檢查 SSH 連線到 ${host}...${NC}"

    if ! ssh -q -o BatchMode=yes -o ConnectTimeout="${TIMEOUT}" "${REMOTE_USER}@${host}" "exit" 2>/dev/null; then
        echo -e "${RED}錯誤: 無法連線到 ${host}${NC}"
        echo -e "${YELLOW}請檢查：${NC}"
        echo "1. 伺服器是否在線"
        echo "2. SSH 金鑰是否正確設定"
        echo "3. 防火牆設定"
        return 1
    fi

    echo -e "${GREEN}SSH 連線正常${NC}"
    return 0
}

# 函數定義
deploy() {
    local env="$1"
    local branch="$2"
    local host="$3"
    local remote_dir="$4"
    local compose_path="$5"

    echo -e "${YELLOW}開始部署 ${env} 環境...${NC}"

    # 檢查 SSH 連線
    if ! check_ssh_connection "$host"; then
        exit 1
    fi

    # 檢查遠端目錄是否存在
    echo -e "${YELLOW}檢查遠端目錄...${NC}"
    if ! ssh "${REMOTE_USER}@${host}" "test -d '${remote_dir}'"; then
        echo -e "${RED}錯誤: 遠端目錄不存在${NC}"
        exit 1
    fi

    # 清理 Docker 資源但保留構建快取
    echo -e "${GREEN}1. 清理 Docker 資源...${NC}"
    if ! ssh "${REMOTE_USER}@${host}" "cd '${remote_dir}' && \
        docker system prune --force --filter 'until=24h' && \
        docker image prune --force --filter 'until=24h' && \
        docker container prune --force --filter 'until=24h' && \
        docker volume prune --force --filter 'label!=keep'"; then
        echo -e "${YELLOW}警告: Docker 清理可能不完整${NC}"
    fi

    # 更新程式碼
    echo -e "${GREEN}2. 正在更新程式碼 (${branch})...${NC}"
    if ! ssh "${REMOTE_USER}@${host}" "cd '${remote_dir}' && git pull origin '${branch}'"; then
        echo -e "${RED}錯誤: Git pull 失敗${NC}"
        exit 1
    fi

    # 重新建置並啟動 Docker
    echo -e "${GREEN}3. 重新建置並啟動 Docker 容器...${NC}"
    if ! ssh "${REMOTE_USER}@${host}" "cd '${remote_dir}' && docker compose -f '${compose_path}' up -d --build api"; then
        echo -e "${RED}錯誤: Docker 建置失敗${NC}"
        exit 1
    fi

    echo -e "${GREEN}${env} 環境部署完成！${NC}"
}

# 參數檢查
if [ "$#" -ne 5 ]; then
    echo -e "${RED}錯誤: 參數不足！請使用：${NC}"
    echo -e "  ./deploy.sh <環境> <分支> <IP> <遠端目錄> <docker-compose路徑>"
    echo -e "${YELLOW}範例:${NC}"
    echo -e "  ./deploy.sh test dev 172.104.112.239 /root/ticket-appeal-api-new /root/ticket-appeal-api-new/docker-compose.yml"
    exit 1
fi

# 讀取參數
env="$1"
branch="$2"
host="$3"
remote_dir="$4"
compose_path="$5"

# 驗證環境
if [[ "$env" != "prod" && "$env" != "test" ]]; then
    echo -e "${RED}錯誤: 環境參數無效，請使用 'prod' 或 'test'${NC}"
    exit 1
fi

# 執行部署
deploy "$env" "$branch" "$host" "$remote_dir" "$compose_path"