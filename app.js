/* ════════════════════════════════════════════════════════════════
   note 앱 — 1단계 (로그인 · 2단계 인증 · 설정)
   ════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const VERSION = 'note 1.3 · 2026-09-21';

/* ───────── 유틸 ───────── */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const WD = '일월화수목금토';
const fmtLong = d => `${d.getMonth()+1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
const fmtDT = iso => { if (!iso) return '—'; const d = new Date(iso); const t = new Date(); const same = d.toDateString() === t.toDateString();
  const y = new Date(t); y.setDate(t.getDate()-1);
  return (same ? '오늘' : d.toDateString() === y.toDateString() ? '어제' : `${d.getMonth()+1}/${d.getDate()}`) + ` ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = iso => { if (!iso) return '—'; const d = new Date(iso); return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`; };
const telNorm = v => { const d = String(v||'').replace(/\D/g,''); if (!d) return ''; if (!/^01\d{8,9}$/.test(d)) return null;
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`; };
const pwOk = p => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
const dObj = s => { const [y,m,d] = String(s||'').split('-').map(Number); return new Date(y, (m||1)-1, d||1); };
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const TODAY = () => isoOf(new Date());
const fmtRow = s => { const d = dObj(s); return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${WD[d.getDay()]}`; };
const fmtMD  = s => { const d = dObj(s); return `${d.getMonth()+1}/${d.getDate()}(${WD[d.getDay()]})`; };
const fmtLongIso = s => { const d = dObj(s); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
const SLOTS = ['08','09','10','11','12','13','14','15','16','17','18','19','20','21'];
const slotLabel = h => `${h}:00 ~ ${pad(+h+1)}:00`;
const emptySched = () => Array(14).fill('');
const schedAt = (r, i) => (r.schedule && r.schedule[i]) || '';
const store = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };

const ICON = {
  home:'<path d="M3.5 10.5 12 3.5l8.5 7V20.5h-6v-6h-5v6h-6z"/>',
  doc:'<path d="M6.5 3h8l4 4v14h-12z"/><path d="M14.5 3v4h4"/><path d="M9.5 12.5h6M9.5 16h6"/>',
  note:'<path d="M4 4.5h16v11.5H9.5L4 20z"/><path d="M8 8.5h8M8 12h5"/>',
  gear:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7"/>',
  phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
  shield:'<path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  logout:'<path d="M14.5 4h4.5v16h-4.5M10 8l-4 4 4 4M6 12h9.5"/>',
  trash:'<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  alert:'<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  send:'<path d="M20.5 3.5 3.5 10.5l7 3 3 7z"/><path d="m10.5 13.5 4-4"/>',
  back:'<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  pin:'<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  list:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  print:'<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.5"/><path d="M7 14h10v6.5H7z"/>',
  camera:'<path d="M3.5 8h3.5l2-3h6l2 3h3.5v11.5h-17z"/><circle cx="12" cy="13.5" r="3.5"/>',
  image:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m20.5 16-5-5-8.5 8"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  import:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  chevl:'<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chevr:'<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
};
const ic = (n, cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]||''}</svg>`;

/* ───────── 상태 ───────── */
const S = {
  screen:'loading', route:'home', stab:'me',
  me:null, email:'', factorId:null, enroll:null, reEnroll:null, factors:[],
  users:null, mail:null, sms:null, settings:{},
  reports:null, rid:null, rcur:null, pane:'form', saved:'',
  meetings:null, mcur:null, photos:[], urls:{}, lb:null, sends:null, pub:null, pubToken:'',
  f:{ rMonth:'all', rStatus:'all', rAuthor:'all', mq:'' },
  err:'',
};
const isAdmin = () => S.me && S.me.role === 'admin' && S.me.active;

/* ───────── Supabase ───────── */
const CFG = window.NOTE_CONFIG || {};
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(CFG.SUPABASE_URL || '') && !/YOUR-/.test((CFG.SUPABASE_URL||'') + (CFG.SUPABASE_KEY||'')) && (CFG.SUPABASE_KEY || '').length > 20;
let sb = null;
if (configured && window.supabase){
  sb = window.supabase.createClient(CFG.SUPABASE_URL.replace(/\/$/,''), CFG.SUPABASE_KEY, {
    auth:{ persistSession:true, autoRefreshToken:true, storageKey:'note-auth', detectSessionInUrl:false },
  });
}
const DOMAIN = CFG.LOGIN_DOMAIN || 'note.local';

function dbMsg(error){
  if (!error) return '';
  const c = error.code || '', m = error.message || '';
  if (c === '23505') return '이미 목록에 있어요';
  if (c === '23514') return '형식을 확인하세요';
  if (c === '42501' || /row-level security|permission denied/i.test(m)) return '권한이 없습니다';
  if (/JWT|jwt expired/i.test(m)) return '로그인이 만료되었습니다. 다시 로그인하세요';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return '인터넷 연결을 확인하세요';
  return m || '처리하지 못했습니다';
}
async function edge(name, body={}){
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error){
    let msg = error.message || '';
    try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch(e){}
    if (/Failed to send a request|Failed to fetch/i.test(msg)) msg = `서버 함수(${name})에 연결하지 못했습니다. 배포됐는지 확인하세요`;
    if (/not found|404/i.test(msg)) msg = `서버 함수(${name})가 아직 배포되지 않았습니다`;
    throw new Error(msg);
  }
  if (!data || !data.ok) throw new Error((data && data.error) || '처리하지 못했습니다');
  return data;
}
const fn = (action, body={}) => edge('admin-users', Object.assign({ action }, body));
let busyN = 0;
async function busy(p){ busyN++; $('#busy').hidden = false; try { return await p; } finally { if (--busyN <= 0){ busyN = 0; $('#busy').hidden = true; } } }
async function lockBtn(btn, label, work){
  const old = btn ? btn.innerHTML : ''; if (btn){ btn.disabled = true; btn.textContent = label; }
  try { return await busy(work()); }
  finally { if (btn && btn.isConnected){ btn.disabled = false; btn.innerHTML = old; } }
}

/* ───────── 흐름: 로그인 → 2단계 → 직원 정보 → 첫 비번 변경 → 앱 ───────── */
const pubToken = () => { const m = String(location.hash || '').match(/^#\/r\/([A-Za-z0-9_-]{20,200})$/); return m ? m[1] : ''; };
async function boot(){
  if (!configured){ S.screen = 'setup'; return render(); }
  const tk = pubToken();
  if (tk){ if (!sb){ S.screen='setup'; return render(); } return openPublic(tk); }
  if (!sb){ S.screen = 'setup'; S.err = 'Supabase 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요.'; return render(); }
  const { data } = await sb.auth.getSession();
  if (!data.session){ S.screen = 'login'; return render(); }
  S.email = data.session.user.email || '';
  await afterPassword();
}
async function afterPassword(){
  const { data: lv, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error){ return toLogin(dbMsg(error)); }
  if (lv.currentLevel === 'aal2') return loadMe();
  const { data: fl, error: fe } = await sb.auth.mfa.listFactors();
  if (fe) return toLogin(dbMsg(fe));
  const verified = (fl.totp || []).filter(f => f.status === 'verified');
  if (verified.length){ S.factorId = verified[0].id; S.screen = 'otp'; S.err = ''; return render(); }
  return startEnroll(false);
}
async function startEnroll(isRe){
  try {
    const { data: fl } = await sb.auth.mfa.listFactors();
    for (const f of (fl && fl.all || []).filter(f => f.factor_type === 'totp' && f.status !== 'verified')) await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType:'totp', friendlyName:'note ' + new Date().toISOString().slice(0,16).replace('T',' ') });
    if (error) throw error;
    const en = { id:data.id, qr:data.totp.qr_code, secret:data.totp.secret };
    if (isRe){ S.reEnroll = en; render(); setTimeout(() => { const c = $('#re-code'); if (c) c.focus(); }, 30); }
    else { S.enroll = en; S.screen = 'enroll'; S.err = ''; render(); }
  } catch(e){
    if (isRe) toast('등록을 시작하지 못했습니다: ' + dbMsg(e));
    else toLogin('인증 앱 등록을 시작하지 못했습니다: ' + dbMsg(e));
  }
}
async function loadMe(){
  const { data: u } = await sb.auth.getUser();
  if (!u || !u.user) return toLogin('로그인이 만료되었습니다');
  S.email = u.user.email || '';
  const { data, error } = await sb.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
  if (error || !data){ S.screen = 'noprofile'; S.err = error ? dbMsg(error) : ''; return render(); }
  S.me = data;
  if (data.must_change_pw){ S.screen = 'forcepw'; S.err = ''; return render(); }
  S.screen = 'app'; render();
  preload();
}
async function preload(){
  await Promise.all([loadSettings(), loadRcpt('mail'), loadRcpt('sms'), loadReports(), loadMemos(), isAdmin() ? loadUsers() : null]);
  if (S.screen === 'app') render();
}
function toLogin(msg){ clearTimeout(saveT); S.screen = 'login'; S.err = msg || ''; S.me = null; S.users = S.mail = S.sms = S.reports = S.meetings = null;
  S.route = 'home'; S.stab = 'me'; S.reEnroll = null; S.factors = []; S.rcur = null; S.rid = null; S.pane = 'form'; S.saved = '';
  S.mcur = null; S.lb = null; S.photos = []; S.urls = {}; S.sends = null; S.pub = null; clearTimeout(mSaveT);
  S.f = { rMonth:'all', rStatus:'all', rAuthor:'all', mq:'' }; closeOv(); render(); }
async function logout(){ try { await sb.auth.signOut({ scope:'local' }); } catch(e){} toLogin(''); }

async function loadSettings(){ const { data } = await sb.from('app_settings').select('key,value'); S.settings = Object.fromEntries((data||[]).map(r => [r.key, r.value])); }
async function loadRcpt(kind){
  const t = kind === 'mail' ? 'mail_recipients' : 'sms_recipients';
  const { data, error } = await sb.from(t).select('*').order('created_at');
  if (error){ toast(dbMsg(error)); return; }
  S[kind] = data || [];
}
async function loadUsers(){ try { S.users = (await fn('list')).users; } catch(e){ S.users = []; toast(e.message); } }

/* ───────── 보고서 : 데이터 ───────── */
const REP_COLS = 'id,author,author_name,author_dept,author_title,report_date,place,main_task,attendees,schedule,body,etc,status,sent_at,created_at,updated_at';

async function loadReports(){
  const { data, error } = await sb.from('reports').select(REP_COLS)
    .order('report_date', { ascending:false }).order('created_at', { ascending:false }).limit(400);
  if (error){ toast(dbMsg(error)); if (!S.reports) S.reports = []; return; }
  S.reports = (data || []).map(fixRep);
}
function fixRep(r){
  let s = r.schedule;
  if (!Array.isArray(s)) s = emptySched();
  if (s.length !== 14) s = emptySched().map((_,i) => String(s[i] ?? ''));
  return Object.assign({}, r, { schedule: s.map(x => String(x ?? '')) });
}
const repById = id => (S.reports || []).find(r => r.id === id);
const repMine = r => !!r && r.author === S.me.id;
const authorOf = r => `${r.author_name || ''} ${r.author_title || ''}`.trim() || '(이름 없음)';

function newReport(date){
  const u = S.me;
  return { id:null, author:u.id, author_name:u.name || '', author_dept:u.dept || '', author_title:u.title || '',
    report_date: date || TODAY(), place:'', main_task:'', attendees:'',
    schedule: emptySched(), body:'', etc:'', status:'draft', sent_at:null };
}

function repPayload(r){
  return { report_date:r.report_date, place:(r.place||'').trim(), main_task:(r.main_task||'').trim(),
    attendees:(r.attendees||'').trim(), schedule:r.schedule.map(x => String(x||'').slice(0,120)),
    body:r.body || '', etc:r.etc || '' };
}

let saveT = null, saving = false, savePend = false;
function markSaving(txt){ S.saved = txt; const el = $('#saved'); if (el) el.textContent = txt; }
function queueSave(){
  markSaving('저장할 내용이 있어요');
  clearTimeout(saveT);
  saveT = setTimeout(() => { saveReport().catch(e => toast(e.message || String(e))); }, 1200);
}
async function saveReport(){
  const r = S.rcur;
  if (!r || !repMine(r)) return null;
  if (saving){ savePend = true; return null; }
  if (!r.report_date){ markSaving('일자를 정해 주세요'); return null; }
  saving = true; markSaving('저장 중…');
  try {
    const row = repPayload(r);
    let out;
    if (r.id){
      if (r.status === 'sent') row.status = 'edited';
      const { data, error } = await sb.from('reports').update(row).eq('id', r.id).select(REP_COLS).maybeSingle();
      if (error) throw new Error(dbMsg(error));
      if (!data) throw new Error('저장하지 못했습니다. 다시 로그인해 주세요');
      out = fixRep(data);
    } else {
      Object.assign(row, { author:S.me.id, author_name:S.me.name || '', author_dept:S.me.dept || '', author_title:S.me.title || '' });
      const { data, error } = await sb.from('reports').insert(row).select(REP_COLS).maybeSingle();
      if (error) throw new Error(dbMsg(error));
      if (!data) throw new Error('저장하지 못했습니다. 다시 로그인해 주세요');
      out = fixRep(data);
      r.id = out.id; S.rid = out.id;
    }
    r.status = out.status; r.sent_at = out.sent_at; r.updated_at = out.updated_at;
    const i = (S.reports || []).findIndex(x => x.id === out.id);
    if (i >= 0) S.reports[i] = Object.assign({}, out, repPayload(r));
    else if (S.reports) S.reports.unshift(Object.assign({}, out, repPayload(r)));
    markSaving('저장됨 ' + fmtDT(new Date().toISOString()));
    return out;
  } finally {
    saving = false;
    if (savePend){ savePend = false; queueSave(); }
  }
}
async function flushSave(){ clearTimeout(saveT); if (S.rcur && repMine(S.rcur)) await saveReport(); if (S.mcur) await saveMemo(); }

