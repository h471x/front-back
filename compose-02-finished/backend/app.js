const fs = require('fs');
const path = require('path');

const express = require('express'); // framework restful API
const mongoose = require('mongoose'); // database
const bodyParser = require('body-parser');
const morgan = require('morgan'); // morgan is the middleware for front-end logs

const Goal = require('./models/goal');

const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'), // this for the log file of front-end
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/goals', async (req, res) => {
  console.log('TRYING TO FETCH GOALS');
  try {
    const goals = await Goal.find();
    res.status(200).json({
      goals: goals.map((goal) => ({
        id: goal.id,
        text: goal.text,
      })),
    });
    console.log('FETCHED GOALS');
  } catch (err) {
    console.error('ERROR FETCHING GOALS');
    console.error(err.message);
    res.status(500).json({ message: 'Failed to load goals.' });
  }
});

app.post('/goals', async (req, res) => {
  console.log('TRYING TO STORE GOAL');
  const goalText = req.body.text;

  if (!goalText || goalText.trim().length === 0) {
    console.log('INVALID INPUT - NO TEXT');
    return res.status(422).json({ message: 'Invalid goal text.' });
  }

  const goal = new Goal({
    text: goalText,
  });

  try {
    await goal.save();
    res
      .status(201)
      .json({ message: 'Goal saved', goal: { id: goal.id, text: goalText } });
    console.log('STORED NEW GOAL');
  } catch (err) {
    console.error('ERROR FETCHING GOALS');
    console.error(err.message);
    res.status(500).json({ message: 'Failed to save goal.' });
  }
});

app.delete('/goals/:id', async (req, res) => {
  console.log('TRYING TO DELETE GOAL');
  try {
    await Goal.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Deleted goal!' });
    console.log('DELETED GOAL');
  } catch (err) {
    console.error('ERROR FETCHING GOALS');
    console.error(err.message);
    res.status(500).json({ message: 'Failed to delete goal.' });
  }
});

mongoose.connect( // this take the environment process.env.MONGODB_USERNAME
  `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@mongodb:27017/course-goals?authSource=admin`,
  { // below this is the service name as in the docker-compose file
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB'); // docker container logs
      console.error(err);
    } else {
      console.log('CONNECTED TO MONGODB!!'); // we can view this log in docker logs
      app.listen(80);
    }
  }
);
