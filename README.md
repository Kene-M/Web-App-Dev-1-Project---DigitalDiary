# DigitalDiary
DigitalDiary is a lightweight MERN (MongoDB, Express.js, React, Node.js) full-stack website that provides a blogging platform where registered users can share thoughts, create posts, and interact with the community by posting replies. The application demonstrates full CRUD (Create, Read, Update, Delete) capabilities across the stack and secure user authentication [*JSON Web Token (JWT)*] with hashed passwords [*bcryptjs*].

**Team**: Goofy Goobers
- **​​​Alianna Card** (HTML & CSS, Backend Support)
- **Nolan Haag** (Presentation, Documentation, React Support)
- **Kene Maduabum** (Backend Lead, MongoDB, Github setup)
- **Megan Land** (React Lead, Login)

**YouTube video link to the recorded presentation**:  [*Insert link here*]

## Technical Setup & Running the Application
### Prerequisites
You must have the following installed:

1. Node.js
2. MongoDB Atlas Account, with a created project (or some other connection string)
3. npm (usually automatically installed with Node.js)

### Project Structure
The project uses a standard monorepo structure with two main directories:

1. **backend/**: Contains the Express server, Mongoose models, and API routes.
2. **frontend/**: Contains the React application, components, and client-side routing.

### Installation and Setup
#### Step 1: Backend Installation
1. Open your terminal in the **backend** directory.
2. Run *npm i* or *npm install*.
3. Create a file named *.env* in the backend directory with your connection details:
    ````
    MONGO_URI=your_mongodb_atlas_connection_string
    JWT_SECRET=your_long_random_secret_key
    PORT=5000
    ````
4. Run the server: *npm start* (or *npm run start* if you prefer).

#### Step 2: Frontend Installation
1. Open a new terminal window and navigate to the **frontend** directory.
2. Run *npm i* or *npm install*.
3. Start the React development server: *npm start*.

[*For windows users, if "npm" isn't a recognized command, try using "npm.cmd" instead*]

The application should open automatically in your browser at http://localhost:3000
