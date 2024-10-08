import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Timesheet } from './schemas/timesheets.schemas';
import { Model } from 'mongoose';
import { Contract } from '../contracts/schemas/contracts.schema';
import { Day } from '../types/day';
import { Wp } from 'src/wps/schemas/wps.schema';

@Injectable()
export class TimesheetsService {
  constructor(
    @InjectModel('Timesheet') private timesheetModel: Model<Timesheet>,
  ) {}

  async create(createTimesheetDto: CreateTimesheetDto) {
    const exceedDailyHours = await this.exceedDailyHours(createTimesheetDto);

    if (exceedDailyHours) {
      throw new HttpException(
        `Exceeded daily hours by ${exceedDailyHours}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const exceedTotal = await this.exceedTotal(
      createTimesheetDto.contract,
      createTimesheetDto.days,
    );

    if (exceedTotal) {
      throw new HttpException(
        `Exceeded total cost of contract by ${exceedTotal}$`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.timesheetModel.create(createTimesheetDto);
  }

  async findAll() {
    return await this.timesheetModel
      .find()
      .populate({
        path: 'contract',
        populate: [
          {
            path: 'project',
            model: 'Project',
            populate: {
              path: 'wps',
              model: Wp.name,
            },
          },
          {
            path: 'human',
            model: 'Human',
          },
          {
            path: 'wps',
            model: 'Wp',
          },
        ],
      })
      .populate({
        path: 'days',
        populate: {
          path: 'workPackages.wp',
        },
      })
      .exec();
  }

  async findOne(id: string) {
    return await this.timesheetModel.findById(id).exec;
  }

  async update(updateTimesheetDto: UpdateTimesheetDto) {
    //find the timesheet by id and update it
    if (!updateTimesheetDto._id) {
      throw new HttpException(
        `Timesheet id is required`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.timesheetModel
      .findByIdAndUpdate(updateTimesheetDto._id, updateTimesheetDto)
      .exec();
  }

  async remove(id: string) {
    return await this.timesheetModel.findByIdAndDelete(id).exec();
  }

  async exceedTotal(contract: Contract, days: Day[]): Promise<number> {
    const timesheets = await this.timesheetModel
      .find({
        contract: contract,
      })
      .exec();

    let totalHours = 0;
    for (const timesheet of timesheets) {
      for (const day of timesheet.days) {
        totalHours += day.workPackages.reduce((acc, wp) => {
          return acc + wp.hours;
        }, 0);
      }
    }

    let newTotalHours = 0;
    for (const day of days) {
      newTotalHours += day.workPackages.reduce((acc, wp) => {
        return acc + wp.hours;
      }, 0);
    }

    totalHours += newTotalHours;

    if (totalHours * contract.hourlyRate > contract.totalCost)
      return totalHours * contract.hourlyRate - contract.totalCost;

    return 0;
  }

  async exceedDailyHours(timesheet: CreateTimesheetDto): Promise<number> {
    //get all timesheets. filter them by human. filter them to be the same month and year (timestamp_created is a unix timestamp)
    const timesheets = await this.findAll();

    const sameHumanTimesheets = timesheets.filter((t) => {
      if (!t.contract) return false;
      if (!timesheet.contract) return false;

      if (!t.contract.human) return false;
      if (!timesheet.contract.human) return false;

      return t.contract.human.vat === timesheet.contract.human.vat;
    });

    const sameMonthTimesheets = sameHumanTimesheets.filter((t) => {
      return (
        new Date(Number(t.timestamp_created)).getMonth() ===
          new Date(Number(timesheet.timestamp_created)).getMonth() &&
        new Date(Number(t.timestamp_created)).getFullYear() ===
          new Date(Number(timesheet.timestamp_created)).getFullYear()
      );
    });

    //for each timesheet, get the total hours of each day. if the total hours of a day greater than 8, return the difference. Take in account the new timesheet
    const totalDailyHours: { [key: string]: number } = {};
    for (const t of sameMonthTimesheets) {
      for (const day of t.days) {
        let totalHours = 0;
        for (const wp of day.workPackages) {
          totalHours += wp.hours;
        }
        if (totalDailyHours[day.date]) {
          totalDailyHours[day.date] += totalHours;
        } else {
          totalDailyHours[day.date] = totalHours;
        }
      }
    }

    //add the new timesheet to the totalDailyHours
    for (const day of timesheet.days) {
      let totalHours = 0;
      for (const wp of day.workPackages) {
        totalHours += wp.hours;
      }
      if (totalDailyHours[day.date]) {
        totalDailyHours[day.date] += totalHours;
      } else {
        totalDailyHours[day.date] = totalHours;
      }
    }

    for (const key in totalDailyHours) {
      if (totalDailyHours[key] > 8) {
        return totalDailyHours[key] - 8;
      }
    }

    return 0;
  }
}
