# Car Auction Backend

A NestJS-based backend API for a car auction platform with real-time bidding capabilities.

## Features

- User authentication and authorization
- Car management and categorization
- Real-time auction bidding with Socket.IO
- Payment processing
- Notification system
- File upload with Cloudinary integration
- MongoDB database with Mongoose

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary
- **Validation**: Class Validator
- **Documentation**: Swagger

## Environment Variables

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=4002
NODE_ENV=production
FRONTEND_URL=your_frontend_url
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Documentation

Once running, visit `/api` for Swagger documentation.

## Deployment

This app is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration.

## License

MIT