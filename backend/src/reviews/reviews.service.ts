import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Review, ReviewDocument } from './schemas/review.schema.js';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { OnModuleInit } from '@nestjs/common';

export interface AiReviewInsightItem {
  foodId?: string;
  foodName: string;
  lowRatingCount: number;
  avgStar: number;
  negativeSummary: string;
  aiSuggestedSolution: string;
}

@Injectable()
export class ReviewsService implements OnModuleInit {
  private readonly apiKey: string;

  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async onModuleInit() {
    try {
      const result = await this.reviewModel.deleteMany({
        $or: [
          { overallComment: { $regex: /Cà phê rất thơm ngon|Bánh ngọt tươi mới/i } },
          { 'ratings.comment': 'Hương vị tuyệt vời!' }
        ]
      });
      if (result.deletedCount > 0) {
        console.log(`[Clean] Cleared ${result.deletedCount} seed reviews from database.`);
      }
    } catch (err) {
      console.error('[Clean Error] Failed to clear seed reviews:', err);
    }
  }

  private cleanEmoji(text: string): string {
    if (!text) return '';
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  }

  async create(dto: CreateReviewDto): Promise<ReviewDocument> {
    const order = await this.orderModel.findById(dto.orderId).lean();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (order.status !== 'paid' && order.status !== 'completed') {
      throw new BadRequestException('Chỉ có thể đánh giá đơn hàng đã hoàn thành hoặc thanh toán.');
    }

    const existing = await this.reviewModel.findOne({ orderId: dto.orderId }).lean();
    if (existing) throw new ConflictException('Đơn hàng này đã được đánh giá rồi.');

    const review = new this.reviewModel(dto);
    return review.save();
  }

