const db = require('../config/db');

// @desc    Get trip reports list
// @route   GET /api/reports
// @access  Private/Admin
const getReportsList = async (req, res, next) => {
  const { range } = req.query; // daily, weekly, monthly
  let intervalDays = 1;

  if (range === 'weekly') {
    intervalDays = 7;
  } else if (range === 'monthly') {
    intervalDays = 30;
  }

  try {
    const [rows] = await db.query(
      `SELECT t.trip_uid, b.customer_name, b.pickup_location, b.drop_location, 
              b.fare_amount, t.status, t.delay_status, t.distance_covered,
              v.vehicle_number, d.name AS driver_name, b.trip_date
       FROM trips t
       JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN drivers d ON b.driver_id = d.id
       WHERE b.trip_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY b.trip_date DESC`,
      [intervalDays]
    );

    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Export reports in CSV or PDF formats
// @route   GET /api/reports/export
// @access  Private/Admin
const exportReport = async (req, res, next) => {
  const { format, range } = req.query; // format: csv, pdf; range: daily, weekly, monthly
  let intervalDays = 1;

  if (range === 'weekly') {
    intervalDays = 7;
  } else if (range === 'monthly') {
    intervalDays = 30;
  }

  try {
    const [rows] = await db.query(
      `SELECT t.trip_uid, b.customer_name, b.customer_mobile, b.pickup_location, b.drop_location, 
              b.fare_amount, t.status, t.delay_status, t.distance_covered,
              v.vehicle_number, d.name AS driver_name, DATE_FORMAT(b.trip_date, '%Y-%m-%d %H:%i') as trip_date_formatted
       FROM trips t
       JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN vehicles v ON b.vehicle_id = v.id
       LEFT JOIN drivers d ON b.driver_id = d.id
       WHERE b.trip_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY b.trip_date DESC`,
      [intervalDays]
    );

    const reportTitle = `Manivtha Travels - ${range ? range.toUpperCase() : 'DAILY'} TRIP REPORT`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${range || 'daily'}.csv`);

      let csv = 'Trip ID,Customer Name,Customer Mobile,Pickup Location,Drop Location,Fare Amount,Status,Delay Status,Distance (km),Vehicle,Driver,Trip Date\n';
      
      rows.forEach(r => {
        csv += `"${r.trip_uid}","${r.customer_name}","${r.customer_mobile}","${r.pickup_location}","${r.drop_location}",${r.fare_amount},"${r.status}","${r.delay_status}",${r.distance_covered},"${r.vehicle_number}","${r.driver_name}","${r.trip_date_formatted}"\n`;
      });

      return res.status(200).send(csv);
    } 
    
    if (format === 'pdf') {
      // Return a print-ready HTML page that will be converted/saved as PDF in the browser
      res.setHeader('Content-Type', 'text/html');
      
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 30px; }
            h1 { color: #0d47a1; text-align: center; border-bottom: 2px solid #0d47a1; padding-bottom: 10px; }
            .meta { margin-bottom: 20px; font-size: 14px; color: #555; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #0d47a1; color: white; padding: 10px; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; }
            .delayed { background-color: #ffebee; color: #c62828; }
            .on_time { background-color: #e8f5e9; color: #2e7d32; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; background-color: #0d47a1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">Print / Save to PDF</button>
          
          <h1>${reportTitle}</h1>
          <div class="meta">Generated on: ${new Date().toLocaleString()} | Total Records: ${rows.length}</div>
          
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Customer</th>
                <th>Pickup Location</th>
                <th>Drop Location</th>
                <th>Driver / Vehicle</th>
                <th>Fare</th>
                <th>Distance</th>
                <th>Delay Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
      `;

      rows.forEach(r => {
        const badgeClass = r.delay_status === 'delayed' ? 'delayed' : 'on_time';
        html += `
          <tr>
            <td><strong>${r.trip_uid}</strong></td>
            <td>${r.customer_name}<br/><span style="color:#777">${r.customer_mobile}</span></td>
            <td>${r.pickup_location}</td>
            <td>${r.drop_location}</td>
            <td>${r.driver_name}<br/><span style="color:#777; font-weight: 500">${r.vehicle_number}</span></td>
            <td>₹${r.fare_amount}</td>
            <td>${r.distance_covered} km</td>
            <td><span class="badge ${badgeClass}">${r.delay_status}</span></td>
            <td>${r.trip_date_formatted}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
          
          <div class="footer">
            © ${new Date().getFullYear()} Manivtha Tours & Travels. All rights reserved. Confidential Document.
          </div>
        </body>
        </html>
      `;

      return res.status(200).send(html);
    }

    return res.status(400).json({ success: false, message: 'Invalid format. Use csv or pdf.' });

  } catch (error) {
    next(error);
  }
};

module.exports = { getReportsList, exportReport };
