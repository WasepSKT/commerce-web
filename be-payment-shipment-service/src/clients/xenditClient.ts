import axios from 'axios';
import { config } from '../config';

export const xenditClient = axios.create({
  baseURL: 'https://api.xendit.co',
  auth: { username: config.xendit.secretKey, password: '' },
  headers: { 'Content-Type': 'application/json' },
});
