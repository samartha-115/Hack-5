# ⚡ LiveBazaar - Real-Time Live Auction Marketplace

A modern, high-contrast, Amazon-grade live auction web application built with pure Node.js, real-time Server-Sent Events (SSE), and Web Audio API synthesized sound effects.

---

## 🌟 Key Features & Requirements Matrix

### 🎭 Role Selection Entry Portal
- When any user arrives at the website, they select their role:
  - **User 1 (Auctioneer)**: Host auctions, create Amazon-style product rooms, call the live hammer.
  - **User 2 (Bidder)**: Search live catalogs, bid on items, enter rooms matching balance, secure escrow checkout.

---

### 🏛️ USER 1 (Auctioneer) Experience
1. **Authentication & Profile**:
   - Create account or sign in.
   - Directed immediately to **Account Details**, **Liquid Account Balance**, and **Previous Transaction History**.
2. **Put Item on Auction (Create Room)**:
   - Amazon-grade product creation form:
     - High-resolution product images (presets included: MacBook Pro M3 Max, Rolex Submariner, Leica M11, Air Jordan 1s + custom URLs).
     - Product title, category, brand, condition, and detailed technical specifications.
     - **Minimum starting bid amount**.
   - Launching creates a live room open for bidders to join.
3. **Live Auction Command Stage**:
   - Real-time bid ticker & leading bidder display.
   - Sequence live hammer announcements:
     - 📢 **Going Once..**
     - 📢 **Going Twice..**
     - 🔨 **SOLD to [Winner User ID]!** (explicitly mentions the user ID of the winning bidder).
4. **Live Payment Status Tracking**:
   - Instant visual indicator on the host screen:
     - 🔴 `Not Paid`
     - 🟡 `Payment under process` (flashing animation while buyer checks out)
     - 🟢 `Paid` (funds transferred directly to host balance)
5. **Auto-Closure**:
   - Once payment is completed, the room is deleted from active listings and archived.

---

### 🎯 USER 2 (Bidder) Experience
1. **Authentication & Profile**:
   - Create account or sign in (starts with verified liquid bidding balance).
   - Directed to **Account Details**, **Account Balance**, and **Previous Transactions**.
2. **Amazon-Style Marketplace & Search**:
   - Global search bar with instant keyword matching by product name, category, or brand.
   - Category filter pills (*Electronics & Tech, Watches & Luxury, Audio & Music, Sneakers*).
   - Visual product cards with star ratings, live badge, current bid, and active audience count.
3. **Room Entry Barrier Rule**:
   - A bidder can enter a room **only if `current_bid <= account_balance`**.
   - If `current_bid > account_balance`, room entry is blocked with an informative alert and prompt to top-up.
4. **Interactive Bidding Console**:
   - Quick increment buttons (`+$50`, `+$100`, `+$250`, `+$500`).
   - Custom **Number Bar** to enter any custom bid raising the price.
5. **Dynamic Viewer Mode**:
   - If the current bid exceeds the bidder's balance during the auction, the bidder is immediately converted to **Viewer Mode**.
   - Bidding controls are disabled; the viewer can continue watching the live auction or exit the room.
6. **Mandatory Locked Payment Portal**:
   - If User 2 is the highest bidder and the deal closes (**SOLD**), they are automatically directed to the **Payment Page**.
   - **Navigation is locked**: User 2 cannot leave, back-navigate, or close the page until payment is executed.
   - On payment:
     - **User 1 account credited** with the winning bid amount.
     - **User 2 account debited** with the winning bid amount.
     - **User 2 receives the item** into their personal Won Items Inventory.
     - Real-time notification and celebration with confetti!
     - Room is automatically deleted.

---

### 🔒 System Capacity Constraint
- **Strict Limit: Maximum 10 Users**:
  - Enforced at both database and registration API levels.
  - Real-time tracker in the navigation bar displays registered count (e.g. `Users: 4/10`).
  - Pre-seeded with 4 instant-demo accounts (2 Auctioneers, 2 Bidders) leaving 6 open registration slots.

---

### 🎨 Visual & Audio Design
- **High-Contrast Palette**: Deep slate navy background (`#0B1329`, `#131C38`), Amazon amber gold (`#FF9900`, `#F59E0B`), emerald green (`#10B981`), and ruby red (`#EF4444`).
- **Web Audio API Synthesizers**: Zero external audio downloads required! Real-time bell chimes on bids, double chimes on going once/twice, and resonant gavel impact on SOLD.

---

## 🚀 How to Run the Project

1. Open a terminal in this directory:
   ```bash
   node server.js
   ```
2. Open your web browser at:
   ```
   http://localhost:3000
   ```

### 💡 Multi-User Testing Tip:
- Open **Tab 1** in standard mode -> Select **Auctioneer (User 1)** -> Log in as `Sarah Connor` (`auctioner1@liveauction.com` / `password123`).
- Open **Tab 2** in an Incognito / Private window -> Select **Bidder (User 2)** -> Log in as `Alex Mercer` (`bidder1@liveauction.com` / `password123`).
- Place live bids from Tab 2, command the stage from Tab 1, and watch real-time payment settlement unfold side-by-side!
