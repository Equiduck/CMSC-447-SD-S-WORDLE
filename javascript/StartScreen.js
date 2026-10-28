let popup = document.getElementById("popup");

const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const date = new Date();

let monthName = month[date.getMonth()];

document.getElementById("month").innerHTML = date;

function openPopup() {

    popup.classList.add("open-popup");
}

function closePopup() {

    popup.classList.remove("open-popup")

}