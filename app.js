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

  function computeValue(result) { return result.slice(0, 4).reduce((a, b) => a + b, 0); } // 前4位相加

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

  // ===== 号码分组: A | BCD | EFG(七星彩) 或 A | BCD | E(排列五) =====
  function getGroups(digits) {
    if (digits === 7) {
      return [
        { label: "A", indices: [0] },
        { label: "BCD", indices: [1, 2, 3] },
        { label: "EFG", indices: [4, 5, 6] },
      ];
    }
    return [
      { label: "A", indices: [0] },
      { label: "BCD", indices: [1, 2, 3] },
      { label: "E", indices: [4] },
    ];
  }

  // ===== 渲染走势图 =====
  function renderTrend() {
    const d = cur();
    const draws = curDraws(); // 正序: 最早在前
    const digits = d.digits;
    const groups = getGroups(digits);

    // 更新说明文字
    $("#trendSub").textContent =
      digits === 7
        ? "「值」= A + B + C + D 前四位相加；第 7 位为特别号 0-14"
        : "「值」= A + B + C + D 前四位相加";

    const table = $("#trendTable");
    table.innerHTML = "";

    // 表头(单行): 期号 | 值 | A | BCD(colspan) | EFG(colspan)
    const thead = document.createElement("thead");
    const hr1 = document.createElement("tr");
    ["期号", "值"].forEach((t) => {
      const th = document.createElement("th");
      th.textContent = t;
      hr1.appendChild(th);
    });
    groups.forEach((g) => {
      const th = document.createElement("th");
      th.textContent = g.label;
      if (g.indices.length > 1) th.colSpan = g.indices.length;
      hr1.appendChild(th);
    });
    thead.appendChild(hr1);
    table.appendChild(thead);

    // 数据行: 越往下开奖越近 (最早在上, 最新在下); 每4期一组绿白交替
    const tbody = document.createElement("tbody");
    for (let r = 0; r < draws.length; r++) {
      const draw = draws[r];
      const tr = document.createElement("tr");
      if (r % 8 < 4) tr.className = "row-green";

      const tdMerged = document.createElement("td");
      tdMerged.className = "col-merged";
      const numDiv = document.createElement("div");
      numDiv.className = "merged-num";
      numDiv.textContent = draw.num; // 完整期号
      const dateDiv = document.createElement("div");
      dateDiv.className = "merged-date";
      dateDiv.textContent = shortDate(draw.date);
      tdMerged.appendChild(numDiv);
      tdMerged.appendChild(dateDiv);
      tr.appendChild(tdMerged);

      const tdVal = document.createElement("td");
      tdVal.className = "col-value";
      tdVal.textContent = computeValue(draw.result);
      tr.appendChild(tdVal);

      // 号码: 每个数字独立列
      draw.result.forEach((n) => {
        const td = document.createElement("td");
        const span = document.createElement("span");
        span.className = "num-cell";
        span.textContent = n;
        td.appendChild(span);
        tr.appendChild(td);
      });

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
