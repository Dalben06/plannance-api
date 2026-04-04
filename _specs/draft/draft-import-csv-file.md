---
name: 'feature-csv-map-fields'
description: User will attach csv file and we need to return all fields to the front, so front can map csv fields to backend model
model: sonnet
tools: Read, Glob, Grep, Bash, Write
---

## 1. Introduction

The user uploads a CSV file to the backend.  
The backend is responsible for reading the file, identifying all columns, and determining the data type of each column.

After processing, the backend returns a structured response to the frontend containing:
- All column names
- The corresponding data types

This creates a mapping between the CSV structure and the backend data model, enabling the frontend to understand and use the uploaded data.

## 2. Requirements

### Endpoint

- Create a new endpoint: `POST /csv/mapped`
- The endpoint must accept a CSV file as input

### Processing

The backend must:
- Receive the uploaded CSV file
- Read and parse its contents
- Identify all column names
- Infer or determine the data type for each column
- Build a structured response object

### Response Structure

The response should include:
- List of columns
- Data type for each column

### Response Scenarios

#### Success Response
- Status Code: `200 OK`
- Description: File processed successfully and mapping returned

#### Error Response (Processing Failure)
- Status Code: `500 Internal Server Error`
- Message: Inform the client to retry uploading the file

#### Validation Response
- Status Code: `400 Bad Request`
- Scenarios:
  - File is corrupted or unreadable
  - File exceeds allowed size
- Message: Ask the client to upload a valid file

### File Constraints

- Maximum file size: **5 MB**
- Files exceeding this limit must be rejected with a validation error

### Architecture

- Implementation must follow the existing backend architecture
- Ensure consistency with:
  - Existing patterns
  - Naming conventions
  - Error handling standards

---

## 3. Acceptance Criteria

### 1. Happy Path
- User uploads a valid CSV file
- Backend processes the file successfully
- Returns mapped columns and data types

### 2. File Size Validation
- User uploads a file larger than 5 MB
- System rejects the request
- Returns a validation message indicating size limit

### 3. Processing Failure
- Backend fails to process the file
- User receives a message:
  - "Sorry, please try again later"

### 4. Missing File
- User sends a request without attaching a file
- System returns validation error:
  - "File is required"

---

## 4. Tests

Development must be driven by the following tests:

- Should successfully map columns and data types from a valid CSV
- Should reject files larger than 5 MB
- Should return validation error when no file is provided
- Should handle corrupted/unreadable files properly
- Should handle internal processing errors gracefully

All tests must pass before completion.

---

## 5. Development & Review Process

### Testing
- All unit tests must pass
- Acceptance criteria must be fully covered by tests

### Code Review
- Submit changes for review using: `senior-reviewer` agent
- Address all feedback before finalizing

### Code Quality
- Run formatting tools
- Ensure linting passes with no errors
