'use server'

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

const getDynamoDb = () => {
  const client = new DynamoDBClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION,
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function login(email, password) {
  const dynamoDb = getDynamoDb();
  const params = {
    TableName: 'CharityTable2',
    Key: {
      PK: `USER#${email}`,
      SK: `USER#${email}`,
    },
  };

  const result = await dynamoDb.send(new GetCommand(params));
  const user = result.Item;

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new Error('Invalid email or password');
  }

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  // Set cookie with more explicit options
  cookies().set({
    name: 'token',
    value: token,
    httpOnly: false, // Changed to false so client-side JS can access it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return { 
    success: true,
    token 
  };
}

export async function validateToken(token) {
  try {
    // Remove any URL-safe encoding that might be present
    const cleanToken = token.replace(/%22/g, '"').replace(/^"/, '').replace(/"$/, '');
    
    const { payload } = await jwtVerify(cleanToken, JWT_SECRET);
    
    if (!payload.email || !payload.exp || payload.exp < Date.now() / 1000) {
      console.log('Token invalid or expired:', payload);
      return { 
        valid: false,
        user: null
      };
    }

    return { 
      valid: true,
      user: payload
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { 
      valid: false,
      user: null
    };
  }
}

export async function setupPassword(token, password) {
  const dynamoDb = getDynamoDb(); // Move this to the top of the function
  const hashedPassword = bcrypt.hashSync(password, 10);

  const getTokenParams = {
    TableName: 'CharityTable2',
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `TOKEN#${token}`,
    },
  };

  const tokenResult = await dynamoDb.send(new QueryCommand(getTokenParams));

  if (!tokenResult.Items || tokenResult.Items.length === 0) {
    throw new Error('Invalid token');
  }

  const userEmail = tokenResult.Items[0].email;

  const updateParams = {
    TableName: 'CharityTable2',
    Key: {
      PK: `USER#${userEmail}`,
      SK: `USER#${userEmail}`,
    },
    UpdateExpression: 'SET passwordHash = :passwordHash',
    ExpressionAttributeValues: {
      ':passwordHash': hashedPassword,
    },
  };

  await dynamoDb.send(new UpdateCommand(updateParams));
  return { success: true };
}

const sesClient = new SESClient({ 
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function forgotPassword(email) {
  const dynamoDb = getDynamoDb();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiration

  // Check if user exists
  const userParams = {
    TableName: 'CharityTable2',
    Key: {
      PK: `USER#${email}`,
      SK: `USER#${email}`,
    },
  };

  const userResult = await dynamoDb.send(new GetCommand(userParams));
  if (!userResult.Item) {
    throw new Error('Email not registered');
  }

  // Store reset token
  const tokenParams = {
    TableName: 'CharityTable2',
    Item: {
      PK: `RESET#${token}`,
      SK: `USER#${email}`,
      email,
      expiresAt,
      createdAt: new Date().toISOString(),
    },
  };

  await dynamoDb.send(new PutCommand(tokenParams));

  // Send reset email
  const emailParams = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <div style="font-family: Arial, sans-serif;">
              <h2 style="color: #998966;">Password Reset</h2>
              <p>We received a request to reset your password.</p>
              <p>Please click the link below to reset your password:</p>
              <a href="https://charity-dashboard-orcin.vercel.app/reset-password?token=${token}" 
                 style="display: inline-block; padding: 10px 20px; background-color: #998966; color: white; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
              <p>This link expires in one hour.</p>
              <p>If you did not request a password reset, you can ignore this email.</p>
            </div>
          `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Password Reset Request',
      },
    },
    Source: 'bhk891@gmail.com',
  };

  await sesClient.send(new SendEmailCommand(emailParams));
  return { success: true };
}

export async function resetPassword(token, newPassword) {
  const dynamoDb = getDynamoDb();
  
  // Get reset token info
  const tokenParams = {
    TableName: 'CharityTable2',
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `RESET#${token}`,
    },
  };

  const tokenResult = await dynamoDb.send(new QueryCommand(tokenParams));
  if (!tokenResult.Items || tokenResult.Items.length === 0) {
    throw new Error('Reset link is invalid or expired');
  }

  const resetToken = tokenResult.Items[0];
  const now = new Date();
  const expiresAt = new Date(resetToken.expiresAt);

  if (now > expiresAt) {
    throw new Error('Reset link has expired');
  }

  // Update user's password
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const updateParams = {
    TableName: 'CharityTable2',
    Key: {
      PK: `USER#${resetToken.email}`,
      SK: `USER#${resetToken.email}`,
    },
    UpdateExpression: 'SET passwordHash = :passwordHash',
    ExpressionAttributeValues: {
      ':passwordHash': hashedPassword,
    },
  };

  await dynamoDb.send(new UpdateCommand(updateParams));

  // Delete used reset token
  const deleteTokenParams = {
    TableName: 'CharityTable2',
    Key: {
      PK: `RESET#${token}`,
      SK: `USER#${resetToken.email}`,
    },
  };

  await dynamoDb.send(new DeleteCommand(deleteTokenParams));
  return { success: true };
}
