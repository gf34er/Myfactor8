/**
 * ПОЛНАЯ ВЕРСИЯ: Мульти-инъекции, PDF, Врач, Группировка и Системные пуши
 */

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, deleteDoc, setDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut 
} from 'firebase/auth';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { 
  Plus, History, Package, Settings, Trash2, Droplet, CheckCircle2, X, Calendar, 
  Bell, Clock, AlertTriangle, Palette, Type, Maximize, Layout, ChevronRight, 
  ChevronDown, BarChart3, TrendingUp, Archive, LogOut, Mail, Lock, UserPlus, 
  LogIn, Printer, Folder, FolderOpen, SlidersHorizontal, Layers, Stethoscope, BellRing
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
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
const appId = 'my-factor-v1'; 

// ВСТАВЬТЕ СЮДА КЛЮЧ ИЗ ШАГА 1 (Generate Key Pair)
const VAPID_KEY = "BJEaSzR1koKzUs-y9lbs5LxbCtkIaWGHRd4gXg-dB67flxPOgIrDz5bWV2w5vkDp_XNJwxlLgoIKywQIKw9cMOw";

// --- UI Компоненты ---
const Button = ({ children, onClick, variant = 'primary', className = '', loading = false, style = {}, type = "button" }) => {
  const variants = {
    primary: "text-white shadow-lg", 
    secondary: "bg-white border shadow-sm text-slate-600",
    danger: "bg-red-500 text-white shadow-md shadow-red-100",
    ghost: "bg-transparent text-slate-400 hover:text-slate-600",
    outline: "bg-transparent border-2 border-slate-200 text-slate-500 hover:border-slate-300"
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
        <div className="max-h-[75vh] overflow-y-auto px-1 pb-4">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); 
  const [authError, setAuthError] = useState("");
  
  const [view, setView] = useState('dashboard');
  const [historyTab, setHistoryTab] = useState('list');
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [doctorConfig, setDoctorConfig] = useState({ enabled: true, visitDate: null });
  const [loading, setLoading] = useState(true);
  
  const [expandedYear, setExpandedYear] = useState(new Date().getFullYear().toString());
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [selectedStatsYear, setSelectedStatsYear] = useState(new Date().getFullYear().toString());
  const [analyticsHalf, setAnalyticsHalf] = useState(1); 
  
  const [inventorySort, setInventorySort] = useState('expiry'); 
  const [expandedFolders, setExpandedFolders] = useState({});
  const [injectRows, setInjectRows] = useState([{ medId: '', dose: '' }]);

  const [settings, setSettings] = useState({
    fontSize: 'md', iconSize: 'md', cardSize: 'md', bgColor: '#E0F7FA', accentColor: '#00897B'
  });

  const [isMedModal, setIsMedModal] = useState(false);
  const [isInjectModal, setIsInjectModal] = useState(false);
  const [isReminderModal, setIsReminderModal] = useState(false);
  const [isSettingsModal, setIsSettingsModal] = useState(false);
  const [isDoctorModal, setIsDoctorModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const sz = useMemo(() => {
    const f = settings.fontSize;
    return {
      xs: f === 'sm' ? 'text-[10px]' : f === 'lg' ? 'text-[14px]' : 'text-[11px]',
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
    return { p: s === 'sm' ? 'p-3' : s === 'lg' ? 'p-10' : 'p-4', gap: s === 'sm' ? 'gap-2' : s === 'lg' ? 'gap-6' : 'gap-4' };
  }, [settings.cardSize]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const base = ['artifacts', appId, 'users', user.uid];
    const unsubInv = onSnapshot(collection(db, ...base, 'inventory'), s => setInventory(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubHist = onSnapshot(collection(db, ...base, 'history'), s => {
      const logs = s.docs.map(d => ({id: d.id, ...d.data()}));
      setHistory(logs.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });
    const unsubRem = onSnapshot(collection(db, ...base, 'reminders'), s => setReminders(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubDoc = onSnapshot(doc(db, ...base, 'settings', 'doctor'), sDoc => { if (sDoc.exists()) setDoctorConfig(sDoc.data()); });
    getDoc(doc(db, ...base, 'settings', 'ui')).then(sDoc => { if (sDoc.exists()) setSettings(sDoc.data()); setLoading(false); });
    return () => { unsubInv(); unsubHist(); unsubRem(); unsubDoc(); };
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === 'register') await createUserWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
      else await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
    } catch (err) { setAuthError("Ошибка авторизации. Проверьте данные."); }
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'ui'), updated);
  };

  // ЛОГИКА СИСТЕМНЫХ ПУШЕЙ
  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && messaging) {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
          // Сохраняем токен в профиль пользователя, чтобы сервер знал, кому слать пуш
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'push'), {
            token: currentToken,
            updatedAt: serverTimestamp()
          });
          alert("Уведомления успешно настроены!");
        }
      }
    } catch (error) {
      alert("Ошибка при настройке уведомлений. Убедитесь, что приложение добавлено на экран 'Домой'.");
    }
  };

  const handleMultiInject = async (e) => {
    e.preventDefault();
    if (!user) return;
    const reason = e.target.reason.value || "Профилактика";
    for (const row of injectRows) {
      if (!row.medId || !row.dose || row.dose <= 0) continue;
      const med = inventory.find(m => m.id === row.medId);
      if (med && med.quantity >= row.dose) {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          medId: med.id, medName: med.name, dose: Number(row.dose), unit: 'ед', reason: reason, timestamp: serverTimestamp()
        });
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', med.id), {
          quantity: med.quantity - Number(row.dose)
        });
      }
    }
    setIsInjectModal(false); setInjectRows([{ medId: '', dose: '' }]);
  };

  const saveDoctorVisit = async (e) => {
    e.preventDefault();
    const date = e.target.visitDate.value; 
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'doctor'), { enabled: true, visitDate: date || null });
    setIsDoctorModal(false);
  };

  const doctorAlerts = useMemo(() => {
    const alerts = [];
    if (!doctorConfig.enabled) return alerts;
    const now = new Date();
    const visitDate = doctorConfig.visitDate ? new Date(doctorConfig.visitDate) : null;
    if (visitDate && visitDate > now) {
      const diffHours = (visitDate - now) / (1000 * 60 * 60);
      if (diffHours <= 48) alerts.push({ type: 'doctor_b', title: 'Скоро визит к врачу!', text: `Назначено на ${visitDate.toLocaleDateString('ru-RU')} в ${visitDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}`, urgent: true });
    } else {
      const targetMonths = [1, 4, 7, 10]; 
      if (targetMonths.includes(now.getMonth()) && now.getDate() <= 7 && now.getDay() >= 1 && now.getDay() <= 5) {
        alerts.push({ type: 'doctor_a', title: 'Плановый осмотр', text: 'Пора позвонить и записаться к гематологу.', urgent: false });
      }
    }
    return alerts;
  }, [doctorConfig]);

  const groupedInventory = useMemo(() => {
    const groups = {};
    inventory.forEach(item => {
      if (!groups[item.name]) groups[item.name] = { items: [], totalQty: 0, totalInit: 0, closestExpiry: Infinity, earliestAdd: item.createdAt?.toMillis() || 0 };
      groups[item.name].items.push(item); groups[item.name].totalQty += item.quantity; groups[item.name].totalInit += item.initialQuantity;
      if (item.expiryDate) { const expDate = new Date(item.expiryDate).getTime(); if (expDate < groups[item.name].closestExpiry) groups[item.name].closestExpiry = expDate; }
    });
    Object.values(groups).forEach(g => {
      g.items.sort((a,b) => inventorySort === 'expiry' ? (a.expiryDate ? new Date(a.expiryDate) : Infinity) - (b.expiryDate ? new Date(b.expiryDate) : Infinity) : (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    });
    return Object.entries(groups).map(([name, data]) => ({name, ...data})).sort((a,b) => inventorySort === 'expiry' ? a.closestExpiry - b.closestExpiry : b.earliestAdd - a.earliestAdd);
  }, [inventory, inventorySort]);

  const totalInventoryStats = useMemo(() => {
    const qty = inventory.reduce((s, i) => s + i.quantity, 0); const init = inventory.reduce((s, i) => s + i.initialQuantity, 0);
    return { qty, init, percent: init > 0 ? Math.round((qty/init)*100) : 0 };
  }, [inventory]);

  const groupedHistory = useMemo(() => {
    const groups = {};
    history.forEach(h => {
      const date = h.timestamp?.toDate ? h.timestamp.toDate() : new Date(); const year = date.getFullYear().toString(); const month = date.toLocaleString('ru-RU', { month: 'long' });
      if (!groups[year]) groups[year] = { months: {}, total: 0, count: 0 }; if (!groups[year].months[month]) groups[year].months[month] = { entries: [], total: 0 };
      groups[year].months[month].entries.push(h); groups[year].months[month].total += Number(h.dose || 0); groups[year].total += Number(h.dose || 0); groups[year].count += 1;
    }); return groups;
  }, [history]);

  const filteredStats = useMemo(() => {
    const stats = { reasons: {}, months: Array(12).fill(0), total: 0, count: 0 };
    history.forEach(h => {
      const date = h.timestamp?.toDate();
      if (date && date.getFullYear().toString() === selectedStatsYear) {
        const dose = Number(h.dose || 0); stats.total += dose; stats.count += 1; stats.months[date.getMonth()] += dose;
        const r = h.reason || "Профилактика"; if (!stats.reasons[r]) stats.reasons[r] = { count: 0, total: 0, dates: [] };
        stats.reasons[r].count += 1; stats.reasons[r].total += dose; stats.reasons[r].dates.push(date);
      }
    });
    const chartData = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"].map((n, i) => [n, stats.months[i]]);
    return { ...stats, chartData: analyticsHalf === 1 ? chartData.slice(0, 6) : chartData.slice(6, 12), reasonList: Object.entries(stats.reasons).sort((a,b) => b[1].count - a[1].count) };
  }, [history, selectedStatsYear, analyticsHalf]);

  const remindersWithStatus = useMemo(() => {
    return reminders.map(rem => {
      const lastInject = rem.medId ? history.find(h => h.medId === rem.medId) : history[0];
      const lastDate = lastInject?.timestamp?.toDate() || new Date(rem.startDate);
      const nextDate = new Date(lastDate); nextDate.setDate(nextDate.getDate() + Number(rem.intervalDays));
      const diffDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      let statusText = `Через ${diffDays} дн.`; if (diffDays === 0) statusText = 'Сегодня вечером!'; if (diffDays < 0) statusText = 'Просрочено!';
      return { ...rem, nextDate, diffDays, isDue: diffDays <= 0, statusText, lastActualDate: lastInject?.timestamp?.toDate() };
    });
  }, [reminders, history]);

  const handlePrintPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    let html = `<html><head><title>Медицинский отчет MyFactor</title><style>body { font-family: sans-serif; padding: 20px; color: #333; } h1 { color: #00897B; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { background-color: #E0F7FA; }</style></head><body><h1>Выписка из журнала MyFactor</h1><p><strong>Пациент:</strong> ${user?.email}</p><p><strong>Год отчета:</strong> ${selectedStatsYear}</p><table><tr><th>Дата</th><th>Препарат</th><th>Доза (ед)</th><th>Причина / Место</th></tr>`;
    const historyForYear = history.filter(h => h.timestamp?.toDate().getFullYear().toString() === selectedStatsYear);
    historyForYear.forEach(h => { html += `<tr><td>${h.timestamp.toDate().toLocaleDateString('ru-RU')}</td><td>${h.medName}</td><td>${h.dose}</td><td>${h.reason}</td></tr>`; });
    html += `</table></body></html>`;
    iframe.contentWindow.document.write(html); iframe.contentWindow.document.close(); iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#E0F7FA]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-[#00897B]" /></div>;
  if (!user) return ( <div className="min-h-screen bg-[#E0F7FA] flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-500"><div className="text-center space-y-2"><div className="w-20 h-20 bg-[#00897B] rounded-[2rem] flex items-center justify-center mx-auto shadow-lg text-white mb-4"><Droplet size={40} /></div><h1 className="text-3xl font-black text-slate-800 tracking-tight">MyFactor</h1><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ваше здоровье под контролем</p></div><form onSubmit={handleAuth} className="space-y-4">{authError && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100">{authError}</div>}<div className="relative"><Mail className="absolute left-5 top-5 text-slate-300" size={20} /><input name="email" type="email" placeholder="Email" required className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-[#00897B] outline-none font-bold text-sm" /></div><div className="relative"><Lock className="absolute left-5 top-5 text-slate-300" size={20} /><input name="password" type="password" placeholder="Пароль" required className="w-full p-5 pl-14 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 focus:ring-[#00897B] outline-none font-bold text-sm" /></div><Button type="submit" style={{ backgroundColor: '#00897B' }} className="py-5">{authMode === 'login' ? <><LogIn size={20}/> Войти</> : <><UserPlus size={20}/> Регистрация</>}</Button></form><Button variant="ghost" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}</Button></div></div> );

  return (
    <div className="min-h-screen pb-32 font-sans transition-all duration-500 overflow-x-hidden" style={{ backgroundColor: settings.bgColor, color: '#1e293b' }}>
      <header className="p-6 bg-white/70 backdrop-blur-xl border-b sticky top-0 z-40 border-slate-200 flex justify-between items-center">
        <h1 className={`${sz.lg} font-black tracking-tight`} style={{ color: settings.accentColor }}>MyFactor</h1>
        <button onClick={() => setIsSettingsModal(true)} className="p-2.5 bg-white shadow-sm rounded-full" style={{ color: settings.accentColor }}><Settings size={is.base}/></button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 text-left">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            {doctorAlerts.map((alert, i) => (
              <div key={`doc-${i}`} onClick={() => setIsDoctorModal(true)} className={`bg-blue-50 border ${alert.urgent ? 'border-blue-400' : 'border-blue-100'} p-5 rounded-[2rem] flex items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-sm`}>
                <div className={`p-3 rounded-2xl ${alert.urgent ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-100 text-blue-500'}`}><Stethoscope size={is.lg} /></div>
                <div className="flex-1 text-left"><p className={`${sz.xs} font-black text-blue-400 uppercase tracking-widest mb-1`}>{alert.title}</p><p className={`font-black text-slate-700 ${sz.sm}`}>{alert.text}</p></div>
              </div>
            ))}
            {remindersWithStatus.filter(r => r.isDue).map(rem => (
              <div key={rem.id} className="bg-red-50 border border-red-100 p-5 rounded-[2rem] flex items-center gap-4 animate-pulse shadow-sm">
                <AlertTriangle className="text-red-500 shrink-0" size={is.lg} />
                <div className="flex-1 text-left"><p className={`${sz.xs} font-black text-red-400 uppercase tracking-widest mb-1`}>{rem.statusText}</p><p className={`font-black text-red-700 ${sz.sm}`}>{rem.medName}</p></div>
                <button onClick={() => setIsInjectModal(true)} className="text-white p-3.5 rounded-2xl shadow-lg bg-red-500"><Plus size={is.sm}/></button>
              </div>
            ))}
            <div className={`rounded-[2.5rem] ${cs.p} text-white shadow-2xl relative overflow-hidden transition-all duration-500`} style={{ backgroundColor: settings.accentColor }}>
              <div className="relative z-10"><p className={`text-white/90 ${sz.base} font-black uppercase tracking-widest opacity-90 capitalize mb-2`}>Итоги за {new Date().toLocaleString('ru-RU', { month: 'long' })}</p><div className="mt-2 flex flex-col gap-2"><h2 className={`${sz.xl} font-black leading-none`}>{history.filter(h => h.timestamp?.toDate().getMonth() === new Date().getMonth() && h.timestamp?.toDate().getFullYear() === new Date().getFullYear()).length} <span className={sz.lg}>инъекций</span></h2><p className={`${sz.lg} font-bold opacity-90`}>{history.filter(h => h.timestamp?.toDate().getMonth() === new Date().getMonth() && h.timestamp?.toDate().getFullYear() === new Date().getFullYear()).reduce((s, h) => s + Number(h.dose || 0), 0).toLocaleString()} <span className={sz.base}>ед. за месяц</span></p></div><Button variant="secondary" className={`mt-8 bg-white/20 text-white border-none backdrop-blur-md py-5 ${sz.base}`} onClick={() => setIsInjectModal(true)}><Plus size={is.sm}/> Записать инъекцию</Button></div>
              <div className="absolute -right-8 -bottom-8 text-white/10 rotate-12"><Droplet size={120} /></div>
            </div>
            <div className={`grid grid-cols-2 ${cs.gap}`}>
              <div onClick={() => setView('inventory')} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100 text-center cursor-pointer active:scale-95 transition-all"><Package className="mx-auto mb-2" size={is.base} style={{ color: settings.accentColor }}/><p className={`${sz.sm} font-black mt-2`}>{Math.round(totalInventoryStats.qty)} ед.</p><p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest mt-1`}>Запасы</p></div>
              <div onClick={() => setView('history')} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100 text-center cursor-pointer active:scale-95 transition-all"><History className="mx-auto mb-2" size={is.base} style={{ color: settings.accentColor }}/><p className={`${sz.sm} font-black mt-2`}>{history.length}</p><p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest mt-1`}>Журнал</p></div>
            </div>
          </div>
        )}

        {view === 'inventory' && ( <div className="space-y-4 animate-in slide-in-from-right duration-500">
            <div className={`bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm space-y-3`}><div className="flex justify-between items-center"><h2 className={`${sz.base} font-black tracking-tight text-slate-800`}>Общий запас</h2><span className={`${sz.xs} font-black uppercase text-slate-400`}>{Math.round(totalInventoryStats.qty)} / {totalInventoryStats.init} ед.</span></div><div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full transition-all duration-1000" style={{ width: `${Math.min(100, totalInventoryStats.percent)}%`, backgroundColor: settings.accentColor }}/></div></div>
            <div className="flex gap-2">
              <button onClick={() => setInventorySort(inventorySort === 'expiry' ? 'added' : 'expiry')} className="flex-1 bg-white p-4 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center justify-center gap-2 text-slate-600 active:scale-95 transition-all"><SlidersHorizontal size={16} style={{ color: settings.accentColor }} /> <span className={`${sz.xs} font-black uppercase`}>Сорт: {inventorySort === 'expiry' ? 'По сроку' : 'По дате'}</span></button>
              <button onClick={() => setIsMedModal(true)} className="w-14 h-14 text-white rounded-[1.8rem] flex items-center justify-center shadow-lg active:scale-90" style={{ backgroundColor: settings.accentColor }}><Plus size={is.base}/></button>
            </div>
            {groupedInventory.map(folder => (
               <div key={folder.name} className="space-y-2">
                  <div onClick={() => setExpandedFolders(p => ({...p, [folder.name]: !p[folder.name]}))} className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all"><div className="flex items-center gap-3"><div className="p-2.5 bg-slate-50 rounded-2xl" style={{ color: settings.accentColor }}>{expandedFolders[folder.name] ? <FolderOpen size={is.base}/> : <Folder size={is.base}/>}</div><div><h3 className={`font-black ${sz.base} text-slate-800`}>{folder.name}</h3><p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest mt-1`}>{Math.round(folder.totalQty)} ед. (Партий: {folder.items.length})</p></div></div><div className="text-slate-300">{expandedFolders[folder.name] ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}</div></div>
                  {expandedFolders[folder.name] && ( <div className="pl-4 pr-2 space-y-3 animate-in slide-in-from-top duration-300 pb-2">{folder.items.map(m => { const spent = (m.initialQuantity || 0) - (m.quantity || 0); const percent = m.initialQuantity ? Math.round((m.quantity/m.initialQuantity)*100) : 0; return ( <div key={m.id} className={`bg-white/80 backdrop-blur-sm ${cs.p} rounded-[1.8rem] border border-white shadow-sm space-y-3 relative overflow-hidden`}><div className="flex justify-between items-start text-left"><div className="flex-1"><h4 className={`font-black ${sz.sm} leading-tight text-slate-700 flex items-center gap-2`}><Layers size={14} style={{ color: settings.accentColor }}/> Партия от {m.createdAt?.toDate().toLocaleDateString('ru-RU') || '...'}</h4>{m.expiryDate && <span className={`${sz.xs} text-red-400 font-black uppercase flex items-center gap-1 mt-1.5`}><Calendar size={12}/> Годен до: {new Date(m.expiryDate).toLocaleDateString('ru-RU', {month:'short', year:'numeric'})}</span>}</div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'inventory', m.id))} className="text-slate-200 p-1 hover:text-red-400 transition-colors"><Trash2 size={is.sm}/></button></div><div className="space-y-2"><div className={`flex justify-between ${sz.xs} font-black uppercase text-slate-400`}><span>Остаток: {Math.round(m.quantity*100)/100} / {m.initialQuantity}</span><span style={{ color: settings.accentColor }}>{percent}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full transition-all duration-1000" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: settings.accentColor }}/></div></div></div> ); })}</div> )}
               </div>
            ))}
        </div> )}

        {view === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-500 pb-10">
            <div className="bg-white p-2 rounded-[2.2rem] border border-slate-100 shadow-sm flex items-center gap-2">
              <button onClick={() => setHistoryTab('list')} className={`flex-1 py-4 rounded-[1.8rem] font-black ${sz.sm} transition-all flex items-center justify-center gap-2 ${historyTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 bg-transparent'}`}><History size={18}/> Журнал</button>
              <button onClick={() => setHistoryTab('stats')} className={`flex-1 py-4 rounded-[1.8rem] font-black ${sz.sm} transition-all flex items-center justify-center gap-2 ${historyTab === 'stats' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 bg-transparent'}`}><BarChart3 size={18}/> Анализ</button>
              <button onClick={handlePrintPDF} className="p-4 rounded-[1.8rem] bg-slate-50 text-slate-400 hover:text-white hover:bg-[#00897B] transition-all active:scale-95 shadow-sm"><Printer size={20}/></button>
            </div>
            {historyTab === 'list' ? (
              <div className="space-y-4">
                {Object.entries(groupedHistory).sort((a,b) => b[0] - a[0]).map(([year, yearData]) => (
                  <div key={year} className="space-y-3">
                    <div onClick={() => setExpandedYear(expandedYear === year ? null : year)} className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all"><div className="flex items-center gap-3"><div className="p-2.5 bg-slate-50 rounded-2xl" style={{ color: settings.accentColor }}>{expandedYear === year ? <ChevronDown size={is.base}/> : <ChevronRight size={is.base}/>}</div><div><p className={`font-black ${sz.base} text-slate-800`}>{year} год</p><p className={`${sz.xs} font-bold text-slate-400 uppercase tracking-widest mt-1`}>{yearData.total.toLocaleString()} ед. всего</p></div></div><Archive size={16} className="text-slate-300"/></div>
                    {expandedYear === year && ( <div className="pl-4 space-y-3 animate-in slide-in-from-top duration-300">{Object.entries(yearData.months).map(([month, monthData]) => ( <div key={month} className="space-y-2"><div onClick={() => setExpandedMonth(expandedMonth === month ? null : month)} className="bg-white/60 backdrop-blur-sm p-4 rounded-[1.8rem] border border-white/50 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm" style={{ color: settings.accentColor }}>{expandedMonth === month ? <ChevronDown size={is.sm}/> : <ChevronRight size={is.sm}/>}</div><p className={`font-black ${sz.sm} text-slate-700 capitalize`}>{month}</p></div><p className={`${sz.xs} font-black px-3 py-1 bg-white rounded-full shadow-sm`} style={{ color: settings.accentColor }}>{monthData.total.toLocaleString()} ед.</p></div>{expandedMonth === month && ( <div className="pl-4 space-y-2 animate-in zoom-in-95 duration-200">{monthData.entries.map(h => ( <div key={h.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-50 flex justify-between items-center shadow-sm"><div className="flex gap-3 items-center text-left"><div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner" style={{ color: settings.accentColor }}><CheckCircle2 size={is.sm}/></div><div><p className={`font-black ${sz.xs} text-slate-800`}>{h.medName}</p><p className={`${sz.xs} text-slate-400 font-bold uppercase tracking-tight`}>{h.reason}</p></div></div><div className="text-right"><p className={`font-black ${sz.sm}`} style={{ color: settings.accentColor }}>-{h.dose}</p><p className={`${sz.xs} text-slate-300 font-bold mt-1`}>{h.timestamp?.toDate ? h.timestamp.toDate().toLocaleDateString('ru-RU') : '...'}</p></div></div> ))}</div> )}</div> ))}</div> )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500 text-left">
                <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Calendar size={18}/></div><span className={`${sz.sm} font-black text-slate-800`}>Отчет за:</span></div><select value={selectedStatsYear} onChange={(e) => setSelectedStatsYear(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-sm outline-none text-[#00897B]">{Object.keys(groupedHistory).sort((a,b) => b-a).map(y => <option key={y} value={y}>{y} год</option>)}{Object.keys(groupedHistory).length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()} год</option>}</select></div>
                <div className={`p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden`} style={{ backgroundColor: settings.accentColor }}><div className="relative z-10 text-left"><p className={`${sz.xs} font-black uppercase opacity-70 mb-1`}>Итоги {selectedStatsYear}</p><div className="flex justify-between items-end"><div><h2 className={`${sz.xl} font-black leading-none`}>{filteredStats.total.toLocaleString()}</h2><p className={`${sz.sm} font-bold opacity-80 uppercase mt-2`}>Ед. введено</p></div><div className="text-right"><h3 className={`${sz.lg} font-black leading-none`}>{filteredStats.count}</h3><p className={`${sz.xs} font-bold opacity-80 uppercase mt-2`}>Инъекций</p></div></div></div></div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 text-left"><div className="flex justify-between items-center"><h3 className={`font-black ${sz.sm} text-slate-800 flex items-center gap-2`}><TrendingUp size={18} style={{ color: settings.accentColor }}/> Расход</h3><div className="flex bg-slate-50 p-1 rounded-xl"><button onClick={() => setAnalyticsHalf(1)} className={`px-3 py-1.5 rounded-lg ${sz.xs} font-black transition-all ${analyticsHalf===1 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>1 Плг.</button><button onClick={() => setAnalyticsHalf(2)} className={`px-3 py-1.5 rounded-lg ${sz.xs} font-black transition-all ${analyticsHalf===2 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>2 Плг.</button></div></div><div className="flex items-end justify-between h-32 pt-2 px-1 gap-2">{filteredStats.chartData.map(([month, val]) => { const max = Math.max(...filteredStats.chartData.map(d => d[1]), 1); const height = (val / max) * 100; return ( <div key={month} className="flex-1 flex flex-col items-center gap-2 group"><span className="text-[8px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-4">{val}</span><div className="w-full bg-slate-50 rounded-t-lg relative overflow-hidden h-full"><div className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out rounded-t-md" style={{ height: `${height}%`, backgroundColor: settings.accentColor }} /></div><span className={`text-[10px] font-black text-slate-400 uppercase`}>{month}</span></div> );})}</div></div>
                <div className="space-y-4 pb-6"><h3 className={`font-black ${sz.sm} text-slate-800 px-2 text-left`}>Мишени и причины ({selectedStatsYear})</h3>{filteredStats.reasonList.map(([reason, data]) => { const avgInterval = data.dates.length > 1 ? Math.round((data.dates[0] - data.dates[data.dates.length-1]) / (1000*60*60*24) / (data.dates.length-1)) : null; return ( <div key={reason} className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center"><div className="flex-1 text-left"><div className="flex items-center gap-2 mb-1"><div className={`w-2 h-2 rounded-full ${reason.toLowerCase().includes('профил') ? 'bg-blue-400' : 'bg-red-400'}`} /><h4 className={`font-black ${sz.base} text-slate-800`}>{reason}</h4></div><div className="flex gap-4"><p className={`${sz.xs} font-bold text-slate-400 uppercase text-left`}>Случаев: <span className="text-slate-700">{data.count}</span></p>{avgInterval && <p className={`${sz.xs} font-bold text-slate-400 uppercase`}>Раз в {avgInterval} дн.</p>}</div></div><div className="text-right"><p className={`font-black ${sz.sm} text-slate-800`}>{data.total.toLocaleString()}</p><p className={`${sz.xs} font-bold text-slate-300 uppercase mt-1`}>ед. всего</p></div></div> ); })}</div>
              </div>
            )}
          </div>
        )}

        {view === 'reminders' && (
          <div className="space-y-5 animate-in slide-in-from-right duration-500 pb-10 text-left">
            <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex justify-between items-center px-6">
              <h2 className={`${sz.lg} font-black tracking-tight`}>Ваш График</h2>
              <button onClick={() => setIsReminderModal(true)} className="w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90" style={{ backgroundColor: settings.accentColor }}><Plus size={is.base}/></button>
            </div>
            <div className={`bg-white ${cs.p} rounded-[2.2rem] border border-slate-100 shadow-sm space-y-4`}><div className="flex justify-between items-start text-left"><div className="flex gap-4 items-center"><div className="p-3 rounded-2xl bg-blue-50 text-blue-500 shadow-sm"><Stethoscope size={is.base} /></div><div><p className={`font-black ${sz.base} text-slate-800`}>Визит к врачу</p><p className={`${sz.xs} font-bold text-slate-400 uppercase mt-1`}>{doctorConfig.visitDate ? 'Назначен визит' : 'Плановый раз в квартал'}</p></div></div><button onClick={() => setIsDoctorModal(true)} className="text-slate-400 bg-slate-50 p-2 rounded-xl font-bold text-xs hover:bg-blue-50 hover:text-blue-500 transition-all">Настроить</button></div><div className="flex flex-col gap-2"><div className={`p-4 rounded-2xl flex justify-between items-center shadow-inner ${doctorConfig.visitDate && new Date(doctorConfig.visitDate) > new Date() ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}><span className={`${sz.xs} font-black uppercase tracking-widest`}>{doctorConfig.visitDate ? new Date(doctorConfig.visitDate).toLocaleDateString('ru-RU') : 'Ожидание'}</span><span className={`${sz.xs} font-black uppercase`}>{doctorConfig.visitDate ? new Date(doctorConfig.visitDate).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) : 'Не назначено'}</span></div></div></div>
            {remindersWithStatus.map(rem => (
              <div key={rem.id} className={`bg-white ${cs.p} rounded-[2.2rem] border-2 ${rem.isDue ? 'border-red-200' : 'border-transparent'} shadow-sm space-y-4`}><div className="flex justify-between items-start text-left"><div className="flex gap-4 items-center"><div className={`p-3 rounded-2xl shadow-sm ${rem.isDue ? 'bg-red-50 text-red-500' : 'bg-slate-50'}`} style={{ color: !rem.isDue ? settings.accentColor : undefined }}><Clock size={is.base} /></div><div><p className={`font-black ${sz.base} text-slate-800`}>{rem.medName}</p><p className={`${sz.xs} font-bold text-slate-400 uppercase mt-1`}>Раз в {rem.intervalDays} дн.</p></div></div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', rem.id))} className="text-slate-200 p-2"><Trash2 size={20}/></button></div><div className="flex flex-col gap-2"><div className={`p-4 rounded-2xl flex justify-between items-center shadow-inner ${rem.isDue ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}><span className={`${sz.xs} font-black uppercase tracking-widest`}>След.: {rem.nextDate.toLocaleDateString('ru-RU')}</span><span className={`${sz.xs} font-black uppercase`}>{rem.statusText}</span></div></div></div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 pb-10 pt-4 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        {[ { id: 'dashboard', icon: Droplet, label: 'Обзор' }, { id: 'inventory', icon: Package, label: 'Запасы' }, { id: 'history', icon: History, label: 'Журнал' }, { id: 'reminders', icon: Bell, label: 'График' } ].map(item => (
          <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center gap-1.5 transition-all ${view === item.id ? 'scale-110' : 'text-slate-300 opacity-60'}`} style={{ color: view === item.id ? settings.accentColor : undefined }}><item.icon size={is.base} strokeWidth={view === item.id ? 3 : 2} /><span className={`${sz.xs} font-black uppercase tracking-tighter`}>{item.label}</span></button>
        ))}
      </nav>

      <Modal isOpen={isDoctorModal} onClose={() => setIsDoctorModal(false)} title="Назначить визит" titleClass={sz.lg}>
        <form onSubmit={saveDoctorVisit} className="space-y-6 text-left"><div className="p-5 bg-blue-50 rounded-[2rem] border border-blue-100 mb-4"><p className="text-xs font-bold text-blue-600">Система сама напомнит вам записаться к врачу в будние дни начала Февраля, Мая, Августа и Ноября.</p></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Точная дата и время визита</label><input name="visitDate" type="datetime-local" defaultValue={doctorConfig.visitDate ? doctorConfig.visitDate : ''} className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm outline-none text-[#00897B]" /></div><div className="flex gap-3"><Button variant="outline" type="button" onClick={async () => { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'doctor'), { enabled: true, visitDate: null }); setIsDoctorModal(false); }} className="py-4 text-xs w-1/3">Сбросить</Button><Button style={{ backgroundColor: settings.accentColor }} type="submit" className="py-4 text-sm flex-1">Сохранить</Button></div></form>
      </Modal>

      <Modal isOpen={isSettingsModal} onClose={() => setIsSettingsModal(false)} title="Настройки" titleClass={sz.lg}>
        <div className="space-y-8 pb-6 text-left">
          <div className="space-y-4"><div className={`flex items-center gap-3 text-slate-600 font-black ${sz.sm}`}><Type size={20} /> <span>Размер текста</span></div><div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">{['sm', 'md', 'lg'].map(size => (<button key={size} onClick={() => updateSettings({ fontSize: size })} className={`flex-1 py-2.5 ${sz.xs} font-black rounded-xl transition-all ${settings.fontSize === size ? 'bg-white shadow-md text-slate-800' : 'text-slate-400'}`}>{size === 'sm' ? 'Мал' : size === 'md' ? 'Срд' : 'Блш'}</button>))}</div></div>
          
          {/* ВОССТАНОВЛЕННЫЕ НАСТРОЙКИ */}
          <div className="space-y-4"><div className={`flex items-center gap-3 text-slate-600 font-black ${sz.sm}`}><Maximize size={20} /> <span>Размер иконок</span></div><div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">{['sm', 'md', 'lg'].map(size => (<button key={size} onClick={() => updateSettings({ iconSize: size })} className={`flex-1 py-2.5 ${sz.xs} font-black rounded-xl transition-all ${settings.iconSize === size ? 'bg-white shadow-md text-slate-800' : 'text-slate-400'}`}>{size === 'sm' ? 'Мал' : size === 'md' ? 'Срд' : 'Блш'}</button>))}</div></div>
          <div className="space-y-4"><div className={`flex items-center gap-3 text-slate-600 font-black ${sz.sm}`}><Layout size={20} /> <span>Размер окон</span></div><div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">{['sm', 'md', 'lg'].map(size => (<button key={size} onClick={() => updateSettings({ cardSize: size })} className={`flex-1 py-2.5 ${sz.xs} font-black rounded-xl transition-all ${settings.cardSize === size ? 'bg-white shadow-md text-slate-800' : 'text-slate-400'}`}>{size === 'sm' ? 'Мал' : size === 'md' ? 'Срд' : 'Блш'}</button>))}</div></div>
          <div className="space-y-4"><div className={`flex items-center gap-3 text-slate-600 font-black ${sz.sm}`}><Palette size={20} /> <span>Цвет фона</span></div><div className="flex flex-wrap gap-4">{['#E0F7FA', '#E8EAF6', '#F5F5F5', '#FFF3E0', '#F1F8E9', '#FFFFFF'].map(color => (<button key={color} onClick={() => updateSettings({ bgColor: color })} className={`w-12 h-12 rounded-2xl border-4 transition-all active:scale-90 ${settings.bgColor === color ? 'border-slate-800 scale-110 shadow-lg' : 'border-slate-200'}`} style={{ backgroundColor: color }} />))}</div></div>
          <div className="space-y-4"><div className={`flex items-center gap-3 text-slate-600 font-black ${sz.sm}`}><Droplet size={20} /> <span>Цвет темы</span></div><div className="flex flex-wrap gap-4">{['#00897B', '#1E88E5', '#5E35B1', '#E53935', '#FB8C00', '#000000'].map(color => (<button key={color} onClick={() => updateSettings({ accentColor: color })} className={`w-12 h-12 rounded-2xl border-4 transition-all active:scale-90 ${settings.accentColor === color ? 'border-slate-800 scale-110 shadow-lg' : 'border-white'}`} style={{ backgroundColor: color }} />))}</div></div>

          <div className="space-y-4 pt-6 border-t border-slate-100"><div className={`flex items-center gap-3 text-slate-600 font-black ${sz.sm}`}><BellRing size={20} /> <span>Уведомления (iOS)</span></div><Button variant="outline" onClick={requestPushPermission} className="py-4 text-xs text-blue-500 border-blue-200 hover:bg-blue-50 w-full">Запросить системное разрешение</Button><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-2 leading-relaxed">Для работы фоновых пушей требуется настройка Firebase Cloud Messaging и iOS 16.4+.</p></div>
          <div className="pt-6 border-t border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Аккаунт</p><div className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm text-[#00897B]"><Mail size={18}/></div><span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{user?.email}</span></div><button onClick={() => signOut(auth)} className="text-red-500 font-black text-[10px] flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl active:scale-95 transition-all"><LogOut size={14}/> Выйти</button></div>{user?.metadata?.creationTime && ( <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">В системе с {new Date(user.metadata.creationTime).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</div> )}</div></div>
          <Button style={{ backgroundColor: settings.accentColor }} onClick={() => setIsSettingsModal(false)} className={`mt-6 ${sz.sm}`}>Закрыть</Button>
        </div>
      </Modal>

      <Modal isOpen={isMedModal} onClose={() => setIsMedModal(false)} title="Новое лекарство" titleClass={sz.lg}>
        <form onSubmit={async (e) => { e.preventDefault(); const d = new FormData(e.target); await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'inventory'), { name: d.get('name'), quantity: parseFloat(d.get('q')), initialQuantity: parseFloat(d.get('q')), expiryDate: d.get('expiry'), unit: 'ед', createdAt: serverTimestamp() }); setIsMedModal(false); }} className="space-y-5 text-left"><input name="name" placeholder="Название" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required /><input name="q" type="number" placeholder="Количество единиц" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required /><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Срок годности</label><input name="expiry" type="date" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm" required /></div><Button style={{ backgroundColor: settings.accentColor }} type="submit" className="py-4 text-sm">Добавить</Button></form>
      </Modal>
      <Modal isOpen={isInjectModal} onClose={() => { setIsInjectModal(false); setInjectRows([{medId:'', dose:''}]); }} title="Ввести дозу" titleClass={sz.lg}>
        <form onSubmit={handleMultiInject} className="space-y-5 text-left"><div className="space-y-3">{injectRows.map((row, index) => (<div key={index} className="flex gap-2 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100"><div className="flex-1 space-y-2"><select value={row.medId} onChange={(e) => { const newRows = [...injectRows]; newRows[index].medId = e.target.value; setInjectRows(newRows); }} className="w-full p-3 bg-white rounded-xl border-none ring-1 ring-slate-200 font-bold text-xs outline-none" required><option value="">Выберите флакон...</option>{inventory.filter(m => m.quantity > 0).map(m => (<option key={m.id} value={m.id}>{m.name} ({Math.round(m.quantity)} ед) {m.expiryDate ? `— до ${new Date(m.expiryDate).toLocaleDateString('ru-RU',{month:'2-digit', year:'2-digit'})}` : ''}</option>))}</select><input type="number" placeholder="Доза (ед.)" value={row.dose} onChange={(e) => { const newRows = [...injectRows]; newRows[index].dose = e.target.value; setInjectRows(newRows); }} className="w-full p-3 bg-white rounded-xl border-none ring-1 ring-slate-200 font-bold text-xs outline-none" required /></div>{injectRows.length > 1 && (<button type="button" onClick={() => setInjectRows(injectRows.filter((_, i) => i !== index))} className="p-3 text-red-400 bg-white rounded-xl shadow-sm"><Trash2 size={16}/></button>)}</div>))}<Button variant="outline" type="button" onClick={() => setInjectRows([...injectRows, {medId:'', dose:''}])} className="py-3 text-xs w-full"><Plus size={16}/> Добавить флакон в этот укол</Button></div><div className="space-y-2 pt-2 border-t border-slate-100"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">Общая причина / Место инъекции</label><input list="reasons" name="reason" defaultValue="Профилактика" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm outline-none" required /><datalist id="reasons"><option value="Профилактика" /><option value="Правое колено" /><option value="Левое колено" /><option value="Правый локоть" /><option value="Левый локоть" /></datalist></div><Button style={{ backgroundColor: settings.accentColor }} type="submit" className="py-4 text-sm mt-4">Записать инъекцию</Button></form>
      </Modal>
      <Modal isOpen={isReminderModal} onClose={() => setIsReminderModal(false)} title="Новый график" titleClass={sz.lg}>
        <form onSubmit={async (e) => { e.preventDefault(); const d = new FormData(e.target); const medId = d.get('medId'); await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'reminders'), { medId: medId || null, medName: medId ? inventory.find(m => m.id === medId)?.name : d.get('customName'), intervalDays: Number(d.get('days')), startDate: new Date().toISOString() }); setIsReminderModal(false); }} className="space-y-6 text-left"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">Привязать к препарату</label><select name="medId" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm outline-none"><option value="">Общий график (любой препарат)</option>{inventory.map(m => (<option key={m.id} value={m.id}>{m.name} {m.expiryDate ? `(до ${new Date(m.expiryDate).toLocaleDateString('ru-RU',{month:'2-digit', year:'2-digit'})})` : ''}</option>))}</select></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">Или укажите свое название</label><input name="customName" placeholder="Например: Профилактика" className="w-full p-5 bg-slate-50 rounded-2xl border-none ring-2 ring-slate-100 font-bold text-sm outline-none" /></div><div className="text-center space-y-2 pt-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Интервал (дней)</label><input name="days" type="number" defaultValue="4" className="w-full p-4 bg-slate-50 rounded-[2rem] font-black text-4xl text-center border-none outline-none text-[#00897B]" required /></div><Button style={{ backgroundColor: settings.accentColor }} type="submit" className="py-4 text-sm mt-4">Создать</Button></form>
      </Modal>
    </div>
  );
}