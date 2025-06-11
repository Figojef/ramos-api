import express from "express"

// E:\a_PA3\Try\ValidasiPembayaran\BE\index.js
// Router
import authRouter from './routes/authRouter.js'
import productRouter from './routes/productRouter.js'
import lapanganRouter from './routes/lapanganRouter.js'
import orderRouter from './routes/orderRouter.js'
import jadwalRouter from './routes/jadwalRouter.js'
import pemesananRouter from './routes/pemesananRouter.js'
import transaksiRouter from './routes/transaksiRouter.js'
import mabarRouter from './routes/mabarRouter.js'
import eventRouter from './routes/eventRouter.js'
import jadwalRutinHarianRouter from './routes/jadwalRutinHarianRouter.js'
import ratingRouter from './routes/ratingRouter.js'
import infokontakgorRouter from './routes/infokontakgorRouter.js'
import dashboardAdminRouter from './routes/dashboardAdminRouter.js'


import dotenv from "dotenv"
import { notFound, errorHandler } from "./middleware/errorMiddleware.js"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import ExpressMongoSanitize from "express-mongo-sanitize"
import { v2 as cloudinary } from 'cloudinary';


const app = express()
const port = 3000

import cors from 'cors';


// Konfigurasi CORS dengan origin yang tepat
const corsOptions = {
  origin: ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://ramos.d4trpl-itdel.id'], 
  credentials: true,  // Memungkinkan pengiriman cookies (termasuk JWT)
};

app.use(cors(corsOptions));  // Pastikan hanya satu pemanggilan `app.use(cors(...))`

// Configuration
cloudinary.config({ 
      cloud_name: "de9cyaoqo", 
      api_key: 193388313656343, 
      api_secret: "qYF6EPlE381NVDneflc7AxHOtmk" // Click 'View API Keys' above to copy your API secret
});


//Middleware
app.use(helmet())
app.use(ExpressMongoSanitize())
app.use(express.json()) // agar request body bisa json
app.use(express.urlencoded({extended : true}))  // memasukkan inputan di urlencoded pada postman
app.use(cookieParser())
app.use(express.static('./public'))


dotenv.config()

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/product', productRouter)
app.use('/api/v1/lapangan', lapanganRouter)
app.use('/api/v1/order', orderRouter) 
app.use('/api/v1/jadwal', jadwalRouter)

app.use('/api/v1/pemesanan', pemesananRouter)
app.use('/api/v1/transaksi', transaksiRouter)
app.use('/api/v1/event', eventRouter)
app.use('/api/v1/mabar', mabarRouter)
app.use('/api/v1/rating', ratingRouter)
app.use('/api/v1/InfoKontakGor', infokontakgorRouter)
app.use('/api/v1/dashboardAdmin', dashboardAdminRouter)
app.use('/api/v1/jadwalRutinHarian', jadwalRutinHarianRouter)

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});


app.use(notFound)
app.use(errorHandler)


// import mongoose from "mongoose";

// // Gantilah dengan URI Atlas Anda
// const uri = process.env.DATABASE;

// async function connectToDatabase() {
//   try {
//     // Menghubungkan ke MongoDB Atlas menggunakan Mongoose
//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 30000, // Timeout 30 detik
//       socketTimeoutMS: 45000, // Timeout socket 45 detik
//     });
//     console.log("Connected to MongoDB Atlas!");

//     // Memastikan koneksi berhasil dengan melakukan ping
//     const admin = mongoose.connection.db.admin();
//     await admin.ping();
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } catch (error) {
//     console.error("Error connecting to MongoDB Atlas:", error);
//     process.exit(1); // Keluar dari aplikasi jika koneksi gagal
//   }
// }

// connectToDatabase(); // Jalankan fungsi koneksi

// // Jalankan server
// app.listen(port, () => console.log(`Server up and running at port ${port}`));

import mongoose from "mongoose";

// Gantilah dengan URI Atlas Anda
const uri = process.env.DATABASE;

async function connectToDatabase() {
  try {
    // Menghubungkan ke MongoDB Atlas menggunakan Mongoose
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB Atlas!");

    // Memastikan koneksi berhasil dengan melakukan ping
    const admin = mongoose.connection.db.admin();
    await admin.ping();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
    process.exit(1); // Keluar dari aplikasi jika koneksi gagal
  }
}

connectToDatabase(); // Jalankan fungsi koneksi


app.listen(port, () => console.log(`Server up and run at ${port} port`))

