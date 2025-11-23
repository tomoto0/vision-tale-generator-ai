# Vision Tale Generator

Transform your photos into captivating stories powered by AI.

## Overview

**Vision Tale Generator** is a full-stack web application that leverages OpenAI's GPT-4o Vision and Function Calling capabilities to automatically generate creative narratives from user-uploaded images. The application combines cutting-edge AI technology with a sophisticated, user-friendly interface to deliver a seamless storytelling experience.

### Live Deployment

🚀 **Deployed Application**: [https://visontale-fuo3u8u8.manus.space](https://visontale-fuo3u8u8.manus.space)

## Features

### Core Functionality

- **Image Upload**: Users can upload photos in PNG, JPG, or GIF format (up to 10MB)
- **AI-Powered Analysis**: GPT-4o Vision analyzes images to extract key visual elements
- **Function Calling Integration**: Structured extraction of story metadata (title, genre, mood, characters, setting)
- **Story Generation**: Automatic creation of 300-500 word narratives inspired by uploaded images
- **Story Management**: View, organize, and delete previously generated stories
- **Persistent Storage**: All stories are saved to a MySQL database for future retrieval

### User Experience

- **Authentication**: Manus OAuth integration for secure user management
- **Responsive Design**: Fully responsive interface supporting mobile, tablet, and desktop devices
- **Modern UI**: Glass-morphism design with smooth animations and gradient accents
- **Real-time Feedback**: Loading states and visual feedback during story generation
- **Story History**: Sidebar displaying all user-created stories with timestamps

## Application Screenshots

### Landing Page
The landing page welcomes unauthenticated users with a clear value proposition and call-to-action button.

![Vision Tale Generator Landing Page](./docs/landing-page.png)

### Main Interface
The authenticated user interface features an image upload area, story generation controls, and a story history sidebar.

## Technical Specifications

### Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                  │
│  - React 19 with TypeScript                             │
│  - Tailwind CSS 4 for styling                           │
│  - shadcn/ui component library                          │
│  - tRPC client for type-safe API calls                  │
│  - Lucide icons for UI elements                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ tRPC Procedures
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (Express 4)                   │
│  - Express.js HTTP server                              │
│  - tRPC 11 for type-safe RPC                           │
│  - Zod for input validation                            │
│  - OpenAI API integration (GPT-4o Vision)              │
│  - S3 storage for image files                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ SQL Queries
                       │
┌──────────────────────▼──────────────────────────────────┐
│            Database (MySQL/TiDB)                        │
│  - Drizzle ORM for type-safe queries                   │
│  - Users table (authentication)                        │
│  - Stories table (narrative storage)                   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4 | User interface and interactions |
| **UI Components** | shadcn/ui, Lucide Icons | Pre-built accessible components |
| **API Layer** | tRPC 11, Zod | Type-safe API communication |
| **Backend** | Express 4, Node.js | HTTP server and business logic |
| **Database** | MySQL/TiDB, Drizzle ORM | Data persistence |
| **AI Integration** | OpenAI API (GPT-4o Vision) | Image analysis and story generation |
| **Storage** | AWS S3 | Image file storage |
| **Authentication** | Manus OAuth | User identity management |
| **Build Tools** | Vite, TypeScript | Development and production builds |

### Key Dependencies

**Frontend:**
- `react` (19.0.0) - UI framework
- `tailwindcss` (4.x) - Utility-first CSS
- `@trpc/react-query` - tRPC React integration
- `lucide-react` - Icon library
- `wouter` - Lightweight router

**Backend:**
- `express` (4.x) - HTTP server
- `@trpc/server` - tRPC server
- `drizzle-orm` - ORM
- `zod` - Schema validation
- `uuid` - Unique ID generation

**Database:**
- `drizzle-kit` - Migration and schema management
- `mysql2` - MySQL driver

## Project Structure

```
vision-tale-generator/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Main application page
│   │   │   └── NotFound.tsx          # 404 page
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── ErrorBoundary.tsx     # Error handling
│   │   │   └── ManusDialog.tsx       # Auth dialog
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx      # Theme management
│   │   ├── hooks/
│   │   │   └── useAuth.ts            # Authentication hook
│   │   ├── lib/
│   │   │   └── trpc.ts               # tRPC client setup
│   │   ├── App.tsx                   # Main app component
│   │   ├── main.tsx                  # Entry point
│   │   ├── index.css                 # Global styles
│   │   └── const.ts                  # App constants
│   ├── public/                        # Static assets
│   └── package.json
├── server/
│   ├── routers.ts                    # tRPC procedure definitions
│   ├── db.ts                         # Database query helpers
│   ├── storage.ts                    # S3 storage helpers
│   ├── _core/
│   │   ├── llm.ts                    # LLM API integration
│   │   ├── context.ts                # tRPC context
│   │   ├── trpc.ts                   # tRPC setup
│   │   ├── env.ts                    # Environment variables
│   │   └── ...                       # Other core utilities
│   └── package.json
├── drizzle/
│   ├── schema.ts                     # Database schema
│   ├── migrations/                   # Database migrations
│   └── drizzle.config.ts             # Drizzle configuration
├── shared/
│   ├── const.ts                      # Shared constants
│   └── types.ts                      # Shared types
├── package.json                      # Root package configuration
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## Database Schema

### Users Table
Stores user information from Manus OAuth authentication.

```sql
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Stories Table
Stores generated narratives and associated metadata.

```sql
CREATE TABLE stories (
  id VARCHAR(64) PRIMARY KEY,
  userId VARCHAR(64) NOT NULL,
  imageUrl TEXT NOT NULL,
  imageDescription TEXT,
  story TEXT NOT NULL,
  title VARCHAR(255),
  genre VARCHAR(100),
  mood VARCHAR(100),
  characters TEXT,           -- JSON array
  setting TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## AI Integration Details

### GPT-4o Vision Analysis

The application uses OpenAI's GPT-4o Vision model to analyze uploaded images and extract key story elements:

1. **Image Processing**: Images are converted to base64 and sent to the Vision API
2. **Element Extraction**: The model identifies:
   - Main subjects and objects
   - Setting and location
   - Mood and atmosphere
   - Potential characters
   - Color palette and lighting

### Function Calling

Function Calling is used to structure the AI's response:

```typescript
{
  type: "function",
  function: {
    name: "extract_story_elements",
    parameters: {
      properties: {
        title: { type: "string" },
        genre: { type: "string" },
        mood: { type: "string" },
        characters: { type: "array", items: { type: "string" } },
        setting: { type: "string" },
        imageDescription: { type: "string" }
      }
    }
  }
}
```

### Story Generation

After extracting metadata, the model generates a complete narrative (300-500 words) that:
- Incorporates all extracted story elements
- Maintains consistent tone and mood
- Features vivid, descriptive language
- Engages the reader emotionally

## API Endpoints

### tRPC Procedures

#### `story.generateStory`
**Type**: Protected Mutation

Generates a story from an uploaded image.

**Input**:
```typescript
{
  imageUrl: string;        // URL of the uploaded image
  imageBase64?: string;    // Optional base64 encoded image
}
```

**Output**:
```typescript
{
  success: boolean;
  story: {
    id: string;
    userId: string;
    imageUrl: string;
    imageDescription: string;
    story: string;
    title: string;
    genre: string;
    mood: string;
    characters: string;    // JSON array
    setting: string;
    createdAt: Date;
    updatedAt: Date;
  }
}
```

#### `story.getMyStories`
**Type**: Protected Query

Retrieves all stories created by the authenticated user.

**Output**: Array of Story objects

#### `story.getStory`
**Type**: Protected Query

Retrieves a specific story by ID.

**Input**: `{ id: string }`

**Output**: Story object or null

#### `story.deleteStory`
**Type**: Protected Mutation

Deletes a story (only the creator can delete).

**Input**: `{ id: string }`

**Output**: `{ success: boolean }`

#### `story.uploadImage`
**Type**: Protected Mutation

Uploads an image to S3 storage.

**Input**:
```typescript
{
  base64: string;      // Base64 encoded image
  filename: string;    // Original filename
}
```

**Output**:
```typescript
{
  url: string;         // S3 URL of the uploaded image
}
```

## Environment Variables

The application requires the following environment variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your_jwt_secret_key
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Application
VITE_APP_TITLE=Vision Tale Generator
VITE_APP_LOGO=https://your-logo-url.png

# API Keys
BUILT_IN_FORGE_API_KEY=your_api_key
BUILT_IN_FORGE_API_URL=https://api.manus.im

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

## Deployment to Manus Server

### Prerequisites

- Node.js 22.x or higher
- pnpm package manager
- MySQL/TiDB database
- Manus account with OAuth credentials
- OpenAI API key (for GPT-4o Vision)

### Step-by-Step Deployment

#### 1. Clone the Repository

```bash
git clone https://github.com/Tabibito-AI/vision-tale-generator.git
cd vision-tale-generator
```

#### 2. Install Dependencies

```bash
pnpm install
```

#### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with all required environment variables (see Environment Variables section above).

#### 4. Set Up Database

```bash
# Generate migrations
pnpm db:generate

# Apply migrations
pnpm db:push
```

#### 5. Build the Application

```bash
# Development mode
pnpm dev

# Production build
pnpm build
```

#### 6. Deploy to Manus

Using the Manus Management Dashboard:

1. Navigate to the Projects section
2. Create a new project or select existing
3. Connect your GitHub repository
4. Configure environment variables in Settings → Secrets
5. Click "Publish" to deploy

Alternatively, use the Manus CLI:

```bash
manus deploy --project vision-tale-generator
```

#### 7. Verify Deployment

Once deployed, verify the application is running:
- Visit the deployed URL
- Test image upload functionality
- Verify story generation works
- Check database connectivity

### Troubleshooting

**Issue**: Database connection errors
- **Solution**: Verify DATABASE_URL is correct and database is accessible

**Issue**: OpenAI API errors
- **Solution**: Check BUILT_IN_FORGE_API_KEY is valid and has sufficient quota

**Issue**: Image upload fails
- **Solution**: Verify S3 credentials and bucket permissions

**Issue**: OAuth login not working
- **Solution**: Confirm VITE_APP_ID and OAUTH_SERVER_URL are correct

## Development Guide

### Local Development

```bash
# Start development server (runs on http://localhost:3000)
pnpm dev

# Run TypeScript type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test
```

### Adding New Features

1. **Update Database Schema** (if needed):
   - Edit `drizzle/schema.ts`
   - Run `pnpm db:push`

2. **Create Database Helpers**:
   - Add query functions to `server/db.ts`

3. **Create tRPC Procedures**:
   - Add procedures to `server/routers.ts`
   - Use `protectedProcedure` for authenticated endpoints

4. **Build Frontend Components**:
   - Create components in `client/src/pages/` or `client/src/components/`
   - Use shadcn/ui components for consistency
   - Call tRPC procedures via hooks

5. **Test Changes**:
   - Verify TypeScript compilation: `pnpm type-check`
   - Test in browser: `pnpm dev`

## Performance Considerations

- **Image Optimization**: Images are stored in S3 with CDN distribution
- **Database Indexing**: User ID and creation date are indexed for fast queries
- **Caching**: tRPC query results are cached client-side
- **Lazy Loading**: Story history sidebar loads on demand

## Security Features

- **Authentication**: Manus OAuth prevents unauthorized access
- **Input Validation**: Zod schemas validate all API inputs
- **SQL Injection Prevention**: Drizzle ORM parameterizes all queries
- **CORS Protection**: API endpoints are properly configured
- **File Upload Security**: Image uploads are validated and stored securely in S3

## Future Enhancements

Potential features for future development:

1. **Story Customization**: Allow users to edit generated stories
2. **Multiple Language Support**: Generate stories in different languages
3. **Story Sharing**: Share stories via social media or direct links
4. **Story Collections**: Organize stories into themed collections
5. **Advanced Filters**: Filter stories by genre, mood, or date range
6. **Export Options**: Download stories as PDF or EPUB
7. **Collaborative Features**: Allow multiple users to contribute to stories
8. **Story Ratings**: User ratings and community feedback system

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:

- **GitHub Issues**: [Create an issue](https://github.com/Tabibito-AI/vision-tale-generator/issues)
- **Email**: support@tabibito.ai
- **Documentation**: [Full documentation](https://docs.tabibito.ai)

## Acknowledgments

- **OpenAI** for GPT-4o Vision and Function Calling capabilities
- **Manus** for the full-stack development platform
- **shadcn/ui** for beautiful, accessible UI components
- **Tailwind CSS** for utility-first styling

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Deployed At**: [https://visontale-fuo3u8u8.manus.space](https://visontale-fuo3u8u8.manus.space)
