'use strict';
const form = document.getElementById('keyForm');
const err = document.getElementById('error');
const rows = document.getElementById('rows');

function cell(text) { const td = document.createElement('td'); td.textContent = text; return td; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.textContent = '';
  const key = document.getElementById('key').value;
  const res = await fetch('/api/patients', { headers: { 'X-API-Key': key } });
  if (!res.ok) { err.textContent = res.status === 401 ? 'That access key is not valid.' : 'Too many attempts. Wait a minute and try again.'; return; }
  const list = await res.json();
  rows.replaceChildren(...list.map(p => {
    const tr = document.createElement('tr');
    [p.id, p.name, p.age, p.bloodGroup, p.ward, p.condition, p.phone, p.aadhaar].forEach(v => tr.appendChild(cell(v)));
    return tr;
  }));
  document.getElementById('login').hidden = true;
  document.getElementById('records').hidden = false;
});

document.getElementById('lock').addEventListener('click', () => {
  rows.replaceChildren();
  document.getElementById('key').value = '';
  document.getElementById('records').hidden = true;
  document.getElementById('login').hidden = false;
});
