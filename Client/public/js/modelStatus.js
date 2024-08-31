let startTime;
let timerInterval;

// Function to start the timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000); // Update every second
}

// Function to stop the timer
function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

// Function to update the elapsed time in the UI
function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

    document.getElementById('elapsed-time').innerText = `Elapsed Time: ${hours}h ${minutes}m ${seconds}s`;
}

// Function to check the status and update the UI
function checkStatus(modelId) {
    fetch(`/models/${modelId}/status`)
        .then(response => response.json())
        .then(data => {
            const status = data.status;
            const statusElement = document.getElementById('training-status');
            const visualizeButton = document.getElementById('visualizeButton');

            if (status === 'running') {
                statusElement.innerText = 'Status: Running...';
                visualizeButton.disabled = true;
                if (!timerInterval) {
                    startTimer(); // Start the timer if it hasn't started yet
                }
            } else if (status === 'finished') {
                statusElement.innerText = 'Status: Finished';
                visualizeButton.disabled = false;
                stopTimer(); // Stop the timer when the process is finished
            } else if (status === 'error') {
                statusElement.innerText = 'Status: Error Occurred';
                visualizeButton.disabled = true;
                stopTimer(); // Stop the timer if an error occurs
            } else {
                statusElement.innerText = 'Status: Not Started';
                visualizeButton.disabled = true;
                stopTimer(); // Ensure the timer is stopped if the status resets
            }
        });
}

// Event listener for the train form submission
document.getElementById('trainForm').addEventListener('submit', function () {
    document.getElementById('training-status').innerText = 'Status: Running...';
    startTimer(); // Start the timer when training starts
    checkStatus(modelId); // Check the status immediately after starting
});

// Event listener for the visualize form submission
document.getElementById('visualizeForm').addEventListener('submit', function () {
    document.getElementById('training-status').innerText = 'Status: Running...';
    startTimer(); // Start the timer when visualization starts
    checkStatus(modelId); // Check the status immediately after starting
});
