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
  await connectToDatabase();
  return app(req, res); // Jalankan Express
}
