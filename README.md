# 🩸 RaktSetu — Bridging Lives, One Drop at a Time

RaktSetu is a centralized, smart blood donation management platform designed to solve the critical issue of blood scarcity and logistical delays during emergencies. By connecting **Patients**, **Donors**, and **Hospitals** on a single unified interface, RaktSetu ensures that no life is lost due to the unavailability of blood when it is needed most.

Built with **Gemma 4**.

---

## 🚨 The Problem

- **Scarcity & Mismanagement** — Lack of real-time data on blood availability leads to panic and delays.
- **Communication Gap** — Patients often struggle to find donors or hospitals with specific blood groups nearby.
- **Logistical Hurdles** — Inefficient coordination between multiple hospitals and blood banks.

## 💡 The Solution

RaktSetu provides a real-time, location-aware bridge between supply (Donors/Hospitals) and demand (Patients).

## ✨ Features

- **Smart Matching System** — Automatically notifies compatible donors and hospitals within the city when a request is raised.
- **Real-Time Availability** — Hospitals can manage and display their live blood stock.
- **Donor Management** — Tracks donor details, blood group, donation history, and eligibility status, with automated reminders for eligible donors.
- **Emergency Requests** — Patients/hospitals can raise urgent blood requests that trigger instant alerts to nearby matching donors.
- **Hospital Dashboard** — A dedicated portal for hospitals to manage inventory, incoming requests, and donor coordination.
- **Secure Authentication** — Role-based, secure login for Patients, Donors, and Hospital staff.
- **Location-Aware Search** — Finds the nearest available donors/hospitals based on blood group and geography.

---

## 🛠️ Tech Stack

> Update this section to match your actual stack — placeholders below follow a typical MERN-style setup.

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js / Express.js |
| Database | MongoDB |
| Authentication | JWT-based Auth |
| AI/Assistant Layer | Gemma 4 |
| Deployment | (e.g. Vercel / Render / Railway) |

---

## 📂 Project Structure

```
RaktSetu/
├── client/              # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
├── server/              # Backend application
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── ...
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/krit-k7/RaktSetu.git
   cd RaktSetu
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

5. **Run the backend server**
   ```bash
   cd server
   npm run dev
   ```

6. **Run the frontend**
   ```bash
   cd client
   npm start
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License — see the `LICENSE` file for details.

---

## 🙏 Acknowledgements

- Built with **Gemma 4**
- Inspired by the real-world need for faster, smarter blood donation coordination in emergencies

---

### ❤️ RaktSetu — *Every Drop, a Universe of Hope*
