#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中国体育彩票 七星彩 & 排列五 历史开奖数据抓取脚本
数据源: 中国体彩官方接口 webapi.sporttery.cn
用法: python3 fetch_data.py [--out DIR]
输出: DIR/data/qxc.json  (七星彩, 7位: 前6位0-9, 第7位特别号0-14)
      DIR/data/pl5.json  (排列五, 5位: 每位0-9)
"""
import json
import os
import ssl
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

GAMES = {
    "qxc": {"gameNo": "04", "name": "七星彩", "digits": 7},
    "pl5": {"gameNo": "350133", "name": "排列五", "digits": 5},
}

BASE_URL = "https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://static.sporttery.cn/",
    "Accept": "application/json, text/plain, */*",
}
PAGES = 2          # 抓取页数
PAGE_SIZE = 100    # 每页 100 期 (接口上限)
CN_TZ = timezone(timedelta(hours=8))


def fetch_page(game_no, page_size, page_no):
    """抓取一页历史开奖数据.

    使用 unverified SSL context 的原因: 本地开发机存在自签名代理导致证书链校验失败,
    而 GitHub Actions 的干净环境则无此问题. 此处抓取的是公开开奖号码, 无敏感数据,
    统一跳过验证以保证本地与 CI 行为一致.
    """
    ctx = ssl._create_unverified_context()
    url = f"{BASE_URL}?gameNo={game_no}&provinceId=0&pageSize={page_size}&isVerify=1&pageNo={page_no}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


def parse_result(result_str):
    """'5 9 9 5 3 3 0' -> [5, 9, 9, 5, 3, 3, 0]; 第7位特别号可能为 '10'-'14'."""
    return [int(x) for x in result_str.split()]


def fetch_game(key):
    info = GAMES[key]
    draws = []
    for page in range(1, PAGES + 1):
        data = fetch_page(info["gameNo"], PAGE_SIZE, page)
        lst = data.get("value", {}).get("list", [])
        for item in lst:
            num = item.get("lotteryDrawNum", "")
            date = item.get("lotteryDrawTime", "")
            res = item.get("lotteryDrawResult", "")
            if not num or not res:
                continue
            parsed = parse_result(res)
            if len(parsed) != info["digits"]:
                # 跳过异常数据
                continue
            draws.append({
                "num": num,
                "date": date,
                "result": parsed,
            })
    # 按期号倒序 -> 正序 (最早在前, 最新在后)
    draws.sort(key=lambda d: d["num"])
    return draws


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    if "--out" in sys.argv:
        out_dir = sys.argv[sys.argv.index("--out") + 1]
    data_dir = os.path.join(out_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    updated = datetime.now(CN_TZ).strftime("%Y-%m-%d %H:%M:%S")
    for key, info in GAMES.items():
        draws = fetch_game(key)
        payload = {
            "game": key,
            "gameName": info["name"],
            "digits": info["digits"],
            "updatedAt": updated,
            "total": len(draws),
            "draws": draws,
        }
        path = os.path.join(data_dir, f"{key}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        latest = draws[-1] if draws else None
        print(f"[OK] {info['name']}: {len(draws)} 期 -> {path}"
              + (f" | 最新 {latest['num']} {latest['result']} {latest['date']}" if latest else ""))


if __name__ == "__main__":
    main()
