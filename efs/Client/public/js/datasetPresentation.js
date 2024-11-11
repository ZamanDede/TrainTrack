document.addEventListener('DOMContentLoaded', function () {
    const datasetContainer = document.getElementById('datasetContainer');
    const sortBySelect = document.getElementById('sortBy');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    let originalDatasets = [];
    let currentDatasets = [];

    // Function to initialize datasets (called once on load)
    function initializeDatasets() {
        originalDatasets = Array.from(datasetContainer.getElementsByClassName('dataset-card'));
        currentDatasets = [...originalDatasets];
        sortBySelect.value = 'headingAsc';
        applySort();
        updateDatasetContainer();
    }


    // Function to apply search conditions to the datasets
    function applySearch(query) {
        const searchField = document.getElementById('searchField').value;
        query = query.toLowerCase();

        // Filter datasets based on the selected search field
        currentDatasets = originalDatasets.filter(dataset => {
            let fieldToSearch;

            switch (searchField) {
                case 'heading':
                    fieldToSearch = dataset.getAttribute('data-heading').toLowerCase();
                    break;
                case 'author':
                    fieldToSearch = dataset.getAttribute('data-author').toLowerCase();
                    break;
                case 'description':
                    fieldToSearch = dataset.getAttribute('data-description').toLowerCase();
                    break;
                case 'size':
                    fieldToSearch = dataset.getAttribute('data-size').toLowerCase();
                    break;
                case 'taskType':
                    fieldToSearch = dataset.getAttribute('data-tasktype').toLowerCase();
                    break;
                case 'dataFormat':
                    fieldToSearch = dataset.getAttribute('data-dataformat').toLowerCase();
                    break;
                case 'license':
                    fieldToSearch = dataset.getAttribute('data-license').toLowerCase();
                    break;
                default:
                    const heading = dataset.getAttribute('data-heading').toLowerCase();
                    const author = dataset.getAttribute('data-author').toLowerCase();
                    const description = dataset.getAttribute('data-description').toLowerCase();
                    fieldToSearch = `${heading} ${author} ${description}`;
            }

            return fieldToSearch.includes(query);
        });
    }

    // Function to sort datasets based on selected criteria
    function applySort() {
        const sortBy = sortBySelect.value;

        currentDatasets.sort((a, b) => {
            let aValue, bValue;
            if (sortBy.includes('heading')) {
                aValue = a.getAttribute('data-heading').toLowerCase();
                bValue = b.getAttribute('data-heading').toLowerCase();
            } else if (sortBy.includes('author')) {
                aValue = a.getAttribute('data-author').toLowerCase();
                bValue = b.getAttribute('data-author').toLowerCase();
            }

            if (sortBy.endsWith('Asc')) {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    // Function to update the dataset container with the current datasets
    function updateDatasetContainer() {
        datasetContainer.innerHTML = '';
        currentDatasets.forEach(dataset => datasetContainer.appendChild(dataset));
    }

    // Event listener for the search button
    searchButton.addEventListener('click', function () {
        currentDatasets = [...originalDatasets];
        applySearch(searchInput.value);
        applySort();
        updateDatasetContainer();
    });

    // Event listener for the sort dropdown
    sortBySelect.addEventListener('change', function () {
        applySort();
        updateDatasetContainer();
    });

    initializeDatasets();
});
