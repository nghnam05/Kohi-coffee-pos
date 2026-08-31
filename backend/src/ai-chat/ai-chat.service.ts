import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SYSTEM_PROMPT = `Bạn là Kohi AI Assistant - Trợ lý Barista & Sommelier thông minh đại diện thương hiệu "Kohi Coffee & Pastry".

📌 BỘ DỮ LIỆU ĐÀO TẠO KHI TRẢ LỜI CÂU HỎI CƠ BẢN:

1. ⏰ GIỜ MỞ CỬA & THỜI GIAN HOẠT ĐỘNG:
- Quán mở cửa từ 07:00 sáng đến 22:00 tối tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và các ngày Lễ, Tết).

2. 📶 TIỆN ÍCH & KHÔNG GIAN QUÁN:
- Wifi: Quán có Wifi tốc độ cao miễn phí (Tên Wifi: "Kohi Coffee Guest", Mật khẩu: kohicoffee2026 hoặc kết nối trực tiếp không cần pass).
- Ổ cắm điện: Có trang bị đầy đủ tại hầu hết các bàn, rất thuận tiện cho học tập, họp nhóm và làm việc laptop.
- Bãi đỗ xe: Có chỗ giữ xe máy & đỗ xe ô tô rộng rãi hoàn toàn miễn phí, có bảo vệ trông giữ an toàn 24/7.
- Không gian: Có cả khu vực máy lạnh yên tĩnh & khu vực sân vườn thoáng mát ngoài trời.

3. ☕ THỰC ĐƠN & MÓN SIGNATURE (BEST SELLERS):
- Top thức uống bán chạy nhất:
  1. Cà phê Muối Huế Đặc Sản: Lớp kem muối biển béo ngậy hòa quyện cùng cà phê phin đậm đà.
  2. Matcha Espresso Nhật Bản: Sự kết hợp hoàn hảo giữa Uji Matcha thượng hạng & Espresso hảo hạng.
  3. Cà phê Dừa Bến Tre: Cà phê đậm đà kết hợp cốt dừa đá xay thơm béo.
  4. Trà Đào Cam Sả / Hồng Trà Vải: Dành cho khách không uống được cà phê.
- Top Bánh ngọt Pastry nướng tươi mỗi ngày:
  1. Croissant Bơ Pháp Giòn Rụm & Choco Lava Cake Tan Chảy.
  2. Egg Tart Hong Kong Nóng Hổi & Cheesecake Việt Quất / Tiramisu.
- Tùy chỉnh thức uống: Hỗ trợ chọn Size (S/M/L), độ ngọt (0%, 30%, 50%, 100%), lượng đá (Không đá/Ít đá), Topping (Trân châu, Thạch, Kem Cheese, Pudding) & đổi sang Sữa Yến Mạch (Oat Milk) cho người dị ứng sữa bò hoặc ăn chay.

4. 💳 THANH TOÁN & ĐẶT MÓN TẠI BÀN:
- Hỗ trợ các phương thức thanh toán: Tiền mặt, Chuyển khoản Ngân hàng (VietQR tự động xác nhận) & Ví MoMo.
- Dịch vụ tại bàn: Khách có thể xem Menu, Đặt món, Tách bill chia tiền nhóm, Bấm nút "Gọi nhân viên" hoặc "Chuyển bàn" trực tiếp ngay trên App tại bàn.

5. 🥐 ĐẶT MANG VỀ & DỊCH VỤ KHÁC:
- Quán có phục vụ mang về (Takeaway) và hỗ trợ Đặt bàn trước thông qua Website/App.

🎯 PHONG CÁCH & QUY TẮC PHẢN HỒI:
- Luôn thân thiện, lịch sự, xưng "Dạ" hoặc "Dạ, Kohi AI xin chào...", dùng icon nhẹ nhàng (☕, 🥐, ✨, 😊).
- Trả lời ngắn gọn, súc tích (tối đa 2-4 câu), đúng trọng tâm câu hỏi của khách.
- Phản hồi bằng đúng ngôn ngữ mà khách hàng đặt câu hỏi (Tiếng Việt, Tiếng Anh, hoặc Tiếng Trung).
- Nếu có yêu cầu đặc biệt về khẩu vị (ít ngọt, không đá, dị ứng...), hãy hướng dẫn khách điền vào ô Ghi chú khi chọn món.`;

@Injectable()
export class AiChatService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  private getSmartLocalAnswer(question: string): string {
    const q = (question || '').toLowerCase().trim();

    if (
      q.includes('wifi') ||
      q.includes('wi-fi') ||
      q.includes('wiffi') ||
      q.includes('mật khẩu') ||
      q.includes('mat khau') ||
      q.includes('pass') ||
      q.includes('password')
    ) {
      return 'Dạ, Kohi Coffee có Wifi tốc độ cao hoàn toàn miễn phí ạ! Tên Wifi: "Kohi Coffee Guest", Mật khẩu: kohicoffee2026 📶';
    }

    if (
      q.includes('giờ') ||
      q.includes('gio') ||
      q.includes('mở cửa') ||
      q.includes('mo cua') ||
      q.includes('đóng cửa') ||
      q.includes('dong cua') ||
      q.includes('mấy giờ') ||
      q.includes('may gio') ||
      q.includes('hoạt động') ||
      q.includes('hours')
    ) {
      return 'Dạ, Kohi Coffee mở cửa đón khách từ 07:00 sáng đến 22:00 tối tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và các ngày Lễ, Tết) ạ! ⏰✨';
    }