/* ───────── 보고하기 ───────── */
async function loadSends(reportId){
  const { data, error } = await sb.from('report_sends').select('*').eq('report', reportId).order('sent_at', { ascending:false }).limit(60);
  if (error){ toast(dbMsg(error)); return []; }
  return data || [];
}
function sendDlg(r){
  const mail = (S.mail || []), sms = (S.sms || []);
  const pick = (kind, list) => list.length
    ? `<div class="picks">${list.map(x => `<label class="pick"><input type="checkbox" data-sendpick="${kind}" value="${esc(x.id)}" ${x.is_default?'checked':''}>
        <span><b>${esc(x.name)}</b>${x.dept?` <span class="hint">${esc(x.dept)}</span>`:''}<br><span class="mono ad">${esc(kind==='mail'?x.email:x.phone)}</span></span></label>`).join('')}</div>`
    : `<div class="hint" style="padding:8px 0">${kind==='mail'?'메일':'문자'} 수신자가 없습니다. ${isAdmin()?'설정 › '+(kind==='mail'?'메일':'문자')+' 수신자에서 추가하세요.':'관리자에게 요청하세요.'}</div>`;
  const filled = r.schedule.filter(x => x.trim()).length;
  const warn = [];
  if (!r.place.trim()) warn.push('장소');
  if (!r.main_task.trim()) warn.push('주요업무');
  if (!r.body.trim()) warn.push('주요 업무/결과');
  return dlg('보고하기', `
    <div class="sendsum"><b>${fmtLongIso(r.report_date)}</b> · ${esc(r.place || '장소 미입력')} · ${esc(r.main_task || '주요업무 미입력')}
      <span class="hint">업무 일정 ${filled}/14칸</span></div>
    ${warn.length ? `<div class="warn" style="margin:12px 0">${ic('alert')}<span><b>${warn.join(' · ')}</b>이(가) 비어 있습니다. 그래도 보낼 수 있지만 빈칸으로 갑니다.</span></div>` : ''}
    ${r.status !== 'draft' ? `<div class="warn" style="margin:12px 0">${ic('clock')}<span>이미 한 번 보고한 보고서입니다. 다시 보내면 새 PDF 와 새 링크가 갑니다.</span></div>` : ''}
    <div class="sendcol"><div class="lbl">${ic('mail')} 메일 — 양식 그대로의 A4 PDF 가 첨부됩니다</div>${pick('mail', mail)}</div>
    <div class="sendcol"><div class="lbl">${ic('sms')} 문자 — 요약과 <b>7일</b> 동안 열리는 보기 링크가 갑니다</div>${pick('sms', sms)}</div>
    <div class="errtx" id="send-err" role="alert"></div>`,
    `<button class="btn" data-act="closeOv">취소</button><button class="btn primary" data-act="sendGo">${ic('send')}보내기</button>`);
}
async function doSend(btn){
  const r = S.rcur; if (!r) return;
  const mail = $$('[data-sendpick="mail"]:checked').map(x => x.value);
  const sms  = $$('[data-sendpick="sms"]:checked').map(x => x.value);
  const err = m => { const el = $('#send-err'); if (el) el.textContent = m; };
  if (!mail.length && !sms.length) return err('받는 사람을 한 명 이상 고르세요');
  await lockBtn(btn, '보내는 중…', async () => {
    try {
      err('');
      await flushSave();
      if (!r.id) return err('보고서를 먼저 저장해 주세요');
      let pdf_path = '';
      if (mail.length){
        const { bytes, name } = await makeReportPdf(r);
        pdf_path = `${S.me.id}/${r.id}/${Date.now()}.pdf`;
        const { error } = await sb.storage.from('report-pdfs').upload(pdf_path, new Blob([bytes], { type:'application/pdf' }), { contentType:'application/pdf' });
        if (error) return err('PDF 를 올리지 못했습니다: ' + (error.message || ''));
      }
      const out = await edge('send-report', { report:r.id, pdf_path, mail, sms, link_days:7 });
      const res = out.results || [];
      const ok = res.filter(x => x.ok), bad = res.filter(x => !x.ok);
      closeOv();
      if (ok.length){ r.status = 'sent'; r.sent_at = new Date().toISOString();
        const i = (S.reports||[]).findIndex(x => x.id === r.id); if (i >= 0){ S.reports[i].status = 'sent'; S.reports[i].sent_at = r.sent_at; } }
      S.sends = await loadSends(r.id);
      render(); afterRepRender();
      if (!bad.length) toast(`${ok.length}곳에 보고했어요`);
      else openOv(dlg('보고 결과', `
        ${ok.length ? `<p style="margin:0 0 10px"><b>${ok.length}곳</b>에 보냈습니다.</p>` : ''}
        <p style="margin:0 0 8px">아래는 보내지 못했습니다.</p>
        <div class="mini">${bad.map(b => `<div class="it" style="cursor:default"><div class="ico-s">${ic(b.channel==='mail'?'mail':'sms')}</div><div class="tx"><b>${esc(b.to_name)} <span class="mono hint">${esc(b.to_addr)}</span></b><span>${esc(b.error)}</span></div></div>`).join('')}</div>`,
        `<button class="btn primary" data-act="closeOv">확인</button>`));
    } catch(e){ err(e.message || String(e)); }
  });
}

/* ───────── 문자 링크로 열어 보는 화면 (로그인 없이) ───────── */
function viewPublic(){
  const p = S.pub;
  if (!p) return viewLoading();
  if (p.error) return `<div class="login"><div class="lcard" style="align-items:center;text-align:center">${brand('보고서 보기')}
    <h2>${esc(p.error)}</h2>
    <p class="hint">${p.expired ? '문자로 받은 링크는 보낸 날부터 7일 동안만 열립니다.' : '주소가 잘린 건 아닌지 확인해 주세요.'}</p></div></div>`;
  const r = p.report;
  return `<div class="pubwrap">
    <div class="pubbar">${brand('현장활동보고서')}<span class="hint">${esc(r.author_dept||'')} ${esc(r.author_name||'')} ${esc(r.author_title||'')} · ${fmtLongIso(r.report_date)}</span>
      <button class="btn sm" data-act="repPrint">${ic('print')}인쇄 · PDF</button></div>
    <div class="page" style="padding-top:14px">
      <div class="editor" data-pane="prev"><div class="pane-prev"><div class="a4wrap">${a4HTML(r)}</div></div></div>
      <div class="hint" style="text-align:center">이 링크는 ${fmtDate(p.expires_at)} 까지 열립니다.</div>
    </div></div>`;
}
async function openPublic(token){
  S.screen = 'pub'; S.pub = null; S.pubToken = token; render();
  try {
    const out = await edge('view-report', { token });
    S.pub = { report: fixRep(out.report), expires_at: out.expires_at };
  } catch(e){
    S.pub = { error: e.message || '링크를 열지 못했습니다', expired: /기한/.test(e.message || '') };
  }
  render(); fitA4();
}

/* ───────── 메모 : 데이터 ───────── */
const MEM_COLS = 'id,author,title,meet_date,meet_time,place,people,agenda,discussion,decisions,todos,created_at,updated_at';
const BUCKET = 'meeting-photos';

function fixMemo(m){
  const arr = v => Array.isArray(v) ? v : [];
  return Object.assign({}, m, {
    people: arr(m.people).map(x => String(x ?? '')).filter(Boolean),
    todos:  arr(m.todos).map(t => ({ id:String(t.id || uid()), t:String(t.t ?? ''), o:String(t.o ?? ''), d:String(t.d ?? ''), k:!!t.k })),
  });
}
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Math.random().toString(36).slice(2) + Date.now().toString(36));
const memById = id => (S.meetings || []).find(m => m.id === id);

async function loadMemos(){
  const { data, error } = await sb.from('meetings').select(MEM_COLS)
    .order('meet_date', { ascending:false }).order('meet_time', { ascending:false }).limit(400);
  if (error){ toast(dbMsg(error)); if (!S.meetings) S.meetings = []; return; }
  S.meetings = (data || []).map(fixMemo);
  const ids = S.meetings.map(m => m.id);
  if (ids.length){
    const { data: ph } = await sb.from('meeting_photos').select('id,meeting,path,caption,bytes,sort,created_at').in('meeting', ids).order('sort').order('created_at');
    const by = {}; (ph || []).forEach(p => (by[p.meeting] = by[p.meeting] || []).push(p));
    S.meetings.forEach(m => m.photos = by[m.id] || []);
  } else S.meetings.forEach(m => m.photos = []);
}
function newMemo(){
  const now = new Date();
  return { id:null, author:S.me.id, title:'', meet_date:TODAY(), meet_time:`${pad(now.getHours())}:${pad(now.getMinutes())}`,
    place:'', people:[], agenda:'', discussion:'', decisions:'', todos:[], photos:[] };
}
function memPayload(m){
  return { title:(m.title||'').trim().slice(0,120), meet_date:m.meet_date, meet_time:(m.meet_time||'').slice(0,5),
    place:(m.place||'').trim().slice(0,120), people:m.people.slice(0,60),
    agenda:m.agenda||'', discussion:m.discussion||'', decisions:m.decisions||'',
    todos:m.todos.slice(0,60).map(t => ({ id:t.id, t:String(t.t||'').slice(0,200), o:String(t.o||'').slice(0,40), d:t.d||'', k:!!t.k })) };
}

let mSaveT = null, mSaving = false, mPend = false;
function queueMemoSave(){
  markSaving('저장할 내용이 있어요');
  clearTimeout(mSaveT);
  mSaveT = setTimeout(() => { saveMemo().catch(e => toast(e.message || String(e))); }, 1200);
}
async function saveMemo(){
  const m = S.mcur;
  if (!m) return null;
  if (mSaving){ mPend = true; return null; }
  if (!m.meet_date){ markSaving('일자를 정해 주세요'); return null; }
  mSaving = true; markSaving('저장 중…');
  try {
    const row = memPayload(m);
    let out;
    if (m.id){
      const { data, error } = await sb.from('meetings').update(row).eq('id', m.id).select(MEM_COLS).maybeSingle();
      if (error) throw new Error(dbMsg(error));
      if (!data) throw new Error('저장하지 못했습니다. 다시 로그인해 주세요');
      out = fixMemo(data);
    } else {
      row.author = S.me.id;
      const { data, error } = await sb.from('meetings').insert(row).select(MEM_COLS).maybeSingle();
      if (error) throw new Error(dbMsg(error));
      if (!data) throw new Error('저장하지 못했습니다. 다시 로그인해 주세요');
      out = fixMemo(data); m.id = out.id;
    }
    out.photos = m.photos || [];
    const i = (S.meetings || []).findIndex(x => x.id === out.id);
    if (i >= 0) S.meetings[i] = out; else if (S.meetings) S.meetings.unshift(out);
    markSaving('저장됨 ' + fmtDT(new Date().toISOString()));
    return out;
  } finally { mSaving = false; if (mPend){ mPend = false; queueMemoSave(); } }
}

/* ── 사진 : 줄이기 · 위치정보 지우기 · 올리기 ── */
async function shrink(file){
  const MAX = 1600;
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation:'from-image' }); }
  catch(e){ bmp = await createImageBitmap(file); }
  const s = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * s)), h = Math.max(1, Math.round(bmp.height * s));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.82));
  if (!blob) throw new Error('사진을 처리하지 못했습니다');
  return blob;   // 캔버스로 다시 그리므로 EXIF(위치정보)는 남지 않습니다
}
async function addPhotos(files){
  const m = S.mcur; if (!m) return;
  const list = [...files].filter(f => /^image\//.test(f.type)).slice(0, 12);
  if (!list.length) return;
  if ((m.photos || []).length + list.length > 24) return toast('사진은 메모 하나에 24장까지 넣을 수 있어요');
  if (!m.id){ const out = await saveMemo(); if (!out) return toast('먼저 제목이나 일자를 채워 주세요'); }
  let done = 0;
  for (const f of list){
    try {
      markSaving(`사진 올리는 중… ${done+1}/${list.length}`);
      const blob = await shrink(f);
      const path = `${S.me.id}/${m.id}/${uid()}.jpg`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, blob, { contentType:'image/jpeg', upsert:false });
      if (upErr) throw new Error(/exceeded|too large/i.test(upErr.message||'') ? '사진이 너무 큽니다' : (upErr.message || '올리지 못했습니다'));
      const { data, error } = await sb.from('meeting_photos')
        .insert({ meeting:m.id, author:S.me.id, path, bytes:blob.size, sort:(m.photos||[]).length + done })
        .select('id,meeting,path,caption,bytes,sort,created_at').maybeSingle();
      if (error){ await sb.storage.from(BUCKET).remove([path]).catch(() => null); throw new Error(dbMsg(error)); }
      (m.photos = m.photos || []).push(data);
      done++;
    } catch(e){ toast(e.message || String(e)); break; }
  }
  markSaving('저장됨 ' + fmtDT(new Date().toISOString()));
  const mm = memById(m.id); if (mm) mm.photos = m.photos;
  paintPhotos();
}
async function delPhoto(id){
  const m = S.mcur; if (!m) return;
  const p = (m.photos || []).find(x => x.id === id); if (!p) return;
  const { data, error } = await busy(sb.from('meeting_photos').delete().eq('id', id).select('id'));
  if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '지우지 못했습니다');
  await sb.storage.from(BUCKET).remove([p.path]).catch(() => null);
  m.photos = m.photos.filter(x => x.id !== id);
  const mm = memById(m.id); if (mm) mm.photos = m.photos;
  delete S.urls[p.path];
  paintPhotos(); toast('사진을 지웠어요');
}
async function signPhotos(paths){
  const need = paths.filter(p => !S.urls[p]);
  if (!need.length) return;
  const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
  (data || []).forEach(d => { if (d && d.signedUrl && !d.error) S.urls[d.path] = d.signedUrl; });
}

