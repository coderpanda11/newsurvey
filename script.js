document.addEventListener("DOMContentLoaded", () => {
    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent the default form submission

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Simple hardcoded check (for demonstration purposes only)
            if (username === 'user' && password === 'password') {
                alert('Login successful!');
                window.location.href = 'feedback.html'; // Redirect to feedback form
            } else {
                alert('Invalid username or password.');
            }
        });
    }

    // Check if feedbackForm exists to avoid errors on login page
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        // Configure AWS SDK
        AWS.config.update({
            accessKeyId: 'AKIARHJJM2QJME3ADS53', // Replace with your Access Key ID
            secretAccessKey: 'G1R3uFTcl3KvFyyoaA+cKv2cQnqebwZXwqsqCc/0', // Replace with your Secret Access Key
            region: 'eu-north-1' // Replace with your bucket's region
        });

        const s3 = new AWS.S3();

        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                age: document.getElementById('age').value,
                comments: document.getElementById('comments').value,
            };

            console.log('Form Data:', data);
            
            // Prepare to upload files
            const imageFile = document.getElementById('image').files[0];
            const videoFile = document.getElementById('video').files[0];

            const uploadPromises = [];

            if (imageFile) {
                const imageParams = {
                    Bucket: 'pandabucket1337', // Replace with your bucket name
                    Key: `feedback/images/${Date.now()}-${imageFile.name}`, // Unique key for the image
                    Body: imageFile,
                    ContentType: imageFile.type
                };
                uploadPromises.push(s3.putObject(imageParams).promise());
            }

            if (videoFile) {
                const videoParams = {
                    Bucket: 'pandabucket1337', // Replace with your bucket name
                    Key: `feedback/videos/${Date.now()}-${videoFile.name}`, // Unique key for the video
                    Body: videoFile,
                    ContentType: videoFile.type
                };
                uploadPromises.push(s3.putObject(videoParams).promise());
            }

            try {
                await Promise.all(uploadPromises); // Wait for all uploads to complete
                alert('Feedback submitted successfully!');
            } catch (error) {
                console.error('Error uploading feedback:', error);
                alert('There was an error submitting your feedback.');
            }
        });
    }
});