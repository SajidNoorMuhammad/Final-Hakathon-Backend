import express from 'express'
import adminRoute from './routers/admin.js'
import userRoute from './routers/user.js'
import mongoose from 'mongoose';
import 'dotenv/config';
import cors from 'cors';
const app = express();
const PORT = 5000;

app.use(express.json());
const user = [
    {
        name: "sajid",
        age: 2
    }
]
app.listen(PORT, () => console.log("Server is running on port", PORT));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully")
    })
    .catch(() => {
        console.log("error")
    })

app.get('/', async (req, res) => {
    res.send(user);
})
app.use(cors())
app.use('/admin', adminRoute)
app.use('/adminusers', userRoute)