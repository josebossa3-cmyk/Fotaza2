require ('dotenv').config({path:'../.env'});
const { Pool } = require('pg');

const pool = new Pool({
host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432
});

pool.connect()
    .then(() => {
    console.log('Conexión a la base de datos exitosa')
    })
    .catch((err) => {
    console.error('Error al conectar a la base de datos', err)
})
module.exports = pool;