import * as db from './db.js';

const MOCK_PORTFOLIOS = [
  { id: 'port-1', title: 'Short Movie: "Semesta Aksara"', category: 'Film Pendek', desc: 'Juara 1 Festival Film Mahasiswa Nasional. Edit warna sinematik, sound design, dan pemotongan tempo dramatis.', gradient: 'linear-gradient(135deg, #8e44ff 0%, #00f2fe 100%)', duration: '12:30' },
  { id: 'port-2', title: 'Vlog KKN: Desa Cerdas 2025', category: 'Dokumentasi', desc: 'Video dokumentasi KKN Universitas Indonesia. Editing cepat, efek overlay ceria, transisi dinamis, dan subtitle.', gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', duration: '08:15' },
  { id: 'port-3', title: 'Presentasi Skripsi: Panel Panel Surya', category: 'Tugas Akhir', desc: 'Video infografis 2D dan peragaan animasi skripsi teknik elektro. Penjelasan audio disinkronkan dengan visual minimalis.', gradient: 'linear-gradient(135deg, #f59e0b 0%, #e1306c 100%)', duration: '05:00' }
];

const MOCK_TESTIMONIALS = [
  { name: 'Rian Hidayat', univ: 'Institut Teknologi Bandung', text: 'VPro Student bener-bener penyelamat! Skripsiku butuh lampiran video demonstrasi dan mereka edit dalam 1 hari dengan rapi banget. Dosen penguji langsung sreg.', avatarColor: '#8e44ff', initial: 'R' },
  { name: 'Siti Sarah', univ: 'Universitas Gadjah Mada', text: 'Suka banget sama transparansi dashboard-nya. Aku bisa pantau video kelompok KKN kami udah sampai tahap mana (sedang diedit / revisi). Hasilnya sinematik!', avatarColor: '#00f2fe', initial: 'S' },
  { name: 'Dewangga', univ: 'Universitas Diponegoro', text: 'Harga paling masuk akal buat mahasiswa. Editannya ga murahan, revisi dilayani dengan cepat & ramah. Recomended pol buat tugas-tugas video kuliah!', avatarColor: '#10b981', initial: 'D' }
];

let currentView = 'home';
let activeUserTab = 'user-overview';
let activeAdminTab = 'admin-overview';
let trackingSelectedOrderId = null;
let testimonialIndex = 0;

const views = {
  home: document.getElementById('view-home'),
  auth: document.getElementById('view-auth'),
  user: document.getElementById('view-user'),
  admin: document.getElementById('view-admin')
};

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';

  toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'slideInLeft 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function switchView(targetView) {
  Object.values(views).forEach(view => view.classList.remove('active'));
  views[targetView].classList.add('active');
  currentView = targetView;

  const navbar = document.getElementById('global-navbar');
  if (targetView === 'user' || targetView === 'admin') {
    navbar.classList.add('hidden');
    document.body.style.paddingTop = '0';
  } else {
    navbar.classList.remove('hidden');
    document.body.style.paddingTop = '';
    updateNavbarActions();
  }

  if (targetView === 'home') await renderLandingPage();
  else if (targetView === 'user') { await renderUserDashboard(); bindLogoutEvents(); }
  else if (targetView === 'admin') { await renderAdminDashboard(); bindLogoutEvents(); }

  window.scrollTo(0, 0);
  lucide.createIcons();
}

