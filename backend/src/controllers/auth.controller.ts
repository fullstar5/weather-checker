import type { Request, Response } from 'express';
import type { LoginBody, RegisterBody } from '../types/auth.types';
import { createDemoToken, createUser, existsUser, findUser } from '../services/auth.service';


export const login = (
  req: Request<unknown, unknown, LoginBody>,
  res: Response
): Response => {

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }
  const user = findUser(username, password);
  if (!user) {
    return res.status(401).json({ message: 'invalid credentials' });
  }
  const token = createDemoToken(user.username);
  return res.status(200).json({
    message: 'login success',
    token,
    user: { username: user.username },
  });
};

export const register = (
  req: Request<unknown, unknown, RegisterBody>,
  res: Response
): Response => {
    
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'password must be at least 6 characters' });
  }
  if (existsUser(username)) {
    return res.status(409).json({ message: 'username already exists' });
  }
  const newUser = createUser(username, password);

  return res.status(201).json({
    message: 'register success',
    user: { username: newUser.username },
  });
};