interface User {
    id: string;
    full_name: string;
    email: string;
    email_verified_at: string | null;
    is_active: boolean;
    isProfileComplete: boolean;
    member_since: string;
    [key: string]: any;
}

export default User;
