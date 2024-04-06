import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/sendEmail.js';

export const getUsers = (req, res) => {
    pool.query("SELECT * FROM users ORDER BY user_id ASC", (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results.rows);
    });
};

export const getUserById = (req, res) => {
    const id = req.params.id;
    pool.query(`SELECT * FROM users WHERE user_id = $1`, [id], (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results.rows);
    });
};

export const updateUser = async (req, res) => {
    const id = req.params.id;
    const { name, email } = req.body;

    try {
        const updateQuery = `
            UPDATE users 
            SET name = $1, email = $2
            WHERE user_id = $3
            RETURNING *;
        `;
        const updateValues = [name, email, id];

        const result = await pool.query(updateQuery, updateValues);
        const updatedUser = result.rows[0];

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};


export const deleteUser = (req, res) => {
    const id = req.params.id;

    // Check if the user exists
    pool.query('SELECT * FROM users WHERE user_id = $1', [id], (error, results) => {
        if (error) {
            throw error;
        }

        if (results.rows.length === 0) {
            // No user found
            return res.status(404).send(`No user found with ID: ${id}`);
        }

        // User found, proceed with deletion
        pool.query('DELETE FROM users WHERE user_id = $1', [id], (error, results) => {
            if (error) {
                throw error;
            }
            res.status(200).send(`User deleted with ID: ${id}`);
        });
    });
};


export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    // Generate a unique reset token
    const resetToken = uuidv4();

    try {
        // Check if the user exists
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Save the reset token, expiration time, and set reset_token_used to false in the database
        const expirationTime = new Date(Date.now() + 3600000); // Token expires in 1 hour
        await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2, reset_token_used = false WHERE email = $3', [resetToken, expirationTime, email]);

        // Send the password reset email with the reset link containing the token
        const resetLink = `http://yourwebsite.com/reset-password?token=${resetToken}`;
        const emailSubject = 'Password Reset Request';
        const emailHtml = `
            <p>Hello,</p>
            <p>You have requested to reset your password. Use the reset token to reset password.</p>
            Reset Token: ${resetToken}
            <p>If you did not request this, you can safely ignore this email.</p>
        `;
        await sendEmail(email, emailSubject, emailHtml);

        res.status(200).json({ message: "Password reset link sent successfully" });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    console.log(token, " dsf ", newPassword);

    try {
        // Find user by reset token and ensure the token is not expired
        const user = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW() AND reset_token_used = false', [token]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password, clear the reset token, and set reset_token_used to true
        await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, reset_token_used = true WHERE user_id = $2', [hashedPassword, user.rows[0].user_id]);

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
