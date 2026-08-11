'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxz42ss1b';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

type Lang = 'vi' | 'en' | 'zh';

const DICTIONARY = {
  vi: {
    hubTitle: 'KOHI HQ',
    hubSubtitle: 'Operations',
    adminRole: 'Quản trị',
    staffRole: 'Nhân viên Barista',
    updateAccount: 'Cập nhật thông tin tài khoản',
    logout: 'Đăng xuất',
    tabOrders: 'Đơn hàng realtime',
    tabFoods: 'Quản lý thực đơn',
    tabTables: 'Quản lý bàn',
    tabUsers: 'Quản lý nhân viên',
    addFood: 'Thêm món mới',
    addTable: 'Thêm bàn mới',
    addUser: 'Thêm nhân viên mới',
    loadingOrders: 'Đang đồng bộ đơn hàng theo thời gian thực...',
    errorSync: 'Lỗi đồng bộ',
    noOrders: 'Chưa có đơn hàng nào',
    noOrdersDesc: 'Các đơn hàng mới của khách hàng quét QR tại bàn sẽ xuất hiện ở đây ngay lập tức.',
    unknownTable: 'Không rõ bàn',
    momo: 'MoMo',
    cash: 'Tiền mặt',
    orderCode: 'Mã đơn',
    orderDeleteConfirm: 'Bạn có chắc chắn muốn xoá đơn hàng này không?',
    toastDeleteOrder: 'Đơn hàng đã được xóa khỏi hệ thống!',
    toastDeleteFood: 'Đã xóa món khỏi thực đơn thành công!',
    toastDeleteUser: 'Đã xóa tài khoản nhân viên thành công!',
    toastDeleteTable: 'Đã xóa bàn ăn thành công!',
    toastDeleteConfirmTitle: 'Xác nhận xóa',
    deleteOrderTitle: 'Xóa đơn hàng',
    deleteOrderDesc: 'Hành động này sẽ xóa vĩnh viễn đơn hàng của {tableName} khỏi hệ thống.',
    deleteFoodTitle: 'Xóa món',
    deleteFoodDesc: 'Hành động này sẽ xóa vĩnh viễn món {foodName} khỏi thực đơn.',
    deleteUserTitle: 'Xóa nhân viên',
    deleteUserDesc: 'Hành động này sẽ xóa tài khoản nhân viên {userName}.',
    deleteTableTitle: 'Xóa bàn',
    deleteTableDesc: 'Hành động này sẽ xóa bàn {tableName} khỏi danh sách.',
    confirm: 'Xác nhận',
    cancel: 'Hủy bỏ',
    orderItems: 'Thức uống & Bánh',
    totalAmount: 'Tổng cộng',
    updateStatus: 'Cập nhật trạng thái',
    printInvoice: 'In hóa đơn',
    status_pending: 'CHỜ XỬ LÝ',
    status_cooking: 'ĐANG PHA CHẾ',
    status_completed: 'ĐÃ XONG MÓN',
    status_cancelled: 'ĐÃ HUỶ',
    status_paid: 'ĐÃ THANH TOÁN',
    activeInvoiceTitle: 'Chi tiết hóa đơn',
    invoiceTitle: 'HÓA ĐƠN THANH TOÁN',
    invoiceTable: 'Bàn',
    invoiceDate: 'Ngày giờ',
    invoiceFoodName: 'Tên món',
    invoiceQty: 'SL',
    invoicePrice: 'Đơn giá',
    invoiceSubtotal: 'Thành tiền',
    invoiceTotal: 'Tổng cộng',
    invoiceStatus: 'Trạng thái',
    invoiceBack: 'Quay lại',
    invoicePrintBtn: 'In hóa đơn (PDF)',
    foodCategory: 'Danh mục',
    foodPrice: 'Đơn giá',
    foodStatus: 'Trạng thái',
    foodAvailable: 'Đang phục vụ',
    foodUnavailable: 'Tạm ngưng',
    foodDescription: 'Mô tả',
    foodActions: 'Hành động',
    foodSearchPlaceholder: 'Tìm kiếm thức uống & bánh...',
    tableListName: 'Tên bàn',
    tableListStatus: 'Trạng thái bàn',
    tableEmpty: 'Bàn trống',
    tableOccupied: 'Có khách',
    tableReserved: 'Khách hẹn',
    tableActions: 'Hành động',
    userName: 'Họ tên',
    userEmail: 'Email',
    userRole: 'Quyền hạn',
    userActions: 'Hành động',
    modalFoodTitleAdd: 'Thêm Thức Uống / Bánh Mới',
    modalFoodTitleEdit: 'Cập Nhật Thức Uống / Bánh',
    modalFoodName: 'Tên thức uống / bánh',
    modalFoodPrice: 'Giá tiền (VND)',
    modalFoodCategory: 'Danh mục thực đơn',
    modalFoodDesc: 'Mô tả chi tiết',
    modalFoodImg: 'Hình ảnh món',
    modalFoodUpload: 'Chọn ảnh từ thiết bị',
    modalFoodUrl: 'Nhập URL',
    modalFoodUrlPlaceholder: 'Dán link ảnh (Unsplash, Imgur...)',
    modalFoodPreset: 'Ý tưởng ảnh món',
    modalFoodActive: 'Hiển thị phục vụ khách hàng',
    modalFoodSave: 'Lưu thay đổi',
    modalTableTitleAdd: 'Thêm Bàn Ăn Mới',
    modalTableTitleEdit: 'Cập Nhật Bàn Ăn',
    modalTableName: 'Tên bàn ăn (Ví dụ: Bàn số 1)',
    modalTableStatus: 'Trạng thái hoạt động',
    modalUserTitleAdd: 'Thêm Nhân Viên Mới',
    modalUserTitleEdit: 'Cập Nhật Nhân Viên',
    modalUserName: 'Họ và tên',
    modalUserEmail: 'Địa chỉ Email',
    modalUserPassword: 'Mật khẩu đăng nhập',
    modalUserRole: 'Quyền hạn tài khoản',
    modalProfileTitle: 'Cập Nhật Thông Tin Cá Nhân',
    modalProfileName: 'Họ và tên hiển thị',
    modalProfileEmail: 'Địa chỉ Email đăng nhập',
    modalProfilePassword: 'Mật khẩu mới (Bỏ trống nếu không đổi)',
    modalProfileSaving: 'Đang cập nhật...',
    modalProfileSave: 'Lưu thông tin',
    toastSaveSuccess: 'Lưu thành công!',
    foodDeleted: 'Món đã bị xoá',
    cancelOrder: 'Hủy đơn',
    cookOrder: 'Xác nhận đơn',
    completeOrder: 'Hoàn tất món',
    payCash: 'Thanh toán Tiền mặt',
    waitMoMo: 'Chờ khách quét MoMo...',
    paidSuccess: 'Đã thanh toán hoàn tất',
    viewInvoice: 'Xem hóa đơn chi tiết',
    orderCancelledText: 'Đơn đã bị hủy bỏ',
  },
  en: {
    hubTitle: 'KOHI HQ',
    hubSubtitle: 'Operations',
    adminRole: 'Admin',
    staffRole: 'Staff',
    updateAccount: 'Update Account Information',
    logout: 'Log out',
    tabOrders: 'Realtime Orders',
    tabFoods: 'Menu Management',
    tabTables: 'Table Management',
    tabUsers: 'Staff Management',
    addFood: 'Add New Food',
    addTable: 'Add New Table',
    addUser: 'Add New Staff',
    loadingOrders: 'Syncing orders in real time...',
    errorSync: 'Sync Error',
    noOrders: 'No orders yet',
    noOrdersDesc: 'New orders from QR scanning customers will appear here immediately in real time.',
    unknownTable: 'Unknown Table',
    momo: 'MoMo',
    cash: 'Cash',
    orderCode: 'Order ID',
    orderDeleteConfirm: 'Are you sure you want to delete this order?',
    toastDeleteOrder: 'Order has been deleted from system!',
    toastDeleteFood: 'Food deleted from menu successfully!',
    toastDeleteUser: 'Staff account deleted successfully!',
    toastDeleteTable: 'Table deleted successfully!',
    toastDeleteConfirmTitle: 'Confirm Delete',
    deleteOrderTitle: 'Delete Order',
    deleteOrderDesc: 'This action will permanently delete the order of {tableName} from the system.',
    deleteFoodTitle: 'Delete Food Item',
    deleteFoodDesc: 'This action will permanently delete the food item {foodName} from the menu.',
    deleteUserTitle: 'Delete Staff',
    deleteUserDesc: 'This action will delete staff account {userName}.',
    deleteTableTitle: 'Delete Table',
    deleteTableDesc: 'This action will delete table {tableName} from the list.',
    confirm: 'Confirm',
    cancel: 'Cancel',
    orderItems: 'Items',
    totalAmount: 'Total',
    updateStatus: 'Update Status',
    printInvoice: 'Print Invoice',
    status_pending: 'PENDING',
    status_cooking: 'PREPARING',
    status_completed: 'FOOD READY',
    status_cancelled: 'CANCELLED',
    status_paid: 'PAID',
    activeInvoiceTitle: 'Invoice Details',
    invoiceTitle: 'PAYMENT INVOICE',
    invoiceTable: 'Table',
    invoiceDate: 'Date Time',
    invoiceFoodName: 'Food Item',
    invoiceQty: 'Qty',
    invoicePrice: 'Unit Price',
    invoiceSubtotal: 'Subtotal',
    invoiceTotal: 'Total',
    invoiceStatus: 'Status',
    invoiceBack: 'Back',
    invoicePrintBtn: 'Print Invoice (PDF)',
    foodCategory: 'Category',
    foodPrice: 'Price',
    foodStatus: 'Status',
    foodAvailable: 'Available',
    foodUnavailable: 'Unavailable',
    foodDescription: 'Description',
    foodActions: 'Actions',
    foodSearchPlaceholder: 'Search food items...',
    tableListName: 'Table Name',
    tableListStatus: 'Table Status',
    tableEmpty: 'Empty',
    tableOccupied: 'Occupied',
    tableReserved: 'Reserved',
    tableActions: 'Actions',
    userName: 'Full Name',
    userEmail: 'Email',
    userRole: 'Role',
    userActions: 'Actions',
    modalFoodTitleAdd: 'Add New Food Item',
    modalFoodTitleEdit: 'Update Food Item',
    modalFoodName: 'Food Name',
    modalFoodPrice: 'Price (VND)',
    modalFoodCategory: 'Menu Category',
    modalFoodDesc: 'Detailed Description',
    modalFoodImg: 'Food Image',
    modalFoodUpload: 'Choose from Device',
    modalFoodUrl: 'Enter URL',
    modalFoodUrlPlaceholder: 'Paste image link (Unsplash, Imgur...)',
    modalFoodPreset: 'Quick Food Ideas',
    modalFoodActive: 'Show for active ordering menu',
    modalFoodSave: 'Save Changes',
    modalTableTitleAdd: 'Add New Table',
    modalTableTitleEdit: 'Update Table Details',
    modalTableName: 'Table Name (e.g. Table 1)',
    modalTableStatus: 'Operational Status',
    modalUserTitleAdd: 'Add New Staff',
    modalUserTitleEdit: 'Update Staff Info',
    modalUserName: 'Full Name',
    modalUserEmail: 'Email Address',
    modalUserPassword: 'Password',
    modalUserRole: 'Account Privilege',
    modalProfileTitle: 'Update Profile Information',
    modalProfileName: 'Display Name',
    modalProfileEmail: 'Login Email Address',
    modalProfilePassword: 'New Password (leave empty to keep current)',
    modalProfileSaving: 'Updating...',
    modalProfileSave: 'Save Changes',
    toastSaveSuccess: 'Saved successfully!',
    foodDeleted: 'Item deleted',
    cancelOrder: 'Cancel order',
    cookOrder: 'Confirm order',
    completeOrder: 'Complete order',
    payCash: 'Pay Cash',
    waitMoMo: 'Waiting for MoMo payment...',
    paidSuccess: 'Paid successfully',
    viewInvoice: 'View detailed invoice',
    orderCancelledText: 'Order has been cancelled',
  },
  zh: {
    hubTitle: 'KOHI HQ',
    hubSubtitle: 'Operations',
    adminRole: '管理员',
    staffRole: '员工',
    updateAccount: '更新账户信息',
    logout: '注销登录',
    tabOrders: '实时订单',
    tabFoods: '菜单管理',
    tabTables: '餐桌管理',
    tabUsers: '员工管理',
    addFood: '添加新菜品',
    addTable: '添加新餐桌',
    addUser: '添加新员工',
    loadingOrders: '正在实时同步订单...',
    errorSync: '同步错误',
    noOrders: '暂无订单',
    noOrdersDesc: '扫码顾客的新点单将立即实时出现在此处。',
    unknownTable: '未知桌号',
    momo: 'MoMo',
    cash: '现金',
    orderCode: '订单编号',
    orderDeleteConfirm: '您确定要删除此订单吗？',
    toastDeleteOrder: '订单已从系统中删除！',
    toastDeleteFood: '菜品已成功从菜单中删除！',
    toastDeleteUser: '员工账户已成功删除！',
    toastDeleteTable: '餐桌已成功删除！',
    toastDeleteConfirmTitle: '确认删除',
    deleteOrderTitle: '删除订单',
    deleteOrderDesc: '此操作将从系统中永久删除 {tableName} 的订单。',
    deleteFoodTitle: '删除菜品',
    deleteFoodDesc: '此操作将从菜单中永久删除菜品 {foodName}。',
    deleteUserTitle: '删除员工',
    deleteUserDesc: '此操作将删除员工账户 {userName}。',
    deleteTableTitle: '删除餐桌',
    deleteTableDesc: '此操作将从列表中删除餐桌 {tableName}。',
    confirm: '确认',
    cancel: '取消',
    orderItems: '所点菜品',
    totalAmount: '总计金额',
    updateStatus: '更新状态',
    printInvoice: '打印账单',
    status_pending: '等待处理',
    status_cooking: '正在烹饪',
    status_completed: '菜已做好',
    status_cancelled: '已取消',
    status_paid: '已结账',
    activeInvoiceTitle: '账单明细',
    invoiceTitle: '消费结账单',
    invoiceTable: '桌号',
    invoiceDate: '消费时间',
    invoiceFoodName: '菜品名称',
    invoiceQty: '数量',
    invoicePrice: '单价',
    invoiceSubtotal: '小计',
    invoiceTotal: '实收总计',
    invoiceStatus: '结账状态',
    invoiceBack: '返回',
    invoicePrintBtn: '打印账单 (PDF)',
    foodCategory: '菜品分类',
    foodPrice: '单价',
    foodStatus: '状态',
    foodAvailable: '正常供应',
    foodUnavailable: '已售罄',
    foodDescription: '菜品描述',
    foodActions: '操作',
    foodSearchPlaceholder: '搜索菜品...',
    tableListName: '桌子名称',
    tableListStatus: '桌子状态',
    tableEmpty: '空闲',
    tableOccupied: '使用中',
    tableReserved: '已预订',
    tableActions: '操作',
    userName: '姓名',
    userEmail: '电子邮件',
    userRole: '角色权限',
    userActions: '操作',
    modalFoodTitleAdd: '添加新菜品',
    modalFoodTitleEdit: '更新菜品信息',
    modalFoodName: '菜品名称',
    modalFoodPrice: '价格 (VND)',
    modalFoodCategory: '菜品分类',
    modalFoodDesc: '详细描述',
    modalFoodImg: '菜品图片',
    modalFoodUpload: '从设备上传',
    modalFoodUrl: '输入 URL',
    modalFoodUrlPlaceholder: '粘贴图片链接 (Unsplash, Imgur...)',
    modalFoodPreset: '快捷图片创意',
    modalFoodActive: '在扫码点单菜单中显示',
    modalFoodSave: '保存修改',
    modalTableTitleAdd: '添加新餐桌',
    modalTableTitleEdit: '更新餐桌信息',
    modalTableName: '桌子名称 (例如: Bàn số 1)',
    modalTableStatus: '使用状态',
    modalUserTitleAdd: '添加新员工',
    modalUserTitleEdit: '更新员工信息',
    modalUserName: '姓名',
    modalUserEmail: '邮箱地址',
    modalUserPassword: '密码',
    modalUserRole: '账户权限',
    modalProfileTitle: '更新个人信息',
    modalProfileName: '显示姓名',
    modalProfileEmail: '登录邮箱地址',
    modalProfilePassword: '新密码 (留空表示不修改)',
    modalProfileSaving: '正在更新...',
    modalProfileSave: '保存修改',
    toastSaveSuccess: '保存成功！',
    foodDeleted: '菜品已被删除',
    cancelOrder: '取消订单',
    cookOrder: '确认订单',
    completeOrder: '烹饪完成',
    payCash: '现金结账',
    waitMoMo: '等待顾客扫码MoMo...',
    paidSuccess: '已结账完成',
    viewInvoice: '查看账单详情',
    orderCancelledText: '订单已取消',
  }
};

