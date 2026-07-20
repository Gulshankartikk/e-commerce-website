import { Router } from 'express';
import * as address from '../controllers/addressController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', address.getAddresses);
router.post('/', address.addAddress);
router.put('/:addressId', address.updateAddress);
router.delete('/:addressId', address.deleteAddress);

export default router;
