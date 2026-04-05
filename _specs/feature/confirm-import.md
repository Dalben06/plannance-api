## Introduction
The goal is User will confirm their temporary import to officially go to count in the system
## requirements 

POST v1/csv/confirm/:id
id -> temporary id from mongodb
200: success

400 -> not found for (is not the same user, import not found, validation error from data with have)

500 -> error when try to process data

## Accepted Criteria

- System needs to collect what is earliest and old date from the import, search the into database from this user. then, system need to check if the register we going compare new import data with our database, criterias: contains same title, date and amount if has we discard this object

- Need validate by user 
- Validate import id from mongo 

- after completed this imported, delete from mongodb this document


## Tests

- unit test for all requirements 201,400, and 500
- unit test from accepted criterias


## Rules

After execute the plan action, need to run lint, and test. when passed everything, the implementation will be done.
when its done run /init update claude.md, postman.collection, memory

