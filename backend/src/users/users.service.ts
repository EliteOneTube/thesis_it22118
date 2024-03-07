import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/users.schemas';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Human } from 'src/humans/schemas/humans.schema';
import { Wp } from 'src/wps/schemas/wps.schema';
import { InsertUserInfoDto } from './dto/insert-info-user.dto';
import { ProjectsService } from 'src/projects/projects.service';
import { HumansService } from 'src/humans/humans.service';
import { ContractsService } from 'src/contracts/contracts.service';
import { WpsService } from 'src/wps/wps.service';
import * as crypto from 'crypto';
import { InfoAdmin } from 'src/types/userAuthInfoRequest';
import { TimesheetsService } from 'src/timesheets/timesheets.service';

@Injectable()
export class UsersService {
   constructor(
      @InjectModel('User') private userModel: Model<User>,
      private authService: AuthService,
      private projectsService: ProjectsService,
      private humansService: HumansService,
      private contractsService: ContractsService,
      private wpsService: WpsService,
      private timesheetsService: TimesheetsService,
   ) {}

   async create(createUserDto: CreateUserDto) {
      const createdUser = new this.userModel(createUserDto);

      const generatePassword = (
         length = 30,
         characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@',
      ) =>
         Array.from(crypto.randomFillSync(new Uint32Array(length)))
            .map((x) => characters[x % characters.length])
            .join('');

      const password = generatePassword();

      const user = await this.authService.firebaseApp
         .auth()
         .createUser({
            email: createUserDto.email,
            emailVerified: false,
            password: password,
            disabled: false,
            displayName: '',
         })
         .catch((error) => {
            if (error.code === 'auth/email-already-exists') {
               return this.authService.firebaseApp
                  .auth()
                  .getUserByEmail(createUserDto.email);
            }
         });

      if (!user) {
         return;
      }

      this.authService.firebaseApp.auth().setCustomUserClaims(user.uid, {
         admin: createUserDto.role == 'admin',
      });

      createdUser.uid = user.uid;

      return createdUser.save();
   }

   async findAll(uid: string) {
      const users = await this.userModel.find().exec();

      //remove the user with the uid given
      const filteredUsers = users.filter((user) => user.uid !== uid);

      return filteredUsers;
   }

   async findOne(uid: string) {
      return await this.userModel
         .findOne({ uid })
         .populate({
            path: 'projects',
            populate: {
               path: 'wps',
               model: Wp.name,
            },
         })
         .populate('humans', null, Human.name)
         .populate('wps', null, Wp.name)
         .populate({
            path: 'contracts',
            populate: [
               {
                  path: 'project',
                  model: 'Project',
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
            path: 'timesheets',
            populate: [
               {
                  path: 'project',
                  model: 'Project',
               },
               {
                  path: 'human',
                  model: 'Human',
               },
               {
                  path: 'wp',
                  model: 'Wp',
               },
            ],
         })
         .exec();
   }

   // TODO
   update(uid: string, updateUserDto: UpdateUserDto) {
      const updateUser = new this.userModel(updateUserDto);
      return this.userModel.updateOne({ uid }, updateUser);
   }

   async remove(_id: string) {
      const user = await this.userModel.findOne({ _id }).exec();

      if (!user) {
         return;
      }

      await this.authService.firebaseApp.auth().deleteUser(user.uid);

      for (const project of user.projects) {
         await this.projectsService.remove(String(project));
      }

      for (const contract of user.contracts) {
         await this.contractsService.remove(String(contract));
      }

      for (const timesheet of user.timesheets) {
         await this.timesheetsService.remove(String(timesheet));
      }

      return await this.userModel.deleteOne({ _id }).exec();
   }

   async insertInfo(uid: string, insertUserInfoDto: InsertUserInfoDto) {
      const user = await this.userModel.findOne({ uid }).exec();

      if (!user) {
         return;
      }

      if (insertUserInfoDto.project) {
         const newProject = await this.projectsService.create(
            insertUserInfoDto.project,
         );

         user.projects.push(newProject);
      }

      if (insertUserInfoDto.human) {
         const newHuman = await this.humansService.create(
            insertUserInfoDto.human,
         );
         user.humans.push(newHuman);
      }

      if (insertUserInfoDto.wp) {
         const newWp = await this.wpsService.create(insertUserInfoDto.wp);

         user.wps.push(newWp);
      }

      if (insertUserInfoDto.contract) {
         const newContract = await this.contractsService.create(
            insertUserInfoDto.contract,
         );

         user.contracts.push(newContract);
      }

      if (insertUserInfoDto.timesheet) {
         const newTimesheet = await this.timesheetsService.create(
            insertUserInfoDto.timesheet,
         );

         user.timesheets.push(newTimesheet);
      }

      return user.save();
   }

   async getAllInfo() {
      const info: InfoAdmin = {
         projects: [],
         contracts: [],
         humans: [],
         wps: [],
         timesheets: [],
      };

      info.projects = await this.projectsService.findAll();
      info.contracts = await this.contractsService.findAll();
      info.humans = await this.humansService.findAll();
      info.timesheets = await this.timesheetsService.findAll();

      return info;
   }
}
