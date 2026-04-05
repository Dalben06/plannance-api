---
name: 'feature-name'
description: description from feature
model: sonnet
tools: Read, Glob, Grep, Bash, Write
---

## Introduction

## requirements 

POST: "/csv/import"
auth required: true
body:
    - file:  File
    - templateId: string
response:
201: {
    id: GUID
    errorsLines: CalendarEvent[],
    data: CalendarEvent[]
},


400 - send valid templateid
400 - file needs to contain at least a register

500: error import later 


## Accepted Criteria

- Need to save this temp import in mongodb by userId, it will be valid for 3 hours
- Each line temporarily needs to have id
- for type of event (debit or credit) for import, we are going to decide by >= 0 is debit and < 0 credit
- case one line has some errors, separate for the user can fix it in 'errorsLines' array object

## Tests

- unit test for all requirements 201,400, and 500
- unit test from accepted criterias


## Rules
After execute the plan action, need to run lint, and test. when passed everything, the implementation will be done.
when its done run /init update claude.md and memory if necessary

