//Create variables for popup
const container = document.querySelector('.container');
const popup = document.querySelector('.optionsPopup');
const playButton = document.getElementById('optionsButton');
const exitButton = document.getElementById('optionsExitButton');

//Allow popup to appear
const toggle = () => {
    container.classList.toggle('active');
    popup.classList.toggle('active');
};

//Let button presses function
playButton.addEventListener('click', toggle);
exitButton.addEventListener('click', toggle);


//Function to activate dark mode when checked
function myFunction() {

    var checkbox = document.getElementById("darkTheme");

    if (checkbox.checked == true) {
    
        document.body.classList.add("dark-mode");

    }
    else {
        document.body.classList.remove("dark-mode");
       
    }

}