// get the client
const mysql = require('mysql2/promise');

// create the connection to database
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'catnip',
//   password: 'catnip',
//   database: 'catnip'
// });


async function getPubs() {
  // get the client
  const mysql = require('mysql2/promise');
  // create the connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'catnip',
    password: 'catnip',
    database: 'catnip'
  });
  // query database
  const [rows] = await connection.execute('SELECT * FROM `publisher`');

  connection.end();


  return rows;
}

module.exports = {
  getPubs
};
