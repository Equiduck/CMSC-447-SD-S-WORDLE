
//Create variables for popup
const container = document.querySelector('.container');
const popup = document.querySelector('.popup');
const playButton = document.getElementById('playButton');
const exitButton = document.getElementById('exitButton');
const popupTitle = document.getElementById("language-popup-title");
const popupDescription = document.getElementById("language-popup-description");
const playChoices = [...document.querySelectorAll(".choiceButton")];
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const loginPopup = document.querySelector('.loginPopup');
const signupPopup = document.querySelector('.signupPopup');
const exitLogin = document.getElementById('exitLogin');
const exitSignup = document.getElementById('exitSignup');

const finalLogin = document.getElementById('submit');
const username = document.getElementById('username');
const password = document.getElementById('password');



let selectedLanguage = null;
let selectedMode = null;

function rememberChoice(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        //The query string still works if storage is unavailable.
    }
}

function resetToLanguageStep() {
    selectedLanguage = null;
    selectedMode = null;
    popupTitle.textContent = "Language Selector";
    popupDescription.textContent = "Please Select Your Preferred Game Language";
    playChoices[0].textContent = "English";
    playChoices[1].textContent = "Spanish";
    playChoices[2].textContent = "";
    playChoices[2].hidden = true;
    playChoices[0].dataset.language = "en";
    playChoices[1].dataset.language = "es";
    playChoices.forEach((choice) => {
        delete choice.dataset.mode;
        delete choice.dataset.difficulty;
    });
    playChoices.forEach((choice) => { choice.href = "#"; });
}

//Allow popup to appear
const toggle = () => {
    container.classList.toggle('active');
    popup.classList.toggle('active');
};

function openSelector() {
    resetToLanguageStep();
    if (!container.classList.contains("active")) toggle();
}

function openLogin() {
    if (!container.classList.contains("active")){
        container.classList.toggle('active');
        loginPopup.classList.toggle('active');
    };
}

function openSignup() {
    if (!container.classList.contains("active")){
        container.classList.toggle('active');
        signupPopup.classList.toggle('active');
    };
}

function closeLogin() {
    if (container.classList.contains("active")){
        container.classList.toggle('active');
        loginPopup.classList.toggle('active');
    };
}

function closeSignup() {
    if (container.classList.contains("active")){
        container.classList.toggle('active');
        signupPopup.classList.toggle('active');
    };
}

function closeSelector() {
    if (container.classList.contains("active")) toggle();
}

function showPlayTypeStep(language) {
    selectedLanguage = language;
    selectedMode = null;
    popupTitle.textContent = "Type of Play";
    popupDescription.textContent = "Select Your Play of Game";
    playChoices[0].textContent = "Human";
    playChoices[1].textContent = "CPU";
    playChoices[2].textContent = "";
    playChoices[2].hidden = true;
    delete playChoices[0].dataset.language;
    delete playChoices[1].dataset.language;
    delete playChoices[2].dataset.language;
    playChoices[0].dataset.mode = "human";
    playChoices[1].dataset.mode = "cpu";
    delete playChoices[0].dataset.difficulty;
    delete playChoices[1].dataset.difficulty;
    delete playChoices[2].dataset.difficulty;
    playChoices[0].href = `index.html?lang=${selectedLanguage}&mode=human`;
    playChoices[1].href = `index.html?lang=${selectedLanguage}&mode=cpu`;
    playChoices[2].href = "#";
}

function showDifficultyStep() {
    selectedMode = "cpu";
    popupTitle.textContent = "Difficulty";
    popupDescription.textContent = "Select Your Preferred Difficulty";
    const difficulties = ["easy", "medium", "hard"];

    playChoices.forEach((choice, index) => {
        choice.textContent = difficulties[index].charAt(0).toUpperCase() + difficulties[index].slice(1);
        choice.hidden = false;
        delete choice.dataset.language;
        delete choice.dataset.mode;
        choice.dataset.difficulty = difficulties[index];
        choice.href = `index.html?lang=${selectedLanguage}&mode=cpu&difficulty=${difficulties[index]}`;
    });
}

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
            if (choice.dataset.mode === "cpu") {
                event.preventDefault();
                showDifficultyStep();
                return;
            }
        }

        if (selectedLanguage && selectedMode && choice.dataset.difficulty) {
            rememberChoice("shared-wordle-language", selectedLanguage);
            rememberChoice("shared-wordle-mode", selectedMode);
            rememberChoice("shared-wordle-difficulty", choice.dataset.difficulty);
        }
    });
});


//Create variables to display date
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date();
const year = today.getFullYear();
const day = today.getDate();

//Convert month number to month title
let monthName = months[today.getMonth()];


//Format entire date
const formattedDate = monthName + ' ' + day + ', ' + year;

//Bring date to html
document.getElementById("currentDate").innerHTML = formattedDate;

//Let button presses function
playButton.addEventListener('click', openSelector);
exitButton.addEventListener('click', closeSelector);

loginButton.addEventListener('click', openLogin);
exitLogin.addEventListener('click', closeLogin);

signupButton.addEventListener('click', openSignup);
exitSignup.addEventListener('click', closeSignup);


//Add a function that only triggers the login button when both fields are filled
function testing(event) {

    //Prevent the values in the text input to disappear when clicking the button
    event.preventDefault();

    document.getElementById("demo").innerHTML = "";
    document.getElementById("warning").innerHTML = "";

    if (username.value.trim() != '' && password.value.trim() != '') {

        document.getElementById("demo").innerHTML = "Hello World";
        username.value = "";
        password.value = "";

        localStorage.setItem('triggered', 'true');

    }
    else {

        document.getElementById("warning").innerHTML = "Please enter a valid username/email and password";
        return;

    }

}

//Add a function call for when the login button is pressed
finalLogin.addEventListener('click', testing);
