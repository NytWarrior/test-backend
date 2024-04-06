import express from 'express';
import { deleteUser, getUserById, getUsers, requestPasswordReset, resetPassword, updateUser } from '../controllers/users.controller.js';

const router = express.Router();

// router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);


export default router;