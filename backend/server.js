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

//define mongoose schemas and models for Posts and Replies
const postSchema = new mongoose.Schema({
  title: String,
  content: String, 
  id: String // Unique identifier for the post - is this the best way to do this?
});

const replySchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  content: String 
});

const Post = mongoose.model('Post', postSchema);
const Reply = mongoose.model('Reply', replySchema);


//Add Routes
//Authentication routes
app.get('/api/auth/register', (req, res) => {
 //will prob have to change - i dont think i was supposed to to .get
})

app.get('/api/auth/login', (req, res) => {
  //will prob have to change - i dont think i was supposed to to .get
})

//Posts routes
//all posts
app.get('/api/posts', async (req, res) => {
  try {
    //fetch all posts from DB
    const posts = await Post.find(); // Find all the data from the schema that will be pulled back
    res.json(posts); // this is what Axios will receive
  } catch (err) {
    res.status(500).send("Error fetching posts...", err);
    res.status.json({ message: err.message });
  }

})

//single post by id
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    res.json(post);
  } catch (err) {
    res.status(500).send("Error fetching post...", err);
    res.status.json({ message: err.message });
  }
})

//create post
app.post('/api/posts/:id', async (req, res) => {
  try {
    const { title, content, id } = req.body; // Create a new student to the request body
    const post = new Post({ title, content, id });
    const saved = await post.save(); // use await to make sure it finishes before moving on
    res.status(201).json(saved); // make sure that key value pairs are sent back as JSON
  } catch (err) {
    console.error("Error saving post:", err);
    res.status(500).json({ message: "Error saving post"});
  }
  
})

//edit post
app.put('/api/posts/:id', (req, res) => {
  try{

  } catch (err) {

  }
  
})

//delete post
app.delete('/api/posts/:id', (req, res) => {
  try{

  } catch (err) {
    
  }
})

//Reply routes
//view replies for a post
app.get('/api/posts/:id/replies', (req, res) => {
  try{

  } catch (err) {
    
  }
})

//post reply
app.post('/api/posts/:id/replies/:id', (req, res) => {
  try{

  } catch (err) {
    
  }
})

//edit reply
app.put('/api/posts/:id/replies/:id', (req, res) => {
  try{

  } catch (err) {
    
  }
})

//delete reply
app.delete('/api/posts/:id/replies/:id', (req, res) => {
  try{

  } catch (err) {
    
  }
})

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