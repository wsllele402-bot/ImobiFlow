import React, { useEffect, useState } from 'react';
import './src/app.css';
import { dbService } from './src/services/dbService';
import { PropertyType, ExpenseCategory } from './types';

const brl = (n: any) => Number(n || 0).toLocaleString('pt-BR');
const TIPOS = Object.values(PropertyType);
const CATS = Object.values(ExpenseCategory);
const propIcon = (t: string) => t === PropertyType.CASA ? 'fa-house' : t === PropertyType.GALPAO ? 'fa-warehouse' : 'fa-building';
const initials = (n: string) => (n || '').split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || '--';
const fmtDate = (s: string) => { if (!s) return '—'; const p = s.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s; };
const HISTORY = [
  { m: 'Jan', receb: 11800, desp: 450 }, { m: 'Fev', receb: 12100, desp: 200 },
  { m: 'Mar', receb: 12300, desp: 980 }, { m: 'Abr', receb: 12750, desp: 540 }, { m: 'Mai', receb: 12750, desp: 120 },
];

// ---------------- LOGIN ----------------
const Login: React.FC<{ onIn: (u: any) => void }> = ({ onIn }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr(''); setBusy(true);
    try {
      if (isLogin) {
        const { user } = await dbService.signin(email.trim(), pass);
        onIn(user);
      } else {
        if (!name.trim()) { setErr('Informe seu nome.'); setBusy(false); return; }
        await dbService.signup(email.trim(), pass, name.trim());
        setErr(''); setIsLogin(true); alert('Conta criada! Agora faça login.');
      }
    } catch (e: any) {
      setErr('Não foi possível entrar. Confira e-mail e senha.');
    }
    setBusy(false);
  };

  return (
    <div id="iflogin">
      <div className="pane left">
        <span className="blob" style={{ width: 280, height: 280, background: '#a5b4fc', top: -40, left: -60 }} />
        <span className="blob" style={{ width: 220, height: 220, background: '#818cf8', bottom: -30, right: -40 }} />
        <div className="brandbig">
          <div className="mark"><i className="fas fa-building" /></div>
          <h1>Sua gestão de aluguéis, num lugar só.</h1>
          <p>Imóveis, inquilinos, contratos, despesas e o repasse do mês — organizados e sem planilha.</p>
        </div>
      </div>
      <div className="pane">
        <div className="card-login">
          <div className="brand" style={{ paddingLeft: 0 }}><div className="mk"><i className="fas fa-building" /></div><div className="nm">Imobi<span>Flow</span></div></div>
          <div className="hi" style={{ marginTop: 8 }}>{isLogin ? 'Bem-vindo' : 'Criar conta'}</div>
          <div className="sub">{isLogin ? 'Acesse o painel da sua gestão.' : 'Comece a organizar seus aluguéis.'}</div>
          {!isLogin && <div className="field-g"><label className="lbl">Nome</label><input className="inp" value={name} onChange={e => setName(e.target.value)} /></div>}
          <div className="field-g"><label className="lbl">E-mail</label><input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="field-g"><label className="lbl">Senha</label><input className="inp" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
          {err && <p style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600, marginTop: 12 }}>{err}</p>}
          <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Aguarde...' : (isLogin ? 'Acessar' : 'Criar conta')}</button>
          <div className="switch">{isLogin ? 'Novo por aqui?' : 'Já tem conta?'} <b onClick={() => { setErr(''); setIsLogin(!isLogin); }}>{isLogin ? 'Crie sua conta' : 'Fazer login'}</b></div>
        </div>
      </div>
    </div>
  );
};

