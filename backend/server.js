const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const { parse, format } = require('date-fns');
const { authenticateUser, verifyToken } = require('./auth');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let data = [];

async function loadData() {
  const fileContent = await fs.readFile('data.csv', 'utf-8');
  const rows = fileContent.split('\n');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split('\t');
    if (row.length === 9) {
      data.push({
        Day: parse(row[0], 'dd/MM/yyyy', new Date()),
        Age: row[1],
        Gender: row[2],
        A: parseInt(row[3]),
        B: parseInt(row[4]),
        C: parseInt(row[5]),
        D: parseInt(row[6]),
        E: parseInt(row[7]),
        F: parseInt(row[8])
      });
    }
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const token = authenticateUser(username, password);
  if (token) {
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = userId;
  next();
}

app.get('/api/data', authMiddleware, (req, res) => {
  const { start_date, end_date, age, gender } = req.query;

  let filteredData = data;

  if (start_date && end_date) {
    const startDate = parse(start_date, 'yyyy-MM-dd', new Date());
    const endDate = parse(end_date, 'yyyy-MM-dd', new Date());
    filteredData = filteredData.filter(item => item.Day >= startDate && item.Day <= endDate);
  }

  if (age && age !== 'all') {
    filteredData = filteredData.filter(item => item.Age === age);
  }

  if (gender && gender !== 'all') {
    filteredData = filteredData.filter(item => item.Gender === gender);
  }

  const formattedData = filteredData.map(item => ({
    ...item,
    Day: format(item.Day, 'yyyy-MM-dd')
  }));

  res.json(formattedData);
});

app.listen(port, async () => {
  await loadData();
  console.log(`Server running at http://localhost:${port}`);
});