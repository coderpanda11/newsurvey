let surveyData;
document.addEventListener("DOMContentLoaded", async () => {
    const AWS_CONFIG = {
        accessKeyId: 'AKIARHJJM2QJME3ADS53', // Replace with your Access Key ID
        secretAccessKey: 'G1R3uFTcl3KvFyyoaA+cKv2cQnqebwZXwqsqCc/0',
        region: 'eu-north-1' // Replace with your bucket's region
    };

    AWS.config.update(AWS_CONFIG);
    const dynamoDB = new AWS.DynamoDB.DocumentClient();
    
    const s3 = new AWS.S3();

    // Initialize event listeners
    initRegistration();
    initLogin();
    initForgotPassword();
    initSurveyCreation();
    initFeedbackForms();
    await loadSurvey();
    initResponseSubmission();

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
    
        // Create a params object for DynamoDB
        const params = {
            TableName: 'Credentials',
            Item: {
                username: username, // Primary key
                email: email,       // Additional attribute
                password: password   // Additional attribute (consider hashing this)
            }
        };
    
        try {
            // Store the user in DynamoDB
            await dynamoDB.put(params).promise();
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error registering user:', error);
            alert('Error registering user: ' + error.message);
        }
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
    
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
    
            if (!response.ok) {
                throw new Error(await response.text());
            }
    
            alert('Login successful!');
            window.location.href = 'userChoice.html'; // Redirect to user choice page
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Login failed: ' + error.message);
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
            const response = await fetch('http://192.168.1.5:3000/send-reset-email', {
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

// updated code starts from here - multiple dialog box creation bug fixed

    function initSurveyCreation() {
        const surveyForm = document.getElementById('surveyForm');
        if (surveyForm) {
            const questionsArray = [];
            const addQuestionBtn = document.getElementById('addQuestionButton');

            addQuestionBtn.addEventListener('click', () => addQuestion(questionsArray));

            surveyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await submitSurvey(questionsArray);
            });
        }
    }

    // Add questions
    function addQuestion(questionsArray) {
        const questionContainer = document.getElementById("questionContainer");

        const questionTypes = [
            "Short answer",
            "Paragraph",
            "Multiple choice",
            "Checkboxes",
            "Dropdown",
            "File upload",
            "Linear scale",
            "Rating",
            "Multiple choice grid",
            "Checkbox grid",
            "Date",
            "Time"
        ];

        const createOptionsContainer = (type, questionData) => {
            const optionsContainer = document.createElement("div");
            optionsContainer.classList.add("options-container");

            if (type === "Multiple choice" || type === "Checkboxes" || type === "Dropdown") {
                const addOptionLink = document.createElement("span");
                addOptionLink.classList.add("add-option");
                addOptionLink.innerText = "Add option";

                addOptionLink.addEventListener("click", () => {
                    const optionInput = document.createElement("input");
                    optionInput.type = "text";
                    optionInput.placeholder = "Option";
                    optionInput.style.marginTop = "10px";
                    optionsContainer.appendChild(optionInput);
                });

                optionsContainer.appendChild(addOptionLink);
            } else if (type === "File upload") {
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                optionsContainer.appendChild(fileInput);
            } else if (type === "Linear scale") {
                optionsContainer.innerHTML = `
                    <label>Minimum value: <input type="number" min="1" max="10" value="1"></label>
                    <label>Maximum value: <input type="number" min="1" max="10" value="5"></label>
                `;
            } else if (type === "Date" || type === "Time") {
                const input = document.createElement("input");
                input.type = type.toLowerCase();
                optionsContainer.appendChild(input);
            }

            return optionsContainer;
        };

        const createQuestionElement = () => {
            const questionDiv = document.createElement("div");
            questionDiv.classList.add("form-group");

            const label = document.createElement("label");
            label.innerText = "Question";
            questionDiv.appendChild(label);

            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Enter your question";
            questionDiv.appendChild(input);

            const questionTypeDiv = document.createElement("div");
            questionTypeDiv.classList.add("question-type");

            const questionTypeLabel = document.createElement("span");
            questionTypeLabel.innerText = "Type:";
            questionTypeDiv.appendChild(questionTypeLabel);

            const questionTypeSelect = document.createElement("select");
            questionTypes.forEach(type => {
                const option = document.createElement("option");
                option.value = type;
                option.innerText = type;
                questionTypeSelect.appendChild(option);
            });

            questionTypeDiv.appendChild(questionTypeSelect);
            questionDiv.appendChild(questionTypeDiv);

            // Create a question data object
            const questionData = {
                question: "", // Initialize as empty
                type: questionTypeSelect.value,
                options: [] // Initialize options array
            };

            // Update questionData when the input changes
            input.addEventListener("input", () => {
                questionData.question = input.value; // Capture the question text
            });

            questionTypeSelect.addEventListener("change", () => {
                const currentOptionsContainer = questionDiv.querySelector(".options-container");
                if (currentOptionsContainer) {
                    questionDiv.removeChild(currentOptionsContainer);
                }
                const newOptionsContainer = createOptionsContainer(questionTypeSelect.value);
                questionDiv.appendChild(newOptionsContainer);
                questionData.type = questionTypeSelect.value; // Update question type
            });

            const removeQuestionLink = document.createElement("span");
            removeQuestionLink.innerText = "Remove question";
            removeQuestionLink.classList.add("remove-question");
            removeQuestionLink.addEventListener("click", () => {
                questionContainer.removeChild(questionDiv);
                // Remove from questionsArray as well
                const index = questionsArray.indexOf(questionData);
                if (index > -1) {
                    questionsArray.splice(index, 1);
                }
            });

            questionDiv.appendChild(removeQuestionLink);
            questionDiv.appendChild(createOptionsContainer(questionData.type));
            questionContainer.appendChild(questionDiv);

            // Push questionData to questionsArray immediately after creating the question
            questionsArray.push(questionData);
        };

        // Call createQuestionElement to add a new question
        createQuestionElement();
    }

    // Survey submission function
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
            window.location.href = shareableLink; // Change to sharableLink 
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
            // localStorage.setItem('surveyData', JSON.stringify(surveyData));
            displaySurvey(surveyData);
        } catch (error) {
            console.error('Error fetching survey:', error);
            alert('Error fetching survey');
        }
    }

    function displaySurvey(surveyData) {
        const surveyContent = document.getElementById('surveyContent');
        surveyContent.innerHTML = `<h2 id="titleDisplay">${surveyData.title}</h2>`; // Display the survey title
    
        surveyData.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.innerHTML = `<h3><strong>${question.question}</strong></h3>`; // Display the question text
        
            // Handle different question types
            if (question.type === 'Multiple choice') {
                question.options.forEach((option, optionIndex) => {
                    const optionElement = document.createElement('div');
                    optionElement.innerHTML = `
                        <input type="radio" name="question${index}" id="question${index}option${optionIndex}" value="${option}">
                        <label for="question${index}option${optionIndex}">${option}</label>
                    `;
                    questionElement.appendChild(optionElement);
                });
            } else if (question.type === 'Checkboxes') {
                question.options.forEach((option, optionIndex) => {
                    const optionElement = document.createElement('div');
                    optionElement.innerHTML = `
                        <input type="checkbox" name="question${index}option${optionIndex}" id="question${index}option${optionIndex}" value="${option}">
                        <label for="question${index}option${optionIndex}">${option}</label>
                    `;
                    questionElement.appendChild(optionElement);
                });
            } else if (question.type === 'Dropdown') {
                const selectElement = document.createElement('select');
                selectElement.name = `question${index}`;
                question.options.forEach((option) => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    selectElement.appendChild(optionElement);
                });
                questionElement.appendChild(selectElement);
            } else if (question.type === 'Short answer') {
                questionElement.innerHTML += `<input type="text" name="question${index}" placeholder="Your answer">`;
            } else if (question.type === 'Paragraph') {
                questionElement.innerHTML += `<textarea name="question${index}" placeholder="Your answer"></textarea>`;
            } else if (question.type === 'File upload') {
                questionElement.innerHTML += `<input type="file" name="question${index}">`;
            } else if (question.type === 'Linear scale') {
                questionElement.innerHTML += `
                    <label>Minimum value: <input type="number" name="question${index}min" min="1" max="10" value="1"></label>
                    <label>Maximum value: <input type="number" name="question${index}max" min="1" max="10" value="5"></label>
                `;
            } else if (question.type === 'Rating') {
                questionElement.innerHTML += `
                    <label>Rating: <input type="number" name="question${index}" min="1" max="5" value="3"></label>
                `;
            } else if (question.type === 'Date') {
                questionElement.innerHTML += `<input type="date" name="question${index}">`;
            } else if (question.type === 'Time') {
                questionElement.innerHTML += `<input type="time" name="question${index}">`;
            }
        
            surveyContent.appendChild(questionElement);
        });
    }

    // Response Submission
    document.getElementById('submitButton').addEventListener('click', async () => {
        try {
            const responses = gatherResponses();
            
            // Check if there are any responses to submit
            if (responses.length === 0) {
                alert('No responses to submit.');
                return;
            }

            // Convert responses to CSV format
            const csvData = convertResponsesToCSV(responses);
            const surveyId = getSurveyIdFromURL(); // Function to get the survey ID from the URL
            const randomNum = Date.now(); // Using current timestamp as a unique identifier

            await uploadResponsesToS3(csvData, surveyId, randomNum);
            alert('Responses submitted successfully!');
        } catch (error) {
            console.error('Error during submission:', error);
            alert('There was an error submitting your responses: ' + error.message);
        }
    });

    function gatherResponses() {
        const responses = [];
        surveyData.questions.forEach((question, index) => {
            const responseValue = getResponseValue(question, index);
            if (responseValue) {
                responses.push({ question: question.question, response: responseValue });
            }
        });
        return responses;
    }

    function getResponseValue(question, index) {
        let responseValue = '';
        if (question.type === 'Multiple choice') {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            responseValue = selectedOption ? selectedOption.value : '';
        } else if (question.type === 'Checkboxes') {
            const checkedOptions = document.querySelectorAll(`input[name^="question${index}option"]:checked`);
            responseValue = Array.from(checkedOptions).map(checkbox => checkbox.value).join(', ');
        } else if (question.type === 'Dropdown') {
            const selectedOption = document.querySelector(`select[name="question${index}"]`);
            responseValue = selectedOption ? selectedOption.value : '';
        } else {
            const inputElement = document.querySelector(`input[name="question${index}"], textarea[name="question${index}"]`);
            responseValue = inputElement ? inputElement.value : '';
        }
        return responseValue;
    }

    async function uploadResponsesToS3(csvData, surveyId, randomNum) {
        const params = {
            Bucket: 'pandabucket1337',
            Key: `responses/${surveyId}/response_${randomNum}.csv`, // Store under the survey ID folder
            Body: new Blob([csvData], { type: 'text/csv' }),
            ContentType: 'text/csv'
        };
        await s3.putObject(params).promise();
    }

    function getSurveyIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id'); // Assuming the survey ID is passed as a query parameter
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
