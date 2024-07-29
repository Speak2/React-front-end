const express = require('express');
const { Pool } = require('pg');
const multer = require('multer'); 

const app = express();
const port = 3000;

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'my_database',
  password: 'p@stgress',
  port: 5433,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to the database');
  }
});

// Middleware
app.use(express.json());

// Set up multer for file uploads



// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Routes
// User registration
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, password]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (user.password === password) {
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User update
// User update
app.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING *',
      [username, email, password, id]
    );
    if (result.rows.length > 0) {
      res.json({ message: 'User updated successfully', user: result.rows[0] });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User delete
app.delete('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'User deleted successfully', user: result.rows[0] });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
  }
});

const upload = multer({ storage: storage });

// Image upload
app.post('/upload/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;

  try {
    // First, get the current user data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      // If no user found, delete the uploaded file and return an error
      fs.unlinkSync(path.join(__dirname, imageUrl));
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's image_url in the database
    const result = await pool.query(
      'UPDATE users SET image_url = $1 WHERE id = $2 RETURNING *',
      [imageUrl, id]
    );

    res.json({ message: 'Image uploaded successfully', user: result.rows[0] });
  } catch (err) {
    // If there's an error, delete the uploaded file
    fs.unlinkSync(path.join(__dirname, imageUrl));
    res.status(500).json({ error: err.message });
  }
});













// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});