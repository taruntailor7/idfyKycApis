require('dotenv').config();

const dbOpen  ='USE student_db';
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

async function addRecord(query, cb) {
    await executeCommand(query).then((data) => cb(data)).catch((error) => {
      console.error('error:: ', error);
      cb('error');
    });
  }

  function executeCommand(query, cb) {
    return new Promise((resolve, reject) => {
        pool.query(dbOpen, (error, results) => {
            pool.query(query, (error, result) => {
            if(error) {
                reject(error);
            }
          resolve(result);
        });
      });
    });
  }


module.exports.updateUserDetails = async function updateUserDetails(referenceId, data) {
    let checkReferceIdPresentQuery = `select count(*) as recordsCount from student_db.usersInfo where referenceId='${referenceId}';`;
    let updateStatus = '';
    await addRecord(checkReferceIdPresentQuery, async (result) => {
        if(result === 'error') {
            updateStatus = 'error';
        }
        if (result !== null && result.length >= 0) {
            let count = result[0].recordsCount;
            let query='';
            for(let key in data) {
                query+=`${key}='${data[key]}', `;
            }
            query=query.slice(0,query.length-2)
            if(count > 0) {
                query = `update student_db.usersInfo set `+query+` where referenceId='${referenceId}';`;
            } else {
                query = `insert into student_db.usersInfo set `+query+`, referenceId='${referenceId}';`;
            }
            console.log(query+ ' - query');
            await addRecord(query, async (result) => {
                if(result === 'error') {
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
