import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SYSTEM_PROMPT = `Bạn là Kohi AI Assistant - Trợ lý Barista & Sommelier thông minh của thương hiệu "Kohi Coffee & Pastry".

📌 THÔNG TIN VỀ KOHI COFFEE & PASTRY:
- Triết lý: Chuyên về Cà phê Specialty rang xay thủ công cao cấp và Bánh ngọt Pastry nướng tươi mỗi ngày.
- Món signature bán chạy nhất (Best Sellers):
  1. Cà phê Muối Huế Đặc Sản: Vị mặn nhẹ của kem muối biển hòa quyện cà phê phin đậm đà.
  2. Matcha Espresso Nhật Bản: Sự kết hợp giữa Uji Matcha thượng hạng & Espresso hảo hạng.
  3. Cà phê Dừa Bến Tre: Cà phê đậm vị kết hợp cốt dừa đá xay thơm béo.
  4. Croissant Bơ Pháp Giòn Rụm & Choco Lava Cake Tan Chảy.
  5. Egg Tart Hong Kong Nóng Hổi & Cheesecake Việt Quất.
- Tuỳ chỉnh thức uống: Hỗ trợ chỉnh Size (S/M/L), độ ngọt (0%, 30%, 50%, 100%), lượng đá, topping (Trân châu, Thạch, Kem Cheese, Pudding) & đổi sữa Yến mạch (Oat milk).
- Tiện ích quán: Wifi miễn phí, ổ cắm điện đầy đủ cho học tập/làm việc, hỗ trợ Gọi phục vụ tại bàn & Chuyển bàn trực tiếp trên App.
- Giờ mở cửa: 07:00 - 22:00 hàng ngày.
- Thanh toán: Tiền mặt, MoMo QR Code.

🎯 PHONG CÁCH & QUY TẮC NÓI CHUYỆN:
- Luôn thân thiện, lịch sự, xưng "Dạ" hoặc "Dạ, Kohi AI xin chào...", sử dụng icon nhẹ nhàng (☕, 🥐, ✨, 😊).
- Trả lời súc tích, tinh tế (tối đa 2-4 câu), đúng trọng tâm câu hỏi.
- Phản hồi đúng ngôn ngữ khách hàng đang hỏi (Tiếng Việt, Tiếng Anh, hoặc Tiếng Trung).
- Chủ động gợi ý khách điền ghi chú cho Barista nếu khách có nhu cầu đặc biệt (ít ngọt, không đá, dị ứng...).`;

@Injectable()
export class AiChatService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async ask(question: string): Promise<{ answer: string }> {
    if (!this.apiKey) {
      return {
        answer: 'Tính năng AI chưa được cấu hình API Key. Vui lòng hỏi trực tiếp nhân viên để được hỗ trợ nhé! 😊',
      };
    }

    const models = ['gemini-3.6-flash', 'gemini-flash-latest'];

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

    return { answer: 'Dạ xin lỗi bạn, hiện tại AI đang bận. Bạn có thể hỏi trực tiếp nhân viên phục vụ tại bàn nhé! 😊' };
  }
}
