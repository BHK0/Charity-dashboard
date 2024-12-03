'use server'

import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { format as formatDate } from 'date-fns';
import { ar } from 'date-fns/locale';
import ExcelJS from 'exceljs';

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

// Phone number validation
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone);
};

export async function createDateDonation(donationData) {
  const dynamoDb = getDynamoDb();
  const timestamp = Date.now().toString();
  const createdAt = new Date().toISOString();

  // Validate phone number
  if (!validatePhoneNumber(donationData.phoneNumber)) {
    throw new Error('Invalid phone number');
  }

  // Create donation item with updated schema
  const donation = {
    PK: "DATE_DONATIONS",
    SK: `DONATION#${timestamp}`,
    GSI1PK: "DATE_DONATION",
    GSI1SK: createdAt,
    donationType: donationData.donationType,
    donorName: donationData.donorName || 'Anonymous',
    quantity: parseFloat(donationData.quantity),
    phoneNumber: donationData.phoneNumber,
    images: donationData.images || [],
    createdAt,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, // Adding month for better querying
    notes: donationData.notes || '', // New field for admin notes
  };

  await dynamoDb.send(new PutCommand({
    TableName: "CharityTable2",
    Item: donation
  }));

  // Revalidate both all donations and month-specific cache
  revalidateTag('datedonations');
  return donation;
}

export const getDateDonations = unstable_cache(
  async () => {
    const dynamoDb = getDynamoDb();
    const result = await dynamoDb.send(new QueryCommand({
      TableName: "CharityTable2",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "DATE_DONATIONS"
      },
      ScanIndexForward: false
    }));
    return result.Items;
  },
  ['datedonations', 'all'],
  { 
    tags: ['datedonations'],
    revalidate: 3000 
  }
);

// New function to get donations by month and year
export const getDateDonationsByMonth = unstable_cache(
  async (year, month) => {
    const dynamoDb = getDynamoDb();
    
    const result = await dynamoDb.send(new QueryCommand({
      TableName: "CharityTable2",
      IndexName: "DateDonationsByMonthIndex", // New GSI
      KeyConditionExpression: "GSI2PK = :pk AND begins_with(GSI2SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `YEAR#${year}`,
        ":sk": `MONTH#${month}#`
      },
      ScanIndexForward: false
    }));

    return result.Items;
  },
  (year, month) => ['datedonations', 'by-month', year, month],
  { 
    tags: ['datedonations'],
    revalidate: 3000, 
  }
);

// New function to update donation status
export async function updateDateDonationStatus(donationId, status, notes) {
  const dynamoDb = getDynamoDb();
  
  await dynamoDb.send(new UpdateCommand({
    TableName: "CharityTable2",
    Key: {
      PK: "DATE_DONATIONS",
      SK: `DONATION#${donationId}`
    },
    UpdateExpression: "SET #status = :status, notes = :notes",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": status,
      ":notes": notes
    }
  }));

  // Revalidate all related caches
  revalidateTag('datedonations');
  return { success: true };
}

export async function exportFarmerDonations(startDate, endDate, format = 'excel') {
  const dynamoDb = getDynamoDb();
  let donations;

  if (startDate && endDate) {
    // Query donations by date range
    const params = {
      TableName: "CharityTable2",
      KeyConditionExpression: "PK = :pk",
      FilterExpression: "createdAt BETWEEN :start AND :end",
      ExpressionAttributeValues: {
        ":pk": "DATE_DONATIONS",
        ":start": startDate.toISOString(),
        ":end": endDate.toISOString()
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    donations = result.Items;
  } else {
    // Get all donations
    const params = {
      TableName: "CharityTable2",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "DATE_DONATIONS"
      }
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    donations = result.Items;
  }

  // Format data
  const formattedDonations = donations.map(donation => ({
    donorName: donation.donorName,
    phoneNumber: donation.phoneNumber,
    donationType: donation.donationType,
    quantity: donation.quantity,
    date: formatDate(new Date(donation.createdAt), 'P', { locale: ar }),
    createdAt: donation.createdAt // for sorting
  }));

  // Sort by date (newest first)
  formattedDonations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Farmer Donations', { 
      views: [{ rightToLeft: false }] 
    });

    // Set column headers
    worksheet.columns = [
      { header: 'Donor Name', key: 'donorName', width: 30 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Donation Type', key: 'donationType', width: 15 },
      { header: 'Quantity (kg)', key: 'quantity', width: 15 },
      { header: 'Date', key: 'date', width: 20 }
    ];

    // Add rows
    worksheet.addRows(formattedDonations);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F7F8' }
    };

    // Generate buffer and convert to array
    const buffer = await workbook.xlsx.writeBuffer();
    return { 
      format: 'excel', 
      data: [...new Uint8Array(buffer)]
    };
  } else {
    // CSV format
    const csvRows = [
      ['Donor Name', 'Phone Number', 'Donation Type', 'Quantity (kg)', 'Date'],
      ...formattedDonations.map(d => [
        d.donorName,
        d.phoneNumber,
        d.donationType,
        d.quantity,
        d.date
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    return { format: 'csv', data: csvContent };
  }
} 