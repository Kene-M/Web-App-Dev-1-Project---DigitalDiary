// This is the backend, accessing the DB
require('dotenv').config(); // stores the link for your mongo in your .env file
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // for password hashing
const jwt = require('jsonwebtoken'); // for authentication tokens
const app = express();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// Connect to Database and Define Schemas/Models and static methods 
// ----------------------------------------------------
// Connect to MongoDB
const mongoUri = process.env.MONGO_URI; // from .env file

mongoose.connect(mongoUri).then(() => {
  console.log('Connected to MongoDB')
}).catch((err) => {
  console.error('Error connecting to MongoDB', err)
  process.exit(1) // exit the application if cannot connect to DB
});

//User schema and model for reference in Posts and Replies
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // This will be hashed
  dateCreated: { type: Date, default: Date.now }
});

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

// Static register method
// Static methods are called on the Model itself (User.register())
userSchema.statics.register = async function(username, email, password) {
  // Validate input
  if (!username || !email || !password) {
    throw Error('All fields must be filled')
  }
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw Error('Invalid email format')
  }

  // Check if username or email already exists
  const usernameExists = await this.findOne({ username });
  const emailExists = await this.findOne({ email });

  if (usernameExists) {
    throw Error('Username already in use')
  }

  if (emailExists) {
    throw Error('Email already in use')
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10); // generate salt for hashing
  const hashedPassword = await bcrypt.hash(password, salt); // hash the password

  // Create and return the new user
  const user = await this.create({ username, email, password: hashedPassword })

  return user;
}

// Static login method
// Static methods are called on the Model itself (User.login())
userSchema.statics.login = async function(username, password) { // Might not need to add email?
  // Validate input
  if (!username || !password) {
    throw Error('All fields must be filled')
  }

  // Find the user by username
  const user = await this.findOne({ username });
  if (!user) {
    throw Error('Incorrect username');
  }

  // Compare the provided password with the hashed password
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw Error('Incorrect password');
  }

  return user;
}

// Create models
const User = mongoose.model('User', userSchema); // Referenced in Posts and Replies
const Post = mongoose.model('Post', postSchema);
const Reply = mongoose.model('Reply', replySchema);

// ----------------------------------------------------
// INITIALIZE DATABASE (dev/test only)
// ----------------------------------------------------
// This function will populate the database with test data
// Run it ONCE manually by uncommenting the function call below, then comment it back out
const initializeDatabase = async () => {
  try {
    console.log('Clearing existing data...');

    // Remove all existing collections to avoid duplicates
    await User.deleteMany({});
    await Post.deleteMany({});
    await Reply.deleteMany({});

    console.log('Creating test users...');

    // Define two test users with hashed passwords
    const salt = await bcrypt.genSalt(10);
    const users = await User.create([
      {
        username: 'alice',
        email: 'alice@example.com',
        password: await bcrypt.hash('password123', salt)
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', salt)
      }
    ]);

    console.log('Creating test posts...');

    // Create one post per user to test ownership and permissions
    const posts = await Post.create([
      {
        author: users[0]._id, // Alice's post
        title: 'Welcome to DigitalDiary',
        content: 'This is a demo post to test core features like posting and replies.'
      },
      {
        author: users[1]._id, // Bob's post
        title: 'Learning Full-Stack Development',
        content: 'Building real projects has been the best way for me to learn.'
      }
    ]);

    console.log('Creating test replies...');

    // Each user replies to the other user's post
    // This helps test reply ownership and edit/delete rules
    await Reply.create([
      {
        postId: posts[0]._id, // Reply to Alice's post
        author: users[1]._id, // Bob replies
        content: 'Welcome! Excited to see this project grow.'
      },
      {
        postId: posts[1]._id, // Reply to Bob's post
        author: users[0]._id, // Alice replies
        content: 'Totally agree — hands-on work is key.'
      }
    ]);

    console.log('Database initialized successfully!');

    // Print a quick summary
    console.log('\nSummary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Posts: ${posts.length}`);

  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
// ----------------------------------------------------
// UNCOMMENT ONCE TO RUN, THEN COMMENT BACK OUT - No need to run if there's already data.
// ----------------------------------------------------
// initializeDatabase();



// ----------------------------------------------------
//Add Routes
// ----------------------------------------------------
// Function to create JWT token. A token will be created when user logs in or registers. 
// The purpose of the token is to verify the user's identity on subsequent requests.
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '3h' }); // token expires in 3 hours
}

