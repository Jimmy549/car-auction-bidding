# Car Auction Bidding Backend

A NestJS-based backend API for car auction bidding platform with real-time bidding functionality.

## Features

- 🚗 Car auction management
- 🔐 JWT authentication
- 💰 Real-time bidding with Socket.IO
- 📸 Image upload with Cloudinary
- 🗄️ MongoDB database
- 📧 Notification system
- 💳 Payment integration
- 👤 User management

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary
- **Validation**: Class Validator

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Environment Variables

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auctions` - Get all auctions
- `POST /auctions` - Create auction
- `POST /bids` - Place bid
- `GET /cars` - Get cars
- `POST /cars` - Add car

## Deployment

Ready for Vercel deployment with included `vercel.json` configuration.

## License

MIT