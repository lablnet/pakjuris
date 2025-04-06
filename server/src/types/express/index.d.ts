import { IUser } from '../../../apps/user/models/User';

declare namespace Express {
  export interface Request {
    user?: IUser;
  }
}
