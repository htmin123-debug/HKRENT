/* FILM HK RENTAL 관리자 — 홈페이지 카드 편집 (v327)
   장비 모델 화면의 '홈페이지 카드' 버튼을 누를 때만 불러오는 파일이에요 (평소 관리자 화면 속도에 영향 없음).
   저장 위치: state.webMeta[모델 이름] = { hidden, featured, list, tags, title, parts, info, image }
   저장하면 공개 장비 목록(public_catalog)에 'web' 으로 실려 렌탈 홈페이지가 읽어요. 사진은 주소만 저장. */
(function () {
  'use strict';
  if (window.FHKWebAdmin) return;
  const S = () => { try { return state; } catch (_) { return window.state || {}; } };   // eslint-disable-line no-undef
  const N = (v) => String(v == null ? '' : v).trim();
  const H = (v) => N(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const won = (n) => (Math.round(Number(n) || 0)).toLocaleString('ko-KR');
  const num = (v) => parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;
  const SET_RE = /세트|\bSET\b|패키지|\bKIT\b|KIT$/i;

  const CSS = `
  .fhkw-bg{position:fixed;inset:0;z-index:2147483000;background:rgba(10,12,16,.6);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}
  .fhkw{width:min(980px,100%);background:#fff;color:#111;border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.35);font:14px/1.5 'Noto Sans KR',system-ui,sans-serif}
  .fhkw *{box-sizing:border-box}
  .fhkw-hd{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #e5e5e5}
  .fhkw-hd b{font-size:16px}
  .fhkw-hd small{color:#888}
  .fhkw-x{margin-left:auto;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#444}
  .fhkw-body{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:24px;padding:18px}
  @media(max-width:760px){.fhkw-body{grid-template-columns:1fr}}
  .fhkw-f{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .fhkw-f label{display:flex;flex-direction:column;gap:4px;font-weight:700;font-size:13px}
  .fhkw-f .w{grid-column:1/-1}
  .fhkw-f input[type=text],.fhkw-f input:not([type]),.fhkw-f textarea{font:inherit;font-weight:400;border:1px solid #cfcfcf;border-radius:4px;padding:8px 10px;color:#111;background:#fff;min-width:0}
  .fhkw-f textarea{min-height:80px;resize:vertical}
  .fhkw-f .hint{font-weight:400;font-size:12px;color:#888}
  .fhkw-ck{flex-direction:row!important;align-items:center;gap:8px!important;font-weight:600!important}
  .fhkw-ck input{width:17px;height:17px;accent-color:#FF4A12}
  .fhkw-ro{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 12px;background:#f5f5f3;border-radius:4px;font-size:13px;color:#444}
  .fhkw-ro b{color:#111}
  .fhkw-ft{display:flex;align-items:center;gap:10px;padding:14px 18px;border-top:1px solid #e5e5e5}
  .fhkw-ft .msg{font-size:13px;color:#FF4A12;margin-right:auto}
  .fhkw-btn{border:1px solid #111;background:#111;color:#fff;border-radius:4px;padding:10px 18px;font:700 14px 'Noto Sans KR',sans-serif;cursor:pointer}
  .fhkw-btn.ghost{background:#fff;color:#111}
  .fhkw-pv small{display:block;margin-bottom:8px;color:#888;font-size:12px;letter-spacing:.06em}
  .fhkw-off{opacity:.35}
  /* 렌탈 홈페이지 카드와 같은 모양 */
  .fhkw-card{font-family:'Archivo','Noto Sans KR',sans-serif;max-width:320px}
  .fhkw-card .t{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;min-height:2.6em;padding-bottom:8px;border-bottom:1px solid #111}
  .fhkw-card .n{font-weight:800;font-size:16px;line-height:1.25;letter-spacing:-.02em}
  .fhkw-card .bd{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
  .fhkw-card .rb{font-weight:800;font-size:11px;letter-spacing:.06em;color:#fff;background:#111;padding:5px 8px}
  .fhkw-card .rb.set{background:#FF4A12}
  .fhkw-card .rb.tag{background:none;color:#FF4A12;box-shadow:inset 0 0 0 1px #FF4A12;letter-spacing:0}
  .fhkw-card .pic{aspect-ratio:4/3;background:#F3F2F0;display:grid;place-items:center;overflow:hidden;position:relative}
  .fhkw-card .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:6%}
  .fhkw-card .pic svg{width:70%;height:70%}
  .fhkw-card .was{display:flex;gap:8px;align-items:baseline;min-height:30px;padding:8px 0 2px;font-weight:600;font-size:15px;color:#6b6b6b}
  .fhkw-card .was s{text-decoration-color:#FF4A12;text-decoration-thickness:2px}
  .fhkw-card .was em{font-style:normal;font-weight:800;font-size:12px;color:#FF4A12}
  .fhkw-card .now{display:flex;align-items:baseline;justify-content:space-between;background:#111;color:#fff;padding:10px 12px}
  .fhkw-card .now b{font-weight:900;font-size:28px;letter-spacing:-.03em}
  .fhkw-card .now i{font-style:normal;font-weight:800;font-size:13px}
  .fhkw-dt{margin-top:16px;padding-top:12px;border-top:1px solid #e5e5e5;font-size:13px}
  .fhkw-dt h4{margin:0 0 8px;font-size:17px;line-height:1.3}
  .fhkw-dt ul{margin:0 0 8px;padding:0;list-style:none;border-top:1px solid #eee}
  .fhkw-dt li{padding:4px 0;border-bottom:1px solid #eee}
  .fhkw-dt p{margin:0;white-space:pre-line;color:#333}
  `;

  function modelInfo(model) {
    const st = S(), list = (st.equipment || []).filter((e) => N(e.name) === model);
    const rates = {}; list.forEach((e) => { const r = Number(e.rate) || 0; rates[r] = (rates[r] || 0) + 1; });
    const price = Number(Object.entries(rates).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0]) || 0;
    const cat = N(list[0] && list[0].category);
    const catSet = ((st.categoryMeta || {})[cat] || {}).type === 'set';
    const slots = ((st.setComponents || {})[model] || []).map((r) => ({ name: N(r.name || r.label || r.category), qty: Math.max(1, Number(r.required) || Number(r.qty) || 1) })).filter((x) => x.name);
    return { price, cat, count: list.length, isSet: catSet || SET_RE.test(cat) || / SET$|FULL SET/i.test(model) || slots.length > 0, slots };
  }
  /* 처음 여는 장비는 렌탈 홈페이지(filmhk-rent data/rent.js extras)에 임시로 적어 둔 값을 미리 채움. 저장하면 여기 값으로 넘어옴 */
  const DEFAULTS = {"Vespid Prime PL 7SET": {"list": 150000, "featured": true, "title": "Dzofilm Vespid SET / PL마운트 VV Full Frame 렌즈 세트", "parts": ["16mm", "25mm", "35mm", "50mm", "75mm", "100mm", "125mm"], "info": "Dzofilm Vespid 시네 단렌즈 SET 입니다.\nPL마운트 Vista Vision 렌즈로 풀프레임보다 더 큰 비스타비전 센서도 커버 가능합니다.\n16mm 제외 모든 렌즈 원형필터 사용 가능!"}, "GM줌렌즈 세트": {"list": 120000, "featured": true, "title": "Sony GM 줌 렌즈 세트 (16-35 · 24-70 · 70-200)"}, "Sony FZ 28-135 G": {"list": 35000, "title": "Sony FE PZ 28-135mm F4 G OSS"}, "Sigma FE 16-28": {"list": 35000, "title": "Sigma 16-28mm F2.8 DG DN (FE)"}, "Tamron FE 70-180": {"tags": ["마크로 가능"]}, "RED KOMODO-X FULL SET": {"featured": true}, "Sony FX6 FULL SET": {"featured": true}, "Sony FX3 FULL SET": {"featured": true}, "Aputure STORM 600C II Stand SET": {"featured": true}, "DJI Ronin RS4 Pro": {"featured": true}, "Teradek Bolt 600 1:1~1:3": {"featured": true}};
  const read = (model) => { const w = (S().webMeta || {})[model]; return Object.assign({}, w || DEFAULTS[model] || {}); };

  function art(cat) {
    const OR = '#FF4A12';
    if (/렌즈/.test(cat)) return `<svg viewBox="0 0 300 150" fill="none" stroke="#111" stroke-width="1.4"><rect x="70" y="46" width="150" height="60" rx="3"/><line x1="100" y1="46" x2="100" y2="106"/><line x1="133" y1="46" x2="133" y2="106"/><line x1="163" y1="46" x2="163" y2="106"/><line x1="193" y1="46" x2="193" y2="106" stroke="${OR}" stroke-width="2"/></svg>`;
    if (/카메라|액션/.test(cat)) return `<svg viewBox="0 0 300 150" fill="none" stroke="#111" stroke-width="1.4"><rect x="80" y="44" width="110" height="74" rx="4"/><circle cx="214" cy="81" r="26"/><circle cx="214" cy="81" r="14" stroke="${OR}" stroke-width="2"/></svg>`;
    if (/조명/.test(cat)) return `<svg viewBox="0 0 300 150" fill="none" stroke="#111" stroke-width="1.4"><rect x="96" y="28" width="108" height="72" rx="3"/><line x1="130" y1="36" x2="130" y2="92" stroke="${OR}" stroke-width="2"/><line x1="150" y1="100" x2="150" y2="132"/></svg>`;
    return `<svg viewBox="0 0 300 150" fill="none" stroke="#111" stroke-width="1.4"><rect x="90" y="40" width="120" height="80" rx="4"/><circle cx="150" cy="80" r="22" stroke="${OR}" stroke-width="2"/></svg>`;
  }
  function preview(model, info, w) {
    const off = w.list > info.price ? Math.round((1 - info.price / w.list) * 100) : 0;
    const parts = (w.parts && w.parts.length) ? w.parts : info.slots.map((s) => s.name + (s.qty > 1 ? ' × ' + s.qty : ''));
    return `<div class="fhkw-card${w.hidden ? ' fhkw-off' : ''}">
        <div class="t"><span class="n">${H(model)}</span><span class="bd"><span class="rb${info.isSet ? ' set' : ''}">${info.isSet ? 'SET' : '단품'}</span>${(w.tags || []).map((t) => `<span class="rb tag">${H(t)}</span>`).join('')}</span></div>
        <div class="pic">${w.image ? `<img src="${H(w.image)}" alt="" onerror="this.remove()">` : art(info.cat)}</div>
        <div class="was">${off ? `<s>₩ ${won(w.list)}</s><em>−${off}%</em>` : ''}</div>
        <div class="now"><i>₩</i><b>${won(info.price)}</b><i>24h</i></div>
      </div>
      <div class="fhkw-dt${w.hidden ? ' fhkw-off' : ''}"><h4>${H(w.title || model)}</h4>${parts.length ? `<ul>${parts.map((p) => `<li>${H(p)}</li>`).join('')}</ul>` : ''}${w.info ? `<p>${H(w.info)}</p>` : ''}</div>`;
  }

  function open(model) {
    model = N(model); if (!model) return;
    if (!document.getElementById('fhkw-css')) { const st = document.createElement('style'); st.id = 'fhkw-css'; st.textContent = CSS; document.head.appendChild(st); }
    const info = modelInfo(model), w0 = read(model);
    const bg = document.createElement('div'); bg.className = 'fhkw-bg';
    bg.innerHTML = `<div class="fhkw" role="dialog" aria-modal="true" aria-label="홈페이지 카드 · ${H(model)}">
      <div class="fhkw-hd"><b>홈페이지 카드</b><small>${H(model)}</small><button type="button" class="fhkw-x" aria-label="닫기">×</button></div>
      <div class="fhkw-body">
        <form class="fhkw-f" autocomplete="off">
          <div class="fhkw-ro"><span>분류 <b>${H(info.cat || '-')}</b></span><span>하루 가격 <b>${won(info.price)}원</b></span><span>${info.isSet ? '<b>SET</b>' : '단품'}</span><span class="hint">이름 · 가격 · 분류는 장비 정보에서 바꿔요</span></div>
          <label class="fhkw-ck w"><input type="checkbox" name="show" ${w0.hidden ? '' : 'checked'}>홈페이지에 게시</label>
          <label class="fhkw-ck w"><input type="checkbox" name="featured" ${w0.featured ? 'checked' : ''}>첫 화면 추천 장비</label>
          <label>정가 (줄 긋는 가격)<input name="list" inputmode="numeric" value="${w0.list ? H(w0.list) : ''}" placeholder="비우면 안 보여요"><span class="hint">하루 가격보다 커야 할인율이 붙어요</span></label>
          <label>카드 표시<input name="tags" value="${H((w0.tags || []).join(', '))}" placeholder="예: 마크로 가능"><span class="hint">쉼표로 여러 개</span></label>
          <label class="w">상세 제목<input name="title" value="${H(w0.title || '')}" placeholder="${H(model)}"></label>
          <label class="w">구성 (한 줄에 하나)<textarea name="parts" placeholder="${info.slots.length ? '비우면 세트 구성을 그대로 보여줘요' : '예: 앞뒤 캡 · 후드'}">${H((w0.parts || []).join('\n'))}</textarea></label>
          <label class="w">제품 안내<textarea name="info" placeholder="홈페이지 상세 페이지에 보일 설명">${H(w0.info || '')}</textarea></label>
          <label class="w">사진 주소<input name="image" value="${H(w0.image || '')}" placeholder="https://… (사진 올리기는 곧 붙여요)"></label>
        </form>
        <div class="fhkw-pv"><small>홈페이지 미리보기</small><div id="fhkw-pv"></div></div>
      </div>
      <div class="fhkw-ft"><span class="msg" role="status"></span><button type="button" class="fhkw-btn ghost" data-a="close">취소</button><button type="button" class="fhkw-btn" data-a="save">저장하고 홈페이지에 반영</button></div>
    </div>`;
    document.body.appendChild(bg);
    const f = bg.querySelector('form'), pv = bg.querySelector('#fhkw-pv');
    const val = () => {
      const g = (n) => f.elements[n];
      const w = {};
      if (!g('show').checked) w.hidden = true;
      if (g('featured').checked) w.featured = true;
      const list = num(g('list').value); if (list) w.list = list;
      const tags = g('tags').value.split(',').map(N).filter(Boolean); if (tags.length) w.tags = tags;
      ['title', 'info', 'image'].forEach((k) => { const v = N(g(k).value); if (v) w[k] = v; });
      const parts = g('parts').value.split('\n').map(N).filter(Boolean); if (parts.length) w.parts = parts;
      return w;
    };
    const draw = () => { pv.innerHTML = preview(model, info, val()); };
    f.addEventListener('input', draw); f.addEventListener('change', draw); draw();
    const close = () => { bg.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    bg.addEventListener('click', async (e) => {
      if (e.target === bg || e.target.closest('.fhkw-x') || e.target.closest('[data-a="close"]')) { close(); return; }
      if (!e.target.closest('[data-a="save"]')) return;
      const w = val(), st = S();
      st.webMeta = st.webMeta || {};
      if (Object.keys(w).length) st.webMeta[model] = w; else delete st.webMeta[model];
      const msg = bg.querySelector('.msg');
      try { if (typeof window.save === 'function') window.save(); } catch (_) {}
      let ok = true;
      try { if (typeof window.fhkPublishCatalog === 'function') ok = await window.fhkPublishCatalog(); } catch (_) { ok = false; }
      msg.textContent = ok ? '저장했어요. 홈페이지에 반영됐어요.' : '저장했어요. 홈페이지 반영은 로그인 · 연결 뒤 자동으로 돼요.';
      try { window.dispatchEvent(new Event('fhk-web-saved')); } catch (_) {}
      setTimeout(close, ok ? 900 : 2200);
    });
    setTimeout(() => { const i = f.querySelector('input[name="list"]'); if (i) i.focus(); }, 30);
  }

  window.FHKWebAdmin = { open };
})();
