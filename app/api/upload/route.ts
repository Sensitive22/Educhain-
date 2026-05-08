import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const pinataJwt = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataApiSecret = process.env.PINATA_API_SECRET;

    if (!pinataJwt && (!pinataApiKey || !pinataApiSecret)) {
      return NextResponse.json(
        { error: 'Pinata credentials not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
      },
    });
    pinataFormData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append('pinataOptions', pinataOptions);

    const headers: HeadersInit = {};

    if (pinataJwt) {
      headers['Authorization'] = `Bearer ${pinataJwt}`;
    } else if (pinataApiKey && pinataApiSecret) {
      const auth = Buffer.from(`${pinataApiKey}:${pinataApiSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('Pinata error:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload to Pinata IPFS' },
        { status: pinataResponse.status }
      );
    }

    const data = await pinataResponse.json();

    return NextResponse.json({
      cid: data.IpfsHash,
      success: true,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    );
  }
}