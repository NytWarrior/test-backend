import { pool } from "../config/db.js";

export const createCourse = async (req, res) => {
    console.log('createCourse');
    const { title, description, category, level, price } = req.body;

    // Check if the courses table exists
    const checkTableQuery = `
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'courses'
        );
    `;

    try {
        const { rows } = await pool.query(checkTableQuery);
        const tableExists = rows[0].exists;

        if (!tableExists) {
            // Create the courses table
            const createTableQuery = `
                CREATE TABLE courses (
                    id SERIAL PRIMARY KEY,
                    title TEXT UNIQUE,
                    description TEXT,
                    category TEXT,
                    level TEXT,
                    price NUMERIC
                );
            `;

            await pool.query(createTableQuery);
            console.log('Courses table created');
        }

        // Insert the data into the courses table
        const insertQuery = `
            INSERT INTO courses (title, description, category, level, price) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *;
        `;

        const insertValues = [title, description, category, level, price];
        const result = await pool.query(insertQuery, insertValues);
        const newCourse = result.rows[0];

        res.status(201).json(newCourse)
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};


export const getCourses = async (req, res) => {
    console.log('getCourses');
    pool.query(`SELECT * FROM courses`, (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results.rows);
    });
};

export const getCourseById = async (req, res) => {
    console.log('getCourseById');
    const id = req.params.id;
    pool.query(`SELECT * FROM courses WHERE id = ${id}`, (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results.rows);
    });
};

export const updateCourse = async (req, res) => {
    console.log('updateCourse');
    const id = req.params.id;
    const { title, description, category, level, price } = req.body;

    pool.query(
        "UPDATE courses SET title = $1, description = $2, category = $3, level = $4, price = $5 WHERE id = $6",
        [title, description, category, level, price, id],
        (error, results) => {
            if (error) {
                throw error;
            }
            res.status(200).send(`Course modified with ID: ${id}`);
        }
    );
};

export const deleteCourse = async (req, res) => {
    console.log('deleteCourse');
    const id = req.params.id;

    pool.query(`DELETE FROM courses WHERE id = ${id}`, (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).send(`Course deleted with ID: ${id}`);
    });
};

export const enrollCourse = async (req, res) => {
    console.log('enrollCourse');
    const courseId = req.params.id;
    const { userId } = req.body;

    try {
        // Check if the enrolled table exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'enrolled'
            );
        `;
        const { rows } = await pool.query(checkTableQuery);
        const tableExists = rows[0].exists;

        if (!tableExists) {
            // Create the enrolled table if it doesn't exist
            const createTableQuery = `
                CREATE TABLE enrolled (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER REFERENCES courses(id),
                    user_id INTEGER REFERENCES users(id)
                );
            `;
            await pool.query(createTableQuery);
            console.log('Enrolled table created');
        }

        // Insert the enrollment data into the enrolled table
        const insertQuery = `
            INSERT INTO enrolled (course_id, user_id) 
            VALUES ($1, $2) 
            RETURNING *;
        `;
        const insertValues = [courseId, userId];
        const result = await pool.query(insertQuery, insertValues);
        const enrolledCourse = result.rows[0];

        res.status(201).json(enrolledCourse);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const getEnrolledCourses = async (req, res) => {
    console.log('getEnrolledCourses');
    pool.query(`SELECT * FROM enrolled`, (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results.rows);
    });
};