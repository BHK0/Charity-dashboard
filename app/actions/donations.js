'use server'

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { checkRateLimit } from './rateLimit';
import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { format as formatDate } from 'date-fns';
import { enUS } from 'date-fns/locale';
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

export async function createDonation(orgId, donationData) {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  const ipLimit = await checkRateLimit(`IP_${ip}`);
  const phoneLimit = await checkRateLimit(`PHONE_${donationData.phoneNumber}`);

  if (!ipLimit.allowed || !phoneLimit.allowed) {
    const resetTime = new Date(Math.max(ipLimit.resetAt, phoneLimit.resetAt));
    throw new Error(
      `Too many requests. Please try again after ${resetTime.toLocaleTimeString()}. ` +
      `IP remaining: ${ipLimit.remaining}, Phone remaining: ${phoneLimit.remaining}`
    );
  }

  const timestamp = Date.now().toString();
  const createdAt = new Date().toISOString();
  
  // Create donation with the new GSI attributes
  const donation = {
    PK: `ORG#${orgId}`,
    SK: `DONATION#${timestamp}`,
    GSI2PK: "DONATION", // Just "DONATION" for the partition key
    GSI2SK: createdAt, // This will allow us to query by date
    phoneNumber: donationData.phoneNumber,
    amount: donationData.amount,
    createdAt,
    metadata: {
      ip,
      userAgent,
      origin: headersList.get('origin') || 'unknown',
      referer: headersList.get('referer') || 'unknown',
      ipRateLimit: ipLimit,
      phoneRateLimit: phoneLimit
    }
  };

  const dynamoDb = getDynamoDb();
  await dynamoDb.send(new PutCommand({
    TableName: "CharityTable2",
    Item: donation
  }));

  await dynamoDb.send(new UpdateCommand({
    TableName: "CharityTable2",
    Key: {
      PK: "ADMIN",
      SK: `ORG#${orgId}`
    },
    UpdateExpression: "ADD totalDonations :amount, donationCount :one",
    ExpressionAttributeValues: {
      ":amount": donationData.amount,
      ":one": 1
    }
  }));

  // Revalidate multiple related caches
  revalidateTag('donations');
  revalidateTag('organizations'); // Since org totals are updated

  return donation;
}

export const getAllDonations = unstable_cache(
  async (startDate, endDate) => {
    const dynamoDb = getDynamoDb();

    if (startDate && endDate) {
      // Use GSI to query donations by date range
      const params = {
        TableName: "CharityTable2",
        IndexName: "DonationDateIndex",
        KeyConditionExpression: "GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end",
        ExpressionAttributeValues: {
          ":pk": "DONATION",
          ":start": startDate.toISOString(),
          ":end": endDate.toISOString()
        },
        ScanIndexForward: false // This will return items in descending order (newest first)
      };

      const result = await dynamoDb.send(new QueryCommand(params));
      return result.Items;
    } else {
      // If no date range is provided, get recent donations
      const params = {
        TableName: "CharityTable2",
        IndexName: "DonationDateIndex",
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: {
          ":pk": "DONATION"
        },
        ScanIndexForward: false, // This will return items in descending order (newest first)
        Limit: 1000 // Limit to latest 1000 donations for performance
      };

      const result = await dynamoDb.send(new QueryCommand(params));
      return result.Items;
    }
  },
  (startDate, endDate) => [
    'donations', 
    'all',
    startDate?.toISOString() || 'all',
    endDate?.toISOString() || 'all'
  ],
  { 
    tags: ['donations'],
    revalidate: 3000, 
  }
);

export const getDonationsByOrg = unstable_cache(
  async (orgId) => {
    const params = {
      TableName: "CharityTable2",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `ORG#${orgId}`,
        ":sk": "DONATION#"
      },
      ScanIndexForward: false, // This will return items in descending order (newest first)
      Limit: 50 // Limit to latest 50 donations
    };

    const dynamoDb = getDynamoDb();
    const result = await dynamoDb.send(new QueryCommand(params));
    return result.Items;
  },
  (orgId) => ['donations', 'by-org', orgId],
  { 
    tags: ['donations'],
    revalidate: 3000, 
  }
);

