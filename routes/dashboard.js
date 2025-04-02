import express from 'express';
import { getDashboardData } from '../controllers/dashboard.js';
import { verifyToken } from "../middleware/auth.js"

const router = express.Router();

router.get('/', verifyToken, getDashboardData);

export default router;
