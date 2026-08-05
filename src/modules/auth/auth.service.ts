import { prisma } from '../../shared/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

export class AuthService {
  async register(email: string, password: string, name?: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = { email, password: hashedPassword, isRegistered: true };
    if (name) userData.name = name;
    return await prisma.user.create({
      data: userData,
    });
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    // For session-based, return user object directly
    return user;
  }
}
