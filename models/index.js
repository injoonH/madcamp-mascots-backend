import mysql from 'mysql2';
import config from '../db_config.json' assert { type: 'json' };

const pool = mysql.createPool(config).promise();

const queryDB = async (options, values) => {
    return await pool.query(options, values);
};

export default queryDB;
