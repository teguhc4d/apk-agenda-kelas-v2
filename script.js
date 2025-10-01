/* ===================================================
   script.js - Aplikasi Agenda Kelas (LocalStorage)
   Fitur: siswa CRUD, agenda (dgn lampiran), absensi, jadwal,
   modul, kalender (FullCalendar), Chart.js, notifikasi,
   tema, backup/restore, search/filter, multi-kelas.
   =================================================== */

/* ===================================================
   script.js - Aplikasi Agenda Kelas (LocalStorage)
   Final Version (gabungan semua fitur)
   =================================================== */

/* ---------- KEY localStorage (per kelas) ---------- */
const LS_PREFIX = "agendaApp_";
function key(k) {
  const kelas = (document.getElementById('kelasSelect')?.value || 'XI-RPL');
  return `${LS_PREFIX}${kelas}_${k}`;
}

/* ---------- Utility: download file teks ---------- */
function downloadTextFile(filename, text) {
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- TAB NAV ---------- */
function openTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ---------- THEME (dark) ---------- */
const darkToggle = document.getElementById('darkModeToggle');
function loadTheme() {
  const t = localStorage.getItem('agendaTheme') || 'light';
  if (t === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}
darkToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('agendaTheme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

/* ---------- KELAS (multi-class) ---------- */
function gantiKelas(kelas) {
  muatSemuaData();
}

/* ---------- NOTIFIKASI BROWSER ---------- */
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}
requestNotifPermission();

/* ---------- SISWA CRUD ---------- */
function getSiswa() {
  return JSON.parse(localStorage.getItem(key('siswa')) || '[]');
}
function simpanSiswa(arr) {
  localStorage.setItem(key('siswa'), JSON.stringify(arr));
}
function tambahSiswa() {
  const nama = document.getElementById('siswaNama').value.trim();
  const nis = document.getElementById('siswaNIS').value.trim();
  const kelas = document.getElementById('siswaKelas').value || document.getElementById('kelasSelect').value;
  if (!nama || !nis) return alert('Isi NIS dan nama!');
  const arr = getSiswa();
  if (arr.find(s => s.nis === nis && s.kelas === kelas)) return alert('NIS sudah ada di kelas ini!');
  arr.push({ nis, nama, kelas });
  simpanSiswa(arr);
  document.getElementById('siswaNama').value = '';
  document.getElementById('siswaNIS').value = '';
  renderSiswaTable();
  populateSiswaSelect();
}

/* render table siswa */
function renderSiswaTable() {
  const arr = getSiswa();
  const search = (document.getElementById('searchSiswa')?.value || '').toLowerCase();
  const tbody = document.getElementById('siswaTable');
  tbody.innerHTML = '';
  arr.filter(s => !search || s.nama.toLowerCase().includes(search) || s.nis.includes(search))
    .forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.nis}</td><td>${s.nama}</td><td>${s.kelas}</td>
        <td>
          <button onclick="editSiswa('${s.nis}')">Edit</button>
          <button onclick="hapusSiswa('${s.nis}')">Hapus</button>
        </td>`;
      tbody.appendChild(tr);
    });
}
function editSiswa(nis) {
  const arr = getSiswa();
  const s = arr.find(x => x.nis === nis);
  if (!s) return alert('Siswa tidak ditemukan');
  const nama = prompt('Ubah nama:', s.nama);
  if (nama === null) return;
  s.nama = nama;
  simpanSiswa(arr);
  renderSiswaTable();
  populateSiswaSelect();
}
function hapusSiswa(nis) {
  if (!confirm('Hapus siswa?')) return;
  let arr = getSiswa();
  arr = arr.filter(x => x.nis !== nis);
  simpanSiswa(arr);
  renderSiswaTable();
  populateSiswaSelect();
}
function populateSiswaSelect() {
  const sel = document.getElementById('siswaSelect');
  if (!sel) return;
  const arr = getSiswa();
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  arr.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.nama;
    opt.textContent = `${s.nama} (${s.nis})`;
    sel.appendChild(opt);
  });
}

/* ---------- IMPORT SISWA EXCEL ---------- */
function importSiswaExcel() {
  const fileInput = document.getElementById('importSiswaFile');
  if (!fileInput.files.length) return alert("Pilih file Excel/CSV dulu!");
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const arr = getSiswa();
    rows.forEach(r => {
      if (r.NIS && r.Nama) {
        if (!arr.find(s => s.nis === String(r.NIS))) {
          arr.push({
            nis: String(r.NIS),
            nama: r.Nama,
            kelas: r.Kelas || document.getElementById("kelasSelect").value
          });
        }
      }
    });
    simpanSiswa(arr);
    renderSiswaTable();
    populateSiswaSelect();
    alert("Import berhasil!");
  };

  reader.readAsArrayBuffer(file);
}


/* ---------- DOWNLOAD TEMPLATE EXCEL ---------- */
function downloadTemplateSiswa() {
  // Buat data template
  const ws_data = [
    ["NIS", "Nama", "Kelas"],
    ["12345", "Budi Santoso", "XI-RPL"],
    ["12346", "Siti Aminah", "XI-RPL"]
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "TemplateSiswa");

  // Simpan sebagai file Excel
  XLSX.writeFile(wb, "template_siswa.xlsx");
}



/* ---------- AGENDA ---------- */
function getAgenda() { return JSON.parse(localStorage.getItem(key('agenda')) || '[]'); }
function simpanAgenda(arr) { localStorage.setItem(key('agenda'), JSON.stringify(arr)); }
async function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = e => rej(e);
    r.readAsDataURL(file);
  });
}
async function tambahAgenda() {
  const teks = document.getElementById('agendaInput').value.trim();
  const tgl = document.getElementById('agendaDate').value;
  const jam = document.getElementById('agendaJam').value;
  if (!teks || !tgl || !jam) return alert('Isi teks, tanggal, dan jam!');
  let lampiran = null;
  const fileInput = document.getElementById('agendaFile');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    lampiran = await fileToDataUrl(fileInput.files[0]);
  }
  const arr = getAgenda();
  arr.push({ teks, tgl, jam, lampiran, komentar: [] });
  simpanAgenda(arr);
  document.getElementById('agendaInput').value = '';
  renderAgendaList();
  refreshCalendarEvents();
  updateDashboard();
}
function renderAgendaList() {
  const arr = getAgenda();
  const search = (document.getElementById('searchAgenda')?.value || '').toLowerCase();
  const filterJam = (document.getElementById('filterAgendaJam')?.value || '');
  const list = document.getElementById('agendaList');
  list.innerHTML = '';
  arr.filter(a => (!search || a.teks.toLowerCase().includes(search) || a.tgl.includes(search))
                 && (!filterJam || a.jam === filterJam))
    .forEach((a, idx) => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.innerHTML = `<strong>${a.tgl} | Jam ${a.jam}</strong> — ${a.teks}`;
      const right = document.createElement('div');
      right.style.display='flex'; right.style.gap='8px';
      const btnK = document.createElement('button'); btnK.textContent='Komentar'; btnK.onclick = () => {
        const c = prompt('Komentar:'); if (c) { a.komentar.push(c); simpanAgenda(arr); renderAgendaList(); }
      };
      const btnView = document.createElement('button'); btnView.textContent='Lihat'; btnView.onclick = () => {
        let s = `${a.tgl} | Jam ${a.jam}\n${a.teks}\nKomentar:\n${a.komentar.join('\n')}`;
        if (a.lampiran) s += `\n[ada lampiran]`;
        alert(s);
      };
      const btnDel = document.createElement('button'); btnDel.textContent='Hapus'; btnDel.onclick = () => {
        if (!confirm('Hapus agenda?')) return;
        arr.splice(idx,1); simpanAgenda(arr); renderAgendaList(); refreshCalendarEvents(); updateDashboard();
      };
      right.appendChild(btnK); right.appendChild(btnView); right.appendChild(btnDel);
      li.appendChild(left); li.appendChild(right);
      list.appendChild(li);
    });
}
function exportAgendaCSV() {
  const arr = getAgenda();
  if (!arr.length) return alert('Tidak ada agenda');
  let csv = 'tanggal,jam,teks\n';
  arr.forEach(a => csv += `${a.tgl},${a.jam},"${a.teks.replace(/"/g,'""')}"\n`);
  downloadTextFile('agenda.csv', csv);
}
function exportAgendaPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Agenda', 10, 10);
  let y = 20;
  getAgenda().forEach(a => { doc.text(`${a.tgl} | Jam ${a.jam} : ${a.teks}`, 10, y); y+=8; });
  doc.save('agenda.pdf');
}

