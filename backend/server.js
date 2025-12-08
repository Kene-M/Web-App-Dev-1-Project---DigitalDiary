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
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  lastEdited: { type: Date, default: Date.now }
});

const replySchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  lastEdited: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);
const Reply = mongoose.model('Reply', replySchema);


//Add Routes
//Authentication routes --> i believe we will have to makde seprate gegister and login routes
app.post('/api/auth/register', async (req, res) => {
 //will prob have to change 
})

app.post('/api/auth/login', async (req, res) => {
  //will prob have to change 
})

//Posts routes
//all posts
app.get('/api/posts', async (req, res) => {
  try {
    // Fetch all posts and populate author info
    const posts = await Post.find()
      .populate('author', 'username')
      .sort({ dateCreated: -1 }); // Most recent first
    res.json(posts);
  } catch (err) {
    res.status(500).send("Error fetching posts...", err);
    res.status.json({ message: err.message });
  }

})

//single post by id
app.get('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).populate('author', 'username');
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json(post);
  } catch (err) {
    res.status(500).send("Error fetching post...", err);
    res.status.json({ message: err.message });
  }
})

//create post - route should be /api/posts (no :id like we had in proposal)
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, authorId } = req.body; // Create a new post to the request body

    //validate input
    if (!title || !content || !authorId) {
      return res.status(400).json({ message: "Title, content, and author are required" });
    }

    //create the post
    const post = new Post({
      title,
      content,
      author: authorId
    });

    const saved = await post.save(); // use await to make sure it finishes before moving on
    const populatedPost = await Post.findById(saved._id).populate('author', 'username');
    res.status(201).json(populatedPost); // make sure that key value pairs are sent back as JSON
  } catch (err) {
    console.error("Error saving post:", err);
    res.status(500).json({ message: "Error saving post"});
  }
  
})

//edit post
app.put('/api/posts/:id', async (req, res) => {
  try{
    const postId = req.params.id;
    const { title, content, authorId } = req.body;
    
    //find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    //check if user is the author
    if (post.author.toString() !== authorId) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }
    
    //update post
    post.title = title || post.title;
    post.content = content || post.content;
    post.lastEdited = Date.now();
    
    const updated = await post.save();
    const populatedPost = await Post.findById(updated._id).populate('author', 'username');
    
    res.json(populatedPost);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Error updating post" });
  }
  
})

//delete post
app.delete('/api/posts/:id', async (req, res) => {
  try{
    const postId = req.params.id;
    const { authorId } = req.body;
    
    //find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    //check if user is the author
    if (post.author.toString() !== authorId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }
    
    //delete all replies to this post first
    await Reply.deleteMany({ postId: postId });
    
    //delete the post
    await Post.findByIdAndDelete(postId);
    
    res.json({ message: "Post and associated replies deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
})

//Reply routes
//view replies for a post
app.get('/api/posts/:id/replies', async (req, res) => {
  try{
    const postId = req.params.id;
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Fetch replies
    const replies = await Reply.find({ postId })
      .populate('author', 'username')
      .sort({ dateCreated: 1 }); // Oldest first
    
    res.json(replies);
  } catch (err) {
    console.error("Error fetching replies:", err);
    res.status(500).json({ message: "Error fetching replies" });
  }
})

//post reply - removed the second :id like we had in proposal bc Mongo has built in _id
app.post('/api/posts/:id/replies', async (req, res) => {
  try{
    const postId = req.params.id;
    const { content, authorId } = req.body;
    
    //validate input
    if (!content || !authorId) {
      return res.status(400).json({ message: "Content and author are required" });
    }
    
    //check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    //create reply
    const reply = new Reply({
      postId,
      author: authorId,
      content
    });
    
    const saved = await reply.save();
    const populatedReply = await Reply.findById(saved._id).populate('author', 'username');
    
    res.status(201).json(populatedReply);
  } catch (err) {
    console.error("Error saving reply:", err);
    res.status(500).json({ message: "Error saving reply" });
  }
})

//edit reply
app.put('/api/posts/:id/replies/:replyId', async (req, res) => {
  try{
      const { replyId } = req.params;
    const { content, authorId } = req.body;
    
    //find the reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    
    //check if user is the author
    if (reply.author.toString() !== authorId) {
      return res.status(403).json({ message: "You can only edit your own replies" });
    }
    
    //update reply
    reply.content = content;
    reply.lastEdited = Date.now();
    
    const updated = await reply.save();
    const populatedReply = await Reply.findById(updated._id).populate('author', 'username');
    
    res.json(populatedReply);
  } catch (err) {
    console.error("Error updating reply:", err);
    res.status(500).json({ message: "Error updating reply" });
  }
})

//delete reply
app.delete('/api/posts/:id/replies/:replyId', async (req, res) => {
  try{
    const { replyId } = req.params;
    const { authorId } = req.body;
    
    // Find the reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    
    // Check if user is the author
    if (reply.author.toString() !== authorId) {
      return res.status(403).json({ message: "You can only delete your own replies" });
    }
    
    // Delete the reply
    await Reply.findByIdAndDelete(replyId);
    
    res.json({ message: "Reply deleted successfully" });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ message: "Error deleting reply" });
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