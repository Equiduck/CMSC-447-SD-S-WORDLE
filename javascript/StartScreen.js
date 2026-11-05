//Create variables for popup
const container = document.querySelector('.container');
const popup = document.querySelector('.popup');
const playButton = document.getElementById('playButton');
const exitButton = document.getElementById('exitButton');
const languageButton = document.getElementById('languageButton');
const popupTitle = document.getElementById("language-popup-title");
const popupDescription = document.getElementById("language-popup-description");
const playChoices = [...document.querySelectorAll("[data-language]")];
let selectedLanguage = null;

function rememberChoice(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        //The query string still works if storage is unavailable.
    }
}

function resetToLanguageStep() {
    selectedLanguage = null;
    popupTitle.textContent = "Language Selector";
    popupDescription.textContent = "Please Select Your Preferred Game Language";
    playChoices[0].textContent = "English";
    playChoices[1].textContent = "Spanish";
    playChoices[0].dataset.language = "en";
    playChoices[1].dataset.language = "es";
    delete playChoices[0].dataset.mode;
    delete playChoices[1].dataset.mode;
    playChoices.forEach((choice) => { choice.href = "#"; });
}

function openLogin() {document.getElementById("loginForm").style.display = "block";}
function closeLogin() {document.getElementById("loginForm").style.display = "none";}
function openSignUp() {document.getElementById("signupForm").style.display = "block";}
function closeSignUp() {document.getElementById("signupForm").style.display = "none";}
function openLang() {openSelector();}
function closeLang() {closeSelector();}

//Allow popup to appear
const toggle = () => {
    container.classList.toggle('active');
    popup.classList.toggle('active');
};

function openSelector() {
    resetToLanguageStep();
    if (!container.classList.contains("active")) toggle();
}

function closeSelector() {
    if (container.classList.contains("active")) toggle();
}

function showPlayTypeStep(language) {
    selectedLanguage = language;
    popupTitle.textContent = "Type of Play";
    popupDescription.textContent = "Select Your Play of Game";
    playChoices[0].textContent = "Human";
    playChoices[1].textContent = "CPU";
    delete playChoices[0].dataset.language;
    delete playChoices[1].dataset.language;
    playChoices[0].dataset.mode = "human";
    playChoices[1].dataset.mode = "cpu";
    playChoices.forEach((choice) => {
        choice.href = `index.html?lang=${selectedLanguage}&mode=${choice.dataset.mode}`;
    });
}

//Let button presses function
playButton.addEventListener('click', openSelector);
exitButton.addEventListener('click', function (event) {
    event.preventDefault();
    closeSelector();
});
languageButton.addEventListener('click', function (event) {
    event.preventDefault();
    openSelector();
});

playChoices.forEach((choice) => {
    choice.addEventListener("click", (event) => {
        if (choice.dataset.language) {
            event.preventDefault();
            rememberChoice("shared-wordle-language", choice.dataset.language);
            showPlayTypeStep(choice.dataset.language);
            return;
        }

        if (selectedLanguage && choice.dataset.mode) {
            rememberChoice("shared-wordle-language", selectedLanguage);
            rememberChoice("shared-wordle-mode", choice.dataset.mode);
        }
    });
});


//Create variables to display date
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date();
const year = today.getFullYear();
let day = today.getDate();

//Convert month number to month title
let monthName = months[today.getMonth()];


//Format entire date
const formattedDate = monthName + ' ' + day + ', ' + year;

//Bring date to html
document.getElementById("currentDate").innerHTML = formattedDate;