/* ---------- ABSENSI ---------- */
function getAbsensi() { return JSON.parse(localStorage.getItem(key('absensi')) || '[]'); }
function simpanAbsensi(arr) { localStorage.setItem(key('absensi'), JSON.stringify(arr)); }
function tandaiAbsen() {
  const nama = document.getElementById('siswaSelect').value;
  const status = document.getElementById('statusSelect').value;
  if (!nama || !status) return alert('Pilih siswa & status');
  const arr = getAbsensi();
  const hari = (new Date()).toISOString().slice(0,10);
  arr.push({ nama, status, hari });
  simpanAbsensi(arr);
  renderAbsensiTable(); updateDashboard();
}
function renderAbsensiTable() {
  const arr = getAbsensi();
  const tbody = document.getElementById('absenList');
  const search = (document.getElementById('searchAbsen')?.value || '').toLowerCase();
  const filter = (document.getElementById('filterAbsen')?.value || '');
  tbody.innerHTML = '';
  arr.filter(a => (!search || a.nama.toLowerCase().includes(search)) && (!filter || a.status === filter))
    .forEach((a, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.nama}</td><td>${a.status}</td>
        <td><button onclick="hapusAbsensi(${idx})">Hapus</button></td>`;
      tbody.appendChild(tr);
    });
}
function hapusAbsensi(i) { const arr = getAbsensi(); arr.splice(i,1); simpanAbsensi(arr); renderAbsensiTable(); updateDashboard(); }
function exportAbsensiCSV() {
  const arr = getAbsensi();
  let csv = 'nama,status,tanggal\n';
  arr.forEach(a => csv += `${a.nama},${a.status},${a.hari}\n`);
  downloadTextFile('absensi.csv', csv);
}

/* ---------- CATATAN ---------- */
function simpanCatatan() {
  const teks = document.getElementById('catatanInput').value.trim();
  localStorage.setItem(key('catatan'), teks);
  muatCatatan();
}
function muatCatatan() {
  document.getElementById('catatanDisplay').textContent = localStorage.getItem(key('catatan') ) || '-';
}
function exportCatatanPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Catatan Guru', 10, 10);
  doc.text(localStorage.getItem(key('catatan')) || '-', 10, 20);
  doc.save('catatan.pdf');
}

/* ---------- JADWAL ---------- */
function simpanJadwal() {
  const rows = [];
  document.querySelectorAll('#jadwalTable tbody tr').forEach(tr => {
    const hari = tr.cells[0].textContent;
    const mapel = [];
    for (let i=1;i<=10;i++) mapel.push(tr.cells[i].textContent || '-');
    rows.push({ hari, mapel });
  });
  localStorage.setItem(key('jadwal'), JSON.stringify(rows));
  alert('Jadwal tersimpan');
}
function muatJadwal() {
  const data = JSON.parse(localStorage.getItem(key('jadwal') ) || '[]');
  if (!data.length) return;
  const tbody = document.querySelector('#jadwalTable tbody'); tbody.innerHTML = '';
  data.forEach(d => {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.textContent = d.hari; tr.appendChild(td);
    d.mapel.forEach(m => { const t = document.createElement('td'); t.contentEditable='true'; t.textContent = m; tr.appendChild(t); });
    tbody.appendChild(tr);
  });
}
function exportJadwalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF(); doc.text('Jadwal',10,10); let y=20;
  (JSON.parse(localStorage.getItem(key('jadwal'))||'[]')).forEach(d => { doc.text(d.hari+': '+d.mapel.join(', '),10,y); y+=8; });
  doc.save('jadwal.pdf');
}

/* ---------- MODUL ---------- */
function uploadModul() {
  const input = document.getElementById('modulInput');
  if (!input.files.length) return alert('Pilih file');
  const file = input.files[0];
  const r = new FileReader();
  r.onload = e => {
    const arr = JSON.parse(localStorage.getItem(key('modul')) || '[]');
    arr.push({ name: file.name, url: e.target.result });
    localStorage.setItem(key('modul'), JSON.stringify(arr));
    renderModulList();
  };
  r.readAsDataURL(file);
}
function renderModulList() {
  const list = document.getElementById('modulList');
  list.innerHTML = '';
  (JSON.parse(localStorage.getItem(key('modul'))||'[]')).forEach((m,idx) => {
    const li = document.createElement('li');
    li.innerHTML = `${m.name} <a href="${m.url}" download="${m.name}">Download</a> <button onclick="hapusModul(${idx})">Hapus</button>`;
    list.appendChild(li);
  });
}
function hapusModul(i) { const arr = JSON.parse(localStorage.getItem(key('modul'))||'[]'); arr.splice(i,1); localStorage.setItem(key('modul'), JSON.stringify(arr)); renderModulList(); }

/* ---------- KALENDER ---------- */
let calendar = null;
function initCalendar() {
  const el = document.getElementById('calendar');
  if (!el) return;
  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    height: 550,
    selectable: true,
    events: getAgenda().map((a,idx) => ({ id: idx, title: `Jam ${a.jam}: ${a.teks}`, start: a.tgl })),
    dateClick(info) {
      document.getElementById('agendaDate').value = info.dateStr;
      openTab('agendaTab');
    },
    eventClick(info) {
      const id = parseInt(info.event.id);
      const a = getAgenda()[id];
      if (!a) return alert('Agenda tidak ditemukan');
      let s = `${a.tgl} | Jam ${a.jam}\n${a.teks}\nKomentar:\n${a.komentar.join('\n')}`;
      if (a.lampiran) s += '\n[Ada lampiran]';
      alert(s);
    }
  });
  calendar.render();
}
function refreshCalendarEvents() {
  if (!calendar) return;
  calendar.removeAllEvents();
  getAgenda().forEach((a, idx) => calendar.addEvent({ id: idx, title: `Jam ${a.jam}: ${a.teks}`, start: a.tgl }));
}

/* ---------- CHART (absensi) ---------- */
let absensiChart = null;
function initChart() {
  const ctx = document.getElementById('absensiChart').getContext('2d');
  absensiChart = new Chart(ctx, {
    type: 'pie',
    data: { labels: ['Hadir','Izin','Alpha'], datasets: [{ data:[0,0,0], backgroundColor:['#28a745','#ffc107','#dc3545'] }] },
    options: { responsive:true }
  });
  updateChart();
}
function updateChart() {
  const arr = getAbsensi();
  const today = (new Date()).toISOString().slice(0,10);
  const todayAbs = arr.filter(a => a.hari === today);
  const hadir = todayAbs.filter(a => a.status==='Hadir').length;
  const izin = todayAbs.filter(a => a.status==='Izin').length;
  const alpha = todayAbs.filter(a => a.status==='Alpha').length;
  absensiChart.data.datasets[0].data = [hadir, izin, alpha];
  absensiChart.update();
}

/* ---------- DASHBOARD UPDATE ---------- */
function updateDashboard() {
  document.getElementById('countAgenda').textContent = getAgenda().length;
  const arr = getAbsensi();
  const today = (new Date()).toISOString().slice(0,10);
  const todayAbs = arr.filter(a => a.hari === today);
  const hadir = todayAbs.filter(a => a.status==='Hadir').length;
  const izin = todayAbs.filter(a => a.status==='Izin').length;
  const alpha = todayAbs.filter(a => a.status==='Alpha').length;
  document.getElementById('countAbsensi').textContent = `Hadir:${hadir} | Izin:${izin} | Alpha:${alpha}`;
  document.getElementById('lastCatatan').textContent = localStorage.getItem(key('catatan')) || '-';
  updateChart();
}

/* ---------- BACKUP / RESTORE ---------- */
function exportAllJSON() {
  const keys = ['siswa','agenda','absensi','catatan','jadwal','modul'];
  const out = {};
  keys.forEach(k => out[k] = JSON.parse(localStorage.getItem(key(k)) || '[]'));
  downloadTextFile(`${(document.getElementById('kelasSelect')?.value||'class')}_backup.json`, JSON.stringify(out, null, 2));
}
function importAllJSON() {
  const f = document.getElementById('importFile');
  if (!f.files.length) return alert('Pilih file JSON');
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      Object.keys(data).forEach(k => localStorage.setItem(key(k), JSON.stringify(data[k])));
      muatSemuaData();
      alert('Restore berhasil');
    } catch(err) { alert('File JSON tidak valid'); }
  };
  r.readAsText(f.files[0]);
}

/* ---------- LOGIN ---------- */
function registerGuru() {
  const user = document.getElementById('guruUsername').value.trim();
  const pass = document.getElementById('guruPassword').value.trim();
  const mapel = document.getElementById('guruMapel').value;
  if (!user||!pass||!mapel) return alert('Isi semua field');
  const accounts = JSON.parse(localStorage.getItem('agendaApp_gurus')||'[]');
  if (accounts.find(a=>a.user===user)) return alert('Username sudah ada');
  accounts.push({ user, pass, mapel });
  localStorage.setItem('agendaApp_gurus', JSON.stringify(accounts));
  alert('Registrasi sukses');
}
function loginGuru() {
  const user = document.getElementById('guruUsername').value.trim();
  const pass = document.getElementById('guruPassword').value.trim();
  const accounts = JSON.parse(localStorage.getItem('agendaApp_gurus')||'[]');
  const a = accounts.find(x=>x.user===user&&x.pass===pass);
  if (!a) return alert('Login gagal');
  document.getElementById('guruStatus').textContent = `Login sebagai: ${a.user} (${a.mapel})`;
  const prof = document.getElementById("guruProfile");
  prof.innerHTML = `👩‍🏫 Halo, ${a.user} <small>(${a.mapel})</small>`;
}
function loginSiswa() {
  const nama = document.getElementById('siswaLoginNama').value.trim();
  if (!nama) return alert('Isi nama siswa');
  alert('Login siswa (view) sebagai: ' + nama);
}

/* ---------- Reminder Agenda ---------- */
setInterval(() => {
  const arr = getAgenda();
  const h = (new Date()).getHours();
  arr.forEach(a => {
    const jamMap = { '1':7,'2':8,'3':9,'4':10,'5':11,'6':13,'7':14,'8':15,'9':16,'10':17 };
    if (jamMap[a.jam] === h) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pengingat Agenda', { body: `${a.tgl} Jam ${a.jam}: ${a.teks}` });
      }
    }
  });
}, 60000);

/* ---------- INIT ---------- */
function muatSemuaData() {
  populateSiswaSelect();
  renderSiswaTable();
  renderAgendaList();
  renderAbsensiTable();
  muatCatatan();
  muatJadwal();
  renderModulList();
  refreshCalendarEvents();
  updateDashboard();
}
window.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  initCalendar();
  initChart();
  muatSemuaData();
});
