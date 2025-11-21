# WeddingPics - Photo Upload App

A web application built with Hono and Bun that allows wedding guests to upload photos and videos using Uppy and the Tus protocol for resumable uploads.

## Features

- ✅ **Resumable Uploads**: Uses Tus protocol for reliable, resumable file uploads
- ✅ **Chunked Uploads**: Files are uploaded in 5MB chunks to handle large files
- ✅ **Progress Tracking**: Real-time upload progress indicators
- ✅ **Large File Support**: Can handle files up to 5TB (Google Drive limit)
- ✅ **Mobile Friendly**: Responsive design optimized for mobile and desktop
- ✅ **Beautiful UI**: Custom-styled Uppy dashboard with wedding-appropriate branding
- ✅ **HEIC & MOV Support**: Accepts HEIC/HEIF images and MOV videos from iOS devices

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Upload Library**: Uppy (client-side)
- **Protocol**: Tus (resumable uploads)
- **Storage**: Local filesystem

## Installation

To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## How It Works

1. **Client Side**: Uppy provides a beautiful file upload UI with drag-and-drop, file previews, and progress tracking
2. **Upload Protocol**: Files are uploaded using the Tus protocol in 5MB chunks
3. **Server Side**: Custom Tus server implementation handles chunk storage and assembly
4. **Storage**: Uploaded files are saved to the `./uploads` directory

## API Endpoints

- `POST /files` - Create a new upload
- `HEAD /files/:id` - Get upload offset/status
- `PATCH /files/:id` - Upload a chunk
- `DELETE /files/:id` - Cancel an upload
- `GET /` - Upload page UI

## Project Structure

```
weddingpics/
├── src/
│   └── index.ts          # Main server and Tus implementation
├── uploads/              # Uploaded files (gitignored)
│   └── .chunks/          # Temporary chunk storage
├── public/               # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

- **Chunk Size**: 5MB (configurable in the Uppy initialization)
- **Upload Directory**: `./uploads`
- **Chunk Directory**: `./uploads/.chunks`
- **Allowed File Types**: Images and videos

## Future Enhancements

- [ ] Integration with Google Drive API
- [ ] QR code generation for guest access
- [ ] Admin dashboard for managing uploads
- [ ] User authentication
- [ ] Upload notifications
- [ ] File format validation
- [ ] Upload size limits per guest

## License

MIT
