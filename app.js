const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var cors = require('cors')
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors())
app.use(bodyParser.json());

app.use('/uploads', express.static('uploads'));
// const upload = multer({ dest: 'uploads/' });

const connectionSchema = new mongoose.Schema({
    username: String,
    password: String,
    dbName: String,
    clusterURL: String
});

const Connection = mongoose.model('Connection', connectionSchema);

const fileSchema = new mongoose.Schema({
    url: String,
    type: String
  });
  const File = mongoose.model('File', fileSchema);

app.post('/connect-mongodb', async (req, res) => {
    const { username, password, dbName, clusterURL } = req.body;
    console.log("username =",username,password,dbName,clusterURL)

    try {
        const uri = `mongodb+srv://${username}:${password}@${clusterURL}/${dbName}?retryWrites=true&w=majority`;
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        const connectionDetails = new Connection({
            username,
            password,
            dbName,
            clusterURL
        });

        await connectionDetails.save();

        console.log('Connection details saved to the database');

        res.json({ success: true, message: 'Connected to MongoDB and connection details saved' });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        res.status(500).json({ success: false, message: 'Failed to connect to MongoDB' });
    }
});


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
  console.log('upload file is running =',req.file)
  try {
    const newFile = new File({ url: req.file.path, type: req.file.mimetype });
    const newFile = new File({ url: newFilePath, type: req.file.mimetype });
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
  
//   app.get('/files/:filename', (req, res) => {
//     console.log("dir name =",__dirname,req.params)
//     try {
//       const { filename } = req.params;
//       const filePath = path.join(__dirname, 'uploads', filename);
//       console.log('File Path:', filePath);
      
//       // Create a readable stream to read the file
//       const fileStream = fs.createReadStream(filePath);
  
//       // Pipe the file stream to the response
//       fileStream.pipe(res);
//     } catch (err) {
//       console.error('Error reading file:', err);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });


app.get('/files/:filename', (req, res) => {
    console.log("dir name =", __dirname, req.params)
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, 'uploads', filename);
        console.log('File Path:', filePath);

        // Check the file extension to determine the parsing method
        const ext = path.extname(filename).toLowerCase();

        if (ext === '.xlsx') {
            // Parse Excel file
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            res.json(jsonData);
        } else if (ext === '.csv') {
            // Parse CSV file
            const jsonArray = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => jsonArray.push(data))
                .on('end', () => res.json(jsonArray));
        } else {
            // Unsupported file format
            res.status(400).json({ message: 'Unsupported file format' });
        }
    } catch (err) {
        console.error('Error reading file:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



// app.post('/upload', upload.single('file'), (req, res) => {
//     const filePath = req.file.path;
//     const fileExtension = req.file.originalname.split('.').pop();
//     console.log('upload file is running =',filePath,fileExtension)

//     let parser;
//     if (fileExtension === 'csv') {
//         parser = fs.createReadStream(filePath).pipe(csv());
//     } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
//         const workbook = xlsx.readFile(filePath);
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const sheetData = xlsx.utils.sheet_to_json(sheet);
//         parser = sheetData;
//         console.log("parse sheet data =",parser)
//     } else {
//         return res.status(400).send('Unsupported file format');
//     }

//     // const data = [];
//     // parser.on('data', (row) => {
//     //     // Process each row and push to data array
//     //     data.push(row);
//     // });

//     // parser.on('end', async () => {
//     //     try {
//     //         // Insert data into MongoDB
//     //         await DataModel.insertMany(data);
//     //         res.send('Data uploaded successfully');
//     //     } catch (err) {
//     //         res.status(500).send(err.message);
//     //     }
//     // });
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