function updateNavbarActions() {
  const actionsContainer = document.getElementById('nav-actions');
  const currentUser = db.getCurrentUser();

  if (currentUser) {
    actionsContainer.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: center;">
        <button class="btn btn-outline" id="nav-dashboard-redirect"><i data-lucide="layout-dashboard"></i><span>Dashboard</span></button>
        <button class="btn btn-primary btn-logout" style="padding: 10px 16px;"><i data-lucide="log-out"></i></button>
      </div>`;

    document.getElementById('nav-dashboard-redirect').addEventListener('click', () => {
      switchView(currentUser.role === 'admin' ? 'admin' : 'user');
    });
    bindLogoutEvents();
  } else {
    actionsContainer.innerHTML = `<a href="#auth" class="btn btn-primary" id="btn-login-redirect"><i data-lucide="log-in"></i><span>Login / Register</span></a>`;
    document.getElementById('btn-login-redirect').addEventListener('click', (e) => { e.preventDefault(); switchView('auth'); });
  }
  lucide.createIcons();
}

function bindLogoutEvents() {
  document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', () => {
      db.logout();
      showToast('Anda berhasil keluar.', 'success');
      switchView('home');
    });
  });
}

async function renderLandingPage() {
  const portList = document.getElementById('portfolio-list');
  portList.innerHTML = MOCK_PORTFOLIOS.map(item => `
    <div class="portfolio-card glass-panel">
      <div class="port-img-wrap" style="background: ${item.gradient}"><div class="port-overlay"><div class="port-icon"><i data-lucide="play" class="fill-dark"></i></div></div></div>
      <div class="port-body">
        <span class="badge badge-cyan" style="margin-bottom: 8px;">${item.category}</span>
        <h4 class="port-title">${item.title}</h4>
        <p class="port-desc">${item.desc}</p>
        <span class="txt-muted" style="font-size: 0.8rem; font-family: var(--font-code);">Durasi: ${item.duration}</span>
      </div>
    </div>`).join('');

  const packages = await db.getPackages();
  const pkgList = document.getElementById('pricing-packages-list');
  pkgList.innerHTML = packages.map((pkg) => `
    <div class="pricing-card glass-panel ${pkg.popular ? 'popular' : ''}">
      ${pkg.popular ? '<span class="popular-badge">Terpopuler</span>' : ''}
      <h3 class="price-title">${pkg.nama}</h3>
      <p class="price-desc">${pkg.deskripsi}</p>
      <div class="price-box"><span class="price-val">Rp ${pkg.harga.toLocaleString('id-ID')}</span><span class="price-period"> / Video</span></div>
      <ul class="price-features">
        <li><i data-lucide="check-circle-2"></i> Durasi maksimal ${pkg.durasiMaks}</li>
        <li><i data-lucide="check-circle-2"></i> Free Sound Effect & Backsound</li>
        <li><i data-lucide="check-circle-2"></i> Color Grading Dasar</li>
        <li><i data-lucide="check-circle-2"></i> Garansi 2x Revisi</li>
      </ul>
      <button class="btn ${pkg.popular ? 'btn-gradient' : 'btn-outline'} btn-block btn-landing-order-trigger">Pilih Paket</button>
    </div>`).join('');

  document.querySelectorAll('.btn-landing-order-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!db.getCurrentUser()) { showToast('Silakan login terlebih dahulu untuk memesan.', 'info'); switchView('auth'); }
      else { switchView('user'); switchUserTab('user-order-form'); }
    });
  });
  renderTestimonialSlide();
}

function renderTestimonialSlide() {
  const track = document.getElementById('testimonials-track');
  track.innerHTML = MOCK_TESTIMONIALS.map(t => `
    <div class="testimonial-slide">
      <p class="testi-content">${t.text}</p>
      <div class="testi-author"><div class="author-avatar" style="background-color: ${t.avatarColor}">${t.initial}</div><div class="author-info"><h5>${t.name}</h5><span>${t.univ}</span></div></div>
    </div>`).join('');
  updateTestimonialPosition();
}

function updateTestimonialPosition() { document.getElementById('testimonials-track').style.transform = `translateX(-${testimonialIndex * 100}%)`; }

document.getElementById('testi-prev').addEventListener('click', () => { testimonialIndex = (testimonialIndex - 1 + MOCK_TESTIMONIALS.length) % MOCK_TESTIMONIALS.length; updateTestimonialPosition(); });
document.getElementById('testi-next').addEventListener('click', () => { testimonialIndex = (testimonialIndex + 1) % MOCK_TESTIMONIALS.length; updateTestimonialPosition(); });

const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegBtn = document.getElementById('tab-register-btn');
const loginFormWrap = document.getElementById('auth-login-container');
const regFormWrap = document.getElementById('auth-register-container');

tabLoginBtn.addEventListener('click', () => {
  tabLoginBtn.classList.add('active'); tabRegBtn.classList.remove('active');
  loginFormWrap.classList.add('active'); regFormWrap.classList.remove('active');
});

tabRegBtn.addEventListener('click', () => {
  tabRegBtn.classList.add('active'); tabLoginBtn.classList.remove('active');
  regFormWrap.classList.add('active'); loginFormWrap.classList.remove('active');
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await db.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
  if (res.success) {
    showToast(`Selamat datang kembali, ${res.user.nama}!`, 'success');
    switchView(res.user.role === 'admin' ? 'admin' : 'user');
    document.getElementById('form-login').reset();
  } else showToast(res.message, 'error');
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await db.register(
    document.getElementById('reg-nama').value, document.getElementById('reg-nim').value,
    document.getElementById('reg-univ').value, document.getElementById('reg-email').value, document.getElementById('reg-password').value
  );
  if (res.success) {
    showToast(`Pendaftaran berhasil! Akun aktif.`, 'success');
    switchView('user');
    document.getElementById('form-register').reset();
  } else showToast(res.message, 'error');
});

document.querySelectorAll('#view-user .sidebar-link').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); switchUserTab(link.getAttribute('data-tab')); });
});

async function switchUserTab(tabId) {
  activeUserTab = tabId;
  document.querySelectorAll('#view-user .sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-tab') === tabId) link.classList.add('active');
  });
  document.querySelectorAll('#view-user .dashboard-tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  await renderUserDashboard();
  lucide.createIcons();
}

async function renderUserDashboard() {
  const user = db.getCurrentUser();
  if (!user || user.role !== 'user') return;

  document.getElementById('sidebar-user-name').innerText = user.nama;
  document.getElementById('sidebar-user-univ').innerText = user.universitas;
  document.getElementById('user-avatar-initial').innerText = user.nama.charAt(0);

  const orders = await db.getOrders(user.id);
  const activeOrders = orders.filter(o => o.status !== 'Selesai');
  const completedOrders = orders.filter(o => o.status === 'Selesai');
  const notifs = await db.getNotifications(user.id);
  const unreadNotifs = notifs.filter(n => !n.read).length;

  if (activeUserTab === 'user-overview') {
    document.getElementById('user-stat-total-orders').innerText = orders.length;
    document.getElementById('user-stat-active-orders').innerText = activeOrders.length;
    document.getElementById('user-stat-notifications').innerText = unreadNotifs;

    const notifsBox = document.getElementById('user-notifications-list');
    notifsBox.innerHTML = notifs.length === 0 ? '<p class="txt-muted text-center">Tidak ada notifikasi baru.</p>' : `<div class="notifications-list">${notifs.map(n => `<div class="notif-item ${!n.read ? 'unread' : ''}"><p>${n.message}</p><span class="notif-time">${new Date(n.createdAt).toLocaleString('id-ID')}</span></div>`).join('')}</div>`;

    const recentTable = document.getElementById('user-recent-orders-table');
    const recentOrders = orders.slice(0, 5);
    recentTable.innerHTML = recentOrders.length === 0 ? '<tr><td colspan="3" class="text-center txt-muted">Belum ada pesanan.</td></tr>' : recentOrders.map(o => `<tr><td><strong>${o.namaProyek}</strong><div class="txt-muted" style="font-size: 0.8rem;">${o.jenisVideo}</div></td><td>${getStatusBadge(o.status)}</td><td>${getPaymentBadge(o.statusBayar)}</td></tr>`).join('');
  }

  else if (activeUserTab === 'user-tracking') {
    const trackingWrap = document.getElementById('user-active-track-container');

    if (activeOrders.length === 0) {
      trackingSelectedOrderId = null;
      trackingWrap.innerHTML = `
        <div class="glass-panel text-center" style="padding: 60px 20px;">
          <div style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;">
            <i data-lucide="video-off" style="width: 60px; height: 60px;"></i>
          </div>
          <h3>Tidak Ada Pesanan Aktif</h3>
          <p class="txt-muted" style="margin-bottom: 30px;">Anda belum melakukan pemesanan saat ini atau pesanan Anda telah selesai.</p>
          <button class="btn btn-primary" onclick="window.switchUserTab('user-order-form')">Buat Pesanan Baru</button>
        </div>
      `;
    } else {
      if (activeOrders.length === 1) trackingSelectedOrderId = activeOrders[0].id;

      if (!trackingSelectedOrderId || !activeOrders.find(o => o.id === trackingSelectedOrderId)) {
        trackingWrap.innerHTML = `
          <div class="margin-bottom-sm">
            <p class="txt-muted">Anda memiliki <strong>${activeOrders.length} pesanan aktif</strong>. Pilih proyek yang ingin dipantau:</p>
          </div>
          <div class="pricing-grid">
            ${activeOrders.map(o => `
              <div class="glass-panel" style="padding: 24px; cursor: pointer; border: 1px solid var(--border-color); transition: all 0.2s;" onclick="window.selectTrackingOrder('${o.id}')" onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div style="display:flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
                  <span style="font-family: var(--font-code); font-size: 0.8rem;" class="txt-muted">${o.id}</span>
                  ${getStatusBadge(o.status)}
                </div>
                <h3 style="margin-bottom: 10px; font-size: 1.2rem;">${o.namaProyek}</h3>
                <p class="txt-muted" style="font-size: 0.9rem; margin-bottom: 8px;"><i data-lucide="video" style="width:14px; height:14px; display:inline;"></i> ${o.jenisVideo}</p>
                <p class="txt-muted" style="font-size: 0.9rem;"><i data-lucide="clock" style="width:14px; height:14px; display:inline;"></i> Deadline: <strong class="accent-crimson">${o.deadline}</strong></p>
              </div>
            `).join('')}
          </div>
        `;
      }
      else {
        const activeToTrack = activeOrders.find(o => o.id === trackingSelectedOrderId);
        const stepIndex = getStepIndex(activeToTrack.status);
        const stepPercent = ((stepIndex - 1) / 3) * 100;

        const backBtnHtml = activeOrders.length > 1 ? `<button class="btn btn-outline btn-sm" style="margin-bottom: 20px;" onclick="window.selectTrackingOrder(null)"><i data-lucide="arrow-left"></i> Kembali ke Daftar Proyek</button>` : '';

        trackingWrap.innerHTML = backBtnHtml + `
          <div class="tracking-card glass-panel">
            <div class="track-header"><div class="track-title-info"><h3>${activeToTrack.namaProyek}</h3><span class="txt-muted" style="font-family: var(--font-code);">ID Pesanan: ${activeToTrack.id}</span></div><div>${getStatusBadge(activeToTrack.status)}</div></div>
            <div class="stepper-container">
              <div class="stepper-line"><div class="stepper-line-fill" style="width: ${stepPercent}%"></div></div>
              <div class="step-node ${stepIndex >= 1 ? 'completed' : ''} ${stepIndex === 1 ? 'active' : ''}"><div class="step-circle">${stepIndex > 1 ? '<i data-lucide="check"></i>' : '1'}</div><span class="step-label">Diterima</span></div>
              <div class="step-node ${stepIndex >= 2 ? 'completed' : ''} ${stepIndex === 2 ? 'active' : ''}"><div class="step-circle">${stepIndex > 2 ? '<i data-lucide="check"></i>' : '2'}</div><span class="step-label">Sedang Diedit</span></div>
              <div class="step-node ${stepIndex >= 3 ? 'completed' : ''} ${stepIndex === 3 ? 'active' : ''}"><div class="step-circle">${stepIndex > 3 ? '<i data-lucide="check"></i>' : '3'}</div><span class="step-label">Revisi</span></div>
              <div class="step-node ${stepIndex >= 4 ? 'completed' : ''} ${stepIndex === 4 ? 'active' : ''}"><div class="step-circle">${stepIndex > 4 ? '<i data-lucide="check"></i>' : '4'}</div><span class="step-label">Selesai</span></div>
            </div>
            <div class="track-details-grid">
              <div class="track-spec-list">
                <div class="track-spec-item"><span>Jenis Video</span><span>${activeToTrack.jenisVideo}</span></div>
                <div class="track-spec-item"><span>Durasi Video</span><span>${activeToTrack.durasi}</span></div>
                <div class="track-spec-item"><span>Tenggat Waktu</span><span class="accent-crimson">${activeToTrack.deadline}</span></div>
                <div class="track-spec-item"><span>Total Harga</span><span class="accent-cyan">Rp ${activeToTrack.harga.toLocaleString('id-ID')}</span></div>
                <div class="track-spec-item" style="flex-direction: column; align-items: flex-start; border-bottom: none;"><span style="margin-bottom: 6px;">Catatan Tambahan Anda</span><div class="detail-notes-box">${activeToTrack.catatan}</div></div>
              </div>
              <div class="track-action-box">${renderTrackingActionBox(activeToTrack)}</div>
            </div>
          </div>`;

        const payTriggerBtn = document.getElementById('btn-track-pay-now');
        if (payTriggerBtn) payTriggerBtn.addEventListener('click', () => openReceiptModal(activeToTrack.id, activeToTrack.harga));

        const requestRevisBtn = document.getElementById('btn-track-request-revision');
        if (requestRevisBtn) {
          requestRevisBtn.addEventListener('click', async () => {
            await db.updateOrderStatus(activeToTrack.id, 'Revisi');
            showToast('Mengajukan permohonan revisi ke admin.', 'info');
            renderUserDashboard();
          });
        }
      }
    }
  }

  else if (activeUserTab === 'user-history') {
    const tableBody = document.getElementById('user-history-table-body');
    if (orders.length === 0) tableBody.innerHTML = '<tr><td colspan="7" class="text-center txt-muted" style="padding: 40px 0;">Belum ada riwayat pesanan.</td></tr>';
    else {
      tableBody.innerHTML = orders.map(o => `
        <tr>
          <td style="font-family: var(--font-code); font-size: 0.85rem;">${o.id}</td>
          <td><strong>${o.namaProyek}</strong><div class="txt-muted" style="font-size: 0.8rem;">${o.jenisVideo}</div></td>
          <td>${new Date(o.createdAt).toLocaleDateString('id-ID')}</td>
          <td>Rp ${o.harga.toLocaleString('id-ID')}</td>
          <td>${getStatusBadge(o.status)}</td>
          <td>${getPaymentBadge(o.statusBayar)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm btn-order-detail-view" data-id="${o.id}" title="Lihat Detail"><i data-lucide="eye" style="width: 14px; height: 14px;"></i></button>
              ${o.status === 'Selesai' && o.hasilEditUrl ? `<a href="${o.hasilEditUrl}" target="_blank" class="btn btn-gradient btn-sm"><i data-lucide="download" style="width:14px; height:14px;"></i> Unduh</a>` : ''}
              ${o.statusBayar === 'Belum Bayar' && o.status !== 'Selesai' ? `
                <button class="btn btn-primary btn-sm btn-order-pay-trigger" data-id="${o.id}" data-price="${o.harga}">Bayar</button>
                <button class="btn btn-outline btn-sm btn-order-cancel-trigger" data-id="${o.id}" style="color: var(--accent-crimson); border-color: var(--accent-crimson-glow);" title="Batalkan Pesanan"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
              ` : ''}
            </div>
          </td>
        </tr>`).join('');

      document.querySelectorAll('.btn-order-detail-view').forEach(btn => btn.addEventListener('click', () => openDetailModal(btn.getAttribute('data-id'))));
      document.querySelectorAll('.btn-order-pay-trigger').forEach(btn => btn.addEventListener('click', () => openReceiptModal(btn.getAttribute('data-id'), parseInt(btn.getAttribute('data-price')))));

      document.querySelectorAll('.btn-order-cancel-trigger').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Apakah Anda yakin ingin membatalkan dan menghapus pesanan ini?')) {
            const res = await db.cancelOrder(btn.getAttribute('data-id'));
            if (res.success) {
              showToast('Pesanan berhasil dibatalkan.', 'success');
              renderUserDashboard();
            } else {
              showToast(res.message, 'error');
            }
          }
        });
      });
    }
  }

  else if (activeUserTab === 'user-profile') {
    document.getElementById('prof-nama').value = user.nama;
    document.getElementById('prof-nim').value = user.nim;
    document.getElementById('prof-univ').value = user.universitas;
    document.getElementById('prof-email').value = user.email;
    document.getElementById('profile-avatar-big').innerText = user.nama.charAt(0);
    document.getElementById('profile-card-name').innerText = user.nama;
    document.getElementById('profile-stat-completed').innerText = completedOrders.length;
    document.getElementById('profile-stat-active').innerText = activeOrders.length;
  }
}

function renderTrackingActionBox(order) {
  if (order.statusBayar === 'Belum Bayar') return `<div class="action-card glass-panel border-amber text-center"><div style="font-size: 1.8rem; color: var(--accent-amber); margin-bottom: 12px;"><i data-lucide="info"></i></div><h4 class="margin-bottom-sm">Menunggu Pembayaran</h4><p class="txt-muted margin-bottom-sm">Silakan selesaikan transfer bank ke BCA kami dan kirim bukti.</p><button class="btn btn-gradient btn-block" id="btn-track-pay-now">Unggah Bukti Bayar</button></div>`;
  if (order.statusBayar === 'Menunggu Verifikasi') return `<div class="action-card glass-panel text-center"><div style="font-size: 1.8rem; color: var(--accent-cyan); margin-bottom: 12px;"><i data-lucide="loader-2" style="animation: spin 2s linear infinite;"></i></div><h4 class="margin-bottom-sm">Menunggu Verifikasi</h4><p class="txt-muted">Admin sedang melakukan pencocokan mutasi bank.</p></div>`;
  if (order.status === 'Diproses') return `<div class="action-card glass-panel border-purple text-center"><div style="font-size: 1.8rem; color: var(--accent-purple); margin-bottom: 12px;"><i data-lucide="edit-3"></i></div><h4 class="margin-bottom-sm">Suntingan Berlangsung</h4><p class="txt-muted">Editor kami sedang mengerjakan timeline video.</p></div>`;
  if (order.status === 'Revisi') return `<div class="action-card glass-panel border-crimson text-center"><div style="font-size: 1.8rem; color: var(--accent-crimson); margin-bottom: 12px;"><i data-lucide="alert-circle"></i></div><h4 class="margin-bottom-sm">Permintaan Revisi Diajukan</h4><p class="txt-muted">Editor sedang memperbarui timeline video Anda.</p></div>`;
  if (order.status === 'Selesai') return `<div class="action-card glass-panel border-emerald text-center"><div style="font-size: 1.8rem; color: var(--accent-emerald); margin-bottom: 12px;"><i data-lucide="check-circle"></i></div><h4 class="margin-bottom-sm">Video Selesai Diexport!</h4><p class="txt-muted margin-bottom-sm">Hasil edit telah dikonfirmasi selesai.</p><div style="display: flex; flex-direction: column; gap: 10px;"><a href="${order.hasilEditUrl}" target="_blank" class="btn btn-gradient btn-block"><i data-lucide="download"></i> Unduh Hasil Video</a><button class="btn btn-outline btn-block" id="btn-track-request-revision"><i data-lucide="refresh-cw"></i> Ajukan Revisi Video</button></div></div>`;
  return '';
}

function getStepIndex(status) { return status === 'Menunggu Konfirmasi' ? 1 : status === 'Diproses' ? 2 : status === 'Revisi' ? 3 : status === 'Selesai' ? 4 : 1; }

function getStatusBadge(status) {
  if (status === 'Menunggu Konfirmasi') return '<span class="badge badge-amber">Menunggu Konfirmasi</span>';
  if (status === 'Diproses') return '<span class="badge badge-purple">Sedang Diedit</span>';
  if (status === 'Revisi') return '<span class="badge badge-crimson">Revisi</span>';
  if (status === 'Selesai') return '<span class="badge badge-emerald">Selesai</span>';
  return `<span class="badge">${status}</span>`;
}

function getPaymentBadge(statusBayar) {
  if (statusBayar === 'Belum Bayar') return '<span class="badge badge-crimson">Belum Bayar</span>';
  if (statusBayar === 'Menunggu Verifikasi') return '<span class="badge badge-amber">Verifikasi</span>';
  if (statusBayar === 'Lunas') return '<span class="badge badge-emerald">Lunas</span>';
  return `<span class="badge">${statusBayar}</span>`;
}

document.getElementById('btn-mark-notif-read').addEventListener('click', async () => {
  const user = db.getCurrentUser();
  if (user) { await db.markNotificationsAsRead(user.id); showToast('Semua notifikasi ditandai dibaca.', 'success'); renderUserDashboard(); }
});

document.getElementById('btn-goto-history-tab').addEventListener('click', () => switchUserTab('user-history'));

const dragArea = document.getElementById('footage-drag-area');
const fileInput = document.getElementById('order-file-input');
const fileTag = document.getElementById('uploaded-footage-name');
const removeFootageBtn = document.getElementById('btn-remove-footage');
let actualFootageFileObj = null;

dragArea.addEventListener('click', (e) => { if (!e.target.closest('#btn-remove-footage') && !e.target.closest('#uploaded-footage-name')) fileInput.click(); });
fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) handleMockFileUpload(fileInput.files[0]); });
dragArea.addEventListener('dragover', (e) => { e.preventDefault(); dragArea.classList.add('dragover'); });
dragArea.addEventListener('dragleave', () => dragArea.classList.remove('dragover'));
dragArea.addEventListener('drop', (e) => { e.preventDefault(); dragArea.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) handleMockFileUpload(e.dataTransfer.files[0]); });

function handleMockFileUpload(fileObj) {
  actualFootageFileObj = fileObj;
  fileTag.querySelector('.name').innerText = fileObj.name;
  fileTag.classList.remove('hidden');
  dragArea.querySelector('.drag-icon').style.display = 'none'; dragArea.querySelector('.drag-text').style.display = 'none'; dragArea.querySelector('.file-info').style.display = 'none';
}

removeFootageBtn.addEventListener('click', (e) => {
  e.stopPropagation(); actualFootageFileObj = null; fileInput.value = ''; fileTag.classList.add('hidden');
  dragArea.querySelector('.drag-icon').style.display = ''; dragArea.querySelector('.drag-text').style.display = ''; dragArea.querySelector('.file-info').style.display = '';
});

document.getElementById('user-create-order-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showToast('Sedang mengunggah file. Mohon tunggu...', 'info');

  let finalFileUrl = 'video_footage_mahasiswa.mp4';
  if (actualFootageFileObj) {
    const uploadRes = await db.uploadFileToAPI(actualFootageFileObj);
    if (uploadRes.success) {
      finalFileUrl = uploadRes.fileUrl;
    } else {
      showToast('Gagal mengunggah footage!', 'error');
      return;
    }
  }

  const orderData = {
    namaProyek: document.getElementById('order-proyek-name').value,
    jenisVideo: document.getElementById('order-video-type').value,
    durasi: document.getElementById('order-duration').value,
    deadline: document.getElementById('order-deadline').value,
    catatan: document.getElementById('order-notes').value,
    fileName: finalFileUrl
  };

  const res = await db.createOrder(orderData);
  if (res.success) {
    showToast(`Pesanan berhasil dikirim!`, 'success');
    document.getElementById('user-create-order-form').reset();
    removeFootageBtn.click();
    switchUserTab('user-tracking');
  } else showToast(res.message, 'error');
});

document.querySelectorAll('#view-admin .sidebar-link').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchAdminTab(link.getAttribute('data-tab')); }); });
document.getElementById('btn-admin-goto-orders').addEventListener('click', () => switchAdminTab('admin-orders'));

async function switchAdminTab(tabId) {
  activeAdminTab = tabId;
  document.querySelectorAll('#view-admin .sidebar-link').forEach(link => { link.classList.remove('active'); if (link.getAttribute('data-tab') === tabId) link.classList.add('active'); });
  document.querySelectorAll('#view-admin .dashboard-tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  await renderAdminDashboard();
  lucide.createIcons();
}

async function renderAdminDashboard() {
  const user = db.getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const stats = await db.getAdminStats();
  const allOrders = await db.getOrders();
  const users = await db.getUsers();

  document.getElementById('admin-stat-total-orders').innerText = stats.totalOrders;
  document.getElementById('admin-stat-active-orders').innerText = stats.activeOrders;
  document.getElementById('admin-stat-completed-orders').innerText = stats.completedOrders;
  document.getElementById('admin-stat-revenue').innerText = `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`;

  if (activeAdminTab === 'admin-overview') {
    const recentTable = document.getElementById('admin-recent-orders-table');
    const actionsNeededOrders = allOrders.filter(o => o.status !== 'Selesai' || o.statusBayar === 'Menunggu Verifikasi').slice(0, 10);

    if (actionsNeededOrders.length === 0) recentTable.innerHTML = '<tr><td colspan="8" class="text-center txt-muted">Semua bersih! Tidak ada antrean.</td></tr>';
    else {
      recentTable.innerHTML = actionsNeededOrders.map(o => `<tr><td style="font-family: var(--font-code); font-size: 0.8rem;">${o.id}</td><td><strong>${o.userName}</strong></td><td><strong>${o.namaProyek}</strong><div class="txt-muted" style="font-size: 0.8rem;">${o.jenisVideo}</div></td><td class="accent-crimson">${o.deadline}</td><td>Rp ${o.harga.toLocaleString('id-ID')}</td><td>${getStatusBadge(o.status)}</td><td>${getPaymentBadge(o.statusBayar)}</td><td><div style="display: flex; gap: 6px;"><button class="btn btn-outline btn-sm btn-order-detail-view" data-id="${o.id}">Tinjau</button></div></td></tr>`).join('');
      recentTable.querySelectorAll('.btn-order-detail-view').forEach(btn => btn.addEventListener('click', () => openDetailModal(btn.getAttribute('data-id'))));
    }
  }
  else if (activeAdminTab === 'admin-orders') renderAdminOrdersTable(allOrders);
  else if (activeAdminTab === 'admin-users') {
    const usersTable = document.getElementById('admin-users-table-body');
    usersTable.innerHTML = users.length === 0 ? '<tr><td colspan="5" class="text-center txt-muted">Belum ada pelanggan.</td></tr>' : users.map(u => `<tr><td><strong>${u.nama}</strong></td><td style="font-family: var(--font-code);">${u.nim}</td><td>${u.universitas}</td><td>${u.email}</td><td><button class="btn btn-outline btn-sm" onclick="showToast('Menampilkan KTM untuk ${u.nama}... (Fitur Upload Real menyusul)', 'info')">Detail KTM</button></td></tr>`).join('');
  }
  else if (activeAdminTab === 'admin-packages') {
    const packages = await db.getPackages();
    const pkgGrid = document.getElementById('admin-packages-list');
    pkgGrid.innerHTML = packages.map((pkg) => `<div class="pricing-card glass-panel ${pkg.popular ? 'popular' : ''}">${pkg.popular ? '<span class="popular-badge" style="z-index: 1;">Terpopuler</span>' : ''}<h3 class="price-title">${pkg.nama}</h3><p class="price-desc">${pkg.deskripsi}</p><div class="price-box"><span class="price-val">Rp ${pkg.harga.toLocaleString('id-ID')}</span><span class="price-period"> / Video</span></div><ul class="price-features"><li><i data-lucide="check-circle-2"></i> Durasi maksimal ${pkg.durasiMaks}</li></ul><div class="admin-pkg-actions" style="margin-top: auto; z-index: 5;"><button class="btn btn-primary btn-sm btn-pkg-edit" data-id="${pkg.id}">Edit</button><button class="btn btn-outline btn-sm btn-pkg-delete" data-id="${pkg.id}" style="color: var(--accent-crimson); border-color: var(--accent-crimson-glow);">Hapus</button></div></div>`).join('');

    document.querySelectorAll('.btn-pkg-edit').forEach(btn => btn.addEventListener('click', () => { const pkg = packages.find(p => p.id === btn.getAttribute('data-id')); if (pkg) openPackageModal(pkg); }));
    document.querySelectorAll('.btn-pkg-delete').forEach(btn => btn.addEventListener('click', async () => { if (confirm('Yakin hapus?')) { await db.deletePackage(btn.getAttribute('data-id')); showToast('Dihapus.', 'success'); renderAdminDashboard(); } }));
  }
  else if (activeAdminTab === 'admin-reports') renderAdminCharts(stats);
}

function renderAdminCharts(stats) {
  const incomeWrap = document.getElementById('income-chart-svg-wrap');
  const incData = stats.incomeChartData;
  const svgWidth = 460, svgHeight = 220, paddingLeft = 60, paddingBottom = 40;
  const graphWidth = svgWidth - paddingLeft - 20, graphHeight = svgHeight - paddingBottom - 10;
  const maxInc = Math.max(...incData.map(d => d.value), 100000);

  const points = incData.map((d, idx) => ({ x: paddingLeft + (idx / (incData.length - 1)) * graphWidth, y: graphHeight + 10 - (d.value / maxInc) * graphHeight, label: d.label, value: d.value }));
  const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${graphHeight + 10} L ${points[0].x} ${graphHeight + 10} Z`;

  incomeWrap.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}"><defs><linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent-cyan)" stop-opacity="0.3"/><stop offset="100%" stop-color="var(--accent-cyan)" stop-opacity="0"/></linearGradient></defs><line x1="${paddingLeft}" y1="10" x2="${svgWidth - 20}" y2="10" stroke="rgba(255,255,255,0.03)" /><line x1="${paddingLeft}" y1="${graphHeight / 2 + 10}" x2="${svgWidth - 20}" y2="${graphHeight / 2 + 10}" stroke="rgba(255,255,255,0.03)" /><line x1="${paddingLeft}" y1="${graphHeight + 10}" x2="${svgWidth - 20}" y2="${graphHeight + 10}" stroke="rgba(255,255,255,0.1)" /><text x="${paddingLeft - 10}" y="15" fill="var(--text-muted)" font-size="10" text-anchor="end">Rp ${(maxInc / 1000).toFixed(0)}k</text><text x="${paddingLeft - 10}" y="${graphHeight / 2 + 15}" fill="var(--text-muted)" font-size="10" text-anchor="end">Rp ${(maxInc / 2000).toFixed(0)}k</text><text x="${paddingLeft - 10}" y="${graphHeight + 15}" fill="var(--text-muted)" font-size="10" text-anchor="end">Rp 0</text><path d="${areaD}" fill="url(#area-grad)" /><path d="${pathD}" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" />${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#0c0d14" stroke="var(--accent-cyan)" stroke-width="2" /><text x="${p.x}" y="${svgHeight - 15}" fill="var(--text-secondary)" font-size="10" text-anchor="middle">${p.label}</text><text x="${p.x}" y="${p.y - 10}" fill="var(--text-primary)" font-size="9" font-weight="700" text-anchor="middle">Rp ${(p.value / 1000).toFixed(0)}k</text>`).join('')}</svg>`;

  const ordersWrap = document.getElementById('orders-chart-svg-wrap');
  const ordData = stats.orderCountChartData;
  const maxOrd = Math.max(...ordData.map(d => d.value), 5);
  const barWidth = 30;

  ordersWrap.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}"><line x1="${paddingLeft}" y1="10" x2="${svgWidth - 20}" y2="10" stroke="rgba(255,255,255,0.03)" /><line x1="${paddingLeft}" y1="${graphHeight / 2 + 10}" x2="${svgWidth - 20}" y2="${graphHeight / 2 + 10}" stroke="rgba(255,255,255,0.03)" /><line x1="${paddingLeft}" y1="${graphHeight + 10}" x2="${svgWidth - 20}" y2="${graphHeight + 10}" stroke="rgba(255,255,255,0.1)" /><text x="${paddingLeft - 10}" y="15" fill="var(--text-muted)" font-size="10" text-anchor="end">${maxOrd}</text><text x="${paddingLeft - 10}" y="${graphHeight / 2 + 15}" fill="var(--text-muted)" font-size="10" text-anchor="end">${Math.round(maxOrd / 2)}</text><text x="${paddingLeft - 10}" y="${graphHeight + 15}" fill="var(--text-muted)" font-size="10" text-anchor="end">0</text>${ordData.map((d, idx) => { const x = paddingLeft + (idx / (ordData.length - 1)) * graphWidth - barWidth / 2; const barHeight = (d.value / maxOrd) * graphHeight; const y = graphHeight + 10 - barHeight; return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--accent-purple)" opacity="0.85" /><text x="${x + barWidth / 2}" y="${svgHeight - 15}" fill="var(--text-secondary)" font-size="10" text-anchor="middle">${d.label}</text><text x="${x + barWidth / 2}" y="${y - 8}" fill="var(--text-primary)" font-size="10" font-weight="700" text-anchor="middle">${d.value}</text>`; }).join('')}</svg>`;
}

