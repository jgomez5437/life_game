## TODO
[ ] Build active health improvement mechanics (e.g., gym memberships, better diets, medical visits).

[ ] Build dynamic health penalty events (e.g., random diseases, lifestyle penalties, accidents).

[ ] Implement NPC mortality engine (relatives dying from old age or random events in the handleRelationships loop).

[ ] Add passive relationship decay logic for neglected family members.

[ ] Architect the "More" dashboard section (currently mapped to the 'Coming Soon' placeholder modal).

[ ] Implement Generational Wealth mechanic (starting assets/trust funds for children born to wealthy parents).

## COMPLETED
[x] make sure hasSeenJobSalary set to false if user quits job

[x] create localStorage for guest users

[x] create a button for guests to where they can sign in

[x] refactor manageEducationScreen

[x] Add careers that match grad schools (doctor, business, psychiatrist)

[x] for user.jobTitle in mainScreen.js, add to check if user has seen earned income before and udpate to reset when new job acquired

[x] gender is not being sent to database

[x] fix ageUp functionality

[x] fix occupation screen not rendering

[x] graduation logic doesnt consider how many years the user has been in university

[x] living expenses keeps adding more each age up

[x] deduct student loans when aging up

[x] living expense still gets taken out when enrolled in school

[x] fix assets screen not rendering

[x] fix getSchoolName function error

[x] Architect biological health decay and pure function unit tests

[x] Implement player Mortality Engine based on actuarial scaling

[x] Build Death UI and Estate Inheritance liquidation logic

[x] Create "Continue as Child" state reconstruction pipeline

[x] Inject dynamic Health UI percentage and color thresholds into Header