// ---------------- APP ----------------
const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState('dashboard');
  const [owners, setOwners] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [fImo, setFImo] = useState({ q: '', type: '', status: '', owner: '' });
  const [fInq, setFInq] = useState('');
  const [fDesp, setFDesp] = useState({ q: '', cat: '', owner: '' });
  const [repOwner, setRepOwner] = useState('');

  useEffect(() => { (async () => { const u = await dbService.getMe(); setUser(u); if (u) await loadAll(); setBooting(false); })(); }, []);

  const loadAll = async () => {
    try {
      const [o, p, t, e] = await Promise.all([
        dbService.fetchData('owners'), dbService.fetchData('properties'),
        dbService.fetchData('tenants'), dbService.fetchData('expenses'),
      ]);
      setOwners(o); setProps(p); setTenants(t); setExpenses(e);
    } catch (err) { console.error(err); }
  };
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const logout = async () => { await dbService.logout(); setUser(null); };

  const save = async () => {
    const { coll, values } = form;
    try {
      const clean = { ...values };
      if (clean.price !== undefined) clean.price = Number(clean.price) || 0;
      if (clean.amount !== undefined) clean.amount = Number(clean.amount) || 0;
      if (clean.commissionRate !== undefined) clean.commissionRate = Number(clean.commissionRate) || 0;
      if (values.id) await dbService.update(coll, values.id, clean);
      else await dbService.insert(coll, clean);
      setForm(null); await loadAll(); notify('Salvo com sucesso ✓');
    } catch (err) { console.error(err); notify('Erro ao salvar'); }
  };
  const remove = async (coll: string, id: string, label: string) => {
    if (!window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;
    try { await dbService.delete(coll, id); await loadAll(); notify('Excluído'); }
    catch { notify('Erro ao excluir'); }
  };
  const setMaintenance = async (p: any) => {
    const next = p.status === 'maintenance' ? 'available' : 'maintenance';
    await dbService.update('properties', p.id, { status: next }); await loadAll();
    notify(next === 'maintenance' ? 'Imóvel em manutenção' : 'Imóvel reativado');
  };

  const calcOwner = (o: any) => {
    const ps = props.filter(p => p.ownerId === o.id && p.status === 'rented');
    const recebido = ps.reduce((s, p) => s + Number(p.price || 0), 0);
    const desp = expenses.filter(e => e.ownerId === o.id).reduce((s, e) => s + Number(e.amount || 0), 0);
    const rate = Number(o.commissionRate ?? 10);
    const mode = o.commissionMode || 'deducted';
    const taxa = Math.round(recebido * rate / 100);
    const liquido = mode === 'deducted' ? recebido - desp - taxa : recebido - desp;
    return { recebido, desp, rate, mode, taxa, liquido, names: ps.map(p => p.title).join(' · ') || 'Sem imóveis alugados' };
  };
  const oName = (id: string) => owners.find(o => o.id === id)?.name || '—';

  // ---- forms ----
  const setV = (k: string, v: any) => setForm((f: any) => ({ ...f, values: { ...f.values, [k]: v } }));
  const openImovel = (p?: any) => setForm({
    coll: 'properties', title: p ? 'Editar imóvel' : 'Novo imóvel', icon: 'fa-house',
    values: { title: '', type: PropertyType.KITNET, address: '', price: '', status: 'available', ownerId: owners[0]?.id || '', ...p },
    fields: [
      { k: 'title', l: 'Título', t: 'text' }, { k: 'type', l: 'Tipo', t: 'select', o: TIPOS.map(x => [x, x]) },
      { k: 'address', l: 'Endereço', t: 'text' },
      { k: 'ownerId', l: 'Proprietário', t: 'select', o: owners.map(o => [o.id, o.name]) },
      { k: 'price', l: 'Aluguel (R$)', t: 'number', half: true },
      { k: 'status', l: 'Situação', t: 'select', half: true, o: [['available', 'Disponível'], ['rented', 'Alugado'], ['maintenance', 'Manutenção']] },
    ],
  });
  const openOwner = (o?: any) => setForm({
    coll: 'owners', title: o ? 'Editar proprietário' : 'Novo proprietário', icon: 'fa-user',
    values: { name: '', phone: '', pixKey: '', commissionRate: 10, commissionMode: 'deducted', ...o },
    fields: [
      { k: 'name', l: 'Nome', t: 'text' }, { k: 'phone', l: 'Telefone', t: 'text' },
      { k: 'pixKey', l: 'Chave PIX', t: 'text' },
      { k: 'commissionRate', l: 'Comissão (%)', t: 'number', half: true },
      { k: 'commissionMode', l: 'Modelo comissão', t: 'select', half: true, o: [['deducted', 'Abatida no repasse'], ['invoiced', 'Faturada à parte']] },
    ],
  });
  const openTenant = (t?: any) => setForm({
    coll: 'tenants', title: t ? 'Editar inquilino' : 'Novo inquilino', icon: 'fa-user-group',
    values: { name: '', phone: '', document: '', notes: '', ...t },
    fields: [
      { k: 'name', l: 'Nome', t: 'text' }, { k: 'document', l: 'CPF / CNPJ', t: 'text' },
      { k: 'phone', l: 'Telefone', t: 'text' }, { k: 'notes', l: 'Observações', t: 'text' },
    ],
  });
  const openDespesa = (e?: any) => setForm({
    coll: 'expenses', title: e ? 'Editar despesa' : 'Nova despesa', icon: 'fa-receipt',
    values: { date: '2026-06-01', ownerId: owners[0]?.id || '', propertyId: '', category: ExpenseCategory.MAINTENANCE, description: '', amount: '', ...e },
    fields: [
      { k: 'date', l: 'Data', t: 'date' },
      { k: 'ownerId', l: 'Proprietário', t: 'select', o: owners.map(o => [o.id, o.name]) },
      { k: 'propertyId', l: 'Imóvel (opcional)', t: 'select', o: [['', '—']].concat(props.map(p => [p.id, p.title])) },
      { k: 'category', l: 'Categoria', t: 'select', o: CATS.map(x => [x, x]) },
      { k: 'description', l: 'Descrição', t: 'text' }, { k: 'amount', l: 'Valor (R$)', t: 'number' },
    ],
  });

  if (booting) return <div className="center"><div className="spin" /></div>;
  if (!user) return <Login onIn={async (u) => { setUser(u); await loadAll(); }} />;

  const titles: any = {
    dashboard: ['Dashboard', 'visão geral da carteira'], imoveis: ['Imóveis', 'gestão da carteira'],
    proprietarios: ['Proprietários', 'fichas de repasse'], inquilinos: ['Inquilinos', 'seus locatários'],
    despesas: ['Despesas', 'lançamentos do mês'], pagamentos: ['Pagamentos', 'cobranças'],
    relatorios: ['Relatórios', 'extrato por proprietário'],
  };

  // ---- dashboard chart helpers ----
  const recAll = owners.reduce((s, o) => s + calcOwner(o).recebido, 0);
  const despAll = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const hist = [...HISTORY, { m: 'Jun', receb: recAll, desp: despAll }];
  const maxv = Math.max(1, ...hist.map(h => Math.max(h.receb, h.desp)));
  const statusCount = (st: string) => props.filter(p => p.status === st).length;
  const donut = [
    { l: 'Alugado', v: statusCount('rented'), c: '#4f46e5' },
    { l: 'Disponível', v: statusCount('available'), c: '#94a3b8' },
    { l: 'Manutenção', v: statusCount('maintenance'), c: '#d97706' },
  ];
  const donutTotal = props.length;
  const donutCirc = 2 * Math.PI * 52; let donutOff = 0;

  const nav = (id: string, icon: string, label: string) => (
    <button key={id} className={screen === id ? 'active' : ''} onClick={() => setScreen(id)}><i className={'fas ' + icon} />{label}</button>
  );

  return (
    <div className="ifapp">
      <aside className="side">
        <div className="brand"><div className="mk"><i className="fas fa-building" /></div><div className="nm">Imobi<span>Flow</span></div></div>
        <nav className="nav">
          <div className="sec lbl">Gestão</div>
          {nav('dashboard', 'fa-chart-pie', 'Dashboard')}
          {nav('imoveis', 'fa-house', 'Imóveis')}
          {nav('proprietarios', 'fa-user', 'Proprietários')}
          {nav('inquilinos', 'fa-user-group', 'Inquilinos')}
          <div className="sec lbl">Financeiro</div>
          {nav('despesas', 'fa-receipt', 'Despesas')}
          {nav('pagamentos', 'fa-credit-card', 'Pagamentos')}
          {nav('relatorios', 'fa-file-invoice', 'Relatórios')}
        </nav>
        <div className="foot"><span className="av">{initials(user.name)}</span><div><div className="nn">{user.name}</div><div className="lbl" style={{ fontSize: 10 }}>Administrador</div></div><button className="logout" title="Sair" onClick={logout}><i className="fas fa-right-from-bracket" /></button></div>
      </aside>

      <main className="main">
        <header className="top">
          <div><h1>{titles[screen][0]}</h1><div className="subt">{titles[screen][1]}</div></div>
          <button className="btn-i" onClick={() => { if (screen === 'proprietarios') openOwner(); else if (screen === 'inquilinos') openTenant(); else if (screen === 'despesas') openDespesa(); else openImovel(); }}>
            <i className="fas fa-plus" /> Novo
          </button>
        </header>
        <div className="wrap">

          {screen === 'dashboard' && <>
            <div className="filters">
              <select value={repOwner} onChange={e => setRepOwner(e.target.value)}><option value="">Todos os proprietários</option>{owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
            </div>
            {(() => {
              const scOwners = repOwner ? owners.filter(o => o.id === repOwner) : owners;
              const scProps = repOwner ? props.filter(p => p.ownerId === repOwner) : props;
              const rec = scOwners.reduce((s, o) => s + calcOwner(o).recebido, 0);
              const rep = scOwners.reduce((s, o) => s + calcOwner(o).liquido, 0);
              const alug = scProps.filter(p => p.status === 'rented').length;
              const tot = scProps.filter(p => p.status !== 'maintenance').length;
              return <div className="kpis">
                <div className="kpi glass"><div className="ic bg-ind"><i className="fas fa-house" /></div><div className="lbl">Imóveis Alugados</div><div className="v">{alug} <small>/{tot}</small></div><div className="m">{tot - alug} disponível(is)</div></div>
                <div className="kpi glass"><div className="ic bg-eme"><i className="fas fa-sack-dollar" /></div><div className="lbl">Recebido no Mês</div><div className="v if-mono">{brl(rec)}</div><div className="m">aluguéis ativos</div></div>
                <div className="kpi glass"><div className="ic bg-amb"><i className="fas fa-right-left" /></div><div className="lbl">Saldo p/ Repasse</div><div className="v if-mono">{brl(rep)}</div><div className="m">{scOwners.length} proprietário(s)</div></div>
                <div className="kpi glass"><div className="ic bg-red"><i className="fas fa-screwdriver-wrench" /></div><div className="lbl">Em Manutenção</div><div className="v">{scProps.filter(p => p.status === 'maintenance').length}</div><div className="m">imóveis parados</div></div>
              </div>;
            })()}
            <div className="grid2">
              <div className="glass chartcard">
                <div className="ph" style={{ padding: '0 0 14px', border: 'none' }}><h3><span className="bar" />Recebido x Despesas — mês a mês</h3></div>
                <svg viewBox="0 0 340 176" width="100%" style={{ display: 'block' }}>
                  {hist.map((h, i) => {
                    const gw = 328 / hist.length, cx = 6 + gw * i + gw / 2, bw = Math.min(13, gw / 3.2);
                    const rH = h.receb / maxv * 142, dH = h.desp / maxv * 142;
                    return <g key={i}>
                      <rect x={cx - bw - 1.5} y={152 - rH} width={bw} height={Math.max(1, rH)} rx="3" fill="#059669" />
                      <rect x={cx + 1.5} y={152 - dH} width={bw} height={Math.max(1, dH)} rx="3" fill="#dc2626" />
                      <text x={cx} y="168" textAnchor="middle" style={{ font: '700 10px Inter', fill: '#9ca3af' }}>{h.m}</text>
                    </g>;
                  })}
                </svg>
                <div className="legend"><span><i style={{ background: '#059669' }} />Recebido</span><span><i style={{ background: '#dc2626' }} />Despesas</span></div>
              </div>
              <div className="glass chartcard">
                <div className="ph" style={{ padding: '0 0 14px', border: 'none' }}><h3><span className="bar" />Situação dos imóveis</h3></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <svg viewBox="0 0 128 128" width="120" height="120" style={{ flex: '0 0 auto' }}>
                    {donutTotal === 0 && <circle cx="64" cy="64" r="52" fill="none" stroke="#e5e7eb" strokeWidth="18" />}
                    {donut.filter(s => s.v > 0).map((s, i) => {
                      const len = s.v / donutTotal * donutCirc; const el = <circle key={i} cx="64" cy="64" r="52" fill="none" stroke={s.c} strokeWidth="18" strokeDasharray={`${len} ${donutCirc - len}`} strokeDashoffset={-donutOff} transform="rotate(-90 64 64)" />; donutOff += len; return el;
                    })}
                    <text x="64" y="60" textAnchor="middle" style={{ font: '800 22px Inter', fill: '#0b1220' }}>{donutTotal}</text>
                    <text x="64" y="78" textAnchor="middle" style={{ font: '700 10px Inter', fill: '#6b7280' }}>imóveis</text>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {donut.map(s => <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: s.c, display: 'inline-block' }} />{s.l}<span className="if-mono" style={{ marginLeft: 'auto', color: 'var(--gray)' }}>{s.v}</span></div>)}
                  </div>
                </div>
              </div>
            </div>
          </>}

          {screen === 'imoveis' && (() => {
            const list = props.filter(p => (!fImo.q || (p.title + ' ' + p.address).toLowerCase().includes(fImo.q.toLowerCase())) && (!fImo.type || p.type === fImo.type) && (!fImo.status || p.status === fImo.status) && (!fImo.owner || p.ownerId === fImo.owner));
            return <>
              <div className="scrhead"><div className="ti">Imóveis <small>· {list.length} de {props.length}</small></div><button className="btn-g" onClick={() => openImovel()}><i className="fas fa-plus" /> Novo imóvel</button></div>
              <div className="filters">
                <div className="fsearch"><i className="fas fa-search" /><input placeholder="Buscar por título ou endereço..." value={fImo.q} onChange={e => setFImo({ ...fImo, q: e.target.value })} /></div>
                <select value={fImo.type} onChange={e => setFImo({ ...fImo, type: e.target.value })}><option value="">Todos os tipos</option>{TIPOS.map(t => <option key={t}>{t}</option>)}</select>
                <select value={fImo.status} onChange={e => setFImo({ ...fImo, status: e.target.value })}><option value="">Todas as situações</option><option value="rented">Alugado</option><option value="available">Disponível</option><option value="maintenance">Manutenção</option></select>
                <select value={fImo.owner} onChange={e => setFImo({ ...fImo, owner: e.target.value })}><option value="">Todos os proprietários</option>{owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
              </div>
              {list.length === 0 ? <div className="glass emptyrow">Nenhum imóvel encontrado</div> :
                <div className="pgrid">{list.map(p => {
                  const off = p.status === 'maintenance';
                  const cover = off ? 'linear-gradient(135deg,#f59e0b,#d97706)' : p.status === 'available' ? 'linear-gradient(135deg,#9ca3af,#6b7280)' : 'linear-gradient(135deg,#6366f1,#4338ca)';
                  const badge = off ? <span className="badge pill warn">Manutenção</span> : p.status === 'available' ? <span className="badge pill vac">Disponível</span> : <span className="badge pill ok">Alugado</span>;
                  return <div key={p.id} className={'pcard glass' + (off ? ' off' : '')}>
                    <div className="cover" style={{ background: cover }}><i className={'fas ' + propIcon(p.type)} />{badge}</div>
                    <div className="body" onClick={() => openImovel(p)}><div className="ttl">{p.title}</div><div className="addr">{p.address || '—'}</div><div className="meta"><div className="price if-mono">{brl(p.price)}<small>/mês</small></div><div className="own">{oName(p.ownerId).split(' ')[0]}</div></div></div>
                    <div className="acts"><button className="act" title="Editar" onClick={() => openImovel(p)}><i className="fas fa-pen" /></button><button className={'act' + (off ? ' ok' : '')} title={off ? 'Reativar' : 'Manutenção'} onClick={() => setMaintenance(p)}><i className={'fas ' + (off ? 'fa-rotate-left' : 'fa-screwdriver-wrench')} /></button><button className="act danger" title="Excluir" onClick={() => remove('properties', p.id, `o imóvel "${p.title}"`)}><i className="fas fa-trash" /></button></div>
                  </div>;
                })}</div>}
            </>;
          })()}

          {screen === 'proprietarios' && <>
            <div className="scrhead"><div className="ti">Proprietários <small>· fechamento do mês</small></div><button className="btn-g" onClick={() => openOwner()}><i className="fas fa-plus" /> Novo proprietário</button></div>
            <div className="note"><i className="fas fa-circle-info" /><span>Cada proprietário tem sua regra de comissão. No modo <b>abatida</b> a comissão sai antes do repasse; no modo <b>faturada</b> repassa o valor cheio e você cobra depois.</span></div>
            {owners.length === 0 ? <div className="glass emptyrow">Nenhum proprietário cadastrado</div> : owners.map(o => {
              const c = calcOwner(o);
              return <div key={o.id} className="glass repcard">
                <div className="reph"><span className="av">{initials(o.name)}</span><div className="g"><div className="nm">{o.name}</div><div className="md">{c.names}</div></div>
                  {c.mode === 'deducted' ? <span className="pill ok">Abatida · {c.rate}%</span> : <span className="pill idg">Faturada · {c.rate}%</span>}
                  <div className="acts" style={{ marginLeft: 6 }}><button className="act" onClick={() => openOwner(o)}><i className="fas fa-pen" /></button><button className="act danger" onClick={() => remove('owners', o.id, o.name)}><i className="fas fa-trash" /></button></div>
                </div>
                <div className="repsum">
                  <div className="c"><div className="lbl">Total Recebido</div><div className="val if-mono">{brl(c.recebido)}</div></div>
                  <div className="c"><div className="lbl">Despesas</div><div className="val if-mono" style={{ color: c.desp > 0 ? 'var(--red)' : undefined }}>{brl(c.desp)}</div></div>
                  <div className="c"><div className="lbl">Taxa Adm {c.mode === 'invoiced' ? '(à parte)' : ''}</div><div className="val if-mono" style={{ color: c.mode === 'deducted' ? 'var(--amber)' : 'var(--indigo)' }}>{brl(c.taxa)}</div></div>
                  <div className="c"><div className="lbl">Líquido Repasse</div><div className="val if-mono" style={{ color: 'var(--emerald)' }}>{brl(c.liquido)}</div></div>
                </div>
                <div className="repfoot"><span className="lbl">{c.mode === 'invoiced' && c.taxa > 0 ? `Repassa cheio · cobra ${brl(c.taxa)} depois` : 'Repasse do mês'}</span><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span className="net if-mono">R$ {brl(c.liquido)}</span><button className="btn-i" onClick={() => notify('Repasse registrado ✓')}>Repassar</button></div></div>
              </div>;
            })}
          </>}

          {screen === 'inquilinos' && (() => {
            const list = tenants.filter(t => !fInq || (t.name || '').toLowerCase().includes(fInq.toLowerCase()));
            return <>
              <div className="scrhead"><div className="ti">Inquilinos <small>· {tenants.length}</small></div><button className="btn-g" onClick={() => openTenant()}><i className="fas fa-plus" /> Novo inquilino</button></div>
              <div className="filters"><div className="fsearch"><i className="fas fa-search" /><input placeholder="Buscar inquilino..." value={fInq} onChange={e => setFInq(e.target.value)} /></div></div>
              <div className="glass tablewrap"><div className="tbl-scroll"><table>
                <thead><tr><th>Inquilino</th><th className="hidesm">Documento</th><th className="hidesm">Telefone</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                <tbody>{list.length === 0 ? <tr><td colSpan={4} className="emptyrow">Nenhum inquilino</td></tr> : list.map(t => <tr key={t.id}>
                  <td className="t">{t.name}</td><td className="hidesm if-mono">{t.document || '—'}</td><td className="hidesm">{t.phone || '—'}</td>
                  <td><div className="acts" style={{ justifyContent: 'flex-end' }}><button className="act" onClick={() => openTenant(t)}><i className="fas fa-pen" /></button><button className="act danger" onClick={() => remove('tenants', t.id, t.name)}><i className="fas fa-trash" /></button></div></td>
                </tr>)}</tbody>
              </table></div></div>
            </>;
          })()}

          {screen === 'despesas' && (() => {
            const list = expenses.filter(e => (!fDesp.q || (e.description || '').toLowerCase().includes(fDesp.q.toLowerCase())) && (!fDesp.cat || e.category === fDesp.cat) && (!fDesp.owner || e.ownerId === fDesp.owner));
            const tot = list.reduce((s, e) => s + Number(e.amount || 0), 0);
            return <>
              <div className="scrhead"><div className="ti">Despesas <small>· total R$ {brl(tot)}</small></div><button className="btn-g" onClick={() => openDespesa()}><i className="fas fa-plus" /> Nova despesa</button></div>
              <div className="note"><i className="fas fa-circle-info" /><span>As despesas lançadas aqui são <b>descontadas do repasse</b> do proprietário.</span></div>
              <div className="filters">
                <div className="fsearch"><i className="fas fa-search" /><input placeholder="Buscar descrição..." value={fDesp.q} onChange={e => setFDesp({ ...fDesp, q: e.target.value })} /></div>
                <select value={fDesp.cat} onChange={e => setFDesp({ ...fDesp, cat: e.target.value })}><option value="">Todas as categorias</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
                <select value={fDesp.owner} onChange={e => setFDesp({ ...fDesp, owner: e.target.value })}><option value="">Todos os proprietários</option>{owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
              </div>
              <div className="glass tablewrap"><div className="tbl-scroll"><table>
                <thead><tr><th>Data</th><th>Proprietário</th><th className="hidesm">Categoria</th><th>Descrição</th><th>Valor</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                <tbody>{list.length === 0 ? <tr><td colSpan={6} className="emptyrow">Nenhuma despesa</td></tr> : list.map(e => <tr key={e.id}>
                  <td className="if-mono">{fmtDate(e.date)}</td><td className="t">{oName(e.ownerId)}</td><td className="hidesm">{e.category}</td><td>{e.description || '—'}</td>
                  <td className="if-mono" style={{ color: 'var(--red)', fontWeight: 700 }}>{brl(e.amount)}</td>
                  <td><div className="acts" style={{ justifyContent: 'flex-end' }}><button className="act" onClick={() => openDespesa(e)}><i className="fas fa-pen" /></button><button className="act danger" onClick={() => remove('expenses', e.id, 'esta despesa')}><i className="fas fa-trash" /></button></div></td>
                </tr>)}</tbody>
              </table></div></div>
            </>;
          })()}

          {screen === 'pagamentos' && <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <i className="fas fa-credit-card" style={{ fontSize: 34, color: 'var(--indigo)' }} />
            <h3 style={{ margin: '14px 0 6px' }}>Cobranças</h3>
            <p style={{ color: 'var(--gray)', maxWidth: 420, margin: '0 auto' }}>A tela de cobranças (com boleto/PIX via Asaas) entra na próxima etapa, ligada à confirmação automática de pagamento.</p>
          </div>}

          {screen === 'relatorios' && <>
            <div className="scrhead"><div className="ti">Relatório de fechamento <small>· para enviar ao proprietário</small></div></div>
            <div className="filters">
              <select value={repOwner || owners[0]?.id || ''} onChange={e => setRepOwner(e.target.value)}>{owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
            </div>
            {(() => {
              const o = owners.find(x => x.id === (repOwner || owners[0]?.id)); if (!o) return <div className="glass emptyrow">Cadastre um proprietário primeiro</div>;
              const c = calcOwner(o); const ps = props.filter(p => p.ownerId === o.id && p.status === 'rented'); const exps = expenses.filter(e => e.ownerId === o.id);
              return <div className="glass" style={{ maxWidth: 720, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 26px', background: 'var(--ink)', color: '#fff' }}>
                  <div><div style={{ fontWeight: 900, fontSize: 19 }}>Imobi<span style={{ color: '#a5b4fc' }}>Flow</span></div><div style={{ fontSize: 12, opacity: .85, marginTop: 6 }}>Extrato de Repasse</div></div>
                  <div style={{ textAlign: 'right', fontSize: 12, opacity: .85 }}>Competência<br /><b style={{ color: '#fff' }}>Junho / 2026</b></div>
                </div>
                <div style={{ padding: '22px 26px' }}>
                  <div style={{ marginBottom: 18 }}><div className="lbl">Proprietário</div><div style={{ fontWeight: 800, fontSize: 17, marginTop: 3 }}>{o.name}</div><div style={{ fontSize: 12, color: 'var(--gray)' }}>{o.phone}{o.pixKey ? ' · PIX: ' + o.pixKey : ''}</div></div>
                  <div className="lbl" style={{ marginBottom: 8 }}>Aluguéis recebidos</div>
                  {ps.length ? ps.map(p => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line2)', fontSize: 13.5 }}><span>{p.title}</span><span className="if-mono">R$ {brl(p.price)}</span></div>) : <div style={{ color: 'var(--gray)', fontSize: 13, padding: '6px 0' }}>Sem aluguéis no período</div>}
                  <div className="lbl" style={{ margin: '18px 0 8px' }}>Despesas</div>
                  {exps.length ? exps.map(e => <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line2)', fontSize: 13.5 }}><span>{fmtDate(e.date)} · {e.description || e.category}</span><span className="if-mono">− R$ {brl(e.amount)}</span></div>) : <div style={{ color: 'var(--gray)', fontSize: 13, padding: '6px 0' }}>Sem despesas no período</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, background: 'var(--emerald-50)', borderRadius: 14, padding: '15px 18px' }}><span className="lbl" style={{ color: 'var(--emerald)' }}>Líquido a repassar</span><span className="if-mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--emerald)' }}>R$ {brl(c.liquido)}</span></div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}><button className="btn-g" onClick={() => window.print()}><i className="fas fa-print" /> Imprimir / PDF</button><button className="btn-g" onClick={() => notify('Enviaria ao proprietário')}><i className="fas fa-paper-plane" /> Enviar</button></div>
                </div>
              </div>;
            })()}
          </>}

        </div>
      </main>

      {/* mobile nav */}
      <nav className="mob">
        {nav('dashboard', 'fa-chart-pie', 'Início')}{nav('imoveis', 'fa-house', 'Imóveis')}{nav('despesas', 'fa-receipt', 'Despesas')}{nav('proprietarios', 'fa-right-left', 'Repasse')}
      </nav>

      {/* form modal */}
      {form && <div className="ov" onClick={e => { if ((e.target as any).className === 'ov') setForm(null); }}>
        <div className="modal">
          <div className="mh"><h3><i className={'fas ' + form.icon} /> {form.title}</h3></div>
          <div className="mb">
            {form.fields.map((f: any, i: number) => {
              const inGroup = f.half && form.fields[i - 1]?.half;
              if (inGroup) return null;
              const renderField = (fld: any) => (
                <div className="field-g" style={{ marginTop: 0, flex: 1 }} key={fld.k}>
                  <label className="lbl">{fld.l}</label>
                  {fld.t === 'select'
                    ? <select className="inp" value={form.values[fld.k] ?? ''} onChange={e => setV(fld.k, e.target.value)}>{fld.o.map((op: any) => <option key={op[0]} value={op[0]}>{op[1]}</option>)}</select>
                    : <input className="inp" type={fld.t} value={form.values[fld.k] ?? ''} onChange={e => setV(fld.k, e.target.value)} />}
                </div>
              );
              if (f.half && form.fields[i + 1]?.half) return <div key={i} style={{ display: 'flex', gap: 12, marginTop: 14 }}>{renderField(f)}{renderField(form.fields[i + 1])}</div>;
              return <div key={i} style={{ marginTop: 14 }}>{renderField(f)}</div>;
            })}
          </div>
          <div className="mf"><button className="cancel" onClick={() => setForm(null)}>Cancelar</button><button className="confirm" onClick={save}>Salvar</button></div>
        </div>
      </div>}

      {toast && <div className="toast"><i className="fas fa-check-circle" />{toast}</div>}
    </div>
  );
};

export default App;
