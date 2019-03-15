// get the client
const mysql = require('mysql2/promise');

// create the connection to database
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'catnip',
//   password: 'catnip',
//   database: 'catnip'
// });
let pool;


async function getPubs() {
  // create the connection
  // query database
  const [rows] = await getPool().execute('SELECT * FROM `publisher`');

  return rows;
}

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
    connectionLimit: 5,
    debug: false,
    waitForConnections: true
  });

  return pool;
};


async function insertStatus(fetchResults) {
  const sql = "INSERT INTO publisher_error (publisher_id, status_code, too_many_redirects) VALUES ?";

  try {
      getPool().query(sql, [fetchResults], function(err) {
    console.log('turkey')
        if (err) throw err;
      });
  } catch (error) {
      console.log('DB error while trying to insert this data:', fetchResults)
      console.log(error);
  }
};
async function insertMixContentError(mixedContentErrors) {
  const sql = "INSERT INTO mixed_content_errors (publisher_error_id, type, value ) VALUES ?";

  try {
      getPool().query(sql, [mixedContentErrors], function(err) {
        if (err) throw err;
      });
  } catch (error) {
      console.log('DB error while trying to insert this data:', mixedContentErrors)
      console.log(error);
  }
};
module.exports = {
  getPool,
  insertStatus,
  getPubs,
  insertMixContentError
};
