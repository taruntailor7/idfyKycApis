const util = require('util');

require('dotenv').config();
const { DB_NAME, DB_TABLE_NAME, DB_LOGIN_TABLE_NAME } = process.env;
const { API_KEY, ACCOUNT_ID, IDFY_API_URL } = process.env;
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
const request = require('request');


const pool = mysql.createPool(dbConfig);

async function executeQueryCommand(query, cb) {
    await executeQuery(query).then((data) => cb(null, data)).catch((error) => {
        console.error('error:: ', error);
        cb('error', null);
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
    let userObj = null;
    await executeQueryCommand(query, async (error, result) => {
        if (result === 'error') {
            userObj = null;
        }
        if (result !== null && result.length >= 0) {
            userObj = result[0];
            console.log(JSON.stringify(userObj, null, 5) + ' - userObj');
        } else {
            userObj = null;
        }
    });
    return userObj;
};

module.exports.resetUser = async function resetUser(referenceId) {
    let checkRecordPresentToReset = `select count(*) as recordsCount from ${DB_NAME}.${DB_TABLE_NAME} where referenceId=${referenceId};`;
    let updateStatus='';
    console.log(checkRecordPresentToReset, ' -  checkRecordPresentToReset');
    await executeQueryCommand(checkRecordPresentToReset, async (error, result) => {
        if (result === 'error') {
            updateStatus = 'error';
        }
        console.log(result);
        if (result !== null && result.length >= 0) {
            let count = result[0].recordsCount;
            let resetUserInfoQuery = '';
            if (count <= 0) {
                updateStatus = 'User not present';
            } else {
                resetUserInfoQuery = `delete from ${DB_NAME}.${DB_TABLE_NAME} where referenceId='${referenceId}';`;
                await executeQueryCommand(resetUserInfoQuery, async (result) => {
                    if (result === 'error') {
                        updateStatus = 'error';
                    } else {
                        updateStatus = 'Record Cleared';
                    }
                });
            }
        } else {
            updateStatus = 'some issue in fetching data from db';
        }
    });
    return updateStatus;
}

module.exports.signUp = async function signUp(email, imageUrl) {
    let updateStatus = '';
    let checkRecordsAlreadyPresentForEmail = `select count(*) as recordsCount from ${DB_NAME}.${DB_LOGIN_TABLE_NAME} where email='${email}'`;
    await executeQueryCommand(checkRecordsAlreadyPresentForEmail, async (error, result) => {
        if (result === 'error') {
            updateStatus = 'error';
        }
        if (result !== null && result.length >= 0) {
            let count = result[0].recordsCount;
            let insertNewUserQuery = '';
            if (count > 0) {
                updateStatus = 'User already present';
            } else {
                insertNewUserQuery = `insert into ${DB_NAME}.${DB_LOGIN_TABLE_NAME} set email='${email}',image='${imageUrl}';`;
                await executeQueryCommand(insertNewUserQuery, async (error, result) => {
                    if (result === 'error') {
                        updateStatus = 'error';
                    } else {
                        updateStatus = 'Record Added';
                    }
                });
            }
            console.log(insertNewUserQuery + ' - insertNewUserQuery');
        } else {
            updateStatus = 'some issue in fetching data from db';
        }
    });
    return updateStatus;
}

module.exports.logIn = async function logIn(email, imageUrl) {
    console.log('database: login: email: ', email);
    let updateStatus = '';
    let checkRecordsAlreadyPresentForEmail = `select email, image from ${DB_NAME}.${DB_LOGIN_TABLE_NAME} where email='${email}'`;
    let userInfo = '';
    try {
        const executeQueryPromisified = util.promisify(executeQueryCommand);
        const result = await executeQueryPromisified(checkRecordsAlreadyPresentForEmail);
        console.log('executeQuery output: ', result);
        if (result === 'error') {
            return 'error';
        }

        if (result !== null && result.length > 0) {
            userInfo = result[0];
            console.log(JSON.stringify(result, null, 5));
            console.log(JSON.stringify(userInfo, null, 5) + ' - userObj');
            const compareFaceOptions = {
                'method': 'POST',
                'url': `${IDFY_API_URL}/v3/tasks/async/compare/face`,
                'headers': {
                    'Content-Type': 'application/json',
                    'account-id': ACCOUNT_ID,
                    'api-key': API_KEY
                },
                body: JSON.stringify({
                    "task_id": "1",
                    "group_id": "2",
                    "data": {
                        "document1": userInfo.image,
                        "document2": imageUrl
                    }
                })
    
            };
            let requestId = '';
            const requestPromisified = util.promisify(request);
            
            let compareFaceResponse = await requestPromisified(compareFaceOptions);
            console.log('compareFaceResponse: ', compareFaceResponse);
            let body = JSON.parse(compareFaceResponse.body);
            requestId = body.request_id;
            console.log(`${requestId} - requestId 123456789`);

            let sleepPromisified = util.promisify((a, f) => setTimeout(f, a))
            await sleepPromisified(5000);
            
            const getTaskOptions = {
                'method': 'GET',
                'url': `${IDFY_API_URL}/v3/tasks?request_id=${requestId}`,
                'headers': {
                    'api-key': API_KEY,
                    'Content-Type': 'application/json',
                    'account-id': ACCOUNT_ID
                }
            };
            const getTaskResponse = await requestPromisified(getTaskOptions);
            console.log('getTaskResponse: ', getTaskResponse);

            console.log(JSON.stringify(getTaskResponse ? getTaskResponse.body : null, null, 5));
            responseBodyForChecking = getTaskResponse ? getTaskResponse.body : null;
            responseBodyForChecking = JSON.parse(responseBodyForChecking);
            console.log(`${responseBodyForChecking} - responseBodyForChecking 123456789`);
            console.log(`${JSON.stringify(responseBodyForChecking[0].result)} - responseBodyForChecking.result 123456789`);
            console.log(`${responseBodyForChecking[0].result.is_a_match} - responseBodyForChecking.result 123456789`);
            if (responseBodyForChecking && responseBodyForChecking[0].result.is_a_match) {
                updateStatus ='Login Successful';
            } else {
                updateStatus =  'error in getTaskResponse, result.is_a_match not found';
                console.log(updateStatus);
            }
        } else {
            updateStatus = 'No user with provided mail Id';
        }
        console.log('Returning updateStatus: ', updateStatus);
        return updateStatus;
    }  catch(error) {
        console.log('Try catch error from execute query: ', error);
        return error;
    }
}

module.exports.updateUserDetails = async function updateUserDetails(referenceId, data) {
    let checkReferceIdPresentQuery = `select count(*) as recordsCount from ${DB_NAME}.${DB_TABLE_NAME} where referenceId='${referenceId}';`;
    let updateStatus = '';
    await executeQueryCommand(checkReferceIdPresentQuery, async (error, result) => {
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
            await executeQueryCommand(query, async (error, result) => {
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
