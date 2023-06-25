const mariadb = require('mariadb');
const { datasource } = require('../config');

const pool = mariadb.createPool({
    host: datasource.host, 
    port: datasource.port, 
    user: datasource.user, 
    password: datasource.password, 
    database: datasource.database,
    connectionLimit: 5
});

const insertQuery = `INSERT INTO SERVER_HISTORY (
    time, ip, cpu, thread_count, memory, heap_used, heap_commited
) VALUES (
    now(), ?, ?, ?, ?, ?, ?
) ON DUPLICATE KEY UPDATE
    time = now()`;


module.exports = {
    async addHistory({ip, cpu, memory, heapUsed, heapCommitted}) {
        let conn, result;
        try{
            conn = await pool.getConnection();
            result = await conn.query(insertQuery, [ip, cpu, -1, memory, heapUsed, heapCommitted]);
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            if (conn) conn.end();
            return result;
        }
    }
}