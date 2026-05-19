'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { playCashChime, playMomoChime } from '../utils/sound';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxz42ss1b';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

type Lang = 'vi' | 'en' | 'zh';

const DICTIONARY = {
  vi: {
    hubTitle: 'Chika restaurant',
    hubSubtitle: 'REALTIME OPERATIONS DASHBOARD',
    adminRole: 'Quản trị',
    staffRole: 'Nhân viên',
    updateAccount: 'Cập nhật thông tin tài khoản',
    logout: 'Đăng xuất',
    tabOrders: 'Đơn hàng realtime',
    tabFoods: 'Quản lý thực đơn',
    tabTables: 'Quản lý bàn ăn',
    tabUsers: 'Quản lý nhân viên',
    addFood: 'Thêm món ăn mới',
    addTable: 'Thêm bàn ăn mới',
    addUser: 'Thêm nhân viên mới',
    loadingOrders: 'Đang đồng bộ đơn hàng theo thời gian thực...',
    errorSync: 'Lỗi đồng bộ',
    noOrders: 'Chưa có đơn hàng nào',
    noOrdersDesc: 'Các đơn hàng mới của khách hàng quét QR sẽ xuất hiện ở đây ngay lập tức theo thời gian thực.',
    unknownTable: 'Không rõ bàn',
    momo: 'MoMo',
    cash: 'Tiền mặt',
    orderCode: 'Mã đơn',
    orderDeleteConfirm: 'Bạn có chắc chắn muốn xoá đơn hàng này không?',
    toastDeleteOrder: 'Đơn hàng đã được xóa khỏi hệ thống! 🗑️',
    toastDeleteFood: 'Đã xóa món ăn khỏi thực đơn thành công! 🍔',
    toastDeleteUser: 'Đã xóa tài khoản nhân viên thành công! 👥',
    toastDeleteTable: 'Đã xóa bàn ăn thành công! 🪑',
    toastDeleteConfirmTitle: 'Xác nhận xóa',
    deleteOrderTitle: 'Xóa đơn hàng',
    deleteOrderDesc: 'Hành động này sẽ xóa vĩnh viễn đơn hàng của {tableName} khỏi hệ thống.',
    deleteFoodTitle: 'Xóa món ăn',
    deleteFoodDesc: 'Hành động này sẽ xóa vĩnh viễn món ăn {foodName} khỏi thực đơn.',
    deleteUserTitle: 'Xóa nhân viên',
    deleteUserDesc: 'Hành động này sẽ xóa tài khoản nhân viên {userName}.',
    deleteTableTitle: 'Xóa bàn ăn',
    deleteTableDesc: 'Hành động này sẽ xóa bàn ăn {tableName} khỏi danh sách.',
    confirm: 'Xác nhận',
    cancel: 'Hủy bỏ',
    orderItems: 'Món ăn',
    totalAmount: 'Tổng cộng',
    updateStatus: 'Cập nhật trạng thái',
    printInvoice: 'In hóa đơn',
    status_pending: 'Chờ xử lý',
    status_cooking: 'Đang nấu',
    status_completed: 'Đã xong món',
    status_cancelled: 'Đã huỷ',
    status_paid: 'Đã thanh toán',
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
    foodSearchPlaceholder: 'Tìm kiếm món ăn...',
    tableListName: 'Tên bàn ăn',
    tableListStatus: 'Trạng thái bàn',
    tableEmpty: 'Bàn trống',
    tableOccupied: 'Có khách',
    tableReserved: 'Khách hẹn',
    tableActions: 'Hành động',
    userName: 'Họ tên',
    userEmail: 'Email',
    userRole: 'Quyền hạn',
    userActions: 'Hành động',
    modalFoodTitleAdd: 'Thêm Món Ăn Mới',
    modalFoodTitleEdit: 'Cập Nhật Món Ăn',
    modalFoodName: 'Tên món ăn',
    modalFoodPrice: 'Giá tiền (VND)',
    modalFoodCategory: 'Danh mục thực đơn',
    modalFoodDesc: 'Mô tả chi tiết',
    modalFoodImg: 'Hình ảnh món ăn',
    modalFoodUpload: 'Chọn ảnh từ thiết bị',
    modalFoodUrl: 'Nhập URL',
    modalFoodUrlPlaceholder: 'Dán link ảnh (Unsplash, Imgur...)',
    modalFoodPreset: '💡 Ý tưởng ảnh món',
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
    cookOrder: 'Tiến hành nấu',
    completeOrder: 'Hoàn tất món',
    payCash: 'Thanh toán Tiền mặt',
    waitMoMo: 'Chờ khách quét MoMo...',
    paidSuccess: 'Đã thanh toán hoàn tất',
    viewInvoice: 'Xem hóa đơn chi tiết',
    orderCancelledText: 'Đơn đã bị hủy bỏ',
  },
  en: {
    hubTitle: 'Chika restaurant',
    hubSubtitle: 'REALTIME OPERATIONS DASHBOARD',
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
    toastDeleteOrder: 'Order has been deleted from system! 🗑️',
    toastDeleteFood: 'Food deleted from menu successfully! 🍔',
    toastDeleteUser: 'Staff account deleted successfully! 👥',
    toastDeleteTable: 'Table deleted successfully! 🪑',
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
    status_pending: 'Pending',
    status_cooking: 'Cooking',
    status_completed: 'Food Ready',
    status_cancelled: 'Cancelled',
    status_paid: 'Paid',
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
    modalFoodPreset: '💡 Quick Food Ideas',
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
    cookOrder: 'Cook order',
    completeOrder: 'Complete order',
    payCash: 'Pay Cash',
    waitMoMo: 'Waiting for MoMo payment...',
    paidSuccess: 'Paid successfully',
    viewInvoice: 'View detailed invoice',
    orderCancelledText: 'Order has been cancelled',
  },
  zh: {
    hubTitle: 'Chika restaurant',
    hubSubtitle: 'REALTIME OPERATIONS DASHBOARD',
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
    toastDeleteOrder: '订单已从系统中删除！🗑️',
    toastDeleteFood: '菜品已成功从菜单中删除！🍔',
    toastDeleteUser: '员工账户已成功删除！👥',
    toastDeleteTable: '餐桌已成功删除！🪑',
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
    modalFoodPreset: '💡 快捷图片创意',
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
    cookOrder: '开始烹饪',
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
  tableId: {
    _id: string;
    tableName: string;
  };
  items: FoodItem[];
  totalAmount: number;
  status: 'pending' | 'cooking' | 'completed' | 'cancelled' | 'paid';
  paymentMethod: 'cash' | 'momo';
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
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);

  // Derive translation helper
  const t = DICTIONARY[lang];

  // Custom Toast notification states & helper
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Foods management states
  const [foods, setFoods] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'foods' | 'tables' | 'users'>('orders');
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<any | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    price: 100000,
    category: 'Món chính',
    description: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
    isActive: true,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  const handleUploadToCloudinary = async (file: File) => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || 'Không thể tải ảnh lên Cloudinary.';
        throw new Error(`Lỗi Cloudinary: ${errMsg}`);
      }

      const data = await res.json();
      setFoodForm((prev) => ({ ...prev, image: data.secure_url }));
      showToast('Tải ảnh lên Cloudinary thành công! 📸', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi tải ảnh lên Cloudinary.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Fetch foods list
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch(`${API_BASE}/foods`);
        if (!res.ok) throw new Error('Không thể tải thực đơn.');
        const data = await res.json();
        setFoods(data);
      } catch (err) {
        console.error('Lỗi tải món ăn:', err);
      }
    };
    fetchFoods();
  }, []);

  const handleDeleteFood = (foodId: string) => {
    setFoodToDelete(foodId);
  };

  const executeDeleteFood = async (foodId: string) => {
    try {
      const res = await fetch(`${API_BASE}/foods/${foodId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Xoá món ăn thất bại.');
      setFoods((prev) => prev.filter((f) => f._id !== foodId));
      showToast('Đã xóa món ăn khỏi thực đơn thành công! 🍔', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.', 'error');
    } finally {
      setFoodToDelete(null);
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price || !foodForm.image) {
      showToast('Vui lòng nhập đầy đủ Tên, Giá tiền và Ảnh món ăn.', 'error');
      return;
    }

    try {
      const url = editingFood ? `${API_BASE}/foods/${editingFood._id}` : `${API_BASE}/foods`;
      const method = editingFood ? 'PATCH' : 'POST';

      const payload = {
        name: foodForm.name,
        price: foodForm.price,
        category: foodForm.category,
        description: foodForm.description,
        image: foodForm.image,
        isAvailable: foodForm.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message || 'Lưu thực đơn thất bại.';
        throw new Error(errMsg);
      }
      const saved = await res.json();

      if (editingFood) {
        setFoods((prev) => prev.map((f) => (f._id === editingFood._id ? saved : f)));
        showToast('Cập nhật món ăn thành công! 🍔', 'success');
      } else {
        setFoods((prev) => [saved, ...prev]);
        showToast('Thêm món ăn mới vào thực đơn thành công! 🎉', 'success');
      }
      setIsFoodModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu món ăn.', 'error');
    }
  };

  const handleOpenAddFood = () => {
    setEditingFood(null);
    setFoodForm({
      name: '',
      price: 65000,
      category: 'Món chính',
      description: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
      isActive: true,
    });
    setIsFoodModalOpen(true);
  };

  const handleOpenEditFood = (food: any) => {
    setEditingFood(food);
    setFoodForm({
      name: food.name,
      price: food.price,
      category: food.category || 'Món chính',
      description: food.description || '',
      image: food.image || '',
      isActive: food.isActive !== undefined ? food.isActive : true,
    });
    setIsFoodModalOpen(true);
  };

  const [tables, setTables] = useState<any[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromTableId, setTransferFromTableId] = useState('');
  const [transferFromTableName, setTransferFromTableName] = useState('');
  const [transferToTableId, setTransferToTableId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);
  const [tableForm, setTableForm] = useState({
    tableName: '',
    status: 'empty',
  });

  // Users/Staff management states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  const [filterTableId, setFilterTableId] = useState<string>('');

  // Profile Update states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenProfile = () => {
    if (!user) return;
    setProfileForm({
      name: user.name,
      email: user.email,
      password: '',
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    setIsSavingProfile(true);
    try {
      const payload: any = {
        name: profileForm.name,
        email: profileForm.email,
      };
      if (profileForm.password) {
        payload.password = profileForm.password;
      }

      const res = await fetch(`${API_BASE}/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Cập nhật thông tin thất bại.');
      
      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update in users list if admin
      if (user.role === 'admin') {
        setUsersList((prev) => prev.map((u) => (u._id === user._id ? updatedUser : u)));
      }
      
      showToast('Cập nhật thông tin tài khoản thành công! ⚙️', 'success');
      setIsProfileModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Fetch Tables & Users inside useEffect when user role is checked
  useEffect(() => {
    if (!user) return;

    const fetchTablesAndUsers = async () => {
      try {
        const promises: Promise<any>[] = [];
        
        // Both admin and staff can load tables
        if (user.role === 'admin' || user.role === 'staff') {
          promises.push(
            fetch(`${API_BASE}/tables`).then(async (res) => {
              if (res.ok) {
                const tablesData = await res.json();
                setTables(tablesData);
              }
            })
          );
        }
        
        // Only admin can load users
        if (user.role === 'admin') {
          promises.push(
            fetch(`${API_BASE}/users`).then(async (res) => {
              if (res.ok) {
                const usersData = await res.json();
                setUsersList(usersData);
              }
            })
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error('Lỗi tải bàn/nhân viên:', err);
      }
    };
    fetchTablesAndUsers();
  }, [user]);

  // Tables CRUD
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá bàn này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/tables/${tableId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Xoá bàn thất bại.');
      setTables((prev) => prev.filter((t) => t._id !== tableId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    }
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.tableName) {
      showToast('Vui lòng nhập Tên bàn.', 'error');
      return;
    }

    try {
      const url = editingTable ? `${API_BASE}/tables/${editingTable._id}` : `${API_BASE}/tables`;
      const method = editingTable ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tableForm),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message || 'Lưu bàn thất bại.';
        throw new Error(errMsg);
      }
      const saved = await res.json();

      if (editingTable) {
        setTables((prev) => prev.map((t) => (t._id === editingTable._id ? saved : t)));
        showToast('Cập nhật thông tin bàn thành công! 🪑', 'success');
      } else {
        setTables((prev) => [...prev, saved]);
        showToast('Thêm bàn ăn mới thành công! 🎉', 'success');
      }
      setIsTableModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu bàn.', 'error');
    }
  };

  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableForm({
      tableName: '',
      status: 'empty',
    });
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (tableItem: any) => {
    setEditingTable(tableItem);
    setTableForm({
      tableName: tableItem.tableName,
      status: tableItem.status || 'empty',
    });
    setIsTableModalOpen(true);
  };

  // Staff/Users CRUD
  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const executeDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Xoá nhân viên thất bại.');
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      showToast('Đã xóa tài khoản nhân viên thành công! 👥', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.', 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || (!editingUser && !userForm.password)) {
      showToast('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.', 'error');
      return;
    }

    try {
      const url = editingUser ? `${API_BASE}/users/${editingUser._id}` : `${API_BASE}/users`;
      const method = editingUser ? 'PATCH' : 'POST';

      const payload: any = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      if (userForm.password) {
        payload.password = userForm.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message || 'Lưu nhân viên thất bại.';
        throw new Error(errMsg);
      }
      const saved = await res.json();

      if (editingUser) {
        setUsersList((prev) => prev.map((u) => (u._id === editingUser._id ? saved : u)));
        showToast('Cập nhật tài khoản nhân viên thành công! 👥', 'success');
      } else {
        setUsersList((prev) => [...prev, saved]);
        showToast('Thêm nhân viên mới thành công! 🎉', 'success');
      }
      setIsUserModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu nhân viên.', 'error');
    }
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'staff',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (userItem: any) => {
    setEditingUser(userItem);
    setUserForm({
      name: userItem.name,
      email: userItem.email,
      password: '',
      role: userItem.role || 'staff',
    });
    setIsUserModalOpen(true);
  };

  useEffect(() => {
    setMounted(true);

    const storedToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');
    const savedLang = localStorage.getItem('dashboard_lang') as Lang;
    if (savedLang) {
      setLang(savedLang);
    }

    if (!storedToken || !storedUserStr) {
      router.push('/login');
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUserStr));
  }, [router]);

  // Fetch all orders & Initialize Socket.io
  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

    fetchOrders();

    // Socket.io initialization
    socketRef.current = io(SOCKET_BASE);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket gateway');
    });

    socketRef.current.on('newOrder', (newOrder: Order) => {
      // Append the new order instantly to the beginning of the list
      setOrders((prev) => [newOrder, ...prev]);

      // Play alert sound for new order
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
        audio.play();
      } catch (e) {
        console.log('Audio error:', e);
      }
    });

    socketRef.current.on('statusUpdated', ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status } : order))
      );
    });

    socketRef.current.on('orderDeleted', ({ orderId }: { orderId: string }) => {
      setOrders((prev) => {
        const exists = prev.some((order) => order._id === orderId);
        if (exists) {
          showToast('Một đơn hàng vừa được xóa theo thời gian thực! 🗑️', 'info');
        }
        return prev.filter((order) => order._id !== orderId);
      });
      setActiveInvoice((prev) => (prev?._id === orderId ? null : prev));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

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

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Cập nhật trạng thái thất bại.');
      }

      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order))
      );
      
      // Play delightful successful payment chime if marked completed
      if (newStatus === 'completed') {
        playMomoChime();
      }

      showToast(`Cập nhật trạng thái đơn hàng thành công! 🚀`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật.', 'error');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
  };

  const executeDeleteOrder = async (orderId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Xoá đơn hàng thất bại.');
      }

      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      setActiveInvoice((prev) => (prev?._id === orderId ? null : prev));
      showToast('Đã xóa đơn hàng thành công! 🗑️', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xoá đơn hàng.', 'error');
    } finally {
      setOrderToDelete(null);
    }
  };

  const handleTransferTable = async () => {
    if (!transferFromTableId || !transferToTableId || isTransferring || !token) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`${API_BASE}/orders/transfer-table`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromTableId: transferFromTableId,
          toTableId: transferToTableId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Không thể chuyển bàn ăn');
      }

      // Re-fetch orders
      const ordersRes = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }

      // Re-fetch tables
      const tablesRes = await fetch(`${API_BASE}/tables`);
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }

      showToast('Đã chuyển bàn ăn thành công! 🔄', 'success');
      setIsTransferModalOpen(false);
      setTransferFromTableId('');
      setTransferFromTableName('');
      setTransferToTableId('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chuyển bàn.', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cooking': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'paid': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return t.status_pending;
      case 'cooking': return t.status_cooking;
      case 'completed': return t.status_completed;
      case 'cancelled': return t.status_cancelled;
      case 'paid': return t.status_paid;
      default: return status;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Navbar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">🧑‍🍳</span>
            <div className="min-w-0">
              <h1 className="font-logo text-xl sm:text-2xl text-orange-500 dark:text-orange-400 font-normal leading-none select-none">
                Chika Restaurant
              </h1>
              <p className="hidden sm:block text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase font-semibold tracking-wider truncate">
                {t.hubSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {/* User display with Edit Profile click */}
            <div 
              onClick={handleOpenProfile}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200/50 dark:hover:border-zinc-700/50 cursor-pointer transition-all active:scale-95 group"
              title={t.updateAccount}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-500 transition-colors">
                  {user?.name}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  {user?.role === 'admin' ? `🔑 ${t.adminRole}` : `💼 ${t.staffRole}`}
                </p>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-orange-500 transition-colors">⚙️</span>
            </div>

            {/* Profile Button for mobile */}
            <button
              onClick={handleOpenProfile}
              className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform md:hidden"
              title={t.updateAccount}
            >
              ⚙️
            </button>

            {/* Language Selector Popover */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 text-xs font-bold py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all border border-transparent dark:border-zinc-800 shadow-sm"
              >
                <span>{lang === 'vi' ? '🇻🇳' : lang === 'en' ? '🇺🇸' : '🇨🇳'}</span>
                <span className="hidden sm:inline">
                  {lang === 'vi' ? ' VI' : lang === 'en' ? ' EN' : ' ZH'}
                </span>
                <svg className={`w-3 h-3 text-slate-450 dark:text-zinc-400 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 z-50 min-w-[120px] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-100 dark:border-zinc-800 p-1.5 shadow-xl"
                    >
                      <button
                        onClick={() => {
                          setLang('vi');
                          localStorage.setItem('dashboard_lang', 'vi');
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          lang === 'vi'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-base">🇻🇳</span> Vietnamese
                      </button>
                      <button
                        onClick={() => {
                          setLang('en');
                          localStorage.setItem('dashboard_lang', 'en');
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          lang === 'en'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-base">🇺🇸</span> English
                      </button>
                      <button
                        onClick={() => {
                          setLang('zh');
                          localStorage.setItem('dashboard_lang', 'zh');
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          lang === 'zh'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-base">🇨🇳</span> Chinese
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform"
              aria-label="Toggle Dark Mode"
            >
              {resolvedTheme === 'dark' ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-2 sm:px-4 sm:py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              title={t.logout}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sub-Header Tabs and Create Action */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          {/* Tabs Switcher */}
          <div className="flex flex-wrap bg-gray-150/80 dark:bg-zinc-900 p-1.5 rounded-2xl w-fit border dark:border-zinc-800 transition-colors gap-1 animate-fade-in">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'orders'
                  ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              📋 {t.tabOrders} ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('foods')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'foods'
                  ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
              }`}
            >
              🍔 {t.tabFoods} ({foods.length})
            </button>

            {(user?.role === 'admin' || user?.role === 'staff') && (
              <button
                onClick={() => setActiveTab('tables')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'tables'
                    ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                🪑 {t.tabTables} ({tables.length})
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                👥 {t.tabUsers} ({usersList.length})
              </button>
            )}
          </div>

          {/* Action Buttons depending on current tab */}
          <div className="shrink-0">
            {activeTab === 'foods' && (user?.role === 'admin' || user?.role === 'staff') && (
              <button
                onClick={handleOpenAddFood}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-655 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 w-full lg:w-fit"
              >
                ➕ {t.addFood}
              </button>
            )}
            {activeTab === 'tables' && (user?.role === 'admin' || user?.role === 'staff') && (
              <button
                onClick={handleOpenAddTable}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-655 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 w-full lg:w-fit"
              >
                ➕ {t.addTable}
              </button>
            )}
            {activeTab === 'users' && user?.role === 'admin' && (
              <button
                onClick={handleOpenAddUser}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-655 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 w-full lg:w-fit"
              >
                ➕ {t.addUser}
              </button>
            )}
          </div>
        </div>

        {/* Render Tab Contents */}
        {activeTab === 'orders' && (
          /* 📋 ORDERS TAB PANEL */
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-500">{t.loadingOrders}</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-md">
              <span className="text-5xl">⚠️</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-4">{t.errorSync}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error}</p>
            </div>
          ) : (
            <div>
              {filterTableId && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-zinc-800/80 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-orange-600 dark:text-orange-400">
                        Đang xem đơn hàng của {tables.find(t => t._id === filterTableId)?.tableName || 'Bàn ăn'}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Hiển thị lịch sử tất cả các đợt gọi món của bàn này.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFilterTableId('')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] rounded-xl transition-all shadow-sm shrink-0 uppercase tracking-wider"
                  >
                    Xóa bộ lọc ✕
                  </button>
                </div>
              )}

              {orders.filter((o) => !filterTableId || o.tableId?._id === filterTableId).length === 0 ? (
                <div className="text-center py-28 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-zinc-800 shadow-md">
                  <span className="text-5xl">🍽️</span>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-4">{t.noOrders}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t.noOrdersDesc}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orders
                    .filter((o) => !filterTableId || o.tableId?._id === filterTableId)
                    .map((order) => (
                <div
                  key={order._id}
                  className="reveal-on-scroll bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Visual Accent based on status */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    order.status === 'pending' ? 'bg-yellow-450' :
                    order.status === 'cooking' ? 'bg-orange-500' :
                    order.status === 'completed' ? 'bg-green-500' :
                    order.status === 'cancelled' ? 'bg-red-500' : 'bg-purple-500'
                  }`} />

                  {/* Card Header & Content */}
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <h3 className="text-base font-extrabold text-gray-800 dark:text-white truncate">
                            {order.tableId?.tableName || t.unknownTable}
                          </h3>
                          {/* Payment Method Badge */}
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0 ${
                            order.paymentMethod === 'momo'
                              ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30'
                              : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30'
                          }`}>
                            {order.paymentMethod === 'momo' ? `🌸 ${t.momo}` : `💵 ${t.cash}`}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {t.orderCode}: #{order._id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.status !== 'paid' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setTransferFromTableId(order.tableId?._id || '');
                              setTransferFromTableName(order.tableId?.tableName || '');
                              setIsTransferModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:scale-105 active:scale-95 transition-all"
                            title="Chuyển bàn"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-105 active:scale-95 transition-all"
                          title={t.deleteOrderTitle}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Food items list */}
                    <div className="border-t border-b border-gray-50 dark:border-zinc-800 py-3 my-3 space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex-1 pr-4">
                            <p className="font-bold text-gray-800 dark:text-gray-200">
                              {item.foodId?.name || t.foodDeleted} 
                              <span className="text-orange-500 ml-1.5">x{item.quantity}</span>
                            </p>
                            {item.note && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic pl-2 border-l border-orange-200 dark:border-zinc-700">
                                💬 {item.note}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-gray-600 dark:text-gray-400">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.foodId?.price || 0) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer & Controls */}
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-xs font-semibold text-gray-400">{t.totalAmount}:</span>
                      <span className="text-base font-black text-orange-500 dark:text-orange-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                      </span>
                    </div>

                    {/* Action Buttons depending on status */}
                    <div className="grid grid-cols-2 gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            className="py-2.5 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                          >
                            {t.cancelOrder}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cooking')}
                            className="py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-655 rounded-xl shadow-sm transition-all"
                          >
                            {t.cookOrder}
                          </button>
                        </>
                      )}

                      {order.status === 'cooking' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            className="py-2.5 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                          >
                            {t.cancelOrder}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'completed')}
                            className="py-2.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl shadow-sm transition-all"
                          >
                            {t.completeOrder}
                          </button>
                        </>
                      )}

                      {order.status === 'completed' && (
                        order.paymentMethod === 'cash' ? (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'paid')}
                            className="col-span-2 py-2.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-all"
                          >
                            {t.payCash} 💵
                          </button>
                        ) : (
                          <div className="col-span-2 text-center text-xs font-black text-pink-500 bg-pink-50 dark:bg-pink-950/20 py-2.5 rounded-xl border border-pink-100 dark:border-pink-900/30 animate-pulse">
                            🌸 {t.waitMoMo}
                          </div>
                        )
                      )}

                      {order.status === 'paid' && (
                        <div className="col-span-2 space-y-2">
                          <div className="text-center text-xs font-extrabold text-green-500 bg-green-50 dark:bg-green-950/20 py-2 rounded-xl border border-green-100 dark:border-green-900/30">
                            {t.paidSuccess}
                          </div>
                          <button
                            onClick={() => setActiveInvoice(order)}
                            className="w-full py-2 text-xs font-black text-white bg-purple-500 hover:bg-purple-650 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                          >
                            🧾 {t.viewInvoice}
                          </button>
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="col-span-2 text-center text-xs font-extrabold text-red-500 bg-red-50 dark:bg-red-950/20 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30">
                          {t.orderCancelledText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    )}

                {/* 🍔 FOODS MANAGEMENT TAB PANEL (Admin and Staff) */}
        {activeTab === 'foods' && (user?.role === 'admin' || user?.role === 'staff') && (
          foods.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl p-8 border dark:border-zinc-800 shadow-sm">
              <span className="text-5xl">🍔</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-4">Chưa có món ăn nào trong thực đơn</h2>
              <button
                onClick={handleOpenAddFood}
                className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-655 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-95"
              >
                ➕ Thêm món đầu tiên ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
              {foods.map((food) => (
                <div
                  key={food._id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-150 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Food Image Cover */}
                    <div className="relative h-44 w-full bg-gray-100 dark:bg-zinc-800">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {food.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white truncate">
                        {food.name}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 min-h-[2rem]">
                        {food.description || 'Chưa có mô tả chi tiết cho món ăn này.'}
                      </p>
                      <div className="flex items-center justify-between border-t dark:border-zinc-800 pt-3 mt-3">
                        <span className="text-xs font-semibold text-gray-400">Đơn giá:</span>
                        <span className="text-sm font-black text-orange-500">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(food.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenEditFood(food)}
                      className="py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors"
                    >
                      📝 Sửa món
                    </button>
                    <button
                      onClick={() => handleDeleteFood(food._id)}
                      className="py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 text-xs font-bold rounded-xl transition-colors"
                    >
                      🗑️ Xoá món
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 🪑 TABLES MANAGEMENT TAB PANEL (Admin and Staff) */}
        {activeTab === 'tables' && (user?.role === 'admin' || user?.role === 'staff') && (
          tables.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl p-8 border dark:border-zinc-800 shadow-sm animate-fade-in">
              <span className="text-5xl">🪑</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-4">Chưa cấu hình bàn ăn nào</h2>
              <button
                onClick={handleOpenAddTable}
                className="mt-6 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-95"
              >
                ➕ Thêm bàn đầu tiên ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
              {tables.map((tableItem) => (
                <div
                  key={tableItem._id}
                  className="reveal-on-scroll bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-150 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    {/* Visual table seat illustration */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/25 flex items-center justify-center text-xl font-bold text-orange-500">
                        🍽️
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        tableItem.status === 'serving'
                          ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/10'
                          : tableItem.status === 'reserved'
                          ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200/10'
                          : 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/10'
                      }`}>
                        {tableItem.status === 'serving' 
                          ? `${t.tableOccupied} 👥` 
                          : tableItem.status === 'reserved' 
                          ? `${t.tableReserved} 📅` 
                          : `${t.tableEmpty} 🟢`}
                      </span>
                    </div>

                     <div>
                      <h3 className="text-base font-extrabold text-gray-800 dark:text-white">
                        {tableItem.tableName}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-semibold">
                        Mã bàn: {tableItem._id.slice(-6).toUpperCase()}
                      </p>

                      {/* High-quality dynamic QR code preview card */}
                      <div className="relative group/qr overflow-hidden rounded-2xl bg-white p-3 border border-gray-100 dark:border-zinc-800/80 flex flex-col items-center justify-center my-3.5 shadow-inner">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            typeof window !== 'undefined' ? `${window.location.origin}/table/${tableItem._id}` : `http://localhost:3000/table/${tableItem._id}`
                          )}`} 
                          alt={`QR ${tableItem.tableName}`}
                          className="w-28 h-28 object-contain"
                          loading="lazy"
                        />
                        {/* Hover Overlay with Copy & Download controls (Hidden on mobile via 'md:flex hidden') */}
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/qr:opacity-100 transition-all duration-200 md:flex hidden flex-col items-center justify-center gap-2 rounded-2xl p-2">
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                              typeof window !== 'undefined' ? `${window.location.origin}/table/${tableItem._id}` : `http://localhost:3000/table/${tableItem._id}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black shadow-md hover:scale-105 active:scale-95 transition-all"
                          >
                            📥 Tải QR cực nét (In)
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                navigator.clipboard.writeText(`${window.location.origin}/table/${tableItem._id}`);
                                showToast('Đã sao chép liên kết bàn ăn thành công! 🔗', 'success');
                              }
                            }}
                            className="w-full py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-xl text-[10px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                          >
                            🔗 Sao chép liên kết
                          </button>
                        </div>
                      </div>

                      {/* Always-visible button row for Mobile screens only */}
                      <div className="md:hidden grid grid-cols-2 gap-2 mt-1 mb-3.5">
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                            typeof window !== 'undefined' ? `${window.location.origin}/table/${tableItem._id}` : `http://localhost:3000/table/${tableItem._id}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black shadow-md flex items-center justify-center gap-1 active:scale-95 transition-all text-center"
                        >
                          📥 Tải QR in
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(`${window.location.origin}/table/${tableItem._id}`);
                              showToast('Đã sao chép liên kết bàn ăn thành công! 🔗', 'success');
                            }
                          }}
                          className="w-full py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-[10px] font-bold shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          🔗 Copy link
                        </button>
                      </div>

                      <p className="text-[9px] text-center text-gray-400 dark:text-zinc-500 font-semibold italic">
                        <span className="hidden md:inline">Di chuột lên mã QR để Tải ảnh in hoặc Copy link</span>
                        <span className="md:hidden">Bấm nút phía trên để Tải ảnh QR hoặc Copy link</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <button
                      onClick={() => {
                        setFilterTableId(tableItem._id);
                        setActiveTab('orders');
                      }}
                      className="w-full py-2.5 bg-orange-500/10 text-orange-655 dark:text-orange-450 hover:bg-orange-500/20 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 border border-orange-500/20"
                    >
                      📋 Xem lịch sử đặt món
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenEditTable(tableItem)}
                        className="py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors"
                      >
                        📝 Sửa bàn
                      </button>
                      <button
                        onClick={() => handleDeleteTable(tableItem._id)}
                        className="py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 text-xs font-bold rounded-xl transition-colors"
                      >
                        🗑️ Xoá
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 👥 STAFF MEMBERS MANAGEMENT TAB PANEL (Admin only) */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-150 dark:border-zinc-800/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
                    <th className="p-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Họ và tên</th>
                    <th className="p-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Địa chỉ Email</th>
                    <th className="p-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Chức vụ / Vai trò</th>
                    <th className="p-5 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {usersList.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-150/75 dark:bg-zinc-800 flex items-center justify-center font-extrabold text-orange-600 dark:text-orange-400 text-sm shrink-0">
                            {userItem.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-sm text-gray-800 dark:text-gray-200">
                            {userItem.name} {userItem._id === user?._id && <span className="text-[10px] text-orange-500 ml-1.5 font-black uppercase tracking-wider shrink-0">(Bạn)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {userItem.email}
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                          userItem.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200/20'
                            : 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/20'
                        }`}>
                          {userItem.role === 'admin' ? 'Quản trị viên 👑' : 'Nhân viên 💼'}
                        </span>
                      </td>
                      <td className="p-5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleOpenEditUser(userItem)}
                          className="px-3.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors"
                        >
                          📝 Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userItem._id)}
                          disabled={userItem._id === user?._id}
                          className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 text-xs font-bold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          🗑️ Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── 3. Food Editor Modal Overlay ── */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => setIsFoodModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl z-10 overflow-hidden border dark:border-zinc-800 transition-all">
            <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                {editingFood ? '📝 Cập nhật món ăn' : '🍔 Thêm món ăn mới'}
              </h2>
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-250 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tên món ăn</label>
                <input
                  type="text"
                  required
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  placeholder="Ví dụ: Phở Bò Tái Lăn, Pizza Hải Sản..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Đơn giá (VND)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Danh mục</label>
                  <select
                    value={foodForm.category}
                    onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                  >
                    <option value="Món chính">Món chính</option>
                    <option value="Khai vị">Khai vị</option>
                    <option value="Tráng miệng">Tráng miệng</option>
                    <option value="Đồ uống">Đồ uống</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  placeholder="Mô tả thành phần, hương vị của món..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150 resize-none animate-none"
                />
              </div>

              {/* Image Input Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Hình ảnh món ăn</label>
                  
                  {/* Selector Segment Control */}
                  <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border dark:border-zinc-700/50">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                        imageInputMode === 'upload'
                          ? 'bg-white dark:bg-zinc-900 text-orange-500 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      📤 Tải lên
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                        imageInputMode === 'url'
                          ? 'bg-white dark:bg-zinc-900 text-orange-500 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                      }`}
                    >
                      🔗 Nhập URL
                    </button>
                  </div>
                </div>

                {/* Live Thumbnail Preview for both modes */}
                <div className="flex gap-4 items-center bg-gray-50/50 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-gray-150 dark:border-zinc-800">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border dark:border-zinc-700 shrink-0 relative flex items-center justify-center shadow-inner animate-pulse-once">
                    {isUploadingImage ? (
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : foodForm.image ? (
                      <img src={foodForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📷</span>
                    )}
                  </div>

                  {/* Mode 1: Cloudinary File Uploader */}
                  {imageInputMode === 'upload' && (
                    <div className="flex-1 space-y-1 animate-fade-in">
                      <input
                        type="file"
                        accept="image/*"
                        id="food-image-file-input"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadToCloudinary(file);
                        }}
                      />
                      <label
                        htmlFor="food-image-file-input"
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-orange-200 dark:border-zinc-800 hover:bg-orange-50/50 dark:hover:bg-zinc-800/50 text-xs font-black text-orange-600 dark:text-orange-400 cursor-pointer transition-all active:scale-95 ${
                          isUploadingImage ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        📤 {isUploadingImage ? 'Đang tải lên...' : 'Chọn ảnh từ thiết bị'}
                      </label>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Tải lên đám mây Cloudinary của bạn</p>
                    </div>
                  )}

                  {/* Mode 2: Custom Presets in URL mode */}
                  {imageInputMode === 'url' && (
                    <div className="flex-1 space-y-1.5 animate-fade-in">
                      <input
                        type="text"
                        required={imageInputMode === 'url'}
                        value={foodForm.image}
                        onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                        placeholder="Dán link ảnh (Unsplash, Imgur...)"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-805 dark:text-gray-150"
                      />
                      
                      {/* Preset presets quick image click */}
                      <div className="flex gap-1.5 overflow-x-auto max-w-[200px] scrollbar-none pb-0.5">
                        {[
                          { name: 'Nước ngọt', url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&auto=format&fit=crop&q=60' },
                          { name: 'Lẩu nóng', url: 'https://images.unsplash.com/photo-1547928576-a4a33237bea3?w=500&auto=format&fit=crop&q=60' },
                          { name: 'Thịt nướng', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' }
                        ].map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setFoodForm({ ...foodForm, image: preset.url })}
                            className="shrink-0 text-[9px] font-bold bg-white dark:bg-zinc-800 px-2 py-1 rounded-md text-gray-500 hover:text-orange-500 border dark:border-zinc-750 transition-colors"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit buttons */}
              <div className="pt-4 border-t dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="py-3 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="py-3 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md transition-all active:scale-95"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. Table Editor Modal Overlay ── */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsTableModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl z-10 overflow-hidden border dark:border-zinc-800 transition-all animate-fade-in">
            <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                {editingTable ? '📝 Cập nhật bàn ăn' : '🪑 Thêm bàn ăn mới'}
              </h2>
              <button onClick={() => setIsTableModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveTable} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tên bàn</label>
                <input
                  type="text" required value={tableForm.tableName}
                  onChange={(e) => setTableForm({ ...tableForm, tableName: e.target.value })}
                  placeholder="Ví dụ: Bàn số 1, Bàn số 2..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Trạng thái bàn</label>
                <select
                  value={tableForm.status}
                  onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                >
                  <option value="empty">Bàn trống (empty)</option>
                  <option value="serving">Có khách (serving)</option>
                  <option value="reserved">Khách hẹn (reserved)</option>
                </select>
              </div>

              <div className="pt-4 border-t dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setIsTableModalOpen(false)} className="py-3 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl">Hủy bỏ</button>
                <button type="submit" className="py-3 text-xs font-bold text-white bg-orange-500 hover:bg-orange-650 rounded-xl shadow-md transition-all active:scale-95">Lưu bàn ăn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Staff Editor Modal Overlay ── */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsUserModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl z-10 overflow-hidden border dark:border-zinc-800 transition-all animate-fade-in">
            <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                {editingUser ? '📝 Cập nhật tài khoản' : '👥 Thêm nhân viên mới'}
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Họ và tên</label>
                <input
                  type="text" required value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Địa chỉ Email</label>
                <input
                  type="email" required value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="name@restaurant.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  Mật khẩu {editingUser && <span className="text-[10px] text-gray-400 font-normal">(để trống nếu không đổi)</span>}
                </label>
                <input
                  type="password" required={!editingUser} value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "Nhập mật khẩu tài khoản"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Chức vụ / Vai trò</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                >
                  <option value="staff">Nhân viên phục vụ (staff)</option>
                  <option value="admin">Quản trị viên (admin)</option>
                </select>
              </div>

              <div className="pt-4 border-t dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="py-3 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl">Hủy bỏ</button>
                <button type="submit" className="py-3 text-xs font-bold text-white bg-orange-500 hover:bg-orange-650 rounded-xl shadow-md transition-all active:scale-95">Lưu tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 🧾 INVOICE / RECEIPT MODAL OVERLAY */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-150 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🧾</span> HÓA ĐƠN ĐIỆN TỬ
              </h2>
              <button 
                onClick={() => setActiveInvoice(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-sm font-bold p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 relative overflow-hidden">
              {/* Decorative dotted line pattern top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500" />

              {/* Stamp Paid */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none rotate-12 select-none text-center">
                <span className="text-6xl font-black border-8 border-green-500 text-green-500 rounded-2xl px-6 py-3 tracking-widest uppercase">
                  ĐÃ THANH TOÁN
                </span>
              </div>

              {/* Invoice header info */}
              <div className="text-center pb-5 border-b border-dashed border-gray-250 dark:border-zinc-855 text-left">
                <h3 className="text-base font-black text-gray-900 dark:text-white text-center">RESTAURANT HUB</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 text-center">Dịch vụ gọi món & Thanh toán tự động</p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <div>
                    <p>Mã hóa đơn:</p>
                    <p className="font-extrabold text-gray-800 dark:text-gray-200 uppercase">#{activeInvoice._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p>Số bàn:</p>
                    <p className="font-extrabold text-gray-850 dark:text-gray-200">{activeInvoice.tableId?.tableName || '—'}</p>
                  </div>
                  <div className="mt-2">
                    <p>Hình thức:</p>
                    <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-0.5 ${
                      activeInvoice.paymentMethod === 'momo'
                        ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30'
                        : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30'
                    }`}>
                      {activeInvoice.paymentMethod === 'momo' ? '🌸 Ví MoMo' : '💵 Tiền mặt'}
                    </span>
                  </div>
                  <div className="text-right mt-2">
                    <p>Thời gian:</p>
                    <p className="font-extrabold text-gray-850 dark:text-gray-200">{new Date(activeInvoice.createdAt).toLocaleTimeString('vi-VN')} {new Date(activeInvoice.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              {/* Food Items */}
              <div className="py-4 border-b border-dashed border-gray-250 dark:border-zinc-855 space-y-3 max-h-[160px] overflow-y-auto pr-1">
                {activeInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs text-left">
                    <div className="flex-1 pr-3">
                      <p className="font-bold text-gray-800 dark:text-gray-150">
                        {item.foodId?.name || 'Món ăn'} 
                        <span className="text-orange-500 ml-1">x{item.quantity}</span>
                      </p>
                      {item.note && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 italic mt-0.5 pl-1.5 border-l border-orange-200">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-650 dark:text-gray-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.foodId?.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial summary */}
              <div className="pt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tiền hàng:</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>VAT (8%):</span>
                  <span>Đã bao gồm</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-zinc-800 mt-2">
                  <span className="text-xs font-black text-gray-800 dark:text-white">TỔNG CỘNG:</span>
                  <span className="text-base font-black text-green-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.print()}
                  className="py-3 text-xs font-extrabold text-gray-700 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  🖨️ In hóa đơn
                </button>
                <button
                  onClick={() => setActiveInvoice(null)}
                  className="py-3 text-xs font-extrabold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Custom Confirmation Modal for Deleting Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" style={{ animation: 'fadeIn 0.2s ease-out forwards' }}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-6 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Xác nhận xóa đơn hàng
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa đơn hàng này vĩnh viễn không? Hành động này sẽ cập nhật và đồng bộ theo thời gian thực tới tất cả thiết bị và không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => executeDeleteOrder(orderToDelete)}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                🗑️ Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🍔 Custom Confirmation Modal for Deleting Food Item */}
      {foodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" style={{ animation: 'fadeIn 0.2s ease-out forwards' }}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-6 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-3xl">🍔</span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Xác nhận xóa món ăn
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa món ăn này khỏi thực đơn không? Khách hàng sẽ không thể nhìn thấy hoặc gọi món này nữa.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFoodToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => executeDeleteFood(foodToDelete)}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                🗑️ Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👥 Custom Confirmation Modal for Deleting User/Staff */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" style={{ animation: 'fadeIn 0.2s ease-out forwards' }}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-6 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-3xl">👥</span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Xác nhận xóa nhân viên
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa tài khoản nhân viên này không? Người này sẽ không còn quyền truy cập vào Dashboard quản trị.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => executeDeleteUser(userToDelete)}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-md shadow-red-500/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                🗑️ Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ Premium Account Information Update Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsProfileModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl z-10 overflow-hidden border dark:border-zinc-800 transition-all animate-fade-in">
            <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h2 className="text-base font-black text-gray-900 dark:text-white">
                  Cập nhật tài khoản
                </h2>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-650 dark:hover:text-zinc-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Địa chỉ Email</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="Ví dụ: staff@gmail.com..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Mật khẩu mới</label>
                  <span className="text-[10px] text-gray-400 font-bold dark:text-zinc-500 italic">Để trống nếu không đổi</span>
                </div>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="py-3 text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="py-3 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  {isSavingProfile ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Lưu thông tin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔔 Premium Floating Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-bold transition-all ${
              toast.type === 'success'
                ? 'bg-green-500 text-white border-green-400/20'
                : toast.type === 'error'
                ? 'bg-red-500 text-white border-red-400/20'
                : 'bg-zinc-900 dark:bg-zinc-800 text-white border-zinc-700/30'
            }`}
            style={{ animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            <span className="text-lg leading-none">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '🔔'}
            </span>
            <p className="flex-1 text-xs">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/60 hover:text-white transition-colors text-xs ml-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 🎨 Dynamically Injected Keyframes CSS for Modal & Toast */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(1rem) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* 🔄 Table Transfer Modal for Dashboard */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all" style={{ animation: 'fadeIn 0.2s ease-out forwards' }}>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-6 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 text-blue-500">
              <span className="text-3xl">🔄</span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Chuyển bàn ăn ({transferFromTableName})
              </h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Vui lòng chọn bàn trống đích muốn chuyển tất cả đơn hàng đang hoạt động của <strong>{transferFromTableName}</strong> sang.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block font-sans">Chọn bàn ăn trống</label>
              <select
                value={transferToTableId}
                onChange={(e) => setTransferToTableId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-205 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-gray-150 font-semibold"
              >
                <option value="" className="text-gray-400">-- Chọn bàn trống --</option>
                {tables
                  .filter((t) => t._id !== transferFromTableId && t.status === 'empty')
                  .map((t) => (
                    <option key={t._id} value={t._id} className="text-gray-850 dark:text-zinc-100 font-semibold">
                      {t.tableName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferFromTableId('');
                  setTransferFromTableName('');
                  setTransferToTableId('');
                }}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleTransferTable}
                disabled={!transferToTableId || isTransferring}
                className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-650 text-white text-xs font-black shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isTransferring ? 'Đang chuyển...' : '🔄 Đồng ý chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
