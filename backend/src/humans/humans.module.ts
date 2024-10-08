import { Module } from '@nestjs/common';
import { HumansService } from './humans.service';
import { HumansController } from './humans.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Human, HumanSchema } from './schemas/humans.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Human.name, schema: HumanSchema }]),
  ],
  controllers: [HumansController],
  providers: [HumansService],
  exports: [HumansService],
})
export class HumansModule {}
