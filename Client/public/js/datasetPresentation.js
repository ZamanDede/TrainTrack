document.addEventListener('DOMContentLoaded', function() {
    const datasetContainer = document.getElementById('datasetContainer');
    const sortBySelect = document.getElementById('sortBy');

    function sortDatasets() {
      const sortBy = sortBySelect.value;

      let datasets = Array.from(datasetContainer.getElementsByClassName('dataset-card'));

      // Sort datasets
      datasets.sort((a, b) => {
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

      // Clear and re-append sorted datasets
      datasetContainer.innerHTML = '';
      datasets.forEach(dataset => datasetContainer.appendChild(dataset));
    }

    // Add event listeners for sorting
    sortBySelect.addEventListener('change', sortDatasets);

    // Initial sort
    sortDatasets();
});
