# CMSC-447-SD-S-WORDLE
Staged repo for SWE 1 UMBC Course, Group 6


Currently agreed section: C

Copied from Capstone Projects Doc

Team C — Web Gameplay & Player Experience
Team C owns the interactive game interface.
Responsibilities include:
• shared game board;
• player indicators;
• turn indicator;
• keyboard;
• guess entry;
• feedback visualization;
• global constraint visualization;
• invalid-guess feedback;
• game history;
• game status;
• player status;
• statistics; and
• reconnect/resume experience.
The UI should clearly communicate that the constraint state is shared rather than belonging to
one player.
Public API Integration
The project should integrate with a public dictionary/word API for one or more appropriate
functions, such as:
• validating candidate words;
• obtaining possible target words; or
• obtaining definitions.
The external API should be isolated behind a service interface so that the game remains testable
when the external service is unavailable.
Mocks should be used during development and testing.
Cross-Team Interfaces
Teams should agree on:
• game-state representation;
• turn representation;
• guess request/response format;
• feedback representation;
• constraint representation;
• player status;
• game lifecycle states; and
• error responses.
Team C should be able to build against a mock game API while Teams A and B implement the
actual backend logic.
Sprint Expectations
Sprint 1 - 09/24-10/14
• Establish the game model and database schema.
• Build basic game/API foundations.
• Implement Wordle feedback with repeated-letter tests.
• Establish the constraint representation.
• Build a shared-board UI using mock data.
• Agree on game-state, turn, feedback, and constraint contracts.
Sprint 2 - 10/15-11/4
• Implement complete server-side game management.
• Implement constraint accumulation and candidate validation.
• Complete the gameplay interface.
• Integrate the actual shared game state.
• Demonstrate a complete two-player game.
Sprint 3 - 11/5-11/24
• Test difficult repeated-letter cases.
• Test constraint reconstruction.
• Test reconnect and abandonment behavior.
• Test external API failures.
• Improve synchronization and usability.
• Add history/statistics.
• Complete end-to-end testing.
Possible Extensions
Possible extensions include:
• best-of-N matches;
• alternating first player;
• leaderboards;
• reconnect/resume;
• spectator mode;
• game replay;
• candidate-word counts;
• information-gain analysis; or
• tournament play.
