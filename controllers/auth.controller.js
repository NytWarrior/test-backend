import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js'; // Assuming you have a PostgreSQL connection pool set up
import generateTokenAndSetCookie from '../utils/generateToken.js';

// Function to hash passwords
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};


const checkUsersTableExists = async () => {
    const checkTableQuery = `
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'users'
        );
    `;
    const { rows } = await pool.query(checkTableQuery);
    return rows[0].exists;
};

export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password, confirmPassword, gender } = req.body;

        // Validate email field
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords don't match" });
        }

        // Check if the users table exists
        const tableExists = await checkUsersTableExists();
        if (!tableExists) {
            // Create the users table
            const createTableQuery = `
            CREATE TABLE users (
                user_id SERIAL PRIMARY KEY,
                full_name TEXT,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                gender TEXT,
                profile_pic TEXT,
                reset_token TEXT,
                reset_token_expires TIMESTAMPTZ,
                reset_token_used BOOLEAN DEFAULT FALSE
            );
            
            `;
            await pool.query(createTableQuery);
            console.log('Users table created');
        }

        // Check if username already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Check if email already exists
        const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
        const profilePic = gender === "male" ? boyProfilePic : girlProfilePic;

        // Insert new user into the database
        const insertUserQuery = `
            INSERT INTO users (full_name, username, email, password, gender, profile_pic)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const newUser = await pool.query(insertUserQuery, [fullName, username, email, hashedPassword, gender, profilePic]);

        // Generate JWT token and set cookie
        generateTokenAndSetCookie(newUser.rows[0].user_id, res);

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Retrieve user from the database
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.rows[0].password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Generate JWT token and set cookie
        generateTokenAndSetCookie(user.rows[0].user_id, res);

        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        // Clear JWT cookie
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