/* ───────── 렌더 ───────── */
function render(){
  const v = $('#view');
  const map = { loading:viewLoading, setup:viewSetup, login:viewLogin, otp:viewOtp, enroll:viewEnroll, forcepw:viewForcePw, noprofile:viewNoProfile, pub:viewPublic, app:() => shell(viewRoute()) };
  v.innerHTML = (map[S.screen] || viewLoading)();
  if (S.screen === 'otp'){ const o = $('#otp0'); if (o) o.focus(); }
  if (S.screen === 'login'){ const i = $('#lg-id'); if (i && !i.value) i.focus(); else { const p = $('#lg-pw'); if (p) p.focus(); } }
  if (S.screen === 'enroll'){ const c = $('#en-code'); if (c) c.focus(); }
}
const brand = sub => `<div class="brand"><div class="logo">note</div><div><b>note</b><small>${sub}</small></div></div>`;
function viewLoading(){ return `<div class="login"><div class="lcard" style="align-items:center;text-align:center">${brand('불러오는 중…')}<div class="spin" aria-label="불러오는 중"></div></div></div>`; }
function viewSetup(){
  return `<div class="login"><div class="lcard">${brand('설치 확인')}
    <h2>설치 설정이 비어 있어요</h2>
    <p>${esc(S.err) || 'index.html 위쪽 <code>NOTE_CONFIG</code> 에 Supabase 프로젝트 주소(Project URL)와 공개 키(Publishable key)를 넣고 다시 올려 주세요.'}</p>
    <div class="file">SUPABASE_URL: ${esc(CFG.SUPABASE_URL || '(비어 있음)')}</div>
    <div class="foot">${ic('lock')}<span>공개 키(sb_publishable_…)만 넣습니다. 비밀 키(sb_secret_…)는 절대 넣지 마세요.</span></div>
  </div></div>`;
}
function viewLogin(){
  const last = store.get('note-last-id') || '';
  return `<div class="login"><form class="lcard" data-form="login" novalidate>
    ${brand('현장활동보고 · 메모')}
    <div class="field"><label for="lg-id">아이디</label><input class="in" id="lg-id" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(last)}"></div>
    <div class="field"><label for="lg-pw">비밀번호</label><input class="in" id="lg-pw" type="password" autocomplete="current-password"></div>
    <div class="errtx" id="lg-err" role="alert">${esc(S.err)}</div>
    <button class="btn primary" type="submit" style="height:44px">로그인</button>
    <div class="foot">${ic('lock')}<span>계정은 관리자가 만들어 드립니다. 비밀번호를 잊었으면 관리자에게 초기화를 요청하세요.</span></div>
  </form><span class="ver">${VERSION}</span></div>`;
}
function viewOtp(){
  return `<div class="login"><form class="lcard" data-form="otp" novalidate>
    ${brand('2단계 인증')}
    <h2>인증 앱의 6자리 숫자</h2>
    <p>휴대폰의 Google OTP(또는 Microsoft Authenticator)에 표시된 <b>note</b> 숫자를 입력하세요. 숫자는 30초마다 바뀝니다.</p>
    <div class="otp">${[0,1,2,3,4,5].map(i => `<input id="otp${i}" inputmode="numeric" maxlength="1" autocomplete="${i?'off':'one-time-code'}" aria-label="${i+1}번째 숫자">`).join('')}</div>
    <div class="errtx" id="otp-err" role="alert">${esc(S.err)}</div>
    <button class="btn primary" type="submit" id="otp-ok" style="height:44px" disabled>확인</button>
    <button class="btn quiet" type="button" data-act="logout">다른 아이디로 로그인</button>
    <div class="foot">${ic('phone')}<span>휴대폰을 바꿨거나 잃어버렸다면 관리자에게 <b>2단계 인증 초기화</b>를 요청하세요. 다음 로그인 때 새로 등록합니다.</span></div>
  </form></div>`;
}
function secretGroups(s){ return esc(String(s||'').replace(/(.{4})/g,'$1 ').trim()); }
function viewEnroll(){
  const e = S.enroll || {};
  return `<div class="login"><form class="lcard wide" data-form="enroll" novalidate>
    ${brand('2단계 인증 등록')}
    <h2>휴대폰 인증 앱을 등록해 주세요</h2>
    <p>note 는 비밀번호와 함께 휴대폰 인증 앱의 6자리 숫자로 로그인합니다. 처음 한 번만 등록하면 됩니다.</p>
    <ol class="steps-l">
      <li>휴대폰에 <b>Google OTP</b>(Google Authenticator) 또는 <b>Microsoft Authenticator</b> 앱을 설치하세요.</li>
      <li>앱에서 <b>＋ → QR 코드 스캔</b>을 누르고 아래 그림을 비추세요.</li>
    </ol>
    <div class="qrbox"><img src="${esc(e.qr)}" alt="인증 앱 등록용 QR 코드" width="180" height="180"></div>
    <details><summary>스캔이 안 되면 — 키 직접 입력</summary><div class="secret" id="en-secret">${secretGroups(e.secret)}</div><p class="hint" style="margin:6px 0 0">앱에서 ‘설정 키 입력’을 고르고 계정 이름은 note, 키 종류는 ‘시간 기준’으로 두세요.</p></details>
    <ol class="steps-l" start="3"><li>앱에 뜬 <b>6자리 숫자</b>를 입력하세요.</li></ol>
    <input class="in mono" id="en-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" style="font-size:20px;letter-spacing:.3em;text-align:center;height:50px" aria-label="6자리 숫자">
    <div class="errtx" id="en-err" role="alert">${esc(S.err)}</div>
    <button class="btn primary" type="submit" style="height:44px">등록하고 시작하기</button>
    <button class="btn quiet" type="button" data-act="logout">나중에 하기 (로그아웃)</button>
  </form></div>`;
}
function viewForcePw(){
  return `<div class="login"><form class="lcard" data-form="forcepw" novalidate>
    ${brand('비밀번호 변경')}
    <h2>새 비밀번호를 정해 주세요</h2>
    <p>관리자가 준 임시 비밀번호로 로그인하셨어요. 본인만 아는 비밀번호로 바꿔야 쓸 수 있습니다.</p>
    <input type="text" autocomplete="username" value="${esc(S.me && S.me.login_id)}" hidden>
    <div class="field"><label for="fp0">임시 비밀번호</label><input class="in" type="password" id="fp0" autocomplete="current-password"></div>
    <div class="field"><label for="fp1">새 비밀번호</label><input class="in" type="password" id="fp1" autocomplete="new-password"><span class="hint">8자 이상, 영문과 숫자를 섞어 주세요</span></div>
    <div class="field"><label for="fp2">새 비밀번호 확인</label><input class="in" type="password" id="fp2" autocomplete="new-password"></div>
    <div class="errtx" id="fp-err" role="alert">${esc(S.err)}</div>
    <button class="btn primary" type="submit" style="height:44px">바꾸고 시작하기</button>
    <button class="btn quiet" type="button" data-act="logout">로그아웃</button>
  </form></div>`;
}
function viewNoProfile(){
  return `<div class="login"><div class="lcard">${brand('확인 필요')}
    <h2>직원 정보가 없어요</h2>
    <p>로그인은 됐지만 직원 정보(profiles)를 찾지 못했습니다. 관리자에게 알려 주세요.${S.err ? `<br><span class="hint">${esc(S.err)}</span>` : ''}</p>
    <p class="hint">관리자라면: 설치 가이드의 SQL(01_기본.sql)을 실행했는지, 계정을 SQL 실행 뒤에 만들었는지 확인하세요.</p>
    <button class="btn" data-act="logout">로그아웃</button></div></div>`;
}

/* ── 셸 ── */
const NAV = [['home','홈','home'],['reports','현장활동보고서','doc'],['meetings','메모','note'],['settings','설정','gear']];
function shell(inner){
  const u = S.me;
  return `<div class="shell">
  <nav class="side" aria-label="주 메뉴">${brand('현장활동보고 · 메모')}
    <div class="nav">${NAV.map(([n,l,i]) => `<button data-act="go" data-to="${n}" ${S.route===n?'aria-current="page"':''}>${ic(i)}${l}</button>`).join('')}</div>
    <div class="me"><div class="av">${esc((u.name||'?')[0])}</div><div class="who"><b>${esc(u.name)} ${esc(u.title)}</b><span>${isAdmin()?'관리자':'직원'} · ${esc(u.dept||u.login_id)}</span></div>
      <button class="iconbtn" data-act="logout" title="로그아웃" aria-label="로그아웃">${ic('logout')}</button></div>
    <span class="ver">${VERSION}</span>
  </nav>
  <main class="main" id="main">
    <div class="mtop"><div class="logo">note</div><b>note</b><span class="pill role">${esc(u.name)} · ${isAdmin()?'관리자':'직원'}</span></div>
    ${inner}
  </main>
  <nav class="tabbar" aria-label="하단 메뉴">${NAV.map(([n,l,i]) => `<button data-act="go" data-to="${n}" ${S.route===n?'aria-current="page"':''}>${ic(i)}${l==='현장활동보고서'?'보고서':l}</button>`).join('')}</nav>
</div>`;
}
function viewRoute(){
  if (S.route === 'settings') return viewSettings();
  if (S.route === 'report') return viewReportEdit();
  if (S.route === 'reports') return viewReports();
  if (S.route === 'memo') return viewMemoEdit();
  if (S.route === 'meetings') return viewMemos();
  return viewHome();
}
/* ───────── 보고서 : 목록 ───────── */
function reportPill(r){
  if (!r) return `<span class="pill none">미작성</span>`;
  if (r.status === 'sent') return `<span class="pill sent">보고 완료</span>`;
  if (r.status === 'edited') return `<span class="pill draft">보고 후 수정됨</span>`;
  return `<span class="pill draft">작성 중</span>`;
}
function sendInfo(r){
  if (!r || !r.sent_at) return '<span class="hint">—</span>';
  return `${fmtDT(r.sent_at)} 보고`;
}
function viewReports(){
  if (S.reports === null) return `<div class="page"><div class="ph"><div><h1>현장활동보고서</h1></div></div><section class="panel empty">불러오는 중…</section></div>`;
  const f = S.f, admin = isAdmin();
  const all = S.reports;
  const months = [...new Set(all.map(r => r.report_date.slice(0,7)))].sort().reverse();
  const authors = [...new Map(all.filter(r => r.author !== S.me.id).map(r => [r.author, r.author_name || '(이름 없음)'])).entries()];
  let list = all.slice();
  if (f.rMonth !== 'all') list = list.filter(r => r.report_date.startsWith(f.rMonth));
  if (f.rStatus === 'sent') list = list.filter(r => r.status !== 'draft');
  if (f.rStatus === 'draft') list = list.filter(r => r.status === 'draft');
  if (admin && f.rAuthor === 'me') list = list.filter(r => r.author === S.me.id);
  else if (admin && f.rAuthor !== 'all') list = list.filter(r => r.author === f.rAuthor);

  return `<div class="page">
    <div class="ph"><div><h1>현장활동보고서</h1><div class="sub">${admin ? '전체 직원의 보고서 — 다른 사람 것은 읽기만 할 수 있어요' : '내가 쓴 보고서'}</div></div>
      <div class="acts"><button class="btn primary" data-act="repNew">${ic('plus')}새 보고서</button></div></div>
    <div class="filters">
      <label class="sr" for="f-month">월</label>
      <select class="in" id="f-month" data-filter="rMonth"><option value="all">전체 기간</option>${months.map(m => `<option value="${m}" ${f.rMonth===m?'selected':''}>${m.slice(0,4)}년 ${+m.slice(5)}월</option>`).join('')}</select>
      <div class="seg" role="group" aria-label="상태">${[['all','전체'],['draft','작성 중'],['sent','보고 완료']].map(([v,l]) => `<button data-act="rFilter" data-k="rStatus" data-v="${v}" aria-pressed="${f.rStatus===v}">${l}</button>`).join('')}</div>
      ${admin ? `<label class="sr" for="f-au">작성자</label><select class="in" id="f-au" data-filter="rAuthor"><option value="all" ${f.rAuthor==='all'?'selected':''}>작성자 전체</option><option value="me" ${f.rAuthor==='me'?'selected':''}>나</option>${authors.map(([id,nm]) => `<option value="${esc(id)}" ${f.rAuthor===id?'selected':''}>${esc(nm)}</option>`).join('')}</select>` : ''}
    </div>
    <section class="panel rlist ${admin?'':'noau'}">
      <div class="rhead"><span class="d">일자</span><span class="main-c">장소 · 주요업무</span>${admin?'<span class="au">작성자</span>':''}<span class="st">상태</span><span class="snd">마지막 보고</span></div>
      ${list.length ? list.map(r => `<button class="rrow" data-act="repOpen" data-id="${esc(r.id)}">
        <span class="d">${fmtRow(r.report_date)}</span>
        <span class="main-c"><span class="pl">${esc(r.place || '장소 미입력')}</span><span class="tk">${esc(r.main_task || '주요업무 미입력')}</span></span>
        ${admin?`<span class="au">${esc(r.author_name || '—')}</span>`:''}
        <span class="st">${reportPill(r)}</span>
        <span class="snd">${sendInfo(r)}</span></button>`).join('')
      : `<div class="empty">${all.length ? '조건에 맞는 보고서가 없습니다' : '아직 보고서가 없습니다. <b>새 보고서</b>를 눌러 시작하세요.'}</div>`}
    </section>
  </div>`;
}

/* ───────── 보고서 : A4 ───────── */
function colg(){ return `<col style="width:7.14%">` + '<col style="width:10.318%">'.repeat(9); }
function a4HTML(r){
  const who = `${esc(r.author_name || '')} ${esc(r.author_title || '')}`.trim();
  return `<div class="a4" id="a4">
    <div class="ttl">현장 활동 보고서</div><div class="gap"></div>
    <div class="sh">1. 개요</div>
    <table><colgroup>${colg()}</colgroup>
      <tr class="r1"><th colspan="2">일자</th><td colspan="3">${r.report_date ? esc(r.report_date.replace(/-/g,'. ')) : ''}</td><th colspan="2">장소</th><td colspan="3">${esc(r.place)}</td></tr>
      <tr class="r1"><th colspan="2">작성자</th><td colspan="3">${who}</td><th colspan="2">주요업무</th><td colspan="3">${esc(r.main_task)}</td></tr>
      <tr class="r1"><th colspan="2">참석자</th><td colspan="8" class="l">${esc(r.attendees)}</td></tr>
    </table>
    <div class="sh b">2. 업무 일정</div>
    <table><colgroup>${colg()}</colgroup>
      ${SLOTS.map((h,i) => `<tr class="rs"><th colspan="2">${slotLabel(h)}</th><td colspan="8"><div class="c">${esc(schedAt(r,i))}</div></td></tr>`).join('')}
    </table>
    <div class="sh b">3. 주요 내용</div>
    <table><colgroup>${colg()}</colgroup>
      <tr class="rb"><th colspan="2">주요 업무/결과</th><td colspan="8"><div class="clip" data-k="body">${esc(r.body)}</div></td></tr>
      <tr class="re"><th colspan="2">기타\n(특이사항 및 공유 사항)</th><td colspan="8"><div class="clip" data-k="etc">${esc(r.etc)}</div></td></tr>
    </table>
  </div>`;
}
function fitA4(){
  $$('#view .a4wrap, #ov .a4wrap').forEach(w => {
    const a = $('.a4', w); if (!a) return;
    const s = Math.min(1, (w.clientWidth || 600) / 794);
    a.style.transform = `scale(${s})`; w.style.height = (1123*s) + 'px';
  });
}
function measureA4(){
  const res = {};
  $$('#view .a4 .clip').forEach(el => { const o = el.scrollHeight > el.clientHeight + 1; el.classList.toggle('over', o); res[el.dataset.k] = o; });
  ['body','etc'].forEach(k => { const w = $('#warn-'+k); if (w) w.hidden = !res[k]; });
}
function refreshPreview(){
  const r = S.rcur, w = $('#view .a4wrap'); if (!r || !w) return;
  w.innerHTML = a4HTML(r); fitA4(); measureA4();
}

