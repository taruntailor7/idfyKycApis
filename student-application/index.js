/* eslint-disable consistent-return */
/* eslint-disable linebreak-style */
/* eslint-disable no-shadow */
/* eslint-disable linebreak-style */
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

require('dotenv').config();

const dbConfig = {
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool(dbConfig);

const app = express();

app.set('view engine', 'pug');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('student-form');
});

app.get('/studentdetails', (req, res) => {
  const studentList = [];
  pool.getConnection((error, connection) => {
    if (error) {
      throw error;
    }

    const sql = 'SELECT * FROM students';
    connection.query(sql, (error, result) => {
      connection.release();
      if (error) {
        throw error;
      } else if (result !== 0) {
        for (let i = 0; i < result.length; i += 1) {
          const studentDetails = {
            studentid: result[i].studentid,
            firstname: result[i].first_name,
            lastname: result[i].last_name,
            age: result[i].age,
            branch: result[i].branch,
            email: result[i].email,
            phone: result[i].phone,
            gender: result[i].gender,
          };

          studentList.push(studentDetails);
        }
      }

      res.render('student-details', { studentList });
    });
  });
});

app.post('/handleForm', (req, res) => {
  pool.getConnection((error, connection) => {
    try {
      if (error) {
        throw error;
      }

      const sql = `INSERT INTO students (studentid, first_name, last_name, branch, email, phone, gender, age) VALUES ('${req.body.studentid}', '${req.body.firstname}', '${req.body.lastname}', '${req.body.branchname}', '${req.body.email}', '${req.body.phone}', '${req.body.gender}', ${req.body.age})`;

      connection.query(sql, (queryError) => {
        if (queryError) {
          console.log('sql error');
          return (res.status(500).json());
        }
        res.status(201).send('successfully submited');
      });
    } catch (err) {
      return res.status(500).send({ error: err, message: err.message });
    }
  });
});

app.listen(3000, () => {
});
