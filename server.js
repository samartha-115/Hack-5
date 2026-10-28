const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'database.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- In-Memory Database with Seed Data ---
const DEFAULT_IMAGE_WATCH = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
const DEFAULT_IMAGE_CAMERA = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80';
const DEFAULT_IMAGE_SNEAKERS = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80';
const DEFAULT_IMAGE_HEADPHONES = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';

let db = {
  users: [
    {
      id: 'USR-101',
      name: 'Sarah Connor',
      email: 'auctioner1@liveauction.com',
      password: 'password123',
      role: 'auctioner',
      balance: 1500,
      transactions: [
        {
          id: 'TXN-001',
          type: 'credit',
          amount: 1500,
          description: 'Initial Seller Deposit & Verification Grant',
          roomId: 'SYSTEM',
          counterpartyId: 'SYSTEM',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ],
      wonItems: [],
      createdRooms: ['ROOM-5001']
    },
    {
      id: 'USR-102',
      name: 'Marcus Vance',
      email: 'auctioner2@liveauction.com',
      password: 'password123',
      role: 'auctioner',
      balance: 850,
      transactions: [
        {
          id: 'TXN-002',
          type: 'credit',
          amount: 850,
          description: 'Opening Escrow Deposit',
          roomId: 'SYSTEM',
          counterpartyId: 'SYSTEM',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      wonItems: [],
      createdRooms: ['ROOM-5002']
    },
    {
      id: 'USR-201',
      name: 'Alex Mercer',
      email: 'bidder1@liveauction.com',
      password: 'password123',
      role: 'bidder',
      balance: 18500,
      transactions: [
        {
          id: 'TXN-003',
          type: 'credit',
          amount: 18500,
          description: 'Bank Wire Liquidity Deposit',
          roomId: 'SYSTEM',
          counterpartyId: 'SYSTEM',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ],
      wonItems: [],
      createdRooms: []
    },
    {
      id: 'USR-202',
      name: 'Elena Rostova',
      email: 'bidder2@liveauction.com',
      password: 'password123',
      role: 'bidder',
      balance: 6200,
      transactions: [
        {
          id: 'TXN-004',
          type: 'credit',
          amount: 6200,
          description: 'Verified Bidder Account Credit',
          roomId: 'SYSTEM',
          counterpartyId: 'SYSTEM',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      wonItems: [],
      createdRooms: []
    }
  ],
  rooms: [
    {
      id: 'ROOM-5001',
      auctionerId: 'USR-101',
      auctionerName: 'Sarah Connor',
      title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera (Brand New)',
      category: 'Electronics & Tech',
      brand: 'Sony',
      condition: 'Brand New (Factory Sealed)',
      description: '33MP Full-Frame Exmor R CMOS Sensor, 4K 60p 10-Bit Video, BIONZ XR Image Processor, 8-stop IBIS, dual UHS-II SD/CFexpress card slots. Includes 24-70mm f/2.8 G-Master lens and 3 years manufacturer warranty. Pristine factory seal.',
      images: [
        DEFAULT_IMAGE_CAMERA,
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&auto=format&fit=crop&q=80'
      ],
      minBid: 2400,
      currentBid: 2400,
      highestBidderId: null,
      highestBidderName: null,
      status: 'active', // active, going_once, going_twice, sold, completed
      stageMessage: 'Auction is LIVE. Bids are being accepted.',
      paymentStatus: 'not_paid', // not_paid, under_process, paid
      connectedUsers: [],
      bidHistory: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'ROOM-5002',
      auctionerId: 'USR-102',
      auctionerName: 'Marcus Vance',
      title: 'Omega Speedmaster Professional Chronograph (Moonwatch)',
      category: 'Watches & Luxury',
      brand: 'Omega',
      condition: 'Mint Condition with Papers',
      description: 'Certified Master Chronometer Co-Axial Calibre 3861, Hesalite crystal, legendary manual-winding flight-qualified for NASA Apollo missions. Complete set with presentation box, extra NATO strap, loupe, and international warranty card.',
      images: [
        DEFAULT_IMAGE_WATCH,
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80'
      ],
      minBid: 5500,
      currentBid: 5500,
      highestBidderId: null,
      highestBidderName: null,
      status: 'active',
      stageMessage: 'Auction is LIVE. Opening bid set at $5,500.',
      paymentStatus: 'not_paid',
      connectedUsers: [],
      bidHistory: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'ROOM-5003',
      auctionerId: 'USR-101',
      auctionerName: 'Sarah Connor',
      title: 'Bose QuietComfort Ultra Wireless Noise Cancelling Headphones',
      category: 'Audio & Music',
      brand: 'Bose',
      condition: 'Brand New',
      description: 'Breakthrough spatialized audio with CustomTune sound calibration, world-class active noise cancellation, ultra-soft luxury earcups, and 24-hour battery life. Deep Black finish.',
      images: [
        DEFAULT_IMAGE_HEADPHONES,
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
      ],
      minBid: 350,
      currentBid: 350,
      highestBidderId: null,
      highestBidderName: null,
      status: 'active',
      stageMessage: 'Auction is LIVE. Accepting initial bids.',
      paymentStatus: 'not_paid',
      connectedUsers: [],
      bidHistory: [],
      createdAt: new Date().toISOString()
    }
  ]
};

// Persistence Helpers
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const loaded = JSON.parse(content);
      if (loaded.users && Array.isArray(loaded.users)) {
        db.users = loaded.users;
      }
      if (loaded.rooms && Array.isArray(loaded.rooms)) {
        db.rooms = loaded.rooms;
      }
    } else {
      saveData();
    }
  } catch (err) {
    console.error('Error loading database file, using in-memory defaults:', err.message);
  }
}

function saveData() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err.message);
  }
}