/* ───────── 보고서 : PDF 만들기 (딸린 프로그램 없이 직접 그립니다) ───────── */
const PT = { W:595.28, H:841.89, PADX:36, PADY:40 };
const A4FONT = "'IBM Plex Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";
function colXs(){
  const cw = PT.W - PT.PADX * 2, xs = [PT.PADX];
  let x = PT.PADX;
  for (let i = 0; i < 10; i++){ x += cw * (i === 0 ? 0.0714 : 0.10318); xs.push(x); }
  xs[10] = PT.PADX + cw;
  return xs;
}
// 글자를 칸 너비에 맞춰 줄로 나눕니다 (칸을 넘치는 줄은 버립니다 = 화면 미리보기와 같은 규칙)
function wrapLines(g, text, maxW, maxLines){
  const out = [];
  const add = l => { out.push(l); return out.length >= maxLines; };
  for (const para of String(text || '').split('\n')){
    if (!para){ if (add('')) return out.slice(0, maxLines); continue; }
    let line = '', lastSpace = -1;   // 되도록 띄어쓰기에서 끊고, 안 되면 글자 단위로 끊습니다
    for (const ch of para){
      const t = line + ch;
      if (g.measureText(t).width > maxW && line){
        let cut = line, rest = ch;
        if (lastSpace > 0 && lastSpace < line.length - 1){
          cut = line.slice(0, lastSpace);
          rest = line.slice(lastSpace + 1) + ch;
        }
        if (add(cut)) return out.slice(0, maxLines);
        line = rest; lastSpace = rest.lastIndexOf(' ');
      } else {
        if (ch === ' ') lastSpace = line.length;
        line = t;
      }
    }
    if (add(line)) return out.slice(0, maxLines);
  }
  return out;
}
function drawA4(cv, r, dpi){
  const s = (dpi || 192) / 72;
  cv.width = Math.round(PT.W * s); cv.height = Math.round(PT.H * s);
  const g = cv.getContext('2d');
  g.setTransform(s, 0, 0, s, 0, 0);
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, PT.W, PT.H);
  g.fillStyle = '#111111'; g.strokeStyle = '#000000'; g.lineWidth = 0.75;

  const X = colXs(), R = X[10];
  const box = (x1, y1, x2, y2, head) => {
    if (head){ g.fillStyle = '#F2F2F2'; g.fillRect(x1, y1, x2-x1, y2-y1); g.fillStyle = '#111111'; }
    g.strokeRect(x1, y1, x2-x1, y2-y1);
  };
  const one = (txt, x1, y1, x2, y2, o) => {          // 한 줄 (넘치면 …)
    const pad = (o && o.pad) || 5, align = (o && o.align) || 'center';
    g.font = `${(o && o.weight) || 400} ${(o && o.size) || 10.5}pt ${A4FONT}`;
    let t = String(txt || ''), w = x2 - x1 - pad*2;
    if (g.measureText(t).width > w){ while (t && g.measureText(t + '…').width > w) t = t.slice(0, -1); t += '…'; }
    const cy = (y1 + y2) / 2 + ((o && o.size) || 10.5) * 0.36;
    g.textAlign = align;
    g.fillText(t, align === 'center' ? (x1+x2)/2 : x1 + pad, cy);
    g.textAlign = 'left';
  };
  const mid = (txt, x1, y1, x2, y2, o) => {           // 칸 너비에 맞춰 줄바꿈 + 위아래 가운데
    const size = (o && o.size) || 10, pad = (o && o.pad) || 4;
    g.font = `${(o && o.weight) || 400} ${size}pt ${A4FONT}`;
    const lh = size * 1.35;
    const lines = wrapLines(g, txt, x2 - x1 - pad*2, 3);
    const top = (y1 + y2) / 2 - (lines.length * lh) / 2;
    g.textAlign = 'center';
    lines.forEach((ln, i) => g.fillText(ln, (x1+x2)/2, top + lh*(i+1) - lh*0.28));
    g.textAlign = 'left';
  };
  const many = (txt, x1, y1, x2, y2, size) => {      // 여러 줄 (칸을 넘치면 잘림)
    const padX = 7, padY = 6, lh = size * 1.55;
    g.font = `400 ${size}pt ${A4FONT}`;
    const maxLines = Math.max(0, Math.floor((y2 - y1 - padY*2) / lh));
    const lines = wrapLines(g, txt, x2 - x1 - padX*2, maxLines);
    lines.forEach((ln, i) => g.fillText(ln, x1 + padX, y1 + padY + lh*(i+1) - lh*0.28));
  };

  let y = PT.PADY;
  // 제목
  g.font = `400 26pt ${A4FONT}`; g.textAlign = 'center';
  const ty = y + 33*0.72;
  g.fillText('현장 활동 보고서', PT.W/2, ty);
  const tw = g.measureText('현장 활동 보고서').width;
  g.lineWidth = 1; g.beginPath(); g.moveTo(PT.W/2 - tw/2, ty + 6); g.lineTo(PT.W/2 + tw/2, ty + 6); g.stroke();
  g.lineWidth = 0.75; g.textAlign = 'left';
  y += 33 + 13.8;

  const head = (t, h) => { g.font = `700 11pt ${A4FONT}`; g.fillText(t, PT.PADX, y + h - 4); y += h; };
  const who = `${r.author_name || ''} ${r.author_title || ''}`.trim();

  // 1. 개요
  head('1. 개요', 27.6);
  const rows1 = [
    [['일자', X[0], X[2]], [r.report_date ? r.report_date.replace(/-/g,'. ') : '', X[2], X[5]], ['장소', X[5], X[7]], [r.place, X[7], X[10]]],
    [['작성자', X[0], X[2]], [who, X[2], X[5]], ['주요업무', X[5], X[7]], [r.main_task, X[7], X[10]]],
    [['참석자', X[0], X[2]], [r.attendees, X[2], X[10], 'left']],
  ];
  for (const row of rows1){
    const y2 = y + 22.2;
    row.forEach((c, i) => {
      const isTh = i % 2 === 0;
      box(c[1], y, c[2], y2, isTh);
      one(c[0], c[1], y, c[2], y2, { size: isTh ? 10 : 10.5, align: isTh ? 'center' : (c[3] || 'center') });
    });
    y = y2;
  }

  // 2. 업무 일정
  head('2. 업무 일정', 28.2);
  SLOTS.forEach((h, i) => {
    const y2 = y + 17.4;
    box(X[0], y, X[2], y2, true);  one(slotLabel(h), X[0], y, X[2], y2, { size:9 });
    box(X[2], y, X[10], y2, false); one(schedAt(r, i), X[2], y, X[10], y2, { size:10.5, align:'left' });
    y = y2;
  });

  // 3. 주요 내용
  head('3. 주요 내용', 28.2);
  let y2 = y + 222;
  box(X[0], y, X[2], y2, true);  mid('주요\n업무/결과', X[0], y, X[2], y2, { size:11 });
  box(X[2], y, X[10], y2, false); many(r.body, X[2], y, X[10], y2, 10.5);
  y = y2; y2 = y + 78;
  box(X[0], y, X[2], y2, true);  mid('기타\n(특이사항 및 공유 사항)', X[0], y, X[2], y2, { size:10 });
  box(X[2], y, X[10], y2, false); many(r.etc, X[2], y, X[10], y2, 10);
  return cv;
}

