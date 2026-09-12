// 体彩规律图 前端逻辑（纯走势图版：黑字大字，越往下开奖越近）
(function () {
  "use strict";

  // ===== 状态 =====
  const state = {
    game: "qxc",
    range: 100,
    data: { qxc: null, pl5: null },
  };

  const $ = (sel) => document.querySelector(sel);

  // ===== 工具 =====
  function shortDate(date) { return date ? date.slice(5) : ""; } // MM-DD

  function computeSum(result) { return result.reduce((a, b) => a + b, 0); }

  // ===== 加载数据 =====
  async function loadData() {
    const files = { qxc: "data/qxc.json", pl5: "data/pl5.json" };
    const [qxc, pl5] = await Promise.all([
      fetch(files.qxc).then((r) => r.json()),
      fetch(files.pl5).then((r) => r.json()),
    ]);
    state.data.qxc = qxc;
    state.data.pl5 = pl5;
    const latest = qxc.updatedAt || pl5.updatedAt || "";
    $("#updatedAt").textContent = "数据更新于 " + latest;
  }

  // ===== 当前数据 =====
  function cur() { return state.data[state.game]; }
  function curDraws() {
    const d = cur();
    const all = d.draws;
    return all.slice(Math.max(0, all.length - state.range));
  }

  // ===== 渲染走势图 =====
  function renderTrend() {
    const d = cur();
    const draws = curDraws(); // 正序: 最早在前
    const digits = d.digits;

    // 更新说明文字
    $("#trendSub").textContent =
      digits === 7 ? "第 1-6 位为 0-9，第 7 位为特别号 0-14" : "第 1-5 位均为 0-9";

    const table = $("#trendTable");
    table.innerHTML = "";

    // 表头
    const thead = document.createElement("thead");
    const hr1 = document.createElement("tr");
    ["期号", "日期"].forEach((t) => {
      const th = document.createElement("th");
      th.textContent = t;
      hr1.appendChild(th);
    });
    for (let i = 0; i < digits; i++) {
      const th = document.createElement("th");
      th.textContent = "第" + (i + 1) + "位";
      hr1.appendChild(th);
    }
    const thSum = document.createElement("th");
    thSum.textContent = "和值";
    hr1.appendChild(thSum);
    thead.appendChild(hr1);

    const hr2 = document.createElement("tr");
    hr2.appendChild(document.createElement("th"));
    hr2.appendChild(document.createElement("th"));
    for (let i = 0; i < digits; i++) {
      const th = document.createElement("th");
      th.className = "sub";
      th.textContent = i === digits - 1 && digits === 7 ? "0-14" : "0-9";
      hr2.appendChild(th);
    }
    hr2.appendChild(document.createElement("th"));
    thead.appendChild(hr2);
    table.appendChild(thead);

    // 数据行: 越往下开奖越近 (最早在上, 最新在下)
    const tbody = document.createElement("tbody");
    for (let r = 0; r < draws.length; r++) {
      const draw = draws[r];
      const tr = document.createElement("tr");

      const tdNum = document.createElement("td");
      tdNum.className = "col-num";
      tdNum.textContent = draw.num.length > 3 ? draw.num.slice(-3) : draw.num;
      tr.appendChild(tdNum);

      const tdDate = document.createElement("td");
      tdDate.className = "col-date";
      tdDate.textContent = shortDate(draw.date);
      tr.appendChild(tdDate);

      draw.result.forEach((n) => {
        const td = document.createElement("td");
        const span = document.createElement("span");
        span.className = "num-cell";
        span.textContent = n;
        td.appendChild(span);
        tr.appendChild(td);
      });

      const tdSum = document.createElement("td");
      tdSum.className = "col-stat";
      tdSum.textContent = computeSum(draw.result);
      tr.appendChild(tdSum);

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  }

  // ===== 事件 =====
  function bindEvents() {
    $("#gameTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      state.game = btn.dataset.game;
      document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
      renderTrend();
    });

    $("#rangeSeg").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      state.range = parseInt(btn.dataset.range, 10);
      document.querySelectorAll("#rangeSeg button").forEach((b) => b.classList.toggle("active", b === btn));
      renderTrend();
    });
  }

  // ===== 启动 =====
  async function init() {
    try {
      await loadData();
      bindEvents();
      renderTrend();
    } catch (err) {
      console.error(err);
      $("#updatedAt").textContent = "数据加载失败";
      $("#trendPanel").innerHTML = '<div class="loading">⚠️ 数据加载失败，请稍后刷新重试</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
