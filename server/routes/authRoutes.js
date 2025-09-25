const express = require('express');
const { authLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
} = require('../validators/authValidator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileRules, validate, updateProfile);
router.put(
  '/change-password',
  protect,
  changePasswordRules,
  validate,
  changePassword
);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
