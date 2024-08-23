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
            } else if (status === 'finished') {
                statusElement.innerText = 'Status: Finished';
                visualizeButton.disabled = false;
            } else if (status === 'error') {
                statusElement.innerText = 'Status: Error Occurred';
                visualizeButton.disabled = true;
            } else {
                statusElement.innerText = 'Status: Not Started';
                visualizeButton.disabled = true;
            }
        });
}

document.getElementById('trainForm').addEventListener('submit', function () {
    document.getElementById('training-status').innerText = 'Status: Running...';
});
