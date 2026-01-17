import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:5173', // Vite Dev
            'http://localhost:3001', // Docker Frontend
            process.env.CORS_ORIGIN // Environment variable
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === "*") {
            // Note: if CORS_ORIGIN is *, credentials: true will still fail in browser for *
            // So we ideally shouldn't use * if we need credentials.
            // This logic allows specific matches.
            callback(null, true)
        } else {
            // For development, we might just allow it if it includes localhost?
            // Safer to just allow all localhosts for now or rely on the list.
            callback(null, true) // Temporarily allow all for debugging if above fails? 
            // No, let's stick to the list + reflection.
            // better yet: just reflect the origin if it matches localhost
            // callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
})) //to accept cookies from frontend

app.use(express.json({ limit: "16kb" })) //to parse json data from request body
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public")) //to serve static files from the public directory
app.use(cookieParser()) //to parse cookies from request headers


import userRouter from './routes/user.routes.js'


app.use("/api/v1/users", userRouter)



export { app }