import User from "./user"

export interface MeType {
    message: string,
    user: User
}



export interface UserProfileType {
    id: string;
    full_name?: string;
    email: string;
    email_verified_at?: Date;
    is_active?: boolean;
    member_since?: Date;
}
