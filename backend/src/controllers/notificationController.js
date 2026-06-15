const db = require('../config/db');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*, t.trip_uid 
       FROM notifications n 
       LEFT JOIN trips t ON n.trip_id = t.id 
       ORDER BY n.id DESC 
       LIMIT 100`
    );
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   POST /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead };
