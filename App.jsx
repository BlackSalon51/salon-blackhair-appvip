import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Scissors, 
  Receipt, 
  Sparkles, 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  Wallet, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  X, 
  Calendar, 
  Zap, 
  Menu,
  CreditCard,
  PlusCircle,
  Tag
} from 'lucide-react';

// Firebase Setup
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "demo-api-key",
      authDomain: "demo-salon.firebaseapp.com",
      projectId: "demo-salon",
      storageBucket: "demo-salon.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'black-hair-salon';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions', 'shampoo_cards', 'staff', 'services'

  // Firestore Collections State
  const [transactions, setTransactions] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [shampooCards, setShampooCards] = useState([]);
  const [services, setServices] = useState([]);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedCardForUse, setSelectedCardForUse] = useState(null);

  // Forms State
  const [txForm, setTxForm] = useState({
    type: 'thu', // 'thu' or 'chi'
    serviceId: '',
    serviceName: '',
    serviceCategory: 'cut', // 'cut' (Cắt Sấy), 'chem' (Hóa Chất)
    amount: '',
    staffId: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [cardForm, setCardForm] = useState({
    customerName: '',
    customerPhone: '',
    totalSessions: '10',
    price: '500000',
    staffId: '',
    note: 'Gội dưỡng sinh 10 buổi'
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    cutCommission: '20',
    chemCommission: '10'
  });

  const [advanceForm, setAdvanceForm] = useState({
    staffId: '',
    amount: '',
    type: 'advance', // 'advance' (Ứng lương), 'pay' (Trả lương chốt)
    note: 'Tạm ứng lương'
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    category: 'cut' // 'cut' | 'chem'
  });

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync Real-time Data
  useEffect(() => {
    if (!user) return;

    // Transactions
    const unSubTx = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'transactions'),
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        setTransactions(docs);
      },
      (err) => console.error(err)
    );

    // Staff
    const unSubStaff = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'staff'),
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (docs.length === 0) initDefaultData();
        else setStaffList(docs);
      },
      (err) => console.error(err)
    );

    // Shampoo Cards
    const unSubCards = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'shampoo_cards'),
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        setShampooCards(docs);
      },
      (err) => console.error(err)
    );

    // Services
    const unSubServices = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'services'),
      (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setServices(docs);
      },
      (err) => console.error(err)
    );

    return () => {
      unSubTx();
      unSubStaff();
      unSubCards();
      unSubServices();
    };
  }, [user]);

  // Tạo dữ liệu dịch vụ & thợ mẫu nếu mới khởi tạo
  const initDefaultData = async () => {
    const staffCol = collection(db, 'artifacts', appId, 'public', 'data', 'staff');
    await addDoc(staffCol, { name: 'Thợ Hưng', phone: '0901234567', cutCommission: 25, chemCommission: 15, createdAt: new Date().toISOString() });
    await addDoc(staffCol, { name: 'Thợ Tuấn', phone: '0908888999', cutCommission: 20, chemCommission: 10, createdAt: new Date().toISOString() });

    const servCol = collection(db, 'artifacts', appId, 'public', 'data', 'services');
    await addDoc(servCol, { name: 'Cắt Tóc Nam/Nữ', price: 150000, category: 'cut' });
    await addDoc(servCol, { name: 'Uốn / Nhuộm Hàn Quốc', price: 600000, category: 'chem' });
    await addDoc(servCol, { name: 'Tẩy Tóc Bạch Kim', price: 800000, category: 'chem' });
    await addDoc(servCol, { name: 'Gội Dưỡng Sinh 1 Buổi', price: 80000, category: 'cut' });
  };

  // Tính toán Lợi Nhận & Bảng Lương Thợ
  const { summary, staffPayroll } = useMemo(() => {
    let totalThu = 0;
    let totalChi = 0;

    const map = {};
    staffList.forEach(s => {
      map[s.id] = {
        id: s.id,
        name: s.name,
        cutRate: s.cutCommission || 20,
        chemRate: s.chemCommission || 10,
        cutRevenue: 0,
        chemRevenue: 0,
        totalRevenue: 0,
        cutCommission: 0,
        chemCommission: 0,
        totalCommission: 0,
        totalAdvanced: 0, // Đã ứng
        totalPaidSalary: 0 // Đã thanh toán chốt
      };
    });

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'thu') {
        totalThu += amt;

        if (t.staffId && map[t.staffId]) {
          const st = map[t.staffId];
          st.totalRevenue += amt;
          const comm = Number(t.commissionAmount) || 0;

          if (t.serviceCategory === 'cut') {
            st.cutRevenue += amt;
            st.cutCommission += comm;
          } else {
            st.chemRevenue += amt;
            st.chemCommission += comm;
          }
          st.totalCommission += comm;
        }
      } else {
        totalChi += amt;
        // Nếu là chi ứng lương / trả lương
        if (t.staffId && map[t.staffId]) {
          if (t.isAdvance) {
            map[t.staffId].totalAdvanced += amt;
          } else if (t.isSalaryPay) {
            map[t.staffId].totalPaidSalary += amt;
          }
        }
      }
    });

    return {
      summary: { totalThu, totalChi, netProfit: totalThu - totalChi },
      staffPayroll: Object.values(map)
    };
  }, [transactions, staffList]);

  // Handlers
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!user || !txForm.amount) return;

    const amt = Number(txForm.amount);
    const selectedStaff = staffList.find(s => s.id === txForm.staffId);

    let commRate = 0;
    if (selectedStaff) {
      commRate = txForm.serviceCategory === 'cut' 
        ? (selectedStaff.cutCommission || 20) 
        : (selectedStaff.chemCommission || 10);
    }
    const commAmt = txForm.type === 'thu' ? (amt * commRate) / 100 : 0;

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
      type: txForm.type,
      serviceName: txForm.serviceName || (txForm.type === 'thu' ? 'Dịch vụ Salon' : 'Chi phí salon'),
      serviceCategory: txForm.serviceCategory,
      amount: amt,
      staffId: txForm.staffId || '',
      staffName: selectedStaff ? selectedStaff.name : '',
      commissionPercent: commRate,
      commissionAmount: commAmt,
      note: txForm.note,
      date: txForm.date,
      createdAt: new Date().toISOString()
    });

    setTxForm({
      type: 'thu',
      serviceId: '',
      serviceName: '',
      serviceCategory: 'cut',
      amount: '',
      staffId: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsTxModalOpen(false);
  };

  const handleAddShampooCard = async (e) => {
    e.preventDefault();
    if (!user || !cardForm.customerName || !cardForm.price) return;

    const price = Number(cardForm.price);
    const total = Number(cardForm.totalSessions);
    const selectedStaff = staffList.find(s => s.id === cardForm.staffId);

    // 1. Lưu thẻ gội
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shampoo_cards'), {
      customerName: cardForm.customerName,
      customerPhone: cardForm.customerPhone,
      totalSessions: total,
      usedSessions: 0,
      remainingSessions: total,
      price: price,
      staffId: cardForm.staffId || '',
      staffName: selectedStaff ? selectedStaff.name : '',
      createdAt: new Date().toISOString()
    });

    // 2. Tự động ghi nhận phiếu THU
    const commRate = selectedStaff ? (selectedStaff.cutCommission || 20) : 0;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
      type: 'thu',
      serviceName: `Bán Thẻ Gội (${total} buổi)`,
      serviceCategory: 'cut',
      amount: price,
      staffId: cardForm.staffId || '',
      staffName: selectedStaff ? selectedStaff.name : '',
      commissionPercent: commRate,
      commissionAmount: (price * commRate) / 100,
      note: `Khách ${cardForm.customerName} - ${cardForm.customerPhone}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    setCardForm({ customerName: '', customerPhone: '', totalSessions: '10', price: '500000', staffId: '', note: '' });
    setIsCardModalOpen(false);
  };

  const handleUseCardSession = async (card, staffId) => {
    if (!card || card.remainingSessions <= 0) return;
    const selectedStaff = staffList.find(s => s.id === staffId);

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shampoo_cards', card.id);
    await updateDoc(docRef, {
      usedSessions: card.usedSessions + 1,
      remainingSessions: card.remainingSessions - 1
    });

    setSelectedCardForUse(null);
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (!user || !advanceForm.staffId || !advanceForm.amount) return;

    const amt = Number(advanceForm.amount);
    const selectedStaff = staffList.find(s => s.id === advanceForm.staffId);
    const isAdv = advanceForm.type === 'advance';

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
      type: 'chi',
      serviceName: isAdv ? `Ứng Lương (${selectedStaff?.name})` : `Thanh Toán Lương (${selectedStaff?.name})`,
      amount: amt,
      staffId: advanceForm.staffId,
      staffName: selectedStaff ? selectedStaff.name : '',
      isAdvance: isAdv,
      isSalaryPay: !isAdv,
      note: advanceForm.note,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    setAdvanceForm({ staffId: '', amount: '', type: 'advance', note: 'Tạm ứng lương' });
    setIsAdvanceModalOpen(false);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!user || !staffForm.name) return;

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), {
      name: staffForm.name,
      phone: staffForm.phone,
      cutCommission: Number(staffForm.cutCommission || 20),
      chemCommission: Number(staffForm.chemCommission || 10),
      createdAt: new Date().toISOString()
    });

    setStaffForm({ name: '', phone: '', cutCommission: '20', chemCommission: '10' });
    setIsStaffModalOpen(false);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!user || !serviceForm.name || !serviceForm.price) return;

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'services'), {
      name: serviceForm.name,
      price: Number(serviceForm.price),
      category: serviceForm.category
    });

    setServiceForm({ name: '', price: '', category: 'cut' });
    setIsServiceModalOpen(false);
  };

  const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 md:pb-6">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider text-amber-400 leading-none">BLACK HAIR</h1>
              <p className="text-[11px] text-slate-400 mt-1">Quản Lý Salon Tóc Chuyên Nghiệp</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTxForm(f => ({ ...f, type: 'thu' }));
                setIsTxModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thu Tiền</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-5xl mx-auto p-4 space-y-6">
        
        {/* TAB NAVIGATION (Desktop & Tablet) */}
        <div className="hidden md:flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'transactions' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" /> Thu Chi & Hóa Đơn
          </button>
          <button
            onClick={() => setActiveTab('shampoo_cards')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'shampoo_cards' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Thẻ Gội Khách ({shampooCards.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'staff' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Thợ & Ứng Lương
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'services' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" /> Danh Mục Dịch Vụ
          </button>
        </div>

        {/* -------------------- TAB 1: THU CHI & HÓA ĐƠN -------------------- */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Cards Doanh Thu Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">TỔNG THU</div>
                <div className="text-base sm:text-xl font-black text-emerald-400">{formatVND(summary.totalThu)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">TỔNG CHI</div>
                <div className="text-base sm:text-xl font-black text-rose-400">{formatVND(summary.totalChi)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">LỢI NHUẬN</div>
                <div className={`text-base sm:text-xl font-black ${summary.netProfit >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {formatVND(summary.netProfit)}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTxForm(f => ({ ...f, type: 'thu' }));
                  setIsTxModalOpen(true);
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> + THU TIỀN TÓC
              </button>
              <button
                onClick={() => {
                  setTxForm(f => ({ ...f, type: 'chi', serviceName: 'Chi phí salon' }));
                  setIsTxModalOpen(true);
                }}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-500/10 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> - CHI TIỀN SALON
              </button>
            </div>

            {/* List Transactions */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Lịch Sử Giao Dịch</h3>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${tx.type === 'thu' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {tx.type === 'thu' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{tx.serviceName}</div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{tx.date}</span>
                        {tx.staffName && <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">Thợ: {tx.staffName}</span>}
                        {tx.commissionAmount > 0 && <span className="text-purple-400 text-[10px]">HH: {formatVND(tx.commissionAmount)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-black text-sm ${tx.type === 'thu' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'thu' ? '+' : '-'}{formatVND(tx.amount)}
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm("Xóa giao dịch này?")) {
                          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', tx.id));
                        }
                      }}
                      className="text-slate-600 hover:text-rose-400 p-1 mt-1 inline-block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  Chưa có giao dịch nào phát sinh.
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- TAB 2: THẺ GỘI KHÁCH -------------------- */}
        {activeTab === 'shampoo_cards' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh Sách Thẻ Gội Dưỡng Sinh</h3>
              <button
                onClick={() => setIsCardModalOpen(true)}
                className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Bán Thẻ Gội Mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shampooCards.map((card) => {
                const isOut = card.remainingSessions <= 0;
                return (
                  <div key={card.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative flex flex-col justify-between space-y-4">
                    <button
                      onClick={async () => {
                        if (window.confirm("Xóa thẻ gội này?")) {
                          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shampoo_cards', card.id));
                        }
                      }}
                      className="absolute top-4 right-4 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-100 text-base">{card.customerName}</h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" /> {card.customerPhone || 'Chưa nhập SĐT'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-400">Tiến độ buổi gội:</span>
                          <span className="font-bold text-blue-400">Đã dùng {card.usedSessions}/{card.totalSessions} buổi</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${(card.usedSessions / card.totalSessions) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isOut}
                      onClick={() => setSelectedCardForUse(card)}
                      className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 ${
                        isOut ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      <Zap className="w-4 h-4" /> {isOut ? 'HẾT BUỔI GỘI' : 'TRỪ 1 BUỔI GỘI'}
                    </button>
                  </div>
                );
              })}

              {shampooCards.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  Chưa có thẻ gội nào. Bấm nút "Bán Thẻ Gội Mới" để thêm.
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- TAB 3: THỢ & ỨNG LƯƠNG -------------------- */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bảng Tính Lương & Hoa Hồng Thợ</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Thêm Thợ
                </button>
                <button
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
                >
                  <Wallet className="w-4 h-4" /> Ứng / Trả Lương
                </button>
              </div>
            </div>

            {/* Payroll Table / Card view */}
            <div className="grid grid-cols-1 gap-4">
              {staffPayroll.map((st) => {
                const remainPay = st.totalCommission - st.totalAdvanced - st.totalPaidSalary;
                return (
                  <div key={st.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-100 text-base">{st.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Tỉ lệ %: <span className="text-amber-400 font-bold">{st.cutRate}% Cắt</span> | <span className="text-purple-400 font-bold">{st.chemRate}% Hóa Chất</span>
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm("Xóa thợ này khỏi hệ thống?")) {
                            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', st.id));
                          }
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block mb-1">Doanh Số Cắt:</span>
                        <strong className="text-slate-200 text-sm font-bold">{formatVND(st.cutRevenue)}</strong>
                        <span className="block text-[10px] text-amber-400 mt-0.5">HH: {formatVND(st.cutCommission)}</span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block mb-1">Doanh Số Hóa Chất:</span>
                        <strong className="text-slate-200 text-sm font-bold">{formatVND(st.chemRevenue)}</strong>
                        <span className="block text-[10px] text-purple-400 mt-0.5">HH: {formatVND(st.chemCommission)}</span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block mb-1">Đã Tạm Ứng:</span>
                        <strong className="text-rose-400 text-sm font-bold">{formatVND(st.totalAdvanced)}</strong>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-slate-400 block mb-1">Lương Còn Nhận:</span>
                        <strong className={`text-sm font-black ${remainPay >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatVND(remainPay)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}

              {staffPayroll.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  Chưa có thông tin nhân viên thợ.
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- TAB 4: DANH MỤC DỊCH VỤ -------------------- */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh Mục Dịch Vụ Salon</h3>
              <button
                onClick={() => setIsServiceModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Thêm Dịch Vụ Mới
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-100 text-sm">{s.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <span className="font-bold text-amber-400">{formatVND(s.price)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.category === 'cut' ? 'bg-amber-500/10 text-amber-300' : 'bg-purple-500/10 text-purple-300'}`}>
                        {s.category === 'cut' ? 'Dịch vụ Cắt' : 'Dịch vụ Hóa chất'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (window.confirm("Xóa dịch vụ này?")) {
                        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'services', s.id));
                      }
                    }}
                    className="text-slate-600 hover:text-rose-400 p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 z-40 grid grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
            activeTab === 'transactions' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-1">Thu Chi</span>
        </button>

        <button
          onClick={() => setActiveTab('shampoo_cards')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
            activeTab === 'shampoo_cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-1">Thẻ Gội</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
            activeTab === 'staff' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">Thợ & Lương</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
            activeTab === 'services' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-[10px] mt-1">Dịch Vụ</span>
        </button>
      </nav>

      {/* ==================== MODALS ==================== */}

      {/* MODAL THU CHI */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsTxModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-100 mb-4">Ghi Nhận Thu / Chi Salon</h3>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Dịch vụ mẫu nhanh */}
              {txForm.type === 'thu' && services.length > 0 && (
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1.5">Chọn nhanh dịch vụ sẵn có:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {services.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setTxForm(f => ({
                            ...f,
                            serviceName: s.name,
                            amount: s.price.toString(),
                            serviceCategory: s.category || 'cut'
                          }));
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-lg text-slate-200"
                      >
                        {s.name} ({formatVND(s.price)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Tên Dịch Vụ / Nội Dung *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nhuộm tóc nâu tây, mua dầu gội..."
                  value={txForm.serviceName}
                  onChange={(e) => setTxForm({ ...txForm, serviceName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Số Tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-lg font-black text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {txForm.type === 'thu' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Phân Loại Dịch Vụ Tính Hoa Hồng</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTxForm(f => ({ ...f, serviceCategory: 'cut' }))}
                        className={`py-2 rounded-xl text-xs font-bold border ${txForm.serviceCategory === 'cut' ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                      >
                        Cắt Sấy (% Cắt)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxForm(f => ({ ...f, serviceCategory: 'chem' }))}
                        className={`py-2 rounded-xl text-xs font-bold border ${txForm.serviceCategory === 'chem' ? 'bg-purple-500/20 text-purple-300 border-purple-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                      >
                        Hóa Chất (% HC)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Thợ Thực Hiện</label>
                    <select
                      value={txForm.staffId}
                      onChange={(e) => setTxForm({ ...txForm, staffId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Chọn Thợ Làm --</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                LƯU GIAO DỊCH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BÁN THẺ GỘI */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Bán Thẻ Gội Liệu Trình
            </h3>

            <form onSubmit={handleAddShampooCard} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Tên Khách Hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chị Lan"
                  value={cardForm.customerName}
                  onChange={(e) => setCardForm({ ...cardForm, customerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  placeholder="09..."
                  value={cardForm.customerPhone}
                  onChange={(e) => setCardForm({ ...cardForm, customerPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Số Buổi Gội *</label>
                  <input
                    type="number"
                    required
                    value={cardForm.totalSessions}
                    onChange={(e) => setCardForm({ ...cardForm, totalSessions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Giá Bán Thẻ *</label>
                  <input
                    type="number"
                    required
                    value={cardForm.price}
                    onChange={(e) => setCardForm({ ...cardForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Thợ Tư Vấn / Bán Thẻ</label>
                <select
                  value={cardForm.staffId}
                  onChange={(e) => setCardForm({ ...cardForm, staffId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn Thợ --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20"
              >
                TẠO THẺ & TÍNH THU
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRỪ 1 BUỔI GỘI */}
      {selectedCardForUse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xs p-5 relative shadow-2xl">
            <button onClick={() => setSelectedCardForUse(null)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-100 mb-1">Xác Nhận Trừ Buổi Gội</h3>
            <p className="text-xs text-amber-400 font-bold mb-4">{selectedCardForUse.customerName}</p>

            <div className="mb-4">
              <label className="block text-xs text-slate-400 font-semibold mb-1">Chọn Thợ Gội Hôm Nay:</label>
              <select
                id="staffForSession"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('staffForSession');
                handleUseCardSession(selectedCardForUse, el ? el.value : '');
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
            >
              XÁC NHẬN TRỪ 1 BUỔI
            </button>
          </div>
        </div>
      )}

      {/* MODAL ỨNG LƯƠNG / TRẢ LƯƠNG */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsAdvanceModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-100 mb-4">Tạm Ứng / Chi Trả Lương Thợ</h3>

            <form onSubmit={handleAddAdvance} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdvanceForm(f => ({ ...f, type: 'advance', note: 'Tạm ứng lương' }))}
                  className={`py-2 rounded-lg font-bold text-xs ${advanceForm.type === 'advance' ? 'bg-purple-500 text-white' : 'text-slate-400'}`}
                >
                  TẠM ỨNG LƯƠNG
                </button>
                <button
                  type="button"
                  onClick={() => setAdvanceForm(f => ({ ...f, type: 'pay', note: 'Thanh toán chốt lương' }))}
                  className={`py-2 rounded-lg font-bold text-xs ${advanceForm.type === 'pay' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  THANH TOÁN LƯƠNG
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Chọn Nhân Viên *</label>
                <select
                  required
                  value={advanceForm.staffId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Chọn Thợ --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Số Tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-lg font-black text-purple-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Ghi Chú</label>
                <input
                  type="text"
                  value={advanceForm.note}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/20"
              >
                XÁC NHẬN PHIẾU CHI LƯƠNG
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM THỢ */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsStaffModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-100 mb-4">Thêm Thợ Mới</h3>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Tên Thợ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thợ Nam"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">% Hoa Hồng Cắt Sấy</label>
                  <input
                    type="number"
                    value={staffForm.cutCommission}
                    onChange={(e) => setStaffForm({ ...staffForm, cutCommission: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">% Hoa Hồng Hóa Chất</label>
                  <input
                    type="number"
                    value={staffForm.chemCommission}
                    onChange={(e) => setStaffForm({ ...staffForm, chemCommission: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-purple-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                LƯU THỢ MỚI
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM DỊCH VỤ */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsServiceModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-100 mb-4">Thêm Dịch Vụ VÀO Danh Mục</h3>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Tên Dịch Vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Uốn xoăn sóng"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Giá Tiền Mặc Định (VNĐ) *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Loại Dịch Vụ (Tính Hoa Hồng)</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="cut">Cắt Sấy (% Cắt)</option>
                  <option value="chem">Hóa Chất - Uốn/Nhuộm/Tẩy (% HC)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                LƯU DỊCH VỤ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}