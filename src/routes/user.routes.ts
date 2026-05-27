import { Router } from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    checkUserHandoverRequirements,
    getProfile,
    updateProfile
} from '../controllers/user.controller';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id/handover', checkUserHandoverRequirements);

export default router;