export async function findSuspiciousDonations(orgId, options = {}) {
  const {
    timeWindow = 3600000, // 1 hour
    maxDonationsPerIP = 10,
    maxDonationsPerPhone = 5
  } = options;

  const dynamoDb = getDynamoDb();
  const result = await dynamoDb.send(new QueryCommand({
    TableName: "CharityTable2",
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `ORG#${orgId}`,
      ":sk": "DONATION#"
    }
  }));

  const now = Date.now();
  const recentDonations = result.Items.filter(
    donation => now - new Date(donation.createdAt).getTime() < timeWindow
  );

  // Group by IP and phone number
  const groupedByIP = {};
  const groupedByPhone = {};

  recentDonations.forEach(donation => {
    const ip = donation.metadata.ip;
    const phone = donation.phoneNumber;

    groupedByIP[ip] = groupedByIP[ip] || [];
    groupedByIP[ip].push(donation);

    groupedByPhone[phone] = groupedByPhone[phone] || [];
    groupedByPhone[phone].push(donation);
  });

  // Find suspicious activities
  const suspicious = {
    byIP: Object.entries(groupedByIP)
      .filter(([_, donations]) => donations.length > maxDonationsPerIP)
      .map(([ip, donations]) => ({
        ip,
        count: donations.length,
        donations: donations.map(d => d.SK)
      })),
    byPhone: Object.entries(groupedByPhone)
      .filter(([_, donations]) => donations.length > maxDonationsPerPhone)
      .map(([phone, donations]) => ({
        phone,
        count: donations.length,
        donations: donations.map(d => d.SK)
      }))
  };

  return suspicious;
}

export async function exportDonations(startDate, endDate, format = 'excel') {
  const dynamoDb = getDynamoDb();
  let donations;

  if (startDate && endDate) {
    // Use GSI to query donations by date range
    const params = {
      TableName: "CharityTable2",
      IndexName: "DonationDateIndex",
      KeyConditionExpression: "GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end",
      ExpressionAttributeValues: {
        ":pk": "DONATION",
        ":start": startDate.toISOString(),
        ":end": endDate.toISOString()
      },
      ScanIndexForward: false
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    donations = result.Items;
  } else {
    // Get all donations
    const params = {
      TableName: "CharityTable2",
      IndexName: "DonationDateIndex",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "DONATION"
      },
      ScanIndexForward: false
    };

    const result = await dynamoDb.send(new QueryCommand(params));
    donations = result.Items;
  }

  // Get organization names
  const orgIds = [...new Set(donations.map(d => d.PK.split('#')[1]))];
  const orgsData = {};
  
  for (const orgId of orgIds) {
    const result = await dynamoDb.send(new GetCommand({
      TableName: "CharityTable2",
      Key: {
        PK: "ADMIN",
        SK: `ORG#${orgId}`
      }
    }));
    if (result.Item) {
      orgsData[orgId] = result.Item.name;
    }
  }

  // Format data
  const formattedDonations = donations.map(donation => ({
    organizationName: orgsData[donation.PK.split('#')[1]] || 'Unknown',
    phoneNumber: donation.phoneNumber,
    amount: donation.amount,
    date: formatDate(new Date(donation.createdAt), 'P', { locale: enUS }),
    createdAt: donation.createdAt // for sorting
  }));

  // Sort by date (newest first)
  formattedDonations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Donations', { 
      views: [{ rightToLeft: false }] 
    });

    // Set column headers
    worksheet.columns = [
      { header: 'Organization', key: 'organizationName', width: 30 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
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

    // Generate buffer and convert to base64
    const buffer = await workbook.xlsx.writeBuffer();
    return { 
      format: 'excel', 
      data: [...new Uint8Array(buffer)] // Convert buffer to array
    };
  } else {
    // CSV format
    const csvRows = [
      ['Organization', 'Phone Number', 'Amount', 'Date'],
      ...formattedDonations.map(d => [
        d.organizationName,
        d.phoneNumber,
        d.amount,
        d.date
      ])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    return { format: 'csv', data: csvContent };
  }
}
