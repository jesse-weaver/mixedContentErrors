// get the client
const mysql = require('mysql2/promise');

let pool;

const getPool = () => {
  // create the connection
  if (pool) {
	  return pool;
  }
  pool = mysql.createPool({
    host: 'localhost',
    user: 'catnip',
    password: 'catnip',
    database: 'catnip',
    connectionLimit: 2,
    debug: false,
    waitForConnections: true
  });

  return pool;
};

const closeConnections = () => {
  pool.end(function (err) {
    // all connections in the pool have ended
    if (err) {
      console.log('could not close connections: ', err);
    }
  });
}

async function getPubs() {
  const [rows] = await getPool().execute('SELECT * FROM publisher');
  return rows;
}

async function getSiteScan() {
  const [rows] = await getPool().execute('SELECT MAX(id) as siteScanId FROM site_scan');
  return rows;
}

async function insertSiteScan(name) {
  const sql = "INSERT INTO site_scan SET ?";
  getPool().query(sql, { name: name }, (err, results) => {
    if (err) {
      throw err;
    }
  });
};

async function insertStatus(fetchResults) {
  const sql = "INSERT INTO publisher_response (publisher_id, site_scan_id, status_code, error_code) VALUES ?";
  getPool().query(sql, [fetchResults], function(err) {
    if (err) throw err;
  });
};

async function insertMixContentError(mixedContentErrors) {
  const sql = "INSERT INTO mixed_content_errors (publisher_error_id, site_scan_id, type, value ) VALUES ?";
  getPool().query(sql, [mixedContentErrors], function(err) {
    if (err) throw err;
  });
};


module.exports = {
  closeConnections,
  getPool,
  getPubs,
  getSiteScan,
  insertMixContentError,
  insertSiteScan,
  insertStatus
};
