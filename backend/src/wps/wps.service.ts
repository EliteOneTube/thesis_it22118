import { Injectable } from '@nestjs/common';
import { CreateWpDto } from './dto/create-wp.dto';
import { UpdateWpDto } from './dto/update-wp.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Wps } from './schemas/wps.schema';

@Injectable()
export class WpsService {
  constructor(@InjectModel('Wps') private wpModel: Model<Wps>) {}

  create(createWpDto: CreateWpDto): Promise<Wps> {
    const createdWp = new this.wpModel(createWpDto);
    return createdWp.save();
  }

  findAll(): Promise<Wps[]> {
    return this.wpModel.find().exec();
  }

  findOne(id: string): Promise<any> {
    return this.wpModel.findById(id).exec();
  }

  deleteAll(): Promise<any> {
    return this.wpModel.deleteMany({}).exec();
  }

  async update(id: string, updateWpDto: UpdateWpDto): Promise<void> {
    //get old wp and push new interval
    const oldWp = await this.findOne(id);

    const newInterval = updateWpDto.newActiveInterval;

    //check if new interval is valid
    if (newInterval.startDate > newInterval.endDate) {
      throw new Error('Start date must be before end date');
    }

    oldWp.activeIntervals.push(newInterval);

    //update wp
    await this.wpModel.updateOne({ _id: id }, oldWp).exec();
  }
}
