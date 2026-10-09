import { randomUUID } from 'node:crypto';
import { getUsers, saveUsers } from '../repositories/users.repository.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/token.js';

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    let users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ message: 'Username already taken.' });
    }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Hashing yields to other requests; re-read before committing a new account.
    users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ message: 'Username already taken.' });
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const newUser = {
      id: randomUUID(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

export const profile = (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
};

