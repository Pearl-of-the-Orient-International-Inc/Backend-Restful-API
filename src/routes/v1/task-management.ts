import { Router } from 'express';
import { validate } from '@/common/sanitation';
import {
  createTask,
  createTaskBoard,
  deleteTask,
  deleteTaskBoard,
  getTaskManagement,
  moveTask,
  updateTask,
  updateTaskBoard,
} from '@/controllers/v1/task-management/task-management.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createTaskBoardSchema,
  createTaskSchema,
  deleteTaskBoardSchema,
  deleteTaskSchema,
  getTaskManagementSchema,
  moveTaskSchema,
  updateTaskBoardSchema,
  updateTaskSchema,
} from '@/validators/task-management';

const router = Router();

router.get('/', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(getTaskManagementSchema), getTaskManagement);
router.post('/boards', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(createTaskBoardSchema), createTaskBoard);
router.put('/boards/:boardId', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(updateTaskBoardSchema), updateTaskBoard);
router.delete('/boards/:boardId', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(deleteTaskBoardSchema), deleteTaskBoard);
router.post('/tasks', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(createTaskSchema), createTask);
router.put('/tasks/:taskId', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(updateTaskSchema), updateTask);
router.patch('/tasks/:taskId/move', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(moveTaskSchema), moveTask);
router.delete('/tasks/:taskId', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(deleteTaskSchema), deleteTask);

export default router;
