import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FoodsService } from '../foods/foods.service.js';

const SYSTEM_PROMPT = `Bạn là Kohi AI Assistant - Trợ lý tư vấn ẩm thực thông minh cho thương hiệu "Kohi Coffee & Pastry".

📌 QUY TẮC BẮT BUỘC KHI PHẢN HỒI:
1. TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ BIỂU TƯỢNG CẢM XÚC (EMOJI / ICON) NÀO TRONG PHẢN HỒI.
2. Trả lời bằng phong cách lịch sự, trang trọng, xưng "Dạ" hoặc "Dạ, Kohi AI xin chào".
3. Ngắn gọn, đúng trọng tâm (2-4 câu).
4. Nếu khách hàng tìm kiếm khẩu vị (thích ngọt, thèm bánh ngọt, đắng nhẹ, giải nhiệt, béo ngậy...), hãy tư vấn món phù hợp.

📌 THÔNG TIN QUÁN:
- Giờ mở cửa: 07:00 - 22:00 tất cả các ngày trong tuần.
- Wifi: "Kohi Coffee Guest", Mật khẩu: kohicoffee2026.
- Bãi đỗ xe: Xe máy và ô tô miễn phí 24/7.
- Điện & Học tập: Đầy đủ ổ cắm điện, máy lạnh yên tĩnh.
- Thanh toán: Tiền mặt, Chuyển khoản VietQR, Ví MoMo.`;

export interface RecommendedFoodItem {
  _id: any;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
}

@Injectable()
export class AiChatService {
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly foodsService: FoodsService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  private cleanEmoji(text: string): string {
    if (!text) return '';
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  }

