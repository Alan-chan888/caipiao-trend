// 体彩规律图 前端逻辑
(function () {
  "use strict";

  // ===== 号码颜色 (0-14) =====
  const NUMBER_COLORS = {
    0: "#e74c3c", 1: "#e67e22", 2: "#f39c12", 3: "#2ecc71", 4: "#1abc9c",
    5: "#3498db", 6: "#9b59b6", 7: "#e84393", 8: "#e91e63", 9: "#795548",
    10: "#607d8b", 11: "#00bcd4", 12: "#8bc34a", 13: "#ff9800", 14: "#3f51b5",
  };

  // 热力背景档位 (频率统计用)
  const HEAT_LEVELS = [
    { bg: "#f6f7fb", fg: "#2b2f3a" },
    { bg: "#e9eaf8", fg: "#2b2f3a" },
    { bg: "#d2d4f3", fg: "#2b2f3a" },
    { bg: "#a9adee", fg: "#ffffff" },
    { bg: "#7c82e0", fg: "#ffffff" },
    { bg: "#5b62d6", fg: "#ffffff" },
  ];

  // ===== 状态 =====
  const state = {
    game: "qxc",
    range: 100,
    colorMode: "number",
    data: { qxc: null, pl5: null },
  };

  const $ = (sel) => document.querySelector(sel);

  // ===== 工具 =====
  function maxVal(digits) { return digits === 7 ? 14 : 9; } // 七星彩第7位0-14

  function getCellColor(n, mode, digits) {
    if (mode === "odd") return n % 2 === 1 ? "#e74c3c" : "#3498db";
    if (mode === "big") {
      const mid = maxVal(digits) === 14 ? 8 : 5; // 0-7小 / 5-9大(0-14: 8-14大)
      return n >= mid ? "#e74c3c" : "#3498db";
    }
    if (mode === "route") return ["#e74c3c", "#2ecc71", "#3498db"][n % 3];
    return NUMBER_COLORS[n]; // number 模式
  }

  function shortNum(num) { return num; }       // 完整期号
  function shortDate(date) { return date ? date.slice(5) : ""; } // MM-DD

  // 奇偶比 / 大小比 / 和值
  function computeStats(result, digits) {
    const sum = result.reduce((a, b) => a + b, 0);
    let odd = 0, big = 0;
    const mid = maxVal(digits) === 14 ? 8 : 5;
    result.forEach((n) => {
      if (n % 2 === 1) odd++;
      if (n >= mid) big++;
    });
    return { sum, odd, even: result.length - odd, big, small: result.length - big };
  }

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
      span.style.background = NUMBER_COLORS[n];
      span.textContent = n;
      balls.appendChild(span);
    });

    const st = computeStats(last.result, d.digits);
    $("#latestExtra").innerHTML =
      `<span>和值 <b>${st.sum}</b></span>` +
      `<span>奇偶比 <b>${st.odd}:${st.even}</b></span>` +
      `<span>大小比 <b>${st.big}:${st.small}</b></span>`;
  }

  // ===== 渲染走势图 =====
  function renderTrend() {
    const d = cur();
    const draws = curDraws();
    const digits = d.digits;
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
    ["和值", "奇偶", "大小"].forEach((t) => {
      const th = document.createElement("th");
      th.textContent = t;
      hr1.appendChild(th);
    });
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
    for (let i = 0; i < 3; i++) hr2.appendChild(document.createElement("th"));
    thead.appendChild(hr2);
    table.appendChild(thead);

    // 数据行 (最新在上)
    const tbody = document.createElement("tbody");
    for (let r = draws.length - 1; r >= 0; r--) {
      const draw = draws[r];
      const tr = document.createElement("tr");

      const tdNum = document.createElement("td");
      tdNum.className = "col-num";
      tdNum.textContent = shortNum(draw.num);
      tr.appendChild(tdNum);

      const tdDate = document.createElement("td");
      tdDate.className = "col-date";
      tdDate.textContent = shortDate(draw.date);
      tr.appendChild(tdDate);

      draw.result.forEach((n) => {
        const td = document.createElement("td");
        const span = document.createElement("span");
        const wide = n >= 10;
        span.className = "cell" + (wide ? " wide" : "");
        span.style.background = getCellColor(n, state.colorMode, digits);
        span.textContent = n;
        td.appendChild(span);
        tr.appendChild(td);
      });

      const st = computeStats(draw.result, digits);
      [
        st.sum,
        `${st.odd}:${st.even}`,
        `${st.big}:${st.small}`,
      ].forEach((v) => {
        const td = document.createElement("td");
        td.className = "col-stat";
        td.textContent = v;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    renderLegend();
  }

  // ===== 图例 =====
  function renderLegend() {
    const legend = $("#legend");
    legend.innerHTML = "";
    if (state.colorMode === "number") {
      const mv = maxVal(cur().digits);
      for (let n = 0; n <= mv; n++) {
        const item = document.createElement("span");
        item.className = "legend-item";
        item.innerHTML = `<span class="legend-dot" style="background:${NUMBER_COLORS[n]}"></span>${n}`;
        legend.appendChild(item);
      }
    } else {
      const modes = {
        odd: [["奇数", "#e74c3c"], ["偶数", "#3498db"]],
        big: [["大号", "#e74c3c"], ["小号", "#3498db"]],
        route: [["0路(÷3余0)", "#e74c3c"], ["1路(÷3余1)", "#2ecc71"], ["2路(÷3余2)", "#3498db"]],
      };
      (modes[state.colorMode] || []).forEach(([label, color]) => {
        const item = document.createElement("span");
        item.className = "legend-item";
        item.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${label}`;
        legend.appendChild(item);
      });
    }
  }

  // ===== 号码集合 =====
  function numberSet(digits) {
    const mv = maxVal(digits);
    return Array.from({ length: mv + 1 }, (_, i) => i);
  }

  // ===== 频率统计 =====
  function renderFreq() {
    const d = cur();
    const draws = curDraws();
    const digits = d.digits;
    const nums = numberSet(digits);
    const wrap = $("#freqWrap");
    wrap.innerHTML = "";

    // 每位一行 + 总体一行
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
      const maxC = Math.max(...row.counts.values());
      const minC = Math.min(...row.counts.values());
      nums.forEach((n) => {
        const c = row.counts.get(n);
        const cell = document.createElement("div");
        cell.className = "freq-cell";
        // 热力分档
        const t = maxC === minC ? 0 : (c - minC) / (maxC - minC);
        const lvl = Math.round(t * (HEAT_LEVELS.length - 1));
        cell.style.background = HEAT_LEVELS[lvl].bg;
        cell.innerHTML =
          `<span class="n" style="color:${NUMBER_COLORS[n]}">${n}</span>` +
          `<div class="v" style="color:${HEAT_LEVELS[lvl].fg}">${c}</div>` +
          `<span class="l" style="color:${HEAT_LEVELS[lvl].fg === "#ffffff" ? "rgba(255,255,255,0.8)" : "var(--muted)"}">${draws.length ? Math.round(c / draws.length * 100) : 0}%</span>`;
        cells.appendChild(cell);
      });
      rowDiv.appendChild(cells);
      wrap.appendChild(rowDiv);
    });
  }

  // ===== 遗漏统计 =====
  function renderOmit() {
    const d = cur();
    const draws = curDraws();
    const digits = d.digits;
    const nums = numberSet(digits);
    const wrap = $("#omitWrap");
    wrap.innerHTML = "";

    for (let p = 0; p < digits; p++) {
      const omit = new Map(nums.map((n) => [n, draws.length])); // 默认最大遗漏 = 全部期数
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
        // 遗漏颜色: 0=绿, 1-2=浅绿, 3-5=黄, 6-9=橙, 10+=红
        let bg = "#e8f8f0", fg = "#2ecc71";
        if (o >= 10) { bg = "#fdecea"; fg = "#e74c3c"; }
        else if (o >= 6) { bg = "#fef3e2"; fg = "#f39c12"; }
        else if (o >= 3) { bg = "#fdf6e3"; fg = "#e67e22"; }
        else if (o >= 1) { bg = "#eef9f2"; fg = "#27ae60"; }
        cell.style.background = bg;
        cell.innerHTML =
          `<span class="n" style="color:${NUMBER_COLORS[n]}">${n}</span>` +
          `<div class="v" style="color:${fg}">${o}</div>` +
          `<span class="l">期</span>`;
        cells.appendChild(cell);
      });
      rowDiv.appendChild(cells);
      wrap.appendChild(rowDiv);
    }
  }

  // ===== 冷热号 =====
  function renderHot() {
    const d = cur();
    const draws = d.draws;
    const digits = d.digits;
    const nums = numberSet(digits);
    const grid = $("#hotGrid");
    grid.innerHTML = "";

    [10, 30].forEach((win) => {
      const recent = draws.slice(Math.max(0, draws.length - win));
      const counts = new Map(nums.map((n) => [n, 0]));
      recent.forEach((dr) => dr.result.forEach((n) => counts.set(n, counts.get(n) + 1)));
      const sorted = nums.map((n) => [n, counts.get(n)]).sort((a, b) => b[1] - a[1]);
      const hot = sorted.slice(0, 5);
      const cold = sorted.slice(-5).reverse();

      const col = document.createElement("div");
      col.className = "hot-col";
      col.innerHTML = `<h3><span class="tag hot-tag">热</span>近${win}期</h3>`;
      const list = document.createElement("ul");
      list.className = "rank-list";
      hot.forEach(([n, c]) => {
        const li = document.createElement("li");
        li.className = "rank-item";
        li.innerHTML =
          `<span class="rank-ball" style="background:${NUMBER_COLORS[n]}">${n}</span>` +
          `<span>出现 ${c} 次</span>` +
          `<span class="rank-count">${Math.round(c / recent.length * 100)}%</span>`;
        list.appendChild(li);
      });
      col.appendChild(list);

      // 冷号
      const coldTitle = document.createElement("h3");
      coldTitle.innerHTML = `<span class="tag cold-tag">冷</span>近${win}期`;
      col.appendChild(coldTitle);
      const coldList = document.createElement("ul");
      coldList.className = "rank-list";
      cold.forEach(([n, c]) => {
        const li = document.createElement("li");
        li.className = "rank-item";
        li.innerHTML =
          `<span class="rank-ball" style="background:${NUMBER_COLORS[n]}">${n}</span>` +
          `<span>出现 ${c} 次</span>` +
          `<span class="rank-count">${Math.round(c / recent.length * 100)}%</span>`;
        coldList.appendChild(li);
      });
      col.appendChild(coldList);

      grid.appendChild(col);
    });
  }

  // ===== 总渲染 =====
  function render() {
    renderLatest();
    renderTrend();
    renderFreq();
    renderOmit();
    renderHot();
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

    $("#colorSeg").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      state.colorMode = btn.dataset.color;
      document.querySelectorAll("#colorSeg button").forEach((b) => b.classList.toggle("active", b === btn));
      renderTrend();
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
