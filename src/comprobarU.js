const http = require('http');
const hostname = '0.0.0.0';
const port = 3011;
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
    
    sql = `SELECT * FROM testusers WHERE correo='${inJSON.nombre}' OR nombre='${inJSON.nombre}'`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT // query result format
      // extendedMetaData: true,   // get extra metadata
      // fetchArraySize: 100       // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    if (result.rows[0]!==undefined){
      if (result.rows[0].PASS === inJSON.pass){
        outJSON = result.rows
      }else{
        outJSON.error.name = 'error01'
      }
    }else{
      outJSON.error.name = 'error02'
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
   // console.log(inJSON)
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

    