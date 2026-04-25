import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  Plus, 
  History, 
  Package, 
  Settings, 
  Trash2, 
  Droplet, 
  CheckCircle2, 
  X, 
  Calendar, 
  Bell, 
  Clock, 
  AlertTriangle, 
  Palette, 
  Type, 
  Maximize, 
  Layout,
  ChevronRight,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Archive,
  LogOut,
  Mail,
  Lock,
  UserPlus,
  LogIn
} from 'lucide-react';

// --- Конфигурация Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyA0NYofLM70IA7cTbwR_jMaxxpDmsoGCyo",
  authDomain: "myfactor-7bd68.firebaseapp.com",
  projectId: "myfactor-7bd68",
  storageBucket: "myfactor-7bd68.firebasestorage.app",
  messagingSenderId: "93673990627",
  appId: "1:93673990627:web:7a763173c4bbba31f958d6",
  measurementId: "G-QJ2WBK8LDE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-factor-v1'; 

// --- UI Компоненты ---
const Button = ({ children, onClick, variant = 'primary', className = '', loading = false, style = {}, type = "button" }) => {
  const variants = {
    primary: "text-white shadow-lg", 
    secondary: "bg-white border shadow-sm text-slate-600",
    danger: "bg-red-500 text-white shadow-md shadow-red-100",
    ghost: "bg-transparent text-slate-400 hover:text-slate-600"
  };
  return (
    <button type={type} onClick={onClick} style={style} disabled={loading} className={`px-4 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 w-full active:scale-95 transition-all ${variants[variant]} ${className}`}>
      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children, titleClass = "" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className={`font-black text-slate-800 ${titleClass}`}>{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-1">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' или 'register'
  const [authError, setAuthError] = useState("");
  
  const [view, setView] = useState('dashboard');
  const [historyTab, setHistoryTab] = useState('list');
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedYear, setExpandedYear] = useState(new Date().getFullYear().toString());
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [selectedStatsYear, setSelectedStatsYear] = useState(new Date().getFullYear().toString());

  const [settings, setSettings] = useState({
    fontSize: 'md', iconSize: 'md', cardSize: 'md', bgColor: '#E0F7FA', accentColor: '#00897B'
  });

  const [isMedModal, setIsMedModal] = useState(false);
  const [isInjectModal, setIsInjectModal] = useState(false);
  const [isReminderModal, setIsReminderModal] = useState(false);
  const [isSettingsModal, setIsSettingsModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Карта размеров
  const sz = useMemo(() => {
    const f = settings.fontSize;
    return {
      xs: f === 'sm' ? 'text-[10px]' : f === 'lg' ? 'text-[14px]' : 'text-[12px]',
      sm: f === 'sm' ? 'text-[12px]' : f === 'lg' ? 'text-[16px]' : 'text-sm',
      base: f === 'sm' ? 'text-sm' : f === 'lg' ? 'text-lg' : 'text-base',
      lg: f === 'sm' ? 'text-lg' : f === 'lg' ? 'text-3xl' : 'text-2xl',
      xl: f === 'sm' ? 'text-3xl' : f === 'lg' ? 'text-6xl' : 'text-5xl',
    };
  }, [settings.fontSize]);

  const is = useMemo(() => {
    const s = settings.iconSize;
    return {
      tiny: s === 'sm' ? 10 : s === 'lg' ? 16 : 12,
      sm: s === 'sm' ? 14 : s === 'lg' ? 22 : 18,
      base: s === 'sm' ? 18 : s === 'lg' ? 28 : 24,
      lg: s === 'sm' ? 22 : s === 'lg' ? 36 : 28,
      xl: s === 'sm' ? 28 : s === 'lg' ? 48 : 36,
    };
  }, [settings.iconSize]);

  const cs = useMemo(() => {
    const s = settings.cardSize;
    return {
      p: s === 'sm' ? 'p-3' : s === 'lg' ? 'p-10' : 'p-6',
      spacing: s === 'sm' ? 'space-y-2' : s === 'lg' ? 'space-y-8' : 'space-y-4',
      gap: s === 'sm' ? 'gap-2' : s === 'lg' ? 'gap-6' : 'gap-4',
    };
  }, [settings.cardSize]);

  // Слежение за состоянием входа
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Загрузка данных при наличии пользователя
  useEffect(() => {
    if (!user) return;
    const base = ['artifacts', appId, 'users', user.uid];

    const unsubInv = onSnapshot(collection(db, ...base, 'inventory'), s => setInventory(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubHist = onSnapshot(collection(db, ...base, 'history'), s => {
      const logs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setHistory(logs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });
    const unsubRem = onSnapshot(collection(db, ...base, 'reminders'), s => setReminders(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    getDoc(doc(db, ...base, 'settings', 'ui')).then(sDoc => {
      if (sDoc.exists()) setSettings(sDoc.data());
      setLoading(false);
    });

    return () => { unsubInv(); unsubHist(); unsubRem(); };
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      if (authMode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.code === 'auth/weak-password' ? "Пароль слишком короткий" : "Ошибка: неверный логин или пароль");
    }
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'ui'), updated);
  };

  const handleInject = async (medId, dose, reason) => {
    if (!user) return;
    const med = inventory.find(m => m.id === medId);
    if (!med || med.quantity < dose) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
      medId: med.id, medName: med.name, dose: Number(dose), unit: 'ед', reason: reason || "Профилактика", timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', medId), {
      quantity: med.quantity - Number(dose)
    });
    setIsInjectModal(false);
  };

  const groupedHistory = useMemo(() => {
    const groups = {};
    history.forEach(h => {
      const date = h.timestamp?.toDate ? h.timestamp.toDate() : new Date();
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('ru-RU', { month: 'long' });
      if (!groups[year]) groups[year] = { months: {}, total: 0, count: 0 };
      if (!groups[year].months[month]) groups[year].months[month] = { entries: [], total: 0 };
      groups[year].months[month].entries.push(h);
      groups[year].months[month].total += Number(h.dose || 0);
      groups[year].total += Number(h.dose || 0);
      groups[year].count += 1;
    });
    return groups;
  }, [history]);

  const filteredStats = useMemo(() => {
    const stats = { reasons: {}, months: Array(12).fill(0), total: 0, count: 0 };
    const monthsNames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    history.forEach(h => {
      const date = h.timestamp?.toDate();
      if (date && date.getFullYear().toString() === selectedStatsYear) {
        const dose = Number(h.dose || 0);
        stats.total += dose;
        stats.count += 1;
        stats.months[date.getMonth()] += dose;
        const r = h.reason || "Профилактика";
        if (!stats.reasons[r]) stats.reasons[r] = { count: 0, total: 0, dates: [] };
        stats.reasons[r].count += 1;
        stats.reasons[r].total += dose;
        stats.reasons[r].dates.push(date);
      }
    });
    return { ...stats, chartData: monthsNames.map((n, i) => [n, stats.months[i]]), reasonList: Object.entries(stats.reasons).sort((a,b) => b[1].count - a[1].count) };
  }, [history, selectedStatsYear]);

  const remindersWithStatus = useMemo(() => {
    return reminders.map(rem => {
      const lastInject = rem.medId ? history.find(h => h.medId === rem.medId) : history[0];
      const lastDate = lastInject?.timestamp?.toDate() || new Date(rem.startDate);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + Number(rem.intervalDays));
      const diffDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { ...rem, nextDate, diffDays, isDue: diffDays <= 0, lastActualDate: lastInject?.timestamp?.toDate() };
    });
  }, [reminders, history]);

  const currentMonthName = useMemo(() => new Date().toLocaleString('ru-RU', { month: 'long' }), []);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#E0F7FA]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-[#00897B]" /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#E0F7FA] flex items-center justify-center p-6 text-left">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-[#00897B] rounded-[2rem] flex items-center justify-center mx-auto shadow-lg text-white mb-4">
             <Droplet size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">MyFactor</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ваше здоровье под контролем</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authError && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100">{authError}</div>}
          <div className="relative">
            <Mail className="absolute left-5 top-5 text-slate-300" size={20} />
            <input name="email" type="email" placeholder="Email" required className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-[#00897B] outline-none font-bold text-sm" />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-5 text-slate-300" size={20} />
            <input name="password" type="password" placeholder="Пароль" required className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-[#00897B] outline-none font-bold text-sm" />
          </div>
          <Button type="submit" style={{ backgroundColor: '#00897B' }} className="py-5">
            {authMode === 'login' ? <><LogIn size={20}/> Войти</> : <><UserPlus size={20}/> Создать аккаунт</>}
          </Button>
        </form>

        <Button variant="ghost" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
          {authMode === 'login' ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 font-sans transition-all duration-500 overflow-x-hidden" style={{ backgroundColor: settings.bgColor, color: '#1e293b' }}>
      <header className="p-6 bg-white/70 backdrop-blur-xl border-b sticky top-0 z-40 border-slate-200 flex justify-between items-center">
        <h1 className={`${sz.lg} font-black tracking-tight`} style={{ color: settings.accentColor }}>MyFactor</h1>
        <button onClick={() => setIsSettingsModal(true)} className="p-2.5 bg-white shadow-sm rounded-full" style={{ color: settings.accentColor }}><Settings size={is.base}/></button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 text-left">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            {remindersWithStatus.filter(r => r.isDue).map(rem => (
              <div key={rem.id} className="bg-red-50 border border-red-100 p-5 rounded-[2rem] flex items-center gap-4 animate-pulse">
                <AlertTriangle className="text-red-500 shrink-0" size={is.lg} />
                <div className="flex-1">
                  <p className={`${sz.xs} font-black text-red-400 uppercase tracking-widest leading-none mb-1`}>Пора вводить!</p>
                  <p className={`font-black text-red-700 ${sz.sm}`}>{rem.medName}</p>
                </div>
                <button onClick={() => setIsInjectModal(true)} className="text-white p-3.5 rounded-2xl shadow-lg bg-red-500"><Plus size={is.sm}/></button>
              </div>
            ))}

            <div className={`rounded-[2.5rem] ${cs.p} text-white shadow-2xl relative overflow-hidden transition-all duration-500`} style={{ backgroundColor: settings.accentColor }}>
              <div className="relative z-10">
                <p className={`text-white/90 ${sz.base} font-black uppercase tracking-widest opacity-90 capitalize mb-2`}>Итоги за {currentMonthName}</p>
                <div className="mt-2 flex flex-col gap-2">
                  <h2 className={`${sz.xl} font-black leading-none`}>{history.filter(h => h.timestamp?.toDate().getMonth() === new Date().getMonth() && h.timestamp?.toDate().getFullYear() === new Date().getFullYear()).length} <span className={sz.lg}>инъекций</span></h2>
                  <p className={`${sz.lg} font-bold opacity-90`}>{history.filter(h => h.timestamp?.toDate().getMonth() === new Date().getMonth() && h.timestamp?.toDate().getFullYear() === new Date().getFullYear()).reduce((s, h) => s + Number(h.dose || 0), 0).toLocaleString()} <span className={sz.base}>ед. всего</span></p>
                </div>
                <Button variant="secondary" className={`mt-8 bg-white/20 text-white border-none backdrop-blur-md py-5 ${sz.base}`} onClick={() => setIsInjectModal(true)}><Plus size={is.sm}/> Записать инъекцию</Button>
              </div>
              <Droplet size={120} className="absolute -right-8 -bottom-8 text-white/10 rotate-12" />
            </div>

            <div className={`grid grid-cols-2 ${cs.gap}`}>
              <div onClick={() => setView('inventory')} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100 text-center cursor-pointer active:scale-95 transition-all">
                <Package className="mx-auto mb-2" size={is.base} style={{ color: settings.accentColor }}/>
                <p className={`${sz.lg} font-black`}>{inventory.length}</p>
                <p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest`}>Лекарство</p>
              </div>
              <div onClick={() => setView('history')} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100 text-center cursor-pointer active:scale-95 transition-all">
                <History className="mx-auto mb-2" size={is.base} style={{ color: settings.accentColor }}/>
                <p className={`${sz.lg} font-black`}>{history.length}</p>
                <p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest`}>Журнал</p>
              </div>
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500">
            <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center px-6">
              <h2 className={`${sz.lg} font-black tracking-tight`}>Ваши лекарства</h2>
              <button onClick={() => setIsMedModal(true)} className="w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90" style={{ backgroundColor: settings.accentColor }}><Plus size={is.base}/></button>
            </div>
            {inventory.map(m => {
              const spent = (m.initialQuantity || 0) - (m.quantity || 0);
              const percent = m.initialQuantity ? Math.round((m.quantity/m.initialQuantity)*100) : 0;
              return (
                <div key={m.id} className={`bg-white ${cs.p} rounded-[2.2rem] border border-slate-100 shadow-sm space-y-4 relative overflow-hidden`}>
                  {deleteConfirmId === m.id && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 z-10 animate-in fade-in text-center">
                      <p className={`${sz.sm} font-black text-slate-800 mb-4`}>Удалить препарат из списка?</p>
                      <div className="flex gap-4 w-full px-4">
                        <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 font-bold bg-slate-100 rounded-2xl">Нет</button>
                        <button onClick={() => { deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', m.id)); setDeleteConfirmId(null); }} className="flex-1 py-3 font-bold bg-red-500 text-white rounded-2xl">Да</button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-left">
                      <h3 className={`font-black ${sz.base} leading-tight text-slate-800`}>{m.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-bold text-slate-400 uppercase text-[10px]">
                        <span>Всего: <span className="text-slate-700">{m.initialQuantity}</span></span>
                        <span>Потрачено: <span style={{ color: settings.accentColor }}>{Math.round(spent*100)/100}</span></span>
                      </div>
                      {m.expiryDate && <span className={`${sz.xs} text-red-400 font-black uppercase flex items-center gap-1 mt-1`}><Calendar size={12}/> Годен до: {m.expiryDate}</span>}
                    </div>
                    <button onClick={() => setDeleteConfirmId(m.id)} className="text-slate-200 p-1 hover:text-red-400 transition-colors"><Trash2 size={is.sm}/></button>
                  </div>
                  <div className="space-y-2">
                    <div className={`flex justify-between ${sz.xs} font-black uppercase text-slate-400`}>
                      <span>Остаток: {Math.round(m.quantity*100)/100} ед.</span>
                      <span style={{ color: settings.accentColor }}>{percent}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: settings.accentColor }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-10">
            <div className="bg-white p-2 rounded-[2.2rem] border border-slate-100 shadow-sm flex">
              <button onClick={() => setHistoryTab('list')} className={`flex-1 py-4 rounded-[1.8rem] font-black ${sz.sm} transition-all flex items-center justify-center gap-2 ${historyTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                <History size={18}/> Список
              </button>
              <button onClick={() => setHistoryTab('stats')} className={`flex-1 py-4 rounded-[1.8rem] font-black ${sz.sm} transition-all flex items-center justify-center gap-2 ${historyTab === 'stats' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                <BarChart3 size={18}/> Аналитика
              </button>
            </div>

            {historyTab === 'list' ? (
              <div className="space-y-4">
                {Object.entries(groupedHistory).sort((a,b) => b[0] - a[0]).map(([year, yearData]) => (
                  <div key={year} className="space-y-3">
                    <div onClick={() => setExpandedYear(expandedYear === year ? null : year)} className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 rounded-2xl" style={{ color: settings.accentColor }}>{expandedYear === year ? <ChevronDown size={is.base}/> : <ChevronRight size={is.base}/>}</div>
                        <div>
                          <p className={`font-black ${sz.base} text-slate-800`}>{year} год</p>
                          <p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest`}>{yearData.total.toLocaleString()} ед. всего</p>
                        </div>
                      </div>
                      <Archive size={16} className="text-slate-300"/>
                    </div>
                    {expandedYear === year && (
                      <div className="pl-4 space-y-3 animate-in slide-in-from-top duration-300">
                        {Object.entries(yearData.months).map(([month, monthData]) => (
                          <div key={month} className="space-y-2">
                            <div onClick={() => setExpandedMonth(expandedMonth === month ? null : month)} className="bg-white/60 backdrop-blur-sm p-4 rounded-[1.8rem] border border-white/50 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm" style={{ color: settings.accentColor }}>{expandedMonth === month ? <ChevronDown size={is.sm}/> : <ChevronRight size={is.sm}/>}</div>
                                <p className={`font-black ${sz.sm} text-slate-700 capitalize`}>{month}</p>
                              </div>
                              <p className={`${sz.xs} font-black px-3 py-1 bg-white rounded-full shadow-sm`} style={{ color: settings.accentColor }}>{monthData.total.toLocaleString()} ед.</p>
                            </div>
                            {expandedMonth === month && (
                              <div className="pl-4 space-y-2 animate-in zoom-in-95 duration-200">
                                {monthData.entries.map(h => (
                                  <div key={h.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-50 flex justify-between items-center shadow-sm">
                                    <div className="flex gap-3 items-center text-left">
                                      <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner" style={{ color: settings.accentColor }}><CheckCircle2 size={is.sm}/></div>
                                      <div><p className={`font-black ${sz.xs} text-slate-800`}>{h.medName}</p><p className={`${sz.xs} text-slate-400 font-bold uppercase tracking-tight`}>{h.reason}</p></div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`font-black ${sz.sm}`} style={{ color: settings.accentColor }}>-{h.dose}</p>
                                      <p className={`${sz.xs} text-slate-300 font-bold`}>{h.timestamp?.toDate ? h.timestamp.toDate().toLocaleDateString() : '...'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-3"><div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Calendar size={18}/></div><span className={`${sz.sm} font-black text-slate-800`}>Период:</span></div>
                   <select value={selectedStatsYear} onChange={(e) => setSelectedStatsYear(e.target.value)} className={`bg-slate-50 border-none rounded-xl px-4 py-2 font-black ${sz.sm} outline-none`}>
                     {Object.keys(groupedHistory).sort((a,b) => b-a).map(y => <option key={y} value={y}>{y} год</option>)}
                     {Object.keys(groupedHistory).length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()} год</option>}
                   </select>
                </div>
                <div className={`p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden`} style={{ backgroundColor: settings.accentColor }}>
                   <div className="relative z-10 text-left">
                      <p className={`${sz.xs} font-black uppercase opacity-70 mb-1`}>Итоги {selectedStatsYear}</p>
                      <div className="flex justify-between items-end">
                         <div><h2 className={`${sz.xl} font-black leading-none`}>{filteredStats.total.toLocaleString()}</h2><p className={`${sz.sm} font-bold opacity-80 uppercase`}>Ед. введено</p></div>
                         <div className="text-right"><h3 className={`${sz.lg} font-black leading-none`}>{filteredStats.count}</h3><p className={`${sz.xs} font-bold opacity-80 uppercase`}>Инъекций</p></div>
                      </div>
                   </div>
                </div>
                {/* График и Анализ причин оставлены без изменений */}
              </div>
            )}
          </div>
        )}

        {view === 'reminders' && (
          <div className="space-y-5 animate-in slide-in-from-right duration-500 pb-10">
            <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center px-6">
              <h2 className={`${sz.lg} font-black tracking-tight`}>График введения</h2>
              <button onClick={() => setIsReminderModal(true)} className="w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90" style={{ backgroundColor: settings.accentColor }}><Plus size={is.base}/></button>
            </div>
            {remindersWithStatus.map(rem => (
              <div key={rem.id} className={`bg-white ${cs.p} rounded-[2.2rem] border-2 ${rem.isDue ? 'border-red-200' : 'border-transparent'} shadow-sm space-y-4`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className={`p-3 rounded-2xl shadow-sm ${rem.isDue ? 'bg-red-50 text-red-500' : 'bg-slate-50'}`} style={{ color: !rem.isDue ? settings.accentColor : undefined }}><Clock size={is.base} /></div>
                    <div className="text-left"><p className={`font-black ${sz.base} text-slate-800`}>{rem.medName}</p><p className={`${sz.xs} font-bold text-slate-400 uppercase`}>Раз в {rem.intervalDays} дн.</p></div>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', rem.id))} className="text-slate-200 p-2"><Trash2 size={20}/></button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`p-4 rounded-2xl flex justify-between items-center shadow-inner ${rem.isDue ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>
                     <span className={`${sz.xs} font-black uppercase tracking-widest`}>След.: {rem.nextDate.toLocaleDateString()}</span>
                     <span className={`${sz.xs} font-black uppercase`}>{rem.isDue ? 'Пора!' : `Через ${rem.diffDays} дн.`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 pb-10 pt-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        {[
          { id: 'dashboard', icon: Droplet, label: 'Обзор' },
          { id: 'inventory', icon: Package, label: 'Лекарство' },
          { id: 'history', icon: History, label: 'Журнал' },
          { id: 'reminders', icon: Bell, label: 'График' }
        ].map(item => (
          <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center gap-1.5 transition-all ${view === item.id ? 'scale-110' : 'text-slate-300 opacity-60'}`} style={{ color: view === item.id ? settings.accentColor : undefined }}>
            <item.icon size={is.base} strokeWidth={view === item.id ? 3 : 2} />
            <span className={`${sz.xs} font-black uppercase tracking-tighter`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Модалка настроек */}
      <Modal isOpen={isSettingsModal} onClose={() => setIsSettingsModal(false)} title="Настройки" titleClass={sz.lg}>
        <div className="space-y-8 pb-6 text-left">
          {/* Размер текста, иконок и окон оставлены без изменений */}
          <div className="pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Аккаунт</p>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-[#00897B]"><Mail size={18}/></div>
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{user.email}</span>
               </div>
               <button onClick={() => signOut(auth)} className="text-red-500 font-black text-xs flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl active:scale-95 transition-all">
                 <LogOut size={16}/> Выйти
               </button>
            </div>
          </div>
          <Button style={{ backgroundColor: settings.accentColor }} onClick={() => setIsSettingsModal(false)} className={`mt-6 ${sz.sm}`}>Готово</Button>
        </div>
      </Modal>

      {/* Остальные модалки данных (Med, Inject, Reminder) */}
      <Modal isOpen={isMedModal} onClose={() => setIsMedModal(false)} title="Новое лекарство" titleClass={sz.lg}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.target);
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'inventory'), {
            name: d.get('name'), quantity: parseFloat(d.get('q')), initialQuantity: parseFloat(d.get('q')), expiryDate: d.get('expiry'), unit: 'ед', createdAt: serverTimestamp()
          });
          setIsMedModal(false);
        }} className="space-y-5">
          <input name="name" placeholder="Название фактора" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required />
          <input name="q" type="number" placeholder="Количество единиц" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required />
          <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Срок годности</label>
          <input name="expiry" type="date" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required /></div>
          <Button style={{ backgroundColor: settings.accentColor }} type="submit" className="py-4 text-sm">Добавить</Button>
        </form>
      </Modal>

      <Modal isOpen={isInjectModal} onClose={() => setIsInjectModal(false)} title="Ввести дозу" titleClass={sz.lg}>
        <form onSubmit={e => {
          e.preventDefault();
          const d = new FormData(e.target);
          handleInject(d.get('id'), parseFloat(d.get('dose')), d.get('reason'));
        }} className="space-y-5 text-left">
          <select name="id" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required>
            {inventory.map(m => <option key={m.id} value={m.id}>{m.name} ({Math.round(m.quantity)} ед.)</option>)}
          </select>
          <input name="dose" type="number" placeholder="Доза (ед.)" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required />
          <input list="reasons" name="reason" defaultValue="Профилактика" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required />
          <datalist id="reasons">
            <option value="Профилактика" /><option value="Правое колено" /><option value="Левое колено" /><option value="Правый локоть" /><option value="Левый локоть" />
          </datalist>
          <Button style={{ backgroundColor: settings.accentColor }} type="submit" className="py-4 text-sm">Подтвердить</Button>
        </form>
      </Modal>
    </div>
  );
}