    if (
      q.includes('xe') ||
      q.includes('đỗ xe') ||
      q.includes('do xe') ||
      q.includes('đậu xe') ||
      q.includes('dau xe') ||
      q.includes('giữ xe') ||
      q.includes('giu xe') ||
      q.includes('bãi xe') ||
      q.includes('bai xe') ||
      q.includes('ô tô')
    ) {
      return 'Dạ, quán có bãi giữ xe máy và đỗ xe ô tô rộng rãi hoàn toàn miễn phí, có bảo vệ trông giữ an toàn 24/7 ạ! 🛵🚗';
    }

    if (
      q.includes('ổ cắm') ||
      q.includes('o cam') ||
      q.includes('điện') ||
      q.includes('dien') ||
      q.includes('sạc') ||
      q.includes('sac') ||
      q.includes('làm việc') ||
      q.includes('lam viec') ||
      q.includes('học') ||
      q.includes('laptop')
    ) {
      return 'Dạ, hầu hết các bàn tại Kohi đều có trang bị ổ cắm điện đầy đủ và không gian máy lạnh yên tĩnh, rất thích hợp để làm việc và học tập ạ! 💻🔌';
    }

    if (
      q.includes('ngon') ||
      q.includes('best seller') ||
      q.includes('bán chạy') ||
      q.includes('ban chay') ||
      q.includes('gợi ý') ||
      q.includes('goi y') ||
      q.includes('tư vấn') ||
      q.includes('tu van') ||
      q.includes('đặc sản') ||
      q.includes('món gì')
    ) {
      return 'Dạ, các món Signature bán chạy nhất tại Kohi bao gồm: Cà phê Muối Huế đặc sản (béo ngậy kem muối), Matcha Espresso Nhật Bản, Cà phê Dừa Bến Tre và Bánh Croissant bơ Pháp giòn rụm nướng tươi mỗi ngày ạ! ☕🥐';
    }

    if (
      q.includes('trà') ||
      q.includes('tra') ||
      q.includes('không cà phê') ||
      q.includes('khong ca phe') ||
      q.includes('trẻ em') ||
      q.includes('cacao') ||
      q.includes('nước ép')
    ) {
      return 'Dạ, nếu không dùng cà phê bạn có thể thử các món Trà Đào Cam Sả, Hồng Trà Vải, Cacao Nóng hoặc Nước ép cam tươi thanh mát rất thơm ngon ạ! 🍹✨';
    }

    if (
      q.includes('thanh toán') ||
      q.includes('thanh toan') ||
      q.includes('chuyển khoản') ||
      q.includes('chuyen khoan') ||
      q.includes('qr') ||
      q.includes('momo') ||
      q.includes('ví') ||
      q.includes('tiền mặt')
    ) {
      return 'Dạ, Kohi hỗ trợ các hình thức thanh toán gồm Tiền mặt, Chuyển khoản ngân hàng VietQR (tự động gạch nợ) và Ví điện tử MoMo ạ! 💳📱';
    }

    if (
      q.includes('tách bill') ||
      q.includes('tach bill') ||
      q.includes('chia tiền') ||
      q.includes('gọi nhân viên') ||
      q.includes('goi nhan vien') ||
      q.includes('chuyển bàn') ||
      q.includes('chuyen ban') ||
      q.includes('đổi bàn')
    ) {
      return 'Dạ, bạn có thể bấm trực tiếp các nút "Tách bill chia tiền", "Gọi nhân viên" hoặc "Chuyển bàn" ngay trên giao diện ứng dụng tại bàn nhé! 🔔✨';
    }

    return 'Dạ, Kohi AI xin chào! Bạn có thể xem danh sách món ăn trên màn hình, thêm món vào giỏ hàng hoặc nhờ nhân viên phục vụ hỗ trợ trực tiếp tại bàn nhé! 😊☕';
  }

  async ask(question: string): Promise<{ answer: string }> {
    // 1. Check if the question matches any specific store intent (Wifi, Hours, Parking, Best sellers, Payment, etc.)
    const localAnswer = this.getSmartLocalAnswer(question);
    const defaultGreeting = 'Dạ, Kohi AI xin chào! Bạn có thể xem danh sách món ăn trên màn hình, thêm món vào giỏ hàng hoặc nhờ nhân viên phục vụ hỗ trợ trực tiếp tại bàn nhé! 😊☕';

    // If it matched a specific intent, return the instant accurate store answer
    if (localAnswer !== defaultGreeting) {
      return { answer: localAnswer };
    }

    // 2. Otherwise, use Gemini AI for general dynamic conversation
    if (this.apiKey) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const promptText = `${SYSTEM_PROMPT}\n\nKhách hàng hỏi: "${question}"\nHãy trả lời khách hàng:`;

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
              generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
            }),
          });

          if (res.ok) {
            const data: any = await res.json();
            const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer) {
              return { answer: answer.trim() };
            }
          }
        } catch (err) {
          console.error(`Gemini model ${model} error:`, err);
        }
      }
    }

    // 3. Fallback greeting if no specific intent matched & Gemini API unreachable
    return { answer: localAnswer };
  }
}
