'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

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
    tabOrders: 'Đơn pha chế realtime',
    tabFoods: 'Quản lý thực đơn',
    tabTables: 'Quản lý bàn cà phê',
    tabUsers: 'Đội ngũ Barista & phục vụ',
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
    toastDeleteTable: 'Đã xóa bàn cà phê thành công!',
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
    status_pending: 'CHỜ DUYỆT ĐƠN',
    status_cooking: 'ĐANG PHA CHẾ',
    status_completed: 'PHA CHẾ XONG (CHỜ RA BÀN)',
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
  status: 'pending' | 'confirmed' | 'cooking' | 'ready' | 'completed' | 'cancelled' | 'paid';
  paymentStatus?: 'unpaid' | 'paid';
  paymentMethod: 'cash' | 'momo';
  isTakeaway?: boolean;
  customerName?: string;
  customerPhone?: string;
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
  role: 'admin' | 'waiter' | 'barista' | 'staff';
  assignedShift?: 'morning' | 'afternoon' | 'evening';
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
  const t = DICTIONARY[lang] || DICTIONARY.vi;

  // Toast notifications (Pure text react-hot-toast - NO icons/emojis)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<string | null>(null);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [attendanceToDelete, setAttendanceToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    toast(message, {
      icon: null,
      style: {
        background: type === 'error' ? '#881337' : type === 'info' ? '#0369a1' : '#065f46',
        color: '#FFFFFF',
        border: type === 'error' ? '1px solid #f43f5e' : type === 'info' ? '1px solid #38bdf8' : '1px solid #34d399',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '700',
        padding: '10px 16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
      },
      duration: 3500,
    });
  };

  // Main data states
  const [foods, setFoods] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'foods' | 'tables' | 'users' | 'attendance' | 'analytics'>('foods');
  const [activityFilter, setActivityFilter] = useState<'all' | 'support' | 'payment' | 'checkedIn' | 'notCheckedIn' | 'confirmed' | 'cooking'>('all');
  const [drinkReadyList, setDrinkReadyList] = useState<{ orderId: string; tableName: string; timestamp: Date }[]>([]);
  const [selectedShift, setSelectedShift] = useState<'morning' | 'afternoon' | 'evening'>(() => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
  });

  // Bulk Selection for Orders
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Shift Swap Requests State
  const [shiftSwaps, setShiftSwaps] = useState<any[]>([]);
  const [isShiftSwapModalOpen, setIsShiftSwapModalOpen] = useState(false);
  const [requestedSwapShift, setRequestedSwapShift] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [swapReason, setSwapReason] = useState('');
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

  // Coupons state (for admin)
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'local_cafe',
    order: 0,
    isActive: true,
  });

  const [reservations, setReservations] = useState<any[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    maxUsage: '',
    minOrderAmount: '',
    expiresAt: '',
    isActive: true,
  });

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
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'staff', assignedShift: 'morning' });

  // Staff Takeaway Order State
  const [isTakeawayModalOpen, setIsTakeawayModalOpen] = useState(false);
  const [takeawayCart, setTakeawayCart] = useState<{ foodId: string; food: any; quantity: number; note: string }[]>([]);
  const [takeawayCustomerName, setTakeawayCustomerName] = useState('');
  const [takeawayCustomerPhone, setTakeawayCustomerPhone] = useState('');
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

  // Payment History & Invoice Search State
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<any | null>(null);

  const fetchPaymentHistory = useCallback(async (queryStr?: string, methodStr?: string) => {
    try {
      const params = new URLSearchParams();
      if (queryStr && queryStr.trim()) params.append('query', queryStr.trim());
      if (methodStr && methodStr !== 'all') params.append('paymentMethod', methodStr);
      const res = await fetch(`${API_BASE}/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data);
      }
    } catch (err) {
      console.error('Error fetching payments history:', err);
    }
  }, []);

  useEffect(() => {
    fetchPaymentHistory(paymentSearchQuery, paymentMethodFilter);
  }, [paymentSearchQuery, paymentMethodFilter, fetchPaymentHistory]);

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
        if (u.assignedShift && ['morning', 'afternoon', 'evening'].includes(u.assignedShift)) {
          setSelectedShift(u.assignedShift as any);
        }

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
    fetchCategories();
    fetchTables(token);

    if (user?.role === 'admin') {
      fetchUsers(token);
      fetchAnalytics(token);
      fetchReviews(token);
      fetchPayrolls(token);
      fetchSalaryConfigs(token);
    }
    fetchAttendance(token);
    fetchReservations(token);
    fetchShiftSwaps(token);

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
      setOrders((prev) => {
        const filtered = prev.filter((o) => o._id !== newOrder._id);
        return [newOrder, ...filtered];
      });
      if (token) fetchOrders(token);
      const tableName = newOrder.tableId?.tableName || 'Bàn';
      showToast(`Có đơn hàng mới từ ${tableName}!`, 'info');
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
        audio.play().catch(() => {});
      } catch (e) {}
    });

    socketRef.current.on('statusUpdated', ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status } : order))
      );
      if (token) fetchOrders(token);
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

    socketRef.current.on('newReservation', (newRes: any) => {
      setReservations((prev) => [newRes, ...prev]);
      fetchTables(token);
      showToast(`Khách hàng ${newRes.customerName || ''} vừa đặt bàn!`, 'info');
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
        audio.play();
      } catch (e) {}
    });

    socketRef.current.on('reservationStatusUpdated', ({ id, status }: { id: string; status: string }) => {
      setReservations((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
      fetchTables(token);
    });

    socketRef.current.on('reservationDeleted', ({ id }: { id: string }) => {
      setReservations((prev) => prev.filter((r) => r._id !== id));
      fetchTables(token);
    });

    socketRef.current.on('tableUpdated', () => {
      fetchTables(token);
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

      if (data.attendance) {
        setAttendances((prev) => {
          const exists = prev.some((a) => a._id === data.attendance._id);
          if (exists) {
            return prev.map((a) => (a._id === data.attendance._id ? data.attendance : a));
          }
          return [data.attendance, ...prev];
        });
      }

      if (user?.role === 'admin') {
        const roleLabel =
          data.userRole === 'barista' ? 'Pha chế' :
          data.userRole === 'waiter' ? 'Phục vụ' :
          data.userRole === 'admin' ? 'Quản trị' : 'Nhân viên';
        const actionText = data.type === 'check-in' ? 'Check-in điểm danh ca làm' : 'Check-out ca làm';
        const timeStr = data.timestamp ? new Date(data.timestamp).toLocaleTimeString('vi-VN') : new Date().toLocaleTimeString('vi-VN');
        
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.7;
          audio.play().catch(() => {});
        } catch (_) {}

        showToast(`${roleLabel} ${data.userName || ''} vừa ${actionText} lúc ${timeStr}!`, 'info');
      }
    });

    socketRef.current.on('drinkReadyNotification', (data: { orderId: string; tableName?: string; items?: any[] }) => {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.8;
        audio.play().catch(() => {});
      } catch (_) {}
      const tableNameStr = data.tableName || 'Bàn';
      showToast(`Quầy pha chế đã hoàn tất món cho ${tableNameStr}. Hãy phục vụ khách ngay!`, 'success');

      setDrinkReadyList((prev) => {
        if (prev.some((i) => i.orderId === data.orderId)) return prev;
        return [{ orderId: data.orderId, tableName: tableNameStr, timestamp: new Date() }, ...prev];
      });
    });

    socketRef.current.on('shiftSwapCreated', () => {
      if (token) fetchShiftSwaps(token);
    });

    socketRef.current.on('shiftSwapUpdated', () => {
      if (token) {
        fetchShiftSwaps(token);
        fetchUsers(token);
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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) setCategories(await res.json());
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
      const endpoint = user?.role === 'admin' ? `${API_BASE}/attendance` : `${API_BASE}/attendance/my`;
      const res = await fetch(endpoint, {
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

  const fetchCoupons = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setCoupons(await res.json());
    } catch (e) {}
  };

  const handleCreateOrUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const cleanCode = couponForm.code.toUpperCase().trim();
    const cleanValue = Number(couponForm.value);

    if (!cleanCode || cleanCode.length < 3) {
      showToast('Mã Coupon phải có ít nhất 3 ký tự (Ví dụ: KOHI20).', 'error');
      return;
    }

    if (isNaN(cleanValue) || cleanValue <= 0) {
      showToast('Giá trị giảm giá phải là số hợp lệ lớn hơn 0.', 'error');
      return;
    }

    try {
      const payload: any = {
        code: cleanCode,
        type: couponForm.type,
        value: cleanValue,
        maxUsage: Number(couponForm.maxUsage) || 0,
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        isActive: couponForm.isActive,
      };

      const url = editingCoupon ? `${API_BASE}/coupons/${editingCoupon._id}` : `${API_BASE}/coupons`;
      const method = editingCoupon ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Không thể lưu mã giảm giá.');
      showToast('Lưu mã giảm giá thành công!', 'success');
      setIsCouponModalOpen(false);
      fetchCoupons(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi lưu mã giảm giá.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể xóa mã giảm giá.');
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      showToast('Đã xóa mã giảm giá thành công!', 'success');
    } catch (err) {
      showToast('Không thể xóa mã giảm giá.', 'error');
    }
  };

  const fetchReservations = async (tok: string) => {
    try {
      const res = await fetch(`${API_BASE}/reservations`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (e) {
      console.error('Failed to fetch reservations:', e);
    }
  };

  const handleUpdateReservationStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/reservations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái đặt bàn.');
      showToast('Cập nhật trạng thái đặt bàn thành công!', 'success');
      fetchReservations(token);
      fetchTables(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/reservations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể xóa đơn đặt bàn.');
      setReservations((prev) => prev.filter((r) => r._id !== id));
      fetchTables(token);
      showToast('Đã xóa đơn đặt bàn!', 'success');
    } catch (err) {
      showToast('Lỗi khi xóa đơn đặt bàn.', 'error');
    }
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

  const fetchShiftSwaps = async (tok: string) => {
    try {
      const endpoint = user?.role === 'admin' ? `${API_BASE}/shift-swaps` : `${API_BASE}/shift-swaps/my`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShiftSwaps(data);
      }
    } catch (e) {
      console.error('Failed to fetch shift swaps:', e);
    }
  };

  const handleRequestShiftSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/shift-swaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestedShift: requestedSwapShift,
          reason: swapReason,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Không thể gửi yêu cầu đổi ca.');
      }
      showToast('Đã gửi yêu cầu đổi ca làm! Đang chờ Admin duyệt.', 'success');
      setIsShiftSwapModalOpen(false);
      setSwapReason('');
      fetchShiftSwaps(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi gửi yêu cầu đổi ca.', 'error');
    }
  };

  const handleUpdateShiftSwapStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/shift-swaps/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Không thể duyệt yêu cầu đổi ca.');
      showToast(status === 'approved' ? 'Đã duyệt yêu cầu đổi ca thành công!' : 'Đã từ chối yêu cầu đổi ca.', 'success');
      fetchShiftSwaps(token);
      fetchUsers(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi xử lý.', 'error');
    }
  };

  const handleDeleteBulkOrders = async () => {
    if (!token || selectedOrderIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedOrderIds.length} đơn hàng đã chọn không?`)) return;

    try {
      const res = await fetch(`${API_BASE}/orders/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedOrderIds }),
      });

      if (!res.ok) {
        // Fallback: parallel delete
        await Promise.all(
          selectedOrderIds.map((id) =>
            fetch(`${API_BASE}/orders/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      }

      setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o._id)));
      setSelectedOrderIds([]);
      showToast('Đã xóa thành công các đơn hàng đã chọn!', 'success');
      fetchTables(token);
    } catch (err) {
      showToast('Lỗi khi xóa hàng loạt đơn hàng.', 'error');
    }
  };

  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

  const handleDeletePayment = async (id: string) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/payments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể xóa hóa đơn.');
      setPaymentHistory((prev) => prev.filter((p) => p._id !== id));
      setSelectedPaymentIds((prev) => prev.filter((pId) => pId !== id));
      showToast('Đã xóa hóa đơn thành công!', 'success');
      if (token && user?.role === 'admin') fetchAnalytics(token);
    } catch (err) {
      showToast('Có lỗi xảy ra khi xóa hóa đơn.', 'error');
    }
  };

  const handleDeleteBulkPayments = async () => {
    if (!token || selectedPaymentIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedPaymentIds.length} hóa đơn đã chọn không?`)) return;

    try {
      const res = await fetch(`${API_BASE}/payments/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedPaymentIds }),
      });

      if (!res.ok) {
        await Promise.all(
          selectedPaymentIds.map((id) =>
            fetch(`${API_BASE}/payments/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      }

      setPaymentHistory((prev) => prev.filter((p) => !selectedPaymentIds.includes(p._id)));
      setSelectedPaymentIds([]);
      showToast('Đã xóa các hóa đơn đã chọn thành công!', 'success');
      if (token && user?.role === 'admin') fetchAnalytics(token);
    } catch (err) {
      showToast('Có lỗi xảy ra khi xóa danh sách hóa đơn.', 'error');
    }
  };


  const handleCheckIn = async () => {
    if (!token) return;
    setIsCheckingIn(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shift: user?.assignedShift || 'morning' }),
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

    const cleanName = foodForm.name.trim();
    const cleanPrice = Number(foodForm.price);

    if (!cleanName || cleanName.length < 2) {
      showToast('Vui lòng nhập tên món ăn có ít nhất 2 ký tự.', 'error');
      return;
    }

    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      showToast('Giá món ăn phải là số dương hợp lệ (lớn hơn 0đ).', 'error');
      return;
    }

    if (!foodForm.category) {
      showToast('Vui lòng chọn danh mục cho món ăn.', 'error');
      return;
    }

    try {
      const payload = {
        name: cleanName,
        price: cleanPrice,
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

  // Quick Table Status Toggle Handler
  const handleQuickTableStatusUpdate = async (tableId: string, newStatus: 'empty' | 'serving' | 'reserved') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái bàn.');
      showToast('Cập nhật trạng thái bàn thành công!', 'success');
      fetchTables(token);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    }
  };

  // User Create / Update Handler
  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const cleanName = userForm.name.trim();
    const cleanEmail = userForm.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanName || cleanName.length < 2) {
      showToast('Họ và tên nhân viên phải có ít nhất 2 ký tự.', 'error');
      return;
    }

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      showToast('Vui lòng nhập định dạng email hợp lệ.', 'error');
      return;
    }

    if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
      showToast('Vui lòng nhập mật khẩu có ít nhất 6 ký tự cho nhân viên mới!', 'error');
      return;
    }

    if (userForm.password && userForm.password.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
      return;
    }

    try {
      const payload: any = {
        name: cleanName,
        email: cleanEmail,
        role: userForm.role,
        assignedShift: userForm.assignedShift,
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

    const cleanCustomerName = takeawayCustomerName.trim();
    const cleanCustomerPhone = takeawayCustomerPhone.trim();
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

    if (!cleanCustomerName || cleanCustomerName.length < 2) {
      showToast('Vui lòng nhập Họ và tên khách hàng mang về (tối thiểu 2 ký tự).', 'error');
      return;
    }

    if (!cleanCustomerPhone || !phoneRegex.test(cleanCustomerPhone)) {
      showToast('Vui lòng nhập Số điện thoại hợp lệ của khách hàng mang về (Ví dụ: 0987654321).', 'error');
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
        customerName: cleanCustomerName,
        customerPhone: cleanCustomerPhone,
      };

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
      setTakeawayCustomerName('');
      setTakeawayCustomerPhone('');
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
      if (newStatus === 'completed' || newStatus === 'paid' || newStatus === 'cancelled') {
        setDrinkReadyList((prev) => prev.filter((i) => i.orderId !== orderId));
      }
      showToast(t.toastSaveSuccess, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi cập nhật.', 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const url = editingCategory
        ? `${API_BASE}/categories/${editingCategory._id}`
        : `${API_BASE}/categories`;
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryForm.name,
          icon: categoryForm.icon,
          order: Number(categoryForm.order) || 0,
          isActive: categoryForm.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Không thể lưu danh mục.');
      }

      showToast(editingCategory ? 'Đã cập nhật danh mục!' : 'Đã tạo danh mục mới!', 'success');
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', icon: 'local_cafe', order: 0, isActive: true });
      fetchCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi xử lý.', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể xóa danh mục.');
      showToast('Đã xóa danh mục!', 'success');
      fetchCategories();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi xóa.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    const authToken = token || localStorage.getItem('token');
    if (orderToDelete) {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderToDelete}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        const responseData = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(responseData.message || 'Không thể xóa đơn hàng.');
        setOrders((prev) => prev.filter((o) => o._id !== orderToDelete));
        showToast(t.toastDeleteOrder || 'Đã xóa đơn hàng thành công!', 'success');
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
    (o) => o.status !== 'paid' && o.status !== 'cancelled'
  );
  const paidOrdersList = orders.filter((o) => o.status === 'paid');
  const brewingQueue = orders.filter((o) => o.status === 'confirmed' || o.status === 'cooking');

  const displayedAttendances = attendances.filter((att) => {
    if (user?.role === 'admin') return true;
    const attUserId = (att.userId?._id || att.userId)?.toString();
    const currentUserId = user?._id?.toString();
    return attUserId === currentUserId || att.userId?.email === user?.email;
  });

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
    <div className="h-screen max-h-screen bg-white dark:bg-[#000d41] text-gray-900 dark:text-[#dde1ff] flex flex-col lg:flex-row overflow-hidden font-sans select-none relative transition-colors duration-300">
      {/* ── MOBILE TOP NAVIGATION BAR (Visible on screens < lg) ──────────────── */}
      <div className="lg:hidden shrink-0 flex items-center justify-between bg-white/95 dark:bg-[#000935]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#414754] px-4 py-0 h-14 text-gray-900 dark:text-[#dde1ff] z-30 transition-colors shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#00175e] text-gray-700 dark:text-[#dde1ff] font-bold text-xs cursor-pointer active:scale-95 transition-all shrink-0"
            aria-label="Mở menu"
          >
            ☰
          </button>
          <BrandLogo onClick={() => router.push('/')} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
          <button
            onClick={() => setIsRealtimeDrawerOpen(!isRealtimeDrawerOpen)}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#00175e] text-gray-700 dark:text-[#dde1ff] hover:text-blue-600 dark:hover:text-[#b1c5ff] transition-all cursor-pointer active:scale-95 shrink-0"
            aria-label="Thông báo realtime"
            title="Xem thông báo realtime"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {(staffCalls.length > 0 || (user?.role === 'barista' && brewingQueue.length > 0) || (user?.role !== 'barista' && user?.role !== 'admin' && drinkReadyList.length > 0)) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00adef] dark:bg-[#0876ef] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ── BOTTOM TAB BAR (Mobile-only, < lg) ────────────────────────────────── */}
      <nav
        aria-label="Thanh điều hướng ứng dụng"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-around h-16 px-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      >
        {/* Đơn hàng — staff / waiter / admin */}
        {user?.role !== 'barista' && (
          <button
            type="button"
            onClick={() => { setActiveTab('orders'); setIsMobileSidebarOpen(false); }}
            aria-current={activeTab === 'orders' ? 'page' : undefined}
            className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
              activeTab === 'orders'
                ? 'bg-[#38BDF8]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
              {orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-black bg-[#38BDF8] text-slate-950 rounded-full shadow-xs leading-none">
                  {orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Đơn hàng</span>
          </button>
        )}

        {/* KDS — Barista only */}
        {user?.role === 'barista' && (
          <button
            type="button"
            onClick={() => { setActiveTab('orders'); setIsMobileSidebarOpen(false); }}
            aria-current={activeTab === 'orders' ? 'page' : undefined}
            className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
              activeTab === 'orders'
                ? 'bg-[#38BDF8]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-xl">coffee_maker</span>
            <span className="text-[10px] tracking-tight">Quầy KDS</span>
          </button>
        )}

        {/* Thực đơn — ẩn với barista */}
        {user?.role !== 'barista' && (
          <button
            type="button"
            onClick={() => { setActiveTab('foods'); setIsMobileSidebarOpen(false); }}
            aria-current={activeTab === 'foods' ? 'page' : undefined}
            className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
              activeTab === 'foods'
                ? 'bg-[#38BDF8]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-xl">menu_book</span>
            <span className="text-[10px] tracking-tight">Thực đơn</span>
          </button>
        )}

        {/* Bàn — ẩn với barista */}
        {user?.role !== 'barista' && (
          <button
            type="button"
            onClick={() => { setActiveTab('tables'); setIsMobileSidebarOpen(false); }}
            aria-current={activeTab === 'tables' ? 'page' : undefined}
            className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
              activeTab === 'tables'
                ? 'bg-[#38BDF8]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-xl">table_restaurant</span>
            <span className="text-[10px] tracking-tight">Bàn</span>
          </button>
        )}

        {/* Chấm công */}
        <button
          type="button"
          onClick={() => { setActiveTab('attendance'); setIsMobileSidebarOpen(false); }}
          aria-current={activeTab === 'attendance' ? 'page' : undefined}
          className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 ${
            activeTab === 'attendance'
              ? 'bg-[#38BDF8]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-bold'
          }`}
        >
          <span className="material-symbols-outlined text-xl">schedule</span>
          <span className="text-[10px] tracking-tight">Điểm danh</span>
        </button>

        {/* Thêm — mở sidebar */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-expanded={isMobileSidebarOpen}
          aria-label="Mở menu mở rộng"
          className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0059b9] active:scale-95 ${
            ['analytics', 'users', 'coupons', 'reservations'].includes(activeTab as string)
              ? 'bg-[#0059b9]/10 dark:bg-[#0059b9]/15 text-[#0059b9] dark:text-[#38BDF8] font-black'
              : 'text-[#414754] dark:text-slate-400 hover:text-[#181c23] dark:hover:text-white hover:bg-[#f1f3fe] dark:hover:bg-slate-800/50 font-bold'
          }`}
        >
          <span className="material-symbols-outlined text-xl">grid_view</span>
          <span className="text-[10px] tracking-tight">Thêm</span>
        </button>
      </nav>

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

      {/* ── COLUMN 1: LEFT SIDEBAR (bg-white / dark:bg-[#050e1d]) ────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[260px] shrink-0 bg-white dark:bg-[#050e1d] border-r border-gray-200 dark:border-[#44474e] flex flex-col justify-between h-full transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        data-purpose="left-sidebar"
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Brand Header */}
          <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-[#44474e]">
            <BrandLogo onClick={() => router.push('/')} />
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Sidebar" className="p-3 space-y-1 font-sans">
            {/* Realtime Orders Tab: BARISTA & WAITER & STAFF ROLES ONLY */}
            {user?.role !== 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                  activeTab === 'orders'
                    ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                }`}
              >
                <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                  activeTab === 'orders'
                    ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                    : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                }`}>
                  {user?.role === 'barista' ? 'coffee_maker' : 'receipt_long'}
                </span>
                <span className="flex-1 truncate text-left">{user?.role === 'barista' ? 'Quầy pha chế (KDS)' : t.tabOrders}</span>
                <span className={`ml-auto inline-block py-0.5 px-2 text-xs rounded-full font-medium flex-shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 dark:bg-[#0341a8] text-white dark:text-[#9eb6ff]'
                    : 'bg-gray-100 text-gray-800 dark:bg-[#212a3a] dark:text-[#dae2f9]'
                }`}>
                  {activeOrdersList.length}
                </span>
              </button>
            )}

            {user?.role !== 'barista' && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('foods');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                    activeTab === 'foods'
                      ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                  }`}
                >
                  <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                    activeTab === 'foods'
                      ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                      : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                  }`}>menu_book</span>
                  <span className="flex-1 truncate text-left">{t.tabFoods}</span>
                  <span className={`ml-auto inline-block py-0.5 px-2 text-xs rounded-full font-medium flex-shrink-0 ${
                    activeTab === 'foods'
                      ? 'bg-blue-600 dark:bg-[#0341a8] text-white dark:text-[#9eb6ff]'
                      : 'bg-gray-100 text-gray-800 dark:bg-[#212a3a] dark:text-[#dae2f9]'
                  }`}>
                    {foods.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tables');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                    activeTab === 'tables'
                      ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                  }`}
                >
                  <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                    activeTab === 'tables'
                      ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                      : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                  }`}>table_restaurant</span>
                  <span className="flex-1 truncate text-left">{t.tabTables}</span>
                  <span className={`ml-auto inline-block py-0.5 px-2 text-xs rounded-full font-medium flex-shrink-0 ${
                    activeTab === 'tables'
                      ? 'bg-blue-600 dark:bg-[#0341a8] text-white dark:text-[#9eb6ff]'
                      : 'bg-gray-100 text-gray-800 dark:bg-[#212a3a] dark:text-[#dae2f9]'
                  }`}>
                    {tables.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reservations' as any);
                    setIsMobileSidebarOpen(false);
                    if (token) fetchReservations(token);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                    activeTab === ('reservations' as any)
                      ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                  }`}
                >
                  <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                    activeTab === ('reservations' as any)
                      ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                      : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                  }`}>event_seat</span>
                  <span className="flex-1 truncate text-left">Quản lý bàn đã đặt</span>
                  <span className={`ml-auto inline-block py-0.5 px-2 text-xs rounded-full font-medium flex-shrink-0 ${
                    activeTab === ('reservations' as any)
                      ? 'bg-blue-600 dark:bg-[#0341a8] text-white dark:text-[#9eb6ff]'
                      : 'bg-gray-100 text-gray-800 dark:bg-[#212a3a] dark:text-[#dae2f9]'
                  }`}>
                    {reservations.length}
                  </span>
                </button>
              </>
            )}

            {/* Attendance Tab */}
            <button
              onClick={() => {
                setActiveTab('attendance');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                activeTab === 'attendance'
                  ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
              }`}
            >
              <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                activeTab === 'attendance'
                  ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                  : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
              }`}>schedule</span>
              <span className="flex-1 truncate text-left">{user?.role === 'admin' ? 'Chấm công & Trả lương' : 'Chấm công ca làm'}</span>
            </button>

            {/* Users Management Tab: ADMIN ONLY */}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                  activeTab === 'users'
                    ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                }`}
              >
                <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                  activeTab === 'users'
                    ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                    : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                }`}>manage_accounts</span>
                <span className="flex-1 truncate text-left">{t.tabUsers}</span>
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
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                  activeTab === 'analytics'
                    ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                }`}
              >
                <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                  activeTab === 'analytics'
                    ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                    : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                }`}>insights</span>
                <span className="flex-1 truncate text-left">Thống kê doanh thu DB</span>
              </button>
            )}

            {/* Coupons Management Tab: ADMIN ONLY */}
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('coupons' as any);
                  setIsMobileSidebarOpen(false);
                  if (token) fetchCoupons(token);
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg group transition-all text-left ${
                  activeTab === ('coupons' as any)
                    ? 'sidebar-active bg-[#e0f2fe] text-[#0284c7] dark:bg-[#212a3a] dark:text-[#b3c5ff] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-[#A8B6D1] dark:hover:bg-[#232d41] dark:hover:text-[#F0F4FF] font-medium'
                }`}
              >
                <span className={`material-symbols-outlined mr-3 flex-shrink-0 text-xl ${
                  activeTab === ('coupons' as any)
                    ? 'text-[#0284c7] dark:text-[#b3c5ff]'
                    : 'text-gray-500 group-hover:text-gray-900 dark:text-[#8f9099] dark:group-hover:text-[#F0F4FF]'
                }`}>sell</span>
                <span className="flex-1 truncate text-left">Mã giảm giá</span>
                <span className={`ml-auto inline-block py-0.5 px-2 text-xs rounded-full font-medium flex-shrink-0 ${
                  activeTab === ('coupons' as any)
                    ? 'bg-blue-600 dark:bg-[#0341a8] text-white dark:text-[#9eb6ff]'
                    : 'bg-gray-100 text-gray-800 dark:bg-[#212a3a] dark:text-[#dae2f9]'
                }`}>
                  {coupons.length}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Controls & Bottom User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-[#414754] space-y-3 font-sans">
          <div className="flex items-center justify-between gap-2">
            <LanguageToggleSwitch lang={lang} setLang={setLang} />
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsProfileModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#005edd] text-blue-600 dark:text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="truncate min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-[#dde1ff] truncate leading-tight">{user?.name || 'Nhân viên Phục vụ'}</p>
                <p className="text-xs text-gray-500 dark:text-[#c1c6d6] hover:text-gray-700 dark:hover:text-[#dde1ff] truncate leading-tight">Sửa thông tin</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-[#dde1ff] transition-colors p-1.5 rounded-lg flex-shrink-0 ml-2"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── COLUMN 2: CENTER WORKSPACE (bg-white / dark:bg-[#0a1323]) ────────────────── */}
      <main className="flex-1 min-w-0 bg-white dark:bg-[#0a1323] text-gray-900 dark:text-[#F0F4FF] flex flex-col h-full max-h-full overflow-hidden px-3 pt-3 pb-3 sm:p-6 lg:pb-6 transition-colors duration-300 font-sans">
        {/* Workspace Top Bar (Fixed Header) */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/60 dark:border-[#1e293b]/60">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading truncate">
              {activeTab === 'orders' && (user?.role === 'barista' ? 'Quầy pha chế (KDS)' : t.tabOrders)}
              {activeTab === 'foods' && t.tabFoods}
              {activeTab === 'tables' && t.tabTables}
              {activeTab === 'users' && t.tabUsers}
              {activeTab === 'attendance' && (user?.role === 'admin' ? 'Chấm công & Thanh toán Lương Nhân viên' : 'Chấm công ca làm')}
              {activeTab === 'analytics' && 'Thống kê Doanh thu & Đánh giá Khách hàng'}
              {activeTab === ('coupons' as any) && 'Quản lý Mã giảm giá (Coupons)'}
              {activeTab === ('reservations' as any) && 'Quản lý Bàn đã đặt (Reservations)'}
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Header Notification Bell Icon Button (Desktop Only - Mobile has top bar bell) */}
            <button
              onClick={() => setIsRealtimeDrawerOpen(!isRealtimeDrawerOpen)}
              className="hidden lg:flex relative h-10 px-3.5 items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-extrabold text-xs cursor-pointer active:scale-95 transition-all shrink-0 shadow-xs"
              aria-label="Mở thông báo realtime"
              title="Xem thông báo realtime"
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-[#0059b9] dark:text-[#38BDF8]">notifications</span>
                {(staffCalls.length > 0 || (user?.role === 'barista' && brewingQueue.length > 0) || (user?.role !== 'barista' && user?.role !== 'admin' && drinkReadyList.length > 0)) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#38BDF8] border-2 border-white dark:border-[#131929] animate-pulse" />
                )}
              </div>
              <span>Thông báo</span>
            </button>

            {/* Role-Specific Context Pill Buttons */}
            {user?.role === 'barista' && (
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsRealtimeDrawerOpen(true);
                }}
                className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black cursor-pointer active:scale-95 transition-all shrink-0"
                title="Số món đang chờ pha chế"
              >
                <span className="material-symbols-outlined text-base">coffee_maker</span>
                <span>{brewingQueue.length} món chờ pha</span>
              </button>
            )}

            {(user?.role === 'waiter' || user?.role === 'staff' || !user?.role) && (
              <>
                {drinkReadyList.length > 0 && (
                  <button
                    onClick={() => setIsRealtimeDrawerOpen(true)}
                    className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black cursor-pointer active:scale-95 transition-all shrink-0 animate-pulse"
                    title="Đồ uống sẵn sàng trả bàn"
                  >
                    <span className="material-symbols-outlined text-base">local_cafe</span>
                    <span>{drinkReadyList.length} món xong</span>
                  </button>
                )}
                {staffCalls.length > 0 && (
                  <button
                    onClick={() => setIsRealtimeDrawerOpen(true)}
                    className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#0284c7] dark:text-[#38BDF8] text-xs font-black cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse shrink-0" />
                    <span>{staffCalls.length} cuộc gọi bàn</span>
                  </button>
                )}
              </>
            )}

            {user?.role === 'admin' && staffCalls.length > 0 && (
              <button
                onClick={() => setIsRealtimeDrawerOpen(true)}
                className="h-10 px-3 flex items-center gap-1.5 rounded-xl bg-[#0059b9]/10 border border-[#0059b9]/30 text-[#0059b9] dark:text-[#38BDF8] text-xs font-black cursor-pointer active:scale-95 transition-all shrink-0"
                title="Khách hàng gọi phục vụ"
              >
                <span className="w-2 h-2 rounded-full bg-[#0059b9] animate-pulse shrink-0" />
                <span>{staffCalls.length} gọi bàn</span>
              </button>
            )}

            {/* Search Input for foods/tables */}
            {activeTab === 'foods' && (
              <input
                type="text"
                placeholder={t.foodSearchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 sm:w-64 bg-white dark:bg-[#131929] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg px-3.5 py-2 text-xs text-[#181c23] dark:text-white placeholder-[#717785] focus:outline-none focus:border-[#0059b9] shadow-xs"
              />
            )}
          </div>
        </div>

        {/* Realtime Orders View */}
        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-24 lg:pb-10 scrollbar-thin">

            {/* ── ORDERS TOOLBAR ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-[#ebedf8] dark:bg-[#131929] rounded-xl border border-[#c1c6d6] dark:border-[#1e293b]">
                <button
                  onClick={() => setOrderStatusFilter('active')}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === 'active'
                      ? 'bg-white dark:bg-[#1e293b] text-[#0059b9] dark:text-[#38BDF8] shadow-xs font-extrabold'
                      : 'text-[#414754] dark:text-slate-400 hover:text-[#181c23] dark:hover:text-slate-200'
                  }`}
                >
                  <span className="whitespace-nowrap">Đang xử lý</span>
                  {orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${orderStatusFilter === 'active' ? 'bg-[#0059b9] text-white' : 'bg-[#acc7fe]/50 text-[#385282]'}`}>
                      {orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setOrderStatusFilter('paid')}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === 'paid'
                      ? 'bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold'
                      : 'text-[#414754] dark:text-slate-400 hover:text-[#181c23] dark:hover:text-slate-200'
                  }`}
                >
                  <span className="whitespace-nowrap">Đã thanh toán</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${orderStatusFilter === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-[#acc7fe]/50 text-[#385282]'}`}>
                    {paidOrdersList.length}
                  </span>
                </button>
                <button
                  onClick={() => setOrderStatusFilter('all')}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === 'all'
                      ? 'bg-white dark:bg-[#1e293b] text-[#181c23] dark:text-white shadow-xs font-extrabold'
                      : 'text-[#414754] dark:text-slate-400 hover:text-[#181c23] dark:hover:text-slate-200'
                  }`}
                >
                  <span className="whitespace-nowrap">Tất cả</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#acc7fe]/50 text-[#385282]">
                    {orders.length}
                  </span>
                </button>
              </div>

              {/* CTA: Create Takeaway */}
              {user?.role !== 'barista' && (
                <button
                  onClick={() => {
                    setTakeawayCart([]);
                    setTakeawayCustomerName('');
                    setTakeawayCustomerPhone('');
                    setTakeawayPaymentMethod('cash');
                    setTakeawayCouponCode('');
                    setIsTakeawayModalOpen(true);
                  }}
                  className="h-10 px-5 bg-[#0059b9] hover:bg-[#004591] text-white font-bold rounded-lg text-xs flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer w-full sm:w-auto"
                >
                  Tạo đơn mang về
                </button>
              )}
            </div>

            {/* Bulk Delete Toolbar */}
            {orderStatusFilter !== 'paid' && (displayedOrders.length > 2 || selectedOrderIds.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#131929] border border-[#c1c6d6] dark:border-[#1e293b] p-3.5 rounded-xl text-xs font-bold shadow-xs">
                {displayedOrders.length > 2 && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-[#181c23] dark:text-slate-200 font-extrabold">
                    <input
                      type="checkbox"
                      checked={displayedOrders.length > 0 && displayedOrders.every((o) => selectedOrderIds.includes(o._id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...displayedOrders.map(o => o._id)])));
                        } else {
                          const s = new Set(displayedOrders.map(o => o._id));
                          setSelectedOrderIds((prev) => prev.filter(id => !s.has(id)));
                        }
                      }}
                      className="w-4 h-4 rounded border-[#c1c6d6] dark:border-slate-700 text-[#0059b9] cursor-pointer"
                    />
                    <span>{selectedOrderIds.length > 0 ? `Đã chọn ${selectedOrderIds.length} / ${displayedOrders.length}` : `Chọn tất cả (${displayedOrders.length})`}</span>
                  </label>
                )}
                {selectedOrderIds.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => setSelectedOrderIds([])} className="px-3 py-1.5 text-[#414754] hover:text-[#181c23] dark:hover:text-slate-300 font-bold cursor-pointer">Bỏ chọn</button>
                    <button onClick={handleDeleteBulkOrders} className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-xs rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer">
                      Xóa {selectedOrderIds.length} đơn
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Table Merge Alert */}
            {mergeableTables.length > 0 && mergeableTables.map(([tId, info]) => (
              <div key={tId} className="bg-sky-50 dark:bg-[#0e2238] border border-[#38BDF8]/40 rounded-xl p-3.5 flex items-center justify-between text-xs text-[#0284c7] dark:text-[#38BDF8]">
                <span className="font-semibold">Gộp tất cả đơn của {info.tableName} làm 1</span>
                <button onClick={() => handleMergeTableOrders(tId)} className="px-3 py-1 bg-[#38BDF8] text-[#090D16] font-black text-xs rounded-lg hover:bg-[#0284c7] transition-all">Gộp đơn</button>
              </div>
            ))}

            {/* Search & Filter for Paid / All History */}
            {(orderStatusFilter === 'paid' || orderStatusFilter === 'all') && (
              <div className="space-y-3 mb-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 rounded-2xl shadow-xs">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Tìm bằng Mã HD, Tên bàn hoặc Khách..."
                      value={paymentSearchQuery}
                      onChange={(e) => setPaymentSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-9 py-2 bg-white dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                    />
                    {paymentSearchQuery && (
                      <button onClick={() => setPaymentSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs font-black">X</button>
                    )}
                  </div>
                </div>

                {/* Bulk Selection & Batch Delete Toolbar for Invoices in Paid Tab */}
                {orderStatusFilter === 'paid' && (paymentHistory.length > 0 || selectedPaymentIds.length > 0) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 rounded-2xl text-xs font-bold shadow-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-800 dark:text-slate-200 font-extrabold">
                      <input
                        type="checkbox"
                        checked={paymentHistory.length > 0 && paymentHistory.every((p) => selectedPaymentIds.includes(p._id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allIds = paymentHistory.map((p) => p._id);
                            setSelectedPaymentIds(Array.from(new Set(allIds)));
                          } else {
                            setSelectedPaymentIds([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#38BDF8] focus:ring-[#38BDF8] cursor-pointer"
                      />
                      <span>
                        {selectedPaymentIds.length > 0
                          ? `Đã chọn ${selectedPaymentIds.length} / ${paymentHistory.length} hóa đơn`
                          : `Chọn tất cả (${paymentHistory.length} hóa đơn đang hiển thị)`}
                      </span>
                    </label>

                    {selectedPaymentIds.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => setSelectedPaymentIds([])}
                          className="px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                        <button
                          onClick={handleDeleteBulkPayments}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                          <span>Xóa {selectedPaymentIds.length} hóa đơn đã chọn</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paid Payment History Grid View */}
            {orderStatusFilter === 'paid' ? (
              paymentHistory.length === 0 ? (
                <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-12 text-center text-slate-400">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {paymentSearchQuery ? `Không tìm thấy hóa đơn mã "${paymentSearchQuery}"` : 'Chưa có hóa đơn thanh toán nào'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thử đổi từ khóa hoặc tìm kiếm bằng Mã Hóa Đơn HD-XXXXXX</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paymentHistory.map((payment) => {
                    const isSelected = selectedPaymentIds.includes(payment._id);
                    return (
                      <div
                        key={payment._id || payment.invoiceCode}
                        className={`bg-white dark:bg-[#131929] border rounded-2xl p-4 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                          isSelected ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/60 bg-sky-50/20 dark:bg-[#38BDF8]/5' : 'border-slate-200 dark:border-[#1e293b]'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPaymentIds((prev) => [...prev, payment._id]);
                                  } else {
                                    setSelectedPaymentIds((prev) => prev.filter((id) => id !== payment._id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#38BDF8] focus:ring-[#38BDF8] cursor-pointer shrink-0"
                              />
                              <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-600 dark:text-[#38BDF8] border border-cyan-500/30 rounded-lg text-xs font-black font-mono">
                                {payment.invoiceCode}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">
                              {new Date(payment.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{payment.tableName}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{payment.customerName || 'Khách vãng lai'}</p>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {payment.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[11px]">
                                <span className="truncate pr-2 font-medium">
                                  <strong className="text-slate-900 dark:text-white font-bold">{item.quantity}x</strong> {item.foodName}
                                </span>
                                <span className="font-semibold text-slate-500">{formatPrice(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-[#1e293b] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Thành tiền:</span>
                            <span className="text-sm font-black text-[#38BDF8]">{formatPrice(payment.totalAmount)}</span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="uppercase font-bold text-slate-500">{payment.paymentMethod === 'momo' ? 'Ví MoMo' : 'Tiền mặt'}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedInvoiceModal(payment)}
                                className="px-3 py-1 bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] font-black rounded-lg transition-all text-[11px] cursor-pointer"
                              >
                                Xem HD
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment._id)}
                                className="px-2 py-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-[11px] font-bold"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : orderStatusFilter === 'all' ? (
              // Custom History Card Layout for "Tất cả lịch sử"
              (() => {
                const filteredAllOrders = displayedOrders.filter((order) => {
                  if (paymentMethodFilter !== 'all' && order.paymentMethod !== paymentMethodFilter) {
                    return false;
                  }
                  if (!paymentSearchQuery.trim()) return true;
                  const q = paymentSearchQuery.trim().toLowerCase();
                  const invoiceCode = ((order as any).invoiceCode || `HD-${order._id.slice(-6)}`).toLowerCase();
                  const tableName = (order.tableId?.tableName || (order as any).tableName || '').toLowerCase();
                  const customerName = (order.customerName || '').toLowerCase();
                  const customerPhone = ((order as any).customerPhone || '').toLowerCase();

                  return (
                    invoiceCode.includes(q) ||
                    order._id.toLowerCase().includes(q) ||
                    tableName.includes(q) ||
                    customerName.includes(q) ||
                    customerPhone.includes(q)
                  );
                });

                const getOrderStatusBadge = (status: string) => {
                  switch (status) {
                    case 'pending':
                      return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase">Chờ Phục Vụ</span>;
                    case 'confirmed':
                      return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded-lg text-[10px] font-black uppercase">Chờ Pha Chế</span>;
                    case 'cooking':
                      return <span className="px-2.5 py-1 bg-sky-500/20 text-sky-500 border border-sky-500/40 rounded-lg text-[10px] font-black uppercase">Đang Pha Chế</span>;
                    case 'ready':
                      return <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">Chờ Ra Món</span>;
                    case 'completed':
                      return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 rounded-lg text-[10px] font-black uppercase">Đã Ra Món</span>;
                    case 'paid':
                      return <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">Đã Thanh Toán</span>;
                    default:
                      return <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase">Đang Xử Lý</span>;
                  }
                };

                if (filteredAllOrders.length === 0) {
                  return (
                    <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-12 text-center text-slate-400">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {paymentSearchQuery ? `Không tìm thấy đơn "${paymentSearchQuery}"` : 'Chưa có đơn hàng nào trong lịch sử'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thử đổi từ khóa hoặc tìm kiếm bằng Mã Hóa Đơn HD-XXXXXX</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredAllOrders.map((order) => {
                      const isSelected = selectedOrderIds.includes(order._id);
                      const invoiceCode = (order as any).invoiceCode || `HD-${order._id.slice(-6).toUpperCase()}`;
                      const totalAmount = order.totalAmount || order.items?.reduce((sum: number, i: any) => sum + (i.price || i.foodId?.price || 0) * i.quantity, 0) || 0;
                      const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={order._id}
                          className={`bg-white dark:bg-[#131929] border rounded-2xl p-4 space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                            isSelected ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/60 bg-sky-50/20 dark:bg-[#38BDF8]/5' : 'border-slate-200 dark:border-[#1e293b]'
                          }`}
                        >
                          <div className="space-y-2.5">
                            {/* Card Header: Checkbox + Invoice Code + Time */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedOrderIds((prev) => [...prev, order._id]);
                                    } else {
                                      setSelectedOrderIds((prev) => prev.filter((id) => id !== order._id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#38BDF8] focus:ring-[#38BDF8] cursor-pointer shrink-0"
                                />
                                <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-600 dark:text-[#38BDF8] border border-cyan-500/30 rounded-lg text-xs font-black font-mono">
                                  {invoiceCode}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-slate-400">{timeStr}</span>
                            </div>

                            {/* Table Name & Customer */}
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                                <span>{order.isTakeaway || !order.tableId ? 'Mang về' : (order.tableId?.tableName || (order as any).tableName || 'Bàn không xác định')}</span>
                                {order.status !== 'paid' && getOrderStatusBadge(order.status)}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {order.customerName || ((order as any).customerPhone ? `Khách: ${(order as any).customerPhone}` : 'Khách vãng lai')}
                              </p>
                            </div>

                            {/* Items List */}
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                              {order.items?.map((item: any, idx: number) => {
                                const name = item.foodName || item.foodId?.name || 'Món ăn';
                                const price = item.price || item.foodId?.price || 0;
                                const itemTotal = item.total || price * item.quantity;
                                return (
                                  <div key={idx} className="flex justify-between items-center text-[11px]">
                                    <span className="truncate pr-2 font-medium">
                                      <strong className="text-slate-900 dark:text-white font-bold">{item.quantity}x</strong> {name}
                                    </span>
                                    <span className="font-semibold text-slate-500">{formatPrice(itemTotal)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Card Bottom: Price, Payment Method, Actions */}
                          <div className="pt-3 border-t border-slate-100 dark:border-[#1e293b] space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-medium">Thành tiền:</span>
                              <span className="text-sm font-black text-[#38BDF8]">{formatPrice(totalAmount)}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="uppercase font-bold text-slate-500">
                                {order.paymentMethod === 'momo' ? 'VÍ MOMO' : 'TIỀN MẶT'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setActiveInvoice(order)}
                                  className="px-3 py-1 bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] font-black rounded-lg transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                  <span>Xem Hóa Đơn</span>
                                </button>
                                <button
                                  onClick={() => setOrderToDelete(order._id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                  title="Xóa đơn hàng"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : displayedOrders.length === 0 ? (
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-12 text-center text-slate-400">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {(orderStatusFilter as string) === 'paid' ? 'Chưa có đơn hàng nào đã thanh toán' : t.noOrders}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.noOrdersDesc}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {displayedOrders.map((order) => {
                  const getOrderStatusBadge = (status: string) => {
                    switch (status) {
                      case 'pending':
                        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase">Chờ Phục Vụ Duyệt</span>;
                      case 'confirmed':
                        return <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded-lg text-[10px] font-black uppercase">Chờ Pha Chế</span>;
                      case 'cooking':
                        return <span className="px-2.5 py-1 bg-sky-500/20 text-sky-500 border border-sky-500/40 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />Đang Pha Chế</span>;
                      case 'ready':
                        return <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase">Xong - Chờ Ra Món</span>;
                      case 'completed':
                        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 rounded-lg text-[10px] font-black uppercase">Đã Ra Món Tại Bàn</span>;
                      case 'paid':
                        return <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">Đã Thanh Toán</span>;
                      default:
                        return <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase">Đang Xử Lý</span>;
                    }
                  };

                  const isPaid = order.status === 'paid';
                  const isSelected = selectedOrderIds.includes(order._id);

                  return (
                    <div
                      key={order._id}
                      className={`bg-white dark:bg-[#131929] border rounded-2xl p-5 shadow-sm dark:shadow-lg flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/60 bg-sky-50/20 dark:bg-[#38BDF8]/5'
                          : isPaid
                          ? 'border-emerald-500/30 hover:border-slate-300 dark:hover:border-slate-700'
                          : 'border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Card Header: Table Name & Status */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e293b] mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedOrderIds((prev) => [...prev, order._id]);
                                  } else {
                                    setSelectedOrderIds((prev) => prev.filter((id) => id !== order._id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#38BDF8] focus:ring-[#38BDF8] cursor-pointer shrink-0"
                              />
                              <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                                {order.isTakeaway || !order.tableId ? (
                                  <span className="text-[#0284c7] dark:text-[#38BDF8]">Mang về</span>
                                ) : (
                                  order.tableId?.tableName || t.unknownTable
                                )}
                              </h3>
                              <button
                                onClick={() => setActiveInvoice(order)}
                                className="text-[11px] font-bold text-slate-400 hover:text-[#38BDF8] transition-colors px-1"
                              >
                                HD
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {order.paymentMethod === 'momo' ? (
                                <span className="px-2 py-0.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30 rounded-md text-[10px] font-black uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                  Ví MoMo
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Tiền mặt
                                </span>
                              )}
                              {(order.customerName || order.customerPhone) && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                                  • {order.customerName || 'Khách'}{order.customerPhone ? ` (${order.customerPhone})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          {getOrderStatusBadge(order.status)}
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
                                {(user?.role !== 'barista' || !['ready', 'served', 'completed', 'paid'].includes(order.status)) && (
                                  <button
                                    onClick={() => setOrderToDelete(order._id)}
                                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors px-1 text-[11px] font-bold"
                                  >
                                    x
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Bottom Action Buttons: 5-Step Lifecycle */}
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
                        {/* Step 1 -> 2: Phục vụ xác nhận & gửi pha chế */}
                        {order.status === 'pending' && (
                          user?.role === 'barista' ? (
                            <button
                              disabled
                              className="w-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs py-3 rounded-xl cursor-not-allowed text-center border border-amber-500/20"
                            >
                              Chờ Phục vụ duyệt đơn
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                              className="w-full bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              Xác Nhận & Chuyển Quầy Pha Chế
                            </button>
                          )
                        )}

                        {/* Step 2 -> 3: Barista bắt đầu pha chế / Waiter xem trạng thái */}
                        {order.status === 'confirmed' && (
                          user?.role === 'barista' || user?.role === 'admin' ? (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'cooking')}
                              className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              Bắt Đầu Pha Chế
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 font-extrabold text-xs py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800"
                            >
                              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                              <span>Đã chuyển quầy pha chế (Chờ làm món)</span>
                            </button>
                          )
                        )}

                        {/* Step 3 -> 4: Barista hoàn tất pha chế / Waiter xem trạng thái đang pha chế */}
                        {order.status === 'cooking' && (
                          user?.role === 'barista' || user?.role === 'admin' ? (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'ready')}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              Hoàn Tất Pha Chế (Báo Phục Vụ)
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold text-xs py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-sky-500/20"
                            >
                              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                              <span>Đang pha chế tại quầy...</span>
                            </button>
                          )
                        )}

                        {/* Step 4 -> 5: Phục vụ mang đồ ra bàn cho Khách */}
                        {order.status === 'ready' && (
                          user?.role === 'barista' ? (
                            <button disabled className="w-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs py-3 rounded-xl cursor-not-allowed flex items-center justify-center border border-emerald-500/20">
                              Đã báo Phục vụ ra món
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'completed')}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              Đã Ra Món Tại Bàn
                            </button>
                          )
                        )}

                        {/* Step 5: Phục vụ thanh toán (Hiển thị phương thức MoMo / Tiền mặt chính xác) */}
                        {order.status === 'completed' && (
                          user?.role === 'barista' ? (
                            <button disabled className="w-full bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 font-extrabold text-xs py-3 rounded-xl cursor-not-allowed flex items-center justify-center border border-slate-200 dark:border-slate-800">
                              Đã hoàn tất pha chế & ra món
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(order._id, 'paid')}
                                className={`flex-1 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                                  order.paymentMethod === 'momo'
                                    ? 'bg-pink-600 hover:bg-pink-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                              >
                                {order.paymentMethod === 'momo' ? 'Xác nhận Thanh toán MoMo' : 'Thanh toán Tiền mặt'}
                              </button>
                              <button
                                onClick={() => setActiveInvoice(order)}
                                className="px-3 py-3 bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                              >
                                Xem HD
                              </button>
                            </div>
                          )
                        )}
                        {isPaid && (
                          <button
                            onClick={() => setActiveInvoice(order)}
                            className="w-full py-2.5 bg-slate-100 dark:bg-[#1e293b] hover:bg-[#38BDF8] hover:text-[#090D16] text-[#0284c7] dark:text-[#38BDF8] text-xs font-bold rounded-xl transition-all"
                          >
                            Xem hóa đơn chi tiết
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
          <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:pb-10 scrollbar-thin">
            <div className="flex justify-between items-center bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-4 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tổng cộng {filteredFoods.length} món ăn</span>
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', icon: 'local_cafe', order: categories.length + 1, isActive: true });
                      setIsCategoryModalOpen(true);
                    }}
                    className="px-3.5 sm:px-4 py-2 bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">category</span>
                    <span>Quản lý Danh mục</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingFood(null);
                    setFoodForm({ name: '', price: '', category: categories[0]?.name || 'Cà phê', description: '', image: '', isAvailable: true });
                    setIsFoodModalOpen(true);
                  }}
                  className="px-3.5 sm:px-4 py-2 bg-[#38BDF8] text-[#090D16] font-extrabold text-xs rounded-xl hover:bg-[#0284c7] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Thêm món mới</span>
                </button>
              </div>
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
                    <tr key={food._id} className="hover:bg-slate-100/60 dark:hover:bg-[#182035] transition-colors">
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
          <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:pb-10 scrollbar-thin">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
              {filteredTables.map((tbl) => {
                const tableOrders = orders.filter(
                  (o) => (o.tableId?._id === tbl._id || (o.tableId as any) === tbl._id) && o.status !== 'paid' && o.status !== 'cancelled'
                );
                const hasActiveOrders = tableOrders.length > 0;
                const effectiveStatus = hasActiveOrders ? 'serving' : (tbl.status || 'empty');
                const totalBill = tableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                let cardBorder = 'border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700';
                let headerBg = 'bg-white dark:bg-slate-900/50';
                let statusBadge = (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Trống
                  </span>
                );

                if (effectiveStatus === 'serving') {
                  cardBorder = 'border-emerald-500/40 shadow-emerald-500/5 dark:shadow-emerald-500/10';
                  headerBg = 'bg-emerald-500/10 dark:bg-emerald-950/20';
                  statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Có khách
                    </span>
                  );
                } else if (effectiveStatus === 'reserved') {
                  cardBorder = 'border-amber-500/40 shadow-amber-500/5 dark:shadow-amber-500/10';
                  headerBg = 'bg-amber-500/10 dark:bg-amber-950/20';
                  statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Khách hẹn
                    </span>
                  );
                }

                return (
                  <div
                    key={tbl._id}
                    className={`bg-white dark:bg-[#131929] border ${cardBorder} rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg group relative overflow-hidden`}
                  >
                    {/* Card Header */}
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl ${headerBg} flex items-center justify-between`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 flex items-center justify-center font-black text-sm shadow-xs select-none">
                            {(tbl.tableName || 'B').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{tbl.tableName}</h4>
                            {hasActiveOrders && (
                              <p className="text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                {tableOrders.length} đơn • {formatPrice(totalBill)}
                              </p>
                            )}
                          </div>
                        </div>
                        {statusBadge}
                      </div>

                      {/* Quick Status Control Buttons */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Đổi trạng thái nhanh:</span>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-[#090D16] rounded-xl border border-slate-200 dark:border-[#1e293b]">
                          <button
                            type="button"
                            onClick={() => handleQuickTableStatusUpdate(tbl._id, 'empty')}
                            className={`py-2.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer active:scale-95 ${
                              tbl.status === 'empty'
                                ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Trống
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickTableStatusUpdate(tbl._id, 'serving')}
                            className={`py-2.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer active:scale-95 ${
                              tbl.status === 'serving'
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'text-slate-500 hover:text-emerald-500'
                            }`}
                          >
                            Có khách
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickTableStatusUpdate(tbl._id, 'reserved')}
                            className={`py-2.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer active:scale-95 ${
                              tbl.status === 'reserved'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-500 hover:text-amber-500'
                            }`}
                          >
                            Đã đặt
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center gap-2">
                      <button
                        onClick={() => setQrTable(tbl)}
                        className="flex-1 h-9 bg-[#38BDF8]/10 hover:bg-[#38BDF8] text-[#0284c7] dark:text-[#38BDF8] hover:text-[#090D16] rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        QR Code
                      </button>

                      <button
                        onClick={() => {
                          setEditingTable(tbl);
                          setTableForm({ tableName: tbl.tableName || '', status: tbl.status || 'empty' });
                          setIsTableModalOpen(true);
                        }}
                        className="h-9 px-3 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-[#38BDF8] rounded-xl transition-colors cursor-pointer text-xs font-bold active:scale-95"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => setTableToDelete(tbl._id)}
                        className="h-9 px-3 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-rose-500 rounded-xl transition-colors cursor-pointer text-xs font-bold active:scale-95"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Users Management View: ADMIN ONLY */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:pb-10 scrollbar-thin">
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-4 rounded-2xl flex justify-between items-center shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Danh sách {usersList.length} nhân viên</span>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', password: '', role: 'staff', assignedShift: 'morning' });
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
                      {u.role === 'admin' ? 'Quản trị (Admin)' : u.role === 'barista' ? 'Pha chế (Barista)' : u.role === 'waiter' ? 'Phục vụ (Waiter)' : 'Nhân viên'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setUserForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'staff', assignedShift: u.assignedShift || 'morning' });
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
                    <th className="p-4">Ca phân công</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1e293b]">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-100/60 dark:hover:bg-[#182035]">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] rounded-full text-[10px] font-bold">
                          {u.role === 'admin' ? 'Quản trị (Admin)' : u.role === 'barista' ? 'Pha chế (Barista)' : u.role === 'waiter' ? 'Phục vụ (Waiter)' : 'Nhân viên'}
                        </span>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const s = u.assignedShift || 'morning';
                          if (s === 'morning') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                <span className="material-symbols-outlined text-xs">wb_sunny</span>
                                <span>Ca Sáng (06h-12h)</span>
                              </span>
                            );
                          }
                          if (s === 'afternoon') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <span className="material-symbols-outlined text-xs">light_mode</span>
                                <span>Ca Chiều (12h-18h)</span>
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              <span className="material-symbols-outlined text-xs">dark_mode</span>
                              <span>Ca Tối (18h-23h)</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'staff', assignedShift: u.assignedShift || 'morning' });
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
          <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:pb-10 scrollbar-thin">

            {/* ── HERO HEADER CARD ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0f1b2d] dark:from-[#0c1526] dark:to-[#090D16] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/50">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#38BDF8]/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#38BDF8]/3 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

              <div className="relative">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-black text-[#38BDF8]/70 uppercase tracking-widest mb-1">
                      {user?.role === 'admin' ? 'Quản lý nhân sự' : 'Ca làm của tôi'}
                    </p>
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                      {user?.role === 'admin' ? 'Bảng Chấm công' : 'Điểm danh ca làm'}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium max-w-xs">
                      {user?.role === 'admin'
                        ? 'Theo dõi, chỉnh sửa và thanh toán lương nhân viên theo ca'
                        : 'Lưu trực tiếp vào hệ thống theo thời gian thực'}
                    </p>
                  </div>
                  {/* Live date badge */}
                  <div className="shrink-0 text-right">
                    <span className="block text-xs font-black text-white/80">
                      {new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                      {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Staff: Shift info + Action Buttons */}
                {user?.role !== 'admin' && (
                  <div className="space-y-3">
                    {/* Pending shift swap banner */}
                    {(() => {
                      const pendingSwap = shiftSwaps.find((s) => s.status === 'pending');
                      if (!pendingSwap) return null;
                      const reqLabel =
                        pendingSwap.requestedShift === 'morning' ? 'Ca Sáng (06h–12h)' :
                        pendingSwap.requestedShift === 'afternoon' ? 'Ca Chiều (12h–18h)' : 'Ca Tối (18h–23h)';
                      return (
                        <div className="px-3.5 py-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-bold flex items-center justify-between gap-2">
                          <span>Đang chờ duyệt đổi sang <strong>{reqLabel}</strong></span>
                          <span className="px-2 py-0.5 bg-amber-500/20 rounded-md text-[10px] uppercase font-black shrink-0">Chờ</span>
                        </div>
                      );
                    })()}

                    {/* Shift pill + buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold w-fit">
                        <span className="text-slate-400">Ca đăng ký:</span>
                        {(() => {
                          const shift = user?.assignedShift || 'morning';
                          if (shift === 'morning') return <span className="text-[#38BDF8] font-black">Ca Sáng (06h–12h)</span>;
                          if (shift === 'afternoon') return <span className="text-amber-400 font-black">Ca Chiều (12h–18h)</span>;
                          return <span className="text-purple-400 font-black">Ca Tối (18h–23h)</span>;
                        })()}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={handleCheckIn}
                          disabled={isCheckingIn}
                          className="h-10 px-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          {isCheckingIn ? 'Đang xử lý...' : 'Check-in'}
                        </button>
                        <button
                          onClick={handleCheckOut}
                          className="h-10 px-5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          Check-out
                        </button>
                        <button
                          onClick={() => {
                            setRequestedSwapShift(user?.assignedShift === 'morning' ? 'afternoon' : 'morning');
                            setIsShiftSwapModalOpen(true);
                          }}
                          className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white/80 font-bold text-xs rounded-xl border border-white/10 transition-all active:scale-95 cursor-pointer"
                        >
                          Đổi ca
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin: summary stats */}
                {user?.role === 'admin' && (
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <span className="block text-xl font-black text-white">{displayedAttendances.length}</span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Lượt chấm công</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <span className="block text-xl font-black text-[#38BDF8]">
                        {displayedAttendances.filter(a => !a.checkOut).length}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Đang làm ca</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <span className="block text-xl font-black text-amber-400">
                        {shiftSwaps.filter(s => s.status === 'pending').length}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">Chờ đổi ca</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── ADMIN: SHIFT SWAP APPROVAL PANEL ────────────────────────── */}
            {user?.role === 'admin' && shiftSwaps.filter(s => s.status === 'pending').length > 0 && (
              <div className="bg-white dark:bg-[#131929] border border-amber-500/20 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Yêu cầu đổi ca cần duyệt
                  </h4>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black border border-amber-500/20">
                    {shiftSwaps.filter(s => s.status === 'pending').length} yêu cầu
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shiftSwaps.filter(s => s.status === 'pending').map((swap) => {
                    const curLabel = swap.currentShift === 'morning' ? 'Ca Sáng' : swap.currentShift === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';
                    const reqLabel = swap.requestedShift === 'morning' ? 'Ca Sáng' : swap.requestedShift === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';
                    return (
                      <div key={swap._id} className="p-3.5 bg-white dark:bg-[#0d1525] border border-slate-200 dark:border-[#1e293b] rounded-xl space-y-2.5 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">{swap.userId?.name || 'Nhân viên'}</span>
                            <span className="text-[10px] text-slate-400">{swap.userId?.email}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-black border border-amber-500/20">Chờ duyệt</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#131929] px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-black text-slate-800 dark:text-slate-200">{curLabel}</span>
                          <span className="text-slate-400 font-normal">→</span>
                          <span className="px-2 py-0.5 bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] rounded font-black border border-[#38BDF8]/20">{reqLabel}</span>
                        </div>
                        {swap.reason && <p className="text-[11px] text-slate-500 italic border-l-2 border-slate-300 dark:border-slate-700 pl-2">{swap.reason}</p>}
                        <div className="flex justify-end gap-2 pt-0.5">
                          <button
                            onClick={() => handleUpdateShiftSwapStatus(swap._id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                          >Từ chối</button>
                          <button
                            onClick={() => handleUpdateShiftSwapStatus(swap._id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                          >Duyệt đổi ca</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section header for history list */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Lịch sử điểm danh
                {displayedAttendances.length > 0 && (
                  <span className="ml-2 text-slate-900 dark:text-white">{displayedAttendances.length} bản ghi</span>
                )}
              </h3>
            </div>

            {/* Mobile Card List (< sm: 640px) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {displayedAttendances.length === 0 ? (
                <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-10 text-center">
                  <p className="text-sm font-black text-slate-400 dark:text-slate-500">Chưa có lịch sử điểm danh</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">Bấm Check-in để bắt đầu ca làm</p>
                </div>
              ) : (
                displayedAttendances.map((att) => {
                  const staffId = att.userId?._id || att.userId;
                  const staffName = att.userId?.name || 'Nhân viên';
                  const staffEmail = att.userId?.email || '';
                  const staffRole = att.userId?.role || 'staff';
                  const checkInTime = att.checkIn ? new Date(att.checkIn) : null;
                  const checkOutTime = att.checkOut ? new Date(att.checkOut) : null;
                  const isActive = checkInTime && !checkOutTime;

                  let hoursWorked = att.hoursWorked || 0;
                  if (!hoursWorked && checkInTime && checkOutTime) {
                    hoursWorked = Math.max(0, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
                  }
                  hoursWorked = Number(hoursWorked.toFixed(2));

                  const hourlyRate = staffHourlyRates[staffId] || 25000;
                  const totalSalary = Math.round(hoursWorked * hourlyRate);

                  const shiftLabel =
                    att.shift === 'morning' ? 'Ca Sáng' :
                    att.shift === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';
                  const shiftColor =
                    att.shift === 'morning' ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20' :
                    att.shift === 'afternoon' ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' :
                    'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';

                  const roleLabel = staffRole === 'admin' ? 'Quản trị' : staffRole === 'barista' ? 'Pha chế' : staffRole === 'waiter' ? 'Phục vụ' : 'Nhân viên';
                  const roleColor = staffRole === 'admin' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    staffRole === 'barista' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                    staffRole === 'waiter' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

                  return (
                    <div key={att._id} className={`bg-white dark:bg-[#131929] rounded-2xl shadow-xs overflow-hidden border ${isActive ? 'border-emerald-500/40' : 'border-slate-200 dark:border-[#1e293b]'}`}>
                      {/* Card top accent */}
                      {isActive && <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400/0" />}

                      <div className="p-4 space-y-3">
                        {/* Row 1: Name + Date + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">{staffName}</h4>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                  Đang làm
                                </span>
                              )}
                            </div>
                            {staffEmail && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{staffEmail}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {att.date || new Date(att.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                            </span>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${roleColor}`}>
                              {roleLabel}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Shift badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${shiftColor}`}>
                            {shiftLabel} ({att.shift === 'morning' ? '06h–12h' : att.shift === 'afternoon' ? '12h–18h' : '18h–23h'})
                          </span>
                        </div>

                        {/* Row 3: Time grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-[#0d1525] rounded-xl p-2.5 border border-slate-100 dark:border-[#1e293b]">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Check-in</span>
                            <span className="block font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {checkInTime ? checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 font-medium">
                              {checkInTime ? checkInTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-[#0d1525] rounded-xl p-2.5 border border-slate-100 dark:border-[#1e293b]">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Check-out</span>
                            <span className={`block font-mono text-sm font-black ${checkOutTime ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'}`}>
                              {checkOutTime ? checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 font-medium">
                              {checkOutTime ? `${hoursWorked}h làm việc` : 'Đang làm ca'}
                            </span>
                          </div>
                        </div>

                        {/* Row 4: Total hours + Salary */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1e293b]">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold">
                              Tổng: <span className="text-slate-900 dark:text-white font-black">{hoursWorked}h</span>
                            </span>
                            {user?.role === 'admin' && (
                              <span className="block text-xs font-black text-[#0284c7] dark:text-[#38BDF8] mt-0.5">
                                {formatPrice(totalSalary)}
                              </span>
                            )}
                          </div>

                          {user?.role === 'admin' && (
                            <div className="flex items-center gap-1.5">
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
                                className="h-8 px-3 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-[#38BDF8] rounded-lg transition-colors text-[11px] font-bold cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => setAttendanceToDelete(att._id)}
                                className="h-8 px-3 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-red-500 rounded-lg transition-colors text-[11px] font-bold cursor-pointer"
                              >
                                Xóa
                              </button>
                              <button
                                onClick={() => handlePayStaffSalary(staffId, hoursWorked, hourlyRate)}
                                className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] rounded-lg transition-all shadow-sm cursor-pointer"
                              >
                                Trả lương
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= sm: 640px) */}
            <div className="hidden sm:block bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[850px]">
                <thead className="bg-slate-100 dark:bg-[#1e293b] text-slate-900 dark:text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Ngày</th>
                    <th className="p-4">Tên Nhân viên</th>
                    <th className="p-4">Vai trò (Role)</th>
                    <th className="p-4">Ca làm</th>
                    <th className="p-4">Giờ Check-in</th>
                    <th className="p-4">Giờ Check-out</th>
                    <th className="p-4">Tổng giờ làm</th>
                    {user?.role === 'admin' && <th className="p-4">Mức lương/giờ (VND)</th>}
                    {user?.role === 'admin' && <th className="p-4">Lương tính (VND)</th>}
                    {user?.role === 'admin' && <th className="p-4 text-right">Hành động</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1e293b]">
                  {displayedAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 9 : 6} className="p-8 text-center text-slate-500">
                        Chưa có lịch sử điểm danh nào
                      </td>
                    </tr>
                  ) : (
                    displayedAttendances.map((att) => {
                      const staffId = att.userId?._id || att.userId;
                      const staffName = att.userId?.name || 'Nhân viên';
                      const staffEmail = att.userId?.email || '';
                      const staffRole = att.userId?.role || 'staff';
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
                        <tr key={att._id} className="hover:bg-slate-100/60 dark:hover:bg-[#182035]">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">
                            {att.date || new Date(att.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 dark:text-white">{staffName}</div>
                            {staffEmail && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{staffEmail}</div>}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              staffRole === 'admin' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                              staffRole === 'barista' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20' :
                              staffRole === 'waiter' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                              'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                            }`}>
                              {staffRole === 'admin' ? 'Quản trị (Admin)' : staffRole === 'barista' ? 'Pha chế (Barista)' : staffRole === 'waiter' ? 'Phục vụ (Waiter)' : 'Nhân viên'}
                            </span>
                          </td>
                          <td className="p-4">
                            {(() => {
                              const s = att.shift || 'morning';
                              if (s === 'morning') {
                                return (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                    Ca Sáng (06h–12h)
                                  </span>
                                );
                              }
                              if (s === 'afternoon') {
                                return (
                                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Ca Chiều (12h–18h)
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  Ca Tối (18h–23h)
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {checkInTime ? checkInTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                          </td>
                          <td className="p-4 text-amber-600 dark:text-amber-400 font-mono font-bold">
                            {checkOutTime ? checkOutTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Đang làm ca'}
                          </td>
                          <td className="p-4 font-black text-slate-900 dark:text-white">{hoursWorked} giờ</td>

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
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer"
                                  >
                                    Trả lương
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
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-[#38BDF8] text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() => setAttendanceToDelete(att._id)}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-red-500 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Xóa
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
          <div className="flex-1 overflow-y-auto space-y-6 pb-24 lg:pb-10 scrollbar-thin">
            {/* Overview Summary Cards with Net Revenue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Lợi nhuận ròng hôm nay</span>
                <span className="text-xl sm:text-2xl font-black text-[#0284c7] dark:text-[#38BDF8] mt-1 block font-heading">
                  {formatPrice(analyticsSummary?.today || 0)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Doanh thu: {formatPrice(analyticsSummary?.todayGross || 0)} — Trừ lương: {formatPrice(analyticsSummary?.todaySalary || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Lợi nhuận ròng tuần này</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-heading">
                  {formatPrice(analyticsSummary?.week || 0)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Doanh thu: {formatPrice(analyticsSummary?.weekGross || 0)} — Trừ lương: {formatPrice(analyticsSummary?.weekSalary || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Lợi nhuận ròng tháng này</span>
                <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block font-heading">
                  {formatPrice(analyticsSummary?.month || 0)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Doanh thu: {formatPrice(analyticsSummary?.monthGross || 0)} — Trừ lương: {formatPrice(analyticsSummary?.monthSalary || 0)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-5 rounded-2xl shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block">Đánh giá trung bình</span>
                <span className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400 mt-1 flex items-center gap-1 font-heading">
                  <span className="material-symbols-outlined text-amber-500 text-lg sm:text-xl">star</span>
                  <span>{avgStar} / 5.0</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {reviews.length} đánh giá từ khách hàng
                </span>
              </div>
            </div>

            {/* Chart.js Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Daily Revenue Trend Line */}
              <div className="lg:col-span-2 bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38BDF8] text-base">show_chart</span>
                    <span>Biểu đồ Xu hướng Doanh thu theo Ngày</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tự động vẽ từ MongoDB</span>
                </div>
                <div className="h-52 sm:h-64">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>

              {/* Chart 3: Top 5 Selling Foods Doughnut */}
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base">pie_chart</span>
                  <span>Cơ cấu Top Món bán chạy</span>
                </h3>
                <div className="h-52 sm:h-64">
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
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38BDF8] text-lg">local_fire_department</span>
                  <span>Top Các món được bán nhiều nhất từ Database</span>
                </h3>
                <span className="self-start sm:self-auto bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] px-3 py-1 rounded-full text-xs font-bold shrink-0">
                  {topFoods.length} món bán chạy
                </span>
              </div>

              {/* Mobile Card List (< sm: 640px) */}
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {topFoods.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 text-xs">Chưa có dữ liệu thống kê món</p>
                ) : (
                  topFoods.map((tf, i) => (
                    <div key={i} className="bg-white dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
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
                        <tr key={i} className="hover:bg-slate-100/60 dark:hover:bg-[#182035] transition-colors">
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
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-lg">star</span>
                    <span>Đánh giá & Phản hồi từ Khách hàng</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ý kiến đóng góp trực tiếp từ khách hàng quét QR tại bàn</p>
                </div>
                <div className="self-start sm:self-auto flex items-center gap-2 bg-slate-100 dark:bg-[#1e293b] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                  <span className="text-amber-500 dark:text-amber-400 font-black text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">star</span>
                    <span>{avgStar}</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">({reviews.length} đánh giá)</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-8 text-center text-slate-500">
                  Chưa có đánh giá nào từ khách hàng
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="bg-white dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] p-4 rounded-xl space-y-2 relative shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{rev.customerName || 'Khách hàng'}</span>
                            <span className="text-[10px] bg-slate-200 dark:bg-[#1e293b] text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-md">
                              {rev.tableId?.tableName || 'Bàn'}
                            </span>
                          </div>
                          <div className="text-amber-500 dark:text-amber-400 text-xs mt-1 flex items-center">
                            {Array.from({ length: rev.serviceStar || 5 }).map((_, idx) => (
                              <span key={idx} className="material-symbols-outlined text-sm">star</span>
                            ))}
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

        {/* Coupons View: ADMIN ONLY */}
        {activeTab === ('coupons' as any) && user?.role === 'admin' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:pb-10 scrollbar-thin">
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-3.5 sm:p-4 rounded-2xl flex justify-between items-center shadow-xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  Quản lý Mã giảm giá (Coupons)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tạo và quản lý các chương trình ưu đãi chiết khấu cho khách hàng
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setCouponForm({
                    code: '',
                    type: 'percent',
                    value: '',
                    maxUsage: '',
                    minOrderAmount: '',
                    expiresAt: '',
                    isActive: true,
                  });
                  setIsCouponModalOpen(true);
                }}
                className="px-3.5 sm:px-4 py-2 bg-[#38BDF8] text-[#090D16] font-extrabold text-xs rounded-xl hover:bg-[#0284c7] transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Tạo mã mới</span>
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-8 text-center text-slate-500 text-xs">
                Chưa có mã giảm giá nào trong hệ thống
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c) => (
                  <div key={c._id} className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl space-y-3 relative shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-base font-black text-[#0284c7] dark:text-[#38BDF8] tracking-wider block">
                          {c.code}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {c.type === 'percent' ? `Giảm ${c.value}%` : `Giảm cố định ${formatPrice(c.value)}`}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                        {c.isActive ? 'Đang kích hoạt' : 'Tạm khóa'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
                      <div>Đơn tối thiểu: <span className="font-bold text-slate-700 dark:text-slate-300">{formatPrice(c.minOrderAmount || 0)}</span></div>
                      <div>Lượt đã dùng: <span className="font-bold text-slate-700 dark:text-slate-300">{c.usedCount || 0} / {c.maxUsage > 0 ? c.maxUsage : 'Không giới hạn'}</span></div>
                      <div>Hạn dùng: <span className="font-bold text-slate-700 dark:text-slate-300">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Không thời hạn'}</span></div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
                      <button
                        onClick={() => {
                          setEditingCoupon(c);
                          setCouponForm({
                            code: c.code || '',
                            type: c.type || 'percent',
                            value: String(c.value || ''),
                            maxUsage: String(c.maxUsage || ''),
                            minOrderAmount: String(c.minOrderAmount || ''),
                            expiresAt: formatForDatetimeInput(c.expiresAt),
                            isActive: c.isActive ?? true,
                          });
                          setIsCouponModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#38BDF8] transition-colors"
                        title="Sửa mã"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(c._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Xóa mã"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reservations View: STAFF & ADMIN */}
        {activeTab === ('reservations' as any) && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:pb-10 scrollbar-thin">
            <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] p-4 rounded-2xl flex justify-between items-center shadow-xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38BDF8] text-lg">event_seat</span>
                  <span>Quản lý Danh sách Bàn đã đặt (Reservations)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi và tiếp nhận thông tin giữ chỗ trực tuyến của khách hàng trước khi đến quán
                </p>
              </div>
              <span className="bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8] px-3.5 py-1.5 rounded-xl text-xs font-black">
                {reservations.length} lượt giữ chỗ
              </span>
            </div>

            {reservations.length === 0 ? (
              <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-10 text-center text-slate-500 text-xs">
                Chưa có đơn đặt bàn trực tuyến nào
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
                {reservations.map((res) => {
                  let statusBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
                  let statusLabel = 'Chờ xác nhận';
                  let statusIcon = 'hourglass_empty';

                  if (res.status === 'confirmed') {
                    statusBadge = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
                    statusLabel = 'Đã xác nhận';
                    statusIcon = 'check_circle';
                  } else if (res.status === 'arrived') {
                    statusBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                    statusLabel = 'Khách đã đến';
                    statusIcon = 'task_alt';
                  } else if (res.status === 'cancelled') {
                    statusBadge = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
                    statusLabel = 'Đã hủy đặt';
                    statusIcon = 'cancel';
                  }

                  return (
                    <div
                      key={res._id}
                      className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] hover:border-[#38BDF8]/40 p-5 rounded-2xl space-y-4 shadow-sm transition-all duration-200 flex flex-col justify-between"
                    >
                      {/* Header: Customer Name & Phone & Status Badge */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight font-heading truncate">
                            {res.customerName}
                          </h4>
                          <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold border flex items-center gap-1 shrink-0 ${statusBadge}`}>
                            <span className="material-symbols-outlined text-xs">{statusIcon}</span>
                            <span>{statusLabel}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-[#0284c7] dark:text-[#38BDF8]">
                          <span className="material-symbols-outlined text-xs">call</span>
                          <span>{res.customerPhone}</span>
                        </div>
                      </div>

                      {/* Middle Info Block with Strong Typography Hierarchy */}
                      <div className="py-2.5 border-t border-b border-slate-100 dark:border-[#1e293b] space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">Bàn ăn chọn:</span>
                          <span className="font-black text-slate-900 dark:text-white text-xs">{res.tableId?.tableName || 'Bàn chọn'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">Thời gian nhận bàn:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{new Date(res.reservationTime).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">Số lượng khách:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{res.guestCount} người</span>
                        </div>
                        {res.note && (
                          <div className="pt-1.5 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                            <span className="material-symbols-outlined text-xs shrink-0 mt-0.5">sticky_note_2</span>
                            <span className="italic font-medium">{res.note}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Standardized Action Button Grid */}
                      <div className="grid grid-cols-12 gap-2 pt-1 items-center">
                        {res.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res._id, 'confirmed')}
                            className="col-span-5 py-2.5 bg-[#38BDF8] text-[#090D16] text-xs font-black rounded-xl hover:bg-[#0284c7] transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">check</span>
                            <span>Xác nhận</span>
                          </button>
                        )}
                        {res.status !== 'arrived' && res.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res._id, 'arrived')}
                            className={`${res.status === 'pending' ? 'col-span-4' : 'col-span-7'} py-2.5 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer`}
                          >
                            <span className="material-symbols-outlined text-xs">directions_walk</span>
                            <span>Đã đến</span>
                          </button>
                        )}
                        {res.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateReservationStatus(res._id, 'cancelled')}
                            className={`${res.status === 'pending' ? 'col-span-2' : 'col-span-3'} py-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center cursor-pointer`}
                            title="Hủy đơn đặt bàn"
                          >
                            <span>Hủy</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReservation(res._id)}
                          className={`${res.status === 'arrived' || res.status === 'cancelled' ? 'col-span-12 ml-auto' : 'col-span-1'} p-2.5 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center cursor-pointer`}
                          title="Xóa đơn đặt bàn"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── COLUMN 3: RIGHT REALTIME ACTIVITY SIDEBAR (bg-white / dark:bg-[#000935]) ────── */}
      <aside
        className={`fixed xl:static inset-y-0 right-0 z-40 w-[320px] shrink-0 bg-white dark:bg-[#000935] border-l border-gray-200 dark:border-[#414754] p-6 h-screen flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${
          isRealtimeDrawerOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full xl:translate-x-0'
        }`}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-[#414754] pb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-[#dde1ff]">
            {user?.role === 'admin'
              ? 'Chấm công realtime'
              : user?.role === 'barista'
              ? 'Đơn hàng chờ pha chế'
              : 'Hoạt động realtime'}
          </h2>
          <button
            onClick={() => setIsRealtimeDrawerOpen(false)}
            className="xl:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Realtime Activity Content */}
        {user?.role === 'admin' ? (
          <>
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
                  const email = att.userId?.email;
                  if (uid) checkedInMap.set(uid, att);
                  if (email) checkedInMap.set(email, att);
                });

                const staffMembers = usersList.filter((u) => u.role !== 'admin');
                const checkedInList = staffMembers.filter((u) => checkedInMap.has(String(u._id || '')) || checkedInMap.has(u.email));
                const notCheckedInList = staffMembers.filter((u) => !checkedInMap.has(String(u._id || '')) && !checkedInMap.has(u.email));

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
                            const attRecord = checkedInMap.get(String(st._id || '')) || checkedInMap.get(st.email);
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
                          <p className="text-xs text-emerald-500 font-bold">Tất cả nhân viên đã điểm danh đầy đủ!</p>
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
        ) : user?.role === 'barista' ? (
          <>
            {(() => {
              const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
              const cookingOrders = orders.filter((o) => o.status === 'cooking');
              const brewingQueue = orders.filter((o) => o.status === 'confirmed' || o.status === 'cooking');

              return (
                <>
                  <div className="space-y-3 flex-1 overflow-y-auto scrollbar-none pr-1">
                    {brewingQueue.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs italic">
                        Hiện chưa có đơn hàng mới nào được Phục vụ xác nhận.
                      </div>
                    ) : (
                      brewingQueue
                        .map((order) => (
                          <div
                            key={order._id}
                            className={`p-3.5 border rounded-2xl space-y-2 text-xs transition-all shadow-xs ${
                              order.status === 'confirmed'
                                ? 'bg-sky-500/10 border-sky-500/30'
                                : 'bg-amber-500/10 border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${order.status === 'confirmed' ? 'bg-sky-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                                {order.isTakeaway || !order.tableId ? 'Mang về' : order.tableId?.tableName || 'Bàn chọn'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  order.status === 'confirmed'
                                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {order.status === 'confirmed' ? 'Phục vụ đã duyệt' : 'Đang pha chế'}
                              </span>
                            </div>

                            <div className="space-y-1 py-1 border-t border-b border-slate-200/40 dark:border-slate-800/40">
                              {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-[11px]">
                                  <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                                    {item.foodId?.name || 'Món ăn'}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400 font-black">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              {order.status === 'confirmed' ? (
                                <button
                                  onClick={() => handleUpdateStatus(order._id, 'cooking')}
                                  className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-[10.5px] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  Bắt đầu pha chế
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(order._id, 'ready')}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10.5px] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  Pha xong (Báo Phục vụ)
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </>
              );
            })()}
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
              {/* Drink Ready Notifications for Waiters (Auto-removes when completed) */}
              {(activityFilter === 'all' || activityFilter === 'support') &&
                drinkReadyList.map((item) => (
                  <div key={item.orderId} className="flex gap-3 text-xs p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 animate-ping" />
                    <div className="flex-1">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono block mb-0.5">
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {item.tableName} — Pha chế xong món!
                      </p>
                      <button
                        onClick={() => handleUpdateStatus(item.orderId, 'completed')}
                        className="mt-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10.5px] font-black rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        Xác nhận Đã ra món
                      </button>
                    </div>
                  </div>
                ))}

              {/* Staff Call Support Items (Auto-removes when acknowledged) */}
              {(activityFilter === 'all' || activityFilter === 'support') &&
                staffCalls.map((call) => (
                  <div key={call._id} className="flex gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] mt-1.5 shrink-0 animate-pulse" />
                    <div className="flex-1">
                      <span className="text-[11px] text-slate-700 dark:text-slate-400 font-mono font-bold block mb-0.5">
                        {call.createdAt
                          ? new Date(call.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Vừa xong'}
                      </span>
                      <p className="font-extrabold text-slate-950 dark:text-white">
                        {call.tableId?.tableName || 'Bàn'} — Yêu cầu hỗ trợ
                      </p>
                      <button
                        onClick={() => handleAcknowledgeCall(call._id)}
                        className="mt-2 px-3 py-1 bg-slate-100 dark:bg-[#1e293b] hover:bg-[#38BDF8] hover:text-[#090D16] text-slate-900 dark:text-slate-200 text-[10px] font-extrabold rounded-lg transition-all border border-slate-200 dark:border-slate-800"
                      >
                        Đã tiếp nhận
                      </button>
                    </div>
                  </div>
                ))}

              {/* Active Orders Items (Filtered to live active unpaid orders) */}
              {(activityFilter === 'all' || activityFilter === 'payment') &&
                orders
                  .filter((o) => o.status !== 'paid')
                  .slice(0, 10)
                  .map((order) => (
                    <div key={order._id} className="flex gap-3 text-xs">
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          order.status === 'confirmed'
                            ? 'bg-sky-400 animate-pulse'
                            : order.status === 'cooking'
                            ? 'bg-amber-400 animate-pulse'
                            : order.status === 'ready'
                            ? 'bg-emerald-400 animate-ping'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div className="flex-1">
                        <span className="text-[11px] text-slate-700 dark:text-slate-400 font-mono font-bold block mb-0.5">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'Vừa xong'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {order.isTakeaway || !order.tableId ? 'Mang về' : order.tableId?.tableName || 'Bàn chọn'} —{' '}
                          {order.status === 'pending'
                            ? 'Khách vừa đặt món (Chờ duyệt)'
                            : order.status === 'confirmed'
                            ? 'Đã chuyển quầy pha chế'
                            : order.status === 'cooking'
                            ? 'Đang pha chế tại quầy'
                            : 'Đã pha xong (Cần ra món)'}
                        </p>
                        <p className="text-[11px] text-[#0284c7] dark:text-[#38BDF8] font-black mt-0.5">
                          {formatPrice(order.totalAmount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}

              {staffCalls.length === 0 &&
                drinkReadyList.length === 0 &&
                orders.filter((o) => o.status !== 'paid').length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs italic">
                    Hiện chưa có hoạt động realtime nào mới.
                  </div>
                )}
            </div>
          </>
        )}
      </aside>

      {/* ── ALL MODALS & TOAST NOTIFICATIONS ────────────────────────────────── */}

      {/* 0. Category Manager Modal (Admin Only) */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1e293b]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl">
                    <span className="material-symbols-outlined text-xl">category</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">Quản lý Danh mục Thực đơn</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Thêm, chỉnh sửa và xóa danh mục món ăn cho quán</p>
                  </div>
                </div>
                <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Add / Edit Category */}
              <form onSubmit={handleSaveCategory} className="bg-white dark:bg-[#090D16] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingCategory ? 'Sửa thông tin danh mục' : 'Thêm danh mục mới'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Tên danh mục *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Cà Phê, Trà Trái Cây..."
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full bg-white dark:bg-[#131929] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Biểu tượng (Icon)</label>
                    <select
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                      className="w-full bg-white dark:bg-[#131929] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-[#38BDF8] cursor-pointer"
                    >
                      <option value="local_cafe">local_cafe (Cà phê)</option>
                      <option value="local_bar">local_bar (Trà / Nước)</option>
                      <option value="icecream">icecream (Đá xay / Kem)</option>
                      <option value="bakery_dining">bakery_dining (Bánh ngọt)</option>
                      <option value="restaurant">restaurant (Đồ ăn)</option>
                      <option value="star">star (Nổi bật)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '', icon: 'local_cafe', order: categories.length + 1, isActive: true });
                      }}
                      className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingCategory ? 'Lưu cập nhật' : 'Tạo danh mục'}
                  </button>
                </div>
              </form>

              {/* List Existing Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Danh sách danh mục hiện có ({categories.length})
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {categories.map((cat) => {
                    const foodCount = foods.filter((f) => f.category === cat.name).length;
                    return (
                      <div
                        key={cat._id}
                        className="p-3.5 bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 bg-white dark:bg-[#131929] text-[#0284c7] dark:text-[#38BDF8] rounded-xl shrink-0 border border-slate-200 dark:border-slate-800">
                            <span className="material-symbols-outlined text-lg">{cat.icon || 'category'}</span>
                          </div>
                          <div className="truncate">
                            <h5 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{cat.name}</span>
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 text-[10px] rounded-md font-bold">
                                {foodCount} món
                              </span>
                            </h5>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({
                                name: cat.name || '',
                                icon: cat.icon || 'local_cafe',
                                order: cat.order || 0,
                                isActive: cat.isActive !== false,
                              });
                            }}
                            className="p-2 text-slate-400 hover:text-[#38BDF8] transition-colors"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Xóa danh mục"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    <label className="block text-[#181c23] dark:text-slate-300 font-bold mb-1">{t.modalFoodPrice}</label>
                    <input type="number" required value={foodForm.price} onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })} className="w-full bg-[#f1f3fe] dark:bg-[#090D16] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg p-2.5 text-[#181c23] dark:text-white focus:outline-none focus:border-[#0059b9]" />
                  </div>
                  <div>
                    <label className="block text-[#181c23] dark:text-slate-300 font-bold mb-1">{t.modalFoodCategory}</label>
                    <select value={foodForm.category} onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })} className="w-full bg-[#f1f3fe] dark:bg-[#090D16] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg p-2.5 text-[#181c23] dark:text-white font-bold focus:outline-none focus:border-[#0059b9] cursor-pointer">
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name} className="bg-white dark:bg-[#090D16] text-[#181c23] dark:text-white font-bold py-1">
                          {cat.name}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <option value="Cà phê" className="bg-white dark:bg-[#090D16] text-[#181c23] dark:text-white font-bold py-1">Cà phê</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Topping Category Indicator Badge */}
                {(() => {
                  const isMilkTea = foodForm.category?.toLowerCase().includes('trà sữa') || foodForm.category?.toLowerCase().includes('milk tea');
                  return isMilkTea ? (
                    <div className="p-3 bg-[#0059b9]/10 border border-[#0059b9]/30 rounded-lg text-[11.5px] text-[#0059b9] font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">local_drink</span>
                      <span>Danh mục Trà Sữa: Món ăn này sẽ hỗ trợ chọn Topping (Trân châu, thạch, pudding...) khi khách hàng đặt món.</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#f1f3fe] dark:bg-[#1e293b]/60 border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg text-[11.5px] text-[#414754] dark:text-slate-400 font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">info</span>
                      <span>Danh mục món ăn/thức uống này KHÔNG hỗ trợ Topping. Khách hàng chỉ chọn Size & Ghi chú.</span>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[#181c23] dark:text-slate-300 font-bold mb-1">{t.modalFoodImg}</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setFoodInputType('upload')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${foodInputType === 'upload' ? 'bg-[#0059b9] text-white' : 'bg-[#f1f3fe] dark:bg-[#1e293b] text-[#414754] dark:text-slate-300'}`}>{t.modalFoodUpload}</button>
                    <button type="button" onClick={() => setFoodInputType('url')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${foodInputType === 'url' ? 'bg-[#0059b9] text-white' : 'bg-[#f1f3fe] dark:bg-[#1e293b] text-[#414754] dark:text-slate-300'}`}>{t.modalFoodUrl}</button>
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
                    <input type="text" placeholder={t.modalFoodUrlPlaceholder} value={foodForm.image} onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })} className="w-full bg-[#f1f3fe] dark:bg-[#090D16] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg p-2.5 text-[#181c23] dark:text-white focus:outline-none focus:border-[#0059b9]" />
                  )}

                  {/* Live Image Preview Box */}
                  {foodForm.image && (
                    <div className="mt-3 p-2.5 bg-[#f1f3fe] dark:bg-[#090D16] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg flex items-center gap-3">
                      <img
                        src={foodForm.image}
                        alt="Xem trước ảnh món"
                        className="w-14 h-14 rounded-lg object-cover bg-[#ebedf8] dark:bg-slate-800 border border-[#c1c6d6] dark:border-[#1e293b] shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="truncate flex-1">
                        <span className="text-[11px] font-bold text-[#181c23] dark:text-slate-200 block">Xem trước hình ảnh món</span>
                        <span className="text-[10px] text-[#414754] dark:text-slate-400 truncate block mt-0.5">{foodForm.image}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="isAvailable" checked={foodForm.isAvailable} onChange={(e) => setFoodForm({ ...foodForm, isAvailable: e.target.checked })} className="rounded" />
                  <label htmlFor="isAvailable" className="text-[#181c23] dark:text-slate-300 font-bold">{t.modalFoodActive}</label>
                </div>

                <button type="submit" className="w-full py-3 bg-[#0059b9] hover:bg-[#004591] text-white font-bold rounded-lg text-xs transition-all shadow-xs mt-4">
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-[#c1c6d6] dark:border-[#1e293b] rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#c1c6d6] dark:border-[#1e293b] pb-3">
                <h3 className="text-lg font-bold text-[#181c23] dark:text-white font-heading">{editingTable ? t.modalTableTitleEdit : t.modalTableTitleAdd}</h3>
                <button onClick={() => setIsTableModalOpen(false)} className="text-[#717785] hover:text-[#181c23] dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateTable} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#181c23] dark:text-slate-300 font-bold mb-1">Số thứ tự bàn (Chỉ nhập số)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ví dụ: 4 (Tự động lưu là Bàn số 4)"
                    value={tableForm.tableName.replace(/\D/g, '')}
                    onChange={(e) => setTableForm({ ...tableForm, tableName: e.target.value })}
                    className="w-full bg-[#f1f3fe] dark:bg-[#090D16] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg p-2.5 text-[#181c23] dark:text-white focus:outline-none focus:border-[#0059b9]"
                  />
                  <p className="text-[11px] text-[#414754] dark:text-slate-400 mt-1">
                    {tableForm.tableName.replace(/\D/g, '')
                      ? `Tên hiển thị: Bàn số ${tableForm.tableName.replace(/\D/g, '')}`
                      : 'Hệ thống tự động thêm chữ "Bàn số "'}
                  </p>
                </div>

                <div>
                  <label className="block text-[#181c23] dark:text-slate-300 font-bold mb-1">{t.modalTableStatus}</label>
                  <select value={tableForm.status} onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })} className="w-full bg-[#f1f3fe] dark:bg-[#090D16] border border-[#c1c6d6] dark:border-[#1e293b] rounded-lg p-2.5 text-[#181c23] dark:text-white font-bold focus:outline-none focus:border-[#0059b9] cursor-pointer">
                    <option value="empty" className="bg-white dark:bg-[#090D16] text-[#181c23] dark:text-white font-bold py-1">{t.tableEmpty}</option>
                    <option value="serving" className="bg-white dark:bg-[#090D16] text-[#181c23] dark:text-white font-bold py-1">{t.tableOccupied}</option>
                    <option value="reserved" className="bg-white dark:bg-[#090D16] text-[#181c23] dark:text-white font-bold py-1">{t.tableReserved}</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3 bg-[#0059b9] hover:bg-[#004591] text-white font-bold rounded-lg text-xs transition-all shadow-xs mt-4">
                  {t.modalFoodSave}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3.8 Employee Shift Swap Request Modal */}
      <AnimatePresence>
        {isShiftSwapModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShiftSwapModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xs" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative z-10 w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-[#1e293b] pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">Gửi Yêu Cầu Đổi Ca Làm</h3>
                <button onClick={() => setIsShiftSwapModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleRequestShiftSwap} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ca làm phân công hiện tại</label>
                  <input
                    type="text"
                    disabled
                    value={
                      user?.assignedShift === 'morning' ? 'Ca Sáng (06:00 - 12:00)' :
                      user?.assignedShift === 'afternoon' ? 'Ca Chiều (12:00 - 18:00)' : 'Ca Tối (18:00 - 23:00)'
                    }
                    className="w-full bg-slate-100 dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ca làm muốn đổi sang *</label>
                  <select
                    value={requestedSwapShift}
                    onChange={(e) => setRequestedSwapShift(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#38BDF8] cursor-pointer"
                  >
                    <option value="morning">Ca Sáng (06:00 - 12:00)</option>
                    <option value="afternoon">Ca Chiều (12:00 - 18:00)</option>
                    <option value="evening">Ca Tối (18:00 - 23:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Lý do đổi ca (Không bắt buộc)</label>
                  <textarea
                    rows={2}
                    placeholder="VD: Đổi ca với Nguyễn Văn A cho ca làm hôm nay..."
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl text-xs transition-all shadow-md mt-4 cursor-pointer">
                  Gửi Yêu Cầu Cho Admin Duyệt
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
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/table/${qrTable._id}${qrTable.qrToken ? `?token=${qrTable.qrToken}` : ''}` : '')}`}
                    alt={`QR Code ${qrTable.tableName}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{qrTable.tableName}</p>
                {qrTable.qrToken && (
                  <p className="text-[10px] text-emerald-500 font-mono font-bold">Mã QR động: #{qrTable.qrToken.slice(0, 8)}</p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b] print:hidden text-xs">
                <div className="flex items-center bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/table/${qrTable._id}${qrTable.qrToken ? `?token=${qrTable.qrToken}` : ''}` : ''}
                    className="bg-transparent text-slate-700 dark:text-slate-300 text-[11px] truncate flex-1 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const url = `${window.location.origin}/table/${qrTable._id}${qrTable.qrToken ? `?token=${qrTable.qrToken}` : ''}`;
                        navigator.clipboard.writeText(url);
                        showToast('Đã sao chép link đặt món!', 'success');
                      }
                    }}
                    className="px-2.5 py-1 bg-[#38BDF8] text-[#090D16] font-bold rounded-lg text-[10px] hover:bg-[#0284c7] transition-all ml-1 shrink-0 cursor-pointer"
                  >
                    Sao chép
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/tables/${qrTable._id}/regenerate-qr`, {
                          method: 'PATCH',
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setQrTable(updated);
                          setTables((prev) => prev.map((t) => (t._id === qrTable._id ? updated : t)));
                          showToast('Đã tạo mã QR mới thành công!', 'success');
                        }
                      } catch (e) {
                        showToast('Không thể đổi mã QR!', 'error');
                      }
                    }}
                    className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-amber-500/30"
                  >
                    <span className="material-symbols-outlined text-base">sync</span>
                    <span>Đổi mã QR mới</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
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
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#38BDF8] cursor-pointer">
                    <option value="waiter" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Phục vụ (Waiter)</option>
                    <option value="barista" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Pha chế (Barista)</option>
                    <option value="admin" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">{t.adminRole}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ca làm phân công mặc định</label>
                  <select value={userForm.assignedShift} onChange={(e) => setUserForm({ ...userForm, assignedShift: e.target.value as any })} className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#38BDF8] cursor-pointer">
                    <option value="morning" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Ca Sáng (06:00 - 12:00)</option>
                    <option value="afternoon" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Ca Chiều (12:00 - 18:00)</option>
                    <option value="evening" className="bg-white dark:bg-[#090D16] text-slate-900 dark:text-white font-bold py-1">Ca Tối (18:00 - 23:00)</option>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Tên khách hàng <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Tên khách nhận món..."
                          value={takeawayCustomerName}
                          onChange={(e) => setTakeawayCustomerName(e.target.value)}
                          className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Số điện thoại <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Ví dụ: 0987654321..."
                          value={takeawayCustomerPhone}
                          onChange={(e) => setTakeawayCustomerPhone(e.target.value)}
                          className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                        />
                      </div>
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

      {/* 7. Create/Edit Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCouponModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#1e293b]">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  {editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
                </h3>
                <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateCoupon} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mã giảm giá (Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: KOHI10, WELCOME50K"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-slate-900 dark:text-white uppercase font-mono font-bold focus:border-[#38BDF8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Loại giảm giá</label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                      className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-[#38BDF8]"
                    >
                      <option value="percent">Giảm theo %</option>
                      <option value="fixed">Giảm số tiền cố định (VND)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {couponForm.type === 'percent' ? 'Mức giảm (%)' : 'Số tiền giảm (VND)'}
                    </label>
                    <input
                      type="number"
                      required
                      placeholder={couponForm.type === 'percent' ? '10' : '20000'}
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                      className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Số lượt dùng</label>
                    <input
                      type="number"
                      placeholder="0 = không giới hạn"
                      value={couponForm.maxUsage}
                      onChange={(e) => setCouponForm({ ...couponForm, maxUsage: e.target.value })}
                      className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Đơn tối thiểu (VND)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={couponForm.minOrderAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                      className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hạn sử dụng</label>
                  <input
                    type="datetime-local"
                    value={couponForm.expiresAt}
                    onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                    className="w-full bg-[#F8FAFC] dark:bg-[#090D16] border border-slate-200 dark:border-[#1e293b] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:border-[#38BDF8]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={couponForm.isActive}
                    onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                    className="rounded text-[#38BDF8]"
                  />
                  <label htmlFor="couponActive" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Kích hoạt mã giảm giá ngay
                  </label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#38BDF8] text-[#090D16] font-black rounded-xl hover:bg-[#0284c7] transition-all"
                  >
                    Lưu mã
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5.5 Printable Payment Invoice Receipt Modal */}
      <AnimatePresence>
        {selectedInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoiceModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="text-center border-b border-slate-200 dark:border-[#1e293b] pb-4 space-y-1">
                <h2 className="text-xl font-black tracking-wide text-slate-900 dark:text-white uppercase">Hóa Đơn Thanh Toán</h2>
                <p className="text-xs font-bold text-[#38BDF8]">KOHI COFFEE BOUTIQUE</p>
                <div className="inline-block mt-2 px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-black text-cyan-600 dark:text-[#38BDF8] font-mono">
                  MÃ HÓA ĐƠN: {selectedInvoiceModal.invoiceCode}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Bàn / Vị trí: </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{selectedInvoiceModal.tableName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium">Thời gian: </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {new Date(selectedInvoiceModal.paidAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Khách hàng: </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{selectedInvoiceModal.customerName || 'Khách vãng lai'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium">Phương thức: </span>
                  <span className="font-extrabold text-slate-900 dark:text-white uppercase">
                    {selectedInvoiceModal.paymentMethod === 'momo' ? 'Ví MoMo' : 'Tiền mặt'}
                  </span>
                </div>
                {selectedInvoiceModal.transactionCode && (
                  <div className="col-span-2 text-xs text-slate-400">
                    Mã Giao Dịch: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{selectedInvoiceModal.transactionCode}</span>
                  </div>
                )}
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white dark:bg-[#090D16] text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-[#1e293b]">
                    <tr>
                      <th className="p-2.5">Món ăn</th>
                      <th className="p-2.5 text-center">SL</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b] font-medium text-slate-800 dark:text-slate-200">
                    {selectedInvoiceModal.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold">{item.foodName}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatPrice(item.price)}</td>
                        <td className="p-2.5 text-right font-extrabold">{formatPrice(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="space-y-1.5 text-xs border-t border-slate-200 dark:border-[#1e293b] pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính:</span>
                  <span className="font-bold">{formatPrice(selectedInvoiceModal.subtotal || selectedInvoiceModal.totalAmount)}</span>
                </div>
                {selectedInvoiceModal.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Giảm giá ({selectedInvoiceModal.couponCode || 'Voucher'}):</span>
                    <span>-{formatPrice(selectedInvoiceModal.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-dashed border-slate-200 dark:border-[#1e293b]">
                  <span>TỔNG THANH TOÁN:</span>
                  <span className="text-[#38BDF8]">{formatPrice(selectedInvoiceModal.totalAmount)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>In Hóa Đơn</span>
                </button>
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

    </div>
  );
}
