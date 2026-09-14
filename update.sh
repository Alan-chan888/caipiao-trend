#!/bin/bash
# 体彩数据自动更新脚本 —— 抓取最新开奖并推送到 GitHub
# 由 launchd 每小时调用一次 (见 setup_launchd.sh / com.caipiao.update.plist)

set -e
unset PYTHONPATH  # 避免 hermes venv 污染系统 python3

cd /Users/chensheng/caipiao-trend

# 抓取数据 (纯标准库脚本, 系统 python3 即可)
python3 fetch_data.py

# 仅当数据有变化才提交推送, 避免无意义提交
git add data/qxc.json data/pl5.json
if git diff --cached --quiet; then
  echo "[$(date '+%F %T')] 数据无变化, 跳过提交"
else
  git commit -m "chore: 更新开奖数据 $(date '+%F %H%M')"
  git push origin main
  echo "[$(date '+%F %T')] 已更新并推送"
fi
