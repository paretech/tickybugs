document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const imageElement = document.querySelector('.image');
    const reticle = document.getElementById('reticle');
    
    let clickedPointsPerImage = {};  // Store points for each image
    let imageList = ['bugs1.png', 'bugs2.png', 'bigbugs.png'];  // Mock image list, replace with your actual image filenames
    let currentIndex = 0;  // Track the current image index

    // Load the first image
    loadImage(imageList[currentIndex]);

    // Function to load an image and reset points for the new image
    function loadImage(imageFileName) {
        imageElement.setAttribute('src', imageFileName);  // Set the image source
        clickedPointsPerImage[imageFileName] = clickedPointsPerImage[imageFileName] || [];  // Initialize if not already
        clearCrosses();  // Only clear crosses, not the reticle lines
        renderCrosses();  // Render any existing points for the image
    }

    // Create the horizontal and vertical lines for the reticle (keep these persistent)
    const horizontalLine = document.createElement('div');
    horizontalLine.classList.add('line', 'horizontal');

    const verticalLine = document.createElement('div');
    verticalLine.classList.add('line', 'vertical');

    reticle.appendChild(horizontalLine);
    reticle.appendChild(verticalLine);

    // Update reticle position on mouse move
    container.addEventListener('mousemove', function(event) {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Move the horizontal and vertical lines
        horizontalLine.style.top = `${y}px`;
        verticalLine.style.left = `${x}px`;
    });

    // Handle clicks to add a cross at the clicked position and show pixel coordinates
    container.addEventListener('click', function(event) {
        const imageFileName = imageList[currentIndex];  // Get current image file name
        const imageRect = imageElement.getBoundingClientRect();
        const x = event.clientX - imageRect.left;
        const y = event.clientY - imageRect.top;

        // Get the image dimensions and scale
        const imageWidth = imageElement.naturalWidth;
        const imageHeight = imageElement.naturalHeight;
        const scaleX = imageWidth / imageRect.width;
        const scaleY = imageHeight / imageRect.height;

        // Calculate the pixel coordinates on the image (0,0 is top left of the image)
        const pixelX = Math.round(x * scaleX);
        const pixelY = Math.round(y * scaleY);

        // Store the clicked point in the clickedPointsPerImage for this specific image
        clickedPointsPerImage[imageFileName].push({ x: pixelX, y: pixelY });

        // Add the cross and coordinate display to the reticle
        addCross(pixelX, pixelY);
    });

    // Function to clear only the crosses and coordinates, but keep the reticle lines
    function clearCrosses() {
        // Select all elements with the class 'cross' and remove them
        const crosses = reticle.querySelectorAll('.cross');
        crosses.forEach(cross => cross.remove());
    }

    // Function to add a cross to the reticle at the given pixel coordinates
    function addCross(pixelX, pixelY) {
        const imageRect = imageElement.getBoundingClientRect();
        const x = (pixelX / imageElement.naturalWidth) * imageRect.width;
        const y = (pixelY / imageElement.naturalHeight) * imageRect.height;

        // Create a cross element
        const cross = document.createElement('div');
        cross.classList.add('cross');

        // Create the horizontal and vertical lines for the cross
        const crossHorizontal = document.createElement('div');
        crossHorizontal.classList.add('horizontal');

        const crossVertical = document.createElement('div');
        crossVertical.classList.add('vertical');

        cross.appendChild(crossHorizontal);
        cross.appendChild(crossVertical);

        // Create a text element to display the pixel coordinates
        const coordinates = document.createElement('div');
        coordinates.classList.add('pixel-coordinates');
        coordinates.textContent = `(${pixelX}, ${pixelY})`;

        // Append the coordinates and position them next to the cross
        cross.appendChild(coordinates);

        // Position the cross and text at the clicked location
        cross.style.left = `${x - 5}px`;  // Adjust for cross width
        cross.style.top = `${y - 5}px`;   // Adjust for cross height

        // Append the cross to the reticle
        reticle.appendChild(cross);
    }

    // Function to render crosses for the current image
    function renderCrosses() {
        const imageFileName = imageList[currentIndex];
        const points = clickedPointsPerImage[imageFileName];

        points.forEach(point => {
            addCross(point.x, point.y);
        });
    }

    // Function to download all image labels as a JSON file
    function downloadJSON() {
        const data = { images: clickedPointsPerImage };
        const jsonStr = JSON.stringify(data, null, 2);  // Pretty-print JSON

        // Create a Blob from the JSON string
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        // Create a link element to download the file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'image-labels.json';  // Set the file name
        link.click();  // Programmatically trigger the download
    }

    // Function to remove the last cross and update the clicked points array
    function undoLastPoint() {
        const imageFileName = imageList[currentIndex];
        const points = clickedPointsPerImage[imageFileName];

        if (points.length > 0) {
            // Remove the last point from the array
            points.pop();

            // Re-render the crosses
            clearCrosses();
            renderCrosses();
        }
    }

    // Add an event listener for keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();  // Prevent default undo behavior
            undoLastPoint();
        }
    });

    // Navigation and download buttons
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Image';
    nextButton.style.position = 'absolute';
    nextButton.style.top = '10px';
    nextButton.style.right = '10px';
    document.body.appendChild(nextButton);

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous Image';
    prevButton.style.position = 'absolute';
    prevButton.style.top = '10px';
    prevButton.style.right = '110px';
    document.body.appendChild(prevButton);

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download JSON';
    downloadButton.style.position = 'absolute';
    downloadButton.style.top = '10px';
    downloadButton.style.left = '10px';
    document.body.appendChild(downloadButton);

    // Event listener for "Next Image"
    nextButton.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % imageList.length;  // Loop to the next image
        loadImage(imageList[currentIndex]);  // Load the new image
    });

    // Event listener for "Previous Image"
    prevButton.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;  // Loop to the previous image
        loadImage(imageList[currentIndex]);  // Load the previous image
    });

    // Event listener for downloading JSON file
    downloadButton.addEventListener('click', downloadJSON);
});
