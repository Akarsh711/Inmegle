const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create a transporter object using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail app password
  }
});

let queue = [];
let pairs = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Add to queue and try to match
  queue.push(socket);

  matchUsers();

  socket.on('message', (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      partner.emit('message', msg);
    }
  });

  socket.on('next', () => {
    disconnectPair(socket);
    queue.push(socket);
    matchUsers();
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    disconnectPair(socket);
    queue = queue.filter(s => s !== socket);
  });
});

function matchUsers() {
  while (queue.length >= 2) {
    const user1 = queue.shift();
    const user2 = queue.shift();

    pairs.set(user1.id, user2);
    pairs.set(user2.id, user1);

    user1.emit('matched');
    user2.emit('matched');
  }
}

function disconnectPair(socket) {
  const partner = pairs.get(socket.id);
  if (partner) {
    partner.emit('partner-left');
    pairs.delete(partner.id);
  }
  pairs.delete(socket.id);
}

// Report form endpoint
app.post('/api/report', async (req, res) => {
  const { email, reportType, reportDescription } = req.body;

  const mailOptions = {
    from: "paliwalbunny29@gmail.com",
    to: "palliwalap7@gmail.com", // Send to yourself
    subject: `New Report: ${reportType}`,
    text: `
      Email: ${email || 'No email provided'}
      Report Type: ${reportType}
      Description: ${reportDescription}
    `,
    html: `
      <h2>New Report Received</h2>
      <p><strong>Email:</strong> ${email || 'No email provided'}</p>
      <p><strong>Report Type:</strong> ${reportType}</p>
      <p><strong>Description:</strong></p>
      <p>${reportDescription}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
  // console.log("recieved the mail")
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

