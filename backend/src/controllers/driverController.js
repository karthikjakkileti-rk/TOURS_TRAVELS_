const db = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private/Admin
const getDrivers = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, u.email 
      FROM drivers d 
      LEFT JOIN users u ON d.user_id = u.id 
      ORDER BY d.id DESC
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private/Admin
const getDriverById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT d.*, u.email 
      FROM drivers d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new driver (with automatically linked user account)
// @route   POST /api/drivers
// @access  Private/Admin
const createDriver = async (req, res, next) => {
  const { name, email, mobile_number, license_number, experience, status } = req.body;

  try {
    if (!name || !email || !mobile_number || !license_number || experience === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    // Check user with email exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Check license exists
    const [existingLicense] = await db.query('SELECT * FROM drivers WHERE license_number = ?', [license_number]);
    if (existingLicense.length > 0) {
      return res.status(400).json({ success: false, message: 'License number already registered' });
    }

    // Create user account for driver (default pass: driver123)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('driver123', salt);

    // Insert user
    const [userResult] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'driver']
    );

    const userId = userResult.insertId;

    // Insert driver profile
    const [driverResult] = await db.query(
      'INSERT INTO drivers (user_id, name, mobile_number, license_number, experience, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, mobile_number, license_number, experience, status || 'available']
    );

    res.status(201).json({
      success: true,
      message: 'Driver profile and user account created successfully',
      data: {
        id: driverResult.insertId,
        user_id: userId,
        name,
        email,
        mobile_number,
        license_number,
        experience,
        status: status || 'available',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver details
// @route   PUT /api/drivers/:id
// @access  Private/Admin
const updateDriver = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, mobile_number, license_number, experience, status } = req.body;

  try {
    // Check driver exists
    const [drivers] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
    if (drivers.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const driver = drivers[0];

    // Update user name and email if provided
    if (driver.user_id && (name || email)) {
      if (email) {
        // Ensure email uniqueness
        const [existingEmail] = await db.query(
          'SELECT * FROM users WHERE email = ? AND id != ?',
          [email, driver.user_id]
        );
        if (existingEmail.length > 0) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
      }

      await db.query(
        'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
        [name, email, driver.user_id]
      );
    }

    // Update driver profile
    await db.query(
      `UPDATE drivers 
       SET name = COALESCE(?, name), 
           mobile_number = COALESCE(?, mobile_number), 
           license_number = COALESCE(?, license_number), 
           experience = COALESCE(?, experience), 
           status = COALESCE(?, status) 
       WHERE id = ?`,
      [name, mobile_number, license_number, experience, status, id]
    );

    const [updatedDriver] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: updatedDriver[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
const deleteDriver = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [drivers] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
    if (drivers.length === 0) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const driver = drivers[0];

    // Delete user account (which cascades and deletes driver due to FK constraint if defined, or we delete driver then user)
    if (driver.user_id) {
      await db.query('DELETE FROM users WHERE id = ?', [driver.user_id]);
    } else {
      await db.query('DELETE FROM drivers WHERE id = ?', [id]);
    }

    res.status(200).json({ success: true, message: 'Driver and associated user account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDrivers, getDriverById, createDriver, updateDriver, deleteDriver };
