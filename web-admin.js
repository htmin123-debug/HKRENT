/* FILM HK RENTAL 관리자 — 홈페이지 카드 편집 (v329: 사진 넣기 · 자르기)
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
  .fhkw-f label,.fhkw-f input,.fhkw-f textarea{min-width:0;max-width:100%}
  @media(max-width:760px){.fhkw-body{grid-template-columns:minmax(0,1fr);gap:16px;padding:14px}.fhkw-f{grid-template-columns:minmax(0,1fr)}.fhkw-pv{order:-1}.fhkw-card{max-width:none}.fhkw-dt{display:none}.fhkw-drop{grid-template-columns:96px minmax(0,1fr)}.fhkw-drop .th{width:96px}.fhkw-bg{padding:10px 8px}}
  .fhkw-f{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;min-width:0}
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
  /* 렌탈 홈페이지 카드와 같은 모양 (예전 FILM HK RENTAL 카드: 정사각형 · 남색 이름 · SET 빨강/단품 남색 · 줄 그은 정가 · 검은 가격 띠) */
  .fhkw-card{container-type:inline-size;width:100%;max-width:320px;aspect-ratio:1/1;display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;background:#F2F2F2;overflow:hidden;font-family:'Archivo','Noto Sans KR',sans-serif}
  .fhkw-card .t{display:flex;justify-content:space-between;align-items:center;gap:3cqw;padding:4.5cqw 4cqw 0}
  .fhkw-card .n{font-weight:800;font-size:6.2cqw;line-height:1.15;letter-spacing:-.02em;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fhkw-card .bd{display:flex;align-items:center;gap:1.5cqw}
  .fhkw-card .rb{font-weight:900;font-size:5cqw;line-height:1;letter-spacing:.04em;color:#fff;background:#111;padding:1.6cqw 3.6cqw;min-width:22cqw;text-align:center}
  .fhkw-card .rb.set,.fhkw-card .rb.tag{background:#FF4A12}
  .fhkw-card .rb.tag{letter-spacing:0;min-width:0}
  .fhkw-card .pic{min-height:0;margin:1cqw 3cqw 0;display:grid;place-items:center;position:relative;overflow:hidden}
  .fhkw-card .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
  .fhkw-card .pic svg{width:62%;height:62%}
  .fhkw-card .was{height:8.4cqw;padding:0 4cqw;display:flex;align-items:center;font-weight:800;font-size:6.4cqw;color:#8A8A8A}
  .fhkw-card .was s{text-decoration:none;position:relative;padding:0 1cqw}
  .fhkw-card .was s::after{content:"";position:absolute;left:-1cqw;right:-1cqw;top:52%;height:.9cqw;min-height:2px;background:#FF4A12}
  .fhkw-card .was em{display:none}
  .fhkw-card .now{background:#111;color:#fff;height:19cqw;padding:0 4cqw;display:grid;grid-template-columns:auto 1fr auto;align-items:center}
  .fhkw-card .now b{font-weight:900;font-size:13cqw;line-height:1;letter-spacing:-.03em;text-align:center}
  .fhkw-card .now i{font-style:normal;font-weight:900;font-size:5.6cqw}
  .fhkw-dt{margin-top:16px;padding-top:12px;border-top:1px solid #e5e5e5;font-size:13px}
  .fhkw-dt h4{margin:0 0 8px;font-size:17px;line-height:1.3}
  .fhkw-dt ul{margin:0 0 8px;padding:0;list-style:none;border-top:1px solid #eee}
  .fhkw-dt li{padding:4px 0;border-bottom:1px solid #eee}
  .fhkw-dt p{margin:0;white-space:pre-line;color:#333}
  .fhkw-ph{display:flex;flex-direction:column;gap:6px}
  .fhkw-ph .lb{font-weight:700;font-size:13px}
  .fhkw-drop{position:relative;display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center;padding:12px;border:1.5px dashed #bdbdbd;border-radius:6px;cursor:pointer;background:#fafafa;outline:none;transition:border-color .2s,background .2s}
  .fhkw-drop:hover,.fhkw-drop:focus-visible,.fhkw-drop.over{border-color:#FF4A12;background:#FFF6F2}
  .fhkw-drop .th{width:120px;aspect-ratio:4/3;border-radius:4px;background:#F3F2F0 conic-gradient(#e9e9e9 25%,#f7f7f7 0 50%,#e9e9e9 0 75%,#f7f7f7 0) 0 0/14px 14px;display:grid;place-items:center;overflow:hidden}
  .fhkw-drop .th img{width:100%;height:100%;object-fit:contain}
  .fhkw-drop .th span{font-size:11px;color:#999}
  .fhkw-drop p{margin:0;font-size:13px;color:#555;line-height:1.5}
  .fhkw-drop p b{color:#111}
  .fhkw-drop.busy::after{content:"처리 중…";position:absolute;inset:0;display:grid;place-items:center;background:rgba(255,255,255,.75);font-weight:700;border-radius:6px}
  .fhkw-ph-opt{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;font-size:13px}
  .fhkw-f .fhkw-ph-opt label{display:inline-flex;flex-direction:row;align-items:center;gap:6px;font-weight:600;font-size:13px}
  .fhkw-ph-opt input{width:16px;height:16px;accent-color:#FF4A12}
  .fhkw-ph-opt button{border:0;background:none;color:#888;text-decoration:underline;cursor:pointer;font:inherit;padding:0}
  .fhkw-ph-msg{color:#FF4A12}
  .fhkw-ph-msg.ok{color:#15803d}
  .fhkw-ph details{font-size:12px;color:#888}
  .fhkw-ph details input{margin-top:6px;width:100%}
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
  const DEFAULTS = {"Vespid Prime PL 7SET": {"list": 150000, "featured": true, "title": "Dzofilm Vespid SET / PL마운트 VV Full Frame 렌즈 세트", "parts": ["16mm", "25mm", "35mm", "50mm", "75mm", "100mm", "125mm"], "info": "Dzofilm Vespid 시네 단렌즈 SET 입니다.\nPL마운트 Vista Vision 렌즈로 풀프레임보다 더 큰 비스타비전 센서도 커버 가능합니다.\n16mm 제외 모든 렌즈 원형필터 사용 가능!", "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/vespid-prime-pl-7set-17.webp"}, "GM줌렌즈 세트": {"list": 120000, "featured": true, "title": "Sony GM 줌 렌즈 세트 (16-35 · 24-70 · 70-200)", "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/gm-22.webp"}, "Sony FZ 28-135 G": {"list": 35000, "title": "Sony FE PZ 28-135mm F4 G OSS", "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fz-28-135-g-23.webp"}, "Sigma FE 16-28": {"list": 35000, "title": "Sigma 16-28mm F2.8 DG DN (FE)", "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sigma-fe-16-28-24.webp"}, "Tamron FE 70-180": {"tags": ["마크로 가능"], "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tamron-fe-70-180-26.webp"}, "RED KOMODO-X FULL SET": {"featured": true, "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/red-komodo-x-full-set-07.webp"}, "Sony FX6 FULL SET": {"featured": true, "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fx6-full-set-08.webp"}, "Sony FX3 FULL SET": {"featured": true, "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fx3-full-set-09.webp"}, "Aputure STORM 600C II Stand SET": {"featured": true, "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-storm-600c-ii-stand-set-32.webp"}, "DJI Ronin RS4 Pro": {"featured": true, "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/dji-ronin-rs4-pro-71.webp"}, "Teradek Bolt 600 1:1~1:3": {"featured": true, "image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/teradek-bolt-600-1-1-1-3-65.webp"}, "Sony FX6": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fx6-01.webp"}, "Sony FX3": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fx3-02.webp"}, "Sony FX30": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fx30-03.webp"}, "Sony A7S III": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-a7s-iii-04.webp"}, "Insta360 X5": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/insta360-x5-05.webp"}, "DJI 오즈모 포켓 4p": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/dji-4p-06.webp"}, "Tilta MB-T12 매트박스 4*5.65": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tilta-mb-t12-4-5-65-10.webp"}, "DJI Focus Pro Combo": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/dji-focus-pro-combo-11.webp"}, "Tilta Nucleus M 2 Motor": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tilta-nucleus-m-2-motor-12.webp"}, "Hollywood Blackmagic 원형필터": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/hollywood-blackmagic-13.webp"}, "Blackmist No.5 원형필터": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/blackmist-no-5-14.webp"}, "Nisi True Color VND 원형필터": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/nisi-true-color-vnd-15.webp"}, "4x5.65 클리어 필터": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x5-65-16.webp"}, "4x5.65 ND필터 0.3": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x5-65-16.webp"}, "4x5.65 ND필터 0.6": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x5-65-16.webp"}, "4x5.65 ND필터 0.9": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x5-65-16.webp"}, "4x5.65 ND필터 1.2": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x5-65-16.webp"}, "4x5.65 PL필터": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x5-65-16.webp"}, "Sony FE 16-35GM I": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fe-16-35gm-i-19.webp"}, "Sony FE 24-70 GM I": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fe-24-70-gm-i-20.webp"}, "Sony FE 70-200 GM I": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sony-fe-70-200-gm-i-21.webp"}, "Sigma FE 24-70": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sigma-fe-24-70-25.webp"}, "Sigma Tamron Zoom SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/sigma-tamron-zoom-set-27.webp"}, "Aputure STORM 1200X Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-storm-1200x-stand-set-30.webp"}, "Aputure STORM 1000c Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-storm-1000c-stand-set-31.webp"}, "Aputure STORM 80c Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-storm-80c-stand-set-33.webp"}, "Amaran 300c Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/amaran-300c-stand-set-34.webp"}, "Amaran F22c Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/amaran-f22c-stand-set-35.webp"}, "Amaran F21c Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/amaran-f21c-stand-set-36.webp"}, "Aputure Infinibar PB12 Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-infinibar-pb12-stand-set-37.webp"}, "Aputure Infinibar PB6 4KIT Stand SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-infinibar-pb6-4kit-stand-set-38.webp"}, "Aputure MC Pro 8KIT": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-mc-pro-8kit-39.webp"}, "Aputure MC Pro 단품": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-mc-pro-40.webp"}, "Aputure B7C 8KIT": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-b7c-8kit-41.webp"}, "Aputure B7C": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-b7c-42.webp"}, "Dedo Eflect Reflector 45 SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/dedo-eflect-reflector-45-set-43.webp"}, "Light Bridge CRLS 50 SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/light-bridge-crls-50-set-44.webp"}, "Aputure CF10 프레넬": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/aputure-cf10-45.webp"}, "C-Stand": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/c-stand-46.webp"}, "Combo-Stand": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/combo-stand-47.webp"}, "C-boom": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/c-boom-48.webp"}, "디퓨져 4x4/3x3": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x4-3x3-49.webp"}, "플로피 4x4": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x4-50.webp"}, "울트라바운스 4x4": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4x4-51.webp"}, "미니 슈퍼클램프 4SET": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/4set-52.webp"}, "C클램프 male": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/c-male-53.webp"}, "C클램프 female": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/c-female-54.webp"}, "슈퍼클램프": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/gear-55.webp"}, "매슬리니": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/gear-56.webp"}, "SmallHD INDIE7": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/smallhd-indie7-57.webp"}, "Tv Logic 5인치": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tv-logic-5-58.webp"}, "Portkeys LH5P": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/portkeys-lh5p-59.webp"}, "TV Logic 17인치": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tv-logic-17-60.webp"}, "Accsoon M7 Pro": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/accsoon-m7-pro-63.webp"}, "22인치 프롬프터": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/22-64.webp"}, "Accsoon CineView Master": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/accsoon-cineview-master-66.webp"}, "Accsoon Cineview SE": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/accsoon-cineview-se-68.webp"}, "Accsoon Cineeye 2s WIFI": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/accsoon-cineeye-2s-wifi-69.webp"}, "MovMax Grip Dolly": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/movmax-grip-dolly-70.webp"}, "DJI Ronin RS2 Pro": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/dji-ronin-rs2-pro-72.webp"}, "Tilta Advanced Ring Grip": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tilta-advanced-ring-grip-73.webp"}, "Tilta Ring Grip Plus": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/tilta-ring-grip-plus-74.webp"}, "Synco Xtalk X5 인터컴": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/synco-xtalk-x5-75.webp"}, "Blackmagic Multiview4": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/blackmagic-multiview4-76.webp"}, "테이블 의자 세트": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/gear-77.webp"}, "Backstage Junior Cart": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/backstage-junior-cart-78.webp"}, "베일런 V배터리 15A 230Wh": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/v-15a-230wh-80.webp"}, "V배터리 15A 160Wh": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/v-15a-160wh-81.webp"}, "V배터리 22A 290Wh": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/v-22a-290wh-82.webp"}, "V배터리 2ch Charger": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/v-2ch-charger-83.webp"}, "Gen 4ch 고속차저": {"image": "https://filmhk-rent.htmin123.workers.dev/assets/gear/gen-4ch-84.webp"}};
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

  /* ---------- 사진: 흰 배경 지우기 · 빈 공간 잘라내기 · 같은 여백에 맞추기 · 줄이기 → Supabase 사진 보관함 ----------
     · 사진 테두리에서 이어진 밝은 배경만 지움(흰색 장비 자체는 안 지움) · 배경이 흰색이 아닌 사진은 그대로
     · 결과는 1200×900(4:3) 투명 바탕, 장비가 가운데 84% 안에 들어가게 · WebP(안 되면 PNG) */
  const BUCKET = 'rent-gear', OUT_W = 1200, OUT_H = 900, FILL = 0.84;
  const loadImg = (blob) => new Promise((res, rej) => { const u = URL.createObjectURL(blob); const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('그림 파일이 아니에요')); im.src = u; });
  const loadUrl = (url) => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('올려 둔 사진을 불러오지 못했어요. 원본 파일을 다시 넣어 주세요.')); im.src = url + (url.includes('?') ? '&' : '?') + 'edit=' + Date.now(); });
  const toBlob = (cv, type, q) => new Promise((res) => cv.toBlob(res, type, q));
  /* 사진 한 장 그리기: 자르기(crop, 0~1) → 흰 배경 지우기 → 빈 공간 잘라내기 → 출력 칸(4:3) 가운데에 fill 비율로 */
  function renderPhoto(im, o) {
    o = o || {};
    const outW = o.outW || OUT_W, outH = o.outH || OUT_H, c = o.crop || { x: 0, y: 0, w: 1, h: 1 };
    const W0 = im.naturalWidth, H0 = im.naturalHeight;
    if (!W0 || !H0) throw new Error('그림 크기를 읽지 못했어요');
    const sx = c.x * W0, sy = c.y * H0, sw = Math.max(1, c.w * W0), sh = Math.max(1, c.h * H0);
    const k = Math.min(1, (o.maxSide || 2400) / Math.max(sw, sh)), W = Math.max(1, Math.round(sw * k)), H = Math.max(1, Math.round(sh * k));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), p = d.data;
    // 배경색 = 테두리 픽셀 평균, 테두리가 고르고 밝으면 '흰 배경'
    const border = []; const step = Math.max(1, Math.floor(Math.min(W, H) / 200));
    for (let i = 0; i < W; i += step) border.push(i, (H - 1) * W + i);
    for (let j = 0; j < H; j += step) border.push(j * W, j * W + W - 1);
    let r = 0, g = 0, b = 0, opaque = 0;
    border.forEach((q) => { r += p[q * 4]; g += p[q * 4 + 1]; b += p[q * 4 + 2]; if (p[q * 4 + 3] > 200) opaque++; });
    r /= border.length; g /= border.length; b /= border.length;
    const dist = (q) => Math.max(Math.abs(p[q * 4] - r), Math.abs(p[q * 4 + 1] - g), Math.abs(p[q * 4 + 2] - b));
    const near = border.filter((q) => dist(q) <= 24).length / border.length;
    const alreadyClear = opaque / border.length < 0.5;
    const light = Math.min(r, g, b) >= 220 && Math.max(r, g, b) - Math.min(r, g, b) <= 22 && near >= 0.85;
    let removed = false;
    if (o.removeBg !== false && light && !alreadyClear) {
      // 테두리에서 이어진 배경색 픽셀만 따라 들어가며 지움 (흰색 장비 자체는 그대로, 가장자리는 부드럽게)
      const T0 = 10, T1 = 42, seen = new Uint8Array(W * H), q = new Int32Array(W * H); let head = 0, tail = 0;
      const push = (i) => { if (!seen[i] && dist(i) <= T1) { seen[i] = 1; q[tail++] = i; } };
      for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i); }
      for (let j = 0; j < H; j++) { push(j * W); push(j * W + W - 1); }
      while (head < tail) {
        const i = q[head++], dd = dist(i), a = dd <= T0 ? 0 : Math.round(255 * (dd - T0) / (T1 - T0));
        if (a < p[i * 4 + 3]) p[i * 4 + 3] = a;
        if (dd > T0 + 6) continue;
        const xx = i % W;
        if (xx > 0) push(i - 1); if (xx < W - 1) push(i + 1); if (i >= W) push(i - W); if (i < W * (H - 1)) push(i + W);
      }
      x.putImageData(d, 0, 0); removed = true;
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    const keep = (i) => removed || alreadyClear ? p[i * 4 + 3] > 64 : (light ? dist(i) > 24 : true);   // 희미하게 남은 그림자 · 선은 크기 계산에서 뺌
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (keep(j * W + i)) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const fill = o.fill || (removed || alreadyClear || light ? FILL : 1);
    const sc = Math.min(outW * fill / bw, outH * fill / bh);
    const out = document.createElement('canvas'); out.width = outW; out.height = outH;
    const oc = out.getContext('2d'); oc.imageSmoothingEnabled = true; oc.imageSmoothingQuality = 'high';
    if (!removed && light && !alreadyClear) { oc.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`; oc.fillRect(0, 0, outW, outH); }
    oc.drawImage(cv, x0, y0, bw, bh, (outW - bw * sc) / 2, (outH - bh * sc) / 2, bw * sc, bh * sc);
    return { canvas: out, removed, light, small: (sc / k) * (OUT_W / outW) > 2.2 };
  }
  async function processImage(im, o) {
    const r = renderPhoto(im, o);
    let blob = await toBlob(r.canvas, 'image/webp', 0.86);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(r.canvas, 'image/png');
    return Object.assign(r, { blob });
  }

  /* ---------- 사진 다듬기 창 (파워포인트 자르기처럼) ----------
     원본 위 상자: 안쪽을 끌면 이동, 모서리 · 변 손잡이를 끌면 크기 · 오른쪽에 카드 미리보기 · 장비 크기 · 흰 배경 지우기 */
  const CROP_CSS = `
  .fhkc-bg{position:fixed;inset:0;z-index:2147483001;background:rgba(8,8,10,.72);display:flex;align-items:center;justify-content:center;padding:16px}
  .fhkc{width:min(980px,100%);max-height:100%;overflow:auto;background:#fff;color:#111;border-radius:8px;font:14px/1.5 'Noto Sans KR',system-ui,sans-serif;box-shadow:0 24px 70px rgba(0,0,0,.45)}
  .fhkc *{box-sizing:border-box}
  .fhkc-hd{display:flex;align-items:baseline;gap:10px;padding:14px 18px;border-bottom:1px solid #e5e5e5}
  .fhkc-hd b{font-size:16px}.fhkc-hd small{color:#888}
  .fhkc-body{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:20px;padding:18px}
  @media(max-width:760px){.fhkc-body{grid-template-columns:minmax(0,1fr);padding:12px}.fhkc-bg{padding:8px}.fhkc-side{order:-1}.fhkc-pv{max-width:260px}.fhkc-tip{display:none}}
  .fhkc-wrap{justify-self:center;align-self:start;padding:14px;overflow:hidden;background:#1d1d1f;border-radius:4px}
  .fhkc-stage{position:relative;overflow:visible;background:#F3F2F0 conic-gradient(#e7e7e7 25%,#f6f6f6 0 50%,#e7e7e7 0 75%,#f6f6f6 0) 0 0/16px 16px;touch-action:none;user-select:none;-webkit-user-select:none}
  .fhkc-stage img{display:block;width:100%;height:100%;pointer-events:none}
  .fhkc-box{position:absolute;box-shadow:0 0 0 9999px rgba(0,0,0,.5);outline:1.5px solid #fff;cursor:move}
  .fhkc-box::before,.fhkc-box::after{content:"";position:absolute;inset:0;pointer-events:none;border:0 solid rgba(255,255,255,.45)}
  .fhkc-box::before{left:33.33%;right:33.33%;border-left-width:1px;border-right-width:1px}
  .fhkc-box::after{top:33.33%;bottom:33.33%;border-top-width:1px;border-bottom-width:1px}
  .fhkc-box i{position:absolute;width:16px;height:16px;background:#fff;border:1.5px solid #111;border-radius:2px;transform:translate(-50%,-50%)}
  .fhkc-box i[data-h=nw]{left:0;top:0;cursor:nwse-resize}.fhkc-box i[data-h=n]{left:50%;top:0;cursor:ns-resize}.fhkc-box i[data-h=ne]{left:100%;top:0;cursor:nesw-resize}
  .fhkc-box i[data-h=e]{left:100%;top:50%;cursor:ew-resize}.fhkc-box i[data-h=se]{left:100%;top:100%;cursor:nwse-resize}.fhkc-box i[data-h=s]{left:50%;top:100%;cursor:ns-resize}
  .fhkc-box i[data-h=sw]{left:0;top:100%;cursor:nesw-resize}.fhkc-box i[data-h=w]{left:0;top:50%;cursor:ew-resize}
  .fhkc-side{display:flex;flex-direction:column;gap:12px}
  .fhkc-side small{color:#888;font-size:12px;letter-spacing:.04em}
  .fhkc-pv{width:100%;aspect-ratio:4/3;background:#F3F2F0;border-top:1px solid #111}
  .fhkc-pv canvas{width:100%;height:100%;display:block}
  .fhkc-side label{display:flex;align-items:center;gap:10px;font-weight:600;font-size:13px}
  .fhkc-side input[type=range]{flex:1;accent-color:#FF4A12}
  .fhkc-side input[type=checkbox]{width:17px;height:17px;accent-color:#FF4A12}
  .fhkc-side output{min-width:3em;text-align:right;font-variant-numeric:tabular-nums}
  .fhkc-tip{margin:0;font-size:12px;color:#888;line-height:1.6}
  .fhkc-ft{display:flex;gap:8px;align-items:center;padding:14px 18px;border-top:1px solid #e5e5e5}
  .fhkc-ft .sp{margin-right:auto}
  .fhkc-ft button{border:1px solid #111;background:#111;color:#fff;border-radius:4px;padding:10px 18px;font:700 14px 'Noto Sans KR',sans-serif;cursor:pointer}
  .fhkc-ft button.ghost{background:#fff;color:#111}
  .fhkc-ft button.link{border:0;background:none;color:#888;text-decoration:underline;padding:10px 0}
  `;
  function cropper(im, init) {
    if (!document.getElementById('fhkc-css')) { const st = document.createElement('style'); st.id = 'fhkc-css'; st.textContent = CROP_CSS; document.head.appendChild(st); }
    return new Promise((resolve) => {
      const FULL = { x: 0, y: 0, w: 1, h: 1 };
      const state = { crop: Object.assign({}, init.crop || FULL), fill: init.fill || FILL, removeBg: init.removeBg !== false };
      const bg = document.createElement('div'); bg.className = 'fhkc-bg';
      bg.innerHTML = `<div class="fhkc" role="dialog" aria-modal="true" aria-label="사진 다듬기">
        <div class="fhkc-hd"><b>사진 다듬기</b><small>상자를 끌어 옮기고, 모서리 · 변을 끌어 자르기</small></div>
        <div class="fhkc-body">
          <div class="fhkc-wrap"><div class="fhkc-stage"><img alt=""><div class="fhkc-box" tabindex="0" aria-label="자르기 상자 (화살표로 이동)"><i data-h="nw"></i><i data-h="n"></i><i data-h="ne"></i><i data-h="e"></i><i data-h="se"></i><i data-h="s"></i><i data-h="sw"></i><i data-h="w"></i></div></div></div>
          <div class="fhkc-side">
            <small>홈페이지 카드 미리보기</small>
            <div class="fhkc-pv"><canvas width="480" height="360"></canvas></div>
            <label>장비 크기<input type="range" min="40" max="100" step="1" name="fill"><output></output></label>
            <label><input type="checkbox" name="rm">흰 배경 지우기</label>
            <p class="fhkc-tip">가격 글자 같은 건 상자 밖으로 빼고 자르세요. 장비 주변 빈 공간은 알아서 잘라내고, 장비 크기는 위 막대로 정해요.</p>
          </div>
        </div>
        <div class="fhkc-ft"><button type="button" class="link sp" data-c="reset">처음대로</button><button type="button" class="ghost" data-c="cancel">취소</button><button type="button" data-c="ok">이대로 올리기</button></div>
      </div>`;
      document.body.appendChild(bg);
      const stage = bg.querySelector('.fhkc-stage'), img = stage.querySelector('img'), box = stage.querySelector('.fhkc-box');
      const pvc = bg.querySelector('.fhkc-pv canvas'), pv = pvc.getContext('2d');
      const fillIn = bg.querySelector('[name=fill]'), fillOut = bg.querySelector('.fhkc-side output'), rm = bg.querySelector('[name=rm]');
      img.src = im.src;
      // 미리보기는 작은 사본으로 (끌 때 빠르게)
      const small = document.createElement('canvas'); { const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)); small.width = Math.max(1, Math.round(im.naturalWidth * k)); small.height = Math.max(1, Math.round(im.naturalHeight * k)); small.getContext('2d').drawImage(im, 0, 0, small.width, small.height); }
      const smallIm = { naturalWidth: small.width, naturalHeight: small.height };
      let dw = 1, dh = 1;
      function layout() {
        const host = stage.parentElement.parentElement, maxW = Math.min(560, (host.clientWidth || 588) - 28), maxH = Math.min(440, window.innerHeight - 280);
        const s = Math.min(maxW / im.naturalWidth, Math.max(160, maxH) / im.naturalHeight);
        dw = Math.round(im.naturalWidth * s); dh = Math.round(im.naturalHeight * s);
        stage.style.width = dw + 'px'; stage.style.height = dh + 'px'; paintBox();
      }
      function paintBox() { const c = state.crop; Object.assign(box.style, { left: c.x * dw + 'px', top: c.y * dh + 'px', width: c.w * dw + 'px', height: c.h * dh + 'px' }); }
      let raf = 0;
      function paintPreview() {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          try {
            const r = renderPhoto(Object.assign(small, smallIm), { crop: state.crop, fill: state.fill, removeBg: state.removeBg, maxSide: 900, outW: 480, outH: 360 });
            pv.clearRect(0, 0, 480, 360); pv.drawImage(r.canvas, 0, 0);
          } catch (_) {}
        });
      }
      function sync() { fillIn.value = Math.round(state.fill * 100); fillOut.textContent = fillIn.value + '%'; rm.checked = state.removeBg; paintBox(); paintPreview(); }
      // 끌기: 상자 안 = 이동, 손잡이 = 크기
      const MIN = 0.04; let drag = null;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      box.addEventListener('pointerdown', (e) => {
        e.preventDefault(); box.setPointerCapture(e.pointerId);
        drag = { h: (e.target.dataset && e.target.dataset.h) || 'move', x: e.clientX, y: e.clientY, c: Object.assign({}, state.crop) };
      });
      box.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const dx = (e.clientX - drag.x) / dw, dy = (e.clientY - drag.y) / dh, c0 = drag.c, h = drag.h;
        let { x, y, w, h: hh } = c0;
        if (h === 'move') { x = clamp(c0.x + dx, 0, 1 - c0.w); y = clamp(c0.y + dy, 0, 1 - c0.h); }
        else {
          if (h.includes('w')) { const nx = clamp(c0.x + dx, 0, c0.x + c0.w - MIN); w = c0.w + (c0.x - nx); x = nx; }
          if (h.includes('e')) { w = clamp(c0.w + dx, MIN, 1 - c0.x); }
          if (h.includes('n')) { const ny = clamp(c0.y + dy, 0, c0.y + c0.h - MIN); hh = c0.h + (c0.y - ny); y = ny; }
          if (h.includes('s')) { hh = clamp(c0.h + dy, MIN, 1 - c0.y); }
        }
        state.crop = { x, y, w, h: hh }; paintBox(); paintPreview();
      });
      const end = () => { drag = null; };
      box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
      box.addEventListener('keydown', (e) => {
        const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!m) return;
        e.preventDefault(); const c = state.crop, st = e.shiftKey ? 0.05 : 0.01;
        state.crop = { x: clamp(c.x + m[0] * st, 0, 1 - c.w), y: clamp(c.y + m[1] * st, 0, 1 - c.h), w: c.w, h: c.h }; paintBox(); paintPreview();
      });
      fillIn.addEventListener('input', () => { state.fill = +fillIn.value / 100; fillOut.textContent = fillIn.value + '%'; paintPreview(); });
      rm.addEventListener('change', () => { state.removeBg = rm.checked; paintPreview(); });
      const finish = (v) => { window.removeEventListener('resize', layout); document.removeEventListener('keydown', onKey, true); bg.remove(); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(null); } };
      document.addEventListener('keydown', onKey, true);
      bg.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]'); if (!b) return;
        if (b.dataset.c === 'cancel') finish(null);
        else if (b.dataset.c === 'reset') { state.crop = Object.assign({}, FULL); state.fill = FILL; state.removeBg = true; sync(); }
        else if (b.dataset.c === 'ok') finish({ crop: state.crop, fill: state.fill, removeBg: state.removeBg });
      });
      window.addEventListener('resize', layout);
      const go = () => { layout(); sync(); setTimeout(() => box.focus(), 30); };
      if (img.complete) go(); else img.onload = go;
    });
  }
  async function uploadImage(blob, model) {
    const c = window.filmhkSupabase;
    if (!c || !c.storage) throw new Error('관리자 로그인 · 클라우드 연결 뒤에 올릴 수 있어요');
    const ext = blob.type === 'image/webp' ? 'webp' : 'png';
    const key = (model.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'gear') + '-' + Date.now().toString(36);
    const path = `gear/${key}.${ext}`;
    const { error } = await c.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
    if (error) throw new Error(/bucket|not found/i.test(error.message || '') ? '사진 보관함(rent-gear)이 아직 없어요. Supabase 에서 설정 SQL 을 먼저 실행해 주세요.' : /row-level|policy|permission|unauthor/i.test(error.message || '') ? '사진을 올릴 권한이 없어요. 로그인 상태와 사진 보관함 설정을 확인해 주세요.' : (error.message || '올리지 못했어요'));
    return c.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
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
          <div class="w fhkw-ph"><span class="lb">사진</span>
            <div class="fhkw-drop" tabindex="0" role="button" aria-label="사진 넣기: 끌어다 놓기, 눌러서 고르기, 붙여넣기">
              <div class="th">${w0.image ? `<img src="${H(w0.image)}" alt="">` : '<span>사진 없음</span>'}</div>
              <p><b>끌어다 놓기 · 붙여넣기(Ctrl+V / ⌘V)</b><br>또는 눌러서 고르기 · 흰 배경은 지우고, 장비 크기를 다른 사진과 같게 맞춰요</p>
            </div>
            <div class="fhkw-ph-opt"><button type="button" data-a="recrop">자르기 · 크기 다시 다듬기</button><button type="button" data-a="rmimg">사진 빼기</button><span class="fhkw-ph-msg" role="status"></span></div>
            <details><summary>사진 주소 직접 넣기</summary><input name="image" value="${H(w0.image || '')}" placeholder="https://…"></details>
            <input type="file" accept="image/*" hidden>
          </div>
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
      ['title', 'info', 'image'].forEach((k) => { const v = N(g(k).value); if (v) w[k] = v; });   // 사진은 올리기가 끝난 주소만 저장
      const parts = g('parts').value.split('\n').map(N).filter(Boolean); if (parts.length) w.parts = parts;
      return w;
    };
    let pending = '', lastSrc = null, busy = false;
    const draw = () => { const w = val(); if (pending) w.image = pending; pv.innerHTML = preview(model, info, w); };
    f.addEventListener('input', draw); f.addEventListener('change', draw); draw();
    // 사진: 끌어다 놓기 · 고르기 · 붙여넣기 → 처리 → 바로 올림
    const drop = bg.querySelector('.fhkw-drop'), th = drop.querySelector('.th'), fileIn = bg.querySelector('.fhkw-ph input[type=file]'), phMsg = bg.querySelector('.fhkw-ph-msg');
    const say = (t, ok) => { phMsg.textContent = t; phMsg.classList.toggle('ok', !!ok); };
    let lastEdit = null;   // 마지막으로 다듬은 원본과 설정 (다시 다듬기용)
    async function takePhoto(blob) {
      if (!blob || busy) return;
      if (!/^image\//.test(blob.type || '')) { say('그림 파일만 넣을 수 있어요'); return; }
      let im; try { im = await loadImg(blob); } catch (err) { say(err.message); return; }
      editPhoto(im, {});
    }
    async function editPhoto(im, init) {
      if (busy) return;
      busy = true; say('');
      const choice = await cropper(im, init);
      if (!choice) { busy = false; return; }
      lastEdit = { im, choice }; lastSrc = im;
      drop.classList.add('busy');
      try {
        const r = await processImage(im, choice);
        if (pending) URL.revokeObjectURL(pending);
        pending = URL.createObjectURL(r.blob);
        th.innerHTML = `<img src="${pending}" alt="">`; draw();
        say('올리는 중…');
        const url = await uploadImage(r.blob, model);
        f.elements.image.value = url; draw();
        say(`올렸어요 ✓ ${Math.round(r.blob.size / 1024)}KB${r.removed ? ' · 흰 배경 지움' : r.light ? '' : ' · 배경 있는 사진이라 그대로'}${r.small ? ' · 원본이 작아서 조금 흐릴 수 있어요' : ''}`, true);
      } catch (err) { say((err && err.message) || '사진을 처리하지 못했어요'); }
      finally { busy = false; drop.classList.remove('busy'); }
    }
    drop.addEventListener('click', () => fileIn.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });
    fileIn.addEventListener('change', () => { const fl = fileIn.files && fileIn.files[0]; if (fl) takePhoto(fl); fileIn.value = ''; });
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => { const fl = [...(e.dataTransfer && e.dataTransfer.files || [])].find((x) => /^image\//.test(x.type)); if (fl) takePhoto(fl); else say('그림 파일을 놓아 주세요'); });
    const onPaste = (e) => {
      const it = [...((e.clipboardData && e.clipboardData.items) || [])].find((x) => x.kind === 'file' && /^image\//.test(x.type));
      if (!it) return;   // 글자 붙여넣기는 그대로
      e.preventDefault(); takePhoto(it.getAsFile());
    };
    document.addEventListener('paste', onPaste);
    bg.querySelector('[data-a="recrop"]').addEventListener('click', async () => {
      if (lastEdit) { editPhoto(lastEdit.im, lastEdit.choice); return; }
      const url = N(f.elements.image.value); if (!url) { say('먼저 사진을 넣어 주세요'); return; }
      try { say('사진을 불러오는 중…'); const im = await loadUrl(url); say(''); editPhoto(im, {}); } catch (err) { say(err.message); }
    });
    bg.querySelector('[data-a="rmimg"]').addEventListener('click', () => { f.elements.image.value = ''; if (pending) URL.revokeObjectURL(pending); pending = ''; lastSrc = null; lastEdit = null; th.innerHTML = '<span>사진 없음</span>'; say(''); draw(); });
    const close = () => { bg.remove(); document.removeEventListener('keydown', esc); document.removeEventListener('paste', onPaste); if (pending) URL.revokeObjectURL(pending); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    bg.addEventListener('click', async (e) => {
      if (e.target === bg || e.target.closest('.fhkw-x') || e.target.closest('[data-a="close"]')) { close(); return; }
      if (!e.target.closest('[data-a="save"]')) return;
      if (busy) { bg.querySelector('.msg').textContent = '사진을 올리는 중이에요. 잠시 뒤 다시 눌러 주세요.'; return; }
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
