import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngredientsService } from './ingredients.service.js';
import { IngredientsController } from './ingredients.controller.js';
import { Ingredient, IngredientSchema } from './schemas/ingredient.schema.js';
import { IngredientUsage, IngredientUsageSchema } from './schemas/ingredient-usage.schema.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ingredient.name, schema: IngredientSchema },
      { name: IngredientUsage.name, schema: IngredientUsageSchema },
    ]),
    OrdersModule,
  ],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService, MongooseModule],
})
export class IngredientsModule {}
