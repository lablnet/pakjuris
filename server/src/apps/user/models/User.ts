import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';


export interface IUser extends Document {
  full_name?: string;
  email: string;
  password: string;
  email_verified_at?: Date;
  email_verified_otp?: number;
  email_verified_otp_expire?: Date;
  reset_password_otp?: number;
  reset_password_otp_expire?: Date;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  comparePassword: (password: string) => Promise<boolean>;
  toJSON: () => Promise<any>;
  profile_picture?: string;
}

const UserSchema: Schema = new Schema({
  full_name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email_verified_at: { type: Date },
  email_verified_otp: { type: Number },
  email_verified_otp_expire: { type: Date },
  reset_password_otp: { type: Number },
  reset_password_otp_expire: { type: Date },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.isProfileComplete = function (): boolean {
  return true
}

UserSchema.methods.toJSON = async function () {
  return {
    id: this._id,
    full_name: this.full_name,
    email: this.email,
    email_verified_at: this.email_verified_at,
    is_active: this.is_active,
    isProfileComplete: this.isProfileComplete(),
    member_since: this.created_at,
  };
}

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