interface FoodItem {
  foodId: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  note?: string;
}

interface Order {
  _id: string;
  tableId?: {
    _id: string;
    tableName: string;
  } | null;
  items: FoodItem[];
  totalAmount: number;
  status: 'pending' | 'cooking' | 'completed' | 'cancelled' | 'paid';
  paymentStatus?: 'unpaid' | 'paid';
  paymentMethod: 'cash' | 'momo';
  isTakeaway?: boolean;
  customerName?: string;
  couponCode?: string;
  createdAt: string;
}

interface StaffCall {
  _id: string;
  tableId: {
    _id: string;
    tableName: string;
  };
  status: 'pending' | 'acknowledged';
  message: string;
  createdAt: string;
}

interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);

  // Responsive Drawer states for Mobile & Tablet
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRealtimeDrawerOpen, setIsRealtimeDrawerOpen] = useState(false);

  // Theme resolution helper
  const isDark = resolvedTheme === 'dark';

  // Translation helper
  const t = DICTIONARY[lang];

  // Toast notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Main data states
  const [foods, setFoods] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'foods' | 'tables' | 'users' | 'attendance' | 'analytics'>('foods');
  const [activityFilter, setActivityFilter] = useState<'all' | 'support' | 'payment' | 'checkedIn' | 'notCheckedIn'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'active' | 'paid' | 'all'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTableStatus, setSelectedTableStatus] = useState<string>('all');

  // Attendance state
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ checkIn: '', checkOut: '', note: '' });

  // Analytics state (for admin)
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [topFoods, setTopFoods] = useState<any[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Salary management state (for admin)
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [staffHourlyRates, setStaffHourlyRates] = useState<Record<string, number>>({});

  // Modals state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<any | null>(null);
  const [foodForm, setFoodForm] = useState({ name: '', price: '', category: 'Cà phê', description: '', image: '', isAvailable: true });
  const [foodInputType, setFoodInputType] = useState<'url' | 'upload'>('upload');

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);
  const [tableForm, setTableForm] = useState({ tableName: '', status: 'empty' });
  const [qrTable, setQrTable] = useState<any | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  // Staff Takeaway Order State
  const [isTakeawayModalOpen, setIsTakeawayModalOpen] = useState(false);
  const [takeawayCart, setTakeawayCart] = useState<{ foodId: string; food: any; quantity: number; note: string }[]>([]);
  const [takeawayCustomerName, setTakeawayCustomerName] = useState('');
  const [takeawayPaymentMethod, setTakeawayPaymentMethod] = useState<'cash' | 'momo'>('cash');
  const [takeawayCouponCode, setTakeawayCouponCode] = useState('');
  const [takeawayCategory, setTakeawayCategory] = useState('all');
  const [takeawaySearch, setTakeawaySearch] = useState('');
  const [isCreatingTakeaway, setIsCreatingTakeaway] = useState(false);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Initial authentication & mounting check
  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');

    if (!storedToken) {
      router.push('/login');
      return;
    }

    setToken(storedToken);
    if (storedUserStr) {
      try {
        const u = JSON.parse(storedUserStr);
        setUser(u);
        setProfileName(u.name || '');
        setProfileEmail(u.email || '');

        // Standardize Admin tab vs Staff tab
        if (u.role === 'admin') {
          setActiveTab('analytics');
        } else {
          setActiveTab('orders');
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
  }, [router]);

  // Fetch all data & Initialize Socket.io
  useEffect(() => {
    if (!token) return;

    fetchOrders(token);
    fetchPendingCalls(token);
    fetchFoods(token);
    fetchTables(token);

    if (user?.role === 'admin') {
      fetchUsers(token);
      fetchAnalytics(token);
      fetchReviews(token);
      fetchPayrolls(token);
      fetchSalaryConfigs(token);
    }
    fetchAttendance(token);

    // Socket.io initialization
    socketRef.current = io(SOCKET_BASE, {
      auth: { token },
      query: { token },
    });

    socketRef.current.on('connect', () => {
      if (token && socketRef.current) {
        socketRef.current.emit('register', { token });
      }
    });

    socketRef.current.on('newOrder', (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
        audio.play();
      } catch (e) {}
    });

    socketRef.current.on('statusUpdated', ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status } : order))
      );
      if (status === 'paid' && token && user?.role === 'admin') {
        fetchAnalytics(token);
        fetchReviews(token);
      }
    });

    socketRef.current.on('orderDeleted', ({ orderId }: { orderId: string }) => {
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      setActiveInvoice((prev) => (prev?._id === orderId ? null : prev));
    });

    socketRef.current.on('ordersMerged', () => {
      fetchOrders(token);
      showToast('Tất cả đơn hàng của bàn vừa được gộp thành 1 đơn duy nhất!', 'info');
    });

    socketRef.current.on('staffCallRequest', (call: StaffCall) => {
      setStaffCalls((prev) => {
        if (prev.some((c) => c._id === call._id)) return prev;
        return [call, ...prev];
      });
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {});
      } catch (_) {}
    });

    socketRef.current.on('staffCallAcknowledged', ({ id }: { id: string }) => {
      setStaffCalls((prev) => prev.filter((c) => c._id !== id));
    });

    socketRef.current.on('attendanceUpdated', (data: any) => {
      if (token) fetchAttendance(token);
      if (user?.role === 'admin') {
        const actionText = data.type === 'check-in' ? 'vừa điểm danh Check-in' : 'vừa Check-out ca làm';
        showToast(`Nhân viên ${data.userName || ''} ${actionText}!`, 'info');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, user?.role]);

  const fetchOrders = async (tok: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng.');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoods = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/foods`);
      if (res.ok) setFoods(await res.json());
    } catch (e) {}
  };

  const fetchTables = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      if (res.ok) setTables(await res.json());
    } catch (e) {}
  };

  const fetchUsers = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setUsersList(await res.json());
    } catch (e) {}
  };

  const fetchPendingCalls = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/staff-calls`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        setStaffCalls(await res.json());
      }
    } catch (err) {}
  };

  const fetchAttendance = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setAttendances(await res.json());
    } catch (e) {}
  };

  const fetchAnalytics = async (tok: string) => {
    try {
      const [sumRes, topRes, revRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/summary`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API_BASE}/analytics/top-foods`, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API_BASE}/analytics/revenue`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (sumRes.ok) setAnalyticsSummary(await sumRes.json());
      if (topRes.ok) setTopFoods(await topRes.json());
      if (revRes.ok) setRevenueHistory(await revRes.json());
    } catch (e) {}
  };

  const fetchReviews = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setReviews(await res.json());
    } catch (e) {}
  };

  const fetchSalaryConfigs = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/salaries/config`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const configs = await res.json();
        const map: Record<string, number> = {};
        configs.forEach((c: any) => {
          const uId = c.userId?._id || c.userId;
          if (uId) map[uId] = c.baseSalary || 25000;
        });
        setStaffHourlyRates(map);
      }
    } catch (e) {}
  };

  const fetchPayrolls = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/salaries/payroll`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setPayrolls(await res.json());
    } catch (e) {}
  };

  const handleUpdateHourlyRate = async (userId: string, rate: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/salaries/config/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'hourly', baseSalary: rate }),
      });
      if (res.ok) {
        setStaffHourlyRates((prev) => ({ ...prev, [userId]: rate }));
        showToast('Đã cập nhật mức lương theo giờ!', 'success');
      }
    } catch (e) {
      showToast('Không thể lưu mức lương.', 'error');
    }
  };

  const handlePayStaffSalary = async (userId: string, hoursWorked: number, rate: number) => {
    if (!token) return;
    const now = new Date();
    try {
      // 1. Generate Payroll
      const genRes = await fetch(`${API_BASE}/salaries/payroll/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });

      if (!genRes.ok) throw new Error('Không thể tạo bản ghi lương.');
      const payroll = await genRes.json();

      // 2. Mark Paid directly in DB
      const payRes = await fetch(`${API_BASE}/salaries/payroll/${payroll._id}/pay`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paidMethod: 'cash' }),
      });

      if (!payRes.ok) throw new Error('Không thể cập nhật trạng thái thanh toán.');
      showToast(`Đã thanh toán tiền lương (${formatPrice(hoursWorked * rate)}) thành công và trừ vào doanh thu!`, 'success');
      fetchPayrolls(token);
      fetchAnalytics(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi trả lương.', 'error');
    }
  };

  const handleCheckIn = async () => {
    if (!token) return;
    setIsCheckingIn(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Chưa thể check-in hoặc bạn đã điểm danh hôm nay.');
      showToast('Check-in điểm danh thành công!', 'success');
      fetchAttendance(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi check-in.', 'error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/attendance/check-out`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Chưa thể check-out.');
      showToast('Check-out thành công!', 'success');
      fetchAttendance(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi check-out.', 'error');
    }
  };

  const handleCreateOrUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingAttendance) return;
    try {
      const payload: any = {};
      if (attendanceForm.checkIn) payload.checkIn = new Date(attendanceForm.checkIn).toISOString();
      if (attendanceForm.checkOut) payload.checkOut = new Date(attendanceForm.checkOut).toISOString();
      if (attendanceForm.note !== undefined) payload.note = attendanceForm.note;

      const res = await fetch(`${API_BASE}/attendance/${editingAttendance._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể cập nhật thông tin chấm công.');
      }
      showToast('Cập nhật bản ghi chấm công thành công!', 'success');
      setIsAttendanceModalOpen(false);
      fetchAttendance(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    }
  };

  // Image Upload Handler
  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Không thể tải ảnh lên.');
      const data = await res.json();
      setFoodForm((prev) => ({ ...prev, image: data.secure_url }));
      showToast('Tải ảnh lên thành công!', 'success');
    } catch (err) {
      showToast('Lỗi tải ảnh lên Cloudinary.', 'error');
    }
  };

  // Food Create / Update Handler
  const handleCreateOrUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        name: foodForm.name,
        price: Number(foodForm.price),
        category: foodForm.category,
        description: foodForm.description,
        image: foodForm.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80',
        isAvailable: foodForm.isAvailable,
      };

      const url = editingFood ? `${API_BASE}/foods/${editingFood._id}` : `${API_BASE}/foods`;
      const method = editingFood ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
        throw new Error(msg || 'Không thể lưu món ăn.');
      }
      showToast(t.toastSaveSuccess, 'success');
      setIsFoodModalOpen(false);
      fetchFoods(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    }
  };

  // Table Create / Update Handler
  const handleCreateOrUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Extract table number
    const numberOnly = String(tableForm.tableName).replace(/\D/g, '');
    if (!numberOnly) {
      showToast('Vui lòng nhập số thứ tự bàn hợp lệ (Ví dụ: 4 hoặc 5)', 'error');
      return;
    }

    const formattedName = `Bàn số ${numberOnly}`;

    // Frontend duplicate validation
    const isDuplicate = tables.some((tbl) => {
      if (editingTable && tbl._id === editingTable._id) return false;
      const existingNum = String(tbl.tableName).replace(/\D/g, '');
      return (
        existingNum === numberOnly ||
        tbl.tableName?.toLowerCase() === formattedName.toLowerCase() ||
        tbl.tableName?.toLowerCase() === numberOnly.toLowerCase()
      );
    });

    if (isDuplicate) {
      showToast(`Bàn số ${numberOnly} đã tồn tại trong hệ thống! Vui lòng chọn số khác.`, 'error');
      return;
    }

    try {
      const payload = {
        tableName: formattedName,
        status: tableForm.status,
      };

      const url = editingTable ? `${API_BASE}/tables/${editingTable._id}` : `${API_BASE}/tables`;
      const method = editingTable ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể lưu thông tin bàn.');
      }

      showToast(t.toastSaveSuccess, 'success');
      setIsTableModalOpen(false);
      fetchTables(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    }
  };

  // User Create / Update Handler
  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
        showToast('Vui lòng nhập mật khẩu có ít nhất 6 ký tự cho nhân viên mới!', 'error');
        return;
      }

      const payload: any = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      if (userForm.password) payload.password = userForm.password;

      const url = editingUser ? `${API_BASE}/users/${editingUser._id}` : `${API_BASE}/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
        throw new Error(msg || 'Không thể lưu thông tin nhân viên.');
      }
      showToast(t.toastSaveSuccess, 'success');
      setIsUserModalOpen(false);
      fetchUsers(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    }
  };

  // Staff Takeaway Cart Helpers & Order Handler
  const addToTakeawayCart = (food: any) => {
    setTakeawayCart((prev) => {
      const existing = prev.find((item) => item.foodId === food._id);
      if (existing) {
        return prev.map((item) =>
          item.foodId === food._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { foodId: food._id, food, quantity: 1, note: '' }];
    });
  };

  const updateTakeawayQuantity = (foodId: string, delta: number) => {
    setTakeawayCart((prev) =>
      prev
        .map((item) => {
          if (item.foodId === foodId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const updateTakeawayNote = (foodId: string, note: string) => {
    setTakeawayCart((prev) =>
      prev.map((item) => (item.foodId === foodId ? { ...item, note } : item))
    );
  };

  const handleCreateTakeawayOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (takeawayCart.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 món ăn cho đơn mang về!', 'error');
      return;
    }
    setIsCreatingTakeaway(true);
    try {
      const items = takeawayCart.map((item) => ({
        foodId: item.foodId,
        quantity: item.quantity,
        note: item.note,
      }));

      const payload: any = {
        items,
        isTakeaway: true,
        paymentMethod: takeawayPaymentMethod,
      };

      if (takeawayCustomerName.trim()) payload.customerName = takeawayCustomerName.trim();
      if (takeawayCouponCode.trim()) payload.couponCode = takeawayCouponCode.trim();

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
        throw new Error(msg || 'Không thể tạo đơn hàng mang về.');
      }

      showToast('Tạo đơn hàng mang về thành công!', 'success');
      setIsTakeawayModalOpen(false);
      setTakeawayCart([]);
      fetchOrders(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đơn.', 'error');
    } finally {
      setIsCreatingTakeaway(false);
    }
  };

  // Profile Update Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingProfile(true);
    try {
      const payload: any = { name: profileName, email: profileEmail };
      if (profilePassword) payload.password = profilePassword;

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Không thể cập nhật thông tin cá nhân.');
      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast(t.toastSaveSuccess, 'success');
      setIsProfileModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng.');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(t.toastSaveSuccess, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi cập nhật.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!token) return;
    if (orderToDelete) {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể xóa đơn hàng.');
        setOrders((prev) => prev.filter((o) => o._id !== orderToDelete));
        showToast(t.toastDeleteOrder, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Không thể xóa.', 'error');
      } finally {
        setOrderToDelete(null);
      }
    } else if (foodToDelete) {
      try {
        const res = await fetch(`${API_BASE}/foods/${foodToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể xóa món.');
        setFoods((prev) => prev.filter((f) => f._id !== foodToDelete));
        showToast(t.toastDeleteFood, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Không thể xóa.', 'error');
      } finally {
        setFoodToDelete(null);
      }
    } else if (tableToDelete) {
      try {
        const res = await fetch(`${API_BASE}/tables/${tableToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể xóa bàn.');
        setTables((prev) => prev.filter((tb) => tb._id !== tableToDelete));
        showToast(t.toastDeleteTable, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Không thể xóa.', 'error');
      } finally {
        setTableToDelete(null);
      }
    } else if (userToDelete) {
      try {
        const res = await fetch(`${API_BASE}/users/${userToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể xóa nhân viên.');
        setUsersList((prev) => prev.filter((u) => u._id !== userToDelete));
        showToast(t.toastDeleteUser, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Không thể xóa.', 'error');
      } finally {
        setUserToDelete(null);
      }
    } else if (reviewToDelete) {
      try {
        const res = await fetch(`${API_BASE}/reviews/${reviewToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể xóa đánh giá.');
        setReviews((prev) => prev.filter((r) => r._id !== reviewToDelete));
        showToast('Đã xóa đánh giá thành công!', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Lỗi xóa.', 'error');
      } finally {
        setReviewToDelete(null);
      }
    } else if (attendanceToDelete) {
      try {
        const res = await fetch(`${API_BASE}/attendance/${attendanceToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể xóa bản ghi chấm công.');
        setAttendances((prev) => prev.filter((a) => a._id !== attendanceToDelete));
        showToast('Đã xóa bản ghi chấm công thành công!', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Không thể xóa.', 'error');
      } finally {
        setAttendanceToDelete(null);
      }
    }
  };

  const handleAcknowledgeCall = async (callId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/staff-calls/${callId}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStaffCalls((prev) => prev.filter((c) => c._id !== callId));
        showToast('Đã tiếp nhận yêu cầu hỗ trợ!', 'success');
      }
    } catch (err) {
      showToast('Không thể xác nhận yêu cầu.', 'error');
    }
  };

  const handleMergeTableOrders = async (tableId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders/merge-table/${tableId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể gộp đơn.');
      showToast('Gộp đơn hàng thành công!', 'success');
      fetchOrders(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi gộp đơn.', 'error');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const formatForDatetimeInput = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  if (!mounted) return null;

  // Adaptive Chart.js Data & Options (Light & Dark mode responsive)
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#1e293b' : '#e2e8f0';

  const lineChartData = {
    labels: revenueHistory.length > 0
      ? revenueHistory.map((r) => r._id)
      : ['Hôm nay'],
    datasets: [
      {
        label: 'Doanh thu gộp (VND)',
        data: revenueHistory.length > 0
          ? revenueHistory.map((r) => r.revenue)
          : [analyticsSummary?.todayGross || 0],
        borderColor: '#38BDF8',
        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#38BDF8',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: chartTextColor, font: { family: 'Inter', size: 12, weight: 700 } } },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#ffffff' : '#0f172a',
        bodyColor: '#38BDF8',
        borderColor: isDark ? '#334155' : '#cbd5e1',
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
      y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
    },
  };

  const barChartData = {
    labels: ['Hôm nay', 'Tuần này', 'Tháng này'],
    datasets: [
      {
        label: 'Doanh thu gộp',
        data: [
          analyticsSummary?.todayGross || 0,
          analyticsSummary?.weekGross || 0,
          analyticsSummary?.monthGross || 0,
        ],
        backgroundColor: '#38BDF8',
        borderRadius: 6,
      },
      {
        label: 'Lương đã trả',
        data: [
          analyticsSummary?.todaySalary || 0,
          analyticsSummary?.weekSalary || 0,
          analyticsSummary?.monthSalary || 0,
        ],
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
      {
        label: 'Lợi nhuận ròng',
        data: [
          analyticsSummary?.today || 0,
          analyticsSummary?.week || 0,
          analyticsSummary?.month || 0,
        ],
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: chartTextColor, font: { family: 'Inter', size: 12, weight: 700 } } },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#ffffff' : '#0f172a',
        borderColor: isDark ? '#334155' : '#cbd5e1',
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
      y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
    },
  };

  const doughnutData = {
    labels: topFoods.slice(0, 5).map((f) => f.foodName),
    datasets: [
      {
        data: topFoods.slice(0, 5).map((f) => f.totalQuantity),
        backgroundColor: ['#38BDF8', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        borderColor: isDark ? '#131929' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: chartTextColor, font: { family: 'Inter', size: 11 } } },
    },
  };

  // Group active orders per table to find table merge opportunities
  const tableOrderCountsMap: Record<string, { tableName: string; count: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'paid') {
      const tId = o.tableId?._id;
      const tName = o.tableId?.tableName || 'Bàn chưa rõ';
      if (tId) {
        if (!tableOrderCountsMap[tId]) {
          tableOrderCountsMap[tId] = { tableName: tName, count: 0 };
        }
        tableOrderCountsMap[tId].count += 1;
      }
    }
  });

  const mergeableTables = Object.entries(tableOrderCountsMap).filter(([_, val]) => val.count >= 2);

  // Derived orders lists for tabs and history
  const activeOrdersList = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'paid'
  );
  const paidOrdersList = orders.filter((o) => o.status === 'paid');

  const displayedOrders =
    orderStatusFilter === 'active'
      ? orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled')
      : orderStatusFilter === 'paid'
      ? paidOrdersList
      : orders;

  // Unique food categories dynamically fetched from DB
  const availableCategories = Array.from(
    new Set(foods.map((f) => f.category).filter(Boolean))
  );

  // Filtered foods by search query & selected category
  const filteredFoods = foods.filter((f) => {
    const matchesSearch =
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered tables by status
  const filteredTables = tables.filter((tbl) => {
    if (selectedTableStatus === 'all') return true;
    if (selectedTableStatus === 'empty') return tbl.status === 'empty' || !tbl.status;
    return tbl.status === selectedTableStatus;
  });

  // Calculate average customer review stars
  const avgStar = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.serviceStar || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-white flex flex-col lg:flex-row overflow-hidden font-sans select-none relative transition-colors duration-300">
      {/* ── MOBILE TOP NAVIGATION BAR (Visible on screens < lg) ──────────────── */}
      <div className="lg:hidden flex items-center justify-between bg-white dark:bg-[#0d1322] border-b border-slate-200 dark:border-[#1e293b] px-4 py-3 text-slate-900 dark:text-white shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            title="Menu điều hướng"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white font-heading">KOHI HQ</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{user?.role === 'admin' ? 'Quản trị viên' : 'Barista'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Switcher */}
          <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />

          <button
            onClick={() => setIsRealtimeDrawerOpen(!isRealtimeDrawerOpen)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-[#1e293b] border border-slate-300 dark:border-[#38BDF8]/40 text-[#0284c7] dark:text-[#38BDF8] rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">notifications</span>
            <span className="hidden sm:inline">Realtime</span>
            {staffCalls.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-30"
        />
      )}

      {/* Mobile Realtime Drawer Overlay Backdrop */}
      {isRealtimeDrawerOpen && (
        <div
          onClick={() => setIsRealtimeDrawerOpen(false)}
          className="xl:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-30"
        />
      )}

      {/* ── COLUMN 1: LEFT SIDEBAR (#0d1322 / bg-white) ────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#0d1322] border-r border-slate-200 dark:border-[#1e293b] flex flex-col justify-between p-4 h-screen transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header & Theme Switcher */}
          <div className="mb-6 px-2 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                KOHI HQ
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Operations</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:block">
                <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {/* Realtime Orders Tab: STAFF ONLY */}
            {user?.role === 'staff' && (
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-[#38BDF8]/10 text-[#0284c7] dark:bg-[#1e293b] dark:text-[#38BDF8] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151c2d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                  <span>{t.tabOrders}</span>
                </div>
                <span className="bg-[#38BDF8] text-[#090D16] text-[11px] font-black px-2 py-0.5 rounded-full">
                  {activeOrdersList.length}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('foods');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'foods'
                  ? 'bg-[#38BDF8]/10 text-[#0284c7] dark:bg-[#1e293b] dark:text-[#38BDF8] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151c2d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">restaurant_menu</span>
                <span>{t.tabFoods}</span>
              </div>
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {foods.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tables');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'tables'
                  ? 'bg-[#38BDF8]/10 text-[#0284c7] dark:bg-[#1e293b] dark:text-[#38BDF8] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151c2d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">table_restaurant</span>
                <span>{t.tabTables}</span>
              </div>
              <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {tables.length}
              </span>
            </button>

            {/* Attendance Tab */}
            <button
              onClick={() => {
                setActiveTab('attendance');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-[#38BDF8]/10 text-[#0284c7] dark:bg-[#1e293b] dark:text-[#38BDF8] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151c2d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">event_available</span>
                <span>{user?.role === 'admin' ? 'Chấm công & Trả lương' : 'Chấm công ca làm'}</span>
              </div>
            </button>

            {/* Users Management Tab: ADMIN ONLY */}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'users'
                    ? 'bg-[#38BDF8]/10 text-[#0284c7] dark:bg-[#1e293b] dark:text-[#38BDF8] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151c2d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">badge</span>
                  <span>{t.tabUsers}</span>
                </div>
              </button>
            )}

            {/* Revenue Analytics Tab: ADMIN ONLY */}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setIsMobileSidebarOpen(false);
                  if (token) {
                    fetchAnalytics(token);
                    fetchReviews(token);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-[#38BDF8]/10 text-[#0284c7] dark:bg-[#1e293b] dark:text-[#38BDF8] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#151c2d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">bar_chart</span>
                  <span>Thống kê doanh thu DB</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* User Profile & Logout at Bottom */}
        <div className="border-t border-slate-200 dark:border-[#1e293b] pt-4 px-2 flex items-center justify-between">
          <button
            onClick={() => {
              setIsProfileModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1e293b] text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Manager'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Sửa thông tin</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </aside>

      {/* ── COLUMN 2: CENTER WORKSPACE (#F8FAFC / #090D16) ────────────────── */}
      <main className="flex-1 min-w-0 bg-[#F8FAFC] dark:bg-[#090D16] flex flex-col h-screen overflow-hidden p-3 sm:p-6 transition-colors duration-300">
        {/* Workspace Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
            {activeTab === 'orders' && t.tabOrders}
            {activeTab === 'foods' && t.tabFoods}
            {activeTab === 'tables' && t.tabTables}
            {activeTab === 'users' && t.tabUsers}
            {activeTab === 'attendance' && (user?.role === 'admin' ? 'Chấm công & Thanh toán Lương Nhân viên' : 'Chấm công ca làm')}
            {activeTab === 'analytics' && 'Thống kê Doanh thu & Đánh giá Khách hàng'}
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input for foods/tables */}
            {activeTab === 'foods' && (
              <input
                type="text"
                placeholder={t.foodSearchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 sm:w-64 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#38BDF8] shadow-xs"
              />
            )}

            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs shrink-0">
              <span className="material-symbols-outlined text-base">filter_list</span>
              <span>Lọc</span>
            </button>
          </div>
        </div>

        {/* Realtime Orders View: STAFF ONLY */}
        {activeTab === 'orders' && user?.role === 'staff' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10 scrollbar-thin">
            {/* Status Filter Sub-Tabs: Đang xử lý | Đã thanh toán (Lịch sử) | Tất cả */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-[#1e293b] text-xs font-bold shrink-0 scrollbar-none">
              <button
                onClick={() => setOrderStatusFilter('active')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  orderStatusFilter === 'active'
                    ? 'bg-[#38BDF8] text-[#090D16] font-black shadow-sm'
                    : 'bg-white dark:bg-[#131929] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e293b]'
                }`}
              >
                <span>Đang xử lý</span>
                <span className="bg-[#090D16]/20 dark:bg-[#090D16]/20 px-2 py-0.5 rounded-full text-[10px]">
                  {orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled').length}
                </span>
              </button>

              <button
                onClick={() => setOrderStatusFilter('paid')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  orderStatusFilter === 'paid'
                    ? 'bg-emerald-500 text-white font-black shadow-sm'
                    : 'bg-white dark:bg-[#131929] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e293b]'
                }`}
              >
                <span>Đã thanh toán (Lịch sử)</span>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
                  {paidOrdersList.length}
                </span>
              </button>

              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  orderStatusFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-[#1e293b] font-black shadow-sm border border-slate-700'
                    : 'bg-white dark:bg-[#131929] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e293b]'
                }`}
              >
                <span>Tất cả lịch sử</span>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setTakeawayCart([]);
                  setTakeawayCustomerName('');
                  setTakeawayPaymentMethod('cash');
                  setTakeawayCouponCode('');
                  setIsTakeawayModalOpen(true);
                }}
                className="px-4 py-2 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ml-auto shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">shopping_bag</span>
                <span>➕ Tạo đơn mang về</span>
              </button>
            </div>

            {/* Table Merge Alert Banner */}
            {mergeableTables.length > 0 &&
              mergeableTables.map(([tId, info]) => (
                <div
                  key={tId}
                  className="bg-sky-50 dark:bg-[#0e2238] border border-[#38BDF8]/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-[#0284c7] dark:text-[#38BDF8]"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="material-symbols-outlined text-base">info</span>
                    <span>Gộp tất cả đơn của {info.tableName} làm 1</span>
                  </div>
                  <button
                    onClick={() => handleMergeTableOrders(tId)}
                    className="px-3 py-1 bg-[#38BDF8] text-[#090D16] font-black text-xs rounded-lg hover:bg-[#0284c7] transition-all"
                  >
                    Gộp đơn
                  </button>
                </div>
              ))}

            {/* Orders Cards Grid */}
            {displayedOrders.length === 0 ? (
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-12 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">receipt_long</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {orderStatusFilter === 'paid' ? 'Chưa có đơn hàng nào đã thanh toán' : t.noOrders}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.noOrdersDesc}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedOrders.map((order) => {
                  const statusLabel =
                    order.status === 'pending'
                      ? t.status_pending
                      : order.status === 'cooking'
                      ? t.status_cooking
                      : order.status === 'completed'
                      ? t.status_completed
                      : t.status_paid;

                  const isPaid = order.status === 'paid';

                  return (
                    <div
                      key={order._id}
                      className={`bg-white dark:bg-[#131929] border rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                        isPaid ? 'border-emerald-500/30' : 'border-slate-200 dark:border-[#1e293b]'
                      }`}
                    >
                      <div>
                        {/* Card Header: Table Name & Status */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e293b] mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading flex items-center gap-1.5">
                              {order.isTakeaway || !order.tableId ? (
                                <span className="text-[#0284c7] dark:text-[#38BDF8] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">shopping_bag</span>
                                  <span>Mang về</span>
                                </span>
                              ) : (
                                order.tableId?.tableName || t.unknownTable
                              )}
                            </h3>
                            <button
                              onClick={() => setActiveInvoice(order)}
                              className="text-slate-400 hover:text-[#38BDF8] transition-colors"
                              title="Xem chi tiết hóa đơn"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </button>
                          </div>
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-[#1e293b] text-[#0284c7] dark:text-[#38BDF8]'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Order Items List */}
                        <div className="space-y-3 mb-4">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-slate-500 dark:text-slate-400 font-bold w-5">x{item.quantity}</span>
                                <div className="truncate">
                                  <p className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                                    {item.foodId?.name || 'Món ăn'}
                                  </p>
                                  {item.note && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                      Ghi chú: {item.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-slate-900 dark:text-white font-bold">
                                  {formatPrice((item.foodId?.price || 0) * item.quantity)}
                                </span>
                                <button
                                  onClick={() => setOrderToDelete(order._id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                  title="Xóa đơn hàng"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Bottom Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cooking')}
                            className="w-full bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black text-sm py-3 rounded-xl transition-all shadow-md active:scale-95"
                          >
                            Xác nhận đơn
                          </button>
                        )}
                        {order.status === 'cooking' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'completed')}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-sm py-3 rounded-xl transition-all shadow-md active:scale-95"
                          >
                            Hoàn tất món
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'paid')}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95"
                            >
                              Thanh toán Tiền mặt
                            </button>
                            <button
                              onClick={() => setActiveInvoice(order)}
                              className="px-3 py-3 bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                              title="Xem hóa đơn"
                            >
                              <span className="material-symbols-outlined text-base">print</span>
                            </button>
                          </div>
                        )}
                        {isPaid && (
                          <button
                            onClick={() => setActiveInvoice(order)}
                            className="w-full py-2.5 bg-slate-100 dark:bg-[#1e293b] hover:bg-[#38BDF8] hover:text-[#090D16] text-[#0284c7] dark:text-[#38BDF8] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-base">receipt</span>
                            <span>Xem hóa đơn chi tiết</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Menu Management View */}
        {activeTab === 'foods' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-thin">
            {/* Category Filter Pill Bar (Dynamically loaded from DB) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold shrink-0 scrollbar-none">
              {['all', ...availableCategories].map((cat) => {
                const count =
                  cat === 'all'
                    ? foods.length
                    : foods.filter((f) => f.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#38BDF8] text-[#090D16] font-black shadow-sm'
                        : 'bg-white dark:bg-[#131929] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e293b]'
                    }`}
                  >
                    <span>{cat === 'all' ? 'Tất cả danh mục' : cat}</span>
                    <span className="bg-slate-200 dark:bg-[#090D16]/20 px-2 py-0.5 rounded-full text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-4 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tổng cộng {filteredFoods.length} món ăn</span>
              <button
                onClick={() => {
                  setEditingFood(null);
                  setFoodForm({ name: '', price: '', category: 'Cà phê', description: '', image: '', isAvailable: true });
                  setIsFoodModalOpen(true);
                }}
                className="px-3.5 sm:px-4 py-2 bg-[#38BDF8] text-[#090D16] font-extrabold text-xs rounded-xl hover:bg-[#0284c7] transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Thêm món mới</span>
              </button>
            </div>

            {/* Mobile Card List (< sm: 640px) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredFoods.map((food) => (
                <div key={food._id} className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {food.image ? (
                      <img src={food.image} alt={food.name} className="w-12 h-12 rounded-xl object-cover bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-[#1e293b]" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-xl">restaurant</span>
                      </div>
                    )}
                    <div className="truncate">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{food.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{food.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-[#0284c7] dark:text-[#38BDF8] text-xs">{formatPrice(food.price)}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold ${food.isAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                          {food.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingFood(food);
                        setFoodForm({
                          name: food.name || '',
                          price: food.price ? String(food.price) : '',
                          category: food.category || 'Cà phê',
                          description: food.description || '',
                          image: food.image || '',
                          isAvailable: food.isAvailable ?? true,
                        });
                        setIsFoodModalOpen(true);
                      }}
                      className="p-2 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-xl hover:text-[#38BDF8] transition-colors"
                      title="Chỉnh sửa món"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => setFoodToDelete(food._id)}
                      className="p-2 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-xl hover:text-red-500 transition-colors"
                      title="Xóa món"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm: 640px) */}
            <div className="hidden sm:block bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[650px]">
                <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-900 dark:text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Món</th>
                    <th className="p-4">Danh mục</th>
                    <th className="p-4">Giá tiền</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1e293b]">
                  {filteredFoods.map((food) => (
                    <tr key={food._id} className="hover:bg-slate-50 dark:hover:bg-[#182035] transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {food.image && (
                          <img src={food.image} alt={food.name} className="w-9 h-9 rounded-lg object-cover bg-slate-200 dark:bg-slate-800" />
                        )}
                        <span>{food.name}</span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{food.category}</td>
                      <td className="p-4 font-bold text-[#0284c7] dark:text-[#38BDF8]">{formatPrice(food.price)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${food.isAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                          {food.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingFood(food);
                            setFoodForm({
                              name: food.name || '',
                              price: food.price ? String(food.price) : '',
                              category: food.category || 'Cà phê',
                              description: food.description || '',
                              image: food.image || '',
                              isAvailable: food.isAvailable ?? true,
                            });
                            setIsFoodModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#38BDF8] transition-colors"
                          title="Chỉnh sửa món"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setFoodToDelete(food._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Xóa món"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tables Management View */}
        {activeTab === 'tables' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-thin">
            {/* Table Status Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold shrink-0 scrollbar-none">
              {[
                { id: 'all', label: 'Tất cả bàn', count: tables.length },
                { id: 'empty', label: 'Bàn trống', count: tables.filter((t) => t.status === 'empty' || !t.status).length },
                { id: 'serving', label: 'Có khách', count: tables.filter((t) => t.status === 'serving').length },
                { id: 'reserved', label: 'Khách hẹn', count: tables.filter((t) => t.status === 'reserved').length },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedTableStatus(st.id)}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                    selectedTableStatus === st.id
                      ? 'bg-[#38BDF8] text-[#090D16] font-black shadow-sm'
                      : 'bg-white dark:bg-[#131929] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e293b]'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className="bg-slate-200 dark:bg-[#090D16]/20 px-2 py-0.5 rounded-full text-[10px]">
                    {st.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-4 rounded-2xl flex justify-between items-center shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Danh sách {filteredTables.length} bàn ăn</span>
              <button
                onClick={() => {
                  setEditingTable(null);
                  setTableForm({ tableName: '', status: 'empty' });
                  setIsTableModalOpen(true);
                }}
                className="px-3.5 sm:px-4 py-2 bg-[#38BDF8] text-[#090D16] font-extrabold text-xs rounded-xl hover:bg-[#0284c7] transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Thêm bàn mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map((tbl) => (
                <div key={tbl._id} className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl text-center space-y-3 relative group shadow-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{tbl.tableName}</h4>
                  <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-bold">
                    {tbl.status === 'serving' ? 'Có khách' : 'Bàn trống'}
                  </span>

                  <button
                    onClick={() => setQrTable(tbl)}
                    className="w-full py-2 bg-slate-100 dark:bg-[#1e293b] hover:bg-[#38BDF8] hover:text-[#090D16] text-[#0284c7] dark:text-[#38BDF8] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">qr_code_2</span>
                    <span>Xem mã QR</span>
                  </button>

                  <div className="flex justify-center gap-2 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
                    <button
                      onClick={() => {
                        setEditingTable(tbl);
                        setTableForm({ tableName: tbl.tableName || '', status: tbl.status || 'empty' });
                        setIsTableModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-[#38BDF8] transition-colors"
                      title="Sửa bàn"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => setTableToDelete(tbl._id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Xóa bàn"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Management View: ADMIN ONLY */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-thin">
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-4 rounded-2xl flex justify-between items-center shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Danh sách {usersList.length} nhân viên</span>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', password: '', role: 'staff' });
                  setIsUserModalOpen(true);
                }}
                className="px-3.5 sm:px-4 py-2 bg-[#38BDF8] text-[#090D16] font-extrabold text-xs rounded-xl hover:bg-[#0284c7] transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Thêm nhân viên mới</span>
              </button>
            </div>

            {/* Mobile Card List (< sm: 640px) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {usersList.map((u) => (
                <div key={u._id} className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="truncate">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{u.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{u.email}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] rounded-full text-[9.5px] font-bold">
                      {u.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setUserForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'staff' });
                        setIsUserModalOpen(true);
                      }}
                      className="p-2 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-xl hover:text-[#38BDF8] transition-colors"
                      title="Sửa nhân viên"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => setUserToDelete(u._id!)}
                      className="p-2 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-xl hover:text-red-500 transition-colors"
                      title="Xóa nhân viên"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm: 640px) */}
            <div className="hidden sm:block bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[500px]">
                <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-900 dark:text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Họ tên</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Vai trò</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1e293b]">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-[#182035]">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] rounded-full text-[10px] font-bold">
                          {u.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'staff' });
                            setIsUserModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#38BDF8] transition-colors"
                          title="Sửa nhân viên"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setUserToDelete(u._id!)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Xóa nhân viên"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance View */}
        {activeTab === 'attendance' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-thin">
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  {user?.role === 'admin' ? 'Bảng Chấm công & Thanh toán Lương Nhân viên' : 'Điểm danh ca làm hàng ngày'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {user?.role === 'admin'
                    ? 'Hiển thị dữ liệu chấm công của nhân viên, tùy chỉnh mức lương theo giờ, sửa/xóa bản ghi và thanh toán trừ thẳng vào doanh thu'
                    : 'Lưu trực tiếp lịch sử điểm danh vào MongoDB theo thời gian thực'}
                </p>
              </div>

              {/* Only STAFF sees check-in/out buttons */}
              {user?.role === 'staff' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>Check-in điểm danh</span>
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Check-out ca làm</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Card List (< sm: 640px) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {attendances.length === 0 ? (
                <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-8 text-center text-slate-500 text-xs">
                  Chưa có lịch sử điểm danh nào
                </div>
              ) : (
                attendances.map((att) => {
                  const staffId = att.userId?._id || att.userId;
                  const staffName = att.userId?.name || 'Nhân viên';
                  const checkInTime = att.checkIn ? new Date(att.checkIn) : null;
                  const checkOutTime = att.checkOut ? new Date(att.checkOut) : null;

                  let hoursWorked = att.hoursWorked || 0;
                  if (!hoursWorked && checkInTime && checkOutTime) {
                    hoursWorked = Math.max(0, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
                  }
                  hoursWorked = Number(hoursWorked.toFixed(2));

                  const hourlyRate = staffHourlyRates[staffId] || 25000;
                  const totalSalary = Math.round(hoursWorked * hourlyRate);

                  return (
                    <div key={att._id} className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 space-y-3 shadow-xs text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#1e293b]">
                        <span className="font-extrabold text-slate-900 dark:text-white">{staffName}</span>
                        <span className="text-[10px] text-slate-500">
                          {att.date || new Date(att.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Check-in:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {checkInTime ? checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Check-out:</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {checkOutTime ? checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#1e293b]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Số giờ: {hoursWorked}h</span>
                          {user?.role === 'admin' && (
                            <span className="font-black text-[#0284c7] dark:text-[#38BDF8] text-xs">
                              Lương: {formatPrice(totalSalary)}
                            </span>
                          )}
                        </div>

                        {user?.role === 'admin' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingAttendance(att);
                                setAttendanceForm({
                                  checkIn: formatForDatetimeInput(att.checkIn),
                                  checkOut: formatForDatetimeInput(att.checkOut),
                                  note: att.note || '',
                                });
                                setIsAttendanceModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-lg hover:text-[#38BDF8] transition-colors"
                              title="Sửa chấm công"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => setAttendanceToDelete(att._id)}
                              className="p-1.5 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 rounded-lg hover:text-red-500 transition-colors"
                              title="Xóa chấm công"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                            <button
                              onClick={() => handlePayStaffSalary(staffId, hoursWorked, hourlyRate)}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10.5px] rounded-lg transition-all shadow-sm flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>Trả lương</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= sm: 640px) */}
            <div className="hidden sm:block bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[750px]">
                <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-900 dark:text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Ngày</th>
                    <th className="p-4">Nhân viên</th>
                    <th className="p-4">Check-in</th>
                    <th className="p-4">Check-out</th>
                    <th className="p-4">Số giờ làm</th>
                    {user?.role === 'admin' && <th className="p-4">Mức lương/giờ (VND)</th>}
                    {user?.role === 'admin' && <th className="p-4">Lương tính (VND)</th>}
                    {user?.role === 'admin' && <th className="p-4 text-right">Hành động</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1e293b]">
                  {attendances.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 8 : 5} className="p-8 text-center text-slate-500">
                        Chưa có lịch sử điểm danh nào
                      </td>
                    </tr>
                  ) : (
                    attendances.map((att) => {
                      const staffId = att.userId?._id || att.userId;
                      const staffName = att.userId?.name || 'Nhân viên';
                      const checkInTime = att.checkIn ? new Date(att.checkIn) : null;
                      const checkOutTime = att.checkOut ? new Date(att.checkOut) : null;

                      let hoursWorked = att.hoursWorked || 0;
                      if (!hoursWorked && checkInTime && checkOutTime) {
                        hoursWorked = Math.max(0, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
                      }
                      hoursWorked = Number(hoursWorked.toFixed(2));

                      const hourlyRate = staffHourlyRates[staffId] || 25000;
                      const totalSalary = Math.round(hoursWorked * hourlyRate);

                      return (
                        <tr key={att._id} className="hover:bg-slate-50 dark:hover:bg-[#182035]">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">
                            {att.date || new Date(att.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-4 text-slate-800 dark:text-slate-200 font-semibold">{staffName}</td>
                          <td className="p-4 text-emerald-600 dark:text-emerald-400 font-mono">
                            {checkInTime ? checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                          <td className="p-4 text-amber-600 dark:text-amber-400 font-mono">
                            {checkOutTime ? checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{hoursWorked} giờ</td>

                          {user?.role === 'admin' && (
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="1000"
                                  value={hourlyRate}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setStaffHourlyRates((prev) => ({ ...prev, [staffId]: val }));
                                  }}
                                  onBlur={(e) => handleUpdateHourlyRate(staffId, Number(e.target.value))}
                                  className="w-24 bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:border-[#38BDF8]"
                                />
                                <span className="text-[10px] text-slate-500">đ/h</span>
                              </div>
                            </td>
                          )}

                          {user?.role === 'admin' && (
                            <td className="p-4 font-black text-[#0284c7] dark:text-[#38BDF8]">
                              {formatPrice(totalSalary)}
                            </td>
                          )}

                          {user?.role === 'admin' && (
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handlePayStaffSalary(staffId, hoursWorked, hourlyRate)}
                                  className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] rounded-lg transition-all active:scale-95 shadow-sm flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">payments</span>
                                  <span>Trả lương</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAttendance(att);
                                    setAttendanceForm({
                                      checkIn: formatForDatetimeInput(att.checkIn),
                                      checkOut: formatForDatetimeInput(att.checkOut),
                                      note: att.note || '',
                                    });
                                    setIsAttendanceModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#38BDF8] transition-colors"
                                  title="Sửa chấm công"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => setAttendanceToDelete(att._id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Xóa chấm công"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics View: ADMIN ONLY */}
        {activeTab === 'analytics' && user?.role === 'admin' && (
          <div className="flex-1 overflow-y-auto space-y-6 pb-10 scrollbar-thin">
            {/* Overview Summary Cards with Net Revenue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Lợi nhuận ròng hôm nay</span>
                <span className="text-2xl font-black text-[#0284c7] dark:text-[#38BDF8] mt-1 block font-heading">
                  {formatPrice(analyticsSummary?.today || 0)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Doanh thu: {formatPrice(analyticsSummary?.todayGross || 0)} — Trừ lương: {formatPrice(analyticsSummary?.todaySalary || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Lợi nhuận ròng tuần này</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-heading">
                  {formatPrice(analyticsSummary?.week || 0)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Doanh thu: {formatPrice(analyticsSummary?.weekGross || 0)} — Trừ lương: {formatPrice(analyticsSummary?.weekSalary || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Lợi nhuận ròng tháng này</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block font-heading">
                  {formatPrice(analyticsSummary?.month || 0)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Doanh thu: {formatPrice(analyticsSummary?.monthGross || 0)} — Trừ lương: {formatPrice(analyticsSummary?.monthSalary || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Đánh giá trung bình</span>
                <span className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1 block font-heading">
                  ⭐ {avgStar} / 5.0
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {reviews.length} đánh giá từ khách hàng
                </span>
              </div>
            </div>

            {/* Chart.js Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Daily Revenue Trend Line */}
              <div className="lg:col-span-2 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38BDF8] text-base">show_chart</span>
                    <span>Biểu đồ Xu hướng Doanh thu theo Ngày</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tự động vẽ từ MongoDB</span>
                </div>
                <div className="h-64">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>

              {/* Chart 3: Top 5 Selling Foods Doughnut */}
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base">pie_chart</span>
                  <span>Cơ cấu Top Món bán chạy</span>
                </h3>
                <div className="h-64">
                  {topFoods.length > 0 ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">Chưa có dữ liệu món bán</div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart 2: Revenue vs Salaries vs Net Profit Grouped Bar */}
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">bar_chart</span>
                  <span>So sánh Cấu trúc Doanh thu, Chi phí Lương & Lợi nhuận Ròng</span>
                </h3>
              </div>
              <div className="h-72">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* Top Selling Foods Table from DB */}
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38BDF8] text-lg">local_fire_department</span>
                  <span>Top Các món được bán nhiều nhất từ Database</span>
                </h3>
                <span className="bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] px-3 py-1 rounded-full text-xs font-bold">
                  {topFoods.length} món bán chạy
                </span>
              </div>

              {/* Mobile Card List (< sm: 640px) */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {topFoods.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 text-xs">Chưa có dữ liệu thống kê món</p>
                ) : (
                  topFoods.map((tf, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {tf.foodImage && (
                          <img src={tf.foodImage} alt={tf.foodName} className="w-10 h-10 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="block font-bold text-slate-900 dark:text-white truncate">{tf.foodName}</span>
                          <span className="text-[10px] text-slate-500">Hạng #{i + 1} — {tf.category || 'Thực đơn'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-black text-[#0284c7] dark:text-[#38BDF8]">{tf.totalQuantity} món</span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(tf.totalRevenue || 0)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (>= sm: 640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[600px]">
                  <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-900 dark:text-white uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="p-3.5">Tên Món ăn / Thức uống</th>
                      <th className="p-3.5">Danh mục</th>
                      <th className="p-3.5">Đơn giá</th>
                      <th className="p-3.5">Số lượng đã bán</th>
                      <th className="p-3.5 text-right">Tổng doanh thu món</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1e293b]">
                    {topFoods.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">Chưa có dữ liệu thống kê món</td>
                      </tr>
                    ) : (
                      topFoods.map((tf, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#182035] transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            {tf.foodImage && (
                              <img src={tf.foodImage} alt={tf.foodName} className="w-9 h-9 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-[#1e293b]" />
                            )}
                            <div className="truncate">
                              <span className="block font-bold text-slate-900 dark:text-white truncate">{tf.foodName}</span>
                              <span className="text-[10px] text-slate-500">Hạng #{i + 1}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400">{tf.category || 'Thực đơn'}</td>
                          <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{tf.price ? formatPrice(tf.price) : '--'}</td>
                          <td className="p-3.5 font-black text-[#0284c7] dark:text-[#38BDF8] text-sm">{tf.totalQuantity} món</td>
                          <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 text-right">{formatPrice(tf.totalRevenue || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Reviews & Feedback Section */}
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-lg">star</span>
                    <span>Đánh giá & Phản hồi từ Khách hàng</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ý kiến đóng góp trực tiếp từ khách hàng quét QR tại bàn</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1e293b] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-amber-500 dark:text-amber-400 font-black text-sm">⭐ {avgStar}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({reviews.length} đánh giá)</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-8 text-center text-slate-500">
                  Chưa có đánh giá nào từ khách hàng
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] p-4 rounded-xl space-y-2 relative shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{rev.customerName || 'Khách hàng'}</span>
                            <span className="text-[10px] bg-slate-200 dark:bg-[#1e293b] text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-md">
                              {rev.tableId?.tableName || 'Bàn'}
                            </span>
                          </div>
                          <div className="text-amber-500 dark:text-amber-400 text-xs mt-1">
                            {'⭐'.repeat(rev.serviceStar || 5)}
                          </div>
                        </div>

                        <button
                          onClick={() => setReviewToDelete(rev._id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          title="Xóa đánh giá"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">{rev.comment || 'Khách hàng không để lại nhận xét'}</p>

                      <div className="text-[10px] text-slate-500 text-right">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleString('vi-VN') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── COLUMN 3: RIGHT REALTIME ACTIVITY SIDEBAR (#0d1322 / bg-white) ────── */}
      <aside
        className={`fixed xl:static inset-y-0 right-0 z-40 w-80 bg-white dark:bg-[#0d1322] border-l border-slate-200 dark:border-[#1e293b] p-5 h-screen flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${
          isRealtimeDrawerOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full xl:translate-x-0'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
            {user?.role === 'admin' ? 'Chấm công realtime' : 'Hoạt động realtime'}
          </h3>
          <button
            onClick={() => setIsRealtimeDrawerOpen(false)}
            className="xl:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Realtime Activity Filter Tabs */}
        {user?.role === 'admin' ? (
          <>
            {/* Admin Realtime Attendance Filter Tabs */}
            {(() => {
              const now = new Date();
              const todayAttendances = attendances.filter((att) => {
                if (!att.checkIn) return false;
                const d = new Date(att.checkIn);
                return (
                  d.getDate() === now.getDate() &&
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              });
              const checkedInSet = new Set(
                todayAttendances.map((att) => (att.userId?._id || att.userId)?.toString())
              );
              const staffMembers = usersList.filter((u) => u.role === 'staff');
              const checkedInCount = staffMembers.filter((u) => checkedInSet.has(String(u._id || ''))).length;
              const notCheckedInCount = staffMembers.filter((u) => !checkedInSet.has(String(u._id || ''))).length;

              return (
                <div className="flex border-b border-slate-200 dark:border-[#1e293b] mb-4 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => setActivityFilter('all')}
                    className={`pb-2 transition-all ${
                      activityFilter === 'all'
                        ? 'text-[#0284c7] dark:text-[#38BDF8] border-b-2 border-[#38BDF8]'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setActivityFilter('checkedIn')}
                    className={`pb-2 transition-all ${
                      activityFilter === 'checkedIn'
                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-400'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Đã điểm danh ({checkedInCount})
                  </button>
                  <button
                    onClick={() => setActivityFilter('notCheckedIn')}
                    className={`pb-2 transition-all ${
                      activityFilter === 'notCheckedIn'
                        ? 'text-rose-500 dark:text-rose-400 border-b-2 border-rose-400'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Chưa điểm danh ({notCheckedInCount})
                  </button>
                </div>
              );
            })()}

            {/* Admin Realtime Staff Attendance Content */}
            <div className="space-y-4 flex-1 overflow-y-auto scrollbar-none pr-1">
              {(() => {
                const now = new Date();
                const todayAttendances = attendances.filter((att) => {
                  if (!att.checkIn) return false;
                  const d = new Date(att.checkIn);
                  return (
                    d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                  );
                });
                const checkedInMap = new Map<string, any>();
                todayAttendances.forEach((att) => {
                  const uid = (att.userId?._id || att.userId)?.toString();
                  if (uid) checkedInMap.set(uid, att);
                });

                const staffMembers = usersList.filter((u) => u.role === 'staff');
                const checkedInList = staffMembers.filter((u) => checkedInMap.has(String(u._id || '')));
                const notCheckedInList = staffMembers.filter((u) => !checkedInMap.has(String(u._id || '')));

                return (
                  <>
                    {/* Render Checked In Staff */}
                    {(activityFilter === 'all' || activityFilter === 'checkedIn') && (
                      <div className="space-y-2.5">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Nhân viên đã điểm danh ({checkedInList.length})
                        </h4>
                        {checkedInList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Chưa có nhân viên nào điểm danh hôm nay</p>
                        ) : (
                          checkedInList.map((st) => {
                            const attRecord = checkedInMap.get(String(st._id || ''));
                            const cInTime = attRecord?.checkIn
                              ? new Date(attRecord.checkIn).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '';
                            const cOutTime = attRecord?.checkOut
                              ? new Date(attRecord.checkOut).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : null;

                            return (
                              <div
                                key={st._id || st.email}
                                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {st.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                                    {cOutTime ? 'Đã check-out' : 'Đang làm việc'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Check-in lúc: <strong className="text-slate-700 dark:text-slate-300">{cInTime}</strong>
                                  {cOutTime && (
                                    <>
                                      {' '}
                                      | Check-out: <strong className="text-slate-700 dark:text-slate-300">{cOutTime}</strong> ({attRecord.totalHours}h)
                                    </>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">{st.email}</div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Render Not Checked In Staff */}
                    {(activityFilter === 'all' || activityFilter === 'notCheckedIn') && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                          Nhân viên chưa điểm danh ({notCheckedInList.length})
                        </h4>
                        {notCheckedInList.length === 0 ? (
                          <p className="text-xs text-emerald-500 font-bold">Tất cả nhân viên đã điểm danh đầy đủ! 🎉</p>
                        ) : (
                          notCheckedInList.map((st) => (
                            <div
                              key={st._id}
                              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  {st.name}
                                </span>
                                <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md">
                                  Chưa ca
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Chưa có dữ liệu điểm danh ca làm hôm nay
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{st.email}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </>
        ) : (
          /* Staff View: Support Calls & Recent Orders */
          <>
            <div className="flex border-b border-slate-200 dark:border-[#1e293b] mb-4 gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              <button
                onClick={() => setActivityFilter('all')}
                className={`pb-2 transition-all ${
                  activityFilter === 'all'
                    ? 'text-[#0284c7] dark:text-[#38BDF8] border-b-2 border-[#38BDF8]'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setActivityFilter('support')}
                className={`pb-2 transition-all ${
                  activityFilter === 'support'
                    ? 'text-[#0284c7] dark:text-[#38BDF8] border-b-2 border-[#38BDF8]'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hỗ trợ {staffCalls.length > 0 && `(${staffCalls.length})`}
              </button>
              <button
                onClick={() => setActivityFilter('payment')}
                className={`pb-2 transition-all ${
                  activityFilter === 'payment'
                    ? 'text-[#0284c7] dark:text-[#38BDF8] border-b-2 border-[#38BDF8]'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Thanh toán
              </button>
            </div>

            {/* Timeline Items for Staff */}
            <div className="space-y-4 flex-1 overflow-y-auto scrollbar-none pr-1">
              {/* Staff Call Support Items */}
              {(activityFilter === 'all' || activityFilter === 'support') &&
                staffCalls.map((call) => (
                  <div key={call._id} className="flex gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] mt-1.5 shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                        {call.createdAt
                          ? new Date(call.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Vừa xong'}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {call.tableId?.tableName || 'Bàn'} — Yêu cầu hỗ trợ
                      </p>
                      <button
                        onClick={() => handleAcknowledgeCall(call._id)}
                        className="mt-2 px-3 py-1 bg-slate-100 dark:bg-[#1e293b] hover:bg-[#38BDF8] hover:text-[#090D16] text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all"
                      >
                        Đã tiếp nhận
                      </button>
                    </div>
                  </div>
                ))}

              {/* Recent Orders Items */}
              {(activityFilter === 'all' || activityFilter === 'payment') &&
                orders.slice(0, 10).map((order) => (
                  <div key={order._id} className="flex gap-3 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        order.status === 'paid' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <div className="flex-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mb-0.5">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Vừa xong'}
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.tableId?.tableName || 'Bàn'} —{' '}
                        {order.status === 'paid'
                          ? 'Thanh toán'
                          : order.status === 'pending'
                          ? 'Đặt món mới'
                          : 'Đang chế biến'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </aside>

      {/* ── ALL MODALS & TOAST NOTIFICATIONS ────────────────────────────────── */}

      {/* 1. Food Create / Edit Modal */}
      <AnimatePresence>
        {isFoodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFoodModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-lg bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingFood ? t.modalFoodTitleEdit : t.modalFoodTitleAdd}</h3>
                <button onClick={() => setIsFoodModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateFood} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalFoodName}</label>
                  <input type="text" required value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalFoodPrice}</label>
                    <input type="number" required value={foodForm.price} onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalFoodCategory}</label>
                    <select value={foodForm.category} onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#38BDF8] cursor-pointer">
                      <option value="Cà phê" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Cà phê</option>
                      <option value="Trà trái cây" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Trà trái cây</option>
                      <option value="Trà sữa" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Trà sữa</option>
                      <option value="Bánh ngọt" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Bánh ngọt</option>
                      <option value="Đồ uống khác" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Đồ uống khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalFoodDesc}</label>
                  <textarea rows={2} value={foodForm.description} onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalFoodImg}</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setFoodInputType('upload')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${foodInputType === 'upload' ? 'bg-[#38BDF8] text-[#090D16]' : 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300'}`}>{t.modalFoodUpload}</button>
                    <button type="button" onClick={() => setFoodInputType('url')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${foodInputType === 'url' ? 'bg-[#38BDF8] text-[#090D16]' : 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300'}`}>{t.modalFoodUrl}</button>
                  </div>

                  {foodInputType === 'upload' ? (
                    <label className="custum-file-upload" htmlFor="file">
                      <div className="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <g strokeWidth={0} id="SVGRepo_bgCarrier" />
                          <g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier" />
                          <g id="SVGRepo_iconCarrier">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 20.9844 15.122C20.7924 12.8136 18.858 11 16.5 11Z"
                            />
                          </g>
                        </svg>
                      </div>
                      <div className="text">
                        <span>Click to upload image</span>
                      </div>
                      <input type="file" id="file" accept="image/*" onChange={handleCloudinaryUpload} />
                    </label>
                  ) : (
                    <input type="text" placeholder={t.modalFoodUrlPlaceholder} value={foodForm.image} onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                  )}

                  {/* Live Image Preview Box */}
                  {foodForm.image && (
                    <div className="mt-3 p-2.5 bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl flex items-center gap-3">
                      <img
                        src={foodForm.image}
                        alt="Xem trước ảnh món"
                        className="w-14 h-14 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-[#1e293b] shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="truncate flex-1">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 block">Xem trước hình ảnh món</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">{foodForm.image}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="isAvailable" checked={foodForm.isAvailable} onChange={(e) => setFoodForm({ ...foodForm, isAvailable: e.target.checked })} className="rounded" />
                  <label htmlFor="isAvailable" className="text-slate-700 dark:text-slate-300 font-bold">{t.modalFoodActive}</label>
                </div>

                <button type="submit" className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md mt-4">
                  {t.modalFoodSave}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Table Create / Edit Modal */}
      <AnimatePresence>
        {isTableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTableModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingTable ? t.modalTableTitleEdit : t.modalTableTitleAdd}</h3>
                <button onClick={() => setIsTableModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateTable} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Số thứ tự bàn (Chỉ nhập số)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ví dụ: 4 (Tự động lưu là Bàn số 4)"
                    value={tableForm.tableName.replace(/\D/g, '')}
                    onChange={(e) => setTableForm({ ...tableForm, tableName: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {tableForm.tableName.replace(/\D/g, '')
                      ? `Tên hiển thị: Bàn số ${tableForm.tableName.replace(/\D/g, '')}`
                      : 'Hệ thống tự động thêm chữ "Bàn số "'}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalTableStatus}</label>
                  <select value={tableForm.status} onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#38BDF8] cursor-pointer">
                    <option value="empty" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">{t.tableEmpty}</option>
                    <option value="serving" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">{t.tableOccupied}</option>
                    <option value="reserved" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">{t.tableReserved}</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md mt-4">
                  {t.modalFoodSave}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2.5 Table QR Code Modal */}
      <AnimatePresence>
        {qrTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQrTable(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xs print:hidden" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-center">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3 print:hidden">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Mã QR Đặt Món — {qrTable.tableName}</h3>
                <button onClick={() => setQrTable(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 print:hidden">Khách hàng quét mã QR này tại bàn để xem menu & gọi món trực tiếp</p>
                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/table/${qrTable._id}` : '')}`}
                    alt={`QR Code ${qrTable.tableName}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{qrTable.tableName}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b] print:hidden text-xs">
                <div className="flex items-center bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/table/${qrTable._id}` : ''}
                    className="bg-transparent text-slate-700 dark:text-slate-300 text-[11px] truncate flex-1 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/table/${qrTable._id}`);
                        showToast('Đã sao chép link đặt món!', 'success');
                      }
                    }}
                    className="px-2.5 py-1 bg-[#38BDF8] text-[#090D16] font-bold rounded-lg text-[10px] hover:bg-[#0284c7] transition-all ml-1"
                  >
                    Sao chép
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(`${window.location.origin}/table/${qrTable._id}`, '_blank');
                      }
                    }}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    <span>Thử đặt món</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>In QR Code</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. User Create / Edit Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingUser ? t.modalUserTitleEdit : t.modalUserTitleAdd}</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalUserName}</label>
                  <input type="text" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalUserEmail}</label>
                  <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalUserPassword}</label>
                  <input type="password" placeholder={editingUser ? 'Bỏ trống nếu không đổi' : ''} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalUserRole}</label>
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'staff' })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#38BDF8] cursor-pointer">
                    <option value="staff" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">{t.staffRole}</option>
                    <option value="admin" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">{t.adminRole}</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md mt-4">
                  {t.modalFoodSave}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.5 Attendance Edit Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAttendanceModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cập Nhật Giờ Chấm Công</h3>
                <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateAttendance} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Thời gian Check-in</label>
                  <input
                    type="datetime-local"
                    required
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Thời gian Check-out</label>
                  <input
                    type="datetime-local"
                    required
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ghi chú điều chỉnh</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đổi ca hoặc quên check-out..."
                    value={attendanceForm.note}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, note: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md mt-4">
                  Lưu thay đổi chấm công
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Profile Update Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProfileModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.modalProfileTitle}</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Staff Profile Card Overview Header */}
              <div className="bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-[#1e293b] text-[#0284c7] dark:text-[#38BDF8] font-black text-sm flex items-center justify-center border border-[#38BDF8]/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Manager'}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] text-[9.5px] font-extrabold rounded-md uppercase">
                    {user?.role === 'admin' ? t.adminRole : t.staffRole}
                  </span>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalProfileName}</label>
                  <input type="text" required value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalProfileEmail}</label>
                  <input type="email" required value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">{t.modalProfilePassword}</label>
                  <input type="password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]" />
                </div>

                <button type="submit" disabled={isSavingProfile} className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md mt-4 disabled:opacity-50">
                  {isSavingProfile ? t.modalProfileSaving : t.modalProfileSave}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Active Invoice Details Printable Modal */}
      <AnimatePresence>
        {activeInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveInvoice(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xs print:hidden" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-md bg-white text-black rounded-2xl p-6 shadow-2xl space-y-4 font-mono print:p-0 print:shadow-none print:w-full">
              <div className="text-center border-b pb-3">
                <h3 className="text-lg font-black">{t.hubTitle}</h3>
                <p className="text-xs text-gray-600">{t.invoiceTitle}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  {t.invoiceTable}: {activeInvoice.tableId?.tableName || t.unknownTable} | {t.orderCode}: #{activeInvoice._id.slice(-6).toUpperCase()}
                </p>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">{t.invoiceFoodName}</th>
                    <th className="text-center py-1">{t.invoiceQty}</th>
                    <th className="text-right py-1">{t.invoiceSubtotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoice.items?.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5">{item.foodId?.name || 'Món'}</td>
                      <td className="text-center py-1.5">x{item.quantity}</td>
                      <td className="text-right py-1.5">{formatPrice((item.foodId?.price || 0) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t flex justify-between font-black text-sm">
                <span>{t.invoiceTotal}:</span>
                <span>{formatPrice(activeInvoice.totalAmount)}</span>
              </div>

              <div className="flex gap-2 pt-4 print:hidden">
                <button onClick={() => setActiveInvoice(null)} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-300">
                  {t.invoiceBack}
                </button>
                <button onClick={handlePrintInvoice} className="flex-1 py-2 bg-[#38BDF8] text-[#090D16] font-black rounded-xl text-xs hover:bg-[#0284c7]">
                  {t.invoicePrintBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5.5 Staff Takeaway POS Modal (Tạo đơn mang về) */}
      <AnimatePresence>
        {isTakeawayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTakeawayModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-4xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#38BDF8]">shopping_bag</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading">
                    Tạo Đơn Hàng Bán Mang Về (POS)
                  </h3>
                </div>
                <button
                  onClick={() => setIsTakeawayModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body: 2 Columns layout (Catalog Left, Cart Right) */}
              <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-4 min-h-0 pr-1">
                {/* LEFT: Food Catalog (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-3 lg:border-r border-slate-200 dark:border-[#1e293b] lg:pr-4 pb-4 lg:pb-0 lg:h-full lg:overflow-hidden">
                  {/* Category Filter & Search */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Tìm kiếm món ăn, thức uống..."
                      value={takeawaySearch}
                      onChange={(e) => setTakeawaySearch(e.target.value)}
                      className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                    />

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setTakeawayCategory('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                          takeawayCategory === 'all'
                            ? 'bg-[#38BDF8] text-[#090D16]'
                            : 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Tất cả
                      </button>
                      {availableCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setTakeawayCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                            takeawayCategory === cat
                              ? 'bg-[#38BDF8] text-[#090D16]'
                              : 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Food Grid Catalog */}
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] sm:max-h-[300px] lg:max-h-none lg:flex-1 overflow-y-auto pr-1 scrollbar-thin">
                    {foods
                      .filter((f) => f.isAvailable !== false)
                      .filter((f) => {
                        const matchCat = takeawayCategory === 'all' || f.category === takeawayCategory;
                        const matchSearch =
                          !takeawaySearch ||
                          f.name?.toLowerCase().includes(takeawaySearch.toLowerCase()) ||
                          f.category?.toLowerCase().includes(takeawaySearch.toLowerCase());
                        return matchCat && matchSearch;
                      })
                      .map((food) => {
                        const inCart = takeawayCart.find((i) => i.foodId === food._id);
                        return (
                          <div
                            key={food._id}
                            onClick={() => addToTakeawayCart(food)}
                            className="bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] hover:border-[#38BDF8] p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group relative"
                          >
                            <img
                              src={food.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80'}
                              alt={food.name}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#38BDF8]">
                                {food.name}
                              </h4>
                              <p className="text-[11px] font-black text-[#0284c7] dark:text-[#38BDF8]">
                                {formatPrice(food.price)}
                              </p>
                            </div>
                            {inCart && (
                              <span className="absolute -top-1.5 -right-1.5 bg-[#38BDF8] text-[#090D16] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                {inCart.quantity}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* RIGHT: Takeaway Order Cart (5 cols) */}
                <form onSubmit={handleCreateTakeawayOrder} className="lg:col-span-5 flex flex-col gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-[#1e293b] lg:h-full lg:overflow-hidden">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-2">
                    <span>Giỏ hàng mang về ({takeawayCart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                    {takeawayCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTakeawayCart([])}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </h4>

                  {/* Cart Items List */}
                  <div className="space-y-2 pr-1 max-h-[160px] sm:max-h-[220px] lg:max-h-none lg:flex-1 overflow-y-auto min-h-[80px] scrollbar-thin">
                    {takeawayCart.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        <span className="material-symbols-outlined text-3xl mb-1 block">add_shopping_cart</span>
                        Chưa chọn món nào. Nhấp vào món bên trái để thêm vào giỏ.
                      </div>
                    ) : (
                      takeawayCart.map((item) => (
                        <div
                          key={item.foodId}
                          className="bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] p-2.5 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate flex-1">
                              {item.food.name}
                            </span>
                            <span className="font-extrabold text-[#0284c7] dark:text-[#38BDF8]">
                              {formatPrice(item.food.price * item.quantity)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            <input
                              type="text"
                              placeholder="Ghi chú (Ví dụ: Ít đường, không đá...)"
                              value={item.note}
                              onChange={(e) => updateTakeawayNote(item.foodId, e.target.value)}
                              className="flex-1 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-lg px-2 py-1 text-[11px] text-slate-900 dark:text-white focus:outline-none"
                            />
                            <div className="flex items-center gap-1 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => updateTakeawayQuantity(item.foodId, -1)}
                                className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:text-rose-500"
                              >
                                -
                              </button>
                              <span className="font-bold px-1 text-slate-900 dark:text-white text-xs">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateTakeawayQuantity(item.foodId, 1)}
                                className="w-5 h-5 flex items-center justify-center font-bold text-slate-500 hover:text-[#38BDF8]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Customer Info & Order Inputs */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b] text-xs shrink-0">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Tên khách hàng (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên khách nhận món..."
                        value={takeawayCustomerName}
                        onChange={(e) => setTakeawayCustomerName(e.target.value)}
                        className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Thanh toán
                        </label>
                        <select
                          value={takeawayPaymentMethod}
                          onChange={(e) => setTakeawayPaymentMethod(e.target.value as 'cash' | 'momo')}
                          className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-bold cursor-pointer"
                        >
                          <option value="cash" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold">Tiền mặt</option>
                          <option value="momo" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold">Chuyển khoản MoMo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Mã giảm giá
                        </label>
                        <input
                          type="text"
                          placeholder="Mã voucher..."
                          value={takeawayCouponCode}
                          onChange={(e) => setTakeawayCouponCode(e.target.value)}
                          className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                        />
                      </div>
                    </div>

                    {/* Total Amount Summary */}
                    <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-[#1e293b]">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">Tổng cộng tiền món:</span>
                      <span className="text-base font-black text-[#0284c7] dark:text-[#38BDF8]">
                        {formatPrice(takeawayCart.reduce((sum, item) => sum + item.food.price * item.quantity, 0))}
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={takeawayCart.length === 0 || isCreatingTakeaway}
                      className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] disabled:opacity-50 text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>{isCreatingTakeaway ? 'Đang tạo đơn...' : 'Xác nhận tạo đơn mang về'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Delete Confirmation Modal */}
      <AnimatePresence>
        {(orderToDelete || foodToDelete || tableToDelete || userToDelete || reviewToDelete || attendanceToDelete) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setOrderToDelete(null); setFoodToDelete(null); setTableToDelete(null); setUserToDelete(null); setReviewToDelete(null); setAttendanceToDelete(null); }} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl text-center space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xác nhận xóa</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bạn có chắc chắn muốn thực hiện hành động xóa này không?</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setOrderToDelete(null); setFoodToDelete(null); setTableToDelete(null); setUserToDelete(null); setReviewToDelete(null); setAttendanceToDelete(null); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Hủy bỏ
                </button>
                <button onClick={handleConfirmDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Messages */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#38BDF8]/40 text-slate-900 dark:text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#0284c7] dark:text-[#38BDF8]">info</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
