const socket = io();

const input = document.getElementById('input');
const messages = document.getElementById('messages'); //obsolete
const chatMessages = document.getElementById('chat-messages');
const sendBtn = document.getElementById('send');
const nextBtn = document.getElementById('next');

sendBtn.onclick = () => {
  const msg = input.value;
  if (msg.trim()) {
    appendMessage(`You: ${msg}`);
    socket.emit('message', msg);
    input.value = '';
  }
};

nextBtn.onclick = () => {
  appendMessage('🔁 Searching for a new partner...');
  socket.emit('next');
};

socket.on('message', msg => {
  appendMessage(`Stranger: ${msg}`);
});

socket.on('matched', () => {
  appendMessage('✅ You are now connected to a stranger.');
});

socket.on('partner-left', () => {
  appendMessage('❌ Stranger disconnected.');
});

//obsolete
function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendMessageRecieve(msg) {
  const div = document.createElement('div');
  div.className = "message-received"
  div.textContent = msg;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = messages.scrollHeight;
}

function appendMessageSent(msg) {
  const div = document.createElement('div');
  div.className = "message-sent"
  div.textContent = msg;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = messages.scrollHeight;
}