// JPEG 한 장을 A4 한 쪽짜리 PDF 로 감쌉니다
function jpegToPdf(jpeg, wPx, hPx){
  const enc = new TextEncoder(), parts = []; let len = 0;
  const put = u8 => { parts.push(u8); len += u8.length; };
  const str = s => put(enc.encode(s));
  const off = [];
  const obj = (n, dict, stream) => {
    off[n] = len;
    str(`${n} 0 obj\n${dict}\n`);
    if (stream){ str('stream\n'); put(stream); str('\nendstream\n'); }
    str('endobj\n');
  };
  str('%PDF-1.4\n'); put(new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,0x0A]));
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PT.W.toFixed(2)} ${PT.H.toFixed(2)}] `
       + `/Resources << /XObject << /I0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, `<< /Type /XObject /Subtype /Image /Width ${wPx} /Height ${hPx} /ColorSpace /DeviceRGB `
       + `/BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  const content = enc.encode(`q ${PT.W.toFixed(2)} 0 0 ${PT.H.toFixed(2)} 0 0 cm /I0 Do Q`);
  obj(5, `<< /Length ${content.length} >>`, content);
  const xref = len;
  let x = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) x += String(off[i]).padStart(10,'0') + ' 00000 n \n';
  str(x);
  str(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len); let p = 0;
  for (const u of parts){ out.set(u, p); p += u.length; }
  return out;
}

async function makeReportPdf(r){
  const cv = document.createElement('canvas');
  drawA4(cv, r, 192);
  const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92));
  if (!blob) throw new Error('PDF 를 만들지 못했습니다');
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  const bytes = jpegToPdf(jpeg, cv.width, cv.height);
  const name = `현장활동보고서_${String(r.report_date).replace(/-/g,'')}_${(r.author_name||'').replace(/[\\/:*?"<>|]/g,'')}.pdf`;
  return { bytes, name };
}

/* ───────── 보고서 : 작성 ───────── */
function repBanner(r, mine){
  if (!mine) return `<div class="banner ro">${ic('eye')}<span><b>${esc(authorOf(r))}</b>의 보고서입니다. 관리자는 읽기만 할 수 있어요.</span></div>`;
  if (r.status === 'edited') return `<div class="banner dirty">${ic('alert')}<span><b>보고한 뒤 내용이 바뀌었어요.</b> 수신자에게는 이전 내용이 가 있습니다. 다시 보고하면 새 PDF 가 발송됩니다.</span></div>`;
  if (r.status === 'sent') return `<div class="banner">${ic('check')}<span><b>보고 완료</b> · ${sendInfo(r)}. 고친 뒤 다시 보낼 수 있어요.</span></div>`;
  return '';
}
function viewReportEdit(){
  const r = S.rcur;
  if (!r) return `<div class="page"><div class="empty">보고서를 찾을 수 없습니다</div></div>`;
  const mine = repMine(r), dis = mine ? '' : 'disabled';
  const filled = r.schedule.filter(x => x.trim()).length;
  const nowH = r.report_date === TODAY() ? pad(new Date().getHours()) : null;
  const sendBtn = `<button class="btn primary" data-act="repSend" title="메일(PDF 첨부)과 문자로 보냅니다">${ic('send')}${r.status === 'draft' ? '보고하기' : '다시 보고하기'}</button>`;
  return `<div class="page">
    <div class="ph"><div><button class="back" data-act="go" data-to="reports">${ic('back')}보고서 목록</button>
      <h1>현장활동보고서 · ${fmtLongIso(r.report_date)}</h1>
      <div class="sub">${esc(authorOf(r))} · ${mine ? `<span class="saved" id="saved">${esc(S.saved || '자동 저장됩니다')}</span>` : '읽기 전용'}</div></div>
      <div class="acts hide-m">${mine && r.status === 'draft' ? `<button class="btn quiet" data-act="repDel">${ic('trash')}삭제</button>` : ''}
        <button class="btn" data-act="repPrint">${ic('print')}인쇄 · PDF</button>${mine ? sendBtn : ''}</div>
    </div>
    <div id="rbanner">${repBanner(r, mine)}</div>
    <div class="seg eseg" role="tablist" aria-label="보기 전환"><button data-act="pane" data-v="form" aria-pressed="${S.pane==='form'}">${ic('doc')}작성</button><button data-act="pane" data-v="prev" aria-pressed="${S.pane==='prev'}">${ic('eye')}A4 미리보기</button></div>
    <div class="editor" data-pane="${S.pane}">
      <div class="pane-form">
        <section class="sec"><div class="sec-h"><h3>1. 개요</h3></div>
          <div class="fgrid">
            <div class="field"><label for="r-date">일자</label><input class="in" type="date" id="r-date" data-rf="report_date" value="${esc(r.report_date)}" ${dis}></div>
            <div class="field"><label for="r-place" class="req">장소</label><div class="inrow"><input class="in" id="r-place" data-rf="place" value="${esc(r.place)}" maxlength="120" placeholder="예: 판교 테크원" ${dis}>${geoBtn('r-place', !mine)}</div></div>
            <div class="field"><label for="r-au">작성자</label><input class="in" id="r-au" value="${esc(authorOf(r))}" readonly></div>
            <div class="field"><label for="r-task" class="req">주요업무</label><input class="in" id="r-task" data-rf="main_task" value="${esc(r.main_task)}" maxlength="200" placeholder="예: 정기 설비 점검" ${dis}></div>
            <div class="field full"><label for="r-att">참석자</label><input class="in" id="r-att" data-rf="attendees" value="${esc(r.attendees)}" maxlength="300" placeholder="이름 · 직책, 쉼표로 구분" ${dis}></div>
          </div></section>
        <section class="sec"><div class="sec-h"><h3>2. 업무 일정</h3><span class="hint" id="filled">${filled}/14칸</span></div>
          <div class="slots">${SLOTS.map((h,i) => `<div class="slot ${h===nowH?'now':''}"><label class="t" for="s-${h}">${slotLabel(h)}</label><input id="s-${h}" data-rf="s${i}" value="${esc(schedAt(r,i))}" maxlength="120" ${dis}></div>`).join('')}</div></section>
        <section class="sec"><div class="sec-h"><h3>3. 주요 내용</h3></div>
          <div class="field"><label for="r-body" class="req">주요 업무/결과</label><textarea class="in" id="r-body" rows="12" data-rf="body" maxlength="4000" ${dis}>${esc(r.body)}</textarea>
            <div class="warn" id="warn-body" hidden>${ic('alert')}<span>A4 칸을 넘었어요. 넘친 부분은 PDF 에서 잘리니 줄이거나 ‘기타’로 옮겨 주세요.</span></div></div>
          <div class="field"><label for="r-etc">기타 (특이사항 및 공유 사항)</label><textarea class="in" id="r-etc" rows="3" data-rf="etc" maxlength="2000" ${dis}>${esc(r.etc)}</textarea>
            <div class="warn" id="warn-etc" hidden>${ic('alert')}<span>기타 칸을 넘었어요. 넘친 부분은 PDF 에서 잘립니다.</span></div></div>
        </section>
        ${(S.sends && S.sends.length) ? `<section class="panel sends"><div class="panel-h"><h2>보고 내역</h2><span class="hint">${S.sends.length}건</span></div>
          ${S.sends.map(x => `<div class="it"><span class="mono">${fmtDT(x.sent_at)}</span>${ic(x.channel==='mail'?'mail':'sms')}<span><b>${esc(x.to_name)}</b> <span class="ad">${esc(x.to_addr)}</span>${x.ok?'':`<br><span class="ad">${esc(x.error)}</span>`}</span><span class="pill ${x.ok?'sent':'none'}">${x.ok?'성공':'실패'}</span></div>`).join('')}</section>` : ''}
        <div class="sticky-act"><button class="btn" data-act="pane" data-v="prev">${ic('eye')}미리보기</button>${mine ? sendBtn : `<button class="btn" data-act="repPrint">${ic('print')}인쇄</button>`}</div>
      </div>
      <div class="pane-prev">
        <div class="cap"><span>메일에 첨부되는 PDF 와 같은 모양 · A4 1장</span><span class="mono">현장활동보고서_${esc(r.report_date.replace(/-/g,''))}_${esc(r.author_name||'')}.pdf</span></div>
        <div class="a4wrap">${a4HTML(r)}</div>
        <div class="sticky-act"><button class="btn" data-act="pane" data-v="form">${ic('doc')}작성으로</button><button class="btn" data-act="repPrint">${ic('print')}인쇄 · PDF</button></div>
      </div>
    </div>
  </div>`;
}

/* ───────── 메모 : 목록 ───────── */
const relDay = iso => {
  const d = dObj(iso), t = new Date(); t.setHours(0,0,0,0);
  const n = Math.round((d - t) / 86400000);
  return n === 0 ? '오늘' : n === -1 ? '어제' : n === 1 ? '내일' : n < 0 ? `${-n}일 전` : `${n}일 뒤`;
};
/* 검색용 일자 표기 모음 — 2026-09-13 · 2026.09.13 · 2026/09/13 · 20260913 · 9/13 · 9월 13일 · 어제 … */
function dateHay(iso){
  if (!iso || iso.length < 10) return '';
  const y = iso.slice(0,4), mo = iso.slice(5,7), d = iso.slice(8,10);
  const M = +mo, D = +d;
  return [iso, `${y}.${mo}.${d}`, `${y}/${mo}/${d}`, `${y}${mo}${d}`, `${y}년 ${M}월 ${D}일`,
    `${M}/${D}`, `${mo}/${d}`, `${M}월 ${D}일`, `${M}월${D}일`, `${mo}-${d}`, `${mo}.${d}`,
    ['일','월','화','수','목','금','토'][dObj(iso).getDay()] + '요일', relDay(iso)].join(' ');
}
function memMatch(m, q){
  if (!q) return true;
  const hay = [m.title, m.place, m.people.join(' '), m.agenda, m.discussion, m.decisions, dateHay(m.meet_date), m.meet_time].join(' ').toLowerCase();
  if (hay.includes(q)) return true;
  const qd = q.replace(/[^0-9]/g, '');
  return qd.length >= 2 && (m.meet_date || '').replace(/-/g, '').includes(qd);
}
function memCard(m){
  const done = m.todos.filter(t => t.k).length;
  const ph = (m.photos || []);
  return `<button class="panel mcard" data-act="memOpen" data-id="${esc(m.id)}">
    <div class="when"><span>${fmtRow(m.meet_date)} ${esc(m.meet_time)}</span><span>${relDay(m.meet_date)}</span></div>
    <h3>${esc(m.title || '제목 없음')}</h3>
    ${m.place ? `<div class="pl">${ic('pin')}${esc(m.place)}</div>` : ''}
    ${m.people.length ? `<div class="people">${m.people.map(p => `<span>${esc(p)}</span>`).join('')}</div>` : ''}
    ${m.decisions ? `<div class="ex">${esc(m.decisions)}</div>` : ''}
    <div class="foot"><div class="thumbs">${ph.slice(0,3).map(p => `<img src="${esc(S.urls[p.path] || '')}" alt="" loading="lazy">`).join('')}${ph.length>3?`<span class="more">+${ph.length-3}</span>`:''}</div>
      ${m.todos.length ? `<span class="todoc">${ic('check')}할 일 ${done}/${m.todos.length}</span>` : ''}</div>
  </button>`;
}
function viewMemos(){
  if (S.meetings === null) return `<div class="page"><div class="ph"><div><h1>메모</h1></div></div><section class="panel empty">불러오는 중…</section></div>`;
  const q = S.f.mq.trim().toLowerCase();
  let list = S.meetings.slice();
  if (q) list = list.filter(m => memMatch(m, q));
  return `<div class="page">
    <div class="ph"><div><h1>메모</h1><div class="sub">내가 쓴 미팅 · 회의 기록과 현장 사진 — 나만 볼 수 있습니다</div></div>
      <div class="acts"><button class="btn primary" data-act="memNew">${ic('plus')}새 메모</button></div></div>
    <div class="filters"><div class="search">${ic('search')}<label class="sr" for="mq">검색</label><input class="in" id="mq" data-filter="mq" placeholder="제목 · 참석자 · 내용 · 일자 검색 (예: 2026-09-13, 9/13)" value="${esc(S.f.mq)}"></div><span class="hint">${list.length}건</span></div>
    <div class="mgrid" id="mgrid">${list.length ? list.map(memCard).join('') : `<div class="panel empty">${S.meetings.length ? '검색 결과가 없습니다' : '아직 메모가 없습니다. <b>새 메모</b>를 눌러 시작하세요.'}</div>`}</div>
  </div>`;
}

/* ───────── 메모 : 작성 ───────── */
function chipsHTML(m){
  return m.people.map((p,i) => `<span class="chip">${esc(p)}<button type="button" data-act="chipDel" data-i="${i}" aria-label="${esc(p)} 빼기">${ic('x')}</button></span>`).join('')
    + `<input id="chipIn" placeholder="${m.people.length ? '' : '이름을 적고 Enter'}" autocomplete="off">`;
}
function photosHTML(m){
  const ph = m.photos || [];
  if (!ph.length) return `<div class="hint" style="grid-column:1/-1;text-align:center;padding:14px 0">아직 사진이 없습니다</div>`;
  return ph.map(p => `<div class="pit">
    <img src="${esc(S.urls[p.path] || '')}" alt="${esc(p.caption || '현장 사진')}" loading="lazy" data-act="lbOpen" data-id="${esc(p.id)}">
    <button class="rm" type="button" data-act="phoDel" data-id="${esc(p.id)}" aria-label="사진 지우기" title="사진 지우기">${ic('trash')}</button>
    <input class="in" value="${esc(p.caption)}" data-pc="${esc(p.id)}" placeholder="설명 (선택)" maxlength="200">
    <span class="kb">${Math.round((p.bytes||0)/1024)} KB</span>
  </div>`).join('');
}
function todosHTML(m){
  if (!m.todos.length) return `<div class="hint">할 일이 없습니다. <b>추가</b>를 눌러 적어 두세요.</div>`;
  return m.todos.map((t,i) => `<div class="todo ${t.k?'done':''}">
    <input class="ck" type="checkbox" ${t.k?'checked':''} data-td="k" data-i="${i}" aria-label="끝냄">
    <input class="in tx" value="${esc(t.t)}" data-td="t" data-i="${i}" placeholder="할 일" maxlength="200">
    <input class="in ow" value="${esc(t.o)}" data-td="o" data-i="${i}" placeholder="담당" maxlength="40">
    <input class="in du" type="date" value="${esc(t.d)}" data-td="d" data-i="${i}" aria-label="기한">
    <button class="iconbtn rm" type="button" data-act="todoDel" data-i="${i}" aria-label="할 일 지우기">${ic('x')}</button>
  </div>`).join('');
}
function viewMemoEdit(){
  const m = S.mcur;
  if (!m) return `<div class="page"><div class="empty">메모를 찾을 수 없습니다</div></div>`;
  const sameDayRep = (S.reports || []).find(r => r.author === S.me.id && r.report_date === m.meet_date);
  return `<div class="page">
    <div class="ph"><div><button class="back" data-act="go" data-to="meetings">${ic('back')}메모</button>
      <h1>${m.title ? esc(m.title) : '새 메모'}</h1><div class="sub"><span class="saved" id="saved">${esc(S.saved || '자동 저장됩니다')}</span></div></div>
      <div class="acts"><button class="btn quiet" data-act="memDel">${ic('trash')}삭제</button>
        <button class="btn" data-act="memToReport" ${m.decisions.trim() ? '' : 'disabled'} title="${m.decisions.trim() ? (sameDayRep ? '그날 보고서의 주요 업무/결과에 붙입니다' : '그날 보고서를 새로 만들어 붙입니다') : '결정 사항을 먼저 적어 주세요'}">${ic('import')}현장활동보고서에 넣기</button></div></div>
    <div class="medit">
      <div class="col">
        <div class="field"><label for="m-title" class="req">제목</label><input class="in ttl-in" id="m-title" data-mf="title" value="${esc(m.title)}" maxlength="120" placeholder="예: 시범 도입 사업장 선정 미팅"></div>
        <div class="fgrid">
          <div class="field"><label for="m-date">일자</label><input class="in" type="date" id="m-date" data-mf="meet_date" value="${esc(m.meet_date)}"></div>
          <div class="field"><label for="m-time">시간</label><input class="in" type="time" id="m-time" data-mf="meet_time" value="${esc(m.meet_time)}"></div>
          <div class="field full"><label for="m-place">장소</label><div class="inrow"><input class="in" id="m-place" data-mf="place" value="${esc(m.place)}" maxlength="120" placeholder="예: 판교 테크원 시설관리사무소">${geoBtn('m-place', false)}</div></div>
          <div class="field full"><label for="chipIn">참석자</label><div class="chips" id="chips">${chipsHTML(m)}</div><span class="hint">이름을 적고 Enter 또는 쉼표</span></div>
        </div>
        <div class="field"><label for="m-agenda">안건</label><textarea class="in" id="m-agenda" rows="3" data-mf="agenda" maxlength="3000">${esc(m.agenda)}</textarea></div>
        <div class="field"><label for="m-disc">논의 내용</label><textarea class="in" id="m-disc" rows="7" data-mf="discussion" maxlength="8000">${esc(m.discussion)}</textarea></div>
        <div class="field"><label for="m-dec">결정 사항</label><textarea class="in" id="m-dec" rows="3" data-mf="decisions" maxlength="3000" placeholder="한 줄에 하나씩 — ‘현장활동보고서에 넣기’ 때 그대로 옮겨집니다">${esc(m.decisions)}</textarea></div>
      </div>
      <div class="col">
        <section class="panel"><div class="panel-h"><h2>사진</h2><span class="hint" id="pcount">${(m.photos||[]).length}장</span></div>
          <div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
            <div class="padd"><label class="btn" for="camIn">${ic('camera')}사진 찍기</label><label class="btn" for="albIn">${ic('image')}앨범에서 선택</label>
              <input type="file" id="camIn" class="sr" accept="image/*" capture="environment"><input type="file" id="albIn" class="sr" accept="image/*" multiple></div>
            <div class="pgrid" id="pgrid">${photosHTML(m)}</div>
            <div class="hint">올리기 전에 긴 쪽 1600px 로 줄이고 위치정보(GPS)를 지웁니다. 사진은 나만 볼 수 있는 비공개 저장소에 들어갑니다.</div>
          </div></section>
        <section class="panel"><div class="panel-h"><h2>할 일</h2><button class="btn sm" data-act="todoAdd">${ic('plus')}추가</button></div>
          <div class="panel-b"><div class="todos" id="todos">${todosHTML(m)}</div></div></section>
      </div>
    </div>
  </div>`;
}
function paintPhotos(){
  const m = S.mcur; if (!m) return;
  signPhotos((m.photos||[]).map(p => p.path)).then(() => {
    const g = $('#pgrid'); if (g) g.innerHTML = photosHTML(m);
    const c = $('#pcount'); if (c) c.textContent = `${(m.photos||[]).length}장`;
  });
}
function viewLightbox(){
  if (!S.lb) return '';
  const m = S.mcur; if (!m) return '';
  const ph = m.photos || [], i = ph.findIndex(p => p.id === S.lb);
  if (i < 0) return '';
  const p = ph[i];
  return `<div class="lb" data-act="lbBg">
    <button class="iconbtn x" data-act="lbClose" aria-label="닫기">${ic('x')}</button>
    <img src="${esc(S.urls[p.path] || '')}" alt="${esc(p.caption || '현장 사진')}">
    <div class="bar"><button data-act="lbPrev" aria-label="이전" ${i===0?'disabled':''}>${ic('chevl')}</button>
      <span>${i+1} / ${ph.length}</span>
      <button data-act="lbNext" aria-label="다음" ${i===ph.length-1?'disabled':''}>${ic('chevr')}</button></div>
  </div>`;
}

function viewSoon(t, a, b){
  return `<div class="page"><div class="ph"><div><h1>${t}</h1><div class="sub">준비 중</div></div></div>
    <section class="panel empty" style="padding:40px 20px"><b style="color:var(--ink);font-size:15px">${a}</b><br><span class="hint">${b}</span></section></div>`;
}
function miniDelBtn(act, id){
  return `<button class="btn sm quiet rmini" data-act="${act}" data-id="${esc(id)}" title="삭제" aria-label="삭제">${ic('trash')}</button>`;
}
function viewHome(){
  const u = S.me, now = new Date(), today = TODAY();
  const reps = S.reports;
  const mineToday = reps && reps.find(r => r.author === u.id && r.report_date === today);
  const recent = reps ? reps.filter(r => r.author === u.id && r.report_date !== today).slice(0, 4) : [];
  const nowH = pad(now.getHours()), cur = SLOTS.indexOf(nowH);

  let todayCard;
  if (reps === null){
    todayCard = `<section class="panel today"><div class="top"><div><div class="eyebrow">오늘의 현장활동보고서</div><h2>불러오는 중…</h2></div></div></section>`;
  } else if (mineToday){
    const r = mineToday, filled = r.schedule.filter(x => x.trim()).length;
    todayCard = `<section class="panel today">
      <div class="top"><div><div class="eyebrow">오늘의 현장활동보고서</div><h2>${esc(r.main_task || '주요업무 미입력')}</h2></div>${reportPill(r)}</div>
      <div class="meta"><span>${ic('pin')}${esc(r.place || '장소 미입력')}</span><span>${ic('user')}${esc(r.attendees || '참석자 없음')}</span><span>${ic('list')}업무 일정 ${filled}/14칸</span></div>
      <div><div class="ruler" aria-label="업무 일정 채움 현황">${SLOTS.map((h,i) => `<i class="${r.schedule[i].trim()?'on':''} ${i===cur?'now':''}" title="${slotLabel(h)} ${esc(r.schedule[i])}"></i>`).join('')}</div>
        <div class="ruler-l"><span>08</span><span></span><span></span><span></span><span>12</span><span></span><span></span><span></span><span>16</span><span></span><span></span><span></span><span>20</span><span style="text-align:right">22</span></div></div>
      ${cur >= 0 ? `<div class="nowline"><span class="mono">지금 ${slotLabel(nowH)}</span><span>${r.schedule[cur].trim() ? esc(r.schedule[cur]) : '<span class="hint">이 시간대가 비어 있어요</span>'}</span></div>` : ''}
      <div class="acts"><button class="btn primary" data-act="repOpen" data-id="${esc(r.id)}">${ic('doc')}이어서 작성</button></div>
    </section>`;
  } else {
    todayCard = `<section class="panel today"><div class="top"><div><div class="eyebrow">오늘의 현장활동보고서</div><h2>오늘 보고서를 아직 시작하지 않았어요</h2></div>${reportPill(null)}</div>
      <p class="hint" style="margin:0">일자와 작성자는 자동으로 채워집니다. 현장에서 틈틈이 시간대별로 적어 두세요.</p>
      <div class="acts"><button class="btn primary" data-act="repNew">${ic('plus')}보고서 작성 시작</button></div></section>`;
  }

  const recentCard = `<section class="panel"><div class="panel-h"><h2>최근 내 보고서</h2>${reps && reps.length ? `<button class="btn sm quiet" data-act="go" data-to="reports">전체 보기</button>` : ''}</div>
    <div class="mini">${recent.length ? recent.map(r => `<div class="it"><button class="open" data-act="repOpen" data-id="${esc(r.id)}"><div class="tx"><b>${esc(r.place || '장소 미입력')} · ${esc(r.main_task || '주요업무 미입력')}</b><span>${fmtRow(r.report_date)}</span></div>${reportPill(r)}</button>${miniDelBtn('homeRepDel', r.id)}</div>`).join('')
      : `<div class="empty">${reps === null ? '불러오는 중…' : '아직 지난 보고서가 없습니다'}</div>`}</div></section>`;

  const teamCard = isAdmin() && reps ? (() => {
    const todays = reps.filter(r => r.report_date === today);
    const users = (S.users || []).filter(x => x.active);
    if (!users.length) return '';
    return `<section class="panel"><div class="panel-h"><h2>오늘 보고 현황</h2><span class="hint">${fmtMD(today)} 기준</span></div>
      <div class="mini team">${users.map(x => { const rr = todays.find(y => y.author === x.id);
        return `<div class="it" style="cursor:${rr?'pointer':'default'}" ${rr?`data-act="repOpen" data-id="${esc(rr.id)}"`:''}><div class="av">${esc((x.name||'?')[0])}</div><div class="tx"><b>${esc(x.name)} ${esc(x.title||'')}</b><span>${rr ? esc((rr.place||'장소 미입력')+' · '+(rr.main_task||'주요업무 미입력')) : esc(x.dept||'')}</span></div>${reportPill(rr)}</div>`; }).join('')}</div></section>`;
  })() : '';

  const mems = S.meetings;
  const recentMem = mems ? mems.slice(0, 3) : [];
  const memCardP = `<section class="panel"><div class="panel-h"><h2>최근 메모</h2><button class="btn sm quiet" data-act="go" data-to="meetings">${ic('plus')}새 메모</button></div>
    <div class="mini">${recentMem.length ? recentMem.map(m => `<div class="it"><button class="open" data-act="memOpen" data-id="${esc(m.id)}"><div class="tx"><b>${esc(m.title || '제목 없음')}</b><span>${fmtRow(m.meet_date)} ${esc(m.meet_time)}${m.place ? ' · ' + esc(m.place) : ''}</span></div>${(m.photos||[]).length ? `<span class="pill plain">사진 ${(m.photos||[]).length}</span>` : ''}</button>${miniDelBtn('homeMemDel', m.id)}</div>`).join('')
      : `<div class="empty">${mems === null ? '불러오는 중…' : '아직 메모가 없습니다'}</div>`}</div></section>`;

  return `<div class="page">
    <div class="ph"><div><h1>${fmtLong(now)}</h1><div class="sub">${esc(u.name)} ${esc(u.title)} · ${esc(u.dept)}</div></div></div>
    <div class="hgrid">
      <div class="stack">${todayCard}${teamCard}</div>
      <div class="stack">${recentCard}${memCardP}</div>
    </div>
  </div>`;
}

/* ── 설정 ── */
function viewSettings(){
  const tabs = [['me','내 정보 · 비밀번호'],['mfa','2단계 인증'],...(isAdmin()?[['accounts','계정 관리']]:[]),['mail','메일 수신자'],['sms','문자 수신자']];
  if (!tabs.some(t => t[0] === S.stab)) S.stab = 'me';
  const body = ({ me:setMe, mfa:setMfa, accounts:setAccounts, mail:() => setRcpt('mail'), sms:() => setRcpt('sms') })[S.stab]();
  return `<div class="page">
    <div class="ph"><div><h1>설정</h1><div class="sub">${isAdmin()?'관리자 — 계정과 수신자 목록을 관리합니다':'내 정보와 비밀번호, 2단계 인증을 관리합니다'}</div></div></div>
    <div class="tabs" role="tablist">${tabs.map(([k,l]) => `<button role="tab" data-act="stab" data-v="${k}" aria-selected="${S.stab===k}">${l}</button>`).join('')}</div>
    <div id="sbody">${body}</div>
  </div>`;
}
function setMe(){
  const u = S.me;
  return `<div class="sgrid">
    <section class="panel"><div class="panel-h"><h2>내 정보</h2></div><form class="panel-b" data-form="phone" novalidate>
      <dl class="kv"><dt>이름</dt><dd>${esc(u.name)} ${esc(u.title)}</dd><dt>아이디</dt><dd class="mono">${esc(u.login_id)}</dd><dt>소속</dt><dd>${esc(u.dept)||'—'}</dd><dt>권한</dt><dd><span class="pill role">${u.role==='admin'?'관리자':'직원'}</span></dd></dl>
      <div class="field" style="margin-top:16px"><label for="me-phone">휴대폰</label><div style="display:flex;gap:8px"><input class="in" id="me-phone" value="${esc(u.phone)}" inputmode="tel" placeholder="010-0000-0000"><button class="btn" type="submit">저장</button></div></div>
      <p class="hint" style="margin:8px 0 0">이름 · 소속 · 권한은 관리자가 바꿀 수 있어요.</p></form></section>
    <section class="panel"><div class="panel-h"><h2>비밀번호 변경</h2></div><form class="panel-b" data-form="pw" style="display:flex;flex-direction:column;gap:12px" novalidate>
      <input type="text" autocomplete="username" value="${esc(u.login_id)}" hidden>
      <div class="field"><label for="pw0">현재 비밀번호</label><input class="in" type="password" id="pw0" autocomplete="current-password"></div>
      <div class="field"><label for="pw1">새 비밀번호</label><input class="in" type="password" id="pw1" autocomplete="new-password"><span class="hint">8자 이상, 영문과 숫자를 섞어 주세요</span></div>
      <div class="field"><label for="pw2">새 비밀번호 확인</label><input class="in" type="password" id="pw2" autocomplete="new-password"></div>
      <div class="errtx" id="pw-err" role="alert"></div>
      <div><button class="btn primary" type="submit">${ic('key')}비밀번호 바꾸기</button></div>
    </form></section>
    <section class="panel"><div class="panel-h"><h2>앱으로 쓰기</h2></div><div class="panel-b" style="display:flex;flex-direction:column;gap:12px">
      <p class="hint" style="margin:0">홈 화면에 추가하면 주소창 없이 앱처럼 열리고, 인터넷이 잠깐 끊겨도 화면이 뜹니다.</p>
      <div><button class="btn" type="button" data-act="pwaInstall">${ic('phone')}홈 화면에 추가</button></div>
    </div></section>
  </div>`;
}
function setMfa(){
  const f = S.factors, re = S.reEnroll;
  const has = f.length > 0;
  return `<div class="sgrid"><div class="stack">
    <section class="panel"><div class="panel-h"><h2>내 2단계 인증</h2></div><div class="panel-b" style="display:flex;flex-direction:column;gap:14px">
      <div class="status-line"><div class="ico ${has?'':'no'}">${ic(has?'shield':'alert')}</div>
        <div><b>${has?'사용 중':'확인 중…'}</b><div class="hint">${has ? f.map(x => `인증 앱 등록 ${fmtDate(x.created_at)}`).join(' · ') : ''}</div></div></div>
      ${re ? '' : `<div><button class="btn" data-act="mfaStart">${ic('phone')}휴대폰을 바꿨어요 — 다시 등록</button></div>`}
      <p class="hint" style="margin:0">비밀번호가 새어 나가도 휴대폰이 없으면 로그인할 수 없게 막는 장치입니다. note 는 전 직원이 사용합니다.</p>
    </div></section>
    ${re ? `<section class="panel"><div class="panel-h"><h2>새 휴대폰에 등록</h2><button class="btn sm quiet" data-act="mfaCancel">취소</button></div><form class="panel-b" data-form="reenroll" novalidate>
      <div class="mfa"><div class="qrbox sm"><img src="${esc(re.qr)}" alt="인증 앱 등록용 QR 코드" width="160" height="160"></div>
        <div class="steps">
          <div><b>1.</b> 새 휴대폰의 인증 앱에서 <b>QR 코드 스캔</b>을 누르세요.</div>
          <details><summary class="hint">스캔이 안 되면 — 키 직접 입력</summary><div class="secret">${secretGroups(re.secret)}</div></details>
          <div><b>2.</b> 앱에 뜬 6자리 숫자를 입력하세요. 등록되면 예전 휴대폰의 등록은 지워집니다.</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="sr" for="re-code">6자리 숫자</label><input class="in mono" id="re-code" inputmode="numeric" maxlength="6" placeholder="000000" style="width:140px;letter-spacing:.2em;font-size:16px"><button class="btn primary" type="submit">등록</button></div>
          <div class="errtx" id="re-err" role="alert"></div>
        </div></div></form></section>` : ''}
  </div><div class="stack"></div></div>`;
}
function setAccounts(){
  const list = S.users;
  if (!list) return `<section class="panel"><div class="empty">계정 목록을 불러오는 중…</div></section>`;
  return `<section class="panel"><div class="panel-h"><h2>계정 ${list.length}개</h2><button class="btn primary sm" data-act="acctNew">${ic('plus')}계정 추가</button></div>
    <div class="ahead"><span class="nm">이름 · 아이디</span><span class="dp">소속</span><span class="rl">권한</span><span class="mf">2단계</span><span class="st">상태</span><span class="ls">마지막 로그인</span><span class="ed"></span></div>
    ${list.map(u => `<div class="arow ${u.active?'':'off'}"><div class="nm"><b>${esc(u.name)} ${esc(u.title)}</b><span>${esc(u.login_id)}</span></div>
      <div class="dp">${esc(u.dept)||'—'}</div><div class="rl"><span class="pill ${u.role==='admin'?'role':'plain'}">${u.role==='admin'?'관리자':'직원'}</span></div>
      <div class="mf">${u.mfa?'<span class="pill sent">2단계 등록</span>':'<span class="pill draft">2단계 미등록</span>'}</div>
      <div class="st">${!u.active?'<span class="pill off">사용중지</span>':u.must_change_pw?'<span class="pill draft">첫 로그인 전</span>':'<span class="pill sent">사용</span>'}</div>
      <div class="ls">${fmtDT(u.last_sign_in_at)}</div><div class="ed"><button class="btn sm" data-act="acctEdit" data-id="${esc(u.id)}">수정</button></div></div>`).join('')}
  </section>
  <p class="hint" style="margin:0">새 계정은 임시 비밀번호로 시작하고, 첫 로그인 때 비밀번호 변경과 인증 앱 등록을 거칩니다. 기록을 남기기 위해 계정은 삭제하지 않고 <b>사용중지</b>합니다.</p>`;
}
function setRcpt(kind){
  const list = S[kind], mail = kind === 'mail', ed = isAdmin();
  const sender = mail ? `<section class="panel"><div class="panel-h"><h2>보내는 메일</h2><span class="pill plain">Gmail · 4단계에서 연결</span></div><form class="panel-b" data-form="sender" style="display:flex;flex-direction:column;gap:12px" novalidate>
      <div class="field"><label for="snd-name">보낸 사람 이름</label><div style="display:flex;gap:8px"><input class="in" id="snd-name" value="${esc(S.settings.sender_name || 'note')}" maxlength="30" ${ed?'':'readonly'}>${ed?'<button class="btn" type="submit">저장</button>':''}</div></div>
      <div class="hint">받는 사람에게는 “${esc(S.settings.sender_name || 'note')} &lt;보고용 Gmail&gt;”로 보입니다. Gmail 앱 비밀번호는 이 화면이 아니라 서버 비밀 저장소에 넣습니다.</div>
    </form></section>` : '';
  const add = ed ? `<section class="panel"><div class="panel-h"><h2>${mail?'메일':'문자'} 수신자 추가</h2></div><form class="panel-b addrow" data-form="add-${kind}" novalidate>
      <div class="field"><label for="${kind}-nm" class="req">이름</label><input class="in" id="${kind}-nm" maxlength="30" placeholder="예: 최OO"></div>
      <div class="field"><label for="${kind}-dp">소속 · 직책</label><input class="in" id="${kind}-dp" maxlength="40" placeholder="예: 운영본부장"></div>
      <div class="field"><label for="${kind}-ad" class="req">${mail?'이메일':'휴대폰'}</label><input class="in mono" id="${kind}-ad" ${mail?'type="email" placeholder="name@company.co.kr"':'inputmode="tel" placeholder="010-0000-0000"'}></div>
      <button class="btn primary" type="submit" style="height:40px">${ic('plus')}추가</button>
      <div class="errtx" id="${kind}-err" style="grid-column:1/-1;min-height:0" role="alert"></div>
    </form></section>` : `<div class="banner ro">${ic('lock')}<span>수신자 목록은 관리자가 관리합니다. 보고할 때 이 목록에서 골라 보냅니다.</span></div>`;
  const rows = !list ? '<div class="empty">불러오는 중…</div>' : list.length ? list.map(x => `<div class="rcrow"><b>${esc(x.name)}</b><span class="dp">${esc(x.dept)||'—'}</span><span class="ad">${esc(mail?x.email:x.phone)}</span>
      <button class="tog" role="switch" aria-checked="${x.is_default}" data-act="rcDef" data-kind="${kind}" data-id="${esc(x.id)}" ${ed?'':'disabled'}><i></i>기본 선택</button>
      ${ed ? `<button class="btn sm danger" data-act="rcDel" data-kind="${kind}" data-id="${esc(x.id)}">${ic('trash')}삭제</button>` : '<span></span>'}</div>`).join('') : '<div class="empty">수신자가 없습니다. 보고하려면 한 명 이상 필요해요.</div>';
  return `${sender}${add}<section class="panel"><div class="panel-h"><h2>${mail?'메일':'문자'} 수신자 ${list?list.length:''}명</h2><span class="hint">‘기본 선택’이 켜진 사람은 보고하기 창에 미리 체크됩니다</span></div><div>${rows}</div></section>
    ${mail ? '' : `<p class="hint" style="margin:0">번호는 글자로 저장해 앞자리 0이 지워지지 않습니다. 90바이트(한글 약 45자)를 넘으면 장문(LMS)으로 보냅니다.</p>`}`;
}

/* ───────── 오버레이 ───────── */
function openOv(html){ $('#ov').innerHTML = html; const f = $('#ov input:not([readonly])'); if (f) setTimeout(() => f.focus(), 30); }
function closeOv(){ $('#ov').innerHTML = ''; }
function dlg(title, body, foot){
  return `<div class="overlay" data-act="ovBg"><div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="dlg-h"><h2>${esc(title)}</h2><button class="iconbtn" data-act="closeOv" aria-label="닫기">${ic('x')}</button></div><div class="dlg-b" id="dlg-b">${body}</div><div class="dlg-f" id="dlg-f">${foot}</div></div></div>`;
}
function acctForm(u){
  const nw = !u; u = u || { login_id:'', name:'', dept:'', title:'', phone:'', role:'member' };
  return `<form id="acct-form" data-form="acct" data-id="${nw?'':esc(u.id)}" novalidate><div class="fgrid">
    <div class="field"><label for="a-name" class="req">이름</label><input class="in" id="a-name" value="${esc(u.name)}" maxlength="30"></div>
    <div class="field"><label for="a-login" class="req">아이디</label><input class="in mono" id="a-login" value="${esc(u.login_id)}" ${nw?'placeholder="영문 소문자·숫자 (예: kim05)" autocapitalize="off" spellcheck="false"':'readonly'}></div>
    <div class="field"><label for="a-dept">소속</label><input class="in" id="a-dept" value="${esc(u.dept)}" maxlength="40"></div>
    <div class="field"><label for="a-title">직책</label><input class="in" id="a-title" value="${esc(u.title)}" maxlength="40"></div>
    <div class="field full"><label for="a-phone">휴대폰</label><input class="in" id="a-phone" value="${esc(u.phone)}" inputmode="tel" placeholder="010-0000-0000"></div>
    <div class="field full"><span class="lbl">권한</span><div class="seg" role="group" id="a-role" data-v="${u.role}">${[['member','직원 — 본인 보고서·메모'],['admin','관리자 — 전체 보고서 열람·계정·수신자 관리']].map(([v,l]) => `<button type="button" data-act="aRole" data-v="${v}" aria-pressed="${u.role===v}">${l}</button>`).join('')}</div></div>
  </div>
  ${nw ? `<p class="hint" style="margin:14px 0 0">만들면 <b>임시 비밀번호</b>가 한 번 표시됩니다. 직원에게 전달하면 첫 로그인 때 새 비밀번호와 인증 앱을 등록합니다.</p>`
  : `<div class="panel" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;margin-top:16px">
      <div class="lbl">보안 조치</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="acctResetPw" data-id="${esc(u.id)}">${ic('key')}비밀번호 초기화</button>
      <button class="btn sm" type="button" data-act="acctResetMfa" data-id="${esc(u.id)}" ${u.mfa?'':'disabled'}>${ic('phone')}2단계 인증 초기화</button>
      ${u.id !== S.me.id ? `<button class="btn sm ${u.active?'danger':''}" type="button" data-act="acctActive" data-id="${esc(u.id)}" data-v="${u.active?'0':'1'}">${u.active?'사용중지':'다시 사용'}</button>` : ''}</div>
      <div class="hint" id="a-msg">2단계 인증 초기화는 휴대폰을 바꾸거나 잃어버린 직원에게 씁니다.</div></div>`}
  <div class="errtx" id="a-err" role="alert"></div></form>`;
}
function showTemp(title, name, login, pw){
  openOv(dlg(title, `<p style="margin:0">${esc(name)}님에게 아래 내용을 전달하세요. <b>이 창을 닫으면 다시 볼 수 없습니다.</b></p>
    <dl class="kv"><dt>접속 주소</dt><dd class="mono" style="overflow-wrap:anywhere">${esc(location.origin + location.pathname)}</dd><dt>아이디</dt><dd class="mono">${esc(login)}</dd><dt>임시 비밀번호</dt><dd><span class="secret" id="tmp-pw">${esc(pw)}</span></dd></dl>
    <p class="hint" style="margin:0">첫 로그인 때 비밀번호를 바꾸고 휴대폰 인증 앱을 등록하게 됩니다.</p>`,
    `<button class="btn" data-act="copyTemp" data-t="${esc(`[note] 접속 ${location.origin + location.pathname}\n아이디 ${login}\n임시 비밀번호 ${pw}`)}">${ic('copy')}내용 복사</button><button class="btn primary" data-act="closeOv">확인</button>`));
}

/* ───────── 토스트 ───────── */
let tT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(tT); tT = setTimeout(() => t.hidden = true, 3200); }

/* ───────── 동작 ───────── */
async function openSettingsTab(tab){
  S.stab = tab; S.reEnroll = null; render();
  if (tab === 'mfa'){ const { data } = await sb.auth.mfa.listFactors(); S.factors = (data && data.totp || []).filter(f => f.status === 'verified'); if (S.stab === 'mfa') render(); }
  if (tab === 'accounts' && isAdmin()){ await busy(loadUsers()); if (S.stab === 'accounts') render(); }
  if (tab === 'mail' || tab === 'sms'){ await busy(Promise.all([loadRcpt(tab), loadSettings()])); if (S.stab === tab) render(); }
}

/* ── 현재 위치로 장소 채우기 (v8) ─────────────────────────
   좌표는 저장하지 않습니다. 주소 글자만 장소 칸에 넣습니다. */
function geoBtn(id, disabled){
  return `<button type="button" class="btn geo" data-act="geoPlace" data-for="${id}"${disabled ? ' disabled' : ''} title="지금 있는 곳의 주소를 장소 칸에 넣습니다">${ic('pin')}현재 위치</button>`;
}

function geoCoords(){
  return new Promise((ok, no) => {
    if (!navigator.geolocation || !window.isSecureContext) return no(new Error('이 기기에서는 위치를 쓸 수 없어요'));
    navigator.geolocation.getCurrentPosition(
      p => ok(p.coords),
      err => no(new Error(
        err.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저 주소창의 자물쇠 › 위치를 «허용»으로 바꿔 주세요'
      : err.code === 3 ? '위치를 찾는 데 시간이 너무 걸려요. 잠시 뒤 다시 눌러 주세요'
      : '위치를 가져오지 못했어요')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

/* 좌표 → 한글 주소 (OpenStreetMap Nominatim) */
async function geoAddress(lat, lon){
  const u = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=ko'
          + '&lat=' + encodeURIComponent(lat.toFixed(6)) + '&lon=' + encodeURIComponent(lon.toFixed(6));
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  let j;
  try {
    const res = await fetch(u, { signal: ctl.signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('reverse ' + res.status);
    j = await res.json();
  } finally { clearTimeout(timer); }

  const a = (j && j.address) || {};
  const parts = [
    a.state || a.province,
    a.city || a.county,
    a.city_district || a.borough,
    a.suburb || a.town || a.village || a.neighbourhood || a.quarter,
    a.road,
    a.house_number
  ];
  const seen = new Set(), out = [];
  parts.forEach(x => { x = (x || '').trim(); if (x && !seen.has(x)){ seen.add(x); out.push(x); } });

  let txt = out.join(' ').trim();
  if (!txt && j && j.display_name){
    txt = String(j.display_name).split(',').map(s => s.trim())
      .filter(s => s && s !== '대한민국' && !/^\d{5}$/.test(s)).reverse().join(' ');
  }
  const spot = (j && j.name) || a.building || a.amenity || a.office || a.shop || '';
  if (spot && !seen.has(spot.trim())) txt = (txt + ' ' + spot).trim();
  return txt;
}

async function fillPlace(btn){
  const el = document.getElementById(btn.dataset.for || '');
  if (!el || el.disabled) return;
  const old = btn.innerHTML;
  btn.disabled = true; btn.classList.add('load'); btn.innerHTML = ic('pin') + '찾는 중…';
  try {
    const c = await geoCoords();
    let txt = '';
    try { txt = await geoAddress(c.latitude, c.longitude); } catch (_){ txt = ''; }
    if (!txt){ toast('주소를 찾지 못했어요. 장소를 직접 적어 주세요'); return; }
    el.value = txt.slice(0, 120);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    toast('현재 위치를 넣었어요');
  } catch (err){
    toast((err && err.message) || '위치를 가져오지 못했어요');
  } finally {
    btn.innerHTML = old; btn.classList.remove('load'); btn.disabled = false;
  }
}

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act;
  if (a === 'ovBg'){ if (e.target === t) closeOv(); return; }
  try {
    switch (a){
      case 'go': {
        await flushSave();
        S.route = t.dataset.to; closeOv();
        if (S.route !== 'report'){ S.rcur = null; S.rid = null; }
        if (S.route !== 'memo'){ S.mcur = null; S.lb = null; }
        if (S.route !== 'report' && S.route !== 'memo') S.saved = '';
        if (S.route === 'settings') await openSettingsTab(t.dataset.tab || S.stab);
        else if (S.route === 'reports'){ render(); await busy(loadReports()); if (S.route === 'reports') render(); }
        else if (S.route === 'meetings'){ render(); await busy(loadMemos()); if (S.route === 'meetings'){ await signPhotos(S.meetings.flatMap(m => (m.photos||[]).slice(0,3).map(p => p.path))); render(); } }
        else render();
        { const m = $('#main'); if (m) m.scrollTop = 0; } break; }
      case 'repNew': {
        const d = t.dataset.date || TODAY();
        const has = (S.reports || []).find(r => r.author === S.me.id && r.report_date === d);
        if (has){ openReport(has.id); toast(`${fmtMD(d)} 보고서를 이어서 씁니다`); break; }
        S.rcur = newReport(d); S.rid = null; S.route = 'report'; S.pane = 'form'; S.saved = ''; S.sends = [];
        render(); afterRepRender(); break; }
      case 'repOpen': openReport(t.dataset.id); break;
      case 'repPrint': window.print(); break;
      case 'repSend': {
        await flushSave();
        if (!S.rcur || !S.rcur.id) { toast('내용을 조금 적으면 보낼 수 있어요'); break; }
        if (S.mail === null || S.sms === null) await busy(Promise.all([loadRcpt('mail'), loadRcpt('sms')]));
        openOv(sendDlg(S.rcur)); break; }
      case 'sendGo': await doSend(t); break;
      case 'repDel': {
        if (!armed(t, '정말 삭제')) break;
        const r = S.rcur; if (!r) break;
        clearTimeout(saveT);
        if (r.id){
          const { data, error } = await busy(sb.from('reports').delete().eq('id', r.id).select('id'));
          if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '삭제하지 못했습니다');
          S.reports = (S.reports || []).filter(x => x.id !== r.id);
        }
        S.rcur = null; S.rid = null; S.route = 'reports'; render(); toast('보고서를 삭제했어요'); break; }
      case 'pane': {
        S.pane = t.dataset.v;
        const ed = $('.editor');
        if (ed){ ed.dataset.pane = S.pane; $$('.eseg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S.pane)); refreshPreview(); $('#main').scrollTop = 0; }
        break; }
      case 'geoPlace': await fillPlace(t); break;
      case 'rFilter': S.f[t.dataset.k] = t.dataset.v; render(); break;

      /* ── 메모 ── */
      case 'memNew': await flushSave(); S.mcur = newMemo(); S.route = 'memo'; S.saved = ''; render(); { const el = $('#m-title'); if (el) el.focus(); } break;
      case 'memOpen': await openMemo(t.dataset.id); break;
      case 'memDel': {
        if (!armed(t, '정말 삭제')) break;
        const m = S.mcur; if (!m) break;
        clearTimeout(mSaveT);
        if (m.id){
          const paths = (m.photos || []).map(p => p.path);
          const { data, error } = await busy(sb.from('meetings').delete().eq('id', m.id).select('id'));
          if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '삭제하지 못했습니다');
          if (paths.length) await sb.storage.from(BUCKET).remove(paths).catch(() => null);
          S.meetings = (S.meetings || []).filter(x => x.id !== m.id);
        }
        S.mcur = null; S.route = 'meetings'; render(); toast('메모를 삭제했어요'); break; }
      case 'memToReport': await memoToReport(); break;
      case 'homeRepDel': {
        if (!armed(t, '정말 삭제')) break;
        const id = t.dataset.id;
        const { data, error } = await busy(sb.from('reports').delete().eq('id', id).select('id'));
        if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '삭제하지 못했습니다');
        S.reports = (S.reports || []).filter(x => x.id !== id);
        if (S.rcur && S.rcur.id === id){ clearTimeout(saveT); S.rcur = null; S.rid = null; }
        render(); toast('보고서를 삭제했어요'); break; }
      case 'homeMemDel': {
        if (!armed(t, '정말 삭제')) break;
        const id = t.dataset.id;
        const hit = (S.meetings || []).find(x => x.id === id);
        const paths = hit ? (hit.photos || []).map(p => p.path) : [];
        const { data, error } = await busy(sb.from('meetings').delete().eq('id', id).select('id'));
        if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '삭제하지 못했습니다');
        if (paths.length) await sb.storage.from(BUCKET).remove(paths).catch(() => null);
        S.meetings = (S.meetings || []).filter(x => x.id !== id);
        if (S.mcur && S.mcur.id === id){ clearTimeout(mSaveT); S.mcur = null; }
        render(); toast('메모를 삭제했어요'); break; }
      case 'chipDel': { const m = S.mcur; m.people.splice(+t.dataset.i, 1); $('#chips').innerHTML = chipsHTML(m); $('#chipIn').focus(); queueMemoSave(); break; }
      case 'todoAdd': { const m = S.mcur; m.todos.push({ id:uid(), t:'', o:'', d:'', k:false }); $('#todos').innerHTML = todosHTML(m);
        const all = $$('#todos .tx'); if (all.length) all[all.length-1].focus(); queueMemoSave(); break; }
      case 'todoDel': { const m = S.mcur; m.todos.splice(+t.dataset.i, 1); $('#todos').innerHTML = todosHTML(m); queueMemoSave(); break; }
      case 'phoDel': if (armed(t, '정말 삭제')) await delPhoto(t.dataset.id); break;
      case 'lbOpen': S.lb = t.dataset.id; $('#ov').innerHTML = viewLightbox(); break;
      case 'lbClose': S.lb = null; closeOv(); break;
      case 'lbBg': if (e.target === t){ S.lb = null; closeOv(); } break;
      case 'lbPrev': case 'lbNext': {
        const ph = S.mcur.photos || [], i = ph.findIndex(p => p.id === S.lb);
        const n = a === 'lbPrev' ? i-1 : i+1;
        if (ph[n]){ S.lb = ph[n].id; $('#ov').innerHTML = viewLightbox(); }
        break; }
      case 'pwaInstall': {
        if (window.__pwaInstall && window.__pwaInstall()) break;
        const ua = navigator.userAgent;
        const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        toast(ios ? '사파리 아래 공유 단추 → ‘홈 화면에 추가’를 눌러 주세요.'
                  : '이미 추가했거나, 브라우저 메뉴 → ‘앱 설치’에서 추가할 수 있어요.');
        break; }
      case 'logout': await logout(); break;
      case 'stab': await openSettingsTab(t.dataset.v); break;
      case 'closeOv': closeOv(); break;
      case 'mfaStart': await busy(startEnroll(true)); break;
      case 'mfaCancel': if (S.reEnroll){ await sb.auth.mfa.unenroll({ factorId:S.reEnroll.id }).catch(() => null); } S.reEnroll = null; render(); break;
      case 'acctNew': openOv(dlg('계정 추가', acctForm(null), `<button class="btn" data-act="closeOv">취소</button><button class="btn primary" type="submit" form="acct-form">계정 만들기</button>`)); break;
      case 'acctEdit': { const u = (S.users||[]).find(x => x.id === t.dataset.id); if (u) openOv(dlg(`${u.name} ${u.title} 계정`, acctForm(u), `<button class="btn" data-act="closeOv">취소</button><button class="btn primary" type="submit" form="acct-form">저장</button>`)); break; }
      case 'aRole': { const g = $('#a-role'); g.dataset.v = t.dataset.v; $$('button', g).forEach(b => b.setAttribute('aria-pressed', b === t)); break; }
      case 'acctResetPw': {
        if (!armed(t, '정말 초기화')) break;
        const u = S.users.find(x => x.id === t.dataset.id);
        const r = await lockBtn(t, '초기화 중…', () => fn('reset_password', { id:u.id }));
        await loadUsers(); render(); showTemp('비밀번호를 초기화했어요', u.name, u.login_id, r.temp_password); break; }
      case 'acctResetMfa': {
        if (!armed(t, '정말 초기화')) break;
        const u = S.users.find(x => x.id === t.dataset.id);
        await lockBtn(t, '초기화 중…', () => fn('reset_mfa', { id:u.id }));
        await loadUsers(); closeOv(); render(); toast(`${u.name}님의 인증 앱 등록을 지웠어요. 다음 로그인 때 새로 등록합니다`); break; }
      case 'acctActive': {
        const on = t.dataset.v === '1';
        if (!on && !armed(t, '정말 사용중지')) break;
        const u = S.users.find(x => x.id === t.dataset.id);
        await lockBtn(t, '바꾸는 중…', () => fn('set_active', { id:u.id, active:on }));
        await loadUsers(); closeOv(); render(); toast(on ? `${u.name} 계정을 다시 쓸 수 있어요` : `${u.name} 계정을 사용중지했어요 — 1시간 안에 모든 기기에서 끊깁니다`); break; }
      case 'copyTemp': { try { await navigator.clipboard.writeText(t.dataset.t); toast('복사했어요'); } catch(err){ const r = document.createRange(); r.selectNodeContents($('#tmp-pw')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('임시 비밀번호를 선택했어요 — 복사해 주세요'); } break; }
      case 'rcDef': {
        if (!isAdmin()) break;
        const kind = t.dataset.kind, tb = kind === 'mail' ? 'mail_recipients' : 'sms_recipients';
        const x = S[kind].find(y => y.id === t.dataset.id); const v = !x.is_default;
        const { data, error } = await busy(sb.from(tb).update({ is_default:v }).eq('id', x.id).select());
        if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '권한이 없습니다');
        x.is_default = v; t.setAttribute('aria-checked', v); break; }
      case 'rcDel': {
        if (!armed(t, '정말 삭제')) break;
        const kind = t.dataset.kind, tb = kind === 'mail' ? 'mail_recipients' : 'sms_recipients';
        const { data, error } = await busy(sb.from(tb).delete().eq('id', t.dataset.id).select());
        if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '권한이 없습니다');
        await loadRcpt(kind); render(); toast('수신자를 삭제했어요'); break; }
    }
  } catch(err){ toast(err.message || String(err)); }
});
async function openReport(id){
  await flushSave();
  if (S.reports === null) await busy(loadReports());
  const r = repById(id);
  if (!r){ toast('보고서를 찾을 수 없습니다'); S.route = 'reports'; render(); return; }
  S.rcur = fixRep(r); S.rid = id; S.route = 'report'; S.pane = 'form'; S.saved = repMine(r) ? '자동 저장됩니다' : '';
  S.sends = null; render(); afterRepRender();
  if (r.status !== 'draft' || repMine(r)){ S.sends = await loadSends(id); if (S.rid === id && S.route === 'report') { render(); afterRepRender(); } }
  const m = $('#main'); if (m) m.scrollTop = 0;
}
function afterRepRender(){ fitA4(); measureA4(); autoGrow($('#r-body')); autoGrow($('#r-etc')); }

async function openMemo(id){
  await flushSave();
  if (S.meetings === null) await busy(loadMemos());
  const m = memById(id);
  if (!m){ toast('메모를 찾을 수 없습니다'); S.route = 'meetings'; render(); return; }
  S.mcur = fixMemo(m); S.mcur.photos = m.photos || [];
  S.route = 'memo'; S.saved = '자동 저장됩니다'; S.lb = null;
  render();
  autoGrow($('#m-agenda')); autoGrow($('#m-disc')); autoGrow($('#m-dec'));
  paintPhotos();
  const el = $('#main'); if (el) el.scrollTop = 0;
}

// 결정 사항을 같은 날 현장활동보고서의 「주요 업무/결과」에 붙입니다
async function memoToReport(){
  const m = S.mcur; if (!m) return;
  const dec = (m.decisions || '').trim();
  if (!dec) return toast('결정 사항을 먼저 적어 주세요');
  await saveMemo();
  if (S.reports === null) await busy(loadReports());
  let r = (S.reports || []).find(x => x.author === S.me.id && x.report_date === m.meet_date);
  const head = `[${m.title || '메모'}${m.meet_time ? ' · ' + m.meet_time : ''}] 결정 사항`;
  const block = `${head}\n${dec}`;
  if (r){
    if (r.body && r.body.includes(block)) return toast('이미 보고서에 들어가 있어요');
    S.rcur = fixRep(r);
    S.rcur.body = (S.rcur.body ? S.rcur.body.replace(/\s+$/,'') + '\n\n' : '') + block;
    if (S.rcur.body.length > 4000) return toast('보고서 칸이 가득 찼어요. 보고서에서 먼저 줄여 주세요');
  } else {
    S.rcur = newReport(m.meet_date);
    S.rcur.place = m.place || '';
    S.rcur.main_task = m.title || '';
    S.rcur.attendees = m.people.join(', ');
    S.rcur.body = block;
  }
  S.rid = S.rcur.id;
  const out = await busy(saveReport());
  if (!out) return;
  S.mcur = null; S.route = 'report'; S.pane = 'form'; render(); afterRepRender();
  toast(`${fmtMD(m.meet_date)} 보고서에 넣었어요`);
}
function autoGrow(el){ if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(900, el.scrollHeight + 2) + 'px'; }

function armed(btn, label){
  if (btn.dataset.armed){ delete btn.dataset.armed; return true; }
  const old = btn.innerHTML; btn.dataset.armed = 1; btn.classList.add('danger','armed'); btn.textContent = label;
  setTimeout(() => { if (btn.isConnected && btn.dataset.armed){ delete btn.dataset.armed; btn.classList.remove('armed'); btn.innerHTML = old; } }, 3500);
  return false;
}

document.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const k = f.dataset.form, btn = f.querySelector('button[type=submit]') || $(`button[form="${f.id}"]`);
  const err = (id, m) => { const el = $('#'+id); if (el) el.textContent = m; };
  try {
    if (k === 'login'){
      const id = $('#lg-id').value.trim().toLowerCase(), pw = $('#lg-pw').value;
      if (!id || !pw) return err('lg-err', '아이디와 비밀번호를 입력하세요');
      if (!/^[a-z0-9]{3,20}$/.test(id)) return err('lg-err', '아이디는 영문 소문자·숫자입니다');
      await lockBtn(btn, '확인 중…', async () => {
        const { error } = await sb.auth.signInWithPassword({ email:`${id}@${DOMAIN}`, password:pw });
        if (error){
          const m = error.message || '';
          err('lg-err', /banned/i.test(m) ? '사용이 중지된 계정입니다. 관리자에게 문의하세요'
            : /rate|too many/i.test(m) ? '시도가 너무 많아요. 잠시 뒤 다시 해 주세요'
            : /Invalid login|invalid_credentials/i.test(m) ? '아이디 또는 비밀번호가 맞지 않습니다' : dbMsg(error));
          $('#lg-pw').value = ''; $('#lg-pw').focus(); return;
        }
        store.set('note-last-id', id); S.err = '';
        await afterPassword();
      });
    }
    if (k === 'otp'){
      const code = $$('.otp input').map(x => x.value).join('');
      if (!/^\d{6}$/.test(code)) return;
      await lockBtn(btn, '확인 중…', async () => {
        const { error } = await sb.auth.mfa.challengeAndVerify({ factorId:S.factorId, code });
        if (error){ err('otp-err', /invalid|expired/i.test(error.message||'') ? '숫자가 맞지 않아요. 앱에 표시된 지금 숫자를 입력하세요' : dbMsg(error)); $$('.otp input').forEach(x => x.value = ''); $('#otp0').focus(); $('#otp-ok').disabled = true; return; }
        await loadMe();
      });
    }
    if (k === 'enroll'){
      const code = $('#en-code').value.trim();
      if (!/^\d{6}$/.test(code)) return err('en-err', '앱에 표시된 6자리 숫자를 입력하세요');
      await lockBtn(btn, '확인 중…', async () => {
        const { error } = await sb.auth.mfa.challengeAndVerify({ factorId:S.enroll.id, code });
        if (error){ err('en-err', '숫자가 맞지 않아요. QR 을 다시 스캔했는지, 휴대폰 시간이 맞는지 확인하세요'); $('#en-code').select(); return; }
        S.enroll = null; await loadMe(); toast('인증 앱을 등록했어요. 다음 로그인부터 6자리를 묻습니다');
      });
    }
    if (k === 'reenroll'){
      const code = $('#re-code').value.trim();
      if (!/^\d{6}$/.test(code)) return err('re-err', '앱에 표시된 6자리 숫자를 입력하세요');
      await lockBtn(btn, '확인 중…', async () => {
        const { error } = await sb.auth.mfa.challengeAndVerify({ factorId:S.reEnroll.id, code });
        if (error) return err('re-err', '숫자가 맞지 않아요. 새 휴대폰으로 QR 을 스캔했는지 확인하세요');
        const newId = S.reEnroll.id; S.reEnroll = null;
        for (const old of S.factors.filter(x => x.id !== newId)) await sb.auth.mfa.unenroll({ factorId:old.id });
        const { data } = await sb.auth.mfa.listFactors(); S.factors = (data && data.totp || []).filter(x => x.status === 'verified');
        render(); toast('새 휴대폰으로 등록했어요. 예전 휴대폰의 숫자는 이제 쓸 수 없습니다');
      });
    }
    if (k === 'forcepw' || k === 'pw'){
      const p = k === 'forcepw' ? ['fp0','fp1','fp2','fp-err'] : ['pw0','pw1','pw2','pw-err'];
      const a = $('#'+p[0]).value, b = $('#'+p[1]).value, c = $('#'+p[2]).value;
      if (!a) return err(p[3], k === 'forcepw' ? '임시 비밀번호를 입력하세요' : '현재 비밀번호를 입력하세요');
      if (!pwOk(b)) return err(p[3], '새 비밀번호는 8자 이상, 영문과 숫자를 섞어 주세요');
      if (b !== c) return err(p[3], '새 비밀번호 두 칸이 서로 달라요');
      if (a === b) return err(p[3], '지금과 다른 비밀번호를 쓰세요');
      await lockBtn(btn, '바꾸는 중…', async () => {
        try { await fn('change_password', { current:a, next:b }); }
        catch(e2){ return err(p[3], e2.message); }
        if (k === 'forcepw'){ S.me.must_change_pw = false; S.screen = 'app'; render(); preload(); toast('비밀번호를 바꿨어요. 이제 note 를 쓸 수 있습니다'); }
        else { f.reset(); err(p[3], ''); toast('비밀번호를 바꿨어요. 다른 기기에서는 다시 로그인해야 합니다'); }
      });
    }
    if (k === 'phone'){
      const v = telNorm($('#me-phone').value);
      if (v === null) return toast('휴대폰 번호를 확인하세요 (예: 010-1234-5678)');
      await lockBtn(btn, '저장 중…', async () => {
        const { data, error } = await sb.from('profiles').update({ phone:v }).eq('id', S.me.id).select('phone');
        if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '저장하지 못했습니다');
        S.me.phone = v; $('#me-phone').value = v; toast('저장했어요');
      });
    }
    if (k === 'sender'){
      const v = $('#snd-name').value.trim();
      if (!v) return toast('보낸 사람 이름을 입력하세요');
      await lockBtn(btn, '저장 중…', async () => {
        const { data, error } = await sb.from('app_settings').update({ value:v, updated_by:S.me.id }).eq('key','sender_name').select();
        if (error || !data || !data.length) throw new Error(error ? dbMsg(error) : '권한이 없습니다');
        S.settings.sender_name = v; render(); toast('보낸 사람 이름을 저장했어요');
      });
    }
    if (k === 'add-mail' || k === 'add-sms'){
      const kind = k.slice(4), nm = $(`#${kind}-nm`).value.trim(), dp = $(`#${kind}-dp`).value.trim(); let ad = $(`#${kind}-ad`).value.trim();
      if (!nm) return err(`${kind}-err`, '이름을 입력하세요');
      if (kind === 'mail'){ ad = ad.toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ad)) return err(`${kind}-err`, '이메일 주소 형식을 확인하세요 (예: name@company.co.kr)'); }
      else { ad = telNorm(ad); if (!ad) return err(`${kind}-err`, '휴대폰 번호를 확인하세요 (예: 010-1234-5678)'); }
      await lockBtn(btn, '추가 중…', async () => {
        const row = kind === 'mail' ? { name:nm, dept:dp, email:ad } : { name:nm, dept:dp, phone:ad };
        const { error } = await sb.from(kind === 'mail' ? 'mail_recipients' : 'sms_recipients').insert(row);
        if (error) return err(`${kind}-err`, error.code === '23505' ? '이미 목록에 있는 주소예요' : dbMsg(error));
        await loadRcpt(kind); render(); toast(`${nm}님을 추가했어요`);
      });
    }
    if (k === 'acct'){
      const id = f.dataset.id, v = n => $('#a-'+n).value.trim();
      const role = $('#a-role').dataset.v === 'admin' ? 'admin' : 'member';
      if (!v('name')) return err('a-err', '이름을 입력하세요');
      const ph = telNorm(v('phone')); if (ph === null) return err('a-err', '휴대폰 번호를 확인하세요 (예: 010-1234-5678)');
      const body = { name:v('name'), dept:v('dept'), title:v('title'), phone:ph, role };
      if (!id){
        const login = v('login').toLowerCase();
        if (!/^[a-z0-9]{3,20}$/.test(login)) return err('a-err', '아이디는 영문 소문자·숫자 3~20자로 입력하세요');
        await lockBtn(btn, '만드는 중…', async () => {
          let r; try { r = await fn('create', Object.assign({ login_id:login }, body)); } catch(e2){ return err('a-err', e2.message); }
          await loadUsers(); render(); showTemp('계정을 만들었어요', body.name, login, r.temp_password);
        });
      } else {
        await lockBtn(btn, '저장 중…', async () => {
          try { await fn('update', Object.assign({ id }, body)); } catch(e2){ return err('a-err', e2.message); }
          if (id === S.me.id){ Object.assign(S.me, body); }
          await loadUsers(); closeOv(); render(); toast('저장했어요');
        });
      }
    }
  } catch(ex){ toast(ex.message || String(ex)); }
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset && t.dataset.filter && t.tagName === 'SELECT'){ S.f[t.dataset.filter] = t.value; render(); return; }
  if ((t.id === 'camIn' || t.id === 'albIn') && t.files && t.files.length){
    const files = [...t.files]; t.value = '';
    await addPhotos(files);
  }
});

