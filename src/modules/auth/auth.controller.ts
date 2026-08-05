import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { prisma } from '../../shared/database';

const authService = new AuthService();
export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing credentials' });
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '該 Email 已經被註冊過，請直接登入或使用其他 Email' });
    }
    
    const user = await authService.register(email, password, name);
    (req as any).session.user = { id: user.id, email: user.email, name: (user as any).name || 'User' };
    res.status(201).json({ success: true, user: (req as any).session.user });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json({ success: false, message: '該 Email 已經被註冊過，請直接登入或使用其他 Email' });
    }
    res.status(500).json({ error: e.message });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    
    const user = await authService.login(email, password);
    (req as any).session.user = { id: (user as any).id, email: (user as any).email, name: (user as any).name || 'User' };
    res.status(200).json({ success: true, user: (req as any).session.user });
  } catch (e: any) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

authRouter.post('/logout', (req: Request, res: Response) => {
  (req as any).session.destroy(() => {
    res.json({ success: true });
  });
});

authRouter.get('/me', (req: Request, res: Response) => {
  // 安全存取 user
  const currentUser = (req as any).session?.user || (req as any).user || null;

  if (!currentUser) {
    return res.status(200).json({ success: true, authenticated: false, user: null });
  }

  res.json({ success: true, authenticated: true, user: currentUser });
});
