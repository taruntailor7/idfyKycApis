// Import required modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db =require('./public/database');
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

app.post('/insertOrUpdateUserInfo',async (req, res) => {
    const referenceId = req.body.referenceId;
    const data = JSON.parse(req.body.data);
    const name = data.name;
    let response = await db.updateUserDetails(referenceId, data);
    if(response === 'Added') {
        res.status(200).send('User information Added');
    } else {
        res.status(500).send(response);
    }

});

app.post('/verifyPanDetails', (req, res) => {
    const imageBase = req.body.panImage;
    var request = require('request');
    var options = {
        'method': 'POST',
        'url': 'https://eve.idfy.com/v3/tasks/async/extract/ind_pan',
        'headers': {
            'Content-Type': 'application/json',
            'account-id': '123/123456',
            'api-key': '12345'
        },
        body: JSON.stringify({
            "task_id": "1",
            "group_id": "2",
            "data": {
                "document1":imageBase
            }
        })

    };
    request(options, function (error, response) {
        if (error)  return res.status(500).send({ error: err, message: err.message });
        console.log(response.body);
        res.send({status:'Success',message: 'Added Successfully'});
    });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
