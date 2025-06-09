// api/index.js
import app from '../app.js';
import mongoose from 'mongoose';

const uri = process.env.DATABASE;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
  console.log("Connected to MongoDB Atlas!");
}

export default async function handler(req, res) {
  if (req.url === '/' && req.method === 'GET') {
    return res.status(200).json({ message: 'Welcome to the API Root' });
  }

  await connectToDatabase();
  return app(req, res); // Delegate ke Express
}
