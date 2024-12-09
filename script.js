document.addEventListener("DOMContentLoaded", async () => {
    const AWS_CONFIG = {
        accessKeyId: 'AKIARHJJM2QJME3ADS53', // Replace with your Access Key ID
        secretAccessKey: 'G1R3uFTcl3KvFyyoaA+cKv2cQnqebwZXwqsqCc/0', // Replace with your Secret Access Key
        region: 'eu-north-1' // Replace with your bucket's region
    };

    AWS.config.update(AWS_CONFIG);
    const s3 = new AWS.S3();

    // Initialize event listeners
    initRegistration();
    initLogin();
    initForgotPassword();
    initSurveyCreation();
    initFeedbackForms();
    await loadSurvey();

    function initRegistration() {
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistration);
        }
    }

    async function handleRegistration(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
        existingUsers.push({ username, email, password });
        localStorage.setItem('users', JSON.stringify(existingUsers));

        alert('Registration successful! You can now log in.');
        window.location.href = 'login.html';
    }

    function initLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const user = storedUsers.find(user => user.username === username && user.password === password);

        if (user) {
            alert('Login successful!');
            window.location.href = 'userChoice.html';
        } else {
            alert('Invalid username or password.');
        }
    }

    function initForgotPassword() {
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                forgotPasswordForm.style.display = 'block';
            });
        }

        const resetPasswordForm = document.getElementById('resetPasswordForm');
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', handleResetPassword);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        const resetEmail = document.getElementById('resetEmail').value;

        try {
            const response = await fetch('http://localhost:3000/send-reset-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });

            if (!response.ok) {
                throw new Error(`Error sending email: ${await response.text()}`);
            }

            alert('A reset password link has been sent to your email address.');
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error sending the email: ' + error.message);
        }
    }

    function initSurveyCreation() {
        const surveyForm = document.getElementById('surveyForm');
        if (surveyForm) {
            const questionsArray = [];
            const addQuestionBtn = document.getElementById('addQuestionBtn');
            const optionsContainer = document.getElementById('optionsContainer');
            const questionTypeSelect = document.getElementById('questionType');

            questionTypeSelect.addEventListener('change', () => {
                optionsContainer.style.display = questionTypeSelect.value === 'multipleChoice' ? 'block' : ' none';
            });

            addQuestionBtn.addEventListener('click', () => addQuestion(questionsArray));

            surveyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await submitSurvey(questionsArray);
            });
        }
    }

    function addQuestion(questionsArray) {
        const question = document.getElementById('question').value.trim();
        const questionType = document.getElementById('questionType').value;
        const options = document.getElementById('options').value.split(',').map(option => option.trim());

        if (!question) {
            alert('Please enter a question.');
            return;
        }

        questionsArray.push({ question, type: questionType, options });
        displayQuestionPreview(question, questionType, options);
        document.getElementById('surveyForm').reset();
        document.getElementById('optionsContainer').style.display = 'none';
    }

    function displayQuestionPreview(question, questionType, options) {
        const surveyPreview = document.getElementById('surveyPreview');
        const questionElement = document.createElement('div');
        questionElement.innerHTML = `<strong>${question}</strong>`;

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
    }

    async function submitSurvey(questionsArray) {
        const surveyTitle = document.getElementById('surveyTitle').value;
        const surveyData = { title: surveyTitle, questions: questionsArray };
        const uid = generateUID();

        const params = {
            Bucket: 'pandabucket1337',
            Key: `surveys/${uid}.json`,
            Body: JSON.stringify(surveyData),
            ContentType: 'application/json'
        };

        try {
            await s3.putObject(params).promise();
            const shareableLink = `https://coderpanda11.github.io/newsurvey/surveyDisplay.html?id=${uid}`;
            alert(`Your survey has been created and can be accessed at: ${shareableLink}`);
            window.location.href = shareableLink;
        } catch (error) {
            console.error('Error uploading survey:', error);
            alert("Error uploading survey");
        }
    }

    function generateUID() {
        return `${Math.floor(Math.random() * 10000)}`; // Generate a random number
    }

    async function loadSurvey() {
        const urlParams = new URLSearchParams(window.location.search);
        const surveyKey = urlParams.get('id');

        if (!surveyKey) {
            console.error('No survey key provided in the URL.');
            return;
        }

        const params = {
            Bucket: 'pandabucket1337',
            Key: `surveys/${surveyKey}.json`
        };

        try {
            const data = await s3.getObject(params).promise();
            const surveyData = JSON.parse(data.Body.toString('utf-8'));
            displaySurvey(surveyData);
        } catch (error) {
            console.error('Error fetching survey:', error);
            alert('Error fetching survey');
        }
    }

    function displaySurvey(surveyData) {
        const surveyContent = document.getElementById('surveyContent');
        surveyContent.innerHTML = `<h2>${surveyData.title}</h2>`;

        surveyData.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.innerHTML = `<strong>${question.question}</strong>`;

            if (question.type === 'multipleChoice') {
                question.options.forEach((option, optionIndex) => {
                    const optionElement = document.createElement('div');
                    optionElement.innerHTML = `
                        <input type="radio" name="question${index}" id="question${index}option${optionIndex}" value="${option}">
                        <label for="question${index}option${optionIndex}">${option}</label>
                    `;
                    questionElement.appendChild(optionElement);
                });
            } else if (question.type === 'text') {
                questionElement.innerHTML += `<input type="text" name="question${index}" placeholder="Your answer">`;
            } else if (question.type === 'rating') {
                questionElement.innerHTML += `
                    <select name="question${index}">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                `;
            }

            surveyContent.appendChild(questionElement);
        });
    }

    // Response Submission
    document.getElementById('submitSurveyBtn').addEventListener('click', async () => {
        const responses = gatherSurveyResponses();
        
        if (responses.length === 0) {
            alert('No responses to submit.');
            return;
        }

        const csvData = convertResponsesToCSV(responses);
        const randomNum = Date.now(); // Using current timestamp as a unique identifier

        const params = {
            Bucket: 'pandabucket1337',
            Key: `responses/${randomNum}.csv`,
            Body: new Blob([csvData], { type: 'text/csv' }),
            ContentType: 'text/csv'
        };

        try {
            await s3.putObject(params).promise();
            alert('Responses submitted successfully!');
        } catch (error) {
            console.error('Error uploading responses:', error);
            alert('There was an error submitting your responses.');
        }
    });

    function gatherSurveyResponses() {
        const responses = [];
        const surveyData = JSON.parse(localStorage.getItem('surveyData')); // Assuming survey data is stored in local storage

        surveyData.questions.forEach((question, index) => {
            const answer = document.querySelector(`input[name="question${index}"]:checked`) || 
                           document.querySelector(`input[name="question${index}"]`) || 
                           document.querySelector(`select[name="question${index}"]`);
            responses.push({
                question: question.question,
                answer: answer ? answer.value : 'No answer provided'
            });
        });

        return responses;
    }

    function convertResponsesToCSV(responses) {
        return responses.map(r => `${r.question},"${r.answer}"`).join('\n');
    }

    function initFeedbackForms() {
        initFeedbackForm('feedbackForm', 'feedback');
        initFeedbackForm('generalFeedbackForm', 'generalFeedback');
        initFeedbackForm('productFeedbackForm', 'productFeedback');
    }

    function initFeedbackForm(formId, folder) {
        const feedbackForm = document.getElementById(formId);
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleFeedbackSubmission(feedbackForm, folder);
            });
        }
    }

    async function handleFeedbackSubmission(form, folder) {
        const data = gatherFeedbackData(form);
        const csvData = convertFeedbackToCSV(data);
        const filesToUpload = [new Blob([csvData], { type: 'text/csv' })];

        const imageFile = form.querySelector('input[type="file"]').files[0];
        if (imageFile) filesToUpload.push(imageFile);

        try {
            await uploadFilesToS3(filesToUpload, folder);
            alert('Feedback submitted successfully!');
        } catch (error) {
            console.error('Error uploading feedback:', error);
            alert('There was an error submitting your feedback.');
        }
    }

    function gatherFeedbackData(form) {
        return {
            name: form.querySelector('#name').value,
            email: form.querySelector('#email').value,
            age: form.querySelector('#age').value,
            comments: form.querySelector('#comments').value,
        };
    }

    function convertFeedbackToCSV(data) {
        return `Name,Email,Age,Comments\n${data.name},${data.email},${data.age},"${data.comments}"\n`;
    }

    async function uploadFilesToS3(files, folder) {
        for (const file of files) {
            const params = {
                Bucket: 'pandabucket1337',
                Key: `${folder}/${file.name}`, // Use the file name or generate a unique name
                Body: file,
                ContentType: file.type
            };
            await s3.putObject(params).promise();
        }
    }
});