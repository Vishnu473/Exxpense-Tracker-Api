import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashed);
  } catch (error) {
    return false;
    
  }
};
