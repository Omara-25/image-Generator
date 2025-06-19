const generateButton = document.getElementById('generateButton');
const apiUrl = 'https://image-generation-production-de983.up.railway.app/';
let currentImageBlob = null;

// Function to handle Enter key press in the input field
document.getElementById('promptInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        generateImage();
    }
});

async function generateImage() {
    const prompt = document.getElementById('promptInput').value;
    const loading = document.getElementById('loading');
    const imageContainer = document.getElementById('imageContainer');
    const errorDiv = document.getElementById('error');

    // Clear previous results
    imageContainer.innerHTML = '';
    errorDiv.textContent = '';
    currentImageBlob = null;

    if (!prompt) {
        errorDiv.textContent = 'Please enter a prompt';
        return;
    }

    try {
        loading.style.display = 'block';
        generateButton.disabled = true;

        // First, check if the API is available
        try {
            const healthCheck = await fetch(`${apiUrl}/`, {
                method: 'GET',
                mode: 'cors'
            });

            if (!healthCheck.ok) {
                throw new Error('API server is not responding');
            }
        } catch (healthError) {
            throw new Error(`Cannot connect to API server: ${healthError.message}`);
        }

        // Call our backend server on Railway
        const response = await fetch(`${apiUrl}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({ 
                prompt: prompt,
                width: 768,
                height: 768,
                num_inference_steps: 30,
                guidance_scale: 7.5
            }),
        });

        if (!response.ok) {
            let errorMsg = 'Failed to generate image';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                // If we can't parse the error response as JSON, just use the status text
                errorMsg = `Error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        const blob = await response.blob();
        currentImageBlob = blob;
        const imgUrl = URL.createObjectURL(blob);

        // Create image element
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = prompt;

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.title = 'Download Image';
        downloadBtn.addEventListener('click', downloadImage);

        // Add elements to container
        imageContainer.appendChild(img);
        imageContainer.appendChild(downloadBtn);

    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        console.error('Image generation failed:', error);
    } finally {
        loading.style.display = 'none';
        generateButton.disabled = false;
    }
}

function downloadImage() {
    if (!currentImageBlob) {
        return;
    }

    const prompt = document.getElementById('promptInput').value;
    const fileName = prompt.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30) || 'dreamcanvas_image';

    const a = document.createElement('a');
    a.href = URL.createObjectURL(currentImageBlob);
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

generateButton.addEventListener('click', generateImage);

// Add some initial animation to the container
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearSpan = document.querySelector('.footer p');
    const currentYear = new Date().getFullYear();
    yearSpan.innerHTML = yearSpan.innerHTML.replace('2023', currentYear);

    // Initial animation
    const container = document.querySelector('.container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';

    setTimeout(() => {
        container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
});
// Add this to your GitHub Pages site
window.addEventListener('message', function(event) {
    // Check if the message is asking for height
    if (event.data === 'getHeight') {
    // Calculate the full height of the document
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    ) + 50; // Add padding
    
    // Send height back to parent
    window.parent.postMessage({height: height}, '*');
  }
});

  // Also send height whenever content changes
  const observer = new MutationObserver(function() {
  const height = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  ) + 50;
  
  window.parent.postMessage({height: height}, '*');
});

// Start observing the document for content changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});
