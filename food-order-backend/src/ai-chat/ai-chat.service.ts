import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Kohi Coffee & Pastry - quán cà phê chuyên về specialty coffee và bánh ngọt thủ công.

Thông tin quán:
- Tên: Kohi Coffee & Pastry
- Nổi tiếng: Cà phê Specialty, Matcha Espresso Nhật Bản, Cà phê Dừa, Trà trái cây tươi, Croissant bơ tỏi, Cheesecake.
- Giờ mở cửa: 7:00 - 22:00 (Hàng ngày)
- Wifi: Miễn phí (vui lòng hỏi nhân viên phục vụ tại bàn)
- Thanh toán: Tiền mặt, MoMo QR
- Không gian: Thích hợp học tập, làm việc và hẹn hò.

Yêu cầu trả lời:
- Luôn thân thiện, niềm nở và xưng "Dạ", trả lời ngắn gọn 2-3 câu.
- Giúp khách hàng chọn món ngon từ thực đơn.
- Hỗ trợ cả tiếng Việt và tiếng Anh.`;

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
