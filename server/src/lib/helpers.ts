import Counter from '../apps/user/models/Counter';

export const getNextSequence = async (sequenceName: string): Promise<number> => {
    const counter = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return counter!.sequence_value;
};