// Middleware to verify JWT and attach user ID to request (for route-specific use)
const requireAuth = async (req, res, next) => {
  // verify user is authenticated
  const { authorization } = req.headers // get the authorization header

  if (!authorization) {
    return res.status(401).json({error: 'Authorization token required'})
  }

  // The token is in the format 'Bearer TOKEN', so we split it to get the actual token
  const token = authorization.split(' ')[1]

  try {
    // Verify the token using the secret
    const { _id } = jwt.verify(token, process.env.JWT_SECRET)

    // Find the user (just checking that the ID still exists) and attach the ID
    // We attach the ID to req.user so subsequent handlers can access it securely.
    req.user = await User.findOne({ _id }).select('_id') // later code expects req.user._id
    // if no user found, throw error
    if (!req.user) {
      return res.status(401).json({error: 'User no longer exists'})
    }
    
    // Move on to the route handler
    next()

  } catch (error) {
    console.log(error)
    res.status(401).json({error: 'Request is not authorized'})
  }
}

//Authentication routes --> i believe we will have to makde seprate gegister and login routes
// register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.register(username, email, password); // register method validates and hashes password
    const token = createToken(user._id); // create a token upon registration
    res.status(200).json({ username: user.username, token });
  } catch (err) {
    console.error('Error registering user: ', err);
    res.status(400).json({ message: err.message });
  }
})

// login route
app.post('/api/auth/login', async (req, res) => {
  try { 
    const { username, password } = req.body; // might not need to add email?
    const user = await User.login(username, password); // login method checks username and password
    const token = createToken(user._id); // create a token upon login
    res.status(200).json({ username: user.username, email: user.email, token });
  } catch (err) {
    console.error('Error logging in user: ', err);
    res.status(400).json({ message: err.message });
  }
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
    console.error("Error fetching posts: ", err);
    res.status(500).json({ message: "Error fetching posts: " + err.message });
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
    console.error("Error fetching post: ", err);
    res.status(500).json({ message: "Error fetching post: " + err.message });
  }
})

//create post - route should be /api/posts (no :id like we had in proposal)
//app.post('/api/posts', async (req, res) => {
app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    //const { title, content, authorId } = req.body; // Create a new post to the request body
    const { title, content } = req.body; // Create a new post to the request body
    const authorId = req.user._id; // Get the authenticated user's ID from the requireAuth middleware

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
//app.put('/api/posts/:id', async (req, res) => {
app.put('/api/posts/:id', requireAuth, async (req, res) => {
  try{
    const postId = req.params.id;
    // const { title, content, authorId } = req.body;
    const { title, content } = req.body;
    const authorId = req.user._id; // Get the authenticated user's ID from the requireAuth middleware
    
    //find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    //check if user is the author
    if (post.author.toString() !== authorId.toString()) {
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
//app.delete('/api/posts/:id', async (req, res) => {
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try{
    const postId = req.params.id;
    // const { authorId } = req.body;
    const authorId = req.user._id; // Get the authenticated user's ID from the requireAuth middleware

    //find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    //check if user is the author
    if (post.author.toString() !== authorId.toString()) {
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
//app.post('/api/posts/:postId/replies', async (req, res) => {
app.post('/api/posts/:id/replies', requireAuth, async (req, res) => {
  try{
    const postId = req.params.id;
    // const { content, authorId } = req.body;
    const { content } = req.body;
    const authorId = req.user._id; // Get the authenticated user's ID from the requireAuth middleware
    
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
//app.put('/api/posts/:postId/replies/:replyId', async (req, res) => {
app.put('/api/posts/:id/replies/:replyId', requireAuth, async (req, res) => {
  try{
      const { replyId } = req.params;
    // const { content, authorId } = req.body;
    const { content } = req.body;
    const authorId = req.user._id; // Get the authenticated user's ID from the requireAuth middleware
    
    //find the reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    //check if reply belongs to the specified post
    if (reply.postId.toString() !== req.params.id) {
      return res.status(400).json({ message: "Reply doesn't belong to this post" });
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
//app.delete('/api/posts/:postId/replies/:replyId', async (req, res) => {
app.delete('/api/posts/:id/replies/:replyId', requireAuth, async (req, res) => {
  try{
    const { replyId } = req.params;
    // const { authorId } = req.body;
    const authorId = req.user._id; // Get the authenticated user's ID from the requireAuth middleware
    
    // Find the reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    // Check if reply belongs to the specified post
    if (reply.postId.toString() !== req.params.id) {
      return res.status(400).json({ message: "Reply doesn't belong to this post" });
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

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});