let prevT = null, capT = null;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.rf && S.rcur && repMine(S.rcur)){
    const k = t.dataset.rf;
    if (k[0] === 's' && /^s\d+$/.test(k)) S.rcur.schedule[+k.slice(1)] = t.value;
    else S.rcur[k] = t.value;
    if (k === 'body' || k === 'etc') autoGrow(t);
    if (k[0] === 's' && /^s\d+$/.test(k)){ const el = $('#filled'); if (el) el.textContent = `${S.rcur.schedule.filter(x => x.trim()).length}/14칸`; }
    clearTimeout(prevT); prevT = setTimeout(refreshPreview, 120);
    queueSave();
    return;
  }
  if (t.dataset && t.dataset.mf && S.mcur){
    S.mcur[t.dataset.mf] = t.value;
    if (/agenda|discussion|decisions/.test(t.dataset.mf)) autoGrow(t);
    if (t.dataset.mf === 'title'){ const h = $('.ph h1'); if (h) h.textContent = t.value || '새 메모'; }
    if (t.dataset.mf === 'decisions'){ const b = $('[data-act=memToReport]'); if (b){ const on = !!t.value.trim(); b.disabled = !on; b.title = on ? '그날 현장활동보고서의 주요 업무/결과에 붙입니다' : '결정 사항을 먼저 적어 주세요'; } }
    queueMemoSave(); return;
  }
  if (t.dataset && t.dataset.td && S.mcur){
    const i = +t.dataset.i, k = t.dataset.td, td = S.mcur.todos[i];
    if (!td) return;
    if (k === 'k'){ td.k = t.checked; t.closest('.todo').classList.toggle('done', td.k); }
    else td[k] = t.value;
    queueMemoSave(); return;
  }
  if (t.dataset && t.dataset.pc && S.mcur){
    const p = (S.mcur.photos || []).find(x => x.id === t.dataset.pc);
    if (p){ p.caption = t.value; clearTimeout(capT); capT = setTimeout(() => {
      sb.from('meeting_photos').update({ caption:p.caption.slice(0,200) }).eq('id', p.id).then(({error}) => { if (error) toast(dbMsg(error)); });
    }, 900); }
    return;
  }
  if (t.dataset && t.dataset.filter === 'mq'){ S.f.mq = t.value;
    const g = $('#mgrid');
    if (g){ const q = t.value.trim().toLowerCase();
      let list = (S.meetings||[]).filter(m => memMatch(m, q));
      g.innerHTML = list.length ? list.map(memCard).join('') : '<div class="panel empty">검색 결과가 없습니다</div>';
      const c = $('.filters .hint'); if (c) c.textContent = `${list.length}건`; }
    return; }
  if (t.matches('.otp input')){
    t.value = t.value.replace(/\D/g,'').slice(-1);
    const i = +t.id.slice(3); if (t.value && i < 5) $('#otp'+(i+1)).focus();
    const all = $$('.otp input').every(x => x.value);
    $('#otp-ok').disabled = !all;
    if (all) $('#otp-ok').click();
  }
  if (t.id === 'en-code' || t.id === 're-code') t.value = t.value.replace(/\D/g,'').slice(0,6);
});
function addChip(v, refocus = true){
  const m = S.mcur, name = String(v||'').trim().replace(/,$/,'').slice(0,40);
  if (!m || !name) return false;
  if (m.people.includes(name)) return true;
  if (m.people.length >= 60) { toast('참석자는 60명까지 넣을 수 있어요'); return false; }
  m.people.push(name);
  const box = $('#chips'); if (!box) return true;
  box.innerHTML = chipsHTML(m);
  if (refocus){ const i = $('#chipIn'); if (i) i.focus(); }
  queueMemoSave();
  return true;
}
document.addEventListener('keydown', e => {
  const t = e.target;
  if (t.matches('.otp input') && e.key === 'Backspace' && !t.value){ const i = +t.id.slice(3); if (i > 0){ const p = $('#otp'+(i-1)); p.value = ''; p.focus(); } }
  if (t.id === 'chipIn' && S.mcur){
    if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && t.value.trim())){ e.preventDefault(); const v = t.value; t.value = ''; addChip(v); return; }
    if (e.key === 'Backspace' && !t.value && S.mcur.people.length){ e.preventDefault(); S.mcur.people.pop(); $('#chips').innerHTML = chipsHTML(S.mcur); $('#chipIn').focus(); queueMemoSave(); return; }
  }
  if (S.lb && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
    const b = $(e.key === 'ArrowLeft' ? '[data-act=lbPrev]' : '[data-act=lbNext]');
    if (b && !b.disabled) b.click();
    return;
  }
  if (e.key === 'Escape' && $('#ov').innerHTML){ S.lb = null; closeOv(); }
});
document.addEventListener('focusout', e => {
  if (e.target.id !== 'chipIn') return;
  const v = e.target.value.trim(); if (!v) return;
  e.target.value = '';
  // blur 처리가 끝난 뒤에 다시 그립니다 (그리는 도중 지우면 브라우저가 오류를 냅니다)
  setTimeout(() => addChip(v, false), 0);
});
document.addEventListener('paste', e => {
  const t = e.target; if (!t.matches('.otp input')) return;
  const d = (e.clipboardData.getData('text') || '').replace(/\D/g,'').slice(0,6); if (!d) return;
  e.preventDefault(); d.split('').forEach((c,i) => { const x = $('#otp'+i); if (x) x.value = c; });
  $('#otp-ok').disabled = d.length < 6; if (d.length === 6) $('#otp-ok').click();
});

// 점검용 손잡이 (브라우저 안에서만 도는 코드라 보안과는 무관합니다)
window.__note = { makeReportPdf, drawA4, jpegToPdf, wrapLines, S };

try { new ResizeObserver(() => fitA4()).observe($('#app')); } catch(e){}
addEventListener('beforeunload', e => {
  if ((S.rcur || S.mcur) && (saving || savePend || mSaving || mPend || /저장할 내용/.test(S.saved || ''))){ e.preventDefault(); e.returnValue = ''; }
});
addEventListener('pagehide', () => { try { flushSave(); } catch(e){} });
addEventListener('hashchange', () => {
  const tk = pubToken();
  if (tk){ if (S.screen !== 'pub' || !S.pub || S.pubToken !== tk){ S.pubToken = tk; openPublic(tk); } return; }
  if (S.screen === 'pub'){ S.pub = null; S.pubToken = ''; boot().catch(e => toLogin(dbMsg(e))); }
});

if (sb){
  sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT' && S.screen !== 'login') toLogin('로그아웃되었습니다. 다시 로그인하세요'); });
}
render();
boot().catch(e => toLogin(dbMsg(e)));
})();

