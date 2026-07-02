
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { Property, PaymentStatus, PropertyType, Tenant, Owner, AsaasPayment, Lease, InspectionItem, DocumentFile, Expense, ExpenseCategory, User } from './types';
import StatCard from './components/StatCard';
import PropertyCard from './components/PropertyCard';
import PropertyDetails from './components/PropertyDetails';
import PropertyPresentation from './components/PropertyPresentation';
import Logo from './components/Logo';
import { GoogleGenAI } from "@google/genai";
import imageCompression from 'browser-image-compression';
import { dbService } from './src/services/dbService';

// --- Auth & Storage Helpers ---

const STORAGE_KEYS = {
  USER: 'imobiflow_user',
  THEME: 'imobiflow_theme'
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getPaymentStatus = (payment: any) => {
  const today = new Date().toISOString().split('T')[0];
  if (payment.status === PaymentStatus.RECEIVED) return PaymentStatus.RECEIVED;
  if (payment.status === PaymentStatus.OVERDUE || payment.dueDate < today) return PaymentStatus.OVERDUE;
  return PaymentStatus.PENDING;
};

// --- Views Auxiliares ---

const Notification = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] min-w-[320px]"
  >
    <div className={`glass-card p-4 rounded-2xl border-gray-200 dark:border-white/10 flex items-center gap-4 shadow-2xl dark:shadow-black/50`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
        <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
      </div>
      <p className="text-sm font-bold text-gray-900 dark:text-white flex-1">{message}</p>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
        <i className="fas fa-times"></i>
      </button>
    </div>
  </motion.div>
);

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, ShieldCheck, Zap, Eye, EyeOff, Globe, Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const AuthView = ({ onLogin, onNotify }: { onLogin: (user: User) => void, onNotify: (msg: string, type: 'success' | 'error') => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    try {
      if (isLogin) {
        const data = await dbService.signin(normalizedEmail, password);
        onLogin(data.user);
      } else {
        if (!name.trim()) {
          onNotify('Por favor, informe seu nome completo.', 'error');
          setLoading(false);
          return;
        }
        await dbService.signup(normalizedEmail, password, name);
        onNotify('Conta criada com sucesso! Faça login.', 'success');
        setIsLogin(true);
      }
    } catch (err: any) {
      onNotify('Erro: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-indigo-500/30 overflow-hidden font-sans transition-colors duration-300">
      {/* Left Side: Immersive Visuals */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gray-50 dark:bg-[#050505] border-r border-gray-200 dark:border-white/5">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[100%] h-[100%] bg-indigo-600/10 rounded-full blur-[140px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, -30, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[20%] -right-[10%] w-[90%] h-[90%] bg-emerald-500/5 rounded-full blur-[120px]" 
          />
        </div>

        {/* Grainy Texture Overlay */}
        <div className="absolute inset-0 z-[1] opacity-[0.02] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        <div className="relative z-10 p-20 flex flex-col justify-between h-full w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Logo size="lg" />
          </motion.div>

          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-white/[0.03] border border-indigo-100 dark:border-white/10 backdrop-blur-2xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-gray-300">Inteligência Imobiliária</span>
              </div>
              
              <h2 className="text-[5.5rem] font-bold tracking-[-0.04em] leading-[0.88] text-gray-900 dark:text-white">
                O futuro da <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-indigo-400 to-emerald-400">gestão de Imóveis</span>
              </h2>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-lg">
                Projetado para investidores e imobiliárias que não aceitam nada menos que a excelência operacional.
              </p>
            </motion.div>

            <div className="mt-16 flex items-center gap-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex -space-x-3"
              >
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#050505] bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" loading="lazy" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#050505] bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                  +2k
                </div>
              </motion.div>
              <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="flex text-emerald-500 dark:text-emerald-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Avaliação 4.9/5</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            <div className="flex items-center gap-6">
              <span className="hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer">Privacidade</span>
              <span className="hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer">Segurança</span>
              <span className="hover:text-indigo-600 dark:hover:text-white transition-colors cursor-pointer">API</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={12} />
              <span>PT-BR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Sophisticated Form */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-8 md:p-16 relative bg-white dark:bg-[#050505]">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md relative z-10"
        >
          <motion.div variants={itemVariants} className="lg:hidden mb-12 flex justify-center">
            <Logo size="lg" />
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12 space-y-4">
            <h3 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isLogin ? 'Bem-vindo' : 'Crie sua conta'}
            </h3>
            <p className="text-gray-500 font-medium text-lg">
              {isLogin ? 'Acesse o painel de controle da sua imobiliária.' : 'Junte-se à elite da gestão imobiliária.'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-2"
                >
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Nome Completo</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full pl-12 pr-5 py-4.5 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 dark:text-white text-gray-900" 
                      placeholder="Seu nome" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="glass-input w-full pl-12 pr-5 py-4.5 rounded-2xl text-sm font-medium" 
                  placeholder="exemplo@empresa.com" 
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">Senha de Acesso</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Recuperar</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="glass-input w-full pl-12 pr-14 py-4.5 rounded-2xl text-sm font-medium" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-4">
              <motion.button 
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                disabled={loading}
                className={`relative w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4.5 rounded-2xl font-bold text-sm shadow-2xl shadow-indigo-500/20 transition-all flex justify-center items-center gap-3 group overflow-hidden ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isLogin ? 'Acessar Dashboard' : 'Finalizar Cadastro'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-12 text-center">
            <p className="text-gray-500 text-sm font-medium">
              {isLogin ? 'Novo no ImobiFlow?' : 'Já possui acesso?'}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="ml-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors border-b border-indigo-400/30 hover:border-indigo-300"
              >
                {isLogin ? 'Crie sua conta agora' : 'Faça o login'}
              </button>
            </p>
          </motion.div>

          {/* Trusted By Section */}
          <motion.div 
            variants={itemVariants}
            className="mt-16 pt-10 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-6"
          >
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Tecnologia de Ponta</p>
            <div className="flex items-center gap-10 opacity-20 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-700">
              <ShieldCheck size={24} />
              <Zap size={24} />
              <CheckCircle2 size={24} />
              <div className="text-xl font-black tracking-tighter">AI</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};



const SubscriptionView = ({ onSelectPlan }: { onSelectPlan: (plan: User['plan']) => void }) => {
  const plans = [
    { id: 'basic', name: 'Básico', price: 'R$ 49', features: ['Até 5 imóveis', 'Cobranças via Pix', 'Suporte por e-mail'], color: 'border-gray-200 dark:border-gray-800' },
    { id: 'pro', name: 'Profissional', price: 'R$ 97', features: ['Imóveis ilimitados', 'Split de Pagamento', 'Suporte WhatsApp', 'IA Geradora de Anúncios'], color: 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-indigo-100 dark:shadow-none shadow-2xl', popular: true },
    { id: 'enterprise', name: 'Enterprise', price: 'R$ 197', features: ['Múltiplos Usuários', 'Customização White-label', 'API de Integração'], color: 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' }
  ];
  return (
    <div className="py-12 px-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Logo size="lg" className="justify-center mb-6" />
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Escolha seu Plano</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Assine agora para liberar a gestão completa dos seus imóveis.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div key={plan.id} className={`relative p-8 rounded-[40px] border-2 flex flex-col transition-all hover:scale-105 ${plan.color}`}>
              {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Mais Vendido</span>}
              <h3 className="text-xl font-black uppercase tracking-widest mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8"><span className="text-4xl font-black">{plan.price}</span><span className="text-xs font-bold opacity-60">/mês</span></div>
              <ul className="space-y-4 mb-10 flex-1">{plan.features.map((f, i) => (<li key={i} className="flex items-center gap-3 text-xs font-bold"><i className="fas fa-check-circle text-emerald-500"></i><span>{f}</span></li>))}</ul>
              <button onClick={() => onSelectPlan(plan.id as any)} className={`w-full py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all ${plan.id === 'enterprise' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Assinar Plano</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Dashboard View ---

const DashboardView = ({ properties, payments, owners, tenants, expenses, leases, navigate }: any) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const filteredData = useMemo(() => {
    let p = [...(payments || [])];
    let e = [...(expenses || [])];
    let props = [...(properties || [])];

    if (selectedOwnerId !== 'all') {
      const ownerProperties = properties.filter((prop: any) => prop.ownerId === selectedOwnerId);
      const propIds = ownerProperties.map((prop: any) => prop.id);
      const ownerLeaseIds = (leases || []).filter((l: any) => propIds.includes(l.propertyId)).map((l: any) => l.id);
      
      p = p.filter((pay: any) => ownerLeaseIds.includes(pay.leaseId));
      e = e.filter((exp: any) => exp.ownerId === selectedOwnerId || propIds.includes(exp.propertyId));
      props = ownerProperties;
    }

    // Filter by year
    p = p.filter((pay: any) => pay.dueDate.startsWith(selectedYear));
    e = e.filter((exp: any) => exp.date.startsWith(selectedYear));

    // Filter by month if not 'all'
    if (selectedMonth !== 'all') {
      const monthStr = selectedMonth.padStart(2, '0');
      p = p.filter((pay: any) => pay.dueDate.split('-')[1] === monthStr);
      e = e.filter((exp: any) => exp.date.split('-')[1] === monthStr);
    }

    return { payments: p, expenses: e, properties: props };
  }, [payments, expenses, properties, leases, selectedOwnerId, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const { payments: p, expenses: e, properties: props } = filteredData;
    
    const totalExpected = p.reduce((acc: number, curr: any) => acc + curr.amount + (curr.interest || 0), 0);
    const received = p.filter((p: any) => getPaymentStatus(p) === PaymentStatus.RECEIVED).reduce((acc: number, curr: any) => acc + curr.amount + (curr.interest || 0), 0);
    const overdue = p.filter((p: any) => getPaymentStatus(p) === PaymentStatus.OVERDUE).reduce((acc: number, curr: any) => acc + curr.amount + (curr.interest || 0), 0);
    const delinquencyRate = totalExpected > 0 ? Math.round((overdue / totalExpected) * 100) : 0;
    const totalExpenses = e.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const occupied = props.filter((p: any) => p.status === 'rented').length;
    const occupancyRate = props.length > 0 ? Math.round((occupied / props.length) * 100) : 0;
    return { received, totalExpenses, netProfit: received - totalExpenses, delinquencyRate, occupancyRate, totalExpected };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result = [];
    
    // For the chart, we only filter by Owner and Year, so we see the trend
    let p = [...(payments || [])];
    let e = [...(expenses || [])];

    if (selectedOwnerId !== 'all') {
      const ownerProperties = properties.filter((prop: any) => prop.ownerId === selectedOwnerId);
      const propIds = ownerProperties.map((prop: any) => prop.id);
      const ownerLeaseIds = (leases || []).filter((l: any) => propIds.includes(l.propertyId)).map((l: any) => l.id);
      
      p = p.filter((pay: any) => ownerLeaseIds.includes(pay.leaseId));
      e = e.filter((exp: any) => exp.ownerId === selectedOwnerId || propIds.includes(exp.propertyId));
    }

    p = p.filter((pay: any) => pay.dueDate.startsWith(selectedYear));
    e = e.filter((exp: any) => exp.date.startsWith(selectedYear));

    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const monthLabel = months[monthIdx];
      const monthStr = (monthIdx + 1).toString().padStart(2, '0');
      
      const monthPayments = p.filter((pay: any) => {
        return pay.dueDate.split('-')[1] === monthStr && pay.status === PaymentStatus.RECEIVED;
      });
      const monthExpenses = e.filter((exp: any) => {
        return exp.date.split('-')[1] === monthStr;
      });
      
      const rev = monthPayments.reduce((acc: number, curr: any) => acc + curr.amount + (curr.interest || 0), 0);
      const exp = monthExpenses.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      result.push({ name: monthLabel, rev, exp, profit: rev - exp });
    }
    return result;
  }, [payments, expenses, properties, leases, selectedOwnerId, selectedYear]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Filters Section */}
      <div className="glass-card p-6 rounded-[32px] border-white/5 shadow-xl flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Proprietário</label>
          <select 
            value={selectedOwnerId} 
            onChange={(e) => setSelectedOwnerId(e.target.value)} 
            className="w-full p-3 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
          >
            <option value="all" className="bg-white dark:bg-[#050505]">Todos os Proprietários</option>
            {owners.map((o: any) => <option key={o.id} value={o.id} className="bg-white dark:bg-[#050505]">{o.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-40 space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Mês</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="w-full p-3 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
          >
            <option value="all" className="bg-white dark:bg-[#050505]">Ano Inteiro</option>
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
              <option key={i+1} value={(i+1).toString()} className="bg-white dark:bg-[#050505]">{m}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-32 space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Ano</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)} 
            className="w-full p-3 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
          >
            {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()).map(y => (
              <option key={y} value={y} className="bg-white dark:bg-[#050505]">{y}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => {
            setSelectedOwnerId('all');
            setSelectedMonth('all');
            setSelectedYear(new Date().getFullYear().toString());
          }}
          className="p-3 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-indigo-600 transition-all"
          title="Limpar Filtros"
        >
          <i className="fas fa-undo"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita Bruta" value={`R$ ${formatCurrency(stats.received)}`} icon="fa-wallet" color="bg-emerald-500" />
        <StatCard title="Despesas" value={`R$ ${formatCurrency(stats.totalExpenses)}`} icon="fa-receipt" color="bg-red-500" />
        <StatCard title="Inadimplência" value={`${stats.delinquencyRate}%`} icon="fa-exclamation-triangle" color="bg-amber-500" trend={stats.delinquencyRate > 15 ? "Alto" : "Normal"} />
        <StatCard title="Ocupação" value={`${stats.occupancyRate}%`} icon="fa-chart-line" color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card p-8 rounded-[32px] overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
             <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Performance Financeira</h3>
               <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">Fluxo de Caixa</p>
             </div>
             <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Receitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Despesas</span>
                </div>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-white/5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'var(--tooltip-bg)', borderRadius: '16px', border: '1px solid var(--tooltip-border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} 
                  itemStyle={{fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'}} 
                  formatter={(value: any) => `R$ ${formatCurrency(value)}`}
                />
                <Bar dataKey="rev" fill="#6366f1" radius={[6, 6, 0, 0]} name="Receita" barSize={30} />
                <Bar dataKey="exp" fill="#f87171" radius={[6, 6, 0, 0]} name="Despesa" barSize={30} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Lucro" dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'currentColor'}} className="text-white dark:text-[#050505]" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="lg:col-span-4 glass-card p-8 rounded-[32px] flex flex-col justify-center text-center space-y-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
           <div className="p-6 bg-indigo-600/10 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto text-indigo-400 text-4xl border border-indigo-500/20">
             <i className="fas fa-hand-holding-usd"></i>
           </div>
           <div>
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Saldo Disponível</h3>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">R$ {formatCurrency(stats.netProfit)}</p>
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Esperado</span>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">R$ {formatCurrency(stats.totalExpected)}</span>
                </div>
              </div>
           </div>
           <button onClick={() => navigate('/closing')} className="relative w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
             Ver Fechamento
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Closing Report View ---

const ClosingReportView = ({ owners, properties, payments, expenses, leases, tenants, closings, onNotify, onAddClosing }: any) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState(owners[0]?.id || '');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [observations, setObservations] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedOwnerId && owners.length > 0) {
      setSelectedOwnerId(owners[0].id);
    }
  }, [owners, selectedOwnerId]);

  const isClosed = useMemo(() => {
    if (!selectedOwnerId) return false;
    return (closings || []).some((c: any) => 
      c.ownerId === selectedOwnerId && 
      Number(c.month) === Number(month) && 
      String(c.year) === String(year)
    );
  }, [closings, selectedOwnerId, month, year]);

  useEffect(() => {
    const existingClosing = closings.find((c: any) => 
      c.ownerId === selectedOwnerId && 
      c.month === month && 
      c.year === year
    );
    if (existingClosing) {
      setObservations(existingClosing.observations || '');
    } else {
      setObservations('');
    }
  }, [selectedOwnerId, month, year, closings]);

  const reportData = useMemo(() => {
    if (!selectedOwnerId) return null;
    const owner = owners.find((o: any) => o.id === selectedOwnerId);
    const ownerProperties = properties.filter((p: any) => p.ownerId === selectedOwnerId);
    const propIds = ownerProperties.map((p: any) => p.id);
    const ownerLeases = leases.filter((l: any) => propIds.includes(l.propertyId));
    const leaseIds = ownerLeases.map((l: any) => l.id);
    
    // Payments for the selected month/year
    const allPeriodPayments = payments.filter((p: any) => 
      leaseIds.includes(p.leaseId) && 
      parseInt(p.dueDate.split('-')[1]) === month &&
      p.dueDate.split('-')[0] === year
    );

    const receivedPayments = allPeriodPayments.filter(p => getPaymentStatus(p) === PaymentStatus.RECEIVED);
    const overduePayments = allPeriodPayments.filter(p => getPaymentStatus(p) === PaymentStatus.OVERDUE);

    // Expenses in the selected month/year
    const ownerExpenses = expenses.filter((e: any) => 
      (e.ownerId === selectedOwnerId || propIds.includes(e.propertyId)) && 
      parseInt(e.date.split('-')[1]) === month &&
      e.date.split('-')[0] === year
    );

    const totalIncome = receivedPayments.reduce((acc: number, curr: any) => acc + curr.amount + (curr.interest || 0), 0);
    const totalExpenses = ownerExpenses.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    
    const totalProperties = ownerProperties.length;
    
    // Period-aware metrics: A property is "rented" if it has an active lease or a payment due in this period
    const periodLeaseIds = allPeriodPayments.map(p => p.leaseId);
    const rentedInPeriodIds = leases
      .filter((l: any) => periodLeaseIds.includes(l.id))
      .map((l: any) => l.propertyId);
    
    const rentedCount = ownerProperties.filter((p: any) => rentedInPeriodIds.includes(p.id)).length;
    const maintenanceCount = ownerProperties.filter((p: any) => p.status === 'maintenance').length;
    
    // Disponíveis = Imóveis que não estão alugados no período E não estão em manutenção
    const availableCount = ownerProperties.filter((p: any) => 
      !rentedInPeriodIds.includes(p.id) && p.status !== 'maintenance'
    ).length;

    const occupancyRate = totalProperties > 0 ? (rentedCount / totalProperties) * 100 : 0;
    
    const totalExpectedIncome = allPeriodPayments.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const delinquencyRate = totalExpectedIncome > 0 ? (overduePayments.reduce((acc, curr) => acc + curr.amount, 0) / totalExpectedIncome) * 100 : 0;

    // Sort incomes by property title to group them, then by date
    const sortedIncomes = [...receivedPayments].sort((a, b) => {
      const getPropTitle = (pay: any) => {
        const lease = leases.find((l: any) => l.id === pay.leaseId);
        return properties.find((p: any) => p.id === lease?.propertyId)?.title || '';
      };
      const titleA = getPropTitle(a);
      const titleB = getPropTitle(b);
      if (titleA !== titleB) return titleA.localeCompare(titleB);
      return a.dueDate.localeCompare(b.dueDate);
    });

    return { 
      owner, 
      properties: ownerProperties, 
      incomes: sortedIncomes, 
      expenses: ownerExpenses, 
      totalIncome, 
      totalExpenses, 
      netAmount: totalIncome - totalExpenses, 
      totalProperties,
      rentedCount, 
      availableCount,
      maintenanceCount,
      occupancyRate,
      delinquencyRate,
      overduePayments
    };
  }, [selectedOwnerId, month, year, properties, payments, expenses, leases, owners]);

  const handleCloseMonth = async () => {
    if (!reportData) {
      onNotify?.('Dados do relatório não carregados.', 'error');
      return;
    }
    if (isClosed) {
      onNotify?.('Este mês já está fechado.', 'error');
      return;
    }
    
    const confirmed = window.confirm(`Deseja realmente FECHAR o mês ${month.toString().padStart(2, '0')}/${year} para ${reportData.owner.name}? Isso bloqueará alterações nos lançamentos deste período.`);
    if (confirmed) {
      try {
        const closingData = {
          ownerId: selectedOwnerId,
          month,
          year,
          totalIncome: reportData.totalIncome,
          totalExpenses: reportData.totalExpenses,
          netAmount: reportData.netAmount,
          observations,
          date: new Date().toISOString()
        };
        
        await onAddClosing(closingData);
        onNotify?.(`Mês ${month.toString().padStart(2, '0')}/${year} fechado com sucesso!`, 'success');
      } catch (err: any) {
        console.error('Erro ao fechar mês:', err);
        onNotify?.('Erro ao fechar mês: ' + (err.message || 'Erro desconhecido'), 'error');
      }
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    onNotify?.('Gerando relatório PDF profissional (pode levar alguns segundos)...', 'success');

    try {
      const element = reportRef.current;
      
      // Store original scroll position and styles
      const scrollY = window.scrollY;
      const originalHeight = element.style.height;
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;
      
      window.scrollTo(0, 0);
      
      // Force light mode and full visibility for capture
      element.classList.add('pdf-capture-mode');
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      
      // Wait for layout to stabilize and images to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.print-container') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.width = '1200px';
            clonedElement.style.height = 'auto';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
            clonedElement.style.position = 'relative';
            clonedElement.classList.add('pdf-capture-mode');
            
            // Force all sections to be visible and stacked for PDF
            const grids = clonedElement.querySelectorAll('.grid');
            grids.forEach((g: any) => {
              g.style.display = 'block';
              g.style.width = '100%';
              g.style.marginBottom = '2rem';
            });

            // Fix specific grid items
            const gridItems = clonedElement.querySelectorAll('.grid > div');
            gridItems.forEach((item: any) => {
              item.style.width = '100%';
              item.style.display = 'block';
              item.style.marginBottom = '1.5rem';
            });

            // Ensure the extrato columns are stacked
            const extratoGrid = clonedElement.querySelector('.grid-cols-1.lg\\:grid-cols-2');
            if (extratoGrid) {
              (extratoGrid as HTMLElement).style.display = 'block';
              (extratoGrid as HTMLElement).style.width = '100%';
            }
          }
        }
      });

      // Restore original styles
      element.classList.remove('pdf-capture-mode');
      element.style.height = originalHeight;
      element.style.maxHeight = originalMaxHeight;
      element.style.overflow = originalOverflow;
      window.scrollTo(0, scrollY);

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Falha ao renderizar o conteúdo do relatório.');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate how many canvas pixels fit in one PDF page
      const pxPerMm = imgWidth / pdfWidth;
      const canvasPageHeight = pdfHeight * pxPerMm;
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 0;

      while (heightLeft > 0 && pageCount < 10) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = Math.min(heightLeft, canvasPageHeight);
        
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, position, imgWidth, pageCanvas.height, 0, 0, imgWidth, pageCanvas.height);
          
          if (pageCount > 0) pdf.addPage();
          
          const pageData = pageCanvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / imgWidth, undefined, 'FAST');
        }
        
        heightLeft -= canvasPageHeight;
        position += canvasPageHeight;
        pageCount++;
      }

      const fileName = `Relatorio_${reportData.owner.name.replace(/\s+/g, '_')}_${month.toString().padStart(2, '0')}_${year}.pdf`;
      pdf.save(fileName);
      onNotify?.('Relatório PDF gerado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro na geração do PDF:', error);
      onNotify?.('Erro técnico ao gerar PDF. Tente novamente ou use a impressão do navegador.', 'error');
      if (reportRef.current) {
        reportRef.current.classList.remove('pdf-capture-mode');
        reportRef.current.style.height = 'auto';
        reportRef.current.style.maxHeight = 'none';
        reportRef.current.style.overflow = 'visible';
      }
      
      const usePrint = window.confirm('Houve um problema na geração automática. Deseja abrir a janela de impressão do sistema?');
      if (usePrint) {
        window.print();
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!reportData) return <div className="p-10 text-center uppercase font-black text-gray-300">Nenhum dado para exibir.</div>;

  const monthName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][month - 1];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Controls - No Print */}
      <div className="no-print glass-card p-8 rounded-[32px] border-white/5 shadow-2xl flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 space-y-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Proprietário</label>
          <select 
            value={selectedOwnerId} 
            onChange={(e) => setSelectedOwnerId(e.target.value)} 
            className="w-full p-4 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all appearance-none"
          >
            {owners.map((o: any) => <option key={o.id} value={o.id} className="bg-white dark:bg-[#050505]">{o.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48 space-y-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Mês</label>
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))} 
            className="w-full p-4 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all appearance-none"
          >
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (<option key={i+1} value={i+1} className="bg-white dark:bg-[#050505]">{m}</option>))}
          </select>
        </div>
        <div className="w-full md:w-48 space-y-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Ano</label>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
            className="w-full p-4 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold uppercase text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all appearance-none"
          >
            {Array.from({ length: 2080 - 2022 + 1 }, (_, i) => (2022 + i).toString()).map(y => (
              <option key={y} value={y} className="bg-white dark:bg-[#050505]">{y}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={generatePDF} 
          disabled={isGeneratingPDF}
          className="bg-gray-900 dark:bg-white text-white dark:text-black px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/10 flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-file-pdf"></i>
          )}
          {isGeneratingPDF ? 'Gerando...' : 'Gerar Relatório PDF'}
        </button>
      </div>

      {/* Observations Input - No Print */}
      <div className="no-print glass-card p-8 rounded-[32px] border-white/5 shadow-2xl space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Observações Adicionais</label>
        <textarea 
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Digite aqui informações adicionais que devem constar no relatório..."
          className="w-full p-6 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-3xl text-sm text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all min-h-[120px] resize-none"
        />
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="print-container bg-white dark:bg-white/[0.02] rounded-[40px] border border-gray-200 dark:border-white/5 shadow-2xl">
        {/* Professional Header */}
        <div className="report-header p-10 md:p-16">
          <div className="report-title-section">
            <Logo size="lg" className="mb-8" />
            <h1>Relatório de Fechamento</h1>
            <div className="report-meta">
              {monthName} {year} • Ref: {month.toString().padStart(2, '0')}/{year}
            </div>
          </div>
          <div className="company-info">
            <p className="font-black text-lg">IMOBIFLOW GESTÃO</p>
            <p className="text-gray-500">Relatório Consolidado do Proprietário</p>
            <p className="font-bold mt-2">{reportData.owner.name}</p>
          </div>
        </div>

        <div className="p-10 md:p-16 pt-0 space-y-12">
          {/* Portfolio Metrics Cards */}
          <div className="space-y-6">
            <div className="section-title">Resumo da Carteira</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="summary-card bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border dark:border-white/10">
                <label className="text-[8px] mb-1">Total Imóveis</label>
                <div className="value text-xl">{reportData.totalProperties}</div>
              </div>
              <div className="summary-card bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/10">
                <label className="text-[8px] mb-1 text-emerald-600">Alugados</label>
                <div className="value text-xl text-emerald-600">{reportData.rentedCount}</div>
              </div>
              <div className="summary-card bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/10">
                <label className="text-[8px] mb-1 text-indigo-600">Disponíveis</label>
                <div className="value text-xl text-indigo-600">{reportData.availableCount}</div>
              </div>
              <div className="summary-card bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/10">
                <label className="text-[8px] mb-1 text-amber-600">Manutenção</label>
                <div className="value text-xl text-amber-600">{reportData.maintenanceCount}</div>
              </div>
              <div className="summary-card bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border dark:border-white/10">
                <label className="text-[8px] mb-1">Ocupação</label>
                <div className="value text-xl">{reportData.occupancyRate.toFixed(1)}%</div>
              </div>
              <div className="summary-card bg-red-50/50 dark:bg-red-500/5 rounded-2xl p-4 border border-red-100 dark:border-red-500/10">
                <label className="text-[8px] mb-1 text-red-600">Inadimplência</label>
                <div className="value text-xl text-red-600">{reportData.delinquencyRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="space-y-6">
            <div className="section-title">Resumo Financeiro</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="summary-card bg-emerald-500 text-white rounded-3xl p-8 shadow-lg shadow-emerald-500/20">
                <label className="text-[9px] opacity-80 mb-2">Total de Entradas</label>
                <div className="value text-3xl">R$ {formatCurrency(reportData.totalIncome)}</div>
              </div>
              <div className="summary-card bg-red-500 text-white rounded-3xl p-8 shadow-lg shadow-red-500/20">
                <label className="text-[9px] opacity-80 mb-2">Total de Saídas</label>
                <div className="value text-3xl">R$ {formatCurrency(reportData.totalExpenses)}</div>
              </div>
              <div className="summary-card net-amount-card bg-gray-900 dark:bg-white text-white dark:text-black rounded-3xl p-8 shadow-2xl">
                <label className="text-[9px] opacity-70 mb-2">Saldo para Repasse</label>
                <div className="value text-3xl">R$ {formatCurrency(reportData.netAmount)}</div>
              </div>
            </div>
          </div>

          {/* Dual Column Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Incomes */}
            <div className="space-y-6">
              <div className="section-title flex justify-between">
                <span>Extrato de Entradas</span>
                <span className="text-emerald-600">R$ {formatCurrency(reportData.totalIncome)}</span>
              </div>
              <div className="space-y-3">
                {reportData.incomes.map((inc: any, index: number) => {
                  const prop = properties.find((p:any)=>p.id === leases.find((l:any)=>l.id === inc.leaseId)?.propertyId);
                  const prevInc = index > 0 ? reportData.incomes[index - 1] : null;
                  const prevPropId = prevInc ? leases.find((l:any)=>l.id === prevInc.leaseId)?.propertyId : null;
                  const isSameProp = prop?.id === prevPropId;

                  return (
                    <div key={inc.id} className={`flex justify-between items-center p-4 rounded-2xl border dark:border-white/5 ${isSameProp ? 'bg-emerald-50/30 dark:bg-emerald-500/5 mt-[-8px] border-t-0 rounded-t-none' : 'bg-gray-50 dark:bg-white/[0.02]'}`}>
                      <div className="flex items-center min-w-0">
                        <span className="item-number">{index + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase truncate">{prop?.title || 'Aluguel'}</p>
                          <p className="text-[8px] text-gray-400 uppercase">Venc: {new Date(inc.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">R$ {formatCurrency(inc.amount + (inc.interest || 0))}</p>
                        {inc.interest > 0 && <p className="text-[7px] text-amber-500 font-bold uppercase">Multa/Juros inc.</p>}
                      </div>
                    </div>
                  );
                })}
                {reportData.incomes.length === 0 && (
                  <div className="p-8 text-center text-[10px] font-bold text-gray-300 uppercase italic border-2 border-dashed rounded-3xl">Sem entradas</div>
                )}
              </div>
            </div>

            {/* Right: Expenses */}
            <div className="space-y-6">
              <div className="section-title flex justify-between">
                <span>Extrato de Saídas</span>
                <span className="text-red-500">R$ {formatCurrency(reportData.totalExpenses)}</span>
              </div>
              <div className="space-y-3">
                {reportData.expenses.map((exp: any, index: number) => (
                  <div key={exp.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border dark:border-white/5">
                    <div className="flex items-center min-w-0">
                      <span className="item-number">{index + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase truncate">{exp.description}</p>
                        <p className="text-[8px] text-gray-400 uppercase">{exp.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-red-500">- R$ {formatCurrency(exp.amount)}</p>
                      <p className="text-[8px] text-gray-400 uppercase">{new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
                {reportData.expenses.length === 0 && (
                  <div className="p-8 text-center text-[10px] font-bold text-gray-300 uppercase italic border-2 border-dashed rounded-3xl">Sem saídas</div>
                )}
              </div>
            </div>
          </div>

          {/* Pendências Financeiras (Inadimplência) */}
          {reportData.overduePayments.length > 0 && (
            <div className="space-y-6">
              <div className="section-title flex justify-between">
                <span>Pendências Financeiras (Inadimplência)</span>
                <span className="text-red-600">Total Pendente: R$ {formatCurrency(reportData.overduePayments.reduce((acc: number, curr: any) => acc + curr.amount, 0))}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.overduePayments.map((p: any, index: number) => {
                  const prop = properties.find((prop: any) => prop.id === leases.find((l: any) => l.id === p.leaseId)?.propertyId);
                  const tenant = tenants.find((t: any) => t.id === p.tenantId);
                  return (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-red-50/30 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10">
                      <div className="flex items-center min-w-0">
                        <span className="item-number text-red-400">{index + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase truncate text-red-700">{prop?.title || 'Imóvel'}</p>
                          <p className="text-[8px] text-gray-500 uppercase">Inquilino: {tenant?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-red-600">R$ {formatCurrency(p.amount)}</p>
                        <p className="text-[7px] text-red-400 font-bold uppercase">Vencido em {new Date(p.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[8px] text-gray-400 italic">* Estes valores não foram incluídos no saldo de repasse deste mês.</p>
            </div>
          )}

          {/* Observations - Report Display */}
          {observations && (
            <div className="space-y-6">
              <div className="section-title">Observações Adicionais</div>
              <div className="p-8 bg-gray-50 dark:bg-white/[0.02] rounded-3xl border dark:border-white/5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {observations}
              </div>
            </div>
          )}

          {/* Professional Footer */}
          <div className="report-footer">
            <div className="signature-block">
              <div className="signature-line"></div>
              <div className="signature-label">IMOBIFLOW GESTÃO IMOBILIÁRIA</div>
            </div>
            <div className="signature-block">
              <div className="signature-line"></div>
              <div className="signature-label">{reportData.owner.name}</div>
            </div>
            <div className="timestamp">
              Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}<br />
              Autenticidade garantida pelo sistema Imobiflow
            </div>
          </div>
        </div>
      </div>

      {/* Closing Actions - No Print */}
      {!isClosed && (
        <div className="no-print flex justify-center pt-10 pb-10">
          <button 
            onClick={handleCloseMonth}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-600/20 transition-all flex items-center gap-3"
          >
            <i className="fas fa-lock"></i> Finalizar e Fechar Mês
          </button>
        </div>
      )}
    </div>
  );
};

// --- CRUD Forms ---

const OwnerFormView = ({ owners, setOwners, onNotify, userId, dbOp }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', pixKey: '', pixType: 'CPF' as Owner['pixType'] });

  useEffect(() => {
    if (isEdit) {
      const o = owners.find((x: any) => x.id === id);
      if (o) setFormData({ name: o.name, email: o.email, phone: o.phone, pixKey: o.pixKey || '', pixType: o.pixType || 'CPF' });
    }
  }, [id, isEdit, owners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerData = { ...formData, id: isEdit ? id : `o_${Date.now()}`, userId };
    
    if (isEdit) {
      const success = await dbOp('owners', 'update', ownerData, id);
      if (success) {
        setOwners((prev: any) => prev.map((o: any) => o.id === id ? ownerData : o));
        onNotify('Proprietário atualizado!', 'success');
        navigate('/owners');
      }
    } else {
      const result = await dbOp('owners', 'insert', ownerData);
      if (result) {
        setOwners([...owners, result]);
        onNotify('Proprietário cadastrado!', 'success');
        navigate('/owners');
      }
    }
  };
  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border dark:border-gray-800 transition-all">
      <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-center dark:text-white">{isEdit ? 'Editar Proprietário' : 'Novo Proprietário'}</h2>
       <form onSubmit={handleSubmit} className="space-y-6">
         <input required placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <input required type="email" placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <input required placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <div className="grid grid-cols-3 gap-4">
            <select value={formData.pixType} onChange={e => setFormData({...formData, pixType: e.target.value as any})} className="glass-input col-span-1 p-4 rounded-2xl text-xs font-bold">
               {['CPF', 'CNPJ', 'Email', 'Telefone', 'Aleatória'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Chave PIX" value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className="glass-input col-span-2 p-4 rounded-2xl text-sm font-bold" />
         </div>
         <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Salvar</button>
       </form>
    </div>
  );
};

const TenantFormView = ({ tenants, setTenants, onNotify, userId, dbOp }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', document: '', notes: '' });

  useEffect(() => {
    if (isEdit) {
      const t = tenants.find((x: any) => x.id === id);
      if (t) setFormData({ name: t.name, email: t.email, phone: t.phone, document: t.document || '', notes: t.notes || '' });
    }
  }, [id, isEdit, tenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      onNotify('Erro: Usuário não identificado. Faça login novamente.', 'error');
      return;
    }
    const tenantData = { ...formData, id: isEdit ? id : `t_${Date.now()}`, userId };
    
    if (isEdit) {
      const success = await dbOp('tenants', 'update', tenantData, id);
      if (success) {
        setTenants((prev: any) => prev.map((t: any) => t.id === id ? tenantData : t));
        onNotify('Inquilino atualizado!', 'success');
        navigate('/tenants');
      }
    } else {
      const result = await dbOp('tenants', 'insert', tenantData);
      if (result) {
        setTenants((prev: any) => [...prev, result]);
        onNotify('Inquilino cadastrado!', 'success');
        navigate('/tenants');
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border dark:border-gray-800 transition-all">
      <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-center dark:text-white">{isEdit ? 'Editar Inquilino' : 'Novo Inquilino'}</h2>
       <form onSubmit={handleSubmit} className="space-y-6">
         <input required placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <input required type="email" placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <input required placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <input placeholder="CPF / CNPJ" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
         <textarea placeholder="Observações" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold resize-none h-32" />
         <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Salvar</button>
       </form>
    </div>
  );
};

const VisitFormView = ({ properties, onNotify, userId, dbOp }: any) => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    date: '',
    time: '',
    notes: ''
  });

  const property = properties.find((p: any) => p.id === propertyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const visitData = {
      ...formData,
      propertyId,
      userId,
      status: 'pending'
    };
    const result = await dbOp('visits', 'insert', visitData);
    if (result) {
      onNotify('Visita agendada com sucesso!', 'success');
      navigate('/properties/' + propertyId);
    }
  };

  if (!property) return <div className="p-8 text-center uppercase font-black text-xs text-gray-400">Imóvel não encontrado</div>;

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-[40px] shadow-xl border dark:border-gray-800">
      <h2 className="text-xl font-black uppercase tracking-widest mb-6 text-center dark:text-white">Agendar Visita</h2>
      <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Imóvel</p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{property.title}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Nome do Visitante</label>
          <input required value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">E-mail</label>
            <input type="email" required value={formData.visitorEmail} onChange={e => setFormData({...formData, visitorEmail: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Telefone</label>
            <input required value={formData.visitorPhone} onChange={e => setFormData({...formData, visitorPhone: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Data</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Horário</label>
            <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Observações</label>
          <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold resize-none" />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Confirmar Agendamento</button>
      </form>
    </div>
  );
};

const VisitsView = ({ visits, properties, onUpdateVisit, onDeleteVisit }: any) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Visitas Agendadas</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestão de interessados e horários</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visits.length > 0 ? visits.map((v: any) => {
          const property = properties.find((p: any) => p.id === v.propertyId);
          return (
            <div key={v.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                    v.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                    v.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    v.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {v.status === 'pending' ? 'PENDENTE' : v.status === 'confirmed' ? 'CONFIRMADA' : v.status === 'cancelled' ? 'CANCELADA' : 'CONCLUÍDA'}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onDeleteVisit(v.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase truncate">{v.visitorName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{property?.title || 'Imóvel removido'}</p>
                </div>

                <div className="flex items-center gap-4 py-3 border-y dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <i className="far fa-calendar text-indigo-500 text-xs"></i>
                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">{new Date(v.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="far fa-clock text-indigo-500 text-xs"></i>
                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">{v.time}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {v.status === 'pending' && (
                    <button onClick={() => onUpdateVisit(v.id, { status: 'confirmed' })} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 transition-all">Confirmar</button>
                  )}
                  {v.status !== 'cancelled' && v.status !== 'completed' && (
                    <button onClick={() => onUpdateVisit(v.id, { status: 'cancelled' })} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-500 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-50 hover:text-red-500 transition-all">Cancelar</button>
                  )}
                  {v.status === 'confirmed' && (
                    <button onClick={() => onUpdateVisit(v.id, { status: 'completed' })} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700 transition-all">Concluir</button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center">
            <i className="fas fa-calendar-alt text-4xl text-gray-200 mb-4"></i>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhuma visita agendada</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PropertyFormView = ({ owners, properties, setProperties, onNotify, userId, leases = [], onTerminateLease, dbOp, setDbLoading, dbLoading }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    type: PropertyType.KITNET,
    address: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    area: '',
    iptu: '',
    condo: '',
    ownerId: owners[0]?.id || '',
    description: '',
    rentalRules: '',
    status: 'available' as const
  });

  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Estados para o Modal de Vistoria
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionType, setInspectionType] = useState<'entry' | 'exit' | null>(null);
  const [dynamicItems, setDynamicItems] = useState<string[]>(["Pintura das paredes e teto", "Funcionamento de lâmpadas e tomadas", "Estado das torneiras e registros (hidráulica)", "Integridade de vidros e janelas", "Limpeza geral do imóvel", "Entrega/Conferência das chaves e controles"]);
  const [newItemText, setNewItemText] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<number, 'ok' | 'fail' | null>>({});

  const activeLease = useMemo(() => (leases || []).find((l: any) => l.propertyId === id && l.active), [id, leases]);

  useEffect(() => {
    if (isEdit) {
      const p = properties.find((x: any) => x.id === id);
      if (p) {
        setFormData({
          title: p.title,
          type: p.type,
          address: p.address,
          price: p.price.toString().replace('.', ','),
          bedrooms: p.bedrooms?.toString() || '',
          bathrooms: p.bathrooms?.toString() || '',
          parking: p.parking?.toString() || '',
          area: p.area?.toString() || '',
          iptu: p.iptu?.toString().replace('.', ',') || '',
          condo: p.condo?.toString().replace('.', ',') || '',
          ownerId: p.ownerId,
          description: p.description || '',
          rentalRules: p.rentalRules || '',
          status: p.status
        });
        setImages(p.images || []);
        setDocuments(p.documents || []);
      }
    }
  }, [id, isEdit, properties]);

  const [uploadingImages, setUploadingImages] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!userId) {
      onNotify('Usuário não identificado. Faça login novamente.', 'error');
      return;
    }

    setDbLoading(true);
    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: false, // Desativado para maior compatibilidade em iframes
        initialQuality: 0.8
      };

      const fileList = Array.from(files) as File[];
      const objectUrls = fileList.map(f => URL.createObjectURL(f));
      setUploadingImages(prev => [...prev, ...objectUrls]);

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const objectUrl = objectUrls[i];
        
        try {
          console.log(`Iniciando processamento da imagem: ${file.name}`);
          
          let fileToUpload: File | Blob = file;
          try {
            // Tenta comprimir, se falhar usa o original
            fileToUpload = await imageCompression(file, options);
          } catch (compErr) {
            console.warn('Falha na compressão, usando original:', compErr);
          }
          
          const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
          const path = `${userId}/${Date.now()}_${sanitizedName}`;
          
          const url = await dbService.uploadFile('properties', path, fileToUpload);
          
          if (url) {
            setImages(prev => [...prev, url]);
            console.log(`Upload concluído: ${url}`);
          }
        } catch (err: any) {
          console.error(`Erro no upload do arquivo ${file.name}:`, err);
          let errorMsg = err.message || 'Erro desconhecido';
          
          if (errorMsg.includes('fetch') || errorMsg.includes('Network')) {
            onNotify(`Erro de Conexão: Verifique se o domínio ${window.location.origin} está na lista de CORS do Supabase.`, 'error');
          } else if (errorMsg.toLowerCase().includes('bucket')) {
            onNotify(`Erro: O bucket "properties" não foi encontrado ou não é público no Supabase.`, 'error');
          } else if (errorMsg.toLowerCase().includes('policy') || errorMsg.includes('403')) {
            onNotify(`Erro de Permissão: O bucket "properties" precisa estar como "Public" no Supabase.`, 'error');
          } else {
            onNotify(`Erro ao subir ${file.name}: ${errorMsg}`, 'error');
          }
        } finally {
          setUploadingImages(prev => prev.filter(u => u !== objectUrl));
          URL.revokeObjectURL(objectUrl);
        }
      }
      
      onNotify('Processamento de imagens concluído!', 'success');
    } catch (err) {
      console.error('Erro geral no upload:', err);
      onNotify('Erro ao processar imagens.', 'error');
    } finally {
      setDbLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!userId) {
      onNotify('Usuário não identificado. Faça login novamente.', 'error');
      return;
    }

    setDbLoading(true);
    try {
      for (const file of Array.from(files) as File[]) {
        try {
          const path = `${userId}/${Date.now()}_${file.name}`;
          const url = await dbService.uploadFile('documents', path, file);
          if (url) {
            const newDoc: DocumentFile = {
              id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              name: file.name,
              url: url,
              type: file.type.includes('pdf') ? 'other' : 'image',
              uploadDate: new Date().toISOString(),
              size: `${Math.round(file.size / 1024)} KB`
            };
            setDocuments(prev => [...prev, newDoc]);
          }
        } catch (err: any) {
          console.error(`Erro no upload do documento ${file.name}:`, err);
          onNotify(`Erro ao subir documento ${file.name}: ${err.message}`, 'error');
        }
      }
      onNotify('Documentos enviados com sucesso!', 'success');
    } catch (err) {
      onNotify('Erro ao processar documentos.', 'error');
    } finally {
      setDbLoading(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (url: string) => {
    setImages(images.filter(i => i !== url));
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const openInspection = (type: 'entry' | 'exit') => {
    setInspectionType(type);
    setCheckedItems({});
    if (type === 'exit' && activeLease?.entryChecklist) {
      setDynamicItems(activeLease.entryChecklist.map((i: any) => i.label));
    } else {
      setDynamicItems(["Pintura das paredes e teto", "Funcionamento de lâmpadas e tomadas", "Estado das torneiras e registros (hidráulica)", "Integridade de vidros e janelas", "Limpeza geral do imóvel", "Entrega/Conferência das chaves e controles"]);
    }
    setShowInspectionModal(true);
  };

  const handleConfirmInspection = () => {
    const checklistData = dynamicItems.map((label, idx) => ({
      label,
      status: checkedItems[idx] as 'ok' | 'fail'
    }));

    if (inspectionType === 'entry') {
      setShowInspectionModal(false);
      navigate(`/leases/new/${id}`, { state: { entryChecklist: checklistData } });
    } else if (inspectionType === 'exit') {
      setShowInspectionModal(false);
      onTerminateLease?.(id, checklistData);
    }
    setInspectionType(null);
  };

  const handleGenerateDesc = async () => {
    setIsGenerating(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Crie uma descrição atraente e profissional para um imóvel do tipo ${formData.type}. Título: ${formData.title}. Endereço: ${formData.address}. Preço: R$ ${formData.price}.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    setFormData(prev => ({ ...prev, description: response.text || '' }));
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parseCurrency = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
    
    const propertyData = {
      ...formData,
      price: parseCurrency(formData.price),
      iptu: parseCurrency(formData.iptu),
      condo: parseCurrency(formData.condo),
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      parking: parseInt(formData.parking) || 0,
      area: parseFloat(formData.area) || 0,
      images,
      documents,
      userId: userId,
      id: isEdit ? id : `p_${Date.now()}`
    };

    if (isEdit) {
      const success = await dbOp('properties', 'update', propertyData, id);
      if (success) {
        setProperties((prev: any) => prev.map((p: any) => p.id === id ? propertyData : p));
        onNotify('Imóvel atualizado!', 'success');
        navigate('/properties');
      }
    } else {
      const result = await dbOp('properties', 'insert', propertyData);
      if (result) {
        setProperties((prev: any) => [...prev, result]);
        onNotify('Imóvel cadastrado!', 'success');
        navigate('/properties');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[40px] shadow-xl border dark:border-gray-800 transition-all">
      <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest mb-8 text-center dark:text-white">
        {isEdit ? 'Editar Imóvel' : 'Novo Imóvel'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {isEdit && (
          <div className="flex flex-wrap gap-4 mb-8 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
            {formData.status === 'available' ? (
              <button type="button" onClick={() => openInspection('entry')} className="flex-1 min-w-[150px] bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-key"></i> Iniciar Locação
              </button>
            ) : formData.status === 'rented' ? (
              <button type="button" onClick={() => openInspection('exit')} className="flex-1 min-w-[150px] bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-door-open"></i> Finalizar Locação
              </button>
            ) : null}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Título do Anúncio</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tipo de Imóvel</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
              {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Endereço Completo</label>
          <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Valor do Aluguel (R$)</label>
            <input required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0,00" className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">IPTU (R$)</label>
            <input value={formData.iptu} onChange={e => setFormData({...formData, iptu: e.target.value})} placeholder="0,00" className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Condomínio (R$)</label>
            <input value={formData.condo} onChange={e => setFormData({...formData, condo: e.target.value})} placeholder="0,00" className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Quartos</label>
            <input type="number" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Banheiros</label>
            <input type="number" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Vagas</label>
            <input type="number" value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Área (m²)</label>
            <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Proprietário</label>
            <select required value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold">
              <option value="">Selecione...</option>
              {owners.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold">
               <option value="available">Disponível</option>
               <option value="rented">Alugado</option>
               <option value="maintenance">Manutenção</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t dark:border-gray-800 pt-8">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-camera text-indigo-500"></i> Fotos (PNG/JPEG)</label>
              <input type="file" accept="image/png, image/jpeg" multiple onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-indigo-600 border-2 border-dashed border-indigo-100 dark:border-indigo-900 rounded-3xl text-[10px] font-black uppercase hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                 <i className="fas fa-upload"></i> Selecionar Fotos
              </button>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                 {images.map((img, idx) => (
                   <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-indigo-50 dark:border-indigo-900/30 shadow-sm">
                      <img src={img} loading="lazy" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(img)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm"><i className="fas fa-trash"></i></button>
                   </div>
                 ))}
                 {uploadingImages.map((img, idx) => (
                   <div key={`uploading-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-indigo-200 dark:border-indigo-800 animate-pulse bg-indigo-50/50 dark:bg-indigo-900/10">
                      <img src={img} className="w-full h-full object-cover opacity-30 grayscale" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin text-indigo-500"></i>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-file-pdf text-amber-500"></i> Documentos (PDF/Outros)</label>
              <input type="file" accept=".pdf, .doc, .docx, .jpg, .png" multiple onChange={handleDocUpload} ref={docInputRef} className="hidden" />
              <button type="button" onClick={() => docInputRef.current?.click()} className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-amber-600 border-2 border-dashed border-amber-100 dark:border-amber-900 rounded-3xl text-[10px] font-black uppercase hover:bg-amber-50 transition-all flex items-center justify-center gap-2">
                 <i className="fas fa-paperclip"></i> Anexar Arquivos
              </button>
              <div className="space-y-2">
                 {documents.map(doc => (
                   <div key={doc.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-between border dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                         <i className={`fas ${doc.name.endsWith('.pdf') ? 'fa-file-pdf text-red-400' : 'fa-file-image text-blue-400'} flex-shrink-0`}></i>
                         <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate">{doc.name}</p>
                            <p className="text-[8px] text-gray-400 uppercase">{doc.size}</p>
                         </div>
                      </div>
                      <button onClick={() => handleRemoveDoc(doc.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><i className="fas fa-times"></i></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Descrição do Imóvel</label>
            <button type="button" onClick={handleGenerateDesc} disabled={isGenerating || !formData.title} className="text-[9px] font-black text-indigo-600 uppercase hover:text-indigo-700 disabled:opacity-50">
              {isGenerating ? 'Gerando...' : '✨ Gerar com IA'}
            </button>
          </div>
          <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold resize-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Regras de Locação</label>
          <textarea rows={3} value={formData.rentalRules} onChange={e => setFormData({...formData, rentalRules: e.target.value})} placeholder="Ex: Proibido animais, máximo 2 pessoas..." className="glass-input w-full p-4 rounded-2xl text-xs font-bold resize-none" />
        </div>
        <button type="submit" disabled={dbLoading} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
          {dbLoading ? 'Processando...' : (isEdit ? 'Salvar Alterações' : 'Cadastrar Imóvel')}
        </button>
      </form>

      {/* Modal de Vistoria */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-300">
            <div className={`p-8 ${inspectionType === 'entry' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
              <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <i className={`fas ${inspectionType === 'entry' ? 'fa-clipboard-check' : 'fa-clipboard-list'}`}></i>
                Vistoria de {inspectionType === 'entry' ? 'Entrada' : 'Saída'}
              </h3>
              <p className="text-[10px] font-bold uppercase opacity-80 mt-2 tracking-widest">Checklist Obrigatório de Conferência</p>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {dynamicItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCheckedItems(prev => ({ ...prev, [idx]: 'ok' }))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${checkedItems[idx] === 'ok' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-300 hover:text-emerald-500'}`}><i className="fas fa-check"></i></button>
                    <button onClick={() => setCheckedItems(prev => ({ ...prev, [idx]: 'fail' }))} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${checkedItems[idx] === 'fail' ? 'bg-red-500 text-white shadow-lg' : 'bg-white dark:bg-gray-700 text-gray-300 hover:text-red-500'}`}><i className="fas fa-times"></i></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex gap-4">
              <button onClick={() => setShowInspectionModal(false)} className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest border dark:border-gray-700">Cancelar</button>
              <button 
                disabled={Object.keys(checkedItems).length < dynamicItems.length}
                onClick={handleConfirmInspection}
                className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${Object.keys(checkedItems).length < dynamicItems.length ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                Confirmar Vistoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LeaseFormView = ({ properties, tenants, onAddLease, userId }: any) => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const entryChecklist = location.state?.entryChecklist; // Recupera o checklist da vistoria de entrada
  const property = properties.find((p: any) => p.id === propertyId);
  const [formData, setFormData] = useState({
    tenantId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    monthlyRent: property?.price.toString() || '',
    dueDay: 5,
    deposit: '' // Novo campo para caução
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantId) return;
    const newLease: Lease = {
      id: `l_${Date.now()}`,
      userId,
      propertyId: propertyId!,
      tenantId: formData.tenantId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      monthlyRent: parseFloat(formData.monthlyRent),
      dueDay: formData.dueDay,
      deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
      entryChecklist, // Salva o checklist de entrada no contrato
      active: true
    };
    await onAddLease(newLease);
    navigate(`/properties/${propertyId}`);
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-[40px] shadow-xl border dark:border-gray-800 transition-all">
      <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-center dark:text-white">Alugar Imóvel</h2>
      <p className="text-center text-[10px] font-black uppercase text-gray-400 mb-8">{property?.title}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Selecionar Inquilino</label>
            <select required value={formData.tenantId} onChange={e => setFormData({...formData, tenantId: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold">
               <option value="">Selecione...</option>
               {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Início</label>
               <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Término</label>
               <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
            </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Aluguel Mensal</label>
               <input type="number" value={formData.monthlyRent} onChange={e => setFormData({...formData, monthlyRent: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Caução (Opcional)</label>
               <input type="number" placeholder="Ex: 2400" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} className="glass-input w-full p-4 rounded-2xl text-sm font-bold" />
            </div>
         </div>
         <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Dia Vencimento</label>
            <input type="number" min="1" max="28" value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: parseInt(e.target.value)})} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
         </div>
         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">Se preenchida, a caução será o valor da 1ª parcela.</p>
         <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Confirmar Locação</button>
      </form>
    </div>
  );
};

// --- Tenant Details View ---

const TenantDetailsView = ({ tenants, payments, leases, properties, onUpdateTenant }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tenant = tenants.find((t: any) => t.id === id);
  const [notes, setNotes] = useState(tenant?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const tenantLeases = useMemo(() => leases.filter((l: any) => l.tenantId === id).sort((a:any, b:any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), [id, leases]);
  const tenantPayments = useMemo(() => payments.filter((p: any) => p.tenantId === id), [id, payments]);
  
  const stats = useMemo(() => {
    const overdueCount = tenantPayments.filter((p: any) => getPaymentStatus(p) === PaymentStatus.OVERDUE).length;
    const receivedCount = tenantPayments.filter((p: any) => getPaymentStatus(p) === PaymentStatus.RECEIVED).length;
    return { overdueCount, receivedCount, totalLeases: tenantLeases.length };
  }, [tenantPayments, tenantLeases]);

  const handleSaveNotes = () => {
    setIsSaving(true);
    onUpdateTenant({ ...tenant, notes });
    setTimeout(() => setIsSaving(false), 500);
  };

  if (!tenant) return <div className="p-10 text-center uppercase font-black text-gray-300">Inquilino não encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tenants')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><i className="fas fa-arrow-left text-gray-600 dark:text-gray-400"></i></button>
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter leading-none">{tenant.name}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ficha Cadastral e Histórico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm transition-all">
             <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center font-black text-2xl text-white mx-auto mb-4 uppercase">{tenant.name.charAt(0)}</div>
             <div className="text-center space-y-1 mb-6">
               <p className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase">{tenant.phone}</p>
               <p className="text-[10px] text-gray-400 font-bold">{tenant.email}</p>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl text-center"><p className="text-[8px] font-black text-red-500 uppercase">Atrasos</p><p className="text-lg font-black text-red-600">{stats.overdueCount}</p></div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl text-center"><p className="text-[8px] font-black text-indigo-500 uppercase">Locações</p><p className="text-lg font-black text-indigo-600">{stats.totalLeases}</p></div>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm transition-all">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações Internas</h4>
              <button onClick={handleSaveNotes} disabled={isSaving} className="text-[8px] font-black text-indigo-600 uppercase hover:underline">{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Ex: Bom pagador, cuida bem do imóvel..." 
              className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-none rounded-2xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* History Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden transition-all">
             <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"><h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Histórico de Imóveis e Vistorias</h3></div>
             <div className="p-6 space-y-4">
                {tenantLeases.map((l: any) => {
                  const property = properties.find((p: any) => p.id === l.propertyId);
                  return (
                    <div key={l.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 transition-all hover:border-indigo-100 dark:hover:border-indigo-900">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm"><i className="fas fa-home"></i></div>
                          <div>
                            <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase leading-none">{property?.title || 'Imóvel removido'}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Período: {new Date(l.startDate).toLocaleDateString()} - {l.active ? 'Atual' : new Date(l.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {l.active && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[7px] font-black uppercase">Ativo</span>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t dark:border-gray-700">
                        <div>
                          <p className="text-[8px] font-black text-indigo-500 uppercase mb-2">Vistoria Entrada</p>
                          {l.entryChecklist ? (
                             <div className="flex gap-1 flex-wrap">
                                {l.entryChecklist.map((item: any, idx: number) => (
                                  <div key={idx} className={`w-2.5 h-2.5 rounded-full ${item.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.label}></div>
                                ))}
                             </div>
                          ) : <span className="text-[7px] text-gray-400 uppercase italic">Não registrada</span>}
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-amber-500 uppercase mb-2">Vistoria Saída</p>
                          {l.exitChecklist ? (
                             <div className="flex gap-1 flex-wrap">
                                {l.exitChecklist.map((item: any, idx: number) => (
                                  <div key={idx} className={`w-2.5 h-2.5 rounded-full ${item.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.label}></div>
                                ))}
                             </div>
                          ) : <span className="text-[7px] text-gray-400 uppercase italic">Aguardando entrega</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tenantLeases.length === 0 && <div className="text-center py-10 opacity-30 font-black uppercase text-[10px]">Sem locações registradas</div>}
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden transition-all">
             <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Histórico Financeiro (Atrasos)</h3>
               <i className="fas fa-exclamation-circle text-red-400"></i>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                 <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 font-black uppercase tracking-widest">
                   <tr><th className="px-6 py-4">Vencimento</th><th className="px-6 py-4">Valor</th><th className="px-6 py-4">Status</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tenantPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500 font-bold">{p.dueDate}</td>
                        <td className="px-6 py-4 font-black dark:text-white">R$ {formatCurrency(p.amount)}</td>
                        <td className="px-6 py-4">
                          {(() => {
                            const currentStatus = getPaymentStatus(p);
                            return (
                              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${currentStatus === PaymentStatus.RECEIVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : currentStatus === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {currentStatus === PaymentStatus.RECEIVED ? 'RECEBIDO' : currentStatus === PaymentStatus.OVERDUE ? 'ATRASADO' : 'PENDENTE'}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                    {tenantPayments.length === 0 && <tr><td colSpan={3} className="text-center py-10 opacity-30 font-black uppercase text-[10px]">Sem pagamentos registrados</td></tr>}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Owner Details View ---

const OwnerDetailsView = ({ owners, properties, payments, leases, expenses }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const owner = owners.find((o: any) => o.id === id);

  const ownerProperties = useMemo(() => properties.filter((p: any) => p.ownerId === id), [id, properties]);
  const propIds = ownerProperties.map((p: any) => p.id);
  const ownerLeases = leases.filter((l: any) => propIds.includes(l.propertyId));
  const leaseIds = ownerLeases.map((l: any) => l.id);
  
  // Agrupar financeiro por mês
  const financialHistory = useMemo(() => {
    const months: Record<string, any> = {};
    
    // Processar recebimentos
    payments.filter((p: any) => leaseIds.includes(p.leaseId) && p.status === PaymentStatus.RECEIVED).forEach((p: any) => {
      const [year, month] = p.dueDate.split('-');
      const key = `${month}/${year}`;
      if (!months[key]) months[key] = { income: 0, expenses: 0, repasseStatus: 'Pendente' };
      months[key].income += (p.amount + (p.interest || 0));
    });

    // Processar despesas
    expenses.filter((e: any) => e.ownerId === id || propIds.includes(e.propertyId)).forEach((e: any) => {
      const [year, month] = e.date.split('-');
      const key = `${month}/${year}`;
      if (!months[key]) months[key] = { income: 0, expenses: 0, repasseStatus: 'Pendente' };
      months[key].expenses += e.amount;
    });

    return Object.entries(months).sort((a, b) => {
      const [mA, yA] = a[0].split('/');
      const [mB, yB] = b[0].split('/');
      return new Date(parseInt(yB), parseInt(mB)-1).getTime() - new Date(parseInt(yA), parseInt(mA)-1).getTime();
    });
  }, [id, payments, expenses, leaseIds, propIds]);

  if (!owner) return <div className="p-10 text-center uppercase font-black text-gray-300">Proprietário não encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/owners')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><i className="fas fa-arrow-left text-gray-600 dark:text-gray-400"></i></button>
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter leading-none">{owner.name}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ficha de Repasses e Portfólio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border dark:border-gray-800 transition-all">
             <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center font-black text-2xl text-white mx-auto mb-4 uppercase">{owner.name.charAt(0)}</div>
             <div className="text-center space-y-1 mb-6 border-b dark:border-gray-800 pb-6">
               <p className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase">{owner.phone}</p>
               <p className="text-[10px] text-gray-400 font-bold">{owner.email}</p>
             </div>
             
             <div className="space-y-4">
                <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Dados para Repasse</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                   <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Chave PIX ({owner.pixType || 'Não definida'})</p>
                   <p className="text-xs font-black text-gray-800 dark:text-gray-200 break-all">{owner.pixKey || 'Chave não cadastrada'}</p>
                   <button className="mt-3 text-[8px] font-black text-indigo-600 uppercase hover:underline flex items-center gap-1"><i className="fas fa-copy"></i> Copiar Chave</button>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm transition-all">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Resumo do Portfólio</h4>
             <div className="space-y-3">
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500 uppercase">Total de Imóveis</span><span className="text-xs font-black dark:text-white">{ownerProperties.length}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500 uppercase">Alugados</span><span className="text-xs font-black text-emerald-500">{ownerProperties.filter((p:any)=>p.status === 'rented').length}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500 uppercase">Disponíveis</span><span className="text-xs font-black text-amber-500">{ownerProperties.filter((p:any)=>p.status === 'available').length}</span></div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden transition-all">
              <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Histórico de Performance e Repasses</h3>
                <i className="fas fa-hand-holding-usd text-emerald-500"></i>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 font-black uppercase tracking-widest">
                    <tr><th className="px-6 py-4">Competência</th><th className="px-6 py-4">Total Recebido</th><th className="px-6 py-4">Despesas</th><th className="px-6 py-4">Taxa Adm</th><th className="px-6 py-4">Líquido Repasse</th><th className="px-6 py-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {financialHistory.map(([month, data]: [string, any]) => {
                       const adminFee = data.income * 0.1;
                       const netRepay = data.income - data.expenses - adminFee;
                       return (
                         <tr key={month} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                           <td className="px-6 py-4 font-bold text-gray-500">{month}</td>
                           <td className="px-6 py-4 font-black dark:text-white">R$ {formatCurrency(data.income)}</td>
                           <td className="px-6 py-4 text-red-400">R$ {formatCurrency(data.expenses)}</td>
                           <td className="px-6 py-4 text-indigo-400">R$ {formatCurrency(adminFee)}</td>
                           <td className="px-6 py-4 font-black text-emerald-600">R$ {formatCurrency(netRepay)}</td>
                           <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${netRepay > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-gray-100 text-gray-400'}`}>
                               {netRepay > 0 ? 'Repassado' : 'Sem saldo'}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                     {financialHistory.length === 0 && <tr><td colSpan={6} className="text-center py-10 opacity-30 font-black uppercase text-[10px]">Sem dados financeiros</td></tr>}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden transition-all">
              <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20"><h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Imóveis Vinculados</h3></div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {ownerProperties.map((p: any) => (
                   <Link key={p.id} to={`/properties/${p.id}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 hover:border-indigo-400 transition-all">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200"><img src={`https://picsum.photos/seed/${p.id}/100`} loading="lazy" className="w-full h-full object-cover" /></div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase truncate">{p.title}</p>
                         <p className={`text-[8px] font-black uppercase ${p.status === 'rented' ? 'text-emerald-500' : 'text-amber-500'}`}>{p.status === 'rented' ? 'Alugado' : 'Disponível'}</p>
                      </div>
                   </Link>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- FinancePanelView with Gmail Sync ---

const PaymentFormView = ({ payments, setPayments, leases, tenants, properties, closings, onNotify, userId, editingPayment, dbOp }: any) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(editingPayment?.amount.toString().replace('.', ',') || '');
  const [interest, setInterest] = useState(editingPayment?.interest?.toString().replace('.', ',') || '');
  const [dueDate, setDueDate] = useState(editingPayment?.dueDate || '');
  const [status, setStatus] = useState(editingPayment?.status || PaymentStatus.PENDING);
  const [leaseId, setLeaseId] = useState(editingPayment?.leaseId || '');
  const [tenantId, setTenantId] = useState(editingPayment?.tenantId || '');

  const isLocked = (date: string, leaseId: string) => {
    if (!date || !leaseId) return false;
    const d = new Date(date + 'T12:00:00');
    const m = d.getMonth() + 1;
    const y = d.getFullYear().toString();
    
    const lease = (leases || []).find((l: any) => l.id === leaseId);
    if (!lease) return false;
    const property = (properties || []).find((p: any) => p.id === lease.propertyId);
    if (!property) return false;

    return (closings || []).some((c: any) => 
      c.ownerId === property.ownerId && 
      c.month === m && 
      c.year === y
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked(dueDate, leaseId)) {
      alert('Este mês já está fechado para o proprietário deste imóvel. Não é possível realizar lançamentos.');
      return;
    }
    const parseCurrency = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;

    const newPayment: AsaasPayment = {
      id: editingPayment?.id || `pay_${Date.now()}`,
      userId,
      leaseId,
      tenantId,
      amount: parseCurrency(amount),
      interest: parseCurrency(interest),
      dueDate,
      status,
      invoiceUrl: editingPayment?.invoiceUrl || ''
    };

    if (editingPayment) {
      if (await dbOp('payments', 'update', newPayment, editingPayment.id)) {
        setPayments((prev: any) => prev.map((p: any) => p.id === editingPayment.id ? newPayment : p));
        onNotify('Parcela atualizada com sucesso!', 'success');
        navigate('/finance');
      }
    } else {
      const result = await dbOp('payments', 'insert', newPayment);
      if (result) {
        setPayments((prev: any) => [result, ...prev]);
        onNotify('Parcela adicionada com sucesso!', 'success');
        navigate('/finance');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-[40px] shadow-2xl border dark:border-gray-800 animate-in slide-in-from-bottom-8 duration-500">
      <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter mb-8">{editingPayment ? 'Editar Parcela' : 'Nova Parcela'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Contrato</label>
            <select required value={leaseId} onChange={e => {
              setLeaseId(e.target.value);
              const lease = leases.find((l:any) => l.id === e.target.value);
              if (lease) setTenantId(lease.tenantId);
            }} className="glass-input w-full p-4 rounded-2xl text-xs font-bold">
              <option value="">Selecionar Contrato</option>
              {leases.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {tenants.find((t:any) => t.id === l.tenantId)?.name} - {properties.find((p:any) => p.id === l.propertyId)?.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Vencimento</label>
            <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Valor Base (R$)</label>
            <input required type="text" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Juros (R$)</label>
            <input type="text" placeholder="0,00" value={interest} onChange={e => setInterest(e.target.value)} className="glass-input w-full p-4 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as PaymentStatus)} className="glass-input w-full p-4 rounded-2xl text-xs font-bold">
              <option value={PaymentStatus.PENDING}>Pendente</option>
              <option value={PaymentStatus.RECEIVED}>Recebido</option>
              <option value={PaymentStatus.OVERDUE}>Atrasado</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate('/finance')} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
          <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Salvar Parcela</button>
        </div>
      </form>
    </div>
  );
};

const PaymentFormWrapper = (props: any) => {
  const { paymentId } = useParams();
  const editingPayment = props.payments.find((p: any) => p.id === paymentId);
  return <PaymentFormView {...props} editingPayment={editingPayment} />;
};

const FinancePanelView = ({ payments, tenants, properties, leases, closings, onMarkAsPaid, onUnmarkAsPaid, onDeletePayment, onNotify }: any) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState((now.getMonth() + 1).toString());
  const [yearFilter, setYearFilter] = useState(now.getFullYear().toString());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncText, setSyncText] = useState('');
  const [isProcessingSync, setIsProcessingSync] = useState(false);

  const isLocked = (payment: any) => {
    const payDate = new Date(payment.dueDate + 'T12:00:00');
    const m = payDate.getMonth() + 1;
    const y = payDate.getFullYear().toString();
    
    // Find property owner
    const lease = (leases || []).find((l: any) => l.id === payment.leaseId);
    if (!lease) return false;
    const property = (properties || []).find((p: any) => p.id === lease.propertyId);
    if (!property) return false;
    
    return (closings || []).some((c: any) => 
      c.ownerId === property.ownerId && 
      c.month === m && 
      c.year === y
    );
  };

  const filtered = useMemo(() => {
    return payments.filter((p: any) => {
      const currentStatus = getPaymentStatus(p);
      const matchStatus = filter === 'all' || currentStatus === filter;
      const tenant = tenants.find((t: any) => t.id === p.tenantId);
      const matchSearch = tenant?.name.toLowerCase().includes(search.toLowerCase());
      const payDate = new Date(p.dueDate + 'T12:00:00');
      const matchMonth = monthFilter === 'all' || (payDate.getMonth() + 1).toString() === monthFilter;
      const matchYear = yearFilter === 'all' || payDate.getFullYear().toString() === yearFilter;
      return matchStatus && matchSearch && matchMonth && matchYear;
    }).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [payments, filter, search, tenants, monthFilter, yearFilter]);

  const handleSyncWithIA = async () => {
    if (!syncText.trim()) return;
    setIsProcessingSync(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise o texto deste e-mail de confirmação de recebimento do Asaas e extraia os dados em JSON: { "pagador": string, "valor": number }. Texto: "${syncText}"`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      
      const cleanedJson = response.text.replace(/```json|```/g, '').trim();
      const extractedData = JSON.parse(cleanedJson);
      
      const matchedTenant = tenants.find((t: any) => t.name.toLowerCase().includes(extractedData.pagador.toLowerCase()));
      if (matchedTenant) {
        const pendingPayment = payments.find((p: any) => p.tenantId === matchedTenant.id && p.status !== PaymentStatus.RECEIVED);
        if (pendingPayment) {
          onMarkAsPaid(pendingPayment.id);
          onNotify(`Confirmação automática: Pagamento de ${extractedData.pagador} identificado!`, 'success');
          setIsSyncModalOpen(false);
          setSyncText('');
        } else {
          onNotify(`Pagador identificado (${extractedData.pagador}), mas não encontrei faturas pendentes.`, 'error');
        }
      } else {
        onNotify(`Não consegui identificar o inquilino "${extractedData.pagador}" no sistema.`, 'error');
      }
    } catch (err) {
      console.error(err);
      onNotify('Erro ao processar o texto do e-mail. Tente novamente.', 'error');
    } finally {
      setIsProcessingSync(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal Conciliação Inteligente */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border dark:border-gray-800">
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Sincronizar via E-mail Asaas</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Cole o texto do e-mail de confirmação</p>
              </div>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea 
                value={syncText} 
                onChange={(e) => setSyncText(e.target.value)}
                placeholder="Ex: Recebemos o pagamento do boleto de R$ 1.200,00 de Carlos Oliveira..."
                className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 border-none rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <button 
                onClick={handleSyncWithIA}
                disabled={isProcessingSync || !syncText.trim()}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isProcessingSync ? 'Analisando texto...' : 'Confirmar com IA ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-md flex-1 w-full relative">
            <i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input type="text" placeholder="Buscar por inquilino..." value={search} onChange={e => setSearch(e.target.value)} className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-[10px] font-black uppercase" />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
           <button 
             onClick={() => setIsSyncModalOpen(true)}
             className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap"
           >
             <i className="fas fa-magic"></i> Sincronizar via E-mail
           </button>
           <button 
             onClick={() => navigate('/finance/new')}
             className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 whitespace-nowrap"
           >
             <i className="fas fa-plus"></i> Nova Parcela
           </button>
         </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-[32px] border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 transition-all">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto justify-center custom-scrollbar pb-2 md:pb-0">
          {['all', PaymentStatus.RECEIVED, PaymentStatus.PENDING, PaymentStatus.OVERDUE].map(s => (
            <button 
              key={s} 
              onClick={() => setFilter(s)} 
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === s 
                  ? 'bg-indigo-600 text-white shadow-xl' 
                  : 'bg-gray-100 dark:bg-white/[0.03] text-gray-500 border border-gray-200 dark:border-white/10 hover:text-indigo-600 dark:hover:text-white'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'RECEIVED' ? 'Recebidos' : s === 'PENDING' ? 'Pendentes' : 'Atrasados'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-[28px] border-white/5">
           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2 block mb-3">Mês de Vencimento</label>
           <select 
             value={monthFilter} 
             onChange={e => setMonthFilter(e.target.value)} 
             className="glass-input w-full p-4 rounded-2xl text-[11px] font-bold uppercase appearance-none"
           >
              <option value="all" className="bg-white dark:bg-[#050505]">Todos os Meses</option>
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (<option key={i+1} value={(i+1).toString()}>{m}</option>))}
           </select>
        </div>
        <div className="glass-card p-6 rounded-[28px] border-gray-200 dark:border-white/5">
           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2 block mb-3">Ano de Vencimento</label>
            <select 
              value={yearFilter} 
              onChange={e => setYearFilter(e.target.value)} 
              className="glass-input w-full p-4 rounded-2xl text-[11px] font-bold uppercase appearance-none"
            >
               <option value="all" className="bg-white dark:bg-[#050505]">Todos os Anos</option>
               {Array.from({ length: 2080 - 2022 + 1 }, (_, i) => (2022 + i).toString()).map(y => (
                 <option key={y} value={y} className="bg-white dark:bg-[#050505]">{y}</option>
               ))}
            </select>
        </div>
      </div>

      <div className="glass-card rounded-[32px] border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden transition-all">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5">
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inquilino</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vencimento</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor Base</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Juros</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 font-bold text-gray-900 dark:text-white text-sm">{tenants.find((t:any)=>t.id === p.tenantId)?.name}</td>
                  <td className="px-8 py-6 text-gray-500 font-bold text-xs">
                    {new Date(p.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-6 font-bold text-gray-700 dark:text-gray-300 text-sm">R$ {formatCurrency(p.amount)}</td>
                  <td className="px-8 py-6 font-bold text-amber-600 dark:text-amber-400 text-sm">R$ {formatCurrency(p.interest || 0)}</td>
                  <td className="px-8 py-6 font-bold text-gray-900 dark:text-white text-sm">R$ {formatCurrency(p.amount + (p.interest || 0))}</td>
                  <td className="px-8 py-6">
                    {(() => {
                      const currentStatus = getPaymentStatus(p);
                      return (
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          currentStatus === PaymentStatus.RECEIVED ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' : 
                          currentStatus === PaymentStatus.OVERDUE ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10' : 
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10'
                        }`}>
                          {currentStatus === PaymentStatus.RECEIVED ? 'RECEBIDO' : currentStatus === PaymentStatus.OVERDUE ? 'ATRASADO' : 'PENDENTE'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {isLocked(p) ? (
                        <div className="bg-gray-100 dark:bg-white/[0.05] text-gray-400 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <i className="fas fa-lock"></i> Bloqueado
                        </div>
                      ) : (
                        <>
                          {p.status !== 'RECEIVED' ? 
                            <button onClick={() => onMarkAsPaid(p.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">Marcar Pago</button> : 
                            <button onClick={() => onUnmarkAsPaid(p.id)} className="bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/[0.1] hover:text-indigo-600 dark:hover:text-white transition-all">Desmarcar</button>
                          }
                          <button onClick={() => navigate(`/finance/edit/${p.id}`)} className="p-2.5 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-all" title="Editar">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('Deseja realmente excluir este registro de receita?')) onDeletePayment(p.id) }} 
                            className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all" 
                            title="Excluir"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-20 text-center text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Nenhum registro encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Missing Views ---

// Fix: Implemented PropertiesView component to list and filter properties
const PropertiesView = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredProperties, onDeleteProperty, onDuplicateProperty, navigate }: any) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="glass-card p-4 rounded-3xl border-gray-200 dark:border-white/5 shadow-2xl flex-1 w-full relative">
          <i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
          <input 
            type="text" 
            placeholder="Buscar por endereço ou título..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-14 pr-6 py-4 bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none dark:text-white text-gray-900" 
          />
        </div>
        <button onClick={() => navigate('/properties/new')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2 whitespace-nowrap">
          <i className="fas fa-plus"></i> Novo Imóvel
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {['all', 'available', 'rented', 'maintenance'].map(s => (
          <button 
            key={s} 
            onClick={() => setStatusFilter(s as any)} 
            className={`px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              statusFilter === s 
                ? 'bg-indigo-600 text-white shadow-xl' 
                : 'bg-gray-100 dark:bg-white/[0.03] text-gray-500 border border-gray-200 dark:border-white/10 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            {s === 'all' ? 'Todos' : s === 'available' ? 'Disponíveis' : s === 'rented' ? 'Alugados' : 'Manutenção'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProperties.map((p: any) => (
          <PropertyCard 
            key={p.id} 
            property={p} 
            onEdit={(prop: any) => navigate(`/properties/edit/${prop.id}`)} 
            onDelete={onDeleteProperty} 
            onDuplicate={onDuplicateProperty}
          />
        ))}
        {filteredProperties.length === 0 && <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-[0.2em]">Nenhum imóvel encontrado</div>}
      </div>
    </div>
  );
};

// Fix: Implemented ExpensesView component to manage property expenses
const ExpensesView = ({ expenses, owners, properties, closings, onAddExpense, onDeleteExpense, onUpdateExpense }: any) => {
  const [formData, setFormData] = useState({ description: '', amount: '', category: ExpenseCategory.MAINTENANCE, ownerId: owners[0]?.id || '', propertyId: '', date: new Date().toISOString().split('T')[0] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  
  const isLocked = (date: string, ownerId: string) => {
    if (!date || !ownerId) return false;
    const d = new Date(date + 'T12:00:00');
    const m = d.getMonth() + 1;
    const y = d.getFullYear().toString();
    return (closings || []).some((c: any) => 
      c.ownerId === ownerId && 
      c.month === m && 
      c.year === y
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return;
    
    if (isLocked(formData.date, formData.ownerId)) {
      alert('Este mês já está fechado para este proprietário. Não é possível realizar lançamentos.');
      return;
    }
    
    // Fix: Ensure propertyId is null if not selected to avoid DB errors
    const submissionData = {
      ...formData,
      amount,
      propertyId: formData.propertyId || null
    };

    if (editingId) {
      await onUpdateExpense({ ...submissionData, id: editingId });
      setEditingId(null);
    } else {
      const owner = owners.find((o: any) => o.id === formData.ownerId);
      await onAddExpense({ ...submissionData, id: `exp_${Date.now()}`, userId: owner?.userId });
    }
    setFormData({ description: '', amount: '', category: ExpenseCategory.MAINTENANCE, ownerId: owners[0]?.id || '', propertyId: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      ownerId: expense.ownerId,
      propertyId: expense.propertyId || '',
      date: expense.date
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e: any) => showClosed || !isLocked(e.date, e.ownerId))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses, showClosed, closings]);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">
            {editingId ? 'Editar Despesa' : 'Registrar Nova Despesa'}
          </h3>
          <button 
            onClick={() => setShowClosed(!showClosed)}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
              showClosed 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            <i className={`fas ${showClosed ? 'fa-eye' : 'fa-eye-slash'} mr-2`}></i>
            {showClosed ? 'Ocultar Fechadas' : 'Mostrar Fechadas'}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Descrição</label>
            <input required placeholder="Ex: Reparo Elétrico" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Valor (R$)</label>
            <input required type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Data de Lançamento</label>
            <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500">
              {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Proprietário</label>
            <select required value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione...</option>
              {owners.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Imóvel (Opcional)</label>
            <select value={formData.propertyId} onChange={e => setFormData({...formData, propertyId: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Nenhum</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all p-4 shadow-lg">
              {editingId ? 'Salvar Alterações' : 'Lançar Despesa'}
            </button>
            {editingId && (
              <button type="button" onClick={() => {
                setEditingId(null);
                setFormData({ description: '', amount: '', category: ExpenseCategory.MAINTENANCE, ownerId: owners[0]?.id || '', propertyId: '', date: new Date().toISOString().split('T')[0] });
              }} className="px-6 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-300 transition-all">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-400 font-black uppercase tracking-widest border-b dark:border-gray-800">
              <tr><th className="px-6 py-4">Data de Lançamento</th><th className="px-6 py-4">Descrição</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4">Valor</th><th className="px-6 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredExpenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-500">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">{e.description}</td>
                  <td className="px-6 py-4 uppercase text-[9px] font-black text-gray-400">{e.category}</td>
                  <td className="px-6 py-4 font-black text-red-500">R$ {formatCurrency(e.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isLocked(e.date, e.ownerId) ? (
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                          <i className="fas fa-lock"></i> Fechado
                        </div>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(e)} className="text-indigo-400 hover:text-indigo-600 p-2 rounded-lg transition-colors"><i className="fas fa-edit"></i></button>
                          <button onClick={() => onDeleteExpense(e.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors"><i className="fas fa-trash-alt"></i></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-300 font-black uppercase text-[10px]">Nenhuma despesa em aberto</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Fix: Implemented UserProfileView component to manage user information with Subscription Management
const UserProfileView = ({ user, onUpdateUser, onNotify, appData, dbOp, refreshData }: any) => {
  const [formData, setFormData] = useState({ name: user.name, email: user.email, document: user.document || '' });
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    success: number;
    errors: { category: string; item: any; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, ...formData });
    onNotify('Perfil atualizado com sucesso!', 'success');
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `imobiflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    onNotify('Backup baixado com sucesso!', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Atenção: A importação irá adicionar os dados do arquivo à sua conta atual. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        const categories = ['owners', 'properties', 'tenants', 'leases', 'payments', 'expenses', 'visits'];
        let successCount = 0;
        const errors: { category: string; item: any; error: string }[] = [];

        for (const category of categories) {
          if (data[category] && Array.isArray(data[category])) {
            for (const item of data[category]) {
              try {
                const result = await dbOp(category, 'upsert', item);
                if (result) successCount++;
                else throw new Error('Falha na operação de banco de dados');
              } catch (err: any) {
                errors.push({
                  category,
                  item: item.name || item.title || item.id,
                  error: err.message || 'Erro desconhecido'
                });
              }
            }
          }
        }

        setImportSummary({ success: successCount, errors });
        if (refreshData) await refreshData();
      } catch (err: any) {
        onNotify('Erro ao processar arquivo: ' + err.message, 'error');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-10 rounded-[40px] shadow-xl border dark:border-gray-800">
      <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-center dark:text-white">Configurações de Perfil</h2>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      {importSummary && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Resultado da Importação</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Resumo do processamento</p>
              </div>
              <button onClick={() => setImportSummary(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <i className="fas fa-check"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Sucesso</p>
                  <p className="text-xl font-black text-emerald-900 dark:text-emerald-300">{importSummary.success} registros</p>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-2">Erros Identificados ({importSummary.errors.length})</p>
                  {importSummary.errors.map((err, idx) => (
                    <div key={idx} className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-md">{err.category}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{err.item}</span>
                      </div>
                      <p className="text-[10px] font-bold text-red-800 dark:text-red-300 leading-tight">{err.error}</p>
                    </div>
                  ))}
                </div>
              )}

              {importSummary.errors.length === 0 && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-check-double text-2xl"></i>
                  </div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Tudo certo! Nenhum erro encontrado.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800">
              <button 
                onClick={() => setImportSummary(null)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
              >
                Entendido, obrigado!
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-black text-white mb-4 uppercase">{user.name.charAt(0)}</div>
          <span className="px-4 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">Plano {user.plan === 'pro' ? 'Profissional' : user.plan === 'basic' ? 'Básico' : user.plan === 'enterprise' ? 'Enterprise' : 'Grátis'}</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome Completo</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">E-mail</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">CPF / CNPJ</label>
            <input value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} placeholder="000.000.000-00" className="w-full p-4 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all mt-4">Salvar Alterações</button>
        
        {/* Gestão de Assinatura */}
        <div className="pt-6 border-t dark:border-gray-800 mt-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-4">Gestão de Assinatura</h3>
          <div className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${user.subscriptionActive ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'}`}>
            <div>
              <p className={`text-[10px] font-black uppercase ${user.subscriptionActive ? 'text-emerald-600' : 'text-red-600'}`}>
                Status: {user.subscriptionActive ? 'Ativa' : 'Inativa'}
              </p>
              <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Plano atual: {user.plan === 'pro' ? 'Profissional' : user.plan === 'basic' ? 'Básico' : user.plan === 'enterprise' ? 'Enterprise' : 'Grátis'}</p>
            </div>
            {user.subscriptionActive ? (
              <button 
                type="button"
                onClick={() => {
                  if(window.confirm('Tem certeza que deseja cancelar sua assinatura?')) {
                    onUpdateUser({ ...user, subscriptionActive: false });
                    onNotify('Assinatura cancelada.', 'success');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
              >
                Cancelar
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  onUpdateUser({ ...user, subscriptionActive: true, plan: 'pro' });
                  onNotify('Assinatura ativada com sucesso!', 'success');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
              >
                Assinar Agora
              </button>
            )}
          </div>
        </div>

        {/* Backup e Importação */}
        <div className="pt-6 border-t dark:border-gray-800 mt-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-4">Dados e Backup</h3>
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border dark:border-gray-800 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
              Gerencie seus dados. Você pode exportar um backup completo ou restaurar dados de um arquivo anterior.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={handleBackup}
                className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm dark:text-white"
              >
                <i className="fas fa-download"></i> Exportar
              </button>
              <button 
                type="button"
                onClick={handleImportClick}
                disabled={importing}
                className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm dark:text-white disabled:opacity-50"
              >
                <i className={`fas ${importing ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i> {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const OwnersListView = ({ owners, onDeleteOwner }: any) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden transition-all">
      <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
        <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs">Proprietários</h3>
        <button onClick={() => navigate('/owners/new')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">+ Novo</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {owners.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-bold whitespace-nowrap dark:text-gray-200">
                  <Link to={`/owners/${o.id}`} className="hover:text-indigo-600 transition-colors">{o.name}</Link>
                </td>
                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{o.phone}</td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link to={`/owners/${o.id}`} className="text-gray-400 mr-4" title="Ver Ficha"><i className="fas fa-id-card"></i></Link>
                  <button onClick={() => navigate(`/owners/edit/${o.id}`)} className="text-indigo-400 mr-4"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onDeleteOwner(o.id)} className="text-red-300"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TenantsList = ({ tenants, onDeleteTenant }: any) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border dark:border-gray-800 overflow-hidden transition-all">
      <div className="p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
        <h3 className="font-black text-gray-800 dark:text-white uppercase text-xs">Inquilinos</h3>
        <button onClick={() => navigate('/tenants/new')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">+ Novo</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tenants.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-bold whitespace-nowrap dark:text-gray-200">
                  <Link to={`/tenants/${t.id}`} className="hover:text-indigo-600 transition-colors">{t.name}</Link>
                </td>
                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{t.phone}</td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link to={`/tenants/${t.id}`} className="text-gray-400 mr-4" title="Ver Ficha"><i className="fas fa-file-invoice"></i></Link>
                  <button onClick={() => navigate(`/tenants/edit/${t.id}`)} className="text-indigo-400 mr-4"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onDeleteTenant(t.id)} className="text-red-300"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | 'system') || 'system';
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<AsaasPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closings, setClosings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const lastLoadedUserId = useRef<string | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const sortedProperties = useMemo(() => [...properties].sort((a, b) => a.title.localeCompare(b.title)), [properties]);
  const sortedOwners = useMemo(() => [...owners].sort((a, b) => a.name.localeCompare(b.name)), [owners]);
  const sortedTenants = useMemo(() => [...tenants].sort((a, b) => a.name.localeCompare(b.name)), [tenants]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const dbOp = async (table: string, op: 'insert' | 'update' | 'delete' | 'upsert', data: any, id?: string) => {
    if (!currentUser) return null;
    setDbLoading(true);
    try {
      let result: any = null;
      if (op === 'insert') result = await dbService.insert(table, data);
      else if (op === 'upsert') result = await dbService.upsert(table, data);
      else if (op === 'update') result = await dbService.update(table, id!, data);
      else if (op === 'delete') result = await dbService.delete(table, id!);
      
      if (result === false || result === null) {
        onNotify(`Erro ao salvar no banco de dados.`, 'error');
        return null;
      }
      return result;
    } catch (err: any) {
      onNotify(`Erro de conexão: ${err.message}`, 'error');
      return null;
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (currentTheme: 'light' | 'dark' | 'system') => {
      let actualTheme = currentTheme;
      if (currentTheme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      if (actualTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Listen for system theme changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const loadFromCloud = async (uId: string) => {
    if (lastLoadedUserId.current === uId) return;
    setIsInitialLoadDone(false);
    
    try {
      const results = await Promise.allSettled([
        dbService.fetchData('properties', uId),
        dbService.fetchData('tenants', uId),
        dbService.fetchData('owners', uId),
        dbService.fetchData('leases', uId),
        dbService.fetchData('payments', uId),
        dbService.fetchData('expenses', uId),
        dbService.fetchData('visits', uId),
        dbService.fetchData('closings', uId)
      ]);

      const [props, tens, owns, lses, pays, exps, vsts, clss] = results.map(r => r.status === 'fulfilled' ? r.value : []);
      
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        onNotify(`Aviso: ${failedCount} tabelas falharam ao carregar.`, 'error');
      }

      // Sort data alphabetically
      const sortedProps = [...props].sort((a, b) => a.title.localeCompare(b.title));
      const sortedTens = [...tens].sort((a, b) => a.name.localeCompare(b.name));
      const sortedOwns = [...owns].sort((a, b) => a.name.localeCompare(b.name));

      setProperties(sortedProps);
      setTenants(sortedTens);
      setOwners(sortedOwns);
      setLeases(lses);
      setPayments(pays);
      setExpenses(exps);
      setVisits(vsts);
      setClosings(clss || []);
      
      lastLoadedUserId.current = uId;
    } catch (err) {
      console.error('Critical error in loadFromCloud:', err);
      onNotify('Erro crítico ao carregar dados da nuvem.', 'error');
    } finally {
      setIsInitialLoadDone(true);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await dbService.getMe();
        if (user) {
          setCurrentUser(user);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } else {
          // If no user is found in Supabase but we have one in state/localStorage, clear it
          if (currentUser && currentUser.id !== 'mock-user-id') {
            setCurrentUser(null);
            localStorage.removeItem(STORAGE_KEYS.USER);
            navigate('/auth');
          }
        }
      } catch (err) {
        console.error('Session check failed', err);
      }
    };
    
    checkSession();

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';
      if (msg.includes('fetch') || msg === 'Load failed' || msg.includes('Failed to fetch') || msg.includes('CORS')) {
        onNotify('Falha de conexão (CORS). Verifique o console (F12) para instruções de configuração.', 'error');
        console.error('[Supabase] Erro de Conexão detectado no App.');
        console.error('Para resolver, adicione os seguintes domínios na "Allow List" de CORS no painel do Supabase (Settings -> API -> CORS):');
        console.error('- ' + window.location.origin);
        console.error('- https://ais-dev-tiyvggh7xl5kskjpcgwaes-25486387837.us-east1.run.app');
        console.error('- https://ais-pre-tiyvggh7xl5kskjpcgwaes-25486387837.us-east1.run.app');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser && currentUser.id !== 'mock-user-id') {
      loadFromCloud(currentUser.id);
    } else if (!currentUser && location.pathname !== '/auth' && location.pathname !== '/subscription') {
      navigate('/auth');
    }
  }, [currentUser?.id, location.pathname]);


  const onLogin = (user: User) => { setCurrentUser(user); localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)); navigate('/'); };
  const onLogout = async () => { 
    dbService.logout();
    setCurrentUser(null); 
    localStorage.removeItem(STORAGE_KEYS.USER); 
    navigate('/auth'); 
  };
  
  const onUpdateUser = async (updated: User) => {
    if (await dbService.updateProfile({ name: updated.name, plan: updated.plan, subscriptionActive: updated.subscriptionActive })) {
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      onNotify('Perfil atualizado!', 'success');
    }
  };

  const onSelectPlan = (plan: User['plan']) => { if (currentUser) { const updated = { ...currentUser, plan, subscriptionActive: true }; onUpdateUser(updated); navigate('/'); } };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const onNotify = (message: string, type: 'success' | 'error') => { 
    setNotification({ message, type }); 
    addNotification(type === 'success' ? 'Sucesso' : 'Erro', message, type === 'success' ? 'success' : 'error');
    setTimeout(() => setNotification(null), 4000); 
  };

  const onMarkAsPaid = async (paymentId: string) => {
    const currentPayment = payments.find(p => p.id === paymentId);
    if (!currentPayment) return;

    if (await dbOp('payments', 'update', { status: PaymentStatus.RECEIVED }, paymentId)) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: PaymentStatus.RECEIVED } : p));
      
      const lease = leases.find(l => l.id === currentPayment.leaseId);
      if (lease && lease.active) {
        const currentDueDate = new Date(currentPayment.dueDate + 'T12:00:00');
        const nextDueDate = new Date(currentDueDate);
        nextDueDate.setMonth(currentDueDate.getMonth() + 1);
        const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

        const alreadyExists = payments.some(p => p.leaseId === lease.id && p.dueDate === nextDueDateStr);

        if (!alreadyExists) {
          const nextPayment: AsaasPayment = {
            id: `pay_${Date.now()}`,
            userId: currentUser?.id || '',
            leaseId: lease.id,
            tenantId: lease.tenantId,
            amount: lease.monthlyRent,
            dueDate: nextDueDateStr,
            status: PaymentStatus.PENDING,
            invoiceUrl: `https://asaas.com/i/${Math.random().toString(36).substr(2, 8)}`
          };
          const result = await dbOp('payments', 'insert', nextPayment);
          if (result) {
            setPayments(prev => [...prev, result]);
          }
        }
      }
      onNotify('Pagamento confirmado e próxima parcela gerada!', 'success');
    }
  };

  const onUnmarkAsPaid = async (paymentId: string) => {
    if (await dbOp('payments', 'update', { status: PaymentStatus.PENDING }, paymentId)) {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: PaymentStatus.PENDING } : p));
      onNotify('Pagamento revertido para pendente!', 'success');
    }
  };

  const onDeletePayment = async (paymentId: string) => {
    if (await dbOp('payments', 'delete', null, paymentId)) {
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      onNotify('Receita excluída com sucesso!', 'success');
    }
  };

  const onUpdateTenant = async (updated: Tenant) => {
    if (await dbOp('tenants', 'update', updated, updated.id)) {
      setTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
      onNotify('Inquilino atualizado!', 'success');
    }
  };

  const filteredProperties = useMemo(() => properties.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = (p.address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (p.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a, b) => a.title.localeCompare(b.title)), [properties, statusFilter, searchTerm]);
  const isPublicRoute = location.pathname.startsWith('/share/');

  if (!currentUser && !isPublicRoute && location.pathname !== '/auth') return <Navigate to="/auth" />;
  if (currentUser && !currentUser.subscriptionActive && !isPublicRoute && location.pathname !== '/subscription' && location.pathname !== '/auth') return <Navigate to="/subscription" />;

  if (currentUser && !isInitialLoadDone && !isPublicRoute) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#050505]">
        <Logo size="xl" className="mb-8 animate-pulse" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Sincronizando seus dados...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line', path: '/' },
    { id: 'properties', label: 'Imóveis', icon: 'fas fa-building', path: '/properties' },
    { id: 'leases', label: 'Contratos', icon: 'fas fa-file-contract', path: '/leases' },
    { id: 'owners', label: 'Proprietários', icon: 'fas fa-user-tie', path: '/owners' },
    { id: 'tenants', label: 'Inquilinos', icon: 'fas fa-users', path: '/tenants' },
    { id: 'finance', label: 'Financeiro', icon: 'fas fa-wallet', path: '/finance' },
    { id: 'reports', label: 'Fechamento', icon: 'fas fa-file-invoice-dollar', path: '/reports' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#050505] text-gray-900 dark:text-white font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      {currentUser && !isPublicRoute && location.pathname !== '/subscription' && (
        <>
          {/* Mobile Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" 
                onClick={() => setIsSidebarOpen(false)} 
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <motion.aside 
            initial={false}
            animate={{ 
              x: isSidebarOpen ? 0 : -280,
              width: isSidebarOpen ? 280 : 0
            }}
            className="fixed md:relative inset-y-0 left-0 z-[70] bg-white dark:bg-[#050505] border-r border-gray-200 dark:border-white/5 flex flex-col h-full overflow-hidden transition-colors duration-300"
          >
            <div className="p-8 border-b border-gray-200 dark:border-white/5">
              <Link to="/" className="block">
                <Logo size="md" />
              </Link>
            </div>

            <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
              {[
                { path: '/', icon: 'fa-th-large', label: 'Painel' }, 
                { path: '/properties', icon: 'fa-home', label: 'Imóveis' }, 
                { path: '/finance', icon: 'fa-money-bill-wave', label: 'Receitas' }, 
                { path: '/expenses', icon: 'fa-receipt', label: 'Despesas' }, 
                { path: '/visits', icon: 'fa-calendar-check', label: 'Visitas' },
                { path: '/closing', icon: 'fa-file-invoice-dollar', label: 'Fechamento' }, 
                { path: '/owners', icon: 'fa-user-tie', label: 'Proprietários' }, 
                { path: '/tenants', icon: 'fa-users', label: 'Inquilinos' },
                { path: '/profile', icon: 'fa-user-cog', label: 'Configurações' }
              ].map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} 
                    className={`group relative px-4 py-3.5 flex items-center gap-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center ${isActive ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'}`}></i>
                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-pill"
                        className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 border-t border-gray-200 dark:border-white/5 space-y-4">
              {/* Theme Toggle */}
              <div className="flex bg-gray-100 dark:bg-white/[0.03] p-1 rounded-xl border border-gray-200 dark:border-white/5">
                {[
                  { id: 'light', icon: 'fa-sun', label: 'Claro' },
                  { id: 'system', icon: 'fa-desktop', label: 'Auto' },
                  { id: 'dark', icon: 'fa-moon', label: 'Escuro' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                      theme === t.id 
                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-md' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-gray-200'
                    }`}
                    title={t.label}
                  >
                    <i className={`fas ${t.icon} text-xs`}></i>
                    <span className="text-[8px] font-bold uppercase tracking-tighter">{t.label}</span>
                  </button>
                ))}
              </div>

              <Link to="/profile" className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm border border-white/10 text-white">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{currentUser.plan}</p>
                </div>
              </Link>
              
              <button 
                onClick={onLogout} 
                className="w-full py-3 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400/70 border border-red-100 dark:border-transparent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Encerrar Sessão
              </button>
            </div>
          </motion.aside>
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#050505] relative h-full overflow-hidden transition-colors duration-300">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

        {currentUser && !isPublicRoute && (
          <header className="no-print bg-white/50 dark:bg-[#050505]/50 backdrop-blur-xl h-20 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-8 flex-shrink-0 z-40 transition-colors duration-300">
             <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-all"
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
                
                <div className="hidden sm:block">
                  <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                    {menuItems.find(i => i.path === location.pathname)?.label || 'Configurações'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${dbLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">
                      {dbLoading ? 'Sincronizando...' : 'Sistema Operacional'}
                    </span>
                  </div>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Acesso:</span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{currentUser.plan}</span>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`p-2.5 transition-all relative rounded-xl ${isNotificationOpen ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <i className="fas fa-bell"></i>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#050505]" />
                    )}
                  </button>

                  {isNotificationOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                      <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-[24px] shadow-2xl border dark:border-gray-800 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-800 dark:text-white">Notificações</h3>
                          <button 
                            onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                            className="text-[8px] font-black uppercase text-indigo-500 hover:underline"
                          >
                            Marcar todas como lidas
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <i className="fas fa-bell-slash text-gray-300 dark:text-gray-700 text-2xl mb-2"></i>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhuma notificação</p>
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className={`p-4 border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors relative ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}>
                                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                                <div className="flex gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                    n.type === 'error' ? 'bg-red-500/10 text-red-500' :
                                    n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-indigo-500/10 text-indigo-500'
                                  }`}>
                                    <i className={`fas ${
                                      n.type === 'success' ? 'fa-check' :
                                      n.type === 'error' ? 'fa-exclamation-triangle' :
                                      n.type === 'warning' ? 'fa-exclamation' :
                                      'fa-info'
                                    } text-[10px]`}></i>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-800 dark:text-white uppercase leading-tight">{n.title}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">{n.message}</p>
                                    <p className="text-[8px] text-gray-400 mt-2 font-bold uppercase">{new Date(n.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => setNotifications([])}
                            className="w-full p-3 text-[9px] font-black uppercase text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border-t dark:border-gray-800"
                          >
                            Limpar Histórico
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={() => navigate('/tenants/new')} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all hidden sm:block"
                >
                  Novo Inquilino
                </button>
             </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full pb-20">
            <Routes>
              <Route path="/auth" element={<AuthView onLogin={onLogin} onNotify={onNotify} />} />
              <Route path="/subscription" element={<SubscriptionView onSelectPlan={onSelectPlan} />} />
              <Route path="/" element={<DashboardView properties={sortedProperties} payments={payments} owners={sortedOwners} tenants={sortedTenants} expenses={expenses} leases={leases} navigate={navigate} />} />
              <Route path="/finance" element={<FinancePanelView payments={payments} tenants={sortedTenants} properties={sortedProperties} leases={leases} closings={closings} onMarkAsPaid={onMarkAsPaid} onUnmarkAsPaid={onUnmarkAsPaid} onDeletePayment={onDeletePayment} onNotify={onNotify} />} />
              <Route path="/finance/new" element={<PaymentFormView payments={payments} setPayments={setPayments} leases={leases} tenants={sortedTenants} properties={sortedProperties} closings={closings} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/finance/edit/:paymentId" element={<PaymentFormWrapper payments={payments} setPayments={setPayments} leases={leases} tenants={sortedTenants} properties={sortedProperties} closings={closings} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/expenses" element={<ExpensesView expenses={expenses} owners={sortedOwners} properties={sortedProperties} closings={closings} onAddExpense={async (exp: any) => {
                const data = {...exp, userId: currentUser?.id};
                const result = await dbOp('expenses', 'insert', data);
                if (result) {
                  setExpenses(prev => [result, ...prev]);
                }
              }} onDeleteExpense={async (id: any) => {
                if (await dbOp('expenses', 'delete', null, id)) {
                  setExpenses(prev => prev.filter(e => e.id !== id));
                }
              }} onUpdateExpense={async (updated: any) => {
                if (await dbOp('expenses', 'update', updated, updated.id)) {
                  setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
                }
              }} />} />
              <Route path="/closing" element={<ClosingReportView owners={sortedOwners} properties={sortedProperties} payments={payments} expenses={expenses} leases={leases} tenants={tenants} closings={closings} onNotify={onNotify} onAddClosing={async (closing: any) => {
                const data = {...closing, userId: currentUser?.id};
                const result = await dbOp('closings', 'insert', data);
                if (result) {
                  setClosings(prev => [result, ...prev]);
                }
              }} />} />
              <Route path="/properties" element={<PropertiesView searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} filteredProperties={filteredProperties} onDeleteProperty={async (id: string) => {
                if (await dbOp('properties', 'delete', null, id)) {
                  setProperties(p => p.filter(x => x.id !== id));
                }
              }} onDuplicateProperty={async (p: Property) => {
                if (!window.confirm(`Deseja realmente duplicar o imóvel "${p.title}"?`)) return;
                
                // Remove ID and other unique fields to create a fresh copy
                const { id: _, createdAt: __, ...rest } = p as any;
                
                const duplicatedProperty = {
                  ...rest,
                  title: `${p.title} (Cópia)`,
                  status: 'available' as const,
                  userId: currentUser?.id || ''
                };
                
                const result = await dbOp('properties', 'insert', duplicatedProperty);
                if (result) {
                  setProperties(prev => [result, ...prev]);
                  onNotify('Imóvel duplicado com sucesso!', 'success');
                }
              }} navigate={navigate} />} />
              <Route path="/properties/new" element={<PropertyFormView owners={sortedOwners} properties={sortedProperties} setProperties={setProperties} onNotify={onNotify} userId={currentUser?.id} leases={leases} dbOp={dbOp} setDbLoading={setDbLoading} dbLoading={dbLoading} onTerminateLease={async (id: string, exitChecklist?: any[]) => {
                if (await dbOp('properties', 'update', { status: 'available' }, id)) {
                  setProperties(prev => prev.map(p => p.id === id ? {...p, status: 'available'} : p));
                  const activeLease = leases.find(l => l.propertyId === id && l.active);
                  if (activeLease && await dbOp('leases', 'update', { active: false, exitChecklist }, activeLease.id)) {
                    setLeases(prev => prev.map(l => (l.propertyId === id && l.active) ? {...l, active: false, exitChecklist} : l));
                  }
                  onNotify('Contrato encerrado!', 'success');
                }
              }} />} />
              <Route path="/properties/edit/:id" element={<PropertyFormView owners={sortedOwners} properties={sortedProperties} setProperties={setProperties} onNotify={onNotify} userId={currentUser?.id} leases={leases} dbOp={dbOp} setDbLoading={setDbLoading} dbLoading={dbLoading} onTerminateLease={async (id: string, exitChecklist?: any[]) => {
                if (await dbOp('properties', 'update', { status: 'available' }, id)) {
                  setProperties(prev => prev.map(p => p.id === id ? {...p, status: 'available'} : p));
                  const activeLease = leases.find(l => l.propertyId === id && l.active);
                  if (activeLease && await dbOp('leases', 'update', { active: false, exitChecklist }, activeLease.id)) {
                    setLeases(prev => prev.map(l => (l.propertyId === id && l.active) ? {...l, active: false, exitChecklist} : l));
                  }
                  onNotify('Contrato encerrado!', 'success');
                }
              }} />} />
              <Route path="/properties/:id" element={<PropertyDetails properties={sortedProperties} owners={sortedOwners} leases={leases} tenants={sortedTenants} payments={payments} onAddPayment={async (p:any) => {
                const result = await dbOp('payments', 'insert', p);
                if (result) {
                  setPayments(prev => [result, ...prev]);
                }
              }} onTerminateLease={async (id: string, exitChecklist?: any[]) => {
                if (await dbOp('properties', 'update', { status: 'available' }, id)) {
                  setProperties(prev => prev.map(p => p.id === id ? {...p, status: 'available'} : p));
                  const activeLease = leases.find(l => l.propertyId === id && l.active);
                  if (activeLease && await dbOp('leases', 'update', { active: false, exitChecklist }, activeLease.id)) {
                    setLeases(prev => prev.map(l => (l.propertyId === id && l.active) ? {...l, active: false, exitChecklist} : l));
                  }
                  onNotify('Contrato encerrado!', 'success');
                }
              }} />} />
              <Route path="/leases/new/:propertyId" element={<LeaseFormView properties={sortedProperties} tenants={sortedTenants} onAddLease={async (l: Lease) => {
                const resultLease = await dbOp('leases', 'insert', l);
                if (resultLease) {
                  setLeases(prev => [...prev, resultLease]);
                  if (await dbOp('properties', 'update', { status: 'rented' }, resultLease.propertyId)) {
                    setProperties(prev => prev.map(p => p.id === resultLease.propertyId ? {...p, status: 'rented'} : p));
                  }
                  
                  const firstPayment: AsaasPayment = {
                    id: `pay_${Date.now()}`,
                    userId: currentUser?.id || '',
                    leaseId: resultLease.id,
                    tenantId: resultLease.tenantId,
                    amount: (resultLease.deposit && resultLease.deposit > 0) ? resultLease.deposit : resultLease.monthlyRent,
                    dueDate: resultLease.startDate,
                    status: PaymentStatus.PENDING,
                    invoiceUrl: `https://asaas.com/i/${Math.random().toString(36).substr(2, 8)}`
                  };
                  const resultPayment = await dbOp('payments', 'insert', firstPayment);
                  if (resultPayment) {
                    setPayments(prev => [...prev, resultPayment]);
                  }
                  onNotify('Imóvel alugado e 1ª parcela gerada!', 'success');
                }
              }} userId={currentUser?.id} />} />
              <Route path="/visits" element={<VisitsView visits={visits} properties={sortedProperties} onUpdateVisit={async (id: string, updates: any) => {
                if (await dbOp('visits', 'update', updates, id)) {
                  setVisits(prev => prev.map(v => v.id === id ? {...v, ...updates} : v));
                  onNotify('Visita atualizada!', 'success');
                }
              }} onDeleteVisit={async (id: string) => {
                if (await dbOp('visits', 'delete', null, id)) {
                  setVisits(prev => prev.filter(v => v.id !== id));
                  onNotify('Visita removida!', 'success');
                }
              }} />} />
              <Route path="/properties/:propertyId/schedule" element={<VisitFormView properties={sortedProperties} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/owners" element={<OwnersListView owners={sortedOwners} onDeleteOwner={async (id: string) => {
                if (await dbOp('owners', 'delete', null, id)) {
                  setOwners(o => o.filter(x => x.id !== id));
                }
              }} />} />
              <Route path="/owners/new" element={<OwnerFormView owners={sortedOwners} setOwners={setOwners} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/owners/edit/:id" element={<OwnerFormView owners={sortedOwners} setOwners={setOwners} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/owners/:id" element={<OwnerDetailsView owners={sortedOwners} properties={sortedProperties} payments={payments} leases={leases} expenses={expenses} />} />
              <Route path="/tenants" element={<TenantsList tenants={sortedTenants} onDeleteTenant={async (id: string) => {
                if (await dbOp('tenants', 'delete', null, id)) {
                  setTenants(t => t.filter(x => x.id !== id));
                }
              }} />} />
              <Route path="/tenants/new" element={<TenantFormView tenants={sortedTenants} setTenants={setTenants} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/tenants/edit/:id" element={<TenantFormView tenants={sortedTenants} setTenants={setTenants} onNotify={onNotify} userId={currentUser?.id} dbOp={dbOp} />} />
              <Route path="/tenants/:id" element={<TenantDetailsView tenants={sortedTenants} payments={payments} leases={leases} properties={sortedProperties} onUpdateTenant={onUpdateTenant} />} />
              <Route path="/profile" element={<UserProfileView user={currentUser!} onUpdateUser={onUpdateUser} onNotify={onNotify} dbOp={dbOp} refreshData={() => { lastLoadedUserId.current = null; return loadFromCloud(currentUser!.id); }} appData={{ properties: sortedProperties, tenants: sortedTenants, owners: sortedOwners, leases, payments, expenses, visits }} />} />
              <Route path="/share/:id" element={<PropertyPresentation />} />
            </Routes>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
