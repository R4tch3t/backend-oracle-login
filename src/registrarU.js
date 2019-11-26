const http = require('http');
const hostname = '0.0.0.0';
const port = 3010;
const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  req.setEncoding('utf8');

  let inJSON = '';
  let outJSON = {};
  let connection;

  async function con() {
  try {
    // Get a non-pooled connection
    connection = await oracledb.getConnection(dbConfig);
    
    sql = `SELECT * FROM testusers WHERE correo='${inJSON.correo}'`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT // query result format
      // extendedMetaData: true,   // get extra metadata
      // fetchArraySize: 100       // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    if (result.rows[0]!==undefined&&result.rows[0].CORREO === inJSON.correo){
       outJSON.error.name = 'error01'
    }else{

      // Insert some data

      sql = `INSERT INTO testusers VALUES (:1, :2, :3, :4, :5)`;

      binds = [
        [null, `${inJSON.nombre}`, 
        `${inJSON.correo}`, 
        parseInt(inJSON.edad),
        `${inJSON.pass}`]
      ];

      // For a complete list of options see the documentation.
      options = {
        autoCommit: true,
        // batchErrors: true,  // continue processing even if there are data errors
        bindDefs: [
          { type: oracledb.NUMBER },
          { type: oracledb.STRING, maxSize: 128 },
          { type: oracledb.STRING, maxSize: 128 },
          { type: oracledb.NUMBER },
          { type: oracledb.STRING, maxSize: 64 }
        ]
      };

      result = await connection.executeMany(sql, binds, options);

      console.log("Number of rows inserted:", result.rowsAffected);

      // Query the data

      sql = `SELECT * FROM testusers WHERE correo='${inJSON.correo}'`;

      binds = {};

      // For a complete list of options see the documentation.
      options = {
        outFormat: oracledb.OUT_FORMAT_OBJECT   // query result format
        // extendedMetaData: true,   // get extra metadata
        // fetchArraySize: 100       // internal buffer allocation size for tuning
      };

      result = await connection.execute(sql, binds, options);

      console.log("Column metadata: ", result.metaData);
      console.log("Query results: ");
      console.log(result.rows);
      outJSON = result.rows;
      console.log(`nombre: ${inJSON.nombre}`);
      console.log(`pass: ${inJSON.pass}`);
      console.log('Connection was successful!');
    }
  //  outJSON = JSON.stringify(outJSON);
    //res.end(`${outJSON}`); 
  } catch (err) {
    console.error(err);
  } finally {

    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }

  }
  }
  
  req.on('data', (chunk) => {
   inJSON += chunk;
  }).on('end', () => {
    outJSON.error = {};
    console.log(inJSON)
    try{
      inJSON = JSON.parse(inJSON);
      outJSON.error.name='none';
      outJSON.error.name2='none';

      
    }catch(e){
        console.log(`error: ${e}`);
        outJSON.error.name=`${e}`;
    }
    if (inJSON.nombre !== undefined) {
      con().then(()=>{
        
          outJSON = JSON.stringify(outJSON);
          res.end(`${outJSON}`);
        
      })
    }else{
      res.end();
    }
  });

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

    