loadData();

// --- Real-time SSE Connections Registry ---
const sseClients = new Set();

function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// MIME types dictionary for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Utility to parse request JSON bodies
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) { // 10MB limit for image uploads
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- Real-time SSE Stream ---
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 2000\n\n');

    const clientObj = { req, res, query: parsedUrl.query };
    sseClients.add(clientObj);

    req.on('close', () => {
      sseClients.delete(clientObj);
    });
    return;
  }

  // --- API Routes ---

  // 1. Get System Stats (user count constraint check)
  if (pathname === '/api/system/stats' && req.method === 'GET') {
    return sendJson(res, 200, {
      userCount: db.users.length,
      maxUsers: 10,
      availableSlots: Math.max(0, 10 - db.users.length),
      activeRoomsCount: db.rooms.filter(r => r.status !== 'completed').length
    });
  }

  // 2. User Authentication (Login) - Checked against database
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      loadData(); // Ensure fresh database state
      const { email, password, role } = await parseJsonBody(req);
      const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
      
      if (!user) {
        return sendJson(res, 401, { error: 'Account not found with this email. Please create an account.' });
      }
      if (user.password !== password) {
        return sendJson(res, 401, { error: 'Incorrect password entered.' });
      }

      // If user selected a different portal on the home screen, automatically adopt their registered role
      return sendJson(res, 200, { 
        success: true, 
        user,
        roleSwitched: Boolean(role && user.role !== role)
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 3. User Authentication (Register) - Stored in database for future logins
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      loadData(); // Ensure fresh database state
      if (db.users.length >= 10) {
        return sendJson(res, 400, { 
          error: 'Registration Limit Exceeded: The platform strictly permits a maximum of 10 registered users across the entire system. Please log in to an existing demo account.' 
        });
      }

      const { name, email, password, role, initialBalance } = await parseJsonBody(req);
      if (!name || !email || !password || !role) {
        return sendJson(res, 400, { error: 'Name, email, password, and role are required.' });
      }

      const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        return sendJson(res, 400, { error: 'An account with this email already exists. Please log in.' });
      }

      const startingBalance = role === 'bidder' 
        ? (Number(initialBalance) > 0 ? Number(initialBalance) : 10000)
        : (Number(initialBalance) >= 0 ? Number(initialBalance) : 1000);

      const nextNum = db.users.length + 101;
      const newUser = {
        id: `USR-${nextNum}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: role === 'auctioner' ? 'auctioner' : 'bidder',
        balance: startingBalance,
        transactions: [
          {
            id: `TXN-${Date.now().toString().slice(-6)}`,
            type: 'credit',
            amount: startingBalance,
            description: `Initial ${role === 'bidder' ? 'Bidding Collateral' : 'Seller Verification'} Balance`,
            roomId: 'SYSTEM',
            counterpartyId: 'SYSTEM',
            timestamp: new Date().toISOString()
          }
        ],
        wonItems: [],
        createdRooms: []
      };

      db.users.push(newUser);
      saveData();

      broadcastEvent('SYSTEM_USERS_UPDATED', { count: db.users.length });

      return sendJson(res, 201, { success: true, user: newUser });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 4. Get User Details & Balances
  if (pathname.startsWith('/api/users/') && req.method === 'GET') {
    const userId = pathname.split('/')[3];
    const user = db.users.find(u => u.id === userId);
    if (!user) return sendJson(res, 404, { error: 'User not found' });
    return sendJson(res, 200, { user });
  }

  // 5. User Account Top-up (Convenient Balance adjustment for live testing)
  if (pathname.startsWith('/api/users/') && pathname.endsWith('/balance') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const userId = parts[3];
      const { amount, note } = await parseJsonBody(req);
      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      const topup = Number(amount);
      if (isNaN(topup) || topup <= 0) {
        return sendJson(res, 400, { error: 'Invalid top-up amount' });
      }

      user.balance += topup;
      const txn = {
        id: `TXN-${Date.now().toString().slice(-6)}`,
        type: 'credit',
        amount: topup,
        description: note || 'Account Funds Deposit / Top-up',
        roomId: 'ESCROW-WALLET',
        counterpartyId: 'SELF',
        timestamp: new Date().toISOString()
      };
      user.transactions.unshift(txn);
      saveData();

      broadcastEvent('USER_BALANCE_UPDATED', { userId: user.id, balance: user.balance, txn });
      return sendJson(res, 200, { success: true, balance: user.balance, transactions: user.transactions });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 6. List Rooms / Search (Amazon style product catalog with search query)
  if (pathname === '/api/rooms' && req.method === 'GET') {
    const searchQuery = (parsedUrl.query.q || '').toString().toLowerCase().trim();
    const category = (parsedUrl.query.category || '').toString().trim();
    const status = (parsedUrl.query.status || '').toString().trim();

    let rooms = db.rooms.filter(r => r.status !== 'completed');

    if (searchQuery) {
      rooms = rooms.filter(r => 
        r.title.toLowerCase().includes(searchQuery) ||
        r.description.toLowerCase().includes(searchQuery) ||
        r.category.toLowerCase().includes(searchQuery) ||
        (r.brand && r.brand.toLowerCase().includes(searchQuery))
      );
    }

    if (category && category !== 'All') {
      rooms = rooms.filter(r => r.category.toLowerCase() === category.toLowerCase());
    }

    if (status) {
      rooms = rooms.filter(r => r.status === status);
    }

    return sendJson(res, 200, { rooms, total: rooms.length });
  }

  // 7. Create Room (User 1 - Auctioner)
  if (pathname === '/api/rooms' && req.method === 'POST') {
    try {
      const {
        auctionerId,
        title,
        category,
        brand,
        condition,
        description,
        images,
        minBid
      } = await parseJsonBody(req);

      const auctioner = db.users.find(u => u.id === auctionerId && u.role === 'auctioner');
      if (!auctioner) {
        return sendJson(res, 403, { error: 'Only authorized Auctioneers can create an auction room.' });
      }

      if (!title || !description || !minBid || Number(minBid) <= 0) {
        return sendJson(res, 400, { error: 'Item title, description, and a valid minimum bid are required.' });
      }

      const startingPrice = Number(minBid);
      const roomId = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

      // Provide realistic default high-res image if none provided
      let itemImages = Array.isArray(images) && images.length > 0 ? images.filter(Boolean) : [];
      if (itemImages.length === 0) {
        itemImages = [DEFAULT_IMAGE_CAMERA];
      }

      const newRoom = {
        id: roomId,
        auctionerId: auctioner.id,
        auctionerName: auctioner.name,
        title: title.trim(),
        category: category || 'Electronics & Tech',
        brand: brand || 'Generic / Collector Spec',
        condition: condition || 'Brand New',
        description: description.trim(),
        images: itemImages,
        minBid: startingPrice,
        currentBid: startingPrice,
        highestBidderId: null,
        highestBidderName: null,
        status: 'active',
        stageMessage: `Auction is LIVE! Starting bid is $${startingPrice.toLocaleString()}.`,
        paymentStatus: 'not_paid',
        connectedUsers: [],
        bidHistory: [],
        createdAt: new Date().toISOString()
      };

      db.rooms.unshift(newRoom);
      auctioner.createdRooms.push(roomId);
      saveData();

      broadcastEvent('ROOM_CREATED', newRoom);
      return sendJson(res, 201, { success: true, room: newRoom });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 8. Get Single Room Details
  if (pathname.startsWith('/api/rooms/') && req.method === 'GET') {
    const roomId = pathname.split('/')[3];
    const room = db.rooms.find(r => r.id === roomId);
    if (!room) return sendJson(res, 404, { error: 'Auction room not found or has concluded.' });
    return sendJson(res, 200, { room });
  }

  // 9. Join Room & Verify Entry Balance Requirement
  // "The user can get into a room only if the current bid is less than or equal to the user 2 account balance."
  if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/join') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const roomId = parts[3];
      const { userId } = await parseJsonBody(req);
      const room = db.rooms.find(r => r.id === roomId);
      if (!room) return sendJson(res, 404, { error: 'Auction room not found' });

      const user = db.users.find(u => u.id === userId);
      if (!user) return sendJson(res, 404, { error: 'User not found' });

      // If user is a bidder (User 2), verify entry rule:
      if (user.role === 'bidder') {
        if (room.currentBid > user.balance) {
          return sendJson(res, 403, {
            error: `Entry Denied: The current bid of $${room.currentBid.toLocaleString()} exceeds your account balance of $${user.balance.toLocaleString()}. Bidders can only enter rooms where the bid is less than or equal to their account balance.`,
            currentBid: room.currentBid,
            userBalance: user.balance
          });
        }
      }

      // Add to connected users if not already present
      const isViewer = user.role === 'bidder' && room.currentBid > user.balance;
      const existingUserIndex = room.connectedUsers.findIndex(u => u.userId === user.id);
      if (existingUserIndex >= 0) {
        room.connectedUsers[existingUserIndex].isViewer = isViewer;
      } else {
        room.connectedUsers.push({
          userId: user.id,
          name: user.name,
          role: user.role,
          isViewer,
          joinedAt: new Date().toISOString()
        });
      }

      broadcastEvent('ROOM_AUDIENCE_UPDATED', {
        roomId: room.id,
        connectedUsers: room.connectedUsers
      });

      return sendJson(res, 200, { 
        success: true, 
        room, 
        isViewer,
        role: user.role 
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 10. Place Bid (User 2 - Bidder)
  // "The user can bid by raising the prise as their requirement (number bar to enter the amount to bid)."
  // "If the current bid is more than the account balance of the user 2 during the auction, then the user 2 is made as a viewer"
  if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/bid') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const roomId = parts[3];
      const { bidderId, bidAmount } = await parseJsonBody(req);

      const room = db.rooms.find(r => r.id === roomId);
      if (!room) return sendJson(res, 404, { error: 'Auction room not found' });

      if (room.status === 'sold' || room.status === 'completed') {
        return sendJson(res, 400, { error: 'This auction has concluded. Bidding is closed.' });
      }

      const bidder = db.users.find(u => u.id === bidderId && u.role === 'bidder');
      if (!bidder) {
        return sendJson(res, 403, { error: 'Only registered Bidders can submit bids.' });
      }

      const amount = Number(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        return sendJson(res, 400, { error: 'Please enter a valid bid amount.' });
      }

      // Check balance: bidder cannot bid more than their account balance
      if (amount > bidder.balance) {
        return sendJson(res, 400, {
          error: `Insufficient Account Balance: Your current balance is $${bidder.balance.toLocaleString()}, but your bid is $${amount.toLocaleString()}.`
        });
      }

      // Check amount: must be strictly greater than current bid (or >= minBid if no bids yet)
      const minimumRequired = room.bidHistory.length === 0 ? room.minBid : room.currentBid + 1;
      if (amount < minimumRequired) {
        return sendJson(res, 400, {
          error: `Bid must be at least $${minimumRequired.toLocaleString()} (higher than current bid).`
        });
      }

      // Reset any going once / going twice calls because a new competitive bid arrived!
      room.status = 'active';
      room.currentBid = amount;
      room.highestBidderId = bidder.id;
      room.highestBidderName = bidder.name;
      room.stageMessage = `New highest bid: $${amount.toLocaleString()} placed by ${bidder.name} (${bidder.id})!`;

      const bidRecord = {
        id: `BID-${Date.now().toString().slice(-6)}`,
        userId: bidder.id,
        userName: bidder.name,
        amount,
        timestamp: new Date().toISOString()
      };
      room.bidHistory.unshift(bidRecord);

      // Re-evaluate viewer status for all connected bidders in the room:
      // If current bid is more than account balance, they become viewers!
      for (const attendee of room.connectedUsers) {
        if (attendee.role === 'bidder') {
          const userObj = db.users.find(u => u.id === attendee.userId);
          if (userObj && room.currentBid > userObj.balance) {
            attendee.isViewer = true;
          }
        }
      }

      saveData();

      broadcastEvent('BID_PLACED', {
        roomId: room.id,
        bid: bidRecord,
        currentBid: room.currentBid,
        highestBidderId: room.highestBidderId,
        highestBidderName: room.highestBidderName,
        stageMessage: room.stageMessage,
        connectedUsers: room.connectedUsers
      });

      return sendJson(res, 200, { 
        success: true, 
        currentBid: room.currentBid,
        bidRecord 
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 11. Auctioneer Stage Control: Going Once, Going Twice, SOLD
  // "the auctioner must go (going once.. going twice.. SOLD) mentioning the user ID to whom it is sold"
  if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/stage') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const roomId = parts[3];
      const { auctionerId, action } = await parseJsonBody(req);

      const room = db.rooms.find(r => r.id === roomId);
      if (!room) return sendJson(res, 404, { error: 'Auction room not found' });

      if (room.auctionerId !== auctionerId) {
        return sendJson(res, 403, { error: 'Only the host Auctioneer can manage stage announcements.' });
      }

      if (!room.highestBidderId) {
        return sendJson(res, 400, { error: 'Cannot advance auction hammer without at least one valid bid.' });
      }

      const winnerId = room.highestBidderId;
      const winnerName = room.highestBidderName;
      const winningAmount = room.currentBid;

      if (action === 'going_once') {
        room.status = 'going_once';
        room.stageMessage = `Going ONCE to Bidder ${winnerId} (${winnerName}) for $${winningAmount.toLocaleString()}!`;
      } else if (action === 'going_twice') {
        room.status = 'going_twice';
        room.stageMessage = `Going TWICE to Bidder ${winnerId} (${winnerName}) for $${winningAmount.toLocaleString()}! Any last bids?`;
      } else if (action === 'sold') {
        room.status = 'sold';
        room.paymentStatus = 'not_paid';
        room.stageMessage = `🔨 SOLD to Bidder [${winnerId}] (${winnerName}) for $${winningAmount.toLocaleString()}! Deal closed. Proceed to payment.`;
      } else {
        return sendJson(res, 400, { error: 'Invalid action. Choose going_once, going_twice, or sold.' });
      }

      saveData();

      broadcastEvent('AUCTION_STAGE_UPDATED', {
        roomId: room.id,
        status: room.status,
        stageMessage: room.stageMessage,
        winnerId,
        winnerName,
        winningAmount,
        paymentStatus: room.paymentStatus
      });

      return sendJson(res, 200, {
        success: true,
        status: room.status,
        stageMessage: room.stageMessage,
        paymentStatus: room.paymentStatus
      });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // 12. Payment Status Transition & Finalization
  // "There must be an indication to the auctioner on the payment by the highest bidder (paid, not paid or payment under process)."
  // "Once the amount is payed the item is sold and the room deletes."
  // "Once the payment is done the user 1 account gets credited with amount, user 2 accounts gets debited with the amount and the user 2 gets the item."
  if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/payment') && req.method === 'POST') {
    try {
      const parts = pathname.split('/');
      const roomId = parts[3];
      const { bidderId, status: newStatus } = await parseJsonBody(req);

      const room = db.rooms.find(r => r.id === roomId);
      if (!room) return sendJson(res, 404, { error: 'Auction room not found' });

      if (room.highestBidderId !== bidderId) {
        return sendJson(res, 403, { error: 'Only the winning highest bidder can execute payment.' });
      }

      if (newStatus === 'under_process') {
        room.paymentStatus = 'under_process';
        saveData();

        broadcastEvent('PAYMENT_STATUS_UPDATED', {
          roomId: room.id,
          paymentStatus: 'under_process',
          bidderId,
          message: `Payment initiated by ${room.highestBidderName} (${bidderId}). Processing in secure escrow...`
        });

        return sendJson(res, 200, { success: true, paymentStatus: 'under_process' });
      }

      if (newStatus === 'paid') {
        const bidder = db.users.find(u => u.id === bidderId);
        const auctioner = db.users.find(u => u.id === room.auctionerId);

        if (!bidder || !auctioner) {
          return sendJson(res, 400, { error: 'Auction participants could not be found' });
        }

        const amount = room.currentBid;

        if (bidder.balance < amount) {
          return sendJson(res, 400, {
            error: `Payment Failed: Insufficient funds. Balance: $${bidder.balance.toLocaleString()}, Required: $${amount.toLocaleString()}`
          });
        }

        // Execute Financial Settlement
        bidder.balance -= amount;
        auctioner.balance += amount;

        // Record User 2 (Bidder) Debit Transaction
        const bidderTxn = {
          id: `TXN-${Date.now().toString().slice(-6)}D`,
          type: 'debit',
          amount: amount,
          description: `Auction Purchase: ${room.title}`,
          roomId: room.id,
          counterpartyId: auctioner.id,
          timestamp: new Date().toISOString()
        };
        bidder.transactions.unshift(bidderTxn);

        // Record User 1 (Auctioner) Credit Transaction
        const auctionerTxn = {
          id: `TXN-${Date.now().toString().slice(-6)}C`,
          type: 'credit',
          amount: amount,
          description: `Auction Proceeds: ${room.title} (Sold to ${bidder.name})`,
          roomId: room.id,
          counterpartyId: bidder.id,
          timestamp: new Date().toISOString()
        };
        auctioner.transactions.unshift(auctionerTxn);

        // User 2 gets the item
        const wonItemRecord = {
          id: `ITEM-${Date.now().toString().slice(-6)}`,
          title: room.title,
          category: room.category,
          brand: room.brand,
          images: room.images,
          purchasePrice: amount,
          sellerId: auctioner.id,
          sellerName: auctioner.name,
          roomId: room.id,
          purchasedAt: new Date().toISOString()
        };
        bidder.wonItems.unshift(wonItemRecord);

        room.paymentStatus = 'paid';
        room.status = 'completed';

        // Broadcast final payment success to all participants
        broadcastEvent('PAYMENT_STATUS_UPDATED', {
          roomId: room.id,
          paymentStatus: 'paid',
          bidderId: bidder.id,
          auctionerId: auctioner.id,
          amount: amount,
          itemTitle: room.title,
          message: `Payment successful! $${amount.toLocaleString()} transferred to ${auctioner.name}. Room will now close.`
        });

        // Notify updated balances to both users
        broadcastEvent('USER_BALANCE_UPDATED', { userId: bidder.id, balance: bidder.balance, txn: bidderTxn });
        broadcastEvent('USER_BALANCE_UPDATED', { userId: auctioner.id, balance: auctioner.balance, txn: auctionerTxn });

        // Room deletes from active rooms
        const deletedRoomId = room.id;
        db.rooms = db.rooms.filter(r => r.id !== deletedRoomId);
        saveData();

        broadcastEvent('ROOM_DELETED', {
          roomId: deletedRoomId,
          itemWon: wonItemRecord,
          buyerId: bidder.id,
          sellerId: auctioner.id
        });

        return sendJson(res, 200, {
          success: true,
          paymentStatus: 'paid',
          newBalance: bidder.balance,
          wonItem: wonItemRecord
        });
      }

      return sendJson(res, 400, { error: 'Unknown payment status action.' });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // --- Static File Serving ---
  let safePath = path.normalize(pathname);
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check against directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client routing
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404);
          return res.end('File Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err2, data) => {
      if (err2) {
        res.writeHead(500);
        return res.end('Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Live Auction Server listening on http://localhost:${PORT}`);
  console.log(`Max Registered Users Constraint: ${db.users.length}/10`);
});
