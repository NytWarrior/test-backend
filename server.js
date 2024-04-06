import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/courses.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
