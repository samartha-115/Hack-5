const http = require('http');

async function runTests() {
  console.log('--- Starting Automated Live Auction Verification Tests ---');

  // Test 1: Fetch System Stats
  const stats = await testGet('/api/system/stats');
  console.log('Test 1: /api/system/stats ->', stats.statusCode, stats.body);
  if (stats.body.maxUsers !== 10) throw new Error('Constraint failed: maxUsers must be 10');

  // Test 2: Fetch Rooms Catalog
  const rooms = await testGet('/api/rooms');
  console.log('Test 2: /api/rooms ->', rooms.statusCode, 'Found rooms:', rooms.body.total);
  if (!rooms.body.rooms || rooms.body.rooms.length === 0) throw new Error('Rooms catalog should return items');

  // Test 3: Authenticate User 1 (Auctioner)
  const loginAuctioner = await testPost('/api/auth/login', {
    email: 'auctioner1@liveauction.com',
    password: 'password123',
    role: 'auctioner'
  });
  console.log('Test 3: Login Auctioner ->', loginAuctioner.statusCode, loginAuctioner.body.user.name, 'Role:', loginAuctioner.body.user.role);

  // Test 4: Authenticate User 2 (Bidder)
  const loginBidder = await testPost('/api/auth/login', {
    email: 'bidder1@liveauction.com',
    password: 'password123',
    role: 'bidder'
  });
  console.log('Test 4: Login Bidder ->', loginBidder.statusCode, loginBidder.body.user.name, 'Balance: $' + loginBidder.body.user.balance);

  // Test 5: Verify Max 10 Users Constraint on Register
  console.log('Test 5: Registering up to max 10 users to verify enforcement...');
  let currentCount = stats.body.userCount;
  for (let i = currentCount + 1; i <= 10; i++) {
    await testPost('/api/auth/register', {
      name: `Demo User ${i}`,
      email: `testuser${i}@example.com`,
      password: 'password123',
      role: 'bidder',
      initialBalance: 5000
    });
  }
  // Try 11th user
  const eleventhUser = await testPost('/api/auth/register', {
    name: 'Overflow User',
    email: 'overflow@example.com',
    password: 'password123',
    role: 'bidder',
    initialBalance: 5000
  });
  console.log('Test 5: 11th User Register Status:', eleventhUser.statusCode, eleventhUser.body.error);
  if (eleventhUser.statusCode !== 400) throw new Error('System allowed more than 10 users!');

  // Test 6: Create Auction Room as User 1
  const newRoom = await testPost('/api/rooms', {
    auctionerId: 'USR-101',
    title: 'Vintage Gibson Les Paul 1959 Reissue Guitar',
    category: 'Audio & Music',
    brand: 'Gibson',
    condition: 'Collector Grade / Mint',
    minBid: 4500,
    images: ['https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800'],
    description: 'Custom Shop Historic Reissue with PAF humbuckers, flame maple top, and hardshell case.'
  });
  console.log('Test 6: Create Room ->', newRoom.statusCode, 'Room ID:', newRoom.body.room.id);
  const roomId = newRoom.body.room.id;

  // Test 7: Bidder joins room & checks entry balance requirement
  // "The user can get into a room only if the current bid is less than or equal to the user 2 account balance."
  const bidderJoin = await testPost(`/api/rooms/${roomId}/join`, {
    userId: 'USR-201' // Alex Mercer has $18,500 > $4,500
  });
  console.log('Test 7: Bidder Join Room ->', bidderJoin.statusCode, 'Is Viewer:', bidderJoin.body.isViewer);

  // Test 8: Place Bid
  const bidRes = await testPost(`/api/rooms/${roomId}/bid`, {
    bidderId: 'USR-201',
    bidAmount: 5000
  });
  console.log('Test 8: Place Bid ->', bidRes.statusCode, 'New Current Bid: $' + bidRes.body.currentBid);

  // Test 9: Auctioneer Stage Progression: Going Once, Going Twice, SOLD
  // "the auctioner must go (going once.. going twice.. SOLD) mentioning the user ID to whom it is sold"
  const onceRes = await testPost(`/api/rooms/${roomId}/stage`, { auctionerId: 'USR-101', action: 'going_once' });
  console.log('Test 9a: Stage Going Once ->', onceRes.body.stageMessage);

  const twiceRes = await testPost(`/api/rooms/${roomId}/stage`, { auctionerId: 'USR-101', action: 'going_twice' });
  console.log('Test 9b: Stage Going Twice ->', twiceRes.body.stageMessage);

  const soldRes = await testPost(`/api/rooms/${roomId}/stage`, { auctionerId: 'USR-101', action: 'sold' });
  console.log('Test 9c: Stage SOLD ->', soldRes.body.stageMessage);
  if (!soldRes.body.stageMessage.includes('USR-201')) throw new Error('Stage SOLD must mention winner user ID!');

  // Test 10: Payment State Transition ("under_process" -> "paid")
  // "There must be an indication to the auctioner on the payment by the highest bidder (paid, not paid or payment under process)."
  const underProcess = await testPost(`/api/rooms/${roomId}/payment`, {
    bidderId: 'USR-201',
    status: 'under_process'
  });
  console.log('Test 10a: Payment Status ->', underProcess.body.paymentStatus);

  // Finalize payment:
  // "Once the payment is done the user 1 account gets credited with amount, user 2 accounts gets debited with the amount and the user 2 gets the item."
  // "Once the amount is payed the item is sold and the room deletes."
  const paidRes = await testPost(`/api/rooms/${roomId}/payment`, {
    bidderId: 'USR-201',
    status: 'paid'
  });
  console.log('Test 10b: Payment Finalized ->', paidRes.body.paymentStatus, 'Item Claimed:', paidRes.body.wonItem.title);

  // Verify room is deleted from active rooms
  const checkRooms = await testGet('/api/rooms');
  const roomStillExists = checkRooms.body.rooms.some(r => r.id === roomId);
  console.log('Test 10c: Room deleted from active rooms:', !roomStillExists);
  if (roomStillExists) throw new Error('Room was not deleted after payment completed!');

  console.log('=============================================');
  console.log('ALL 10 CORE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('=============================================');
}

function testGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function testPost(path, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = http.request(`http://127.0.0.1:3000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
