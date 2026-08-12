const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 1. Manually parse .env to get MONGODB_URI
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) return;
    const key = trimmed.slice(0, firstEq).trim();
    const value = trimmed.slice(firstEq + 1).trim();
    process.env[key] = value;
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file!');
  process.exit(1);
}

// 2. Define Mongoose Schemas (matching the NestJS models)
const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const TableSchema = new mongoose.Schema({
  tableName: { type: String, unique: true, required: true },
  qrCodeUrl: { type: String },
  status: { type: String, enum: ['empty', 'serving'], default: 'empty' },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
}, { timestamps: true });

const Food = mongoose.model('Food', FoodSchema);
const Table = mongoose.model('Table', TableSchema);
const User = mongoose.model('User', UserSchema);

// 3. Coffee Shop Seed Data (Chika Coffee Menu)
const foods = [
  // ==========================================
  // 1. DANH MỤC: CÀ PHÊ (Coffee) - 15 món
  // ==========================================
  {
    name: 'Cà Phê Muối Huế Đặc Sản',
    description: 'Sự kết hợp hoàn hảo giữa vị đậm đà thanh lịch của cà phê phin truyền thống, lớp kem sữa mặn béo ngậy mềm mịn đánh bông thủ công và chút đắng dịu lưu giữ hậu vị nồng nàn thơm nức.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Sữa Đá Phin Đậm Đặc',
    description: 'Từng giọt cà phê Robusta Đắk Lắk nguyên chất chiết xuất qua phin truyền thống, hòa quyện với sữa đặc béo ngọt hảo hạng và đá lạnh nhuyễn mát mẻ, mang lại sự tỉnh táo tức thì.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Đen Đá Phin Nguyên Chất',
    description: 'Dành riêng cho gu thưởng thức đắng đậm truyền thống. Hạt cà phê Robusta rang mộc thơm nồng nàn, chiết xuất phin tinh khiết cho hậu vị đắng thanh thanh ngọt nhẹ sau cùng.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Espresso Ý Double Shot',
    description: 'Chiết xuất từ hạt Arabica Cầu Đất phối trộn Robusta thượng hạng bằng máy pha chuyên nghiệp, cho ra lớp crema dày mịn màu nâu cánh gián thơm phức và vị đắng đậm tinh tế.',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cappuccino Ý Bọt Mịn Art',
    description: 'Tỷ lệ cân bằng hoàn hảo giữa 1 shot Espresso đậm đà, sữa tươi thanh trùng đánh nóng và lớp bọt sữa dày mịn màng được tạo hình Latte Art đẹp mắt đầy tính nghệ thuật.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Latte Vanille Kem Béo',
    description: 'Hương vị nhẹ nhàng êm ái kết hợp giữa Espresso thượng hạng, sữa tươi thanh trùng hòa quyện cùng siro Vanille Pháp ngọt ngào tinh tế, phủ lớp bọt sữa mỏng mượt.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Caramel Macchiato Nóng/Đá',
    description: 'Tầng sữa tươi nóng ngọt ngào rưới đều shot Espresso, dải trên cùng là sốt Caramel nướng thơm lừng béo ngậy tạo nên bản hòa tấu hương vị đa tầng độc đáo.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Americano Đá Thanh Mát',
    description: 'Espresso nguyên bản pha loãng với nước tinh khiết và đá lạnh. Thức uống thanh nhẹ, giữ trọn hương vị trái cây tự nhiên và hương hoa thoang thoảng của hạt Arabica.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cold Brew Cam Sả Tươi',
    description: 'Cà phê ủ lạnh trong 16 giờ chiết xuất vị chua thanh tự nhiên, kết hợp cùng nước cam tươi mọng nước và sả đập dập thơm nồng, sảng khoái và cực kỳ healthy.',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cold Brew Sữa Dừa Bến Tre',
    description: 'Cà phê Cold Brew ủ lạnh mát rượi hòa quyện cùng nước cốt dừa Bến Tre béo ngậy tự nhiên, mang lại cảm giác mượt mà êm dịu trên đầu lưỡi.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Dừa Đá Xay Chika',
    description: 'Món Best-Seller với nước cốt dừa tươi đá xay dẻo mịn béo ngậy, chan đều cốt cà phê phin đậm đà nguyên chất tạo hiệu ứng tầng màu đẹp mắt và hương vị thơm lừng.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Trứng Hà Nội Béo Bùi',
    description: 'Lòng đỏ trứng gà tươi được đánh bông mịn quánh cùng mật ong và sữa đặc tạo thành lớp kem trứng vàng ươm béo bùi, rưới lên tách cà phê phin nóng hổi nồng nàn.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Flat White Chuẩn Úc',
    description: 'Gấp đôi hàm lượng Espresso (Ristretto) kết hợp với lượng sữa đánh mịn mỏng (microfoam), cho vị cà phê đậm nét nồng nàn hơn so với Latte truyền thống.',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Mocha Sô-cô-la Đắng Ngọt',
    description: 'Sự hòa quyện hoàn hảo giữa shot Espresso đắng ngắt, sốt Sô-cô-la đen nguyên chất ngạt ngào và sữa tươi nóng béo mịn, rắc bột cacao thơm lừng trên mặt.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Affogato Kem Vanille Espresso',
    description: 'Trải nghiệm ẩm thực Ý tinh tế với 1 viên kem Vanille dẻo mịn béo ngậy được rưới ngập tràn shot Espresso nồng nàn nóng hổi ngay tại bàn.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },

  // ==========================================
  // 2. DANH MỤC: TRÀ & TRÁI CÂY (Tea) - 15 món
  // ==========================================
  {
    name: 'Trà Đào Cam Sả Tươi Mát',
    description: 'Nước cốt trà Oolong thơm ngát kết hợp cùng vị ngọt chua nhẹ của cam tươi, hương sả đập dập thơm lừng và những miếng đào miếng giòn sần sật mọng nước.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Vải Lài Kem Cheese',
    description: 'Cốt trà lài (lài ướp hoa tự nhiên) thanh mát dịu nhẹ, ăn cùng trái vải thiều mọng nước và lớp kem phô mai Macchiato mặn béo sánh mịn trên cùng.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Mãng Cầu Đắk Lắk Sợi Tươi',
    description: 'Thức uống Hot Trend kết hợp cốt trà xanh thơm ngát và thịt mãng cầu xiêm tươi rim đường chua chua ngọt ngọt dẻo dai, cực kỳ bắt vị và giải nhiệt hiệu quả.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Oolong Sen Vàng Hạt Sen',
    description: 'Vị trà Oolong đậm đà thanh tao đi kèm hạt sen Đồng Tháp rim mật bùi dẻo, củ năng giòn sần sật và lớp kem phô mai béo ngậy nịnh đẫm vị giác.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Matcha Latte Nhật Bản Uji',
    description: 'Bột Matcha thượng hạng nhập khẩu trực tiếp từ Uji (Kyoto), khuấy tan cùng sữa tươi thanh trùng cho sắc xanh ngọc tuyệt đẹp và vị chát nhẹ hậu ngọt béo ngậy.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Dâu Tằm Macchiato Dà Lạt',
    description: 'Mứt dâu tằm tươi Đà Lạt đậm đà kết hợp trà đen Assam thanh dịu và lớp kem sữa Macchiato trắng mịn béo mặn, màu sắc rực rỡ quyến rũ.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Hoa Cúc Mật Ong Hữu Cơ',
    description: 'Nụ hoa cúc sấy lạnh thơm thanh khiết ủ nóng cùng mật ong hoa nhãn nguyên chất. Món trà thảo mộc dịu nhẹ giúp thư giãn tinh thần và thanh lọc cơ thể.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Xanh Băng Tuyết Kem Béo',
    description: 'Trà xanh Thái Nguyên hảo hạng kết hợp đá xay cùng sữa chua dịu nhẹ, rưới sốt bơ thực vật và phủ lớp kem whipping mát rượi.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Tắc Mật Ong Hạt Chia',
    description: 'Nước cốt tắc tươi thơm lừng vị tinh dầu kết hợp mật ong rừng thanh ngọt và hạt chia ngâm nở giàu dinh dưỡng, giải khát tức thì ngày nắng nóng.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Ổi Hồng Hạt Lựu Nhiệt Đới',
    description: 'Nước ép ổi hồng chín cây thơm phức kết hợp cốt trà lài dịu nhẹ và trân châu trắng giòn giòn, sắc hồng ngọt ngào xinh xắn.',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Dưa Lưới Kem Muối Biển',
    description: 'Nước ép dưa lưới ngọt mát đậm vị trái cây nhiệt đới hòa cùng cốt trà Oolong nhẹ nhàng, lớp kem muối biển mặn nhẹ cân bằng vị ngọt mượt mà.',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Chanh Giã Tay Quảng Đông',
    description: 'Chanh nước thơm Quảng Đông được đập dập nguyên vỏ giã tay tỏa ra hương tinh dầu ngạt ngào, lắc đều với trà xanh Assam sảng khoái kích thích vị giác.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Earl Grey Kem Muối Anh Quốc',
    description: 'Trà Bá Tước Earl Grey ướp hương tinh dầu cam Bergamot cổ điển, phủ lớp kem sữa phô mai mặn béo ngậy quánh mịn trên cùng.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Hoa Đậu Biếc Lemonade',
    description: 'Trà hoa đậu biếc tự nhiên tạo màu xanh biếc kỳ diệu chuyển sang sắc tím mộng mơ khi hòa cùng nước cốt chanh tươi mát lạnh thanh nhiệt.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Hojicha Latte Trà Rang Nhật',
    description: 'Bột trà xanh Uji rang chín tỏa hương thơm khói bùi độc đáo, hòa cùng sữa tươi nóng dẻo mịn tạo nên hương vị êm dịu sưởi ấm tâm hồn.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },

  // ==========================================
  // 3. DANH MỤC: BÁNH NGỌT & PASTRY - 15 món
  // ==========================================
  {
    name: 'Croissant Bơ Pháp Giòn Rụm',
    description: 'Bánh sừng bò nướng nóng hổi chuẩn công thức nước Pháp với hàng trăm lớp bột xếp chồng giòn rụm bên ngoài, ruột bên trong mềm xốp thơm ngậy vị bơ Elle & Vire.',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Tiramisu Truyền Thống Ý',
    description: 'Bánh Tiramisu mềm tan với từng lớp bánh Ladyfinger thấm đẫm cà phê Espresso & rượu Kahlua, xen kẽ lớp kem Mascarpone béo ngậy rắc bột cacao nguyên chất.',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'New York Cheesecake Việt Quất',
    description: 'Bánh phô mai nướng phong cách New York đậm đặc béo ngậy tan chảy trên đầu lưỡi, phủ mứt việt quất tươi chua thanh cân bằng vị giác hoàn hảo.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Croffle Sốt Caramel Muối',
    description: 'Sự kết hợp giữa Croissant bơ nướng bằng máy Waffle tạo lớp vỏ giòn rụm thơm lừng, rưới sốt Caramel muối béo ngậy và rắc hạnh nhân lát nướng giòn.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Bánh Mì Tỏi Bơ Phô Mai Hàn Quốc',
    description: 'Bánh mì tròn nướng giòn vỏ, nhân kem phô mai Cream Cheese béo ngậy tràn ngập inside và ngấm đẫm sốt bơ tỏi thơm nức mũi ngọt nhẹ.',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Egg Tart Hong Kong Nóng Hổi',
    description: 'Bánh tạc trứng với lớp vỏ ngàn lớp giòn tan rôm rốp, nhân kem trứng nướng cháy xém béo bùi ngọt dịu nóng hổi vừa xuất lò.',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Red Velvet Cake Kem Cheese',
    description: 'Bánh nhung đỏ rực rỡ với cốt bánh chiffon dẻo mềm mịn thoảng hương cacao, xen kẽ các tầng kem phô mai mặn béo ngậy ngào ngạt.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Choco Lava Cake Tan Chảy',
    description: 'Bánh sô-cô-la nướng ấm nóng với phần vỏ ngoài xốp mịn và phần nhân Sô-cô-la đắng chảy sóng sánh béo ngậy khi xắn thìa thưởng thức.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Macaron Pháp Thập Cẩm (Set 4 cái)',
    description: 'Set 4 chiếc bánh Macaron Pháp sắc màu xinh xắn với vỏ bánh từ bột hạnh nhân giòn xốp mỏng tang, nhân ganache Matcha, Dâu, Caramel & Chocolate béo ngậy.',
    price: 59000,
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Bánh Su Kem Choux Vanille (Set 3 cái)',
    description: 'Bánh su kem vỏ giòn phủ đường giòn tan, nhân bên trong ngập tràn kem tươi Vanille béo ngậy mát lạnh tan chảy trong miệng.',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Donut Glazed Sô-cô-la Hạnh Nhân',
    description: 'Bánh Donut chiên vàng ươm mềm xốp, phủ lớp sô-cô-la đắng ngọt ngào và rắc hạt hạnh nhân giã dập nướng giòn rụm thơm phức.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Matcha Opera Cake Layer',
    description: 'Bánh Opera biến tấu với cốt bánh Matcha thấm xirô trà xanh, xen kẽ kem bơ Matcha nhẹ nhàng và lớp phủ sô-cô-la trắng thanh lịch.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Strawberry Shortcake Nhật Bản',
    description: 'Cốt bánh bông lan dẻo mềm như mây, xếp nhiều tầng kem tươi Whipping nhẹ béo và những lát dâu tây tươi Đà Lạt đỏ mọng ngọt chua tự nhiên.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Mousse Mango Chanh Dây',
    description: 'Bánh Mousse mịn màng kết hợp vị chua ngọt thanh mát từ xoài chín cây và chanh dây tươi, đế bánh bánh quy giòn bùi nhẹ nhàng.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Bánh Bông Lan Trứng Muối Chà Bông',
    description: 'Ổ bánh bông lan nhỏ mềm mịn, nhân sốt phô mai bơ ngậy, phủ đầy chà bông gà cay ướp đậm đà và lòng đỏ trứng muối bùi bùi béo ngậy.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },

  // ==========================================
  // 4. DANH MỤC: ĐÁ XAY & ĂN VẶT - 15 món
  // ==========================================
  {
    name: 'Cookie & Cream Ice Blended',
    description: 'Bánh quy Bánh Oreo giòn thơm được xay nhuyễn cùng sữa tươi, sữa đặc và đá lạnh, xịt ngập ngụa kem tươi Whipping và vụn bánh Oreo rắc trên đỉnh.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Matcha Ice Blended Đậu Đỏ',
    description: 'Matcha Uji Nhật Bản xay đá tuyết béo mịn, ăn kèm topping đậu đỏ Azuki ninh mềm bùi ngọt ngào và kem bông Whipping béo ngậy.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Chocolate Coconut Ice Blended',
    description: 'Sô-cô-la nguyên chất đắng ngọt đá xay mịn mượt với nước cốt dừa tươi Bến Tre, phủ sô-cô-la chip nướng giòn trên mặt kem béo.',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Sinh Tố Bơ Dừa Sáp Đắk Lắk',
    description: 'Thịt bơ sáp Đắk Lắk dẻo quánh béo ngậy xay mịn cùng sữa tươi và dừa sợi phơi khô giòn bùi, thức uống bổ dưỡng giàu năng lượng.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Sinh Tố Xoài Chanh Dây Nhiệt Đới',
    description: 'Xoài Cát Hòa Lộc chín vàng ngọt lịm kết hợp chanh dây tươi chua thanh đá xay mịn mượt, rạng rỡ màu nắng sảng khoái.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bcc4?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Hạt Hạnh Nhân Rang Bơ Tỏi (Hũ 150g)',
    description: 'Hạt hạnh nhân Mỹ nhập khẩu nướng nguyên vỏ giòn rụm, lắc sốt bơ lạt và tỏi phi thơm lừng vị mặn ngọt bùi béo ăn vặt cực bắt miệng.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Granola Yến Mạch Trái Cây Sấy',
    description: 'Bát Granola giòn rụm gồm yến mạch nướng mật ong, hạt óc chó, hạnh nhân, hạt điều và dâu tây sấy thăng hoa, rưới sữa chua không đường healthy.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Hạt Macca Úc Nướng Nút Nẻ',
    description: 'Hạt Macca nướng nứt vỏ tự nhiên, nhân hạt tròn căng màu trắng kem giòn bùi béo ngậy như bơ nguyên chất tươi ngon.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Khô Bò Sợi Lá Chanh Đắk Lắk',
    description: 'Thịt bò thăn nguyên miếng sấy khô xé sợi dẻo dai, ướp ngũ vị hương, ớt ớt cay nồng và lá chanh tươi thái chỉ thơm phức nhâm nhi cùng trà.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Khoai Tây Múi Cau Lắc Phô Mai',
    description: 'Khoai tây bổ múi cau phong cách Bỉ chiên vàng giòn rụm vỏ bên ngoài, bên trong xốp mềm bùi ngậy, lắc bột phô mai Cheddar mặn ngọt thơm lừng.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Bánh Biscotti Hạt Dinh Dưỡng Nguyên Cám',
    description: 'Bánh Biscotti nướng 2 lần chuẩn phong cách Ý từ bột nguyên cám, tràn ngập hạt hạnh nhân, hạt bí và việt quất sấy, giòn tan kiềm dầu ít calo.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Cơm Cháy Chà Bông Sốt Mắm Tỏi',
    description: 'Miếng cơm cháy nếp giòn tan rụm vàng ươm, quết mắm tỏi ớt kẹo quánh cay nhẹ và phủ lớp chà bông gà dai bùi thơm phức.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Pudding Trà Xanh Trân Châu Đen',
    description: 'Chén Pudding Matcha Uji mềm mịn núng nính tan chảy trong khoang miệng, ăn cùng trân châu đường đen dẻo dai ngọt thanh.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Gelato Dừa Nướng Bến Tre',
    description: 'Ý Gelato dừa tươi béo ngậy được chế biến thủ công, rắc dừa sấy nướng vàng giòn thơm lừng mát lạnh sảng khoái.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Kem Affogato Sô-cô-la Bỉ',
    description: '1 viên kem Sô-cô-la đắng nguyên chất Bỉ mềm mịn được rưới shot Espresso nóng nồng nàn thơm nức, trải nghiệm đắng ngọt tinh tế.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  }
];

const tables = [
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58701'), tableName: 'Bàn số 1', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58701' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58702'), tableName: 'Bàn số 2', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58702' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58703'), tableName: 'Bàn số 3', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58703' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58704'), tableName: 'Bàn số 4', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58704' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58705'), tableName: 'Bàn số 5', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58705' },
];

// 4. Connect and Seed
async function run() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB thành công.');

    // Clear existing data
    console.log('🧹 Đang làm sạch dữ liệu cũ...');
    await Food.deleteMany({});
    await Table.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Đã dọn dẹp xong.');

    // Insert new data
    console.log('🌱 Đang nạp dữ liệu menu Kohi Coffee (Cà phê, Trà, Bánh & Đá xay)...');
    const insertedFoods = await Food.insertMany(foods);
    console.log(`✅ Đã nạp thành công ${insertedFoods.length} thức uống & bánh.`);

    console.log('🌱 Đang nạp dữ liệu bàn...');
    const insertedTables = await Table.insertMany(tables);
    console.log(`✅ Đã nạp thành công ${insertedTables.length} bàn.`);

    console.log('🌱 Đang nạp dữ liệu người dùng (Admin & Staff)...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const users = [
      {
        name: 'Quản trị viên Kohi Coffee',
        email: 'admin@kohicoffee.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'Nhân viên Barista',
        email: 'staff@kohicoffee.com',
        password: staffPassword,
        role: 'staff',
      },
    ];
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Đã nạp thành công ${insertedUsers.length} tài khoản.`);

    console.log('\n🌟 DANH SÁCH BÀN CÀ PHÊ KOHI COFFEE:');
    insertedTables.forEach((tab) => {
      console.log(`- ${tab.tableName} | ID: ${tab._id} | Link: http://localhost:3000/table/${tab._id}`);
    });

    console.log('\n👤 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM KOHI COFFEE:');
    console.log('- Admin: admin@kohicoffee.com / admin123');
    console.log('- Staff: staff@kohicoffee.com / staff123');

    console.log('\n🎉 Quá trình seed dữ liệu Kohi Coffee hoàn tất thành công!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối với MongoDB.');
  }
}

run();
