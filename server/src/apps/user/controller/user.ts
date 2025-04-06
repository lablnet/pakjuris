import { Request, Response, NextFunction } from 'express';

const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user } = req;
    res.status(200).json({ user: await user!.toJSON() });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user } = req;
    const { full_name } = req.body;
    user!.full_name = full_name;
    await user!.save();
    res.status(200).json({ user: await user?.toJSON() });
  } catch (error) {
    next(error);
  }
}

export { me, updateProfile };
