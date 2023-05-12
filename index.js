// Import required modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./public/database');
const request = require('request');
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

const { API_KEY, ACCOUNT_ID, IDFY_API_URL } = process.env;

app.get('/getUserInfo', async (req, res) => {
    const referenceId = req.query.referenceId;
    let response = await db.getUserDetails(referenceId);
    if (typeof response !== 'object') {
        res.status(500).send({ response: false });
    } else {
        res.status(200).send({response: response});
    }
});

app.post('/signUp',async (req, res) => {
    const email = req.body.email;
    const imageUrl = req.body.imageUrl;
    let response = await db.signUp(email, imageUrl);
    if (response === 'Record Added') {
        res.status(200).send({response: true});
    } else {
        res.status(500).send({response: response});
    }
});

app.post('/logIn',async (req, res) => {
    const email = req.body.email;
    const imageUrl = req.body.imageUrl;
    let response = await db.logIn(email, imageUrl);
    if (response === 'Login Successful') {
        res.status(200).send({response: true});
    } else {
        res.status(500).send({response: response});
    }
});

app.post('/resetUserInfo',async (req, res) => {
    const referenceId = req.body.referenceId;
    let response = await db.resetUser(referenceId);
    if (response === 'Record Cleared') {
        res.status(200).send({response: true});
    } else {
        res.status(500).send({response: false});
    }
});

app.post('/insertOrUpdateUserInfo', async (req, res) => {
    const referenceId = req.body.referenceId;
    const data = JSON.parse(req.body.data);
    let response = await db.updateUserDetails(referenceId, data);
    if (response === 'Added') {
        res.status(200).send({response: true});
    } else {
        res.status(500).send({response: false});
    }

});

app.post('/verifyIdDetails', async (req, res) => {
    const imageUrl = req.body.panImage;
    const referenceId = req.body.referenceId;
    const typeOfDocument = req.body.typeOfDocument;
    let responseForVlaidationPan = '';
    // Comment 1 - This part contains extraction API call which we fetch extracted data for PAN.
    // var options = {
    //     'method': 'POST',
    //     'url': `${idfyApiUrl}/v3/tasks/async/extract/ind_pan`,
    //     'headers': {
    //         'Content-Type': 'application/json',
    //         'account-id': ACCOUNT_ID,
    //         'api-key': API_KEY
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

    // Comment 2 - This part contains dummy response of verifing documents
    // let requestIdForPanIsValidReq = verifyIfPanIsValidPanDummy;
    // let requestIdForPanIsValidReqGetStatus = verifyIfPanIsValidPanDummyGetStatus;
    // let requestIdForValidationPan = requestIdForPanIsValidReq['request_id'];
    // let responseForVlaidationPan = requestIdForPanIsValidReqGetStatus[requestIdForValidationPan];
    // if ('is_readable' in responseForVlaidationPan) {
    //     if (!responseForVlaidationPan['is_readable']) {
    //         res.status(200).send('Invalid Pan');
    //     } else {
    //         console.log('Content is readable');
    //     }
    // } else {
    //     res.status(501).send('Issue in verifing Pan');
    // }

    // Sending request to verify ID entered.
    var options = {
        'method': 'POST',
        'url': `${IDFY_API_URL}/v3/tasks/async/validate/document`,
        'headers': {
            'Content-Type': 'application/json',
            'account-id': ACCOUNT_ID,
            'api-key': API_KEY
        },
        body: JSON.stringify({
            "task_id": "74f4c926-250c-43ca-9c53-453e87ceacd1",
            "group_id": "8e16424a-58fc-4ba4-ab20-5bc8e7c3c41e",
            "data": {
                "document1": imageUrl,
                "doc_type": typeOfDocument,
                "advanced_features": {
                    "detect_doc_side": false
                }
            }
        })

    };
    let requestId = '';
    request(options, async function (error, response) {
        if (error) throw new Error(error);
        let body = JSON.parse(response.body);
        requestId = body.request_id;
        var options = {
            'method': 'GET',
            'url': `${IDFY_API_URL}/v3/tasks?request_id=${requestId}`,
            'headers': {
                'api-key': API_KEY,
                'Content-Type': 'application/json',
                'account-id': ACCOUNT_ID
            }
        };
        setTimeout(function () {
            // Your code here
            request(options, async function (error, responseForCheckingPanResponse) {
                if (error) throw new Error(error);
                console.log(JSON.stringify(responseForCheckingPanResponse.body, null, 5));
                responseForVlaidationPan = responseForCheckingPanResponse ? responseForCheckingPanResponse.body : null;
                responseForVlaidationPan = JSON.parse(responseForVlaidationPan);
                if (responseForVlaidationPan && responseForVlaidationPan[0].result) {
                    if (responseForVlaidationPan[0].result.readability) {
                        if (responseForVlaidationPan[0].result.readability.confidence < 50) {
                            return res.status(200).send({ response: 'false' });
                        }
                    } else {
                        return res.status(501).send({ response: 'false' });
                    }
                } else {
                    return res.status(501).send({ response: 'false' });
                }
                let data = {
                    'pan': imageUrl
                }
                console.log(JSON.stringify(data, null, 5) + ' - data');
                let responseAfterInsertion = await db.updateUserDetails(referenceId, data);
                if (responseAfterInsertion === 'Added') {
                    return res.status(200).send({ response: 'true' });
                } else {
                    return res.status(500).send({ response: 'false' });
                }
            });
        }, 7000);
    });

});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
