const express = require('express');
const { protect } = require('../middlewares/auth');
const { getSeats, lockSeat, unlockSeat } = require('../controllers/seatController');

const router = express.Router({ mergeParams: true });

router.get('/', getSeats);
router.post('/:seatId/lock', protect, lockSeat);
router.post('/:seatId/unlock', protect, unlockSeat);

module.exports = router;