  async findAll(): Promise<any[]> {
    return this.reviewModel
      .find()
      .populate('orderId', 'totalAmount createdAt customerName items')
      .populate('tableId', 'tableName')
      .populate('ratings.foodId', 'name image price')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findByFood(foodId: string): Promise<any[]> {
    let foodObjId: Types.ObjectId | null = null;
    try {
      foodObjId = new Types.ObjectId(foodId);
    } catch (e) {}

    const filter = foodObjId
      ? { $or: [{ 'ratings.foodId': foodId }, { 'ratings.foodId': foodObjId }] }
      : { 'ratings.foodId': foodId };

    const reviews = await this.reviewModel
      .find(filter)
      .populate('tableId', 'tableName')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return reviews.map((r) => ({
      ...r,
      foodRating: r.ratings.find(
        (rt: any) => rt.foodId?.toString() === foodId
      ),
    }));
  }

  async getRatingSummary(foodId: string): Promise<{ avgStar: number; totalReviews: number }> {
    let foodObjId: Types.ObjectId | null = null;
    try {
      foodObjId = new Types.ObjectId(foodId);
    } catch (e) {}

    const matchCondition = foodObjId
      ? {
          $expr: {
            $or: [
              { $eq: ['$ratings.foodId', foodObjId] },
              { $eq: [{ $toString: '$ratings.foodId' }, foodId] },
            ],
          },
        }
      : {
          $expr: {
            $eq: [{ $toString: '$ratings.foodId' }, foodId],
          },
        };

    const result = await this.reviewModel.aggregate([
      { $match: { 'ratings.0': { $exists: true } } },
      { $unwind: '$ratings' },
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          avgStar: { $avg: '$ratings.star' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    if (result.length === 0) return { avgStar: 0, totalReviews: 0 };
    return { avgStar: Math.round(result[0].avgStar * 10) / 10, totalReviews: result[0].totalReviews };
  }

  async findByOrder(orderId: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findOne({ orderId }).lean() as any;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Không tìm thấy đánh giá.');
    return { message: 'Đã xóa đánh giá thành công.' };
  }

  /**
   * AI Phân Tích & Đề Xuất Giải Pháp Cải Tiến Cho Admin
   */
  async getAiReviewInsights(): Promise<AiReviewInsightItem[]> {
    const reviews = await this.reviewModel
      .find()
      .populate('ratings.foodId', 'name')
      .lean()
      .exec();

    // Group low rating feedback by food item
    const foodMap = new Map<string, { foodId: string; foodName: string; stars: number[]; comments: string[] }>();

    for (const r of reviews) {
      if (r.ratings && r.ratings.length > 0) {
        for (const rt of r.ratings) {
          if (rt.star <= 3) {
            const f = rt.foodId as any;
            const foodId = f?._id ? f._id.toString() : (rt.foodId ? rt.foodId.toString() : 'unknown');
            const foodName = f?.name || 'Món ăn';
            
            if (!foodMap.has(foodId)) {
              foodMap.set(foodId, { foodId, foodName, stars: [], comments: [] });
            }
            const item = foodMap.get(foodId)!;
            item.stars.push(rt.star);
            if (rt.comment && rt.comment.trim()) {
              item.comments.push(rt.comment.trim());
            }
          }
        }
      }
      if (r.overallStar <= 3 && r.overallComment && r.overallComment.trim()) {
        // General store comment for low rating
        if (!foodMap.has('general')) {
          foodMap.set('general', { foodId: 'general', foodName: 'Chất lượng phục vụ chung', stars: [], comments: [] });
        }
        const genItem = foodMap.get('general')!;
        genItem.stars.push(r.overallStar);
        genItem.comments.push(r.overallComment.trim());
      }
    }

    if (foodMap.size === 0) {
      return [
        {
          foodName: 'Chất lượng thực đơn & Dịch vụ',
          lowRatingCount: 0,
          avgStar: 5.0,
          negativeSummary: 'Chưa ghi nhận phản hồi đánh giá thấp nào từ khách hàng.',
          aiSuggestedSolution: 'Duy trì quy trình pha chế chuẩn vị và chất lượng phục vụ hiện tại.',
        },
      ];
    }

    const fallbackInsights: AiReviewInsightItem[] = [];
    const promptDataLines: string[] = [];

    for (const [key, val] of foodMap.entries()) {
      const avg = val.stars.reduce((a, b) => a + b, 0) / val.stars.length;
      const roundedAvg = Math.round(avg * 10) / 10;
      const summaryText = val.comments.join('; ') || 'Khách hàng đánh giá sao thấp nhưng không để lại ghi chú.';
      
      // Fallback heuristics
      let suggestedSolution = 'Kiểm tra quy trình định lượng nguyên liệu và nhắc nhở nhân viên pha chế tuân thủ công thức chuẩn.';
      const lowerSum = summaryText.toLowerCase();
      if (lowerSum.includes('ngọt') || lowerSum.includes('chè')) {
        suggestedSolution = 'Nên giảm 10ml sữa đặc hoặc syrup đường trong công thức chuẩn. Kiểm tra ly đong định lượng jigger của nhân viên pha chế.';
      } else if (lowerSum.includes('đắng') || lowerSum.includes('cháy')) {
        suggestedSolution = 'Kiểm tra cỡ xay hạt cà phê và thời gian chiết xuất espresso để tránh bị khét đắng.';
      } else if (lowerSum.includes('nhạt') || lowerSum.includes('đá')) {
        suggestedSolution = 'Giảm lượng đá viên hoặc điều chỉnh tăng định lượng cốt cà phê / trà đậm đà hơn.';
      } else if (lowerSum.includes('khô') || lowerSum.includes('nguội')) {
        suggestedSolution = 'Hâm nóng lại bánh trước khi phục vụ và kiểm tra thời gian bảo quản bánh nướng trong ngày.';
      }

      fallbackInsights.push({
        foodId: val.foodId,
        foodName: val.foodName,
        lowRatingCount: val.stars.length,
        avgStar: roundedAvg,
        negativeSummary: this.cleanEmoji(summaryText),
        aiSuggestedSolution: this.cleanEmoji(suggestedSolution),
      });

      promptDataLines.push(`- ${val.foodName} (${val.stars.length} lượt đánh giá thấp, trung bình ${roundedAvg} sao): các phản hồi là "${summaryText}"`);
    }

    // Call Gemini AI for dynamic insights
    if (this.apiKey) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      const systemPrompt = `Bạn là Chuyên gia Quản lý Chất lượng F&B cho hệ thống Kohi Coffee.
Nhiệm vụ: Phân tích các phản hồi đánh giá 1-3 sao dưới đây của khách hàng và đưa ra tóm tắt nguyên nhân + giải pháp cải tiến công thức pha chế hoặc quy trình phục vụ cực kỳ cụ thể.

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG DÙNG BẤT KỲ BIỂU TƯỢNG CẢM XÚC (EMOJI HOẶC ICON) NÀO TRONG PHẢN HỒI.
2. Trả về định dạng JSON duy nhất là một mảng danh sách đối tượng:
[
  {
    "foodName": "Tên món",
    "lowRatingCount": số_lượt,
    "avgStar": số_sao,
    "negativeSummary": "Tóm tắt ngắn gọn phản hồi tiêu cực của khách",
    "aiSuggestedSolution": "Đề xuất giải pháp định lượng / công thức hoặc quy trình phục vụ cụ thể"
  }
]`;

      const userPrompt = `DỮ LIỆU ĐÁNH GIÁ THẤP:\n${promptDataLines.join('\n')}\n\nHãy xuất JSON phân tích:`;

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { maxOutputTokens: 800, temperature: 0.2 },
            }),
          });

          if (res.ok) {
            const data: any = await res.json();
            let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map((item: any) => ({
                foodName: this.cleanEmoji(item.foodName || 'Món ăn'),
                lowRatingCount: Number(item.lowRatingCount) || 1,
                avgStar: Number(item.avgStar) || 2.0,
                negativeSummary: this.cleanEmoji(item.negativeSummary || 'Phàn nàn chất lượng'),
                aiSuggestedSolution: this.cleanEmoji(item.aiSuggestedSolution || 'Cần kiểm tra công thức pha chế'),
              }));
            }
          }
        } catch (err) {
          console.error(`Gemini model ${model} review insight error:`, err);
        }
      }
    }

    return fallbackInsights;
  }
}
