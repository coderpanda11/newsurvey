require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure AWS SDK
AWS.config.update({
    region: 'eu-north-1', // Replace with your region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use environment variable for security
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Use environment variable for security
});

// Create DynamoDB DocumentClient
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'emai-address@gmail.com', // Your Gmail address
        pass: 'xxxx xxxx xxxx'  // Your App Password
    }
});

// API endpoint to verify user login
app.post('/login',async (req,res) =>{
    const { username, password } = req.body;

    const params = {
        TableName: 'Credentials',
        Key: {
            username: username

        }
    };

    try{
        const data = await dynamoDB.get(params).promise();
        if (!data.Item){
            return res.status(401).send('User not found.');
        }
        if (data.Item.password === password) {
            res.status(200).send('Login successful.');
        } else {
            res.status(401).send('Invalid Username or Password');
        }
    } catch (error){
        console.error("Error logging in:", error);
        res.status(500).send('Error logging in: '+ error.message);
    }
});

// API endpoint to send reset password email
app.post('/send-reset-email', async (req, res) => {
    const { email } = req.body;

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!email || !isValidEmail(email)) {
        return res.status(400).send('Invalid email address.');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Password',
        text: 'Click on the link to reset your password: [link]'
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Reset password email sent.');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email: ' + error.toString());
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});