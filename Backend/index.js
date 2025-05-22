const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./schema');
const resolvers = require('./resolver');
const dotenv = require('dotenv');
const User=require("./models/User");
const Project=require("./models/Project");
const Task=require("./models/Task");    

dotenv.config();

const MONGODB_URI = "mongodb+srv://Abdelrahman:Abood1842003@abdelrahman.v3kl9.mongodb.net/?retryWrites=true&w=majority&appName=Abdelrahman";
const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express(); // ✅ move this up first

  app.use(cors()); // ✅ now use cors

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    server.applyMiddleware({ app });

    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('❌ Error starting the server:', error);
  }
}

startServer();


/*
const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');
const typeDefs = require('./schema');
const resolvers = require('./resolver');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = "mongodb+srv://Abdelrahman:Abood1842003@abdelrahman.v3kl9.mongodb.net/?retryWrites=true&w=majority&appName=Abdelrahman";
const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const server = new ApolloServer({
            typeDefs,
            resolvers,
        });

        server.listen({ port: PORT }).then(({ url }) => {
            console.log(`🚀 Server ready at ${url}`);
        });

    } catch (error) {
        console.error('Error starting the server:', error);
    }
}

startServer();
*/