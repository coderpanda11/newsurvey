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
                window.location.href = 'userChoice.html'; // Redirect to feedback form
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

    // Survey Creation Functionality
    const surveyForm = document.getElementById('surveyForm');
    if (surveyForm) {
        const surveyPreview = document.getElementById('surveyPreview');
        const addQuestionBtn = document.getElementById('addQuestionBtn');
        const optionsContainer = document.getElementById('optionsContainer');

        // Show options input if Multiple Choice is selected
        const questionTypeSelect = document.getElementById('questionType');
        questionTypeSelect.addEventListener('change', () => {
            optionsContainer.style.display = questionTypeSelect.value === 'multipleChoice' ? 'block' : 'none';
        });

        // Array to hold all questions
        const questionsArray = [];

        // Add question to the survey preview
        addQuestionBtn.addEventListener('click', () => {
            const question = document.getElementById('question').value.trim();
            const questionType = questionTypeSelect.value;
            const options = document.getElementById('options').value.split(',').map(option => option.trim());

            // Check if the question is not empty
            if (!question) {
                alert('Please enter a question.');
                return;
            }

            // Add question to questions array
            questionsArray.push({ question, type: questionType, options });

            // Create a question element and display it in the preview
            const questionElement = document.createElement('div');
            questionElement.innerHTML = `<strong>${question}</strong> (${questionType})`;
            
            if (questionType === 'multipleChoice') {
                const optionsList = document.createElement('ul');
                options.forEach(option => {
                    const li = document.createElement('li');
                    li.textContent = option;
                    optionsList.appendChild(li);
                });
                questionElement.appendChild(optionsList);
            }

            surveyPreview.appendChild(questionElement);
            surveyForm.reset(); // Clear the form fields
            optionsContainer.style.display = 'none'; // Hide options input again
        });

        // Handle survey creation
        surveyForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Store the questions in local storage
            localStorage.setItem('createdSurvey', JSON.stringify(questionsArray));
            
            // Redirect to the survey display page
            window.location.href = 'surveyDisplay.html'; // Change to your actual survey display page URL
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

    // Function to fetch data from AWS
async function fetchData() {
    const params = {
        Bucket: 'pandabucket1337',
        Key: 'feedback/1732428880972.json'
    };

    try {
        const data = await s3.getObject(params).promise();
        const jsonData = JSON.parse(data.Body.toString('utf-8'));
        return jsonData; // Return the parsed JSON data
    } catch (error) {
        console.error('Error fetching data:', error);
        return null; // Return null if there is an error
    }
}

// Function to create charts
async function createCharts() {
    const data = await fetchData();

    // Check if data is null or undefined
    if (!data) {
        console.error('No data available for chart creation.');
        return; // Exit the function if no data is available
    }

    // Check if data is an array
    if (!Array.isArray(data)) {
        console.error('Fetched data is not an array:', data);
        return; // Exit if data is not an array
    }

    // Data Processing
    const labels = data.map(item => item.label);
    const values = data.map(item => item.value);

    // Check if labels and values are not empty
    if (labels.length === 0 || values.length === 0) {
        console.error('Labels or values are empty. Cannot create charts.');
        return; // Exit if there's no data to plot
    }

    // Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bar Chart Data',
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Pie Chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pie Chart Data',
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Pie Chart Data'
                }
            }
        }
    });
}

// Call the createCharts function to initialize the charts
createCharts();

});