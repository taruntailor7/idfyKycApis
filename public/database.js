require('dotenv').config();
const {DB_NAME, DB_TABLE_NAME} = process.env;

const dbOpen = `USE ${DB_NAME}`;
const dbConfig = {
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3307,
};
const mysql = require('mysql');


const pool = mysql.createPool(dbConfig);

async function executeQueryCommand(query, cb) {
    await executeQuery(query).then((data) => cb(data)).catch((error) => {
        console.error('error:: ', error);
        cb('error');
    });
}

function executeQuery(query, cb) {
    return new Promise((resolve, reject) => {
        pool.query(dbOpen, (error, results) => {
            pool.query(query, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
    });
}
module.exports.getUserDetails = async function getUserDetails(referenceId, data) {
    let query = `select * from ${DB_TABLE_NAME} where referenceId=${referenceId}`;
    let userObj=null;
    await executeQueryCommand(query, async (result) => {
        if (result === 'error') {
            userObj=null;
        }
        if (result !== null && result.length >= 0) {
            userObj = result[0];
            console.log(JSON.stringify(userObj,null,5)+' - userObj');
        } else {
            userObj = null;
        }
    });
    return userObj;
};

module.exports.updateUserDetails = async function updateUserDetails(referenceId, data) {
    let checkReferceIdPresentQuery = `select count(*) as recordsCount from ${DB_NAME}.${DB_TABLE_NAME} where referenceId='${referenceId}';`;
    let updateStatus = '';
    await executeQueryCommand(checkReferceIdPresentQuery, async (result) => {
        if (result === 'error') {
            updateStatus = 'error';
        }
        if (result !== null && result.length >= 0) {
            let count = result[0].recordsCount;
            let query = '';
            for (let key in data) {
                query += `${key}='${data[key]}', `;
            }
            query = query.slice(0, query.length - 2)
            if (count > 0) {
                query = `update ${DB_NAME}.${DB_TABLE_NAME} set ` + query + ` where referenceId='${referenceId}';`;
            } else {
                query = `insert into ${DB_NAME}.${DB_TABLE_NAME} set ` + query + `, referenceId='${referenceId}';`;
            }
            console.log(query + ' - query');
            await executeQueryCommand(query, async (result) => {
                if (result === 'error') {
                    updateStatus = 'error';
                } else {
                    updateStatus = 'Added';
                }
            });
        } else {
            updateStatus = 'some issue in fetching data from db';
        }
    });
    return updateStatus;
};
