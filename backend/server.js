// This is the backend, accessing the DB
require('dotenv').config(); // stores the link for your mongo in your .env file
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI; // from .env file

mongoose.connect(mongoUri).then(() => {console.log("Connected to MongoDB")})
.catch((err) => {console.error("Error connecting to MongoDB:", err);});

// Define a simple Mongoose schema and model (example: students).
// This is where JSON data structure is defined for MongoDB collections.
/*const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  major: String
});

// Hold the schema for the Student collection in a model.
const Student = mongoose.model('Student', studentSchema);*/

//Example route: get all students
/*app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find(); // Find all the data from the schema that will be pulled back
    res.json(students); // this is what Axios will receive
  } catch (err) {
    res.status(500).send("Error fetching students", err);
    res.status.json({ message: err.message });
    }
});

// Example route: add a new student
app.post('/api/students', async (req, res) => {
    try {
        const { name, email, major } = req.body; // Create a new student to the request body
        const student = new Student({ name, email, major });
        const saved = await student.save(); // use await to make sure it finishes before moving on
        res.status(201).json(saved); // make sure that key value pairs are sent back as JSON
                                    // 201 means something was created
    }
    catch (err) {
        console.error("Error saving student:", err);
        res.status(500).json({ message: "Error saving student"});
    }
});*/

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});