function renderAdminOrdersTable(orders) {
  const table = document.getElementById('admin-all-orders-table');
  const searchVal = document.getElementById('admin-order-search').value.toLowerCase();
  const statusFilter = document.getElementById('admin-order-filter-status').value;
  const payFilter = document.getElementById('admin-order-filter-pembayaran').value;

  let filtered = orders;
  if (searchVal) filtered = filtered.filter(o => o.namaProyek.toLowerCase().includes(searchVal) || o.userName.toLowerCase().includes(searchVal) || o.id.toLowerCase().includes(searchVal));
  if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
  if (payFilter !== 'all') filtered = filtered.filter(o => o.statusBayar === payFilter);

  if (filtered.length === 0) table.innerHTML = '<tr><td colspan="9" class="text-center txt-muted" style="padding: 40px 0;">Tidak ada pesanan ditemukan.</td></tr>';
  else {
    table.innerHTML = filtered.map(o => `<tr>
      <td style="font-family: var(--font-code); font-size: 0.8rem;">${o.id}</td>
      <td><strong>${o.userName}</strong></td>
      <td><strong>${o.namaProyek}</strong><div class="txt-muted" style="font-size: 0.8rem;">${o.jenisVideo}</div></td>
      <td>${o.durasi}</td>
      <td>${o.deadline}</td>
      <td>Rp ${o.harga.toLocaleString('id-ID')}</td>
      <td><select class="form-control admin-select-status" data-id="${o.id}" style="padding: 4px 8px; font-size: 0.85rem; width: auto;"><option value="Menunggu Konfirmasi" ${o.status === 'Menunggu Konfirmasi' ? 'selected' : ''}>Menunggu Konfirmasi</option><option value="Diproses" ${o.status === 'Diproses' ? 'selected' : ''}>Sedang Diedit</option><option value="Revisi" ${o.status === 'Revisi' ? 'selected' : ''}>Revisi</option><option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''}>Selesai</option></select></td>
      <td>${getPaymentBadge(o.statusBayar)}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-outline btn-sm btn-admin-order-review" data-id="${o.id}" title="Tinjau Pesanan">Tinjau</button>
          <button class="btn btn-outline btn-sm btn-admin-order-delete" data-id="${o.id}" style="color: var(--accent-crimson); border-color: var(--accent-crimson-glow);" title="Hapus Permanen">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');

    document.querySelectorAll('.admin-select-status').forEach(select => select.addEventListener('change', async () => { await db.updateOrderStatus(select.getAttribute('data-id'), select.value); showToast(`Status dirubah ke ${select.value}`, 'success'); renderAdminDashboard(); }));
    document.querySelectorAll('.btn-admin-order-review').forEach(btn => btn.addEventListener('click', () => openDetailModal(btn.getAttribute('data-id'))));

    document.querySelectorAll('.btn-admin-order-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('BAHAYA: Anda login sebagai Admin. Apakah Anda yakin ingin menghapus permanen pesanan ini dari database?')) {
          const res = await db.cancelOrder(btn.getAttribute('data-id'));
          if (res.success) {
            showToast('Pesanan berhasil dimusnahkan.', 'success');
            renderAdminDashboard();
          } else {
            showToast(res.message, 'error');
          }
        }
      });
    });
  }
}

document.getElementById('admin-order-search').addEventListener('input', renderAdminDashboard);
document.getElementById('admin-order-filter-status').addEventListener('change', renderAdminDashboard);
document.getElementById('admin-order-filter-pembayaran').addEventListener('change', renderAdminDashboard);

const detailModal = document.getElementById('modal-order-detail');
const receiptModal = document.getElementById('modal-upload-receipt');
const packageModal = document.getElementById('modal-edit-package');

async function openDetailModal(orderId) {
  const orders = await db.getOrders();
  const o = orders.find(order => order.id === orderId);
  if (!o) {
    showToast('Error: Data pesanan tidak ditemukan di database.', 'error');
    return;
  }

  const body = document.getElementById('order-detail-modal-body');
  document.getElementById('md-order-id').innerText = `#${o.id}`;
  const currentUser = db.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'admin';

  const isRealFootage = o.fileMockName && o.fileMockName.startsWith('http');
  const isRealBukti = o.buktiBayar && o.buktiBayar.startsWith('http');

  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span>Nama Pelanggan</span><span>${o.userName}</span></div>
      <div class="detail-row"><span>Nama Proyek</span><span>${o.namaProyek}</span></div>
      <div class="detail-row"><span>Jenis Video</span><span>${o.jenisVideo}</span></div>
      <div class="detail-row"><span>Durasi Footage</span><span>${o.durasi}</span></div>
      
      <div class="detail-row">
        <span>File Bahan (Footage)</span>
        ${isRealFootage ? `
          <a href="${o.fileMockName}" target="_blank" class="accent-cyan" style="text-decoration: underline;">
            <i data-lucide="folder-down" style="width: 14px; height: 14px; display: inline; margin-right: 4px;"></i>Buka File Bahan
          </a>
        ` : `
          <span class="txt-muted" style="cursor: pointer; font-size: 0.85rem;" onclick="showToast('Error: Data footage tidak ditemukan (User belum mengunggah file valid).', 'error')">
            <i data-lucide="file-warning" style="width: 14px; height: 14px; display: inline; margin-right: 4px;"></i>Data Kosong (Error)
          </span>
        `}
      </div>

      <div class="detail-row"><span>Deadline Pengerjaan</span><span class="accent-crimson">${o.deadline}</span></div>
      <div class="detail-row"><span>Tanggal Dibuat</span><span>${new Date(o.createdAt).toLocaleDateString('id-ID')}</span></div>
      <div class="detail-row"><span>Estimasi Harga</span><span class="accent-cyan">Rp ${o.harga.toLocaleString('id-ID')}</span></div>
      <div class="detail-row"><span>Status Pengerjaan</span><span>${getStatusBadge(o.status)}</span></div>
      <div class="detail-row"><span>Status Pembayaran</span><span>${getPaymentBadge(o.statusBayar)}</span></div>
      <div class="detail-row" style="flex-direction: column; align-items: flex-start; border-bottom: none;"><span style="margin-bottom: 6px;">Catatan Tambahan Mahasiswa</span><div class="detail-notes-box" style="width: 100%;">${o.catatan}</div></div>
      
      ${o.buktiBayar ? `
      <div class="detail-row" style="flex-direction: column; align-items: flex-start; margin-top: 15px; border-bottom: none;">
        <span style="margin-bottom: 8px;">Bukti Transfer Bank</span>
        <div style="width: 100%; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; padding: 10px; background: rgba(0,0,0,0.2); text-align: center;">
           ${isRealBukti ? `
             <img src="${o.buktiBayar}" alt="Bukti Transfer" style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 4px; margin-bottom: 10px;">
             <a href="${o.buktiBayar}" target="_blank" class="btn btn-outline btn-block btn-sm"><i data-lucide="external-link"></i> Lihat Full Size</a>
           ` : `
             <div style="padding: 20px; cursor: pointer; color: var(--accent-crimson);" onclick="showToast('Error: File bukti bayar gagal dimuat dari server.', 'error')">
               <i data-lucide="image-off" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
               <p style="font-size: 0.85rem; margin: 0;">Error: File gambar tidak ditemukan.</p>
             </div>
           `}
        </div>
      </div>
      ` : ''}
      
      ${isAdmin ? renderAdminModalActions(o) : ''}
      ${!isAdmin && o.status === 'Selesai' && o.hasilEditUrl ? `<div style="margin-top: 20px;"><a href="${o.hasilEditUrl}" target="_blank" class="btn btn-gradient btn-block"><i data-lucide="download"></i> Download Video Final</a></div>` : ''}
    </div>`;

  detailModal.style.display = 'flex';
  lucide.createIcons();

  if (isAdmin) {
    const btnApprove = document.getElementById('btn-admin-modal-verify-pay');
    if (btnApprove) btnApprove.addEventListener('click', async (e) => {
      e.preventDefault();
      const res = await db.verifyPayment(o.id, true);
      if (res.success) { showToast(`Pembayaran dikonfirmasi.`, 'success'); closeAllModals(); renderAdminDashboard(); }
      else { showToast('Gagal memverifikasi pembayaran.', 'error'); }
    });

    const btnReject = document.getElementById('btn-admin-modal-reject-pay');
    if (btnReject) btnReject.addEventListener('click', async (e) => {
      e.preventDefault();
      const res = await db.verifyPayment(o.id, false);
      if (res.success) { showToast(`Pembayaran ditolak.`, 'success'); closeAllModals(); renderAdminDashboard(); }
      else { showToast('Gagal menolak pembayaran.', 'error'); }
    });

    const formUploadResult = document.getElementById('form-admin-upload-result');
    if (formUploadResult) formUploadResult.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('admin-edit-result-file');

      if (fileInput.files.length > 0) {
        showToast('Mengunggah video final...', 'info');
        const uploadRes = await db.uploadFileToAPI(fileInput.files[0]);
        if (uploadRes.success) {
          const res = await db.uploadEditResult(o.id, uploadRes.fileUrl);
          if (res.success) {
            showToast(`Proyek selesai! Hasil berhasil dikirim.`, 'success');
            closeAllModals();
            renderAdminDashboard();
          } else {
            showToast('Gagal mengupdate status ke database.', 'error');
          }
        } else {
          showToast('Error: Gagal mengunggah video ke server lokal.', 'error');
        }
      } else {
        showToast('Error: Harap pilih file video sebelum mengirim!', 'error');
      }
    });
  }
}

function renderAdminModalActions(o) {
  let section = '<div class="admin-modal-actions-box" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 20px;">';
  if (o.statusBayar === 'Menunggu Verifikasi') {
    section += `<h4 class="margin-bottom-sm">Tindakan Pembayaran</h4><div style="display: flex; gap: 10px;"><button type="button" class="btn btn-primary" id="btn-admin-modal-verify-pay" style="flex: 1; background-color: var(--accent-emerald);">Konfirmasi Lunas</button><button type="button" class="btn btn-outline" id="btn-admin-modal-reject-pay" style="flex: 1; color: var(--accent-crimson); border-color: var(--accent-crimson-glow);">Tolak Bukti</button></div>`;
  }
  else if (o.status === 'Diproses' || o.status === 'Revisi' || o.status === 'Menunggu Konfirmasi') {
    section += `<h4 class="margin-bottom-sm">Unggah Hasil Editing (Final Video)</h4>
      <form id="form-admin-upload-result">
        <div class="form-group">
          <label for="admin-edit-result-file">Pilih File Video Final (MP4/ZIP)</label>
          <input type="file" id="admin-edit-result-file" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-gradient btn-block">Selesaikan Proyek</button>
      </form>`;
  }
  else if (o.status === 'Selesai') {
    section += `<p class="txt-muted"><i data-lucide="check-circle" style="color: var(--accent-emerald); display: inline; width: 14px;"></i> Proyek selesai dan file hasil telah diserahkan.</p>`;
  }
  return section + '</div>';
}

function openReceiptModal(orderId, price) {
  document.getElementById('receipt-order-id').value = orderId;
  document.getElementById('receipt-order-price').innerText = `Rp ${price.toLocaleString('id-ID')}`;
  receiptModal.style.display = 'flex';
}

document.getElementById('form-upload-receipt').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('receipt-file-input');
  if (fileInput.files.length === 0) return;

  showToast('Mengunggah bukti pembayaran...', 'info');
  const uploadRes = await db.uploadFileToAPI(fileInput.files[0]);

  if (uploadRes.success) {
    await db.uploadPaymentReceipt(document.getElementById('receipt-order-id').value, uploadRes.fileUrl);
    showToast('Bukti transfer berhasil terkirim.', 'success');
    document.getElementById('form-upload-receipt').reset();
    closeAllModals();
    renderUserDashboard();
  } else {
    showToast('Gagal mengunggah bukti pembayaran.', 'error');
  }
});

function openPackageModal(pkg = null) {
  if (pkg) {
    document.getElementById('package-modal-title').innerText = 'Edit Paket Harga';
    document.getElementById('package-id').value = pkg.id; document.getElementById('pkg-name').value = pkg.nama;
    document.getElementById('pkg-price').value = pkg.harga; document.getElementById('pkg-duration').value = pkg.durasiMaks;
    document.getElementById('pkg-desc').value = pkg.deskripsi; document.getElementById('pkg-popular').checked = !!pkg.popular;
  } else {
    document.getElementById('package-modal-title').innerText = 'Tambah Paket Baru';
    document.getElementById('package-id').value = ''; document.getElementById('form-edit-package').reset(); document.getElementById('pkg-popular').checked = false;
  }
  packageModal.style.display = 'flex';
}

document.getElementById('form-edit-package').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('package-id').value;
  const pkgData = { nama: document.getElementById('pkg-name').value, harga: parseInt(document.getElementById('pkg-price').value), durasiMaks: document.getElementById('pkg-duration').value, deskripsi: document.getElementById('pkg-desc').value, popular: document.getElementById('pkg-popular').checked };
  if (id) pkgData.id = id;
  await db.savePackage(pkgData);
  showToast(`Tersimpan.`, 'success'); closeAllModals(); renderAdminDashboard();
});

document.getElementById('btn-admin-add-package-modal').addEventListener('click', () => openPackageModal());

function closeAllModals() { detailModal.style.display = 'none'; receiptModal.style.display = 'none'; packageModal.style.display = 'none'; }
document.getElementById('btn-close-detail-modal').addEventListener('click', closeAllModals);
document.getElementById('btn-close-receipt-modal').addEventListener('click', closeAllModals);
document.getElementById('btn-close-package-modal').addEventListener('click', closeAllModals);
window.addEventListener('click', (e) => { if (e.target === detailModal || e.target === receiptModal || e.target === packageModal) closeAllModals(); });

window.switchUserTab = switchUserTab;

window.selectTrackingOrder = (orderId) => {
  trackingSelectedOrderId = orderId;
  renderUserDashboard();
};

document.getElementById('nav-logo-btn').addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
document.getElementById('hero-order-now-btn').addEventListener('click', () => { if (!db.getCurrentUser()) { showToast('Login dulu.', 'info'); switchView('auth'); } else { switchView('user'); switchUserTab('user-order-form'); } });

document.querySelectorAll('#nav-public-menu .nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#nav-public-menu .nav-link').forEach(l => l.classList.remove('active')); link.classList.add('active');
    if (currentView !== 'home') switchView('home');
    const targetEl = document.getElementById(link.getAttribute('data-target'));
    if (targetEl) window.scrollTo({ top: (targetEl.getBoundingClientRect().top + window.scrollY) - 80, behavior: 'smooth' });
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  await db.initializeDb();
  updateNavbarActions();
  switchView('home');
});