  async ask(question: string): Promise<{ answer: string; recommendedFoods?: RecommendedFoodItem[] }> {
    const q = (question || '').toLowerCase().trim();
    const allFoods: any[] = await this.foodsService.findAll();
    let rawRecommended: any[] = [];

    // 1. Taste Recommendation Detection
    const isSweetOrPastry = q.includes('ngọt') || q.includes('bánh') || q.includes('pastry') || q.includes('chè') || q.includes('tráng miệng') || q.includes('cake');
    const isCoffeeOrBitter = q.includes('đắng') || q.includes('cà phê') || q.includes('cafe') || q.includes('espresso') || q.includes('đậm');
    const isRefreshingOrNonCoffee = q.includes('giải nhiệt') || q.includes('không cà phê') || q.includes('trà') || q.includes('nước ép') || q.includes('thanh mát') || q.includes('trẻ em');
    const isCreamyOrFatty = q.includes('béo') || q.includes('kem') || q.includes('dừa') || q.includes('sữa') || q.includes('cheese');

    if (isSweetOrPastry) {
      rawRecommended = allFoods.filter((f) => {
        const cat = (f.category || '').toLowerCase();
        const name = (f.name || '').toLowerCase();
        return cat.includes('bánh') || cat.includes('pastry') || name.includes('bánh') || name.includes('croissant') || name.includes('tart') || name.includes('cake') || (f.tasteTags && f.tasteTags.includes('sweet'));
      });
      if (rawRecommended.length === 0) rawRecommended = allFoods.slice(0, 3);
    } else if (isCoffeeOrBitter) {
      rawRecommended = allFoods.filter((f) => {
        const cat = (f.category || '').toLowerCase();
        const name = (f.name || '').toLowerCase();
        return cat.includes('cà phê') || cat.includes('coffee') || name.includes('cà phê') || name.includes('espresso') || name.includes('muối');
      });
    } else if (isRefreshingOrNonCoffee) {
      rawRecommended = allFoods.filter((f) => {
        const cat = (f.category || '').toLowerCase();
        const name = (f.name || '').toLowerCase();
        return cat.includes('trà') || cat.includes('nước') || name.includes('trà') || name.includes('vải') || name.includes('đào') || name.includes('cam');
      });
    } else if (isCreamyOrFatty) {
      rawRecommended = allFoods.filter((f) => {
        const name = (f.name || '').toLowerCase();
        return name.includes('dừa') || name.includes('muối') || name.includes('matcha') || name.includes('kem');
      });
    }

    const recommendedFoods: RecommendedFoodItem[] = rawRecommended.slice(0, 4).map((f) => ({
      _id: f._id ? f._id.toString() : f.id,
      name: f.name,
      price: f.price,
      image: f.image,
      category: f.category,
      description: f.description,
    }));

    // 2. FAQ Quick Responses
    if (q.includes('wifi') || q.includes('wi-fi') || q.includes('mật khẩu') || q.includes('pass')) {
      return {
        answer: this.cleanEmoji('Dạ, Kohi Coffee có Wifi tốc độ cao hoàn toàn miễn phí. Tên Wifi: "Kohi Coffee Guest", Mật khẩu: kohicoffee2026.'),
        recommendedFoods: recommendedFoods.length > 0 ? recommendedFoods : undefined,
      };
    }

    if (q.includes('giờ') || q.includes('mở cửa') || q.includes('đóng cửa')) {
      return {
        answer: this.cleanEmoji('Dạ, Kohi Coffee mở cửa đón khách từ 07:00 sáng đến 22:00 tối tất cả các ngày trong tuần.'),
        recommendedFoods: recommendedFoods.length > 0 ? recommendedFoods : undefined,
      };
    }

    if (q.includes('đỗ xe') || q.includes('gửi xe') || q.includes('giữ xe')) {
      return {
        answer: this.cleanEmoji('Dạ, Kohi Coffee có bãi đỗ xe máy và ô tô rộng rãi hoàn toàn miễn phí ngay trước cửa quán.'),
        recommendedFoods: recommendedFoods.length > 0 ? recommendedFoods : undefined,
      };
    }

    // 3. Dynamic Gemini API Response
    if (this.apiKey) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      const menuSummary = allFoods
        .map((f) => `- ${f.name} (${f.category}): ${f.price.toLocaleString('vi-VN')} VNĐ - ${f.description || ''}`)
        .join('\n');

      const userPrompt = `THỰC ĐƠN KOHI COFFEE:\n${menuSummary}\n\nCÂU HỎI CỦA KHÁCH HÀNG: "${question}"\n\nHãy tư vấn câu hỏi của khách ngắn gọn, trang trọng, KHÔNG CÓ BẤT KỲ EMOJI NÀO.`;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
              generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
            }),
          });

          if (res.ok) {
            const data: any = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return {
                answer: this.cleanEmoji(text),
                recommendedFoods: recommendedFoods.length > 0 ? recommendedFoods : undefined,
              };
            }
          }
        } catch (err) {
          console.error(`Gemini model ${model} error:`, err);
        }
      }
    }

    // Fallback response if Gemini fails or no key
    let fallbackAnswer = 'Dạ, Kohi AI xin chào. Bạn có thể xem thực đơn và chọn món uống yêu thích, hoặc nhờ nhân viên hỗ trợ trực tiếp tại bàn.';
    if (isSweetOrPastry) {
      fallbackAnswer = 'Dạ, nếu quý khách yêu thích vị ngọt nhẹ hoặc thèm bánh ngọt, Kohi đề xuất các món bánh nướng Pastry tươi mới và trà trái cây thanh mát ạ.';
    } else if (isCoffeeOrBitter) {
      fallbackAnswer = 'Dạ, đối với các tín đồ cà phê đậm vị, Kohi đề xuất món Cà phê Muối Huế kem béo đặc sản hoặc Cà phê Phin Đen truyền thống ạ.';
    } else if (isRefreshingOrNonCoffee) {
      fallbackAnswer = 'Dạ, để giải nhiệt sảng khoái không cafein, Kohi gợi ý Trà Vải Lài Kem Cheese hoặc Nước Ép Cam Tươi nguyên chất ạ.';
    }

    return {
      answer: this.cleanEmoji(fallbackAnswer),
      recommendedFoods: recommendedFoods.length > 0 ? recommendedFoods : undefined,
    };
  }
}
