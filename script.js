// Step 1: Decide to use text input or upload image
var textInputOption = document.getElementById("textInputOption");
var imageInputOption = document.getElementById("imageInputOption");
var textInputSection = document.getElementById("textInputSection");
var imageInputSection = document.getElementById("imageInputSection");
var checkButton = document.getElementById("checkButton");

// Function to handle when the image input option is selected
function handleImageInput() {
    textInputSection.style.display = "none";
    imageInputSection.style.display = "block";
    clearResults(); // Clear results when switching to image input
    hideImageAndText(); // Hide uploaded image and extracted text
    clearImageInput(); // Clear uploaded image
    checkButton.style.display = "none"; // Hide the Check button for image input
}

// Function to handle when the text input option is selected
function handleTextInput() {
    textInputSection.style.display = "block";
    imageInputSection.style.display = "none";
    clearResults(); // Clear results when switching to text input
    hideImageAndText(); // Hide uploaded image and extracted text
    checkButton.style.display = "inline-block"; // Show the Check button for text input
}

// Function to clear uploaded image input
function clearImageInput() {
    var fileInput = document.getElementById('fileInput');
    fileInput.value = ""; // Clear file input value
}

// Function to clear results
function clearResults() {
    var uploadedImage = document.getElementById("uploadedImage");
    var extractedText = document.getElementById("extractedText");
    uploadedImage.src = ""; // Clear the uploaded image
    extractedText.textContent = ""; // Clear the extracted text

    var verifiedResultBox = document.getElementById("verifiedResultBox");
    var unverifiedResultBox = document.getElementById("unverifiedResultBox");
    var noLinksResultBox = document.getElementById("noLinksResultBox"); // Added line
    verifiedResultBox.style.display = "none";
    unverifiedResultBox.style.display = "none";
    noLinksResultBox.style.display = "none"; // Added line
}

// Function to hide uploaded image and extracted text
function hideImageAndText() {
    var imageAndText = document.getElementById("imageAndText");
    var resultsHeader = document.getElementById("resultsHeader");
    imageAndText.style.display = "none";
    resultsHeader.style.display = "none";
}

// Initially, set the image input option as default
handleImageInput();

// Add event listeners
textInputOption.addEventListener("change", handleTextInput);
imageInputOption.addEventListener("change", handleImageInput);

// Function to reset the interface
function resetInterface() {
    clearResults();
    hideImageAndText();
    checkButton.style.display = "none"; // Hide the Check button
}

// Add event listener to the "Choose File" button
document.getElementById('fileInput').addEventListener('click', resetInterface);

// Function to analyze the uploaded image
function analyzeImage() {
    var fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function() {
            var dataUrl = reader.result;
            // Clear previous results and reset interface
            clearResults();
            hideImageAndText();
            // Display new image and start analysis
            displayImageAndText(dataUrl);
        }
        reader.readAsDataURL(file);
    } else {
        alert('Please upload an image.');
    }
}

// Function to display the uploaded image and extracted text
function displayImageAndText(dataUrl) {
    var imageAndText = document.getElementById("imageAndText");
    var uploadedImage = document.getElementById("uploadedImage");
    var extractedText = document.getElementById("extractedText");

    imageAndText.style.display = "block"; // Display the image and extracted text
    uploadedImage.src = dataUrl;
    extractedText.textContent = ""; // Clear the extracted text

    // Process the uploaded image to extract text
    processImage(dataUrl);
}

// Function to process the uploaded image to extract text
async function processImage(dataUrl) {
    try {
        const { data: { text } } = await Tesseract.recognize(
            dataUrl,
            'eng',
            { logger: m => console.log(m) }
        );
        displayExtractedText(text);
        // Call checkInput after the text has been extracted
        checkInput();
    } catch (error) {
        console.error('Error during text recognition:', error);
    }
}

// Function to display the extracted text
function displayExtractedText(text) {
    var extractedText = document.getElementById("extractedText");
    extractedText.textContent = text.trim();
}

// Function to check input (text or extracted text) and analyze it
async function checkInput() {
    if (textInputOption.checked) {
        var inputText = document.getElementById("inputText").value.trim();
        analyzeText(inputText);
    } else {
        var extractedText = document.getElementById("extractedText").textContent.trim();
        analyzeText(extractedText);
    }
}

// Function to analyze text and display results
async function analyzeText(text) {
    var urls = extractUrls(text);

    // Display Results header
    var resultsHeader = document.getElementById("resultsHeader");
    resultsHeader.style.display = "block";

    // Analyze URLs
    var govSGUrls = [];
    var otherUrls = [];
    for (const url of urls) {
        if (isGovSGUrl(url)) {
            govSGUrls.push(url);
        } else {
            otherUrls.push(url);
        }
    }

    // Display Analysis Results
    var verifiedResultBox = document.getElementById("verifiedResultBox");
    var unverifiedResultBox = document.getElementById("unverifiedResultBox");
    var noLinksResultBox = document.getElementById("noLinksResultBox");
    var verifiedResult = document.getElementById("verifiedResult");
    var unverifiedResult = document.getElementById("unverifiedResult");
    var noLinksResult = document.getElementById("noLinksResult");

    if (govSGUrls.length > 0) {
        verifiedResult.innerHTML = (govSGUrls.length === 1 ?
            "The message contains 1 link directing to a Government website or a website that has undergone review by a government official. Click on the link to access the website.<br><br>" +
            "<a href='" + govSGUrls[0] + "' target='_blank'>" + govSGUrls[0] + "</a>" :
            "The message contains " + govSGUrls.length + " " + (govSGUrls.length !== 1 ? "links" : "link") + " directing to a Government website or a website that has undergone review by a government official" + (govSGUrls.length !== 1 ? "s" : "") + ". Click on the links to access the websites.<br><br>" +
            govSGUrls.map(function (url, index) {
                return (index + 1) + ". <a href='" + url + "' target='_blank'>" + url + "</a>";
            }).join("<br>"));
        verifiedResultBox.style.display = "block";
    } else {
        verifiedResultBox.style.display = "none";
    }

    if (otherUrls.length > 0) {
        unverifiedResult.innerHTML = (otherUrls.length === 1 ?
            "The message contains 1 unverified web link. Please be careful.<br><br>" +
            otherUrls[0] :
            "We have detected " + otherUrls.length + " unverified web links" + (otherUrls.length !== 1 ? "s" : "") + " in the message. Please be careful.<br><br>" +
            otherUrls.map(function (url, index) {
                return (index + 1) + ". " + url;
            }).join("<br>"));
        unverifiedResultBox.style.display = "block";
    } else {
        unverifiedResultBox.style.display = "none";
    }

    if (govSGUrls.length === 0 && otherUrls.length === 0) {
        noLinksResult.textContent = "We did not find any web links in the message.";
        noLinksResultBox.style.display = "block";
    } else {
        noLinksResultBox.style.display = "none";
    }
}

// Function to extract URLs from text
function extractUrls(text) {
    var urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]+)+(?:\/[^\s]*)?)/g;
    return text.match(urlRegex) || [];
}

// Function to check if a URL is a .gov.sg URL
function isGovSGUrl(url) {
    return url.endsWith(".gov.sg") || url.includes(".gov.sg/");
}
