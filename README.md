# Shared State Wordle - Frontend (Team C)

The purpose of our project is to create a 2-player wordle where one player can submit a guess and then
the next user can use that information to submit their guess; repeating that process until someone wins
or they both lose. Specifically for our team, which is team c, we are focused on creating the front end
that will allow users to interact with the website and actually play the game via their web browser.

## Description

Our project is designed so players/users can sign in and/or create an account that not only used for matchmaking purposes, but also for storing certain statistics about the games they play. Once a user creates an account or signs into a preexisting one, they can choose which language to select, between English and Spanish, that will allow them to make guesses against a dictionary of that selected language. After that a user can then select to either play against a CPU, which will simulate how a two-person game will work, or against an actual player. Once in a game, one person makes the first guess and once they pick a valid word the player passes control over to the other player who will then use that knowledge of the previous word to make their own guess. Not only is each player attempting to figure out the word, but they're also trying to beat their opponent by thinking ahead. Along with the core game, a player can also change certain accessibility features such as dark mode and high contrast mode, view their statistics which showcase their win/loss ratio, how many games played, how many attempts it took to win, and then finally they can view the history tab which will allow them to look at specific games played on any given day they select.

## Getting Started

### Dependencies

* Nothing needs to be installed before running this, the only thing needed is a browser and the web address
* The server needs to be spun up with the database active for data to be stored and displayed

### Executing program

* Running the program is as simple as visiting the link which should take you directly to the start screen and selecting play, which will lead you through a series of preferences
* Actual multiplayer isn't implemented yet and is only done locally, CPU is more supported at the moment

## Help

If a user finds themselves stuck in a game or don't know how to restart, they can simply exit out and go back to the start screen to give them a new beginning.

Certain features, such a history and statistics host static data/information and aren't properly set up at the moment.

## Authors

Contributors names

Marco DeCesaris
Jacob Wingers
Isabelle Knight
Camila Ton


## License

This project is licensed under the MIT License - see the LICENSE.md file for details

