const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

const bcrypt = require('bcrypt');

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

// 3. Realistic Seed Data
const foods = [
  // ==========================================
  // 1. DANH MỤC: MÓN NƯỚC (20 món)
  // ==========================================
  {
    name: 'Phở Bò Tái Lăn Phố Cổ',
    description: 'Món phở truyền thống danh tiếng with bánh phở mềm dẻo, nước dùng thanh ngọt tự nhiên được ninh liên tục từ xương ống bò trong 24 giờ. Phần thịt bò thăn được thái mỏng, chần tái và xào lăn nhanh trên lửa lớn cùng hành, tỏi lý sơn, mang lại hương vị béo ngậy, thơm nức mũi chuẩn vị Hà Thành.',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Bò Huế Cố Đô Đặc Biệt',
    description: 'Sợi bún to mềm đặc trưng hòa quyện cùng nước dùng đậm đà chuẩn vị Huế cổ kính, dậy mùi thơm nồng đặc trưng của mắm ruốc thượng hạng và sả cây đập dập. Tô đặc biệt siêu đầy đặn bao gồm nạm bò mềm, chả cua Huế béo bùi, giò heo hầm nhừ cốt tủy, huyết mềm và rau sống tươi ngon đi kèm.',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Hủ Tiếu Nam Vang Khô Sốt Hắc Xì Dầu',
    description: 'Sợi hủ tiếu dai ngon trứ danh được trụng nóng hổi, trộn đều cùng nước sốt hắc xì dầu đậm đà theo công thức độc quyền. Ăn kèm với tôm sú tươi bóc vỏ, thịt băm, gan heo, trứng cút lòng đào, tỏi phi vàng ruộm thơm lừng và một chén nước súp hầm xương mực ngọt thanh, đậm đà.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Mì Ramen Xá Xíu Nhật Bản',
    description: 'Sợi mì tươi nguyên bản chiết xuất từ lúa mì thượng hạng dai giòn, kết hợp hoàn hảo cùng nước súp Tonkotsu hầm từ xương heo béo ngậy đậm đà trong nhiều giờ liền. Món ăn được trang trí đẹp mắt với hai lát thịt heo xá xíu dày dặn mềm tan, trứng ngâm tương Ajitama lòng đào dẻo bùi, măng tây và rong biển khô thơm giòn.',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Riêu Cua Bắp Bò Trùng Trục',
    description: 'Tô bún riêu đậm đà hương vị đồng quê với phần riêu cua nguyên chất béo bùi, nổi váng óng ánh béo ngậy. Nước dùng chua thanh nhẹ nhàng nhờ cà chua chín cây và giấm bỗng nếp thơm nồng. Ăn kèm thịt bắp bò hoa giòn sần sật, đậu hũ chiên phồng thấm đẫm nước súp, chả lụa và rau muống chẻ tơi.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Phở Gà Ta Lá Chanh Rắc Tỏi',
    description: 'Sự thanh tao đến từ nước dùng phở gà trong vắt, ngọt lịm từ xương gà hầm cùng sá sùng và hành gừng nướng thơm. Thịt gà ta thả vườn dai da, ngọt thịt được xé phay vừa ăn, xếp đều trên lớp bánh phở mềm mượt, rắc thêm lá chanh xắt chỉ sợi chỉ mảnh và chút hành hoa xanh mướt.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1634068413119-3e0e4313c96c?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bánh Canh Cua Tôm Tích Huế',
    description: 'Sợi bánh canh bột lọc trong suốt, dai mềm đặc trưng ngập trong phần nước súp sền sệt, óng ánh sắc cam của gạch cua và dầu điều. Tô bánh canh đầy đặn ngập tràn thịt cua biển tươi rói, tôm tích ngọt lịm, chả cua quết tay dẻo quánh, huyết heo và trứng cút, rắc tiêu sọ Phú Quốc cay nồng.',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Mọc Sườn Non Măng Khô',
    description: 'Thức quà sáng thanh nhã với nước dùng hầm xương ống trong vắt, ngọt thanh. Những viên mọc heo giòn sần sật được quết kỹ cùng mộc nhĩ, nấm hương thơm lừng, ăn kèm dải sườn non hầm nhừ mềm sụn, măng khô Tây Bắc xé nhỏ dai giòn gấm vóc và hành phi vàng ruộm.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Mì Hoành Thánh Tôm Tươi Xá Xíu',
    description: 'Từng viên hoành thánh được gói khéo léo với lớp vỏ bột mỏng bọc bên trong nhân tôm thịt tươi ngon, cắn vào mọng nước bùi béo. Sợi mì trứng tươi vàng óng, dai ngon ăn cùng thịt xá xíu thái mỏng xém cạnh, hẹ lá xanh và nước súp sườn heo hầm tôm khô thanh mát chuẩn vị Hoa.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Thang Hà Nội Tinh Tế',
    description: 'Món ăn đại diện cho sự cầu kỳ, thanh lịch của ẩm thực Hà Thành. Nước dùng ninh từ xương gà và tôm khô trong vắt ngọt sâu. Các nguyên liệu ăn kèm được thái sợi chỉ nhỏ li ti bao gồm: lườn gà xé nhỏ, giò lụa, trứng tráng mỏng tang, củ cải khô dầm dẻo dai và một chút mắm tôm nồng nàn.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bánh Canh Cá Lóc Miền Tây',
    description: 'Sợi bánh canh bột gạo xắt tay bản to dày dặn, hòa quyện trong nước dùng sệt nhẹ ngọt lịm từ xương cá hầm. Từng lát thịt cá lóc đồng được phi lê khéo léo, rim đậm đà cùng hành tỏi, tiêu đen, không hề tanh mà săn chắc bùi béo, rắc thêm thật nhiều hành lá và rau đắng đất.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1618411640018-97108990cf2b?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Miến Lươn Xứ Nghệ Tươi Giòn',
    description: 'Đặc sản miền Trung với sợi miến dong hảo hạng dai mềm, ngập trong nước dùng xương lươn ninh kỹ ngọt lịm và có màu nâu sẫm tự nhiên. Khách hàng có thể cảm nhận vị lươn đồng xào nghệ vàng óng mượt mà kết hợp lươn chiên giòn tan rôm rốp, điểm xuyết rau răm và hành tăm phi thơm.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1614963326505-843867e2d330?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Sứa Nha Trang Đại Dương',
    description: 'Mang trọn hương vị gió biển miền Trung với những miếng sứa trắng phau, giòn sần sật mọng nước ngon miệng. Nước dùng thanh ngọt tuyệt đối nhờ ninh từ cá dầm và xương ống cá cờ, ăn kèm chả cá hấp, chả cá chiên dai ngon nguyên chất và một đĩa rau sống thái mỏng sợi chỉ cực thanh mát.',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Chả Cá Quy Nhơn Đậm Đà',
    description: 'Hương vị đậm đà khó quên với nước dùng thanh chua nhẹ từ cà chua và thơm chín ngọt. Tô bún đầy đặn tụ hội đầy đủ các loại chả cá thu quết tay nguyên chất chiên vàng ruộm, chả cá hấp dẻo dai ngọt thịt, viên cá viên và da heo sần sật, ăn cùng muối ớt xanh cay tê đầu lưỡi.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Phở Bò Sốt Vang Đậm Đà',
    description: 'Sự giao thoa ẩm thực tuyệt vời với bánh phở mềm mịn, ngập trong nước dùng sốt vang sánh đặc màu đỏ nâu quyến rũ, thơm nồng nàn hương hoa hồi, quế chi và thảo quả. Những miếng thịt nạm bò gân giòn được hầm nhừ cùng rượu vang chát, mềm tan chảy béo ngậy ngay trong khoang miệng.',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Mì Vịt Tiềm Thảo Mộc Thượng Hạng',
    description: 'Món ăn đại bổ với chiếc đùi vịt siêu to khổng lồ được tẩm ướp gia vị, chiên sơ rồi tiềm nhừ trong nước cốt thảo mộc gồm đinh hương, thục địa, cam thảo. Sợi mì tươi dai giòn ăn cùng cải thìa xanh mướt, nấm đông cô ngọt lịm, nước súp ngọt đậm đà có hậu vị thanh tao.',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1511910849309-0d5bc9c63e43?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Súp Bào Ngư Vi Cá Đại Dương',
    description: 'Món súp hoàng gia cao cấp với nước cốt hầm từ gà già và hải sâm sánh đặc, ngọt ngào bổ dưỡng. Thành phần thượng hạng bao gồm 1 con bào ngư Hàn Quốc size lớn dai giòn ngọt thịt, vi cá thượng hạng mọng nước, nấm linh chi trắng bùi béo và trứng cút lòng đào dẻo thơm.',
    price: 189000,
    image: 'https://images.unsplash.com/photo-1547928576-a4a33237ce35?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Hủ Tiếu Mỹ Tho Đậm Vị Nam Bộ',
    description: 'Sợi hủ tiếu Mỹ Tho làm từ gạo thơm phơi nắng dẻo dai đặc trưng không lẫn vào đâu được. Nước dùng hầm sườn heo, tôm khô và mực nướng thơm nức mũi, ngọt đậm đà. Tô hủ tiếu ngập tràn sườn non chặt khúc, tôm sú bóc vỏ, thịt băm và tỏi phi vàng ươm thơm lừng cả một góc bàn.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Ốc Nguội Tây Hồ Cổ Kính',
    description: 'Thức quà thanh nhã độc đáo của người Hà Nội xưa. Nước chấm dấm bỗng nếp chua thanh mát lạnh, thơm nhẹ dịu, đựng trong những chiếc chum đất nhỏ mộc mạc. Ăn cùng đĩa bún lá sợi nhỏ xếp nếp và những con ốc nhồi béo múp, giòn sần sật được luộc chín tới mọng nước sạch sẽ.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },
  {
    name: 'Bún Cá Cay Hải Phòng Đậm Vị',
    description: 'Đặc sản đất Cảng với nước dùng hầm xương cá thanh ngọt, chua nhẹ vị me và cay nồng vị ớt tươi. Tô bún rực rỡ sắc màu với cá đồng chiên giòn tan rụm, chả cá thu quết tay dai ngon, lòng cá ba sa xào nghệ giòn sần sật và dọc mùng (bạc hà) tước vỏ xanh mướt xốp mềm.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    category: 'Món nước',
    isAvailable: true,
  },

  // ==========================================
  // 2. DANH MỤC: MÓN CHÍNH (20 món)
  // ==========================================
  {
    name: 'Bún Chả Hà Nội Nướng Than Hoa',
    description: 'Thịt ba chỉ thái mỏng và chả viên băm nhuyễn được tẩm ướp gia vị gia truyền nhiều giờ, nướng cháy cạnh xèo xèo trên bếp than hoa rực hồng tạo nên mùi thơm quyến rũ khó cưỡng. Ăn kèm bún sợi nhỏ, đu đủ xanh giòn sần sật, đồ chua ngọt và chén nước mắm ấm nóng thanh dịu.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1617421731671-5caee6c43422?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Tấm Sườn Bì Chả Sài Gòn',
    description: 'Cơm tấm dẻo thơm hạt ngọc được làm từ gạo tấm loại một, kết hợp cùng miếng sườn cốt lết dày dặn nướng mật ong vàng óng, thấm vị đậm đà bên ngoài nhưng vẫn giữ độ mọng nước bên trong. Đi kèm là bì thính thơm lừng, chả trứng đúc béo ngậy và nước mắm kẹo ớt tỏi cay ngọt kích thích.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1616666179724-4f0ec3df43a9?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Gà Xối Mỡ Da Giòn Rúm',
    description: 'Hạt cơm chiên đảo đều cùng nước luộc gà và nghệ tươi cho màu vàng ươm bắt mắt, hạt tơi xốp không bị khô dầu. Đùi gà góc tư siêu to được xối mỡ liên tục, giúp phần da bên ngoài giòn rụm như bánh quy nhưng thịt bên trong vẫn giữ nguyên độ mềm ngọt tự nhiên, chấm sốt tương tỏi ớt.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Mì Quảng Gà Ta Thả Vườn',
    description: 'Sợi mì Quảng bản to mềm mịn ngập trong nước nhân đậm đà kho từ thịt gà ta thả vườn săn chắc, ngọt thịt, thơm nức hương củ nén và dầu phộng nguyên chất. Món ăn hoàn hảo hơn khi bẻ thêm bánh tráng nướng giòn rụm, rắc đậu phộng rang giã nhỏ, rau bắp chuối bào và vài lát ớt xanh cay tê.',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Bò Né Hoa Đá Thượng Hạng',
    description: 'Thịt bò Mỹ phi lê mềm mọng được cắt lát vừa ăn, xèo xèo trên chảo gang nóng hổi cùng một viên bơ thơm, trứng ốp la lòng đào chảy, pate gan béo ngậy và phô mai kéo sợi. Món ăn được phục vụ kèm bánh mì đặc ruột nướng nóng giòn và một đĩa salad dầu giấm rau củ thanh mát cân bằng vị giác.',
    price: 79000,
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Rang Dưa Bò Lửa Lớn',
    description: 'Hạt cơm nguội được đánh tơi, chiên trên lửa lớn lách tách cùng trứng gà lòng đỏ tạo độ săn chắc, vàng giòn rùm rụm ngoài rìa. Phần dưa cải muối chua giòn xào cùng thịt bò thăn mềm mọng ngọt ngào xém cạnh tỏi phi thơm, tạo nên bộ đôi kết hợp hoàn hảo ăn hoài không ngấy.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1603133872878-685f5082c64a?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Bún Thịt Nướng Chả Giò Sài Gòn',
    description: 'Tô bún khô mát mẻ với thịt nướng mật ong sả ớt thơm phưng phức, chả giò tôm thịt chiên giòn rụm xắt đôi. Bên dưới phủ kín rau sống thái nhỏ, giá đỗ, dưa leo. Trên cùng rắc mỡ hành xanh mướt, đậu phộng giã dập và chan nước mắm chua ngọt pha tỏi ớt băm nhuyễn cực bắt vị.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Thịt Kho Tàu Trứng Cút Mẹ Nấu',
    description: 'Món ăn mang đậm hương vị gia đình với những miếng thịt ba chỉ dọi heo dày dặn, ninh nhừ trong nước dừa tươi thanh ngọt cho đến khi mỡ chuyển màu trong suốt, tan chảy. Ăn kèm trứng cút thấm đẫm gia vị mặn ngọt, đĩa dưa giá muối chua ngọt chống ngấy cực tốt trên nền cơm trắng dẻo.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Bò Lúc Lắc Sốt Tiêu Đen',
    description: 'Thịt thăn bò tươi cắt khối vuông vuông "lúc lắc" vừa vặn, xào nhanh tay trên lửa cực lớn cùng ớt chuông ba màu (xanh, đỏ, vàng), hành tây ngọt dịu. Nước sốt dầu hào tiêu đen bao bọc quanh miếng thịt mềm mọng mượt mà. Đi kèm cơm chiên tỏi thơm phức và khoai tây chiên giòn.',
    price: 69000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Gà Hải Nam Thượng Hải',
    description: 'Món ăn tinh tế trứ danh với phần hạt cơm được nấu bằng nước dùng luộc gà, mỡ gà và gừng tỏi phi, cho từng hạt cơm béo ngậy thơm nồng dẻo thơm. Thịt gà hấp kiểu Hải Nam da vàng mọng nước, thịt trắng ngọt lịm tan chảy, chấm cùng bộ ba nước sốt: sốt gừng băm, sốt ớt cay và hắc xì dầu ngọt.',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Sườn Heo Xào Chua Ngọt Cực Phẩm',
    description: 'Từng dẻ sườn non heo chặt nhỏ vừa ăn, chiên vàng đều xém cạnh bùi béo. Sườn được rim ngập trong nước sốt cà chua, giấm táo nguyên chất và dứa băm tạo nên vị chua thanh ngọt đậm đà sánh kẹo quyến rũ. Phục vụ trên dĩa cơm trắng nóng hổi rắc hành hoa.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Mì Ý Sốt Bò Bằm Bolognaise',
    description: 'Sợi mì Spaghetti nhập khẩu từ Ý được luộc chín tới giữ độ dai dẻo hoàn hảo (Al Dente). Rưới phủ lên trên là phần nước sốt đỏ rực làm từ thịt bò Úc xay nhuyễn bùi béo, cà chua cô đặc, hành tây và cỏ thơm Ý, rắc thêm một lớp phô mai Parmesan bột thơm ngậy kéo sợi mịn màng.',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Rang Hải Săn Hoàng Kim',
    description: 'Đĩa cơm rang rực rỡ sắc vàng óng từ lòng đỏ trứng muối giã nhuyễn bao bọc quanh từng hạt cơm săn chắc, giòn rụm ngoài rìa. Nhân cơm ngập tràn tôm sú cắt lựu ngọt lịm, mực ống giòn sần sật, chả lụa, đậu bắp xanh và ngô ngọt Mỹ bùi béo ngọt ngào hấp dẫn.',
    price: 59000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Gà Nướng Sốt Tiêu Xanh Tây Nguyên',
    description: 'Nửa con gà ta thả vườn được tẩm ướp gia vị núi rừng Tây Nguyên, nướng lu đất vàng ruộm óng ả, phần da giòn sần sật bùi béo nhưng thớ thịt bên trong mọng nước ngọt ngào. Chan nước sốt tiêu xanh Phú Quốc cay tê dịu nồng nàn, ăn kèm xôi trắng chiên phồng giòn tan cực ngon miệng.',
    price: 125000,
    image: 'https://images.unsplash.com/photo-1616147458533-31f0cf2da484?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Vịt Quay Bắc Kinh Đậm Vị',
    description: 'Thịt vịt quay hảo hạng với lớp da màu đỏ đồng bóng loáng, giòn tan rụm và béo ngậy ngào ngạt hương thảo mộc. Thịt vịt thái lát dày dặn xếp mượt mà lên đĩa cơm trắng dẻo thơm, chan nước tương đen ngọt kẹo độc quyền đi kèm dưa leo cắt lát mỏng và đồ chua ngọt.',
    price: 69000,
    image: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Bún Đậu Mắm Tôm Thập Cẩm',
    description: 'Mẹt bún đậu đầy đặn mang trọn hương vị thủ đô với bún lá cắt miếng, đậu hũ làng Mơ chiên ngập dầu giòn rìa ruột mềm mịn tan chảy, thịt chân giò luộc thảo mộc thái mỏng dẻo dai, nem chua rán giòn rụm và chả cốm dẻo quánh, chấm mắm tôm Thanh Hóa đánh bông chanh đường ớt.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Cá Hú Kho Tộ Đậm Đà',
    description: 'Khúc cá hú tươi béo ngậy được kho bằng niêu đất nung truyền thống. Nước kho cá kẹo quánh màu cánh gián óng ả nhờ đường thốt nốt, mặn ngọt cay tê đậm đà ngấm sâu vào lớp mỡ cá tan chảy. Ăn cùng cơm trắng dẻo thơm hạt ngọc và đĩa rau luộc thập cẩm thanh mát chấm sốt kho.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Mì Xào Giòn Hải Sản Đại Dương',
    description: 'Sợi mì trứng tươi được chiên phồng căng tròn như một tổ chim giòn tan rôm rốp quyến rũ. Rưới nước sốt sền sệt mặn ngọt nồng nàn ngập tràn tôm sú, mực ống bóc vỏ xẻ hoa, chả cá, bông cải xanh dẻo dai, nấm rơm bùi béo và cà rốt ngọt ngào giúp làm mềm mì khi thưởng thức.',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Đùi Gà Nướng Mật Ong Rừng',
    description: 'Chiếc đùi gà góc tư siêu to khổng lồ được tẩm ướp sốt mật ong rừng nguyên chất nướng cháy cạnh đỏ vàng ươm quyến rũ. Lớp da gà dai dẻo béo ngậy, thịt bên trong trắng ngần mọng nước ngọt thanh, ăn cùng cơm chiên tỏi hạt tơi xốp giòn rụm thơm lừng.',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },
  {
    name: 'Cơm Thịt Bò Xào Bông Cải Xanh',
    description: 'Thịt bò thăn Úc thái lát mỏng mượt mà được ướp dầu hào, xào nhanh tay trên lửa cực lớn giữ trọn độ mềm ngọt mọng nước. Kết hợp cùng những búp bông cải xanh tươi rói, giòn sần sật ngọt ngào thơm nức mũi hương tỏi phi vàng ruộm, ăn hoài không ngấy.',
    price: 50000,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
    category: 'Món chính',
    isAvailable: true,
  },

  // ==========================================
  // 3. DANH MỤC: ĂN NHẸ (20 món)
  // ==========================================
  {
    name: 'Bánh Mì Pate Bơ Đặc Beệt',
    description: 'Vỏ bánh mì được nướng nóng giòn rụm, ruột mềm mại. Nhân bánh ngập tràn lớp pate gan béo ngậy, bơ trứng gà lòng đỏ tươi tự làm, chả lụa truyền thống, thịt xá xíu đậm vị, dưa leo, đồ chua giòn ngọt và vài cọng ngò rí, chan chút nước sốt mặn ngọt cay nhẹ kích thích vị giác.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Nem Rán Hà Nội Vỏ Giòn (5 chiếc)',
    description: 'Món khai vị quốc hồn quốc túy với lớp vỏ bánh đa nem mỏng, chiên ngập dầu giòn rụm vàng ruộm đẹp mắt. Nhân nem là sự hòa quyện hoàn hảo của thịt heo băm, tôm đất tươi, miến dong, mộc nhĩ, nấm hương thơm lừng, hành tây và giá đỗ, chấm cùng nước mắm tỏi ớt chua ngọt pha chuẩn tỉ lệ.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Gỏi Cuốn Tôm Thịt Heo Thảo Mộc (4 chiếc)',
    description: 'Lựa chọn thanh mát tuyệt vời cho bữa ăn với tôm thẻ hấp đỏ mọng ngọt lịm, thịt ba chỉ luộc thảo mộc thái mỏng, bún tươi tơi xốp và các loại rau sống, hẹ lá được cuộn khéo léo, chặt tay trong lớp bánh tráng phơi sương dẻo dai. Thưởng thức cùng nước tương đen xào tương hột bùi béo.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Khoai Tây Múi Cau Lắc Phô Mai Cheddar',
    description: 'Những củ khoai tây tươi được bổ múi lớn phong cách phương Tây (Wedges), chiên qua hai lần lửa giúp bên ngoài giữ độ giòn tan, bên trong mềm xốp như kem. Sau đó khoai được lắc đều tay với lớp bột phô mai Cheddar thượng hạng nhập khẩu, mang đến hương vị mặn ngọt béo ngậy.',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Cá Viên Chiên Sốt Nước Mắm Tỏi Ớt',
    description: 'Từng viên cá thác lác dai ngon nguyên chất kết hợp bò viên, tôm viên được chiên căng phồng xốp bùi. Sau đó được đảo đều tay trên chảo nóng cùng phần nước sốt mắm tỏi kẹo quánh, kẹo kẹo bọc quanh viên chả. Phục vụ kèm tỏi phi giòn, hành tây và vài lá rau răm thơm nồng nàn.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Bánh Tráng Trộn Sài Gòn Đầy Đủ',
    description: 'Món ăn vặt đường phố huyền thoại được phối trộn cầu kỳ từ bánh tráng cắt sợi, lòng đỏ trứng cút luộc, khô bò đen xé cay tơi, khô mực xé sợi, xoài xanh băm sợi chua chua, đậu phộng rang bùi béo, hành phi. Tất cả thấm đẫm nước sốt bò và muối tôm Tây Ninh, kèm chút tắc chua thanh.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Nem Chua Rán Phố Tạ Hiện (6 chiếc)',
    description: 'Từng thanh nem chua bọc trong lớp bột chiên xù xù xì xì ngập dầu, khi chín tỏa ra mùi thơm ngào ngạt khó cưỡng. Vỏ ngoài giòn tan kêu rôm rốp trong miệng, nhân bên trong dai dẻo dính nhẹ, ngọt vị thịt heo và bì dẻo dai sần sật. Chấm cùng tương ớt cay nồng độc quyền siêu hợp.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Cánh Gà Chiên Nước Mắm Kẹo',
    description: '3 khúc cánh gà tươi lớn được chiên vàng giòn da rùm rụm, sau đó phủ đều một lớp nước sốt mắm nhĩ Phú Quốc chưng đường thốt nốt và tỏi ớt băm nhuyễn kẹo sánh. Vị mặn mặn ngọt ngọt cay tê thấm sâu vào từng thớ thịt bên trong mọng nước, kích thích vị giác tột cùng.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Bột Chiên Trứng Gấp Giòn Rìa',
    description: 'Những khối bột gạo được cắt vuông vức, chiên trên chảo phẳng gang lớn cho đến khi lớp vỏ ngoài chuyển màu vàng ruộm, giòn tan nứt vách nhưng ruột trong vẫn dẻo quánh. Đập thêm 2 quả trứng gà rải phủ lên, rắc hành lá thơm phức. Ăn kèm đồ chua đu đủ xanh và nước tương pha ngọt thanh.',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1534080391025-a760de2802d2?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Ngô Chiên Bơ Tỏi Vàng Óng',
    description: 'Từng hạt ngô ngọt Mỹ tách béo mọng, áo một lớp bột mỏng vừa vặn rồi chiên ngập dầu cho vàng giòn xốp. Sau đó ngô được xóc nhanh qua lớp bơ nhạt thơm ngậy và tỏi băm phi giòn. Món ăn vặt vui tai, giòn sần sật ngọt ngào xen lẫn vị mặn béo ngậy khó lòng dừng đũa.',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Khoai Lang Kén Nước Cốt Dừa',
    description: 'Những kén khoai lang vàng ruộm tròn trịa xinh xắn, làm từ khoai lang ruột vàng tán nhuyễn mịn, trộn đều cùng nước cốt dừa sánh béo và chút bột năng dẻo dai. Vỏ ngoài rắc vừng đen thơm lừng chiên giòn tan rôm rốp, ruột trong mềm ngọt lịm bùi béo kích thích vị giác vô cùng.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Bánh Xèo Miền Tây Siêu To Khổng Lồ',
    description: 'Chiếc bánh xèo giòn rụm vàng ươm sắc nghệ, viền bánh mỏng tang dẻo thơm nước cốt dừa. Nhân bánh ngập tràn tôm đất ngọt lịm, thịt ba chỉ thái mỏng, giá đỗ tơi xốp và đậu xanh hấp bùi béo. Cuộn bánh khéo léo trong lá cải bẹ xanh, rau rừng thái mỏng chấm mắm chua ngọt vị me.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Bánh Khọt Vũng Tàu Tôm Nhảy',
    description: '6 chiếc bánh khọt nhỏ nhắn được đổ khuôn gang xèo xèo vàng giòn rìa béo ngậy. Trên mặt mỗi chiếc bánh là một con tôm sú tươi rói đỏ mọng ngọt lịm, phủ mỡ hành xanh mướt mát mắt và chà bông tôm thơm lừng bùi béo, ăn kèm đồ chua đu đủ giòn sần sật dẻo dai.',
    price: 40000,
    image: 'https://images.unsplash.com/photo-1608756687911-d1b540c6d16b?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Chân Gà Sả Tắc Cay Tê Giòn Rụm',
    description: 'Chân Gà rút xương được luộc chín tới cùng gừng sả, ngâm đá lạnh tạo độ giòn sần sật sướng tai khi nhai. Sau đó được ngâm ngập trong nước sốt tắc (quất) chua thanh ngọt dịu, nồng nàn hương sả cây, lá chanh xắt mảnh và ớt hiểm cay tê tái kích thích vị giác tột cùng.',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Phô Mai Que Kéo Sợi Mozzarella (3 chiếc)',
    description: 'Thanh phô mai Mozzarella nhập khẩu từ Ý siêu dày dặn, áo lớp bột chiên xù xì vàng ruộm đẹp mắt. Khi cắn vào, lớp vỏ ngoài giòn tan kêu rôm rốp nhường chỗ cho lớp nhân phô mai béo ngậy ngào ngạt nóng hổi tan chảy, kéo sợi dài cả mét đầy vui nhộn quyến rũ.',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Súp Cua Tóc Tiên Trứng Bắc Thảo',
    description: 'Chén súp cua sánh đặc màu sắc bắt mắt, ngọt thanh sâu sắc từ nước hầm xương gà. Thành phần đầy đặn bao gồm thịt cua biển xé nhỏ xốp bùi, nấm đông cô thái sợi, trứng cút, bắp ngọt dẻo và rong tóc tiên đen mun mềm mại, điểm xuyết nửa quả trứng bắc thảo béo bùi quánh dẻo.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Bánh Tráng Nướng Đà Lạt Pizza Việt Nam',
    description: 'Đế bánh tráng phơi sương mỏng dẻo nướng trên bếp than hồng rực. Mặt bánh phủ đầy trứng cút đánh bông béo ngậy, bơ lạt thơm lừng, thịt băm ướp vị, chà bông heo bùi béo, xúc xích lát mỏng và hành lá xanh mướt, rưới sốt mayonnaise béo quánh tương ớt cay nồng giòn tan.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Há Cảo Hấp Tôm Thịt Mọng Nước (5 chiếc)',
    description: 'Từng viên há cảo chuẩn vị Quảng Đông với lớp vỏ bột tàn mì mỏng tang, trong suốt lộ rõ nhân tôm đỏ mọng nước hấp dẫn bên trong. Nhân tôm thịt quết kỹ dai ngon ngọt ngào, cắn vào mọng nước bùi béo thơm nức mùi dầu mè thượng hạng, chấm nước tương pha giấm đỏ.',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1496116211227-7d3ccb8f4543?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Gà Popcorn Sốt Cay Lắc Giòn',
    description: 'Những viên ức gà tươi được cắt khối vuông nhỏ nhắn vừa vặn, tẩm bột chiên xù giòn tan rụm rực rỡ sắc cam vàng óng. Gà được lắc đều trong nước sốt cay ngọt Hàn Quốc cay tê nồng nàn nịnh mũi, rắc thêm hạt vừng trắng rang bùi béo thơm phức vui miệng.',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },
  {
    name: 'Salad Ức Gà Áp Chảo Dầu Giấm Thanh Mát',
    description: 'Lựa chọn ăn nhẹ healthy tuyệt vời với những lát ức gà áp chảo thơm xém cạnh vàng ươm nhưng thịt bên trong vẫn giữ nguyên độ mọng nước ngọt ngào. Kết hợp cùng xà lách tươi xanh, cà chua bi mọng nước, dưa leo giòn sần sật rưới sốt dầu giấm balsamic chua thanh nhẹ dịu.',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
    category: 'Ăn nhẹ',
    isAvailable: true,
  },

  // ==========================================
  // 4. DANH MỤC: ĐỒ UỐNG (20 món)
  // ==========================================
  {
    name: 'Cà Phê Sữa Đá Phin Đậm Đặc',
    description: 'Sự kết hợp hoàn hảo từ những hạt cà phê Robusta và Arabica Đắk Lắk nguyên chất, được rang xay và pha phin chậm rãi để giữ trọn vẹn hương vị đắng thanh, đậm đà đặc trưng. Hòa quyện sánh mịn cùng sữa đặc hảo hạng và đá nhuyễn, mang lại sự tỉnh táo tức thì cho ngày làm việc.',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    category: 'Đồ uống',
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
    console.log('🌱 Đang nạp dữ liệu món ăn...');
    const insertedFoods = await Food.insertMany(foods);
    console.log(`✅ Đã nạp thành công ${insertedFoods.length} món ăn.`);

    console.log('🌱 Đang nạp dữ liệu bàn ăn...');
    const insertedTables = await Table.insertMany(tables);
    console.log(`✅ Đã nạp thành công ${insertedTables.length} bàn ăn.`);

    console.log('🌱 Đang nạp dữ liệu người dùng (Admin & Staff)...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const users = [
      {
        name: 'Quản trị viên',
        email: 'admin@restaurant.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'Nhân viên phục vụ',
        email: 'staff@restaurant.com',
        password: staffPassword,
        role: 'staff',
      },
    ];
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Đã nạp thành công ${insertedUsers.length} tài khoản.`);

    console.log('\n🌟 DANH SÁCH BÀN ĂN (Dùng để chạy thử nghiệm frontend):');
    insertedTables.forEach((tab) => {
      console.log(`- ${tab.tableName} | ID: ${tab._id} | Link: http://localhost:3000/table/${tab._id}`);
    });

    console.log('\n👤 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM:');
    console.log('- Admin: admin@restaurant.com / admin123');
    console.log('- Staff: staff@restaurant.com / staff123');

    console.log('\n🎉 Quá trình seed dữ liệu hoàn tất thành công!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối với MongoDB.');
  }
}

run();
