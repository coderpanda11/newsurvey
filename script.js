document.addEventListener("DOMContentLoaded", () => {
    // Registration functionality
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent the default form submission

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Retrieve existing users from local storage
            const existingUsers = JSON.parse(localStorage.getItem('users')) || [];

            // Create a new user object
            const newUser  = { username, email, password };

            // Add the new user to the array
            existingUsers.push(newUser );

            // Store the updated users array in local storage
            localStorage.setItem('users', JSON.stringify(existingUsers));

            // Simulate a successful registration
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html'; // Redirect to login page
        });
    }

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent the default form submission

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Retrieve user data from local storage
            const storedUsers = JSON.parse(localStorage.getItem('users')) || [];

            // Check if the credentials match any user
            const user = storedUsers.find(user => user.username === username && user.password === password);

            if (user) {
                alert('Login successful!');
                window.location.href = 'dashboard.html'; // Redirect to feedback form
            } else {
                alert('Invalid username or password.');
            }
        });
    }

    // Show the reset password form when the link is clicked
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordForm.style.display = 'block'; // Show the reset password form
        });
    }

    // Handle reset password form submission
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission
    
        const resetEmail = document.getElementById('resetEmail').value;
    
        try {
            const response = await fetch('http://localhost:3000/send-reset-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: resetEmail })
            });
    
            if (!response.ok) {
                // Handle response errors
                const errorText = await response.text();
                throw new Error(`Error sending email: ${errorText}`);
            }
    
            alert('A reset password link has been sent to your email address.');
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error sending the email: ' + error.message);
        }
    
        // Optionally hide the reset password form after submission
        forgotPasswordForm.style.display = 'none';
    });
}

    // Configure AWS SDK
    AWS.config.update({
        accessKeyId: 'AKIARHJJM2QJME3ADS53', // Replace with your Access Key ID
        secretAccessKey: 'G1R3uFTcl3KvFyyoaA+cKv2cQnqebwZXwqsqCc/0', // Replace with your Secret Access Key
        region: 'eu-north-1' // Replace with your bucket's region
    });

    const s3 = new AWS.S3();

    // Function to upload files to S3
    async function uploadFiles(files, folder) {
        const uploadPromises = [];
        for (const file of files) {
            const params = {
                Bucket: 'pandabucket1337', // Replace with your bucket name
                Key: `${folder}/${Date.now()}-${file.name}`, // Unique key for the file
                Body: file,
                ContentType: file.type
            };
            try {
                const response = await s3.putObject(params).promise();
                console.log('Upload response:', response);
            } catch (error) {
                console.error('Error uploading file:', error);
                throw error; // Re-throw to handle in the calling function
            }
        }
    }

    

    // Feedback Form Submission
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            const data = {
                name : document.getElementById('name').value,
                email: document.getElementById('email').value,
                age: document.getElementById('age').value,
                comments: document.getElementById('comments').value,
            };

            console.log('Feedback Form Data:', data);
            
            // Prepare to upload files
            const imageFile = document.getElementById('image').files[0];
            const videoFile = document.getElementById('video').files[0];
            const filesToUpload = [];

            if (imageFile) filesToUpload.push(imageFile);
            if (videoFile) filesToUpload.push(videoFile);

            try {
                await uploadFiles(filesToUpload, 'feedback'); // Upload files to S3
                alert('Feedback submitted successfully!');
            } catch (error) {
                console.error('Error uploading feedback:', error);
                alert('There was an error submitting your feedback.');
            }
        });
    }
    
    // General Feedback Form Submission
    const generalFeedbackForm = document.getElementById('generalFeedbackForm');
    if (generalFeedbackForm) {
        generalFeedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            // Collect data
            const data = {
                name: document.getElementById('generalName').value,
                comments: document.getElementById('generalComments').value,
            };

            console.log('General Feedback Form Data:', data);
            
            // Prepare to upload files
            const generalImageFile = document.getElementById('generalImage').files[0];
            const filesToUpload = [];
            if (generalImageFile) filesToUpload.push(generalImageFile);
            
            // Log the files being uploaded
            console.log('Files to upload for General Feedback:', filesToUpload);

            try {
                await uploadFiles(filesToUpload, 'generalFeedback'); // Upload files to S3
                alert('General feedback submitted successfully!');
            } catch (error) {
                console.error('Error uploading general feedback:', error);
                alert('There was an error submitting your general feedback: ' + error.message);
            }
        });
    }

    // Product Feedback Form Submission
    const productFeedbackForm = document.getElementById('productFeedbackForm');
    if (productFeedbackForm) {
        productFeedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            // Collect data
            const data = {
                productName: document.getElementById('productName').value,
                rating: document.getElementById('rating').value,
                feedback: document.getElementById('productFeedback').value,
            };

            console.log('Product Feedback Form Data:', data);
            
            // Prepare to upload files
            const productImageFile = document.getElementById('productImage').files[0];
            const filesToUpload = [];
            if (productImageFile) filesToUpload.push(productImageFile);
            
            // Log the files being uploaded
            console.log('Files to upload for Product Feedback:', filesToUpload);

            try {
                await uploadFiles(filesToUpload, 'productFeedback'); // Upload files to S3
                alert('Product feedback submitted successfully!');
            } catch (error) {
                console.error('Error uploading product feedback:', error);
                alert('There was an error submitting your product feedback: ' + error.message);
            }
        });
    }

});