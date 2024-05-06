const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.use(bodyParser.json());

mongoose.connect('mongodb+srv://sdeepakncy:deepaksharma@cluster0.sdlfzzw.mongodb.net/fileUploadDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;

const fileSchema = new mongoose.Schema({
  url: String,
  type: String
});
const File = mongoose.model('File', fileSchema);


// User schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    host: String
  });
  
  const User = mongoose.model('User', userSchema);
  
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const newFile = new File({ url: req.file.path, type: req.file.mimetype });
    await newFile.save();
    res.status(201).json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);
    console.log('File Path:', filePath);
    
    // Create a readable stream to read the file
    const fileStream = fs.createReadStream(filePath);

    // Pipe the file stream to the response
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
    const { username, password, host } = req.body;
    const user = await User.findOne({ username }); 
    if (user && user.password === password) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});




app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
