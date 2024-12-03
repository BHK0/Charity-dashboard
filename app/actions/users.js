'use server'

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { unstable_cache } from 'next/cache';

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

const sesClient = new SESClient({ 
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function sendUserInvitation(email) {
  const token = uuidv4();

  const params = {
    TableName: 'CharityTable2',
    Item: {
      PK: `TOKEN#${token}`,
      SK: `USER#${email}`,
      email,
      createdAt: new Date().toISOString(),
    },
  };

  await getDynamoDb().send(new PutCommand(params));

  const emailParams = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
              <tr>
                <td style="padding: 20px; text-align: center; background-color: #f8f7f8;">
                  <h2 style="color: #998966;">Invitation to Join Organization Management Dashboard</h2>
                  <p>Hello,</p>
                  <p>You have been invited to join the Organization Management Dashboard. Please click the link below to set up your password and access the dashboard:</p>
                  <a href="https://charity-dashboard.vercel.app/setup-password?token=${token}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #998966; color: white; text-decoration: none; border-radius: 5px;">Set Up Password</a>
                  <p style="margin-top: 20px;">If you did not request this invitation, you can ignore this email.</p>
                </td>
              </tr>
            </table>
          `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Invitation to Join Dashboard',
      },
    },
    Source: 'bhk891@gmail.com',
  };

  await sesClient.send(new SendEmailCommand(emailParams));
  
  return { success: true, token }; // Return the token
}

export const getAllUsers = unstable_cache(
  async () => {
    const params = {
      TableName: 'CharityTable2',
    };

    const result = await getDynamoDb().send(new ScanCommand(params));
    return result.Items.filter(item => item.PK.startsWith('USER#')).map(item => ({
      email: item.PK.split('#')[1],
      createdAt: item.createdAt,
    }));
  },
  ['users', 'all'],
  { 
    tags: ['users'],
    revalidate: 3000 
  }
);
