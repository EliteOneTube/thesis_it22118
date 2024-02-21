import { Contract } from 'src/contracts/schemas/contracts.schema';
import { Human } from 'src/humans/schemas/humans.schema';
import { Project } from 'src/projects/schemas/projects.schemas';
import { Wp } from 'src/wps/schemas/wps.schema';

export class InsertUserInfoDto {
   project?: Project;
   contract?: Contract;
   human?: Human;
   wp?: Wp;
}
