// Import required modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./public/database');
const apiUrl = process.env.idfyApiUrl;
// const verifyIfPanIsValidPanDummy=require('./DummyFiles/verifyIfPanIsValidPanDummy.json');
// const getPanRequestOutput=require('./DummyFiles/PanVerifyResponse.json');
const verifyIfPanIsValidPanDummy = require('./DummyFiles/verifyIfPanIsValidPanDummy.json');
const verifyIfPanIsValidPanDummyGetStatus = require('./DummyFiles/verifyIfPanIsValidPanDummyGetStatus.json');
require('dotenv').config()
// Create express app
const app = express();

// Set the view engine to Pug
app.engine('pug', require('pug').__express)
app.set('view engine', 'pug');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Define routes
app.get('/', (req, res) => {
    res.render('index', { title: 'My App', message: 'Welcome to my app!' });
});

app.get('/getUserInfo', async (req, res) => {
    const referenceId = req.query.referenceId;
    let response = await db.getUserDetails(referenceId);
    if (typeof response !== 'object') {
        res.status(500).send('User information Added');
    } else {
        res.status(200).send(response);
    }
});

app.post('/insertOrUpdateUserInfo', async (req, res) => {
    const referenceId = req.body.referenceId;
    const data = JSON.parse(req.body.data);
    let response = await db.updateUserDetails(referenceId, data);
    if (response === 'Added') {
        res.status(200).send('User information Added');
    } else {
        res.status(500).send(response);
    }

});

app.post('/verifyPanDetails', async (req, res) => {
    const imageUrl = req.body.panImage;
    const referenceId = req.body.referenceId;
    var request = require('request');
    // var options = {
    //     'method': 'POST',
    //     'url': `${idfyApiUrl}/v3/tasks/async/extract/ind_pan`,
    //     'headers': {
    //         'Content-Type': 'application/json',
    //         'account-id': process.env.ACCOUNT_ID,
    //         'api-key': process.env.API_KEY
    //     },
    //     body: JSON.stringify({
    //         "task_id": "1",
    //         "group_id": "2",
    //         "data": {
    //             "document1": imageUrl
    //         }
    //     })

    // };
    // let requestIdForPanReq='';
    // request(options, function (error, response) {
    //     if (error) return res.status(500).send({ error: err, message: err.message });
    //     requestIdForPanReq=res.body.request_id;
    // });
    // var request = require('request');
    // var options = {
    //     'method': 'GET',
    //     'url': `${idfyApiUrl}/v3/tasks?request_id=${requestIdForPanReq}`,
    //     'headers': {
    //         'Content-Type': 'application/json',
    //         'api-key': 'c8f847312f3d/4ef7ee93-8114-4575-9083-9a1681beb70b',
    //         'account-id': '4f2f9f97-4908-4ab7-898a-470fe8762a0d'
    //     }
    // };
    // request(options, function (error, response) {
    //     if (error) throw new Error(error);
    //     console.log(response.body);
    // });
    let requestIdForPanIsValidReq = verifyIfPanIsValidPanDummy;
    let requestIdForPanIsValidReqGetStatus = verifyIfPanIsValidPanDummyGetStatus;
    let requestIdForValidationPan = requestIdForPanIsValidReq['request_id'];
    let responseForVlaidationPan = requestIdForPanIsValidReqGetStatus[requestIdForValidationPan];
    console.log(responseForVlaidationPan);
    if ('is_readable' in responseForVlaidationPan) {
        if (!responseForVlaidationPan['is_readable']) {
            res.status(200).send('Invalid Pan');
        } else {
            console.log('Content is readable');
        }
    } else {
        res.status(501).send('Issue in verifing Pan');
    }
    if ('readability' in responseForVlaidationPan) {
        if ('confidence' in responseForVlaidationPan['readability']) {
            if (responseForVlaidationPan['readability']['confidence'] < 50) {
                res.status(200).send('Invalid Pan');
            }
        } else {
            res.status(501).send('Issue in verifing Pan');
        }
    } else {
        res.status(501).send('Issue in verifing Pan');
    }
    let data = {
        'pan':imageUrl
    }
    console.log(JSON.stringify(data,null,5)+ ' - data');
    let response = await db.updateUserDetails(referenceId, data);
    if (response === 'Added') {
        res.status(200).send('User information Added');
    } else {
        res.status(500).send(response);
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
