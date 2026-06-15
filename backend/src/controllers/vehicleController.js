const db = require('../config/db');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT v.*, d.name AS driver_name, d.mobile_number AS driver_mobile 
      FROM vehicles v 
      LEFT JOIN drivers d ON v.driver_id = d.id 
      ORDER BY v.id DESC
    `);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT v.*, d.name AS driver_name, d.mobile_number AS driver_mobile 
      FROM vehicles v 
      LEFT JOIN drivers d ON v.driver_id = d.id 
      WHERE v.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private/Admin
const createVehicle = async (req, res, next) => {
  const { vehicle_number, vehicle_type, capacity, status, driver_id } = req.body;

  try {
    if (!vehicle_number || !vehicle_type || !capacity) {
      return res.status(400).json({ success: false, message: 'Please provide vehicle number, type, and capacity' });
    }

    // Check vehicle number unique
    const [existing] = await db.query('SELECT * FROM vehicles WHERE vehicle_number = ?', [vehicle_number]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
    }

    // If driver_id is provided, check if already assigned to another vehicle
    if (driver_id) {
      const [existingDriver] = await db.query('SELECT * FROM vehicles WHERE driver_id = ?', [driver_id]);
      if (existingDriver.length > 0) {
        return res.status(400).json({ success: false, message: 'Driver is already assigned to another vehicle' });
      }
    }

    // Insert
    const [result] = await db.query(
      'INSERT INTO vehicles (vehicle_number, vehicle_type, capacity, status, driver_id) VALUES (?, ?, ?, ?, ?)',
      [vehicle_number, vehicle_type, capacity, status || 'available', driver_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: {
        id: result.insertId,
        vehicle_number,
        vehicle_type,
        capacity,
        status: status || 'available',
        driver_id: driver_id || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
const updateVehicle = async (req, res, next) => {
  const { id } = req.params;
  const { vehicle_number, vehicle_type, capacity, status, driver_id } = req.body;

  try {
    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check vehicle number unique
    if (vehicle_number) {
      const [existing] = await db.query(
        'SELECT * FROM vehicles WHERE vehicle_number = ? AND id != ?',
        [vehicle_number, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
      }
    }

    // Check driver availability if driver_id is changing
    if (driver_id !== undefined && driver_id !== null) {
      const [existingDriver] = await db.query(
        'SELECT * FROM vehicles WHERE driver_id = ? AND id != ?',
        [driver_id, id]
      );
      if (existingDriver.length > 0) {
        return res.status(400).json({ success: false, message: 'Driver is already assigned to another vehicle' });
      }
    }

    // Update
    await db.query(
      `UPDATE vehicles 
       SET vehicle_number = COALESCE(?, vehicle_number),
           vehicle_type = COALESCE(?, vehicle_type),
           capacity = COALESCE(?, capacity),
           status = COALESCE(?, status),
           driver_id = ?
       WHERE id = ?`,
      [vehicle_number, vehicle_type, capacity, status, driver_id === undefined ? vehicles[0].driver_id : driver_id, id]
    );

    const [updatedVehicle] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
const deleteVehicle = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await db.query('DELETE FROM vehicles WHERE id = ?', [id]);

    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle };
