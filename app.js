// 体彩规律图 前端逻辑（老年人友好版：纯黑大字）
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
  function maxVal(digits) { return digits === 7 ? 14 : 9; } // 七星彩第7位0-14

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

  // ===== 渲染最新一期 =====
  function renderLatest() {
    const d = cur();
    const draws = d.draws;
    const last = draws[draws.length - 1];
    if (!last) return;
    $("#latestNum").textContent = "第 " + last.num + " 期";
    $("#latestDate").textContent = last.date;

    const balls = $("#latestBalls");
    balls.innerHTML = "";
    last.result.forEach((n, i) => {
      const span = document.createElement("span");
      span.className = "ball" + (d.digits === 7 && i === 6 ? " special" : "");
      span.textContent = n;
      balls.appendChild(span);
    });
  }

  // ===== 渲染走势图 =====
  function renderTrend() {
    const d = cur();
    const draws = curDraws();
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

    // 数据行 (最新在上)
    const tbody = document.createElement("tbody");
    for (let r = draws.length - 1; r >= 0; r--) {
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

  // ===== 号码集合 =====
  function numberSet(digits) {
    const mv = maxVal(digits);
    return Array.from({ length: mv + 1 }, (_, i) => i);
  }

  // ===== 号码出现次数 =====
  function renderFreq() {
    const d = cur();
    const draws = curDraws();
    const digits = d.digits;
    const nums = numberSet(digits);
    const wrap = $("#freqWrap");
    wrap.innerHTML = "";

    const rows = [];
    for (let p = 0; p < digits; p++) {
      const counts = new Map(nums.map((n) => [n, 0]));
      draws.forEach((dr) => {
        const n = dr.result[p];
        counts.set(n, counts.get(n) + 1);
      });
      rows.push({ label: "第" + (p + 1) + "位", counts, span: digits === 7 && p === 6 ? 15 : 10 });
    }
    // 总体
    const total = new Map(nums.map((n) => [n, 0]));
    draws.forEach((dr) => dr.result.forEach((n) => total.set(n, total.get(n) + 1)));
    rows.push({ label: "总体", counts: total, span: nums.length });

    rows.forEach((row) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "freq-row";
      const label = document.createElement("div");
      label.className = "freq-row-label";
      label.textContent = row.label;
      rowDiv.appendChild(label);

      const cells = document.createElement("div");
      cells.className = "freq-cells" + (row.span === 15 ? " wide-cells" : "");
      nums.forEach((n) => {
        const c = row.counts.get(n);
        const cell = document.createElement("div");
        cell.className = "freq-cell";
        cell.innerHTML =
          `<span class="n">${n}</span>` +
          `<div class="v">${c}</div>` +
          `<span class="l">次</span>`;
        cells.appendChild(cell);
      });
      rowDiv.appendChild(cells);
      wrap.appendChild(rowDiv);
    });
  }

  // ===== 遗漏期数 =====
  function renderOmit() {
    const d = cur();
    const draws = curDraws();
    const digits = d.digits;
    const nums = numberSet(digits);
    const wrap = $("#omitWrap");
    wrap.innerHTML = "";

    for (let p = 0; p < digits; p++) {
      const omit = new Map(nums.map((n) => [n, draws.length]));
      for (let i = draws.length - 1; i >= 0; i--) {
        const n = draws[i].result[p];
        if (omit.get(n) === draws.length) omit.set(n, draws.length - 1 - i);
      }
      const rowDiv = document.createElement("div");
      rowDiv.className = "freq-row";
      const label = document.createElement("div");
      label.className = "freq-row-label";
      label.textContent = "第" + (p + 1) + "位";
      rowDiv.appendChild(label);

      const cells = document.createElement("div");
      cells.className = "freq-cells" + (digits === 7 && p === 6 ? " wide-cells" : "");
      nums.forEach((n) => {
        const o = omit.get(n);
        const cell = document.createElement("div");
        cell.className = "freq-cell";
        cell.innerHTML =
          `<span class="n">${n}</span>` +
          `<div class="v">${o}</div>` +
          `<span class="l">期</span>`;
        cells.appendChild(cell);
      });
      rowDiv.appendChild(cells);
      wrap.appendChild(rowDiv);
    }
  }

  // ===== 总渲染 =====
  function render() {
    renderLatest();
    renderTrend();
    renderFreq();
    renderOmit();
  }

  // ===== 事件 =====
  function bindEvents() {
    $("#gameTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      state.game = btn.dataset.game;
      document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });

    $("#rangeSeg").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      state.range = parseInt(btn.dataset.range, 10);
      document.querySelectorAll("#rangeSeg button").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  }

  // ===== 启动 =====
  async function init() {
    try {
      await loadData();
      bindEvents();
      render();
    } catch (err) {
      console.error(err);
      $("#updatedAt").textContent = "数据加载失败";
      const panels = document.querySelectorAll(".panel");
      panels.forEach((p) => (p.innerHTML = '<div class="loading">⚠️ 数据加载失败，请稍后刷新重试</div>'));
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
