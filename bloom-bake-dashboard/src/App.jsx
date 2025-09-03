import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc, query, addDoc, deleteDoc, writeBatch, getDoc, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
//import './App.css';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCBOhxz_5ZljPA-rKQMfjoN8tMgatiHjrE",
  authDomain: "bloombakedashboard.firebaseapp.com",
  projectId: "bloombakedashboard",
  storageBucket: "bloombakedashboard.firebasestorage.app",
  messagingSenderId: "435724663322",
  appId: "1:435724663322:web:46c961b9a3ea6de927efa3",
  measurementId: "G-W1TR2YY1F1"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// --- Permissions Context (ADD THIS ENTIRE BLOCK) ---
const PermissionsContext = React.createContext();

export const usePermissions = () => React.useContext(PermissionsContext);

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRolesRef = doc(db, 'user_roles', user.uid);
        const docSnap = await getDoc(userRolesRef);
        if (docSnap.exists()) {
          setPermissions(docSnap.data().permissions);
        } else {
          // Default to no access if no permissions are set.
          setPermissions({});
        }
      } else {
        setPermissions(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <PermissionsContext.Provider value={{ permissions, loading }}>
      {!loading && children}
    </PermissionsContext.Provider>
  );
};

// --- Helper Functions ---
const getLocalDateString = (date) => {
    if (!date || isNaN(date)) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Helper Components ---
const Icon = ({ name, className }) => {
    const icons = {
        'cake': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21.09V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13.09M2 21h20"/><path d="M12 21c-1.66 0-3-1.49-3-3.33V12h6v5.67c0 1.84-1.34 3.33-3 3.33Z"/><path d="M12 6.33c-1.66 0-3-1.49-3-3.33S10.34 0 12 0s3 1.49 3 3.33-1.34 3.33-3 3.33Z"/><path d="M7 12a5.002 5.002 0 0 0 5 5 5.002 5.002 0 0 0 5-5H7Z"/></svg>,
        'rupee': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m19 13-1-1"/><path d="M6 13h8"/><path d="M6 18h12"/><path d="M12 21V8"/></svg>,
        'search': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>,
        'menu': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
        'upload': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
        'close': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
        'edit': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
        'users': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        'chevron-down': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
        'delete': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
        'download': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
        'google': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.226-11.283-7.662l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.863 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>,
        'map': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
        'phone': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
        'whatsapp': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
        'eye': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
        'eye-off': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
    };
    return <span className={className}>{icons[name]}</span>;
};

const CustomerChip = ({ isExisting }) => {
    if (isExisting === undefined) return null; // Don't render if status is unknown
    const chipClasses = isExisting
        ? "bg-blue-100 text-blue-800"  // 'E' for Existing
        : "bg-green-100 text-green-800"; // 'N' for New
    const chipText = isExisting ? 'E' : 'N';
    return (
        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${chipClasses}`}>
            {chipText}
        </span>
    );
};

const DuplicateChip = () => (
    <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
        D
    </span>
);


// --- Navigation & Header ---
const Header = ({ onMenuClick, setCurrentPage }) => (
    <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4 space-x-4">
                <button onClick={onMenuClick} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                    <Icon name="menu" className="h-6 w-6" />
                </button>
                <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-2">
                    <img src="/3D logo.png" alt="Bloom Bake Logo" className="h-10 w-10 object-contain" />
                    <h1 className="text-2xl font-bold text-[#be0b73]">BLOOM BAKE</h1>
                </button>
            </div>
        </div>
    </header>
);

// ... inside your App.js or wherever Sidebar is ...

// --- NEW, UPDATED SIDEBAR COMPONENT (REPLACE THE OLD ONE WITH THIS) ---

const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, pendingRequestCount, pendingReviewCount }) => {
  const { permissions } = usePermissions();
  // State to manage which accordion menu is open. 'order' is open by default.
  const [openMenu, setOpenMenu] = useState('order');

  const handleMenuToggle = (menuName) => {
    // If the clicked menu is already open, close it. Otherwise, open it.
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  if (!permissions) {
    return null; // Or a loading spinner while permissions are being fetched
  }

  const NavLink = ({ pageName, children, hasBadge, badgeCount }) => (
    <li>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); setCurrentPage(pageName); setIsOpen(false); }}
        className={`flex justify-between items-center w-full px-4 py-2 rounded-lg ${currentPage === pageName ? 'bg-[#fce6f4] text-[#a10a62] font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <span>{children}</span>
        {hasBadge && badgeCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </a>
    </li>
  );

  const AccordionMenu = ({ menuName, title, children }) => (
    <li>
      <button
        onClick={() => handleMenuToggle(menuName)}
        className="w-full flex justify-between items-center text-left px-4 py-2 mt-2 rounded-lg text-gray-800 font-semibold hover:bg-gray-100 focus:outline-none"
      >
        <span>{title}</span>
        <Icon name="chevron-down" className={`transform transition-transform duration-200 ${openMenu === menuName ? 'rotate-180' : ''}`} />
      </button>
      {openMenu === menuName && (
        <ul className="pl-4 mt-1 space-y-1">
          {children}
        </ul>
      )}
    </li>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`fixed top-0 left-0 h-full bg-white w-64 shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b" style={{ minHeight: '68px' }}>
          <h2 className="text-xl font-bold text-gray-800">Menu</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {/* 1. Dashboard (Standalone) */}
            {permissions?.dashboard?.view && <NavLink pageName="dashboard">Dashboard</NavLink>}

            {/* 2. Order Section */}
            {(permissions?.createOrder?.view || permissions?.todaysOrder?.view || permissions?.orderManagement?.view) && (
              <AccordionMenu menuName="order" title="Order">
                {permissions?.createOrder?.view && <NavLink pageName="createOrder" hasBadge={true} badgeCount={pendingRequestCount}>New Order</NavLink>}
                {permissions?.todaysOrder?.view && <NavLink pageName="todaysOrder">Today's Order</NavLink>}
                {permissions?.orderManagement?.view && <NavLink pageName="orderManagement">Order Management</NavLink>}
              </AccordionMenu>
            )}

            {/* 3. Product & Marketing Section */}
            {(permissions?.cakeDesigns?.view || permissions?.review?.view || permissions?.listProduct?.view) && (
              <AccordionMenu menuName="marketing" title="Product & Marketing">
                {permissions?.cakeDesigns?.view && <NavLink pageName="cakeDesigns">Cake Designs</NavLink>}
                {permissions?.review?.view && <NavLink pageName="review" hasBadge={true} badgeCount={pendingReviewCount}>Review</NavLink>}
                {permissions?.listProduct?.view && <NavLink pageName="listProduct">List Of product</NavLink>}
              </AccordionMenu>
            )}
            
            {/* 4. Expense Section */}
            {permissions?.expense?.view && (
                <AccordionMenu menuName="expense" title="Expense">
                    <NavLink pageName="expense">Expense Management</NavLink>
                </AccordionMenu>
            )}

            {/* 5. Analysis Section */}
            {(permissions?.profitSummary?.view || permissions?.productSales?.view) && (
              <AccordionMenu menuName="analysis" title="Analysis">
                {permissions?.profitSummary?.view && <NavLink pageName="profitSummary">Profit Summary</NavLink>}
                {permissions?.productSales?.view && <NavLink pageName="productSales">Product Sales</NavLink>}
              </AccordionMenu>
            )}

            {/* 6. User Section */}
            {permissions?.userManagement?.view && (
                <AccordionMenu menuName="user" title="User">
                    <NavLink pageName="userManagement">User Management</NavLink>
                </AccordionMenu>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

// --- Page Components ---

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const pages = ['dashboard', 'createOrder', 'todaysOrder', 'orderManagement', 'profitSummary', 'productSales', 'expense', 'review', 'listProduct', 'cakeDesigns', 'userManagement'];

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "user_roles"));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    };
    fetchUsers();
  }, []);

  const handleSignOut = async () => {
        try {
        await auth.signOut();
        // The main App component will automatically handle showing the login page.
        } catch (error) {
        console.error("Error signing out: ", error);
        // You could add a notification here if you wanted.
        }
    };

  const handlePermissionChange = async (userId, page, type, value) => {
    const userRef = doc(db, "user_roles", userId);
    const fieldPath = `permissions.${page}.${type}`;
    await updateDoc(userRef, { [fieldPath]: value });

    // Update local state to reflect change immediately
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, permissions: { ...user.permissions, [page]: { ...user.permissions[page], [type]: value } } }
        : user
    ));
  };

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <button
            onClick={handleSignOut}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
            Sign Out
            </button>
        </div>
      <div className="bg-white p-4 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-gray-100">
              <th className="p-3">Email</th>
              {pages.map(page => <th key={page} className="p-3 capitalize text-center">{page.replace(/([A-Z])/g, ' $1')}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b">
                <td className="p-3 font-medium">{user.email}</td>
                {pages.map(page => (
                  <td key={page} className="p-3 text-center">
                    <div className="flex justify-center gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.permissions?.[page]?.view || false}
                          onChange={(e) => handlePermissionChange(user.id, page, 'view', e.target.checked)}
                        /> V
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.permissions?.[page]?.edit || false}
                          onChange={(e) => handlePermissionChange(user.id, page, 'edit', e.target.checked)}
                        /> E
                      </label>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

const FlippableStatCard = ({ title, amount, count }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const flipTimeout = useRef(null);

    const handleFlip = () => {
        if (!isFlipped) {
            setIsFlipped(true);
            // Clear any existing timeout to prevent conflicts
            if (flipTimeout.current) {
                clearTimeout(flipTimeout.current);
            }
            // Set a timeout to flip back after 3 seconds
            flipTimeout.current = setTimeout(() => {
                setIsFlipped(false);
            }, 3000);
        }
    };

    // Cleanup timeout on component unmount
    useEffect(() => {
        return () => {
            if (flipTimeout.current) {
                clearTimeout(flipTimeout.current);
            }
        };
    }, []);

    return (
        <div className="flip-card h-full" onClick={handleFlip}>
            <div className={`flip-card-inner rounded-lg ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Front Face (Amount) */}
                <div className="flip-card-front bg-gray-50 p-4 rounded-lg">
                    <p className="text-md font-bold text-gray-800">{title}</p>
                    <p className="text-2xl font-semibold text-gray-700 mt-2">₹{amount.toLocaleString('en-IN')}</p>
                </div>
                {/* Back Face (Count) */}
                <div className="flip-card-back bg-gray-50 p-4 rounded-lg">
                    <p className="text-md font-bold text-gray-800">Order Count</p>
                    <p className="text-2xl font-semibold text-gray-700 mt-2">{count}</p>
                </div>
            </div>
        </div>
    );
};


const DashboardPage = ({ orders, expenses }) => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [graphRange, setGraphRange] = useState({ start: '', end: '' });

    const analytics = useMemo(() => {
        const now = new Date();
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');
        const totalCustomers = new Set(orders.map(o => o.phoneNumber)).size;

        // Total calculations
        const totalDeliveredOrdersCount = deliveredOrders.length;
        const totalSales = deliveredOrders.reduce((sum, order) => sum + Number(order.price || 0), 0);
        const totalDelivery = deliveredOrders.reduce((sum, order) => sum + (order.deliveryAmount || 0), 0);
        const totalDeliveryOrdersCount = deliveredOrders.filter(o => (o.deliveryAmount || 0) > 0).length;
        const totalExpense = expenses.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
        const totalProfit = (totalSales + totalDelivery) - totalExpense;

        // This Month's calculations
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthOrders = orders.filter(order => {
            if (!order.orderDate) return false;
            // This prevents issues where browsers treat 'YYYY-MM-DD' as UTC time
            const orderDate = new Date(order.orderDate.replace(/-/g, '/'));
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        });
        
        const thisMonthDeliveredOrders = thisMonthOrders.filter(o => o.status === 'Delivered');
        const thisMonthSalesAmount = thisMonthDeliveredOrders.reduce((sum, order) => sum + Number(order.price || 0), 0);
        const thisMonthSalesCount = thisMonthDeliveredOrders.length;

        // Upcoming calculations
        const todayStr = getLocalDateString(now);
        const upcomingOrders = orders.filter(o => o.orderDate >= todayStr && (o.status === 'Accepted' || o.status === 'Baking'));
        const upcomingAmount = upcomingOrders.reduce((sum, order) => sum + Number(order.price || 0), 0);
        const upcomingCount = upcomingOrders.length;

        // Last 12 Months data for summaries
        const last12MonthsData = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last12MonthsData.push({ monthIndex: d.getMonth(), year: d.getFullYear() });
        }

        // Last 3 Months calculations
        const lastThreeMonthsData = last12MonthsData.slice(0, 3);
        const lastThreeMonthsDeliveredOrders = deliveredOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return lastThreeMonthsData.some(m => m.monthIndex === orderDate.getMonth() && m.year === orderDate.getFullYear());
        });
        const lastThreeMonthsDeliveredOrdersCount = lastThreeMonthsDeliveredOrders.length;
        const lastThreeMonthsSales = lastThreeMonthsDeliveredOrders.reduce((sum, order) => sum + Number(order.price || 0), 0);
        const lastThreeMonthsDelivery = lastThreeMonthsDeliveredOrders.reduce((sum, order) => sum + (order.deliveryAmount || 0), 0);
        const lastThreeMonthsDeliveryOrdersCount = lastThreeMonthsDeliveredOrders.filter(o => (o.deliveryAmount || 0) > 0).length;
        const lastThreeMonthsExpense = expenses.filter(expense => {
            const expenseDate = new Date(expense.purchaseDate);
            return lastThreeMonthsData.some(m => m.monthIndex === expenseDate.getMonth() && m.year === expenseDate.getFullYear());
        }).reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);
        const lastThreeMonthsProfit = (lastThreeMonthsSales + lastThreeMonthsDelivery) - lastThreeMonthsExpense;
        
        // --- Graph Data Calculation ---
        const getQuarter = (date) => Math.floor(date.getMonth() / 3) + 1;
        const quarterlySales = {};
        const quarterlyExpenses = {};
        const quarterlyOrderCounts = {}; // New object for order counts

        deliveredOrders.forEach(order => {
            if (order.orderDate) {
                const orderDate = new Date(order.orderDate);
                const year = orderDate.getFullYear();
                const quarter = getQuarter(orderDate);
                const key = `${year}-Q${quarter}`;
                
                if (!quarterlySales[key]) quarterlySales[key] = 0;
                quarterlySales[key] += order.price || 0;

                if (!quarterlyOrderCounts[key]) quarterlyOrderCounts[key] = 0; // New logic
                quarterlyOrderCounts[key]++; // New logic
            }
        });

        expenses.forEach(expense => {
            if (expense.purchaseDate) {
                const expenseDate = new Date(expense.purchaseDate);
                const year = expenseDate.getFullYear();
                const quarter = getQuarter(expenseDate);
                const key = `${year}-Q${quarter}`;
                if (!quarterlyExpenses[key]) quarterlyExpenses[key] = 0;
                quarterlyExpenses[key] += expense.totalAmount || 0;
            }
        });

        let graphDisplayData = [];
        let start, end;

        if (graphRange.start && graphRange.end && new Date(graphRange.start) <= new Date(graphRange.end)) {
            start = new Date(graphRange.start + '-01T00:00:00');
            end = new Date(graphRange.end + '-01T00:00:00');
        } else {
            end = new Date();
            start = new Date();
            start.setMonth(start.getMonth() - 12); // 4 previous quarters + current quarter = 5 quarters total
        }
        
        start.setDate(1);
        end.setDate(1);

        let current = new Date(start);
        while (current <= end) {
            const year = current.getFullYear();
            const quarter = getQuarter(current);
            const key = `${year}-Q${quarter}`;
            
            if (!graphDisplayData.some(d => d.key === key)) {
                graphDisplayData.push({ 
                    name: `Q${quarter} '${year.toString().slice(-2)}`, 
                    Sales: quarterlySales[key] || 0,
                    Expense: quarterlyExpenses[key] || 0,
                    OrderCount: quarterlyOrderCounts[key] || 0, // New property
                    key
                });
            }
            current.setMonth(current.getMonth() + 3);
        }

        return { 
            totalCustomers, thisMonthSalesAmount, upcomingAmount, thisMonthSalesCount, upcomingCount,
            totalSales, totalDelivery, totalExpense, totalProfit, totalDeliveredOrdersCount, totalDeliveryOrdersCount,
            lastThreeMonthsSales, lastThreeMonthsDelivery, lastThreeMonthsExpense, lastThreeMonthsProfit, lastThreeMonthsDeliveredOrdersCount, lastThreeMonthsDeliveryOrdersCount,
            graphDisplayData 
        };
    }, [orders, expenses, graphRange]);
    
    const xAxisInterval = Math.max(0, Math.floor(analytics.graphDisplayData.length / 12));
    
    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            {isFilterModalOpen && <SalesGraphFilterModal onClose={() => setIsFilterModalOpen(false)} onApply={setGraphRange} initialRange={graphRange} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Icon name="users" className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Customers</p>
                        <p className="text-3xl font-bold text-gray-800">{analytics.totalCustomers}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 relative">
                    <div className="bg-green-100 p-3 rounded-full">
                        <Icon name="rupee" className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">This Month's Sales</p>
                        <p className="text-3xl font-bold text-gray-800">₹{analytics.thisMonthSalesAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white shadow-md rounded-md px-2 py-1 text-xs font-semibold text-gray-700" style={{ transform: 'translateZ(20px)' }}>
                        Order: {analytics.thisMonthSalesCount}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 relative">
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <Icon name="rupee" className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Upcoming</p>
                        <p className="text-3xl font-bold text-gray-800">₹{analytics.upcomingAmount.toLocaleString('en-IN')}</p>
                    </div>
                     <div className="absolute top-4 right-4 bg-white shadow-md rounded-md px-2 py-1 text-xs font-semibold text-gray-700" style={{ transform: 'translateZ(20px)' }}>
                        Order: {analytics.upcomingCount}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Total</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <FlippableStatCard title="Sales" amount={analytics.totalSales} count={analytics.totalDeliveredOrdersCount} />
                    <FlippableStatCard title="Delivery" amount={analytics.totalDelivery} count={analytics.totalDeliveryOrdersCount} />
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-center"><p className="text-md font-bold text-gray-800">Expense</p><p className="text-2xl font-semibold text-gray-700 mt-2">₹{analytics.totalExpense.toLocaleString('en-IN')}</p></div>
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-center"><p className="text-md font-bold text-gray-800">Profit</p><p className="text-2xl font-semibold text-gray-700 mt-2">₹{analytics.totalProfit.toLocaleString('en-IN')}</p></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Last 3 Months Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <FlippableStatCard title="Sales" amount={analytics.lastThreeMonthsSales} count={analytics.lastThreeMonthsDeliveredOrdersCount} />
                    <FlippableStatCard title="Delivery" amount={analytics.lastThreeMonthsDelivery} count={analytics.lastThreeMonthsDeliveryOrdersCount} />
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-center"><p className="text-md font-bold text-gray-800">Expense</p><p className="text-2xl font-semibold text-gray-700 mt-2">₹{analytics.lastThreeMonthsExpense.toLocaleString('en-IN')}</p></div>
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-center"><p className="text-md font-bold text-gray-800">Profit</p><p className="text-2xl font-semibold text-gray-700 mt-2">₹{analytics.lastThreeMonthsProfit.toLocaleString('en-IN')}</p></div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales Graph</h3>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <button onClick={() => setIsFilterModalOpen(true)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition">Filter</button>
                    <button onClick={() => setGraphRange({ start: '', end: '' })} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Reset</button>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={analytics.graphDisplayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/><stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" interval={xAxisInterval} />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]} />
                            <Legend />
                            <Area type="monotone" dataKey="Sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
                            <Area type="monotone" dataKey="Expense" stroke="#82ca9d" fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* New Order Graph Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Graph</h3>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <button onClick={() => setIsFilterModalOpen(true)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition">Filter</button>
                    <button onClick={() => setGraphRange({ start: '', end: '' })} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Reset</button>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={analytics.graphDisplayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorOrderCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/><stop offset="95%" stopColor="#ffc658" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" interval={xAxisInterval} />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [value, name]} />
                            <Legend />
                            <Area type="monotone" dataKey="OrderCount" name="Order Count" stroke="#ffc658" fillOpacity={1} fill="url(#colorOrderCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </main>
    );
};

const SalesGraphFilterModal = ({ onClose, onApply, initialRange }) => {
    const [range, setRange] = useState(initialRange);

    const handleApply = () => {
        onApply(range);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Select Date Range</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Month</label>
                        <input type="month" value={range.start} onChange={e => setRange(prev => ({...prev, start: e.target.value}))} className="form-input rounded-lg border-gray-300 w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">End Month</label>
                        <input type="month" value={range.end} onChange={e => setRange(prev => ({...prev, end: e.target.value}))} className="form-input rounded-lg border-gray-300 w-full" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button onClick={handleApply} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition">Apply</button>
                </div>
            </div>
        </div>
    );
};

const TodaysOrderPage = ({ orders, setNotification, handleOpenOrderDetails }) => {
    const todaysOrders = useMemo(() => {
        const todayStr = getLocalDateString(new Date());
        return orders.filter(order => order.orderDate === todayStr);
    }, [orders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: newStatus });
            setNotification({ type: 'success', message: 'Status updated successfully!' });
        } catch (error) {
            console.error("Error updating status:", error);
            setNotification({ type: 'error', message: 'Failed to update status.' });
        }
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Today's Orders</h2>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Phone Number</th>
                                    <th className="px-6 py-3">Due (₹)</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaysOrders.length > 0 ? (
                                    todaysOrders.map(order => (
                                        <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => handleOpenOrderDetails(order)}>
                                                <div className="flex items-center">
                                                    <span>{order.clientName}</span>
                                                    <CustomerChip isExisting={order.isExistingCustomer} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenOrderDetails(order)}>
                                                {order.phoneNumber}
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenOrderDetails(order)}>
                                                {(order.price - order.advanceAmount).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className="form-select rounded-lg border-gray-300"
                                                >
                                                    <option>Baking</option>
                                                    <option>Delivered</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">No orders for today.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};

const OrderManagementPage = ({ orders, setNotification, products, flavors, snacks, handleOpenOrderDetails }) => {
    const [filters, setFilters] = useState({ date: '', startDate: '', endDate: '', orderStartDate: '', orderEndDate: '', searchQuery: '', advancedSearchActive: false });
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    const filteredOrders = useMemo(() => {
        const initialFilter = orders.filter(order => {
            if (filters.date) {
                return order.orderDate === filters.date;
            }
            
            if (filters.advancedSearchActive) {
                const deliveryDate = new Date(order.orderDate + 'T00:00:00');
                const createdAt = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null;
                if (createdAt) createdAt.setHours(0,0,0,0);

                const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
                const endDate = filters.endDate ? new Date(filters.endDate + 'T00:00:00') : null;
                const orderStartDate = filters.orderStartDate ? new Date(filters.orderStartDate + 'T00:00:00') : null;
                const orderEndDate = filters.orderEndDate ? new Date(filters.orderEndDate + 'T00:00:00') : null;

                if (startDate && deliveryDate < startDate) return false;
                if (endDate && deliveryDate > endDate) return false;

                if (orderStartDate || orderEndDate) {
                    if (!createdAt) return false;
                    if (orderStartDate && createdAt < orderStartDate) return false;
                    if (orderEndDate && createdAt > orderEndDate) return false;
                }

                if (filters.searchQuery && !order.clientName.toLowerCase().includes(filters.searchQuery.toLowerCase()) && !order.cakeType.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
                
                return true;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingDates = [];
            for (let i = 1; i <= 3; i++) {
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + i);
                upcomingDates.push(getLocalDateString(futureDate));
            }

            return upcomingDates.includes(order.orderDate) && order.status !== 'Delivered' && order.status !== 'Cancelled';
        });

        if (initialFilter.length < 2) {
            return initialFilter;
        }

        const orderSignatures = new Map();
        initialFilter.forEach(order => {
            const signature = `${order.status}-${order.phoneNumber}-${order.orderDate}-${order.cakeType}-${order.flavor || ''}`;
            if (!orderSignatures.has(signature)) {
                orderSignatures.set(signature, 0);
            }
            orderSignatures.set(signature, orderSignatures.get(signature) + 1);
        });

        return initialFilter.map(order => {
            const signature = `${order.status}-${order.phoneNumber}-${order.orderDate}-${order.cakeType}-${order.flavor || ''}`;
            return {
                ...order,
                isDuplicate: orderSignatures.get(signature) > 1,
            };
        });
    }, [orders, filters]);

    const groupedAndSortedOrders = useMemo(() => {
        if (filteredOrders.length === 0) return {};
        const sorted = [...filteredOrders].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        return sorted.reduce((acc, order) => {
            const date = order.orderDate;
            if (!acc[date]) acc[date] = [];
            acc[date].push(order);
            return acc;
        }, {});
    }, [filteredOrders]);

    const handleDateChange = (e) => {
        setFilters({ date: e.target.value, startDate: '', endDate: '', orderStartDate: '', orderEndDate: '', searchQuery: '', advancedSearchActive: false });
    };
    
    const handleReset = () => {
        setFilters({ date: '', startDate: '', endDate: '', orderStartDate: '', orderEndDate: '', searchQuery: '', advancedSearchActive: false });
        const dateInput = document.getElementById('single-date-filter');
        if(dateInput) dateInput.value = '';
    };

    const applyAdvanceFilters = (advanceFilters) => {
        setFilters({ ...advanceFilters, date: '', advancedSearchActive: true });
        const dateInput = document.getElementById('single-date-filter');
        if(dateInput) dateInput.value = '';
        setIsAdvanceModalOpen(false);
    };
    
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                return resolve();
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.body.appendChild(script);
        });
    };

    const exportToPDF = async () => {
        try {
            await loadScript("https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js");
            await loadScript("https://unpkg.com/jspdf-autotable@3.5.23/dist/jspdf.plugin.autotable.js");

            if (!window.jspdf) {
                setNotification({ type: 'error', message: 'PDF library failed to load.' });
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text("BLOOM BAKE - Order Report", 14, 16);
            doc.autoTable({
                head: [['Name', 'Phone', 'Cake/Snacks Type', 'Size/Count', 'Price (₹)', 'Advance (₹)', 'Delivery Date', 'Order Date']],
                body: filteredOrders.map(order => [
                    order.clientName,
                    order.phoneNumber,
                    order.cakeType,
                    order.sizeCount,
                    order.price || 0,
                    order.advanceAmount || 0,
                    new Date(order.orderDate).toLocaleDateString('en-GB'),
                    order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB') : 'N/A'
                ]),
            });
            doc.save(`BLOOM_BAKE_Orders_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            setNotification({ type: 'error', message: 'Could not export to PDF.' });
        }
        setIsExportMenuOpen(false);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Phone Number', 'Cake/Snacks Type', 'Size/Count', 'Price', 'Advance Amount', 'Delivery Date', 'Order Date'];
        const csvRows = [
            headers.join(','),
            ...filteredOrders.map(order => {
                const row = [
                    `"${order.clientName.replace(/"/g, '""')}"`,
                    order.phoneNumber,
                    `"${order.cakeType.replace(/"/g, '""')}"`,
                    `"${order.sizeCount.replace(/"/g, '""')}"`,
                    order.price || 0,
                    order.advanceAmount || 0,
                    new Date(order.orderDate).toLocaleDateString('en-GB'),
                    order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB') : 'N/A'
                ];
                return row.join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `BLOOM_BAKE_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportMenuOpen(false);
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Management</h2>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 items-end">
                        <div className="col-span-2">
                            <label htmlFor="single-date-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Delivery Date</label>
                            <input type="date" id="single-date-filter" onChange={handleDateChange} className="form-input rounded-lg border-gray-300 shadow-sm w-full" />
                        </div>
                        <div>
                            <button onClick={() => setIsAdvanceModalOpen(true)} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition">Advance</button>
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsExportMenuOpen(prev => !prev)} disabled={filteredOrders.length === 0} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-green-300">Export</button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <a href="#" onClick={exportToPDF} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as PDF</a>
                                    <a href="#" onClick={exportToCSV} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as Excel</a>
                                </div>
                            )}
                        </div>
                        <div>
                            <button onClick={handleReset} className="w-full bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition">Reset</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Phone Number</th>
                                    <th scope="col" className="px-6 py-3">Cake/Snacks Type</th>
                                    <th scope="col" className="px-6 py-3">Size/Count</th>
                                    <th scope="col" className="px-6 py-3">Flavor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(groupedAndSortedOrders).length > 0 ? (
                                    Object.entries(groupedAndSortedOrders).map(([date, ordersOnDate]) => (
                                        <React.Fragment key={date}>
                                            <tr className="bg-gray-200 sticky top-0">
                                                <th colSpan="5" className="px-6 py-2 text-left text-sm font-bold text-gray-800">
                                                    {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ({ordersOnDate.length})
                                                </th>
                                            </tr>
                                            {ordersOnDate.map(order => <OrderRow key={order.id} order={order} onRowClick={handleOpenOrderDetails} />)}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-gray-500 py-8">No orders match the current filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            {isAdvanceModalOpen && <AdvanceFilterModal initialFilters={filters} onApply={applyAdvanceFilters} onClose={() => setIsAdvanceModalOpen(false)} />}
        </main>
    );
};

const AdvanceFilterModal = ({ initialFilters, onApply, onClose }) => {
    const [localFilters, setLocalFilters] = useState(initialFilters);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleResetInModal = () => {
        setLocalFilters({
            startDate: '', endDate: '', orderStartDate: '', orderEndDate: '', searchQuery: ''
        });
    };

    const isDeliveryDateRangeValid = (!localFilters.startDate && !localFilters.endDate) || (localFilters.startDate && localFilters.endDate);
    const isOrderDateRangeValid = (!localFilters.orderStartDate && !localFilters.orderEndDate) || (localFilters.orderStartDate && localFilters.orderEndDate);
    const isSearchQueryPresent = localFilters.searchQuery.trim() !== '';
    
    const isAnyFilterActive = (localFilters.startDate && localFilters.endDate) || (localFilters.orderStartDate && localFilters.orderEndDate) || isSearchQueryPresent;
    const isApplyDisabled = !isAnyFilterActive || !isDeliveryDateRangeValid || !isOrderDateRangeValid;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Advance Filters</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><Icon name="close" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date Range</label>
                            <div className="flex space-x-2">
                                <input type="date" name="startDate" value={localFilters.startDate} onChange={handleInputChange} className={`form-input rounded-lg shadow-sm w-full ${!localFilters.startDate && localFilters.endDate ? 'border-red-500' : 'border-gray-300'}`} />
                                <input type="date" name="endDate" value={localFilters.endDate} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 shadow-sm w-full" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Date Range</label>
                            <div className="flex space-x-2">
                                <input type="date" name="orderStartDate" value={localFilters.orderStartDate} onChange={handleInputChange} className={`form-input rounded-lg shadow-sm w-full ${!localFilters.orderStartDate && localFilters.orderEndDate ? 'border-red-500' : 'border-gray-300'}`} />
                                <input type="date" name="orderEndDate" value={localFilters.orderEndDate} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 shadow-sm w-full" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input type="text" name="searchQuery" value={localFilters.searchQuery} onChange={handleInputChange} placeholder="Search Client or Cake..." className="form-input rounded-lg border-gray-300 shadow-sm w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end items-center mt-6 space-x-4">
                        <button onClick={handleResetInModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Reset</button>
                        <button onClick={() => onApply(localFilters)} disabled={isApplyDisabled} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition disabled:bg-[#f2b8d9] disabled:cursor-not-allowed">Apply Filters</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SeeAllRejectedModal = ({ allRequests, onClose, onRowClick }) => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', searchQuery: '' });

    const rejectedRequests = useMemo(() => {
        return allRequests.filter(req => req.status === 'Rejected');
    }, [allRequests]);

    const filteredRejectedRequests = useMemo(() => {
        return rejectedRequests.filter(req => {
            const reqDate = req.updatedAt?.seconds ? new Date(req.updatedAt.seconds * 1000) : null;
            if (reqDate) reqDate.setHours(0,0,0,0);

            const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
            const endDate = filters.endDate ? new Date(filters.endDate + 'T00:00:00') : null;

            if (startDate && (!reqDate || reqDate < startDate)) return false;
            if (endDate && (!reqDate || reqDate > endDate)) return false;

            if (filters.searchQuery &&
                !req.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
                !req.phone.includes(filters.searchQuery)) {
                return false;
            }
            return true;
        });
    }, [rejectedRequests, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleReset = () => {
        setFilters({ startDate: '', endDate: '', searchQuery: '' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">All Rejected Orders</h2>
                    <button onClick={onClose} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                        <Icon name="close" className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-input rounded-lg border-gray-300 w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-input rounded-lg border-gray-300 w-full" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Search</label>
                        <input type="text" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} placeholder="Name or Phone..." className="form-input rounded-lg border-gray-300 w-full" />
                    </div>
                     <button onClick={handleReset} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Reset Filters</button>
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    <WebsiteRequestTable requests={filteredRejectedRequests} onRowClick={onRowClick} />
                </div>
            </div>
        </div>
    );
};

const CreateOrderPage = ({ orders, websiteRequests, websiteSnackRequests, setNotification, handleOpenOrderDetails, products, flavors, snacks }) => {
    const [activeForm, setActiveForm] = useState(null);
    const [openSection, setOpenSection] = useState('null');
    const [requestForDetails, setRequestForDetails] = useState(null);
    const [isSeeAllRejectedModalOpen, setIsSeeAllRejectedModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importSummary, setImportSummary] = useState({ count: 0 });
    const fileInputRef = useRef(null);

    const recentOrders = useMemo(() => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = getLocalDateString(today);
        const yesterdayStr = getLocalDateString(yesterday);

        const filteredRecent = orders.filter(order => {
            if (!order.createdAt?.seconds) return false;
            const orderDate = getLocalDateString(new Date(order.createdAt.seconds * 1000));
            return orderDate === todayStr || orderDate === yesterdayStr;
        });

        if (filteredRecent.length < 2) {
            return filteredRecent.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        }

        const orderSignatures = new Map();
        filteredRecent.forEach(order => {
            const signature = `${order.status}-${order.phoneNumber}-${order.orderDate}-${order.cakeType}-${order.flavor || ''}`;
            if (!orderSignatures.has(signature)) {
                orderSignatures.set(signature, 0);
            }
            orderSignatures.set(signature, orderSignatures.get(signature) + 1);
        });

        return filteredRecent.map(order => {
            const signature = `${order.status}-${order.phoneNumber}-${order.orderDate}-${order.cakeType}-${order.flavor || ''}`;
            return {
                ...order,
                isDuplicate: orderSignatures.get(signature) > 1,
            };
        }).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }, [orders]);
    
    const pendingRequests = useMemo(() => {
        const cakeReqs = websiteRequests
            .filter(r => r.status === 'Pending')
            .map(r => ({ ...r, type: 'cake' }));

        const snackReqs = websiteSnackRequests
            .filter(r => r.status === 'Pending')
            .map(r => ({ ...r, type: 'snack' }));

        const combined = [...cakeReqs, ...snackReqs];

        // Sort by createdAt timestamp, oldest first
        combined.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeA - timeB;
        });

        return combined;
    }, [websiteRequests, websiteSnackRequests]);
    
    const processedPendingRequests = useMemo(() => {
        if (pendingRequests.length < 2) {
            return pendingRequests;
        }

        const requestSignatures = new Map();
        pendingRequests.forEach(req => {
            const signature = `${req.phone}-${req.orderDate}-${req.cakeType}-${req.flavor || ''}`;
            if (!requestSignatures.has(signature)) {
                requestSignatures.set(signature, 0);
            }
            requestSignatures.set(signature, requestSignatures.get(signature) + 1);
        });

        return pendingRequests.map(req => {
            const signature = `${req.phone}-${req.orderDate}-${req.cakeType}-${req.flavor || ''}`;
            return {
                ...req,
                isDuplicate: requestSignatures.get(signature) > 1,
            };
        });
    }, [pendingRequests]);

    const recentRejectedRequests = useMemo(() => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const todayStr = getLocalDateString(today);
        const yesterdayStr = getLocalDateString(yesterday);
        
        return websiteRequests.filter(r => {
            if (r.status !== 'Rejected' || !r.updatedAt?.seconds) return false;
            const updatedDate = getLocalDateString(new Date(r.updatedAt.seconds * 1000));
            return updatedDate === todayStr || updatedDate === yesterdayStr;
        });
    }, [websiteRequests]);

    const AccordionSection = ({ title, sectionId, children }) => (
        <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
            <button onClick={() => setOpenSection(openSection === sectionId ? null : sectionId)} className="w-full flex justify-between items-center text-left text-xl font-bold text-gray-800">
                <span>{title}</span>
                <Icon name="chevron-down" className={`transform transition-transform ${openSection === sectionId ? 'rotate-180' : ''}`} />
            </button>
            {openSection === sectionId && <div className="mt-4">{children}</div>}
        </div>
    );

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                return resolve();
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.body.appendChild(script);
        });
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setNotification({ type: 'info', message: 'Importing orders...' });

        try {
            await loadScript("https://unpkg.com/xlsx/dist/xlsx.full.min.js");
            if (!window.XLSX) {
                throw new Error("Excel library failed to load.");
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = window.XLSX.utils.sheet_to_json(worksheet);

                    const batch = writeBatch(db);
                    let importedCount = 0;

                    const fieldMapping = {
                        'Name': 'clientName',
                        'Phone Number': 'phoneNumber',
                        'Delivery Date': 'orderDate',
                        'Delivery Time': 'deliveryTime',
                        'Address': 'address',
                        'Cake Type': 'cakeType',
                        'Flavor': 'flavor',
                        'Size/Count': 'sizeCount',
                        'Order Amount': 'price',
                        'Advance Amount': 'advanceAmount',
                        'Delivery Amount': 'deliveryAmount',
                        'Notes': 'notes',
                        'Collection Type': 'collectionType'
                    };

                    json.forEach(row => {
                        const newOrder = {};
                        for (const excelHeader in fieldMapping) {
                            if (row[excelHeader] !== undefined) {
                                newOrder[fieldMapping[excelHeader]] = row[excelHeader];
                            }
                        }

                        // Basic validation
                        if (!newOrder.clientName || !newOrder.phoneNumber || !newOrder.orderDate) {
                            console.warn("Skipping row due to missing required fields:", row);
                            return;
                        }

                        const excelDate = newOrder.orderDate;
                        if (!(excelDate instanceof Date) || isNaN(excelDate)) {
                            console.warn("Skipping row due to invalid date from Excel:", row);
                            return;
                        }
                        
                        // FIX: Adjust the date from Excel to counteract the browser's timezone offset.
                        // The library reads the date as UTC midnight. We subtract the local offset to treat it as local midnight.
                        const timezoneOffset = excelDate.getTimezoneOffset() * 60 * 1000; // offset in milliseconds
                        const deliveryDate = new Date(excelDate.getTime() - timezoneOffset); // Changed from + to -
                        newOrder.orderDate = getLocalDateString(deliveryDate);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        let status = 'Accepted';
                        if (deliveryDate < today) {
                            status = 'Delivered';
                        } else if (deliveryDate.getTime() === today.getTime()) {
                            status = 'Baking';
                        }


                        const newDocRef = doc(collection(db, "orders"));
                        batch.set(newDocRef, {
                            ...newOrder,
                            phoneNumber: String(newOrder.phoneNumber).slice(0, 10),
                            price: Number(newOrder.price) || 0,
                            advanceAmount: Number(newOrder.advanceAmount) || 0,
                            deliveryAmount: Number(newOrder.deliveryAmount) || 0,
                            collectionType: newOrder.collectionType || 'Pickup',
                            deliveryTime: newOrder.deliveryTime || '12:00',
                            status: status,
                            createdAt: new Date(),
                            imageUrl: '',
                            notes: newOrder.notes || ''
                        });
                        importedCount++;
                    });

                    await batch.commit();
                    setImportSummary({ count: importedCount });
                    setIsImportModalOpen(true);
                    setNotification(null); // Clear 'Importing...' message
                } catch (err) {
                    console.error("Error processing file:", err);
                    setNotification({ type: 'error', message: `Error processing file: ${err.message}` });
                }
            };
            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error("Import Error:", error);
            setNotification({ type: 'error', message: `Import failed: ${error.message}` });
        } finally {
            // Reset file input to allow re-uploading the same file
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-start items-center mb-6 space-x-4">
                    {activeForm === null && (
                        <>
                            <button onClick={() => setActiveForm('cake')} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition">
                                Cake Order
                            </button>
                            <button onClick={() => setActiveForm('snack')} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition">
                                Snacks Order
                            </button>
                            <button onClick={() => fileInputRef.current.click()} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition">
                                Import
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" />
                        </>
                    )}
                </div>

                {activeForm === 'cake' && <NewOrderForm setNotification={setNotification} onCancel={() => setActiveForm(null)} products={products} flavors={flavors} />}
                {activeForm === 'snack' && <NewSnackOrderForm setNotification={setNotification} onCancel={() => setActiveForm(null)} snacks={snacks} />}
                
                <div className="mt-8">
                    <AccordionSection title={`My Added Order (${recentOrders.length})`} sectionId="myAdded">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3">Cake/Snacks Type</th>
                                        <th className="px-6 py-3">Size/Count</th>
                                        <th className="px-6 py-3">Advance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.length > 0 ? recentOrders.map(order => (
                                        <tr key={order.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenOrderDetails(order)}>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <div className="flex items-center">
                                                    <span>{order.clientName}</span>
                                                    <CustomerChip isExisting={order.isExistingCustomer} />
                                                    {order.isDuplicate && <DuplicateChip />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{order.phoneNumber}</td>
                                            <td className="px-6 py-4">
                                                {order.items
                                                    ? order.items.map(i => i.item).join(', ')
                                                    : order.cakeType}
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.items
                                                    ? order.items.map(i => i.count).join(', ')
                                                    : order.sizeCount}
                                            </td>
                                            <td className="px-6 py-4">₹{order.advanceAmount?.toLocaleString('en-IN') || 0}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="text-center py-4 text-gray-500">No orders added today or yesterday.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Request From Website" sectionId="fromWebsite">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Orders ({pendingRequests.length})</h3>
                            <WebsiteRequestTable requests={processedPendingRequests} onRowClick={setRequestForDetails} />
                            
                            <div className="flex justify-between items-center mt-6 mb-2">
                                <h3 className="text-lg font-semibold text-gray-700">Rejected Orders ({recentRejectedRequests.length})</h3>
                                <button
                                    onClick={() => setIsSeeAllRejectedModalOpen(true)}
                                    className="bg-gray-200 text-gray-800 font-bold py-1 px-3 rounded-lg hover:bg-gray-300 transition text-sm"
                                >
                                    See All
                                </button>
                            </div>
                            <WebsiteRequestTable requests={recentRejectedRequests} onRowClick={setRequestForDetails} />
                        </div>
                    </AccordionSection>
                </div>
            </div>
            {isSeeAllRejectedModalOpen && (
                <SeeAllRejectedModal
                    allRequests={websiteRequests}
                    onClose={() => setIsSeeAllRejectedModalOpen(false)}
                    onRowClick={setRequestForDetails}
                />
            )}
            {requestForDetails && <RequestDetailsModal 
                request={requestForDetails} 
                onClose={() => setRequestForDetails(null)}
                setNotification={setNotification}
            />}
            {isImportModalOpen && <ImportSummaryModal summary={importSummary} onClose={() => setIsImportModalOpen(false)} />}
        </main>
    );
};

const ImportSummaryModal = ({ summary, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Import Complete</h3>
            <p className="text-gray-600 mb-6">
                Successfully imported <span className="font-bold text-green-600">{summary.count}</span> new orders.
            </p>
            <button
                onClick={onClose}
                className="bg-[#be0b73] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#a10a62] transition"
            >
                Close
            </button>
        </div>
    </div>
);


const SearchableDropdown = ({ options, value, onChange, placeholder, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sortedOptions = useMemo(() => 
        [...options].sort((a, b) => a.name.localeCompare(b.name)), 
    [options]);

    const filteredOptions = useMemo(() =>
        sortedOptions.filter(option =>
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [sortedOptions, searchTerm]);

    const handleSelect = (optionName) => {
        onChange({ target: { name: name, value: optionName } });
        setSearchTerm("");
        setIsOpen(false);
    };
    
    const formInputClasses = "w-full p-3 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]";

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`${formInputClasses} text-left`}>
                {value || <span className="text-gray-500">{placeholder}</span>}
            </button>
            {isOpen && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                         <input
                            type="text"
                            placeholder="Search..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ul>
                        {filteredOptions.map(option => (
                            <li key={option.id} onClick={() => handleSelect(option.name)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                {option.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const NewSnackOrderForm = ({ setNotification, onCancel, snacks }) => {
    const [formData, setFormData] = useState({
        orderDate: getLocalDateString(new Date()),
        deliveryTime: '12:00',
        clientName: '',
        phoneNumber: '',
        address: '',
        collectionType: 'Pickup',
        orderAmount: '',
        advanceAmount: '',
        deliveryAmount: '',
        notes: '',
        whatsapp: '',
    });
    const [items, setItems] = useState([{ item: '', count: 1, price: 0 }]);
    const [phoneError, setPhoneError] = useState('');
    const [whatsappError, setWhatsappError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSameAsPhone, setIsSameAsPhone] = useState(false);
    const [openSection, setOpenSection] = useState('guest'); // State to manage accordion

    const handleToggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    useEffect(() => {
        const newTotal = items.reduce((sum, current) => sum + (current.price * current.count), 0);
        setFormData(prev => ({ ...prev, orderAmount: newTotal }));
    }, [items]);

    useEffect(() => {
        if (isSameAsPhone) {
            setFormData(prev => ({ ...prev, whatsapp: prev.phoneNumber }));
            setWhatsappError(formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10 ? 'WhatsApp number must be 10 digits.' : '');
        }
    }, [isSameAsPhone, formData.phoneNumber]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const handleNumberValidation = (numValue, setError) => {
            if (numValue.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numValue }));
                setError(numValue.length > 0 && numValue.length < 10 ? 'Number must be 10 digits.' : '');
            }
        };

        if (name === 'phoneNumber') {
            handleNumberValidation(value.replace(/[^0-9]/g, ''), setPhoneError);
        } else if (name === 'whatsapp') {
            handleNumberValidation(value.replace(/[^0-9]/g, ''), setWhatsappError);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePaste = (e, fieldName) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text/plain');
        // Remove all non-digit characters from the pasted text
        const cleanedNumber = pastedText.replace(/\D/g, '');
        // Keep only the last 10 digits to handle prefixes like +91
        const finalNumber = cleanedNumber.slice(-10);

        setFormData(prev => ({ ...prev, [fieldName]: finalNumber }));

        // Immediately re-validate the pasted number
        if (fieldName === 'phoneNumber') {
            setPhoneError(finalNumber.length !== 10 ? 'Phone number must be 10 digits.' : '');
        } else if (fieldName === 'whatsapp') {
            setWhatsappError(finalNumber.length !== 10 ? 'WhatsApp number must be 10 digits.' : '');
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'item') {
            const selectedSnack = snacks.find(s => s.name === value);
            newItems[index].price = selectedSnack ? selectedSnack.price : 0;
        }
        if (field === 'count' && value < 1) {
            newItems[index].count = 1;
        }

        setItems(newItems);
    };

    const addNewItem = () => {
        setItems([...items, { item: '', count: 1, price: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phoneNumber.length !== 10) { setPhoneError('Phone number must be 10 digits.'); return; }
        if (formData.whatsapp && formData.whatsapp.length !== 10) { setWhatsappError('WhatsApp number must be 10 digits.'); return; }
        if (items.some(item => !item.item || item.count < 1)) {
            setNotification({ type: 'error', message: 'Please select a snack for all items and ensure count is at least 1.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deliveryDate = new Date(formData.orderDate + 'T00:00:00');
            let initialStatus = deliveryDate < today ? 'Delivered' : (deliveryDate.getTime() === today.getTime() ? 'Baking' : 'Accepted');

            await addDoc(collection(db, "orders"), {
                ...formData,
                price: Number(formData.orderAmount) || 0,
                advanceAmount: Number(formData.advanceAmount) || 0,
                deliveryAmount: Number(formData.deliveryAmount) || 0,
                items: items.map(({ item, count }) => ({ item, count })),
                cakeType: 'Snacks Order',
                sizeCount: `${items.length} items`,
                status: initialStatus,
                createdAt: new Date(),
            });
            setNotification({ type: 'success', message: 'Snack Order Created Successfully' });
            onCancel();
        } catch (error) {
            console.error("Error adding snack order: ", error);
            setNotification({ type: 'error', message: 'Failed to save snack order.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formInputClasses = "w-full p-3 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]";

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <form onSubmit={handleSubmit}>
                <FormSection title="Guest Details" isOpen={openSection === 'guest'} onToggle={() => handleToggleSection('guest')}>
                    <div className="space-y-4">
                        <input type="text" name="clientName" placeholder="Name" value={formData.clientName} onChange={handleInputChange} required className={formInputClasses} />
                        <div>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="phoneNumber"
                                placeholder="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                onPaste={(e) => handlePaste(e, 'phoneNumber')} // Add this line
                                required
                                className={`${formInputClasses} ${phoneError ? 'border-red-500' : ''}`}
                            />
                            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                        </div>
                        <div>
                            <input
    type="text"
    inputMode="numeric"
    name="whatsapp"
    placeholder="WhatsApp Number (Optional)"
    value={formData.whatsapp}
    onChange={handleInputChange}
    onPaste={(e) => handlePaste(e, 'whatsapp')} // Add this line
    className={`${formInputClasses} ${whatsappError ? 'border-red-500' : ''}`}
    disabled={isSameAsPhone}
/>
                            {whatsappError && <p className="text-red-500 text-xs mt-1">{whatsappError}</p>}
                        </div>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={isSameAsPhone} onChange={(e) => setIsSameAsPhone(e.target.checked)} className="form-checkbox h-4 w-4 text-pink-600" />
                            <span className="ml-2 text-sm text-gray-700">Same as Phone Number</span>
                        </label>
                    </div>
                </FormSection>

                <FormSection title="Delivery Details" isOpen={openSection === 'delivery'} onToggle={() => handleToggleSection('delivery')}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Collection Type</label>
                            <select name="collectionType" value={formData.collectionType} onChange={handleInputChange} className={formInputClasses}><option>Pickup</option><option>Delivery</option></select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-gray-700">Delivery Date</label><input type="date" name="orderDate" value={formData.orderDate} onChange={handleInputChange} required className={formInputClasses} /></div>
                            <div><label className="text-sm font-medium text-gray-700">Delivery Time</label><input type="time" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} required className={formInputClasses} /></div>
                        </div>
                        <textarea name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} rows="2" className={formInputClasses}></textarea>
                    </div>
                </FormSection>

                <FormSection title="Snacks Box" isOpen={openSection === 'snacks'} onToggle={() => handleToggleSection('snacks')}>
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center mb-2">
                            <div className="col-span-7">
                                <SearchableDropdown name="item" options={snacks} value={item.item} onChange={(e) => handleItemChange(index, 'item', e.target.value)} placeholder="Select Snack" />
                            </div>
                            <div className="col-span-5 flex items-center justify-end space-x-2">
                                <button type="button" onClick={() => handleItemChange(index, 'count', item.count - 1)} className="bg-gray-200 h-10 w-10 rounded-full font-bold">-</button>
                                <input type="number" value={item.count} onChange={(e) => handleItemChange(index, 'count', parseInt(e.target.value, 10))} className="w-16 p-2 border border-gray-300 rounded-lg text-center" />
                                <button type="button" onClick={() => handleItemChange(index, 'count', item.count + 1)} className="bg-gray-200 h-10 w-10 rounded-full font-bold">+</button>
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 p-2 hover:bg-red-100 rounded-full"><Icon name="delete" className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addNewItem} className="w-full mt-2 bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-lg hover:bg-blue-200 transition">Add New Item</button>
                    <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} rows="3" className={`${formInputClasses} mt-4`}></textarea>
                </FormSection>

                <FormSection title="Price Details" isOpen={openSection === 'price'} onToggle={() => handleToggleSection('price')}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="number" name="orderAmount" placeholder="Total Amount (₹)" value={formData.orderAmount} onChange={handleInputChange} className={formInputClasses} />
                        <input type="number" name="advanceAmount" placeholder="Advance Amount (₹)" value={formData.advanceAmount} onChange={handleInputChange} className={formInputClasses} />
                        <input type="number" name="deliveryAmount" placeholder="Delivery Amount (₹)" value={formData.deliveryAmount} onChange={handleInputChange} className={formInputClasses} />
                    </div>
                </FormSection>

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] disabled:bg-[#f2b8d9] transition">{isSubmitting ? 'Creating...' : 'Create'}</button>
                </div>
            </form>
        </div>
    );
};

const FormSection = ({ title, children, isOpen, onToggle }) => (
    <div className="border rounded-lg mb-4 overflow-hidden transition-all duration-300">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
        >
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
            <Icon name="chevron-down" className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="p-4 border-t bg-white">
                {children}
            </div>
        )}
    </div>
);

const NewOrderForm = ({ setNotification, onCancel, products, flavors }) => {
    const [formData, setFormData] = useState({
        orderDate: getLocalDateString(new Date()), deliveryTime: '12:00', clientName: '', phoneNumber: '', address: '',
        cakeType: '', sizeCount: '', orderAmount: '', advanceAmount: '', notes: '', flavor: '',
        collectionType: 'Pickup', deliveryAmount: '', whatsapp: '', cakeTag: 'No Tag', nameOnCake: ''
    });
    const fileInputRef = useRef(null);
    const [phoneError, setPhoneError] = useState('');
    const [whatsappError, setWhatsappError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSameAsPhone, setIsSameAsPhone] = useState(false);
    const [openSection, setOpenSection] = useState('guest'); // Manages which section is open

    const handleToggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
                setPhoneError(numericValue.length > 0 && numericValue.length < 10 ? 'Phone number must be 10 digits.' : '');
            }
        } else if (name === 'whatsapp') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
                setWhatsappError(numericValue.length > 0 && numericValue.length < 10 ? 'WhatsApp number must be 10 digits.' : '');
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePaste = (e, fieldName) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text/plain');
        // Remove all non-digit characters from the pasted text
        const cleanedNumber = pastedText.replace(/\D/g, '');
        // Keep only the last 10 digits to handle prefixes like +91
        const finalNumber = cleanedNumber.slice(-10);

        setFormData(prev => ({ ...prev, [fieldName]: finalNumber }));

        // Immediately re-validate the pasted number
        if (fieldName === 'phoneNumber') {
            setPhoneError(finalNumber.length !== 10 ? 'Phone number must be 10 digits.' : '');
        } else if (fieldName === 'whatsapp') {
            setWhatsappError(finalNumber.length !== 10 ? 'WhatsApp number must be 10 digits.' : '');
        }
};

    useEffect(() => {
        if (isSameAsPhone) {
            setFormData(prev => ({ ...prev, whatsapp: prev.phoneNumber }));
            setWhatsappError(formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10 ? 'WhatsApp number must be 10 digits.' : '');
        }
    }, [isSameAsPhone, formData.phoneNumber]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phoneNumber.length !== 10) { setPhoneError('Phone number must be 10 digits.'); return; }
        if (formData.whatsapp && formData.whatsapp.length !== 10) { setWhatsappError('WhatsApp number must be 10 digits.'); return; }
        setIsSubmitting(true);
        if (imageFile && typeof imageCompression !== 'function') {
            setNotification({ type: 'error', message: 'Image processor is not ready. Please wait a moment and try again.' });
            setIsSubmitting(false);
            return;
        }
        try {
            let imageUrl = '';
            if (imageFile) {
                const options = {
                        maxSizeMB: 0.15,          // Target file size of 150KB
                        maxWidthOrHeight: 1280,     // Resize the longest side to 1280px for good quality
                        useWebWorker: true,
                        fileType: 'image/webp',   // THIS IS THE KEY: Convert the output to WebP format
                        initialQuality: 0.8       // Set the WebP quality (0.8 is a great starting point)
                        };
                const compressedFile = await imageCompression(imageFile, options);

                // ADD THIS CHECK: Stop if the compressed file is still too large
                if (compressedFile.size > 1 * 1024 * 1024) { // 1MB limit
                    setNotification({ type: 'error', message: 'Image is still too large after compression. Please use a smaller file.' });
                    setIsSubmitting(false); // Reset the button
                    return; // Stop the function here
                }

                // Force refresh the user's auth token to prevent timing issues
                if (auth.currentUser) {
                    await auth.currentUser.getIdToken(true);
                }

                // Force refresh the user's auth token to prevent timing issues
                if (auth.currentUser) {
                    await auth.currentUser.getIdToken(true);
                }

                // Create a new Date object to get the full month name
                // Using .replace() makes it compatible with all browsers
                const deliveryDate = new Date(formData.orderDate.replace(/-/g, '/'));
                const monthName = deliveryDate.toLocaleString('default', { month: 'long' });

                // Format the date for the subfolder
                const [year, month, day] = formData.orderDate.split('-');
                const formattedDateFolder = `${day}-${month}-${year.slice(-2)}`;

                // Create the new storage path with the month and date folders
                const storageRef = ref(storage, `cake_images/${monthName}/${formattedDateFolder}/${Date.now()}_${compressedFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, compressedFile);
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                        (error) => reject(error),
                        async () => {
                            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const deliveryDate = new Date(formData.orderDate + 'T00:00:00');
            let initialStatus = deliveryDate < today ? 'Delivered' : (deliveryDate.getTime() === today.getTime() ? 'Baking' : 'Accepted');
            await addDoc(collection(db, "orders"), {
                ...formData,
                price: Number(formData.orderAmount) || 0,
                advanceAmount: Number(formData.advanceAmount) || 0,
                deliveryAmount: Number(formData.deliveryAmount) || 0,
                imageUrl: imageUrl,
                status: initialStatus,
                createdAt: new Date(),
            });
            setNotification({ type: 'success', message: 'Order Created Successfully' });
            onCancel();
        } catch (error) {
            console.error("Error adding document: ", error);
            setNotification({ type: 'error', message: 'Failed to save order.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formInputClasses = "w-full p-3 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]";

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <form onSubmit={handleSubmit}>
                <FormSection title="Guest Details" isOpen={openSection === 'guest'} onToggle={() => handleToggleSection('guest')}>
                    <div className="space-y-4">
                        <input type="text" name="clientName" placeholder="Name" value={formData.clientName} onChange={handleInputChange} required className={formInputClasses} />
                        <div>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="phoneNumber"
                                placeholder="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                onPaste={(e) => handlePaste(e, 'phoneNumber')} // Add this line
                                required
                                className={`${formInputClasses} ${phoneError ? 'border-red-500' : ''}`}
                            />
                            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                        </div>
                        <div>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="whatsapp"
                                placeholder="WhatsApp Number (Optional)"
                                value={formData.whatsapp}
                                onChange={handleInputChange}
                                onPaste={(e) => handlePaste(e, 'whatsapp')} // Add this line
                                className={`${formInputClasses} ${whatsappError ? 'border-red-500' : ''}`}
                                disabled={isSameAsPhone}
                            />
                            {whatsappError && <p className="text-red-500 text-xs mt-1">{whatsappError}</p>}
                        </div>
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={isSameAsPhone} onChange={(e) => setIsSameAsPhone(e.target.checked)} className="form-checkbox h-4 w-4 text-pink-600" />
                            <span className="ml-2 text-sm text-gray-700">Same as Phone Number</span>
                        </label>
                    </div>
                </FormSection>

                <FormSection title="Delivery Details" isOpen={openSection === 'delivery'} onToggle={() => handleToggleSection('delivery')}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Collection Type</label>
                            <select name="collectionType" value={formData.collectionType} onChange={handleInputChange} className={formInputClasses}>
                                <option>Pickup</option>
                                <option>Delivery</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Delivery Date</label>
                                <input type="date" name="orderDate" value={formData.orderDate} onChange={handleInputChange} required className={formInputClasses} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Delivery Time</label>
                                <input type="time" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} required className={formInputClasses} />
                            </div>
                        </div>
                        <textarea name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} rows="2" className={formInputClasses}></textarea>
                    </div>
                </FormSection>

                <FormSection title="Cake Details" isOpen={openSection === 'cake'} onToggle={() => handleToggleSection('cake')}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SearchableDropdown name="cakeType" options={products} value={formData.cakeType} onChange={handleInputChange} placeholder="Cake Type" />
                            <SearchableDropdown name="flavor" options={flavors} value={formData.flavor} onChange={handleInputChange} placeholder="Flavor" />
                        </div>
                        <input type="text" name="sizeCount" placeholder="Size/Count" value={formData.sizeCount} onChange={handleInputChange} required className={formInputClasses} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select name="cakeTag" value={formData.cakeTag} onChange={handleInputChange} className={formInputClasses}>
                                <option>No Tag</option>
                                <option>Happy Birthday Tag</option>
                                <option>Anniversary Tag</option>
                            </select>
                            <input type="text" name="nameOnCake" placeholder="Name to write on cake" value={formData.nameOnCake} onChange={handleInputChange} className={formInputClasses} />
                        </div>
                        <textarea name="notes" placeholder="Notes (e.g., 'Happy Birthday Mom')" value={formData.notes} onChange={handleInputChange} rows="3" className={formInputClasses}></textarea>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cake Image (Optional)</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => setImageFile(e.target.files[0])}
                                accept="image/*"
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                            />
                            
                            {/* This new part displays the image preview */}
                            {imageFile && !isSubmitting && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                                    <div className="relative mt-2 w-32 h-32">
                                        <img 
                                            src={URL.createObjectURL(imageFile)} 
                                            alt="Selected preview" 
                                            className="rounded-lg w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = "";
                                                }
                                            }}
                                            className="absolute top-1 right-1 bg-white bg-opacity-70 text-red-600 p-1 rounded-full hover:bg-opacity-100"
                                            aria-label="Remove selected file"
                                        >
                                            <Icon name="close" className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isSubmitting && imageFile && <progress value={uploadProgress} max="100" className="w-full mt-2" />}
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Price Details" isOpen={openSection === 'price'} onToggle={() => handleToggleSection('price')}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="number" name="orderAmount" placeholder="Order Amount (₹)" value={formData.orderAmount} onChange={handleInputChange} required className={formInputClasses} />
                        <input type="number" name="advanceAmount" placeholder="Advance Amount (₹)" value={formData.advanceAmount} onChange={handleInputChange} className={formInputClasses} />
                        <input type="number" name="deliveryAmount" placeholder="Delivery Amount (₹)" value={formData.deliveryAmount} onChange={handleInputChange} className={formInputClasses} />
                    </div>
                </FormSection>

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] disabled:bg-[#f2b8d9] transition">
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Table Row & Modal Components ---
const OrderRow = ({ order, onRowClick }) => {
    return (
        <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick(order)}>
            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                <div className="flex items-center">
                    <span>{order.clientName}</span>
                    <CustomerChip isExisting={order.isExistingCustomer} />
                    {order.isDuplicate && <DuplicateChip />}
                    {order.status === 'Cancelled' && (
                        <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Cancelled</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">{order.phoneNumber}</td>
            <td className="px-6 py-4">
                {order.items
                    ? order.items.map(i => i.item).join(', ')
                    : order.cakeType}
            </td>
            <td className="px-6 py-4">
                {order.items
                    ? order.items.map(i => i.count).join(', ')
                    : order.sizeCount}
            </td>
            <td className="px-6 py-4">{order.flavor || '-'}</td>
        </tr>
    );
};

const EditableSnackItem = ({ item, index, allSnacks, onUpdate, onRemove }) => {
    const handleItemChange = (e) => {
        // Find the full snack object to get its price
        const selectedSnack = allSnacks.find(snack => snack.name === e.target.value);
        onUpdate(index, { ...item, item: e.target.value, price: selectedSnack?.price || 0 });
    };

    const handleCountChange = (newCount) => {
        if (newCount >= 1) {
            onUpdate(index, { ...item, count: newCount });
        }
    };

    return (
        <div className="grid grid-cols-3 gap-2 items-center p-2 border-b">
            {/* Snacks Dropdown */}
            <div className="col-span-2">
                 <SearchableDropdown
                    name="item"
                    options={allSnacks}
                    value={item.item}
                    onChange={handleItemChange}
                    placeholder="Select a Snack"
                />
            </div>

            {/* Count Controls */}
            <div className="flex items-center justify-between">
                <button type="button" onClick={() => handleCountChange(item.count - 1)} className="bg-gray-200 p-1 rounded-full">-</button>
                <span className="font-semibold">{item.count}</span>
                <button type="button" onClick={() => handleCountChange(item.count + 1)} className="bg-gray-200 p-1 rounded-full">+</button>
                <button type="button" onClick={() => onRemove(index)} className="text-red-500 ml-2 p-1 hover:bg-red-100 rounded-full">
                    <Icon name="delete" className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

const OrderDetailsModal = ({ order, onClose, setNotification, products, flavors, snacks }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);
    const [isSaving, setIsSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [whatsappError, setWhatsappError] = useState('');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [newImageFile, setNewImageFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showImageWarning, setShowImageWarning] = useState(false);
    const fileInputRef = useRef(null);
    const [isSameAsPhone, setIsSameAsPhone] = useState(false);
    const [openSection, setOpenSection] = useState('guest');
    const { permissions } = usePermissions();

    // --- History management for Edit Mode ---
    useEffect(() => {
        const handlePopState = (event) => {
            // When the back button is pressed, if the state doesn't have 'edit',
            // it means we should exit edit mode.
            if (!event.state?.edit) {
                setIsEditing(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleEnterEditMode = () => {
        setIsEditing(true);
        // Push a new state to history to represent the "edit" view of the modal
        history.pushState({ ...history.state, edit: true }, '', `#${history.state.page}/order/${order.id}/edit`);
    };

    const handleCancelEdit = () => {
        // Simply go back in history. The popstate listener will handle setting isEditing to false.
        history.back();
    };


    const whatsAppMessage = useMemo(() => {
        // Start with a standard greeting
        let message = "This is regarding your order:\n\n"; // Using \n for new lines

        // Check if it's a snack order (has an 'items' array)
        if (editableOrder.items && Array.isArray(editableOrder.items)) {
            message += "Items:\n";
            editableOrder.items.forEach(item => {
                message += `- ${item.item} (Qty: ${item.count})\n`;
            });
        } else { // Otherwise, it's a cake order
            message += `Cake Type: ${editableOrder.cakeType || 'N/A'}\n`;
            message += `Flavor: ${editableOrder.flavor || 'N/A'}\n`;
        }

        // Add the delivery date
        const deliveryDate = new Date(editableOrder.orderDate + 'T00:00:00').toLocaleDateString('en-GB');
        message += `\nDelivery Date: ${deliveryDate}`;

        // URL-encode the final message to make it safe for a URL
        return encodeURIComponent(message);
    }, [editableOrder]);
    
    const handleImageChangeClick = () => {
        if (editableOrder.imageUrl) {
            setShowImageWarning(true);
        } else {
            fileInputRef.current.click();
        }
    };

    const handleToggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    useEffect(() => {
    // Automatically calculate the total price for snack orders when items change
    if (editableOrder.items && Array.isArray(editableOrder.items)) {
        const totalPrice = editableOrder.items.reduce((sum, currentItem) => {
            const itemPrice = currentItem.price || 0;
            const itemCount = currentItem.count || 0;
            return sum + (itemPrice * itemCount);
        }, 0);
        
        // Update the price in the state if it has changed
        if (totalPrice !== editableOrder.price) {
            setEditableOrder(prev => ({ ...prev, price: totalPrice }));
        }
    }
}, [editableOrder.items]);

    useEffect(() => {
    // When editing starts, check if the order has snack items and if their prices are missing.
        if (isEditing && editableOrder.items && snacks.length > 0) {
            let needsPriceUpdate = false;
            const updatedItems = editableOrder.items.map(item => {
                // If an item doesn't have a price, find it in the main snacks list.
                if (item.price === undefined || item.price === 0) {
                    const snackDetails = snacks.find(s => s.name === item.item);
                    if (snackDetails) {
                        needsPriceUpdate = true;
                        return { ...item, price: snackDetails.price || 0 };
                    }
                }
                return item;
            });

            // If we found and added any prices, update the state.
            if (needsPriceUpdate) {
                setEditableOrder(prev => ({ ...prev, items: updatedItems }));
            }
        }
    }, [isEditing, snacks]);

    useEffect(() => {
    // This runs whenever the list of items changes.
        if (editableOrder.items && Array.isArray(editableOrder.items)) {
            const totalPrice = editableOrder.items.reduce((sum, currentItem) => {
                const itemPrice = currentItem.price || 0;
                const itemCount = currentItem.count || 0;
                return sum + (itemPrice * itemCount);
            }, 0);

            // Update the total price in the state.
            setEditableOrder(prev => ({ ...prev, price: totalPrice }));
        }
    }, [editableOrder.items]); 

    useEffect(() => {
    if (isSameAsPhone) {
        setEditableOrder(prev => ({ ...prev, whatsapp: prev.phoneNumber }));
        // Also sync the validation error state
        if (editableOrder.phoneNumber.length > 0 && editableOrder.phoneNumber.length < 10) {
            setWhatsappError('Phone number must be 10 digits.');
        } else {
            setWhatsappError('');
        }
    }
}, [isSameAsPhone, editableOrder.phoneNumber]);

    const handleSnackItemUpdate = (index, updatedItem) => {
        const newItems = [...editableOrder.items];
        newItems[index] = updatedItem;
        setEditableOrder(prev => ({ ...prev, items: newItems }));
    };

    const handleRemoveSnackItem = (index) => {
        const newItems = editableOrder.items.filter((_, i) => i !== index);
        setEditableOrder(prev => ({ ...prev, items: newItems }));
    };

    const handleAddSnackItem = () => {
        const newItem = { item: '', count: 1, price: 0 }; // Default new item
        setEditableOrder(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    };
    
    const handleDownload = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = `cake_${order.id}.jpg`; // Sets a default filename
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
    } catch (error) {
        console.error("Could not download the image:", error);
        setNotification({ type: 'error', message: 'Could not download image.' });
    }
};
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setEditableOrder(prev => ({ ...prev, [name]: numericValue }));
                if (numericValue.length > 0 && numericValue.length < 10) {
                    setPhoneError('Phone number must be 10 digits.');
                } else {
                    setPhoneError('');
                }
            }
        } else if (name === 'whatsapp') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setEditableOrder(prev => ({ ...prev, [name]: numericValue }));
                if (numericValue.length > 0 && numericValue.length < 10) {
                    setWhatsappError('WhatsApp number must be 10 digits.');
                } else {
                    setWhatsappError('');
                }
            }
        } else {
            setEditableOrder(prev => ({ ...prev, [name]: value }));
        }
    };

const handleSave = async () => {
    // ... (your existing validation for phone/whatsapp numbers) ...

    setIsSaving(true);
    try {
        const orderRef = doc(db, "orders", order.id);
        const { id, createdAt, isExistingCustomer, ...dataToUpdate } = editableOrder;

        // Store the old image URL before we do anything else
        const oldImageUrl = order.imageUrl;

        if (newImageFile) {
             if (typeof imageCompression !== 'function') {
                setNotification({ type: 'error', message: 'Image processor is not ready. Please wait a moment and try again.' });
                setIsSaving(false);
                return;
            }

            // Force refresh the user's auth token to prevent timing issues
            if (auth.currentUser) {
                await auth.currentUser.getIdToken(true);
            }

            // --- Image compression logic ---
            const options = {
                maxSizeMB: 0.15,          // Target file size of 150KB
                maxWidthOrHeight: 1280,     // Resize the longest side to 1280px for good quality
                useWebWorker: true,
                fileType: 'image/webp',   // THIS IS THE KEY: Convert the output to WebP format
                initialQuality: 0.8       // Set the WebP quality (0.8 is a great starting point)
                };
            const compressedFile = await imageCompression(newImageFile, options);
            
            // ADD THIS CHECK: Stop if the compressed file is still too large
            if (compressedFile.size > 1 * 1024 * 1024) { // 1MB limit
                setNotification({ type: 'error', message: 'Image is still too large after compression. Please use a smaller file.' });
                setIsSaving(false); // Reset the button
                return; // Stop the function here
            }

            // Force refresh the user's auth token to prevent timing issues
            if (auth.currentUser) {
                await auth.currentUser.getIdToken(true);
            }

            // Create a new Date object to get the full month name
const deliveryDate = new Date(dataToUpdate.orderDate.replace(/-/g, '/'));
const monthName = deliveryDate.toLocaleString('default', { month: 'long' });

// Format the date for the subfolder
const [year, month, day] = dataToUpdate.orderDate.split('-');
const formattedDateFolder = `${day}-${month}-${year.slice(-2)}`;

// Create the new storage path with the month and date folders
const storageRef = ref(storage, `cake_images/${monthName}/${formattedDateFolder}/${Date.now()}_${compressedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            // This part uploads the new image and gets the new URL
            dataToUpdate.imageUrl = await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });

            // --- NEW LOGIC TO DELETE THE OLD IMAGE ---
            // If there was an old image, delete it from storage
            if (oldImageUrl) {
                try {
                    const oldImageRef = ref(storage, oldImageUrl);
                    await deleteObject(oldImageRef);
                    console.log("Successfully deleted old image.");
                } catch (deleteError) {
                    // We log this error but don't stop the process,
                    // as the main goal is to save the new order data.
                    console.error("Failed to delete old image, it may not exist:", deleteError);
                }
            }
        }

        // ... (The rest of your existing save logic to update status, price, etc.) ...
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deliveryDate = new Date(dataToUpdate.orderDate + 'T00:00:00');

        // Only update the status automatically if it's not already in a final state
        if (dataToUpdate.status !== 'Delivered' && dataToUpdate.status !== 'Cancelled') {
            if (deliveryDate < today) {
                dataToUpdate.status = 'Delivered';
            } else if (deliveryDate.getTime() === today.getTime()) {
                dataToUpdate.status = 'Baking';
            } else {
                // If the date is moved to the future, reset to 'Accepted'
                dataToUpdate.status = 'Accepted';
            }
        }

        await updateDoc(orderRef, dataToUpdate);
        setNotification({ type: 'success', message: 'Order updated successfully!' });
        // Instead of just setting isEditing to false, go back in history.
        // This will trigger the popstate listener which will set isEditing to false.
        history.back();
    } catch (error) {
        console.error("Error updating order:", error);
        setNotification({ type: 'error', message: 'Failed to update order.' });
    } finally {
        setIsSaving(false);
    }
};

    const handleConfirmCancel = async () => {
        try {
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, { status: "Cancelled" });
            setNotification({ type: 'success', message: 'Order has been cancelled.' });
            onClose();
        } catch (error) {
            console.error("Error cancelling order:", error);
            setNotification({ type: 'error', message: 'Failed to cancel order.' });
        }
        setShowCancelConfirm(false);
    };

    const getOrderDate = () => {
        if (order.createdAt && order.createdAt.seconds) {
            return new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB');
        }
        return 'N/A';
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            case 'Baking': return 'bg-blue-100 text-blue-800';
            case 'Ready': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-yellow-100 text-yellow-800'; // Accepted
        }
    };

    const isCancellable = order.status !== 'Delivered' && order.status !== 'Cancelled';

    const DetailItem = ({ label, value }) => (
        <div className="py-2">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-md text-gray-800">{value || '-'}</p>
        </div>
    );
    
    const formInputClasses = "w-full p-2 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-1 focus:ring-[#f2b8d9]";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <div className="flex-grow">
                            <div className="flex items-center"> {/* Removed justify-center */}
                                <h2 className="text-2xl font-bold text-gray-800">{editableOrder.clientName}</h2>
                                <div className="flex items-center space-x-4 ml-5">
                                    {/* Phone Call Icon */}
                                    <a href={`tel:+91${editableOrder.phoneNumber}`} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors">
                                        <Icon name="phone" className="h-7 w-7" />
                                    </a>
                                    
                                    {/* WhatsApp Icon (only shows if a WhatsApp number exists) */}
                                    {editableOrder.whatsapp && (
                                        <a href={`https://wa.me/91${editableOrder.whatsapp}?text=${whatsAppMessage}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors">
                                            <Icon name="whatsapp" className="h-7 w-7" />
                                        </a>
                                    )}
                                    {editableOrder.latitude && editableOrder.longitude && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${editableOrder.latitude},${editableOrder.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
                                            aria-label="View on Google Maps"
                                        >
                                            <Icon name="map" className="h-7 w-7" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <p className="text-md text-gray-600 mt-1">{editableOrder.phoneNumber}</p> {/* Removed text-center */}
                        </div>
                        {!isEditing && permissions?.orderManagement?.edit && (
                            <div className="pl-4">
                                <button onClick={handleEnterEditMode} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100">
                                    <Icon name="edit" className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div>
                            <div className="py-2 mb-4 border-b">
                                <p className="text-sm text-gray-500">Order ID</p>
                                <p className="text-md text-gray-800 font-mono">{order.id}</p>
                            </div>

                            <FormSection title="Guest Details" isOpen={openSection === 'guest'} onToggle={() => handleToggleSection('guest')}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Name</label>
                                        <input type="text" name="clientName" value={editableOrder.clientName} onChange={handleInputChange} className={formInputClasses} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <input type="text" inputMode="numeric" name="phoneNumber" value={editableOrder.phoneNumber} onChange={handleInputChange} className={`${formInputClasses} ${phoneError ? 'border-red-500' : ''}`} />
                                        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                                        <input type="text" inputMode="numeric" name="whatsapp" value={editableOrder.whatsapp || ''} onChange={handleInputChange} className={`${formInputClasses} ${whatsappError ? 'border-red-500' : ''}`} disabled={isSameAsPhone} />
                                        {whatsappError && <p className="text-red-500 text-xs mt-1">{whatsappError}</p>}
                                    </div>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isSameAsPhone} onChange={(e) => setIsSameAsPhone(e.target.checked)} className="form-checkbox h-4 w-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500" />
                                        <span className="ml-2 text-sm text-gray-700">Same as Phone Number</span>
                                    </label>
                                </div>
                            </FormSection>

                            <FormSection title="Delivery Details" isOpen={openSection === 'delivery'} onToggle={() => handleToggleSection('delivery')}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Collection Type</label>
                                        <select name="collectionType" value={editableOrder.collectionType} onChange={handleInputChange} className={formInputClasses}>
                                            <option>Pickup</option>
                                            <option>Delivery</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Delivery Date</label>
                                        <input type="date" name="orderDate" value={editableOrder.orderDate} onChange={handleInputChange} className={formInputClasses} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Delivery Time</label>
                                        <input type="time" name="deliveryTime" value={editableOrder.deliveryTime} onChange={handleInputChange} className={formInputClasses} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Address</label>
                                        <textarea name="address" value={editableOrder.address} onChange={handleInputChange} rows="2" className={formInputClasses}></textarea>
                                    </div>
                                </div>
                            </FormSection>

                            {/* Conditional Section for Cake or Snacks */}
                            {editableOrder.items ? (
                                <FormSection title="Snacks Box" isOpen={openSection === 'details'} onToggle={() => handleToggleSection('details')}>
                                    <div className="space-y-2">
                                        {editableOrder.items.map((item, index) => (
                                            <EditableSnackItem key={index} item={item} index={index} allSnacks={snacks} onUpdate={handleSnackItemUpdate} onRemove={handleRemoveSnackItem} />
                                        ))}
                                        <button type="button" onClick={handleAddSnackItem} className="w-full mt-2 bg-blue-100 text-blue-800 font-bold py-2 px-4 rounded-lg hover:bg-blue-200 transition">Add New Item</button>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Notes</label>
                                            <textarea name="notes" value={editableOrder.notes} onChange={handleInputChange} rows="2" className={formInputClasses}></textarea>
                                        </div>
                                    </div>
                                </FormSection>
                            ) : (
            <FormSection title="Cake Details" isOpen={openSection === 'details'} onToggle={() => handleToggleSection('details')}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Cake Type</label>
                        <SearchableDropdown name="cakeType" options={products} value={editableOrder.cakeType} onChange={handleInputChange} placeholder="Select Cake Type" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Flavor</label>
                        <SearchableDropdown name="flavor" options={flavors} value={editableOrder.flavor} onChange={handleInputChange} placeholder="Select Flavor" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Size/Count</label>
                        <input type="text" name="sizeCount" value={editableOrder.sizeCount} onChange={handleInputChange} className={formInputClasses} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Cake Tag</label>
                        <select name="cakeTag" value={editableOrder.cakeTag || 'No Tag'} onChange={handleInputChange} className={formInputClasses}>
                            <option>No Tag</option>
                            <option>Happy Birthday Tag</option>
                            <option>Anniversary Tag</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Name on Cake</label>
                        <input type="text" name="nameOnCake" value={editableOrder.nameOnCake || ''} onChange={handleInputChange} className={formInputClasses} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Notes</label>
                        <textarea name="notes" value={editableOrder.notes} onChange={handleInputChange} rows="2" className={formInputClasses}></textarea>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{editableOrder.imageUrl ? 'Update Existing Image' : 'Upload New Image'}</label>
                        <div className="flex items-center gap-4 mt-1">
                            <button type="button" onClick={handleImageChangeClick} className="bg-pink-50 text-pink-700 font-semibold py-2 px-4 rounded-lg hover:bg-pink-100 transition">Choose File...</button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={(e) => setNewImageFile(e.target.files[0])} accept="image/*" className="hidden" />
                        
                        {(editableOrder.imageUrl || newImageFile) && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                                <div className="relative mt-2 w-32 h-32">
                                     <img 
                                        src={newImageFile ? URL.createObjectURL(newImageFile) : editableOrder.imageUrl} 
                                        alt="Order preview" 
                                        className="rounded-lg w-full h-full object-cover"
                                    />
                                    {newImageFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewImageFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = "";
                                                }
                                            }}
                                            className="absolute top-1 right-1 bg-white bg-opacity-70 text-red-600 p-1 rounded-full hover:bg-opacity-100"
                                            aria-label="Remove selected file"
                                        >
                                            <Icon name="close" className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {isSaving && newImageFile && <progress value={uploadProgress} max="100" className="w-full mt-2" />}
                    </div>
                </div>
            </FormSection>
        )}

        <FormSection title="Price Details" isOpen={openSection === 'price'} onToggle={() => handleToggleSection('price')}>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Price (₹)</label>
                    <input type="number" name="price" value={editableOrder.price} onChange={handleInputChange} className={formInputClasses} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Advance Amount (₹)</label>
                    <input type="number" name="advanceAmount" value={editableOrder.advanceAmount} onChange={handleInputChange} className={formInputClasses} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Delivery Amount (₹)</label>
                    <input type="number" name="deliveryAmount" value={editableOrder.deliveryAmount} onChange={handleInputChange} className={formInputClasses} />
                </div>
            </div>
        </FormSection>
    </div>
) : (
                        <div className="space-y-2">
                            <div className="py-2">
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                            </div>
                            <DetailItem label="Order ID" value={order.id} />
                            <DetailItem label="WhatsApp Number" value={order.whatsapp} />
                            <DetailItem label="Address" value={order.address} />
                            {order.items ? (
                                <DetailItem label="Items" value={order.items.map(item => `${item.item} (${item.count})`).join(', ')} />
                            ) : (
                                <>
                                    <DetailItem label="Cake Type" value={order.cakeType} />
                                    <DetailItem label="Flavor" value={order.flavor} />
                                    <DetailItem label="Size/Count" value={order.sizeCount} />
                                    <DetailItem label="Cake Tag" value={order.cakeTag} />
                                    <DetailItem label="Name on Cake" value={order.nameOnCake} />
                                </>
                            )}
                            <DetailItem label="Notes" value={order.notes} />
                            {order.imageUrl && (
                                <div className="py-2">
                                    <div className="py-2">
                                        <p className="text-sm text-gray-500">Cake Image</p>
                                        <div className="relative mt-2">
                                            <img src={order.imageUrl} alt="Cake" className="rounded-lg w-full h-auto object-cover" />
                                            <button
                                                onClick={() => handleDownload(order.imageUrl)}
                                                className="absolute top-2 right-2 bg-white bg-opacity-75 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition"
                                                aria-label="Download image"
                                            >
                                                <Icon name="download" className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <DetailItem label="Price" value={`₹${order.price?.toLocaleString('en-IN') || 0}`} />
                            <DetailItem label="Advance Amount" value={`₹${order.advanceAmount?.toLocaleString('en-IN') || 0}`} />
                            <DetailItem label="Delivery Amount" value={`₹${order.deliveryAmount?.toLocaleString('en-IN') || 0}`} />
                            <DetailItem label="Delivery Date" value={new Date(order.orderDate + 'T00:00:00').toLocaleDateString('en-GB')} />
                            <DetailItem label="Delivery Time" value={order.deliveryTime} />
                            <DetailItem label="Collection Type" value={order.collectionType} />
                            <DetailItem label="Order Date" value={getOrderDate()} />
                        </div>
                    )}

                    <div className="flex items-center space-x-4 mt-6">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancelEdit} className="w-full bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !permissions?.orderManagement?.edit}
                                    className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition disabled:bg-green-300"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <>
                                {isCancellable && (
                                    <button onClick={() => setShowCancelConfirm(true)} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition">Cancel Order</button>
                                )}
                                <button onClick={onClose} className="w-full bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition">Close</button>
                            </>
                        )}
                    </div>
                </div>
                {showCancelConfirm && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col justify-center items-center p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-800 text-center mb-4">Are you sure you want to cancel this order?</h3>
                        <div className="flex space-x-4 w-full">
                            <button onClick={handleConfirmCancel} className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition">Yes, Cancel</button>
                            <button onClick={() => setShowCancelConfirm(false)} className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-400 transition">No</button>
                        </div>
                    </div>
                )}
            </div>
            {showImageWarning && (
                <ImageWarningModal
                    onCancel={() => setShowImageWarning(false)}
                    onProceed={() => {
                        setShowImageWarning(false);
                        fileInputRef.current.click();
                    }}
                />
            )}
        </div>
    );
};

const RequestDetailsModal = ({ request, onClose, setNotification }) => {
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [editableRejectionNote, setEditableRejectionNote] = useState(request.rejectionNote || '');
    const [isSavingNote, setIsSavingNote] = useState(false);

    const handleAccept = async (acceptanceData) => {
        try {
            const { id, name, phone, ...requestData } = request;
            const newOrderData = {
                ...requestData,
                clientName: name,
                phoneNumber: phone,
                price: Number(acceptanceData.price) || 0,
                advanceAmount: Number(acceptanceData.advance) || 0,
                deliveryAmount: Number(acceptanceData.deliveryAmount) || 0,
                status: 'Accepted',
                createdAt: new Date(),
            };

            if (request.latitude && request.longitude) {
                newOrderData.latitude = request.latitude;
                newOrderData.longitude = request.longitude;
            }

            // If it's a snack order, adjust the data for the orders collection
            if (request.type === 'snack') {
                newOrderData.cakeType = 'Snacks Order';
                newOrderData.sizeCount = `${request.items.length} items`;
                newOrderData.items = request.items; 
            }

            await addDoc(collection(db, "orders"), newOrderData);

            // Delete from the correct source collection
            const sourceCollection = request.type === 'snack' ? "snacks_requests" : "website_requests";
            await deleteDoc(doc(db, sourceCollection, id));

            setNotification({ type: 'success', message: 'Request accepted and order created.' });
            onClose();
        } catch (error) {
            console.error("Error accepting request:", error);
            setNotification({ type: 'error', message: 'Failed to accept request.' });
        }
    };

    const handleReject = async (rejectionData, requestToReject) => {
        try {
            const sourceCollection = requestToReject.type === 'snack' ? "snacks_requests" : "website_requests";
            await updateDoc(doc(db, sourceCollection, requestToReject.id), {
                status: 'Rejected',
                rejectionNote: rejectionData.note || '',
                updatedAt: new Date(),
            });

            // If the rejected request has an image URL, delete the image from Storage.
            if (requestToReject.imageUrl) {
                try {
                    const imageRef = ref(storage, requestToReject.imageUrl);
                    await deleteObject(imageRef);
                    console.log("Successfully deleted image for rejected order.");
                } catch (deleteError) {
                    // We log this error but don't stop the process.
                    // It's possible the image was already deleted or the URL was invalid. 
                    console.error("Could not delete image for rejected order:", deleteError);
                }
            } 
            setNotification({ type: 'success', message: 'Request rejected.' });
            onClose();
        } catch (error) {
            console.error("Error rejecting request:", error);
            setNotification({ type: 'error', message: 'Failed to reject request.' });
        }
    };

    const handleSaveRejectionNote = async () => {
        setIsSavingNote(true);
        try {
            const requestRef = doc(db, "website_requests", request.id);
            await updateDoc(requestRef, { rejectionNote: editableRejectionNote });
            setNotification({ type: 'success', message: 'Rejection reason updated.' });
            onClose();
        } catch (error) {
            console.error("Error updating rejection note:", error);
            setNotification({ type: 'error', message: 'Failed to save reason.' });
        } finally {
            setIsSavingNote(false);
        }
    };

    const DetailItem = ({ label, value }) => (
        <div className="py-2">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-md text-gray-800 break-words">{value || '-'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
                        <button onClick={onClose} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                            <Icon name="close" className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {request.type === 'snack' ? (
                            <>
                                <DetailItem label="Name" value={request.name} />
                                <DetailItem label="Phone" value={request.phone} />
                                <DetailItem label="WhatsApp Number" value={request.whatsapp} />
                                <div className="py-2">
                                    <p className="text-sm text-gray-500">Address</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-md text-gray-800 break-words">{request.address || '-'}</p>
                                        {request.latitude && request.longitude && (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors ml-2">
                                                <Icon name="map" className="h-5 w-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <DetailItem label="Items" value={request.items ? request.items.map(item => `${item.item} (${item.count})`).join(', ') : '-'} />
                                <DetailItem label="Collection Type" value={request.collectionType} />
                                <DetailItem label="Delivery Date" value={new Date(request.orderDate + 'T00:00:00').toLocaleDateString('en-GB')} />
                                <DetailItem label="Delivery Time" value={request.deliveryTime} />
                                <DetailItem label="Notes" value={request.notes} />
                            </>
                        ) : (
                            <>
                                <DetailItem label="Name" value={request.name} />
                                <DetailItem label="Phone" value={request.phone} />
                                <DetailItem label="WhatsApp Number" value={request.whatsapp} />
                                <div className="py-2">
                                    <p className="text-sm text-gray-500">Address</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-md text-gray-800 break-words">{request.address || '-'}</p>
                                        {request.latitude && request.longitude && (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors ml-2">
                                                <Icon name="map" className="h-5 w-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <DetailItem label="Cake Type" value={request.cakeType} />
                                <DetailItem label="Flavor" value={request.flavor} />
                                <DetailItem label="Size/Count" value={request.sizeCount} />
                                <DetailItem label="Cake Tag" value={request.cakeTag} />
                                <DetailItem label="Name on Cake" value={request.nameOnCake} />
                                <DetailItem label="Delivery Date" value={new Date(request.orderDate + 'T00:00:00').toLocaleDateString('en-GB')} />
                                <DetailItem label="Delivery Time" value={request.deliveryTime} />
                                <DetailItem label="Collection Type" value={request.collectionType} />
                                <DetailItem label="Notes" value={request.notes} />
                                {request.imageUrl && (
                                    <div>
                                        <p className="text-sm text-gray-500">Image</p>
                                        <img src={request.imageUrl} alt="Cake request" className="mt-2 rounded-lg w-full h-auto" />
                                    </div>
                                )}
                            </>
                        )}
                        {request.status === 'Rejected' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                                <textarea
                                    value={editableRejectionNote}
                                    onChange={(e) => setEditableRejectionNote(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg mt-1"
                                    rows="3"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4 mt-6">
                        {request.status === 'Pending' ? (
                             <>
                                <button onClick={() => setShowRejectModal(true)} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition">Reject</button>
                                <button onClick={() => setShowAcceptModal(true)} className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition">Accept</button>
                            </>
                        ) : request.status === 'Rejected' ? (
                            <button onClick={handleSaveRejectionNote} disabled={isSavingNote} className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300">
                                {isSavingNote ? 'Saving...' : 'Save Reason'}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
            {showAcceptModal && <AcceptConfirmationModal 
                onAccept={handleAccept} 
                onClose={() => setShowAcceptModal(false)} 
                initialPrice={request.totalAmount || ''} 
            />}
            {showRejectModal && <RejectConfirmationModal onReject={(rejectionData) => handleReject(rejectionData, request)} onClose={() => setShowRejectModal(false)} />}
        </div>
    );
};

const AcceptConfirmationModal = ({ onAccept, onClose, initialPrice = '' }) => {
    const [price, setPrice] = useState(initialPrice);
    const [advance, setAdvance] = useState('');
    const [deliveryAmount, setDeliveryAmount] = useState('');
    const [isAccepting, setIsAccepting] = useState(false);

    const handleConfirm = () => {
        setIsAccepting(true);
        onAccept({ price, advance, deliveryAmount });
    };
    
    const isAcceptDisabled = price === '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Acceptance</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Advance (₹)</label>
                        <input type="number" value={advance} onChange={e => setAdvance(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Delivery (₹)</label>
                        <input type="number" value={deliveryAmount} onChange={e => setDeliveryAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button onClick={handleConfirm} disabled={isAcceptDisabled || isAccepting} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-green-300">
                        {isAccepting ? 'Accepting...' : 'Accept'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RejectConfirmationModal = ({ onReject, onClose }) => {
    const [note, setNote] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const handleConfirm = () => {
        setIsRejecting(true);
        onReject({ note });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Rejection</h3>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a rejection note (optional)..." className="w-full p-2 border border-gray-300 rounded-lg mb-4" rows="3"></textarea>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button onClick={handleConfirm} disabled={isRejecting} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:bg-red-300">
                        {isRejecting ? 'Rejecting...' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const WebsiteRequestTable = ({ requests, onRowClick }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Cake/Snacks Type</th>
                    <th className="px-6 py-3">Size/Count</th>
                </tr>
            </thead>
            <tbody>
                {requests.length > 0 ? requests.map(req => (
                    <tr key={req.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick && onRowClick(req)}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                            <div className="flex items-center">
                                <span>{req.name}</span>
                                {req.isDuplicate && <DuplicateChip />}
                            </div>
                        </td>
                        <td className="px-6 py-4">{req.phone}</td>
                        <td className="px-6 py-4">
                            {req.type === 'snack' && req.items
                                ? req.items.map(i => i.item).join(', ')
                                : req.cakeType}
                        </td>
                        <td className="px-6 py-4">
                            {req.type === 'snack' && req.items
                                ? req.items.map(i => i.count).join(', ')
                                : req.sizeCount}
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan="4" className="text-center py-4 text-gray-500">No requests in this category.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const Notification = ({ notification, setNotification }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, setNotification]);

    if (!notification) return null;

    const bgColor = notification.type === 'success' ? 'bg-green-500' : (notification.type === 'info' ? 'bg-blue-500' : 'bg-red-500');

    return (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white px-6 py-3 rounded-lg shadow-lg z-50 ${bgColor}`}>
            {notification.message}
        </div>
    );
};

const ExpenseFilterModal = ({ initialFilters, onApply, onClose }) => {
    const [localFilters, setLocalFilters] = useState(initialFilters);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleResetInModal = () => {
        setLocalFilters({ month: '', startDate: '', endDate: '', searchQuery: '' });
    };

    const isDateRangeValid = (!localFilters.startDate && !localFilters.endDate) || (localFilters.startDate && localFilters.endDate);
    const isAnyFilterActive = localFilters.month || (localFilters.startDate && localFilters.endDate) || localFilters.searchQuery.trim() !== '';
    const isApplyDisabled = !isAnyFilterActive || !isDateRangeValid;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Filter Expenses</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><Icon name="close" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
                            <input type="month" name="month" value={localFilters.month} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date Range</label>
                            <div className="flex space-x-2">
                                <input type="date" name="startDate" value={localFilters.startDate} onChange={handleInputChange} className={`form-input rounded-lg shadow-sm w-full ${!localFilters.startDate && localFilters.endDate ? 'border-red-500' : 'border-gray-300'}`} />
                                <input type="date" name="endDate" value={localFilters.endDate} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 shadow-sm w-full" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Expense Name</label>
                            <input type="text" name="searchQuery" value={localFilters.searchQuery} onChange={handleInputChange} placeholder="Search expense name..." className="form-input rounded-lg border-gray-300 shadow-sm w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end items-center mt-6 space-x-4">
                        <button onClick={handleResetInModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Reset</button>
                        <button onClick={() => onApply(localFilters)} disabled={isApplyDisabled} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition disabled:bg-[#f2b8d9] disabled:cursor-not-allowed">Apply Filters</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExpensePage = ({ expenses, setNotification }) => {
    const [showForm, setShowForm] = useState(false); // Can be 'cake', 'snack', or null
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [filters, setFilters] = useState({ month: '', startDate: '', endDate: '', searchQuery: '' });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const filteredExpenses = useMemo(() => {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const isAnyFilterActive = filters.month || (filters.startDate && filters.endDate) || filters.searchQuery;

        return expenses.filter(expense => {
            const purchaseDate = new Date(expense.purchaseDate + 'T00:00:00');
            
            if (filters.month) {
                const [year, month] = filters.month.split('-');
                if (!(purchaseDate.getFullYear() === parseInt(year) && purchaseDate.getMonth() === parseInt(month) - 1)) {
                    return false;
                }
            }
            if (filters.startDate && filters.endDate) {
                const startDate = new Date(filters.startDate + 'T00:00:00');
                const endDate = new Date(filters.endDate + 'T00:00:00');
                if (purchaseDate < startDate || purchaseDate > endDate) {
                    return false;
                }
            }
            if (filters.searchQuery && !expense.expenseName.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
                return false;
            }
            
            if (!isAnyFilterActive) {
                return purchaseDate >= twelveMonthsAgo;
            }

            return true;
        });
    }, [expenses, filters]);

    const groupedExpenses = useMemo(() => {
        const sorted = [...filteredExpenses].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
        return sorted.reduce((acc, expense) => {
            const monthYear = new Date(expense.purchaseDate).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = [];
            acc[monthYear].push(expense);
            return acc;
        }, {});
    }, [filteredExpenses]);

    const handleReset = () => {
        setFilters({ month: '', startDate: '', endDate: '', searchQuery: '' });
    };
    
    const applyFilters = (newFilters) => {
        if (newFilters.month) {
            newFilters.startDate = '';
            newFilters.endDate = '';
        } else if (newFilters.startDate || newFilters.endDate) {
            newFilters.month = '';
        }
        setFilters(newFilters);
        setIsFilterModalOpen(false);
    };

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                return resolve();
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.body.appendChild(script);
        });
    };

    const exportToPDF = async () => {
        try {
            await loadScript("https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js");
            await loadScript("https://unpkg.com/jspdf-autotable@3.5.23/dist/jspdf.plugin.autotable.js");

            if (!window.jspdf) {
                setNotification({ type: 'error', message: 'PDF library failed to load.' });
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text("BLOOM BAKE - Expense Report", 14, 16);
            doc.autoTable({
                head: [['Name', 'Type', 'Amount (₹)', 'Purchase Date']],
                body: filteredExpenses.map(expense => [
                    expense.expenseName,
                    expense.expenseType,
                    expense.totalAmount || 0,
                    new Date(expense.purchaseDate).toLocaleDateString('en-GB')
                ]),
            });
            doc.save(`BLOOM_BAKE_Expenses_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            setNotification({ type: 'error', message: 'Could not export to PDF.' });
        }
        setIsExportMenuOpen(false);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Type', 'Amount', 'Purchase Date', 'Location', 'Notes'];
        const csvRows = [
            headers.join(','),
            ...filteredExpenses.map(expense => {
                const row = [
                    `"${expense.expenseName.replace(/"/g, '""')}"`,
                    expense.expenseType,
                    expense.totalAmount || 0,
                    new Date(expense.purchaseDate).toLocaleDateString('en-GB'),
                    `"${(expense.location || '').replace(/"/g, '""')}"`,
                    `"${(expense.notes || '').replace(/"/g, '""')}"`
                ];
                return row.join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `BLOOM_BAKE_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportMenuOpen(false);
    };

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50">
             {isFilterModalOpen && <ExpenseFilterModal initialFilters={filters} onApply={applyFilters} onClose={() => setIsFilterModalOpen(false)} />}
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Expense Management</h2>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition">
                            Add Expense
                        </button>
                    )}
                </div>
                {showForm && <NewExpenseForm setNotification={setNotification} onCancel={() => setShowForm(false)} />}

                <div className="bg-white p-4 rounded-xl shadow-lg mt-6">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <button onClick={() => setIsFilterModalOpen(true)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition">Filter</button>
                        <div className="relative">
                             <button onClick={() => setIsExportMenuOpen(prev => !prev)} disabled={filteredExpenses.length === 0} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-green-300">Export</button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <a href="#" onClick={exportToPDF} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as PDF</a>
                                    <a href="#" onClick={exportToCSV} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as Excel</a>
                                </div>
                            )}
                        </div>
                        <button onClick={handleReset} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition">Reset</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Expense Name</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(groupedExpenses).length > 0 ? (
                                    Object.entries(groupedExpenses).map(([monthYear, expensesInMonth]) => (
                                        <React.Fragment key={monthYear}>
                                            <tr className="bg-gray-200 sticky top-0">
                                                <th colSpan="3" className="px-6 py-2 text-left text-sm font-bold text-gray-800">{monthYear}</th>
                                            </tr>
                                            {expensesInMonth.map(expense => (
                                                <tr key={expense.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedExpense(expense)}>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{expense.expenseName}</td>
                                                    <td className="px-6 py-4">₹{expense.totalAmount.toLocaleString('en-IN')}</td>
                                                    <td className="px-6 py-4">{new Date(expense.purchaseDate).toLocaleDateString('en-GB')}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">No expenses found for the selected filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {selectedExpense && <ExpenseDetailsModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} setNotification={setNotification} />}
        </main>
    );
};

const NewExpenseForm = ({ setNotification, onCancel }) => {
    const [formData, setFormData] = useState({
        expenseName: '', expenseType: 'Raw Material', purchaseDate: new Date().toISOString().split('T')[0],
        location: '', totalAmount: '', notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await addDoc(collection(db, "expenses"), {
            ...formData,
            totalAmount: Number(formData.totalAmount) || 0,
        });
        setNotification({ type: 'success', message: 'Data Saved successfully' });
        onCancel();
    } catch (error) {
        console.error("Error adding expense:", error);
        setNotification({ type: 'error', message: 'Failed to save expense.' });
    } finally {
        setIsSubmitting(false);
    }
};
    const formInputClasses = "w-full p-3 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]";

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="expenseName" placeholder="Expense Name" onChange={handleInputChange} required className={formInputClasses} />
                    <select name="expenseType" onChange={handleInputChange} className={formInputClasses}>
                        <option>Raw Material</option>
                        <option>Asset</option>
                        <option>Miscellaneous</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} required className={formInputClasses} />
                    <input type="text" name="location" placeholder="Location of Purchase" onChange={handleInputChange} className={formInputClasses} />
                </div>
                <div className="mt-4">
                    <input type="number" name="totalAmount" placeholder="Total Amount (₹)" onChange={handleInputChange} required className={formInputClasses} />
                </div>
                <textarea name="notes" placeholder="Notes" onChange={handleInputChange} rows="3" className={`${formInputClasses} mt-4`}></textarea>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] disabled:bg-[#f2b8d9] transition">
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ExpenseDetailsModal = ({ expense, onClose, setNotification }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableExpense, setEditableExpense] = useState(expense);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableExpense(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const expenseRef = doc(db, "expenses", expense.id);
            const { id, ...dataToUpdate } = editableExpense;
            dataToUpdate.totalAmount = Number(dataToUpdate.totalAmount) || 0;
            await updateDoc(expenseRef, dataToUpdate);
            setNotification({ type: 'success', message: 'Expense updated successfully!' });
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error("Error updating expense:", error);
            setNotification({ type: 'error', message: 'Failed to update expense.' });
        } finally {
            setIsSaving(false);
        }
    };

    const DetailItem = ({ label, value }) => (
        <div className="py-2">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-md text-gray-800">{value || '-'}</p>
        </div>
    );

    const formInputClasses = "w-full p-2 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-1 focus:ring-[#f2b8d9]";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center text-center border-b pb-4 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Expense Details</h2>
                            <p className="text-xs text-gray-500">{expense.id}</p>
                        </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100">
                                <Icon name="edit" className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                         <div className="space-y-4">
                            <div><label className="text-sm font-medium text-gray-700">Expense Name</label><input type="text" name="expenseName" value={editableExpense.expenseName} onChange={handleInputChange} className={formInputClasses} /></div>
                            <div><label className="text-sm font-medium text-gray-700">Expense Type</label>
                                <select name="expenseType" value={editableExpense.expenseType} onChange={handleInputChange} className={formInputClasses}>
                                    <option>Raw Material</option><option>Asset</option><option>Miscellaneous</option><option>Other</option>
                                </select>
                            </div>
                            <div><label className="text-sm font-medium text-gray-700">Purchase Date</label><input type="date" name="purchaseDate" value={editableExpense.purchaseDate} onChange={handleInputChange} className={formInputClasses} /></div>
                            <div><label className="text-sm font-medium text-gray-700">Location</label><input type="text" name="location" value={editableExpense.location} onChange={handleInputChange} className={formInputClasses} /></div>
                            <div><label className="text-sm font-medium text-gray-700">Total Amount (₹)</label><input type="number" name="totalAmount" value={editableExpense.totalAmount} onChange={handleInputChange} className={formInputClasses} /></div>
                            <div><label className="text-sm font-medium text-gray-700">Notes</label><textarea name="notes" value={editableExpense.notes} onChange={handleInputChange} rows="2" className={formInputClasses}></textarea></div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <DetailItem label="Expense Name" value={expense.expenseName} />
                            <DetailItem label="Expense Type" value={expense.expenseType} />
                            <DetailItem label="Purchase Date" value={new Date(expense.purchaseDate).toLocaleDateString('en-GB')} />
                            <DetailItem label="Location" value={expense.location} />
                            <DetailItem label="Total Amount" value={`₹${expense.totalAmount?.toLocaleString('en-IN') || 0}`} />
                            <DetailItem label="Notes" value={expense.notes} />
                        </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-6">
                        {isEditing ? (
                            <>
                                <button onClick={() => { setIsEditing(false); setEditableExpense(expense); }} className="w-full bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                                <button onClick={handleSave} disabled={isSaving} className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition disabled:bg-green-300">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button onClick={onClose} className="w-full bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition">Close</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Product List Page Components ---

const EditItemModal = ({ item, collectionName, onClose, setNotification }) => {
    const [name, setName] = useState(item.name);
    const [description, setDescription] = useState(item.description || '');
    const [price, setPrice] = useState(item.price || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            setNotification({ type: 'error', message: 'Name cannot be empty.' });
            return;
        }
        setIsSaving(true);
        try {
            const itemRef = doc(db, collectionName, item.id);
            const updatedData = {
                name,
                description: description || ''
            };
            if (collectionName === 'snacks') {
                updatedData.price = Number(price) || 0;
            }
            await updateDoc(itemRef, updatedData);
            setNotification({ type: 'success', message: 'Item updated successfully!' });
            onClose();
        } catch (error) {
            console.error(`Error updating item in ${collectionName}:`, error);
            setNotification({ type: 'error', message: 'Failed to update item.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Item</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    {collectionName === 'snacks' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300">
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImageWarningModal = ({ onCancel, onProceed }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Replace Image?</h3>
            <p className="text-gray-600 mb-6">
                Uploading a new image will permanently remove the existing one. Are you sure you want to proceed?
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={onCancel}
                    className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onProceed}
                    className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition"
                >
                    Proceed
                </button>
            </div>
        </div>
    </div>
);

const DeleteItemModal = ({ item, collectionName, onClose, setNotification }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, collectionName, item.id));
            setNotification({ type: 'success', message: 'Item deleted successfully!' });
            onClose();
        } catch (error) {
            console.error(`Error deleting item from ${collectionName}:`, error);
            setNotification({ type: 'error', message: 'Failed to delete item.' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Are you sure?</h3>
                <p className="text-center text-gray-600 mb-4">Do you really want to delete "{item.name}"?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button onClick={handleDelete} disabled={isDeleting} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:bg-red-300">
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductSection = ({ title, items, collectionName, setNotification, isOpen, onToggle }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleSaveNewItem = async () => {
    if (!newItemName.trim()) {
        setNotification({ type: 'error', message: 'Name cannot be empty.' });
        return;
    }
    setIsSaving(true);
    try {
        const newItemData = {
            name: newItemName,
            description: newItemDescription || ''
        };
        if (collectionName === 'snacks') {
            newItemData.price = Number(newItemPrice) || 0;
        }
        await addDoc(collection(db, collectionName), newItemData);
        setNotification({ type: 'success', message: 'Item added successfully!' });
        setNewItemName('');
        setNewItemDescription('');
        setNewItemPrice(''); // Reset the price field
        setShowAddForm(false);
    } catch (error) {
        console.error(`Error adding item to ${collectionName}:`, error);
        setNotification({ type: 'error', message: 'Failed to add item.' });
    } finally {
        setIsSaving(false);
    }
};

    // Reset add form when section is closed
    useEffect(() => {
        if (!isOpen) {
            setShowAddForm(false);
            setNewItemName('');
            setNewItemDescription('');
        }
    }, [isOpen]);

    return (
        <div className="bg-white rounded-xl shadow-lg mb-4">
            <button onClick={onToggle} className="w-full flex justify-between items-center text-left p-4 text-xl font-bold text-gray-800">
                <span>{title} ({items.length})</span>
                <Icon name="chevron-down" className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="p-4 border-t border-gray-200">
                    <div className="mb-4">
                        {!showAddForm && (
                            <button onClick={() => setShowAddForm(true)} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition">
                                Add New
                            </button>
                        )}
                    </div>

                    {showAddForm && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New {title.slice(0, -1)} Name</label>
                                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea value={newItemDescription} onChange={(e) => setNewItemDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" rows="2" placeholder="Add a description..."></textarea>
                            </div>
                            {collectionName === 'snacks' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price</label>
                                    <input type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg"/>
                                </div>
                            )}

                            <div className="flex justify-end gap-4">
                                <button onClick={() => setShowAddForm(false)} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition">
                                    Cancel
                                </button>
                                <button onClick={handleSaveNewItem} disabled={isSaving} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-green-300">
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    {collectionName === 'snacks' && <th className="px-6 py-3">Price</th>}
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ? (
                                    items.map(item => (
                                        <tr key={item.id} className="bg-white border-b">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            {collectionName === 'snacks' && <td className="px-6 py-4">₹{item.price?.toLocaleString('en-IN') || 0}</td>}
                                            <td className="px-6 py-4 text-gray-600 whitespace-pre-wrap">{item.description || '-'}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => setItemToEdit(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Icon name="edit" className="h-5 w-5"/></button>
                                                <button onClick={() => setItemToDelete(item)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Icon name="delete" className="h-5 w-5"/></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">No items added yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {itemToEdit && <EditItemModal item={itemToEdit} collectionName={collectionName} onClose={() => setItemToEdit(null)} setNotification={setNotification} />}
            {itemToDelete && <DeleteItemModal item={itemToDelete} collectionName={collectionName} onClose={() => setItemToDelete(null)} setNotification={setNotification} />}
        </div>
    );
};

const ListProductPage = ({ products, flavors, snacks, setNotification }) => {
    const [openSection, setOpenSection] = useState('null');

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              
                <ProductSection 
                    title="Cake Types" 
                    items={products} 
                    collectionName="products" 
                    setNotification={setNotification}
                    isOpen={openSection === 'cakeTypes'}
                    onToggle={() => setOpenSection(openSection === 'cakeTypes' ? null : 'cakeTypes')}
                />

                <ProductSection 
                    title="Flavor Types" 
                    items={flavors} 
                    collectionName="flavors" 
                    setNotification={setNotification}
                    isOpen={openSection === 'flavorTypes'}
                    onToggle={() => setOpenSection(openSection === 'flavorTypes' ? null : 'flavorTypes')}
                />

                <ProductSection 
                    title="Snacks" 
                    items={snacks} 
                    collectionName="snacks" 
                    setNotification={setNotification}
                    isOpen={openSection === 'snacks'}
                    onToggle={() => setOpenSection(openSection === 'snacks' ? null : 'snacks')}
                />

            </div>
        </main>
    );
};

// --- Cake Designs Page Components (PASTE THIS ENTIRE SECTION) ---

const CakeDesignsPage = ({ cakeDesigns, products, flavors, setNotification }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { permissions } = usePermissions();

    useEffect(() => {
        const handlePopState = (event) => {
            // This event fires when the user hits the back button.
            // If the new state in history *doesn't* have our modal flag, it means we should close any open modals.
            if (!event.state?.modal) {
                setIsModalOpen(false);
                setIsDeleteModalOpen(false);
            }
        };

        // Add the listener when the component is on the screen.
        window.addEventListener('popstate', handlePopState);

        // Clean up the listener when the component is removed.
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []); // The empty array means this setup runs only once.

    const handleAddNew = () => {
        setSelectedDesign(null); // Ensure we are in "add" mode
        setIsModalOpen(true);
        history.pushState({ modal: 'design' }, '', window.location.href);
    };

    const handleEdit = (design) => {
        setSelectedDesign(design);
        setIsModalOpen(true);
        history.pushState({ modal: 'design' }, '', window.location.href);
    };

    const handleDelete = (design) => {
        setSelectedDesign(design);
        setIsDeleteModalOpen(true);
        history.pushState({ modal: 'delete' }, '', window.location.href);
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Cakes Gallery</h2>
                    {permissions?.cakeDesigns?.edit && (
                         <button onClick={handleAddNew} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] transition">
                            Add New Design
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {cakeDesigns.map((design) => (
                        <div key={design.id} className="bg-white rounded-xl shadow-lg overflow-hidden group">
                            <div className="relative">
                                <img src={design.imageUrl} alt={design.designName} className="w-full h-48 object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                                   {permissions?.cakeDesigns?.edit && (
                                     <>
                                        <button onClick={() => handleEdit(design)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                                            <Icon name="edit" className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(design)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                                            <Icon name="delete" className="h-5 w-5" />
                                        </button>
                                     </>
                                   )}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 truncate">{design.designName}</h3>
                                <p className="text-sm text-gray-600">{design.cakeType} - {design.flavor}</p>
                                <p className="text-sm text-gray-500">{design.sizeCount}</p>
                                <p className="mt-2 font-semibold text-lg text-[#a10a62]">₹{design.price?.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 {cakeDesigns.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                        <p className="text-gray-500">No cake designs have been added yet.</p>
                        <p className="text-gray-400 text-sm mt-2">Click "Add New Design" to get started.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <DesignModal
                    design={selectedDesign}
                    onClose={() => {
                            // If the current history state is a modal, go back. Otherwise, just close it.
                            if (history.state?.modal) {
                                history.back();
                            } else {
                                setIsModalOpen(false);
                            }
                        }}
                    setNotification={setNotification}
                    products={products}
                    flavors={flavors}
                />
            )}
            {isDeleteModalOpen && (
                 <DeleteDesignModal
                    design={selectedDesign}
                    onClose={() => {
                            if (history.state?.modal) {
                                history.back();
                            } else {
                                setIsDeleteModalOpen(false);
                            }
                        }}
                    setNotification={setNotification}
                />
            )}
        </main>
    );
};

const DesignModal = ({ design, onClose, setNotification, products, flavors }) => {
    const [formData, setFormData] = useState({
        designName: design?.designName || '',
        cakeType: design?.cakeType || '',
        flavor: design?.flavor || '',
        sizeCount: design?.sizeCount || '',
        price: design?.price || '',
        description: design?.description || '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.designName || !formData.cakeType || !formData.flavor || !formData.price) {
            setNotification({ type: 'error', message: 'Please fill out all required fields.' });
            return;
        }
        if (!design && !imageFile) {
            setNotification({ type: 'error', message: 'Please upload an image for the new design.' });
            return;
        }

        setIsSaving(true);
        try {
            let imageUrl = design?.imageUrl || '';
            if (imageFile) {
                const options = {
                    maxSizeMB: 0.15,          // Target file size of 150KB
                    maxWidthOrHeight: 1280,     // Resize the longest side to 1280px for good quality
                    useWebWorker: true,
                    fileType: 'image/webp',   // THIS IS THE KEY: Convert the output to WebP format
                    initialQuality: 0.8       // Set the WebP quality (0.8 is a great starting point)
                    };
                const compressedFile = await imageCompression(imageFile, options);

                // Force refresh the user's auth token to prevent timing issues
                if (auth.currentUser) {
                    await auth.currentUser.getIdToken(true);
                }

                const storageRef = ref(storage, `cake_designs/${Date.now()}_${compressedFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, compressedFile);

                imageUrl = await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            if (design?.imageUrl) {
                                try {
                                    await deleteObject(ref(storage, design.imageUrl));
                                } catch (deleteError) {
                                    console.error("Old image deletion failed, it might not exist:", deleteError);
                                }
                            }
                            resolve(downloadURL);
                        }
                    );
                });
            }
            
            const dataToSave = {
                ...formData,
                price: Number(formData.price),
                imageUrl: imageUrl,
                createdAt: design?.createdAt || new Date(),
            };

            if (design) {
                await updateDoc(doc(db, "cake_designs", design.id), dataToSave);
            } else {
                await addDoc(collection(db, "cake_designs"), dataToSave);
            }

            setNotification({ type: 'success', message: `Design ${design ? 'updated' : 'saved'} successfully!` });
            onClose();

        } catch (error) {
            console.error("Error saving design: ", error);
            setNotification({ type: 'error', message: 'Failed to save design.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const formInputClasses = "w-full p-3 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSave}>
                    <h3 className="text-xl font-bold text-gray-800 mb-6">{design ? 'Edit Cake Design' : 'Add New Cake Design'}</h3>
                    <div className="space-y-4">
                         <input type="text" name="designName" placeholder="Design Name" value={formData.designName} onChange={handleInputChange} required className={formInputClasses} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SearchableDropdown name="cakeType" options={products} value={formData.cakeType} onChange={handleInputChange} placeholder="Cake Type" />
                            <SearchableDropdown name="flavor" options={flavors} value={formData.flavor} onChange={handleInputChange} placeholder="Flavor" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="sizeCount" placeholder="Size/Count (e.g., 1kg)" value={formData.sizeCount} onChange={handleInputChange} required className={formInputClasses} />
                            <input type="number" name="price" placeholder="Price (₹)" value={formData.price} onChange={handleInputChange} required className={formInputClasses} />
                        </div>
                        <textarea name="description" placeholder="Description..." value={formData.description} onChange={handleInputChange} rows="3" className={formInputClasses}></textarea>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">{design?.imageUrl ? 'Replace Image' : 'Upload Image'}</label>
                             <input type="file" onChange={(e) => setImageFile(e.target.files[0])} accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" />
                             {(design?.imageUrl || imageFile) && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : design.imageUrl} alt="preview" className="mt-2 rounded-lg w-32 h-32 object-cover"/>
                                </div>
                             )}
                            {isSaving && imageFile && <progress value={uploadProgress} max="100" className="w-full mt-2" />}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button type="submit" disabled={isSaving} className="bg-[#be0b73] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#a10a62] disabled:bg-[#f2b8d9] transition">
                            {isSaving ? 'Saving...' : 'Save Design'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteDesignModal = ({ design, onClose, setNotification }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete the Firestore document
            await deleteDoc(doc(db, "cake_designs", design.id));
            
            // Delete the image from Storage
            if (design.imageUrl) {
                 await deleteObject(ref(storage, design.imageUrl));
            }

            setNotification({ type: 'success', message: 'Design deleted successfully!' });
            onClose();
        } catch (error) {
            console.error("Error deleting design:", error);
            setNotification({ type: 'error', message: 'Failed to delete design.' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Are you sure?</h3>
                <p className="text-center text-gray-600 mb-4">Do you really want to delete "{design.designName}"? This action cannot be undone.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                    <button onClick={handleDelete} disabled={isDeleting} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:bg-red-300">
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SalesSection = ({ title, items, salesData, monthHeaders, isOpen, onToggle }) => (
    <div className="bg-white rounded-xl shadow-lg mb-4">
        <button onClick={onToggle} className="w-full flex justify-between items-center text-left p-4 text-xl font-bold text-gray-800">
            <span>{title}</span>
            <Icon name="chevron-down" className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="p-4 border-t border-gray-200 overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 sticky left-0 bg-gray-100 z-10 w-48">Name</th>
                            {monthHeaders.map(header => <th key={header.key} className="px-6 py-3 text-center">{header.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10 w-48">
                                    {item.name} ({salesData[item.name]?.total || 0})
                                </td>
                                {monthHeaders.map(header => (
                                    <td key={header.key} className="px-6 py-4 text-center">
                                        {salesData[item.name]?.[header.key] || 0}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const ProductSalesPage = ({ orders, products, flavors, snacks }) => {
    const [openSection, setOpenSection] = useState('null');

const { pastMonthHeaders, cakeSalesData, flavorSalesData, snackSalesData, totalCakeSales, totalFlavorSales, totalSnackSales } = useMemo(() => {
    const now = new Date();
    const headers = [];
    for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        headers.push({
            key: `${date.getFullYear()}-${date.getMonth()}`,
            name: date.toLocaleString('default', { month: 'short', year: '2-digit' })
        });
    }
    headers.reverse();

    const sales = {};
    const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.orderDate);

    deliveredOrders.forEach(order => {
        const orderDate = new Date(order.orderDate + 'T00:00:00');
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

        if (headers.some(h => h.key === monthKey)) {
            // We will check both cakeType and flavor for potential snack items
            [order.cakeType, order.flavor].forEach(itemType => {
                if (itemType) {
                    if (!sales[itemType]) sales[itemType] = { total: 0 };
                    if (!sales[itemType][monthKey]) sales[itemType][monthKey] = 0;
                    sales[itemType][monthKey]++;
                    sales[itemType].total++;
                }
            });
        }
    });

    const cakeData = Object.fromEntries(Object.entries(sales).filter(([key]) => products.some(p => p.name === key)));
    const flavorData = Object.fromEntries(Object.entries(sales).filter(([key]) => flavors.some(f => f.name === key)));
    const snackData = Object.fromEntries(Object.entries(sales).filter(([key]) => snacks.some(s => s.name === key)));

    const totalCakes = Object.values(cakeData).reduce((sum, item) => sum + item.total, 0);
    const totalFlavors = Object.values(flavorData).reduce((sum, item) => sum + item.total, 0);
    const totalSnacks = Object.values(snackData).reduce((sum, item) => sum + item.total, 0);

    return { pastMonthHeaders: headers, cakeSalesData: cakeData, flavorSalesData: flavorData, snackSalesData: snackData, totalCakeSales: totalCakes, totalFlavorSales: totalFlavors, totalSnackSales: totalSnacks };
}, [orders, products, flavors, snacks]);

const { upcomingMonthHeaders, upcomingCakeData, upcomingFlavorData, upcomingSnackData, totalUpcomingCakes, totalUpcomingFlavors, totalUpcomingSnacks } = useMemo(() => {
    const now = new Date();
    const headers = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
         headers.push({
            key: `${date.getFullYear()}-${date.getMonth()}`,
            name: date.toLocaleString('default', { month: 'short', year: '2-digit' })
        });
    }

    const sales = {};
    const upcomingOrders = orders.filter(o => (o.status === 'Accepted' || o.status === 'Baking') && o.orderDate);

    upcomingOrders.forEach(order => {
        const orderDate = new Date(order.orderDate + 'T00:00:00');
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;

         if (headers.some(h => h.key === monthKey)) {
            [order.cakeType, order.flavor].forEach(itemType => {
                if (itemType) {
                    if (!sales[itemType]) sales[itemType] = { total: 0 };
                    if (!sales[itemType][monthKey]) sales[itemType][monthKey] = 0;
                    sales[itemType][monthKey]++;
                    sales[itemType].total++;
                }
            });
        }
    });

    const cakeData = Object.fromEntries(Object.entries(sales).filter(([key]) => products.some(p => p.name === key)));
    const flavorData = Object.fromEntries(Object.entries(sales).filter(([key]) => flavors.some(f => f.name === key)));
    const snackData = Object.fromEntries(Object.entries(sales).filter(([key]) => snacks.some(s => s.name === key)));

    const totalCakes = Object.values(cakeData).reduce((sum, item) => sum + item.total, 0);
    const totalFlavors = Object.values(flavorData).reduce((sum, item) => sum + item.total, 0);
    const totalSnacks = Object.values(snackData).reduce((sum, item) => sum + item.total, 0);

    return { upcomingMonthHeaders: headers, upcomingCakeData: cakeData, upcomingFlavorData: flavorData, upcomingSnackData: snackData, totalUpcomingCakes: totalCakes, totalUpcomingFlavors: totalFlavors, totalUpcomingSnacks: totalSnacks };
}, [orders, products, flavors, snacks]);


    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Sales</h2>
                 <SalesSection
                    title={`Upcoming Cake Types (${totalUpcomingCakes})`}
                    items={products}
                    salesData={upcomingCakeData}
                    monthHeaders={upcomingMonthHeaders}
                    isOpen={openSection === 'upcomingCakes'}
                    onToggle={() => setOpenSection(openSection === 'upcomingCakes' ? null : 'upcomingCakes')}
                />
                 <SalesSection
                    title={`Upcoming Flavors (${totalUpcomingFlavors})`}
                    items={flavors}
                    salesData={upcomingFlavorData}
                    monthHeaders={upcomingMonthHeaders}
                    isOpen={openSection === 'upcomingFlavors'}
                    onToggle={() => setOpenSection(openSection === 'upcomingFlavors' ? null : 'upcomingFlavors')}
                />
                <SalesSection
                    title={`Upcoming Snacks (${totalUpcomingSnacks})`}
                    items={snacks}
                    salesData={upcomingSnackData}
                    monthHeaders={upcomingMonthHeaders}
                    isOpen={openSection === 'upcomingSnacks'}
                    onToggle={() => setOpenSection(openSection === 'upcomingSnacks' ? null : 'upcomingSnacks')}
                />

                <h2 className="text-2xl font-bold text-gray-800 my-6">Last 6 Months Sales</h2>
                <SalesSection
                    title={`Cake Type Sales (${totalCakeSales})`}
                    items={products}
                    salesData={cakeSalesData}
                    monthHeaders={pastMonthHeaders}
                    isOpen={openSection === 'productSales'}
                    onToggle={() => setOpenSection(openSection === 'productSales' ? null : 'productSales')}
                />
                <SalesSection
                    title={`Flavor Type Sales (${totalFlavorSales})`}
                    items={flavors}
                    salesData={flavorSalesData}
                    monthHeaders={pastMonthHeaders}
                    isOpen={openSection === 'flavorSales'}
                    onToggle={() => setOpenSection(openSection === 'flavorSales' ? null : 'flavorSales')}
                />
                <SalesSection
                    title={`Snack Sales (${totalSnackSales})`}
                    items={snacks}
                    salesData={snackSalesData}
                    monthHeaders={pastMonthHeaders}
                    isOpen={openSection === 'snackSales'}
                    onToggle={() => setOpenSection(openSection === 'snackSales' ? null : 'snackSales')}
                />
            </div>
        </main>
    );
};

const ProfitSummaryPage = ({ orders, expenses }) => {
    const [filterType, setFilterType] = useState('monthly'); // or 'yearly'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const summaryData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');
        const data = {};

        const processEntry = (dateStr, amount, type) => {
            const date = new Date(dateStr.replace(/-/g, '/'));
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = filterType === 'monthly' ? `${year}-${month}` : `${year}`;
            
            if (!data[key]) {
                data[key] = { sales: 0, delivery: 0, expense: 0, profit: 0, orderCount: 0 };
                 if (filterType === 'monthly') {
                    data[key].name = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                } else {
                    data[key].name = year.toString();
                }
            }

            if (type === 'order') {
                data[key].sales += amount.price || 0;
                data[key].delivery += amount.deliveryAmount || 0;
                data[key].orderCount++;
            } else if (type === 'expense') {
                data[key].expense += amount.totalAmount || 0;
            }
        };

        deliveredOrders.forEach(order => processEntry(order.orderDate, order, 'order'));
        expenses.forEach(expense => processEntry(expense.purchaseDate, expense, 'expense'));
        
        Object.values(data).forEach(item => {
            item.profit = (item.sales + item.delivery) - item.expense;
        });

        const sortedData = Object.values(data).sort((a, b) => {
            if (filterType === 'yearly') {
                return parseInt(b.name) - parseInt(a.name);
            }
            const dateA = new Date(a.name.replace(/(\w+) (\d+)/, '$1 1, $2'));
            const dateB = new Date(b.name.replace(/(\w+) (\d+)/, '$1 1, $2'));
            return dateB - dateA;
        });
        
        if(filterType === 'monthly') {
            return sortedData.filter(item => new Date(item.name).getFullYear() === selectedYear);
        }

        return sortedData;

    }, [orders, expenses, filterType, selectedYear]);
    
    const availableYears = useMemo(() => {
        const years = new Set();
        orders.forEach(o => { if(o.orderDate) years.add(new Date(o.orderDate).getFullYear()) });
        expenses.forEach(e => { if(e.purchaseDate) years.add(new Date(e.purchaseDate).getFullYear()) });
        return Array.from(years).sort((a, b) => b - a);
    }, [orders, expenses]);

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profit Summary</h2>
                
                <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex flex-wrap items-center gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mr-2">View By:</label>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="form-select rounded-lg border-gray-300">
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    {filterType === 'monthly' && (
                         <div>
                            <label className="text-sm font-medium text-gray-700 mr-2">Year:</label>
                            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="form-select rounded-lg border-gray-300">
                                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3">{filterType === 'monthly' ? 'Month' : 'Year'}</th>
                                    <th className="px-6 py-3 text-right">Sales (₹)</th>
                                    <th className="px-6 py-3 text-right">Delivery (₹)</th>
                                    <th className="px-6 py-3 text-right">Expense (₹)</th>
                                    <th className="px-6 py-3 text-right">Profit (₹)</th>
                                    <th className="px-6 py-3 text-center">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.length > 0 ? (
                                    summaryData.map(item => (
                                        <tr key={item.name} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-right">{item.sales.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-right">{item.delivery.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-right text-red-600">{item.expense.toLocaleString('en-IN')}</td>
                                            <td className={`px-6 py-4 text-right font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.profit.toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4 text-center">{item.orderCount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No data available for the selected period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};

// --- Review Page Components ---
const ReviewTable = ({ reviewList, isPending = false, handleStatusUpdate }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Rating</th>
                    <th className="px-6 py-3">Comment</th>
                    {isPending && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
            </thead>
            <tbody>
                {reviewList.length > 0 ? (
                    reviewList.map(review => (
                        <tr key={review.id} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium text-gray-900">{review.name}</td>
                            <td className="px-6 py-4">{review.rating} / 5</td>
                            <td className="px-6 py-4">{review.comment}</td>
                            {isPending && (
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleStatusUpdate(review.id, 'Accepted')} className="bg-green-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-600 transition text-xs">Accept</button>
                                    <button onClick={() => handleStatusUpdate(review.id, 'Rejected')} className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-red-600 transition text-xs">Reject</button>
                                </td>
                            )}
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={isPending ? 4 : 3} className="text-center py-8 text-gray-500">No reviews in this category.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const SeeAllReviewsModal = ({ title, reviews, onClose, handleStatusUpdate }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                    <Icon name="close" className="h-6 w-6" />
                </button>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                <ReviewTable reviewList={reviews} handleStatusUpdate={handleStatusUpdate} />
            </div>
        </div>
    </div>
);


const ReviewPage = ({ reviews, setNotification }) => {
    const [openSection, setOpenSection] = useState('pending');
    const [isSeeAllAcceptedOpen, setIsSeeAllAcceptedOpen] = useState(false);
    const [isSeeAllRejectedOpen, setIsSeeAllRejectedOpen] = useState(false);

    const { pendingReviews, acceptedReviews, rejectedReviews, recentAccepted, recentRejected } = useMemo(() => {
        const pending = reviews.filter(r => r.status === 'Pending');
        const accepted = reviews.filter(r => r.status === 'Accepted');
        const rejected = reviews.filter(r => r.status === 'Rejected');

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const todayStr = getLocalDateString(today);
        const yesterdayStr = getLocalDateString(yesterday);

        const filterRecent = (review) => {
            const timestamp = review.updatedAt || review.createdAt;
            if (!timestamp?.seconds) return false;
            const reviewDateStr = getLocalDateString(new Date(timestamp.seconds * 1000));
            return reviewDateStr === todayStr || reviewDateStr === yesterdayStr;
        };

        const recentAccepted = accepted.filter(filterRecent);
        const recentRejected = rejected.filter(filterRecent);

        return { pendingReviews: pending, acceptedReviews: accepted, rejectedReviews: rejected, recentAccepted, recentRejected };
    }, [reviews]);

    const handleStatusUpdate = async (reviewId, newStatus) => {
        try {
            const reviewRef = doc(db, "reviews", reviewId);
            await updateDoc(reviewRef, { 
                status: newStatus,
                updatedAt: new Date()
            });
            setNotification({ type: 'success', message: `Review status updated to ${newStatus}.` });
        } catch (error) {
            console.error("Error updating review status:", error);
            setNotification({ type: 'error', message: 'Failed to update review status.' });
        }
    };

    const ReviewAccordionSection = ({ title, count, sectionId, children, onSeeAll }) => (
        <div className="bg-white rounded-xl shadow-lg mb-4">
            <button onClick={() => setOpenSection(openSection === sectionId ? null : sectionId)} className="w-full flex justify-between items-center text-left p-4 text-xl font-bold text-gray-800">
                <span>{title} ({count})</span>
                <Icon name="chevron-down" className={`transform transition-transform ${openSection === sectionId ? 'rotate-180' : ''}`} />
            </button>
            {openSection === sectionId && (
                <div className="p-4 border-t border-gray-200">
                    {onSeeAll && (
                         <div className="flex justify-end mb-4">
                            <button onClick={onSeeAll} className="bg-gray-200 text-gray-800 font-bold py-1 px-3 rounded-lg hover:bg-gray-300 transition text-sm">
                                See All
                            </button>
                        </div>
                    )}
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Management</h2>
                <ReviewAccordionSection title="Pending Reviews" count={pendingReviews.length} sectionId="pending">
                    <ReviewTable reviewList={pendingReviews} isPending={true} handleStatusUpdate={handleStatusUpdate} />
                </ReviewAccordionSection>

                <ReviewAccordionSection title="Accepted Reviews" count={recentAccepted.length} sectionId="accepted" onSeeAll={() => setIsSeeAllAcceptedOpen(true)}>
                    <ReviewTable reviewList={recentAccepted} />
                </ReviewAccordionSection>

                <ReviewAccordionSection title="Rejected Reviews" count={recentRejected.length} sectionId="rejected" onSeeAll={() => setIsSeeAllRejectedOpen(true)}>
                    <ReviewTable reviewList={recentRejected} />
                </ReviewAccordionSection>
            </div>
            {isSeeAllAcceptedOpen && <SeeAllReviewsModal title="All Accepted Reviews" reviews={acceptedReviews} onClose={() => setIsSeeAllAcceptedOpen(false)} handleStatusUpdate={handleStatusUpdate} />}
            {isSeeAllRejectedOpen && <SeeAllReviewsModal title="All Rejected Reviews" reviews={rejectedReviews} onClose={() => setIsSeeAllRejectedOpen(false)} handleStatusUpdate={handleStatusUpdate} />}
        </main>
    );
};

// --- Login Page Component ---
const LoginPage = ({ setNotification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login error:", error);
            setNotification({ type: 'error', message: 'Incorrect email or password.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!email) {
            setNotification({ type: 'error', message: 'Please enter your email address.' });
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setNotification({ type: 'success', message: 'Password reset email sent. Check your inbox.' });
            setIsResetMode(false); // Switch back to the login view
        } catch (error) {
            console.error("Password reset error:", error);
            setNotification({ type: 'error', message: 'Could not send reset email. Please check the address.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error)
         {
            console.error("Google Sign-In error:", error);
            setNotification({ type: 'error', message: 'Could not sign in with Google.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center items-center mb-6">
                    <img src="/3D logo.png" alt="Bloom Bake Logo" className="h-20 w-20 object-contain transform translate-y-2" />
                    <h1 className="text-4xl font-bold text-[#be0b73] ml-2">BLOOM BAKE</h1>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    {isResetMode ? (
                        <>
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Reset Password</h2>
                            <form onSubmit={handlePasswordReset}>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Enter your Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#be0b73] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#a10a62] disabled:bg-[#f2b8d9] transition-colors duration-300"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Email'}
                                </button>
                                <div className="text-center mt-4">
                                    <button type="button" onClick={() => setIsResetMode(false)} className="text-sm text-blue-600 hover:underline">
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Login</h2>
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-3 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                            >
                                <Icon name="google" className="h-6 w-6" />
                                Sign in with Google
                            </button>
                            <div className="my-6 flex items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>
                            <form onSubmit={handleLogin}>
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]"
                                        required
                                    />
                                </div>
                                <div className="mb-6 relative">
                                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#be0b73] focus:ring-2 focus:ring-[#f2b8d9]"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                    >
                                        <Icon name={showPassword ? "eye-off" : "eye"} className="h-5 w-5" />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#be0b73] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#a10a62] disabled:bg-[#f2b8d9] transition-colors duration-300"
                                >
                                    {isLoading ? 'Verifying...' : 'Login'}
                                </button>
                                <div className="text-center mt-4">
                                    <button type="button" onClick={() => setIsResetMode(true)} className="text-sm text-blue-600 hover:underline">
                                        Forgot Password?
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orders, setOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [websiteRequests, setWebsiteRequests] = useState([]);
    const [products, setProducts] = useState([]);
    const [flavors, setFlavors] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [snacks, setSnacks] = useState([]);
    const [websiteSnackRequests, setWebsiteSnackRequests] = useState([]);
    const [notification, setNotification] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const { permissions, loading } = usePermissions();
    const [cakeDesigns, setCakeDesigns] = useState([]);

    const handleOpenOrderDetails = (order) => {
        // Set the state to show the modal
        setSelectedOrder(order);
        // Push a new state to the browser's history to represent the open modal
        history.pushState({ ...history.state, orderId: order.id }, '', window.location.href);
    };

    const handleNavigation = (page) => {
        if (page !== currentPage) {
            setCurrentPage(page);
            // Add a new entry to the browser's history
            history.pushState({ page: page }, '', `#${page}`);
        }
    };

// --- REVISED useEffect HOOKS ---

    // This effect handles the authentication state
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js";
        script.async = true;
        document.body.appendChild(script);

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        return () => {
            document.body.removeChild(script);
            unsubscribeAuth();
        };
    }, []); // This should have an empty dependency array to run only once

    // This effect handles fetching data ONLY when the user is logged in
    useEffect(() => {
        // If not logged in, do nothing.
        if (!isLoggedIn) return;

        // Set up all your data listeners here
        const qOrders = query(collection(db, "orders"));
        const unsubscribeOrders = onSnapshot(qOrders, (querySnapshot) => {
            // ... (your existing order processing logic) ...
            const phoneFirstOrderDate = new Map();
            const ordersData = [];
             querySnapshot.forEach((doc) => {
                ordersData.push({ id: doc.id, ...doc.data() });
            });
            ordersData.forEach(order => {
                if (order.phoneNumber && order.createdAt?.seconds) {
                    const currentFirstDate = phoneFirstOrderDate.get(order.phoneNumber);
                    if (!currentFirstDate || order.createdAt.seconds < currentFirstDate) {
                        phoneFirstOrderDate.set(order.phoneNumber, order.createdAt.seconds);
                    }
                }
            });
            const processedOrders = ordersData.map(order => {
                let isExistingCustomer = false;
                if (order.phoneNumber && order.createdAt?.seconds) {
                    const firstDate = phoneFirstOrderDate.get(order.phoneNumber);
                    isExistingCustomer = order.createdAt.seconds > firstDate;
                }
                return { ...order, isExistingCustomer };
            });
            setOrders(processedOrders);
        });

        const qExpenses = query(collection(db, "expenses"));
        const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
            setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qRequests = query(collection(db, "website_requests"));
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            setWebsiteRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qProducts = query(collection(db, "products"));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qFlavors = query(collection(db, "flavors"));
        const unsubscribeFlavors = onSnapshot(qFlavors, (snapshot) => {
            setFlavors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qReviews = query(collection(db, "reviews"));
        const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qSnacks = query(collection(db, "snacks"));
        const unsubscribeSnacks = onSnapshot(qSnacks, (snapshot) => {
            setSnacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qSnackRequests = query(collection(db, "snacks_requests"));
        const unsubscribeSnackRequests = onSnapshot(qSnackRequests, (snapshot) => {
            setWebsiteSnackRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qDesigns = query(collection(db, "cake_designs"));
        const unsubscribeDesigns = onSnapshot(qDesigns, (snapshot) => {
            setCakeDesigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // This is the cleanup function for the data listeners
        return () => {
            unsubscribeOrders();
            unsubscribeExpenses();
            unsubscribeRequests();
            unsubscribeProducts();
            unsubscribeFlavors();
            unsubscribeReviews();
            unsubscribeSnacks();
            unsubscribeSnackRequests();
            unsubscribeDesigns();
        };
    }, [isLoggedIn]); // This effect depends on the login state

    // In your App component
    useEffect(() => {
        // This function runs when the user clicks the browser's back button
        const handlePopState = (event) => {
        // If the modal is currently open but the new history state doesn't have an orderId,
        // it means the user pressed 'back' to close the modal.
        if (selectedOrder && !event.state?.orderId) {
            setSelectedOrder(null);
        }

        // This part handles the page navigation as before
        const page = event.state?.page || 'dashboard';
        setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);

    // On initial load, set the history state without creating a new entry
    history.replaceState({ page: currentPage }, '', `#${currentPage}`);

    // Cleanup function to remove the listener
    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
    }, [selectedOrder]); // Empty array means this runs only once on mount

    const pendingRequestCount = useMemo(() => {
        const cakeCount = websiteRequests.filter(r => r.status === 'Pending').length;
        const snackCount = websiteSnackRequests.filter(r => r.status === 'Pending').length;
        return cakeCount + snackCount;
    }, [websiteRequests, websiteSnackRequests]);

    const pendingReviewCount = useMemo(() => reviews.filter(r => r.status === 'Pending').length, [reviews]);

    if (!isLoggedIn) {
        return (
            <>
                <LoginPage setNotification={setNotification} />
                <Notification notification={notification} setNotification={setNotification} />
            </>
        );
    }

    const renderPage = () => {

        if (!permissions?.[currentPage]?.view) {
            return (
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                    <p>You do not have permission to view this page.</p>
                </div>
            );
        }

        switch (currentPage) {
            case 'createOrder':
                return <CreateOrderPage orders={orders} websiteRequests={websiteRequests} websiteSnackRequests={websiteSnackRequests} setNotification={setNotification} handleOpenOrderDetails={handleOpenOrderDetails} products={products} flavors={flavors} snacks={snacks} />;
            case 'orderManagement':
                return <OrderManagementPage orders={orders} setNotification={setNotification} handleOpenOrderDetails={handleOpenOrderDetails} products={products} flavors={flavors} snacks={snacks} />;
            case 'profitSummary':
                return <ProfitSummaryPage orders={orders} expenses={expenses} />;
            case 'expense':
                return <ExpensePage expenses={expenses} setNotification={setNotification} />;
            case 'todaysOrder':
                return <TodaysOrderPage orders={orders} setNotification={setNotification} handleOpenOrderDetails={handleOpenOrderDetails} />;
            case 'listProduct':
                return <ListProductPage products={products} flavors={flavors} snacks={snacks} setNotification={setNotification}/>;
            case 'productSales':
                return <ProductSalesPage orders={orders} products={products} flavors={flavors} snacks={snacks} />;
            case 'cakeDesigns':
                return <CakeDesignsPage cakeDesigns={cakeDesigns} products={products} flavors={flavors} setNotification={setNotification} />;
            case 'userManagement':
                return <UserManagementPage />;
            case 'review':
                return <ReviewPage reviews={reviews} setNotification={setNotification} />;
            case 'dashboard':
            default:
                return <DashboardPage orders={orders} expenses={expenses} />;
        }
    };

    // Add this new function inside the App component
const handleCloseOrderDetails = () => {
    // Check if the current history state is for an open modal
    if (history.state?.orderId) {
        // Go back in history, which will trigger the popstate listener to close the modal
        history.back();
    } else {
        // As a fallback, just close the modal if history state is somehow not set
        setSelectedOrder(null);
    }
};

    return (
        <div className="min-h-screen bg-gray-50">
             <style>{`
                .flip-card {
                    background-color: transparent;
                    width: 100%;
                    min-height: 112px; /* This is the key change (h-28 in Tailwind) */
                    perspective: 1000px;
                    cursor: pointer;
                }
                .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    text-align: center;
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                .flip-card-inner.is-flipped {
                    transform: rotateY(180deg);
                }
                .flip-card-front, .flip-card-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    -webkit-backface-visibility: hidden; /* Safari */
                    backface-visibility: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .flip-card-back {
                    transform: rotateY(180deg);
                }
            `}</style>
            <Header onMenuClick={() => setIsMenuOpen(!isMenuOpen)} setCurrentPage={handleNavigation} />
            <div className="relative flex">
                <Sidebar 
                    currentPage={currentPage} 
                    setCurrentPage={handleNavigation} 
                    isOpen={isMenuOpen} 
                    setIsOpen={setIsMenuOpen} 
                    pendingRequestCount={pendingRequestCount}
                    pendingReviewCount={pendingReviewCount}
                />
                <div className="flex-1 overflow-x-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <p>Loading...</p>
                        </div>
                    ) : (
                        renderPage()
                    )}
                </div>
            </div>
            <Notification notification={notification} setNotification={setNotification} />
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={handleCloseOrderDetails} setNotification={setNotification} products={products} flavors={flavors} snacks={snacks} />}
        </div>
    );
}

export default function AppWrapper() {
  return (
    <PermissionsProvider>
      <App />
    </PermissionsProvider>
  );
}
                  
