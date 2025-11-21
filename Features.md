# WeddingPics - Wedding Photos Uploading App

## Overview

WeddingPics is a web-based application that allows wedding guests to easily upload photos and videos directly to a designated Google Drive folder. Guests access the upload page by scanning QR codes, select files from their devices, and upload them securely. The app is built on Docker for scalable, serverless backend processing.

## Key Features

### QR Code Access

- Guests scan QR codes to access a dedicated upload page.
- QR codes can be generated and distributed via invitations or event signage.

### Guest Identification

- Guests provide their name before uploading files.
- Each guest's uploads are organized into a unique folder named after them.
- Automatic handling of duplicate guest names with unique identifiers (e.g., "John_Smith", "John_Smith_2").
- Prevents file name collisions within guest folders.

### File Selection and Upload

- Supports uploading photos and videos from mobile phones and computers.
- Direct upload to a specified Google Drive folder.
- Files are uploaded securely using the Google Drive API.
- Files automatically organized by guest name in separate folders.

### Upload Progress Tracking

- Real-time progress indicators for each upload.
- Visual feedback showing upload status, percentage complete, and estimated time remaining.

### Chunked Uploads

- Implements chunked uploads using Uppy and Tus protocol to handle large files efficiently.
- Bypasses Cloudflare proxy request size limitations (e.g., up to 100MB per request).
- Ensures reliable uploads with resumability for files up to Google Drive's maximum size limit (5TB per file).

### File Size and Format Support

- Supports common photo formats (JPEG, PNG, etc.) and video formats (MP4, MOV, etc.).
- File size limits align with Google Drive API constraints (up to 5TB per file).
- Automatic validation and error handling for unsupported formats or oversized files.

### Branding and UI

- Custom WeddingPics branding for a polished, event-appropriate look.
- Responsive design optimized for mobile and desktop devices.
- Simple, intuitive interface focused on ease of use for guests.

### Security and Privacy

- Secure authentication via Google OAuth for API access.
- Files uploaded directly to Google Drive without intermediate storage.
- No guest data collection beyond uploaded files.

### Backend Architecture

- Built using Hono framework for efficient routing and middleware.
- Serverless architecture with automatic scaling.
- Environment variables for secure storage of Google API credentials.

## MVP Scope

- Guest name collection and unique folder creation per guest.
- Core upload functionality with progress tracking, chunked uploads, and batch uploads.
- Basic QR code generation and page hosting.
- WeddingPics branding applied to the upload interface.
- Error handling and user feedback for failed uploads.
- Automatic handling of duplicate guest names and file names.

## Future Enhancements

- Admin dashboard for viewing and managing uploaded files.
- User authentication for tracking uploads per guest.
- Notifications for successful uploads.
- Integration with wedding planning tools.
