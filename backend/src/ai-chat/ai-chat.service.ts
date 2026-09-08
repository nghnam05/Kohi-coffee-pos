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

  /**
   * Bóc tách câu lệnh đặt món bằng giọng nói tiếng Việt thành đơn hàng có cấu trúc.
   * Sử dụng Gemini 2.0 Flash với Strict JSON Mode, kết hợp Fallback NLP thuật toán nội bộ.
   */
  async parseVoiceOrder(transcript: string, lang: string = 'vi'): Promise<{
    isTakeaway: boolean;
    items: Array<{
      foodId: string;
      foodName: string;
      quantity: number;
      size: 'S' | 'M' | 'L';
      unitPrice: number;
      ice?: string;
      sugar?: string;
      note: string;
    }>;
    unrecognizedText?: string;
    aiReply: string;
  }> {
    const rawText = (transcript || '').trim();
    if (!rawText) {
      return {
        isTakeaway: false,
        items: [],
        aiReply: 'Kohi chưa nghe rõ câu gọi món. Quý khách vui lòng thử nói lại nhé.',
      };
    }

    const allFoods: any[] = await this.foodsService.findAll();
    const isTakeawayKeyword = /mang về|mang đi|takeaway|đem về|cầm đi/i.test(rawText);

    // 1. Thử giải mã qua Gemini AI với JSON Response
    if (this.apiKey) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      const menuJson = allFoods.map((f) => ({
        id: (f._id ? f._id.toString() : f.id) || '',
        name: f.name,
        price: f.price,
        category: f.category,
      }));

      const prompt = `Bạn là hệ thống bóc tách đơn gọi món (Voice Ordering Parser) cho thương hiệu "Kohi Coffee & Pastry".
NHIỆM VỤ:
Phân tích câu nói tiếng Việt của khách hàng hoặc thu ngân và bóc tách thành danh sách món có cấu trúc JSON.

THỰC ĐƠN HIỆN CÓ:
${JSON.stringify(menuJson, null, 2)}

QUY TẮC BÓC TÁCH:
1. Nhận diện các món được gọi từ câu nói: "${rawText}".
2. Khớp với món gần đúng nhất trong THỰC ĐƠN.
3. Số lượng (quantity): Số nguyên dương (1, 2, 3...). Mặc định là 1 nếu không nói rõ.
4. Kích cỡ (size): 'S', 'M', hoặc 'L'. Mặc định 'M'. Nếu khách nói "ly lớn", "size to" -> 'L'; "ly nhỏ", "size nhỏ" -> 'S'.
5. Tính unitPrice:
   - Size 'S': giá gốc * 0.85 (làm tròn hàng nghìn)
   - Size 'M': giá gốc
   - Size 'L': giá gốc * 1.2 (làm tròn hàng nghìn)
6. Tùy chọn đá (ice): 'Ít đá', 'Nhiều đá', 'Không đá', 'Bình thường'.
7. Tùy chọn đường (sugar): 'Ít ngọt', 'Không đường', 'Bình thường'.
8. Ghi chú (note): Tổng hợp các tùy chọn đá, đường, size, mang về vào chuỗi ghi chú.
9. isTakeaway: true nếu có từ khóa mang về / mang đi / takeaway, ngược lại false.
10. aiReply: Một câu xác nhận ngắn gọn, lịch sự, KHÔNG CÓ BẤT KỲ ICON / EMOJI NÀO.
11. BẮT BUỘC CHỈ TRẢ VỀ ĐÚNG 1 ĐOẠN JSON HỢP LỆ THEO CẤU TRÚC SAU (KHÔNG DÙNG MARKDOWN, KHÔNG GIẢI THÍCH):
{
  "isTakeaway": boolean,
  "items": [
    {
      "foodId": "string",
      "foodName": "string",
      "quantity": number,
      "size": "S" | "M" | "L",
      "unitPrice": number,
      "ice": "string",
      "sugar": "string",
      "note": "string"
    }
  ],
  "unrecognizedText": "string",
  "aiReply": "string"
}`;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                maxOutputTokens: 600,
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (res.ok) {
            const data: any = await res.json();
            const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (rawOutput) {
              const cleaned = rawOutput.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
                // Verify food IDs exist
                parsed.items = parsed.items.map((item: any) => {
                  const matchedFood = allFoods.find((f) => (f._id?.toString() === item.foodId) || f.name.toLowerCase() === item.foodName?.toLowerCase());
                  const basePrice = matchedFood?.price || item.unitPrice || 30000;
                  const size = item.size === 'S' || item.size === 'L' ? item.size : 'M';
                  const multiplier = size === 'S' ? 0.85 : size === 'L' ? 1.2 : 1.0;
                  return {
                    foodId: matchedFood ? matchedFood._id.toString() : item.foodId,
                    foodName: matchedFood ? matchedFood.name : item.foodName,
                    quantity: Math.max(1, Number(item.quantity) || 1),
                    size,
                    unitPrice: Math.round((basePrice * multiplier) / 1000) * 1000,
                    ice: item.ice || undefined,
                    sugar: item.sugar || undefined,
                    note: this.cleanEmoji(item.note || ''),
                  };
                });
                return {
                  isTakeaway: Boolean(parsed.isTakeaway || isTakeawayKeyword),
                  items: parsed.items,
                  unrecognizedText: parsed.unrecognizedText || '',
                  aiReply: this.cleanEmoji(parsed.aiReply || `Dạ, Kohi AI đã tiếp nhận ${parsed.items.length} món vào giỏ hàng ạ!`),
                };
              }
            }
          }
        } catch (err) {
          console.error(`Gemini voice parse error with ${model}:`, err);
        }
      }
    }

    // 2. Fallback NLP bóc tách nội bộ (Local Rule-based Matching)
    const lower = rawText.toLowerCase();
    const detectedItems: Array<{
      foodId: string;
      foodName: string;
      quantity: number;
      size: 'S' | 'M' | 'L';
      unitPrice: number;
      ice?: string;
      sugar?: string;
      note: string;
    }> = [];

    // Tách các phân đoạn nếu có từ nối "và", "với", "thêm"
    const segments = lower.split(/(?:,|\bvà\b|\bvới\b|\bthêm\b|\bcộng\b)/g);

    for (const seg of segments) {
      const trimmed = seg.trim();
      if (!trimmed) continue;

      // Tìm món phù hợp nhất
      let bestFood: any = null;
      let highestScore = 0;

      for (const food of allFoods) {
        const fname = food.name.toLowerCase();
        // Kiểm tra khớp từ khóa
        if (trimmed.includes(fname)) {
          if (fname.length > highestScore) {
            bestFood = food;
            highestScore = fname.length;
          }
        } else {
          // Khớp từ lóng tiếng Việt phổ biến
          const slangMatches = [
            { slang: 'muối', target: 'muối' },
            { slang: 'bạc xỉu', target: 'bạc xỉu' },
            { slang: 'bạc sỉu', target: 'bạc xỉu' },
            { slang: 'đen', target: 'đen' },
            { slang: 'sữa đá', target: 'sữa' },
            { slang: 'trà đào', target: 'đào' },
            { slang: 'trà vải', target: 'vải' },
            { slang: 'matcha', target: 'matcha' },
            { slang: 'croissant', target: 'croissant' },
            { slang: 'sừng bò', target: 'croissant' },
            { slang: 'tiramisu', target: 'tiramisu' },
          ];
          for (const sm of slangMatches) {
            if (trimmed.includes(sm.slang) && fname.includes(sm.target)) {
              if (fname.length > highestScore) {
                bestFood = food;
                highestScore = fname.length;
              }
            }
          }
        }
      }

      if (bestFood) {
        // Trích xuất số lượng
        let qty = 1;
        const numMatch = trimmed.match(/(\d+)\s*(?:ly|cốc|phần|cái|bánh|suất)?/);
        if (numMatch) {
          qty = parseInt(numMatch[1], 10);
        } else if (/\bhai\b/i.test(trimmed)) {
          qty = 2;
        } else if (/\bba\b/i.test(trimmed)) {
          qty = 3;
        } else if (/\bbốn\b/i.test(trimmed)) {
          qty = 4;
        } else if (/\bnăm\b/i.test(trimmed)) {
          qty = 5;
        }

        // Trích xuất size
        let size: 'S' | 'M' | 'L' = 'M';
        if (/size\s*l\b|ly\s*lớn|cỡ\s*lớn|size\s*to/i.test(trimmed)) {
          size = 'L';
        } else if (/size\s*s\b|ly\s*nhỏ|cỡ\s*nhỏ/i.test(trimmed)) {
          size = 'S';
        }

        // Trích xuất đá và đường
        let ice = 'Bình thường';
        if (/ít\s*đá/i.test(trimmed)) ice = 'Ít đá';
        else if (/nhiều\s*đá/i.test(trimmed)) ice = 'Nhiều đá';
        else if (/không\s*đá/i.test(trimmed)) ice = 'Không đá';

        let sugar = 'Bình thường';
        if (/ít\s*(?:đường|ngọt)/i.test(trimmed)) sugar = 'Ít ngọt';
        else if (/không\s*(?:đường|ngọt)/i.test(trimmed)) sugar = 'Không đường';

        const notes: string[] = [];
        if (ice !== 'Bình thường') notes.push(ice);
        if (sugar !== 'Bình thường') notes.push(sugar);
        if (isTakeawayKeyword) notes.push('Mang về');

        const basePrice = bestFood.price || 35000;
        const multiplier = size === 'S' ? 0.85 : size === 'L' ? 1.2 : 1.0;
        const unitPrice = Math.round((basePrice * multiplier) / 1000) * 1000;

        detectedItems.push({
          foodId: bestFood._id ? bestFood._id.toString() : bestFood.id,
          foodName: bestFood.name,
          quantity: Math.max(1, qty),
          size,
          unitPrice,
          ice,
          sugar,
          note: notes.join(', '),
        });
      }
    }

    const itemNames = detectedItems.map((i) => `${i.quantity} ${i.foodName} (${i.size})`).join(', ');
    const reply = detectedItems.length > 0
      ? `Dạ, Kohi AI đã nhận diện: ${itemNames}. Vui lòng kiểm tra lại đơn trước khi gửi ạ.`
      : 'Dạ, Kohi chưa tìm thấy món tương ứng trong thực đơn. Quý khách vui lòng thử đọc rõ tên món hơn nhé.';

    return {
      isTakeaway: isTakeawayKeyword,
      items: detectedItems,
      aiReply: this.cleanEmoji(reply),
    };
  }
}

