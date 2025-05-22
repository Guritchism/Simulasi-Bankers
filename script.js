// Allow only digits 0–9 in #numResources
document.getElementById('numResources').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Allow only digits 0–9 in #numProcesses
document.getElementById('numProcesses').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

$(document).on('input', '.only-digit', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

$('#numResources').on('keyup input', function () {
    const value = $(this).val().trim();
    
    if (value === '' || parseInt(value) <= 0) {
        $('#numProcesses').prop('disabled', true);
    } else {
        $('#numProcesses').prop('disabled', false);
    }
});

$(document).ready(function() {
    // Periksa apakah Bootstrap tersedia
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap tidak tersedia! Pastikan library Bootstrap dimuat dengan benar.');
        alert('Terjadi kesalahan saat memuat Bootstrap. Aplikasi mungkin tidak berfungsi dengan baik.');
        return;
    }
    
    try {
        // Inisialisasi Bootstrap tabs
        const triggerTabList = document.querySelectorAll('#mainTab button');
        triggerTabList.forEach(triggerEl => {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            
            triggerEl.addEventListener('click', event => {
                event.preventDefault();
                // Jika tab request yang diklik, periksa apakah simulasi sudah dijalankan
                if (triggerEl.id === 'request-tab' && lastCalculatedState.numProcesses === 0) {
                    alert('Silakan jalankan simulasi algoritma Banker terlebih dahulu di tab Simulasi!');
                    const simTab = document.querySelector('#simulation-tab');
                    bootstrap.Tab.getInstance(simTab).show();
                } else {
                    tabTrigger.show();
                }
            });
        });
    } catch (error) {
        console.error('Terjadi kesalahan saat inisialisasi Bootstrap:', error);
    }
    
    // Reset ketika refresh
    $('#numResources').val('');
    $('#numProcesses').val('');

    // Proses kolom
    $('#numResources').keyup(function () {
        this.value = this.value.replace(/[^0-9]/g, ''); // Only allow digits 0–9

        $('#numProcesses').val('');
        $('#alloTable tr:not(#alloResourceRowhead)').remove();
        $('#maxTable tr:not(#maxResourceRowhead)').remove();

        // Bersihkan header kolom & input availability
        $('#alloResourceRowhead td:not(#alloResourceCol)').remove();
        $('#maxResourceRowhead td:not(#maxResourceCol)').remove();
        $('#availResourceRowhead td:not(#availResourceCol)').remove();
        $('#availResourceInput td:not(#availResourceInputCol)').remove();

        // Hapus tombol "Hitung" yang sudah ada
        $('#btn button').remove();

        var resourceCol = parseInt(this.value);

        // Jika input tidak valid atau kosong, hentikan proses di sini
        if (!resourceCol || resourceCol <= 0) {
            return;
        }

        // Tambah header dan input resource
        for (var i = 1; i <= resourceCol; i++) {
            var col = $('<td><strong>R' + i + '</strong></td>');
            var availRow = $('<td><input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="a' + i + '" class="form-control only-digit"></td>');

            $('#alloResourceRowhead').append(col);
            $('#maxResourceRowhead').append(col.clone());
            $('#availResourceRowhead').append(col.clone());
            $('#availResourceInput').append(availRow);
        }

        // Tambahkan tombol baru jika input valid
        var hitungBtn = $('<button id="hitung-btn" type="button" class="btn btn-primary mt-3 me-3" onclick="isSafeState()">Hitung</button>');
        var templateBtn = $('<button id="template-btn" type="button" class="btn btn-outline-secondary mt-3" onclick="fillTemplate()">Isi Template</button>');
        $('#btn').append(hitungBtn);
        $('#btn').append(templateBtn);
    });

    // Proses baris
    $('#numProcesses').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, ''); // Only allow digits 0–9

        $('#alloTable tr:not(#alloResourceRowhead)').remove();
        $('#maxTable tr:not(#maxResourceRowhead)').remove();

        var processRow = parseInt(this.value) || 0;
        var numResources = parseInt($('#numResources').val()) || 0;

        for (var i = 1; i <= processRow; i++) {
            var alloRow = $('<tr><td>P' + i + '</td></tr>');
            var maxRow = $('<tr><td>P' + i + '</td></tr>');
            for (var j = 1; j <= numResources; j++) {
                alloRow.append(
                    '<td><input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="a' + i + j + '" class="form-control only-digit"></td>'
                );
                maxRow.append(
                    '<td><input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="m' + i + j + '" class="form-control only-digit"></td>'
                );
            }
            $('#alloTable').append(alloRow);
            $('#maxTable').append(maxRow);
        }
    });
});

// Variabel global untuk menyimpan state terakhir sistem
let lastCalculatedState = {
    allocation: [],
    max: [],
    need: [],
    available: [],
    numResources: 0,
    numProcesses: 0
};

// Variabel global untuk menyimpan langkah-langkah simulasi
let simulationSteps = [];
let currentStepIndex = 0;

function isSafeState() {
    const n = parseInt($('#numProcesses').val());
    const m = parseInt($('#numResources').val());

    if (!n || !m) {
        alert("Jumlah proses dan sumber daya harus diisi!");
        return;
    }

    const allocation = [], max = [], processOrder = [], safeSequence = [];
    const available = [];
    let inputValid = true;

    // Ambil input allocation dan max
    for (let i = 1; i <= n; i++) {
        const allocRow = [], maxRow = [];
        for (let j = 1; j <= m; j++) {
            const allocVal = $('#alloTable #a' + i + j).val();
            const maxVal = $('#maxTable #m' + i + j).val();
            if (allocVal === '' || maxVal === '') {
                alert("Semua input alokasi dan maksimum harus diisi!");
                return;
            }
            
            const allocNum = parseInt(allocVal);
            const maxNum = parseInt(maxVal);
            
            // Validasi: alokasi tidak boleh melebihi maksimum
            if (allocNum > maxNum) {
                alert(`Error pada P${i}, R${j}: Alokasi (${allocNum}) tidak boleh melebihi maksimum (${maxNum})!`);
                inputValid = false;
                return;
            }
            
            allocRow.push(allocNum);
            maxRow.push(maxNum);
        }
        allocation.push(allocRow);
        max.push(maxRow);
    }

    // Jika input tidak valid, hentikan proses
    if (!inputValid) return;

    // Ambil input available
    for (let i = 1; i <= m; i++) {
        const val = $('#availResourceInput #a' + i).val();
        if (val === '') {
            alert("Input resource availability tidak boleh kosong!");
            return;
        }
        available.push(parseInt(val));
    }

    // Hitung need matrix
    const need = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(max[i][j] - allocation[i][j]);
        }
        need.push(row);
    }

    // Reset variabel langkah simulasi
    simulationSteps = [];
    currentStepIndex = 0;

    // Langkah 0: State awal
    simulationSteps.push({
        step: 0,
        title: "State Awal",
        description: "Ini adalah state awal sistem sebelum algoritma Banker dijalankan.",
        available: [...available],
        finish: Array(n).fill(false),
        processChosen: null,
        reason: "Algoritma Banker akan mencoba menemukan urutan eksekusi proses yang aman."
    });
    
    const finish = Array(n).fill(false);
    const availableSnapshots = [ [...available] ];
    let completedCount = 0;
    let stepCount = 1;

    // Loop algoritma Banker
    while (completedCount < n) {
        let found = false;

        // Untuk setiap proses, periksa apakah bisa dialokasikan
        for (let p = 0; p < n; p++) {
            if (!finish[p]) {
                let canAllocate = true;
                let failedResource = -1;
                
                // Periksa apakah kebutuhan proses dapat dipenuhi
                for (let r = 0; r < m; r++) {
                    if (need[p][r] > available[r]) {
                        canAllocate = false;
                        failedResource = r;
                        break;
                    }
                }

                // Jika proses dapat dialokasikan
                if (canAllocate) {
                    // Simpan state sebelum alokasi
                    const prevAvailable = [...available];
                    
                    // Alokasikan sumber daya
                    for (let r = 0; r < m; r++) {
                        available[r] += allocation[p][r];
                    }
                    
                    // Simpan urutan proses dan snapshot available
                    safeSequence.push('P' + (p + 1));
                    availableSnapshots.push([...available]);
                    processOrder.push({ 
                        pid: p,
                        available: [...available] 
                    });
                    
                    // Tandai proses selesai
                    finish[p] = true;
                    completedCount++;
                    found = true;
                    
                    // Catat langkah simulasi
                    simulationSteps.push({
                        step: stepCount++,
                        title: `Alokasikan P${p + 1}`,
                        description: `Proses P${p + 1} dapat berjalan karena kebutuhannya dapat dipenuhi.`,
                        available: [...available],
                        prevAvailable: [...prevAvailable],
                        finish: [...finish],
                        processChosen: p,
                        allocation: allocation[p],
                        need: need[p],
                        reason: `Kebutuhan P${p + 1} tidak melebihi sumber daya yang tersedia.`
                    });
                    
                    break; // Mulai dari proses pertama lagi
                } 
                // Jika proses ini dicoba tapi tidak bisa dialokasikan
                else if (failedResource >= 0) {
                    // Catat proses yang gagal dan alasannya (hanya untuk debug)
                    // console.log(`P${p+1} tidak dapat dialokasikan karena R${failedResource+1} tidak mencukupi.`);
                }
            }
        }

        // Jika tidak ada proses yang dapat dialokasikan, deadlock potensial
        if (!found) {
            // Catat state deadlock
            simulationSteps.push({
                step: stepCount++,
                title: "Deadlock Potensial",
                description: "Tidak ada proses yang dapat dialokasikan dengan sumber daya yang tersedia.",
                available: [...available],
                finish: [...finish],
                processChosen: null,
                deadlock: true,
                reason: "Sistem tidak dalam keadaan aman dan berpotensi mengalami deadlock."
            });
            break; // Keluar dari loop
        }
    }

    // Jika semua proses selesai, tambahkan langkah state akhir
    if (completedCount === n) {
        simulationSteps.push({
            step: stepCount++,
            title: "State Akhir",
            description: "Semua proses telah berhasil dijalankan dalam urutan yang aman.",
            available: [...available],
            finish: [...finish],
            processChosen: null,
            safeSequence: [...safeSequence],
            completed: true,
            reason: "Sistem berada dalam keadaan aman dengan urutan eksekusi proses: " + safeSequence.join(" → ")
        });
    }

    // Simpan state untuk digunakan di fitur request
    lastCalculatedState = {
        allocation: [...allocation.map(row => [...row])],
        max: [...max.map(row => [...row])],
        need: [...need.map(row => [...row])],
        available: [...available],
        numResources: m,
        numProcesses: n
    };
    
    // Perbarui tab request dengan nilai-nilai dari simulasi terakhir
    updateRequestTab();

    // Visualisasi urutan proses yang aman
    $('#safe-sequence').empty().removeClass('d-none');
    
    if (safeSequence.length === n) {
        let sequenceHTML = `
            <div class="d-flex align-items-center mb-3">
                <div class="bg-success-subtle p-2 rounded-circle me-3">
                    <i class="bi bi-check-circle-fill fs-4 text-success"></i>
                </div>
                <div>
                    <h4 class="mb-1">Status Sistem: <span class="text-success fw-bold">AMAN</span></h4>
                    <p class="text-secondary mb-0">Urutan eksekusi proses yang aman:</p>
                </div>
            </div>
            <div class="safe-sequence-visual d-flex justify-content-center align-items-center my-4">`;
            
        for (let i = 0; i < safeSequence.length; i++) {
            sequenceHTML += `
                <div class="process-box bg-success text-white p-3 m-2 rounded">
                    ${safeSequence[i]}
                </div>`;
                
            if (i < safeSequence.length - 1) {
                sequenceHTML += `
                <div class="arrow">
                    <svg width="30" height="24" fill="currentColor">
                        <path d="M0 12L20 12M13 5L20 12L13 19" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </div>`;
            }
        }
        
        sequenceHTML += `</div>`;
        $('#safe-sequence').html(sequenceHTML);
    } else {
        let unsafeHTML = `
            <div class="d-flex align-items-center mb-3">
                <div class="bg-danger-subtle p-2 rounded-circle me-3">
                    <i class="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
                </div>
                <div>
                    <h4 class="mb-1">Status Sistem: <span class="text-danger fw-bold">TIDAK AMAN</span></h4>
                    <p class="text-secondary mb-0">Sistem tidak dalam keadaan aman dan berpotensi mengalami deadlock.</p>
                </div>
            </div>
            <div class="unsafe-visual text-center my-4">
                <svg width="80" height="80" viewBox="0 0 16 16" fill="currentColor" class="text-danger">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708z"/>
                </svg>
            </div>`;
        $('#safe-sequence').html(unsafeHTML);
    }

    // Tambahkan visualisasi untuk matriks Need
    $('#need-matrix').empty().removeClass('d-none');
    let needTable = `
        <p class="small text-muted mb-3">Need = Max - Allocation</p>
        <div class="table-responsive">
            <table class="table table-bordered text-center">
                <thead class="table-light">
                    <tr>
                        <th>Proses</th>`;
    
    for (let j = 1; j <= m; j++) {
        needTable += `<th>R${j}</th>`;
    }
    
    needTable += `</tr></thead><tbody>`;
    
    for (let i = 0; i < n; i++) {
        needTable += `<tr><td class="table-light"><strong>P${i + 1}</strong></td>`;
        for (let j = 0; j < m; j++) {
            needTable += `<td>${need[i][j]}</td>`;
        }
        needTable += `</tr>`;
    }
    
    needTable += `</tbody></table>
        </div>`;
    $('#need-matrix .card-body').html(needTable);

    // Bangun tabel hasil
    $('#result-table').empty().removeClass('d-none');
    let resultTable = `
        <div class="table-responsive">
            <table class="table table-bordered table-hover text-center mt-3">
                <thead class="table-light">
                    <tr>
                        <th rowspan="2" style="vertical-align: middle;">Proses</th>
                        <th colspan="${m}">Alokasi</th>
                        <th colspan="${m}">Maksimal</th>
                        <th colspan="${m}">Tersedia</th>
                    </tr>
                    <tr>`;

    for (let i = 0; i < 3; i++) {
        for (let j = 1; j <= m; j++) {
            resultTable += `<th>R${j}</th>`;
        }
    }

    resultTable += `</tr></thead><tbody>`;

    for (let i = 0; i < n; i++) {
        resultTable += `<tr id="row-${i}"><td class="table-light"><strong>P${i + 1}</strong></td>`;

        allocation[i].forEach((val, r) => {
            resultTable += `<td class="alloc-cell alloc-p${i}-r${r}">${val}</td>`;
        });

        max[i].forEach((val, r) => {
            resultTable += `<td class="max-cell max-p${i}-r${r}">${val}</td>`;
        });

        if (availableSnapshots[i]) {
            availableSnapshots[i].forEach((val, r) => {
                resultTable += `<td class="avail-cell avail-step${i}-r${r}">${val}</td>`;
            });
        } else {
            for (let j = 0; j < m; j++) {
                resultTable += `<td>-</td>`;
            }
        }

        resultTable += `</tr>`;
    }

    // Baris akhir untuk available terakhir
    resultTable += `<tr><td colspan="${1 + 2 * m}" class="table-light"><strong>Akhir</strong></td>`;
    availableSnapshots[availableSnapshots.length - 1].forEach((val, r) => {
        resultTable += `<td class="avail-cell avail-end avail-final-r${r}"><strong>${val}</strong></td>`;
    });
    resultTable += `</tr>`;    resultTable += `</tbody></table></div>`;
    $('#result-table .card-body').html(resultTable);
    
    // Tambahkan tombol simulasi step-by-step jika belum ada
    if (!$('#detailed-sim-btn').length) {
        // Hapus semua tombol grup simulasi yang mungkin tersisa
        $('#btn .gap-2.mt-3').remove();
        
        // Buat grup tombol baru
        const btnGroup = $('<div class="d-flex gap-2 mt-3"></div>');
        const detailedSimBtn = $('<button id="detailed-sim-btn" class="btn btn-primary"><i class="bi bi-list-ol me-2"></i>Simulasi Step-by-Step</button>');
        
        btnGroup.append(detailedSimBtn);
        $('#btn').append(btnGroup);
        
        detailedSimBtn.on('click', showDetailedSimulation);
    }

    // Hapus event handler untuk tombol simulasi
    // Kode untuk event handler $('#simulate-btn') dihapus
}

// Fungsi untuk menampilkan simulasi langkah demi langkah
function showDetailedSimulation() {
    // Pastikan ada langkah simulasi yang tersedia
    if (!simulationSteps || simulationSteps.length === 0) {
        alert("Silakan jalankan simulasi algoritma Banker terlebih dahulu!");
        return;
    }
    
    // Tampilkan bagian simulasi step-by-step
    $('#simulation-steps').removeClass('d-none');
    
    // Reset ke langkah pertama
    currentStepIndex = 0;
    
    // Perbarui tampilan langkah
    updateStepView();
    
    // Aktifkan tombol navigasi
    setupStepNavigation();
    
    // Scroll ke bagian simulasi
    $('html, body').animate({
        scrollTop: $('#simulation-steps').offset().top - 50
    }, 500);
}

// Fungsi untuk memperbarui tampilan langkah simulasi
function updateStepView() {
    if (!simulationSteps || currentStepIndex >= simulationSteps.length) {
        return;
    }
    
    const step = simulationSteps[currentStepIndex];
    const totalSteps = simulationSteps.length;
    
    // Perbarui counter langkah
    $('#step-counter').text(`Langkah ${currentStepIndex} dari ${totalSteps - 1}`);
    
    // Perbarui judul dan deskripsi
    let description = `<h5>${step.title}</h5><p>${step.description}</p>`;
    
    // Tambahkan detail berdasarkan jenis langkah
    if (step.processChosen !== null) {
        const processId = step.processChosen + 1;
        
        description += `<div class="my-3">
            <p><strong>Proses P${processId} dipilih</strong> untuk dialokasikan sumber daya.</p>
        `;
        
        // Tampilkan matriks Need untuk proses ini
        if (step.need) {
            description += `<p><strong>Kebutuhan (Need) P${processId}:</strong> `;
            step.need.forEach((val, idx) => {
                description += `R${idx + 1}=${val} `;
            });
            description += `</p>`;
        }
        
        // Tampilkan alokasi sumber daya proses ini
        if (step.allocation) {
            description += `<p><strong>Alokasi P${processId}:</strong> `;
            step.allocation.forEach((val, idx) => {
                description += `R${idx + 1}=${val} `;
            });
            description += `</p>`;
        }
        
        // Bandingkan ketersediaan sebelum dan sesudah
        if (step.prevAvailable && step.available) {
            description += `<p><strong>Sumber daya tersedia:</strong><br>`;
            description += `<span class="badge bg-secondary">Sebelum:</span> `;
            step.prevAvailable.forEach((val, idx) => {
                description += `R${idx + 1}=${val} `;
            });
            description += `<br><span class="badge bg-success">Sesudah:</span> `;
            step.available.forEach((val, idx) => {
                description += `R${idx + 1}=${val} `;
            });
            description += `</p>`;
        }
        
        description += `</div>`;
    } 
    else if (step.deadlock) {
        description += `<div class="alert alert-danger my-3">
            <strong>Peringatan Deadlock!</strong> 
            <p>Tidak ada proses yang dapat dialokasikan dengan sumber daya yang tersedia saat ini.</p>
            <p>Proses yang belum selesai:</p>
            <ul>`;
            
        step.finish.forEach((finished, idx) => {
            if (!finished) {
                description += `<li>P${idx + 1}</li>`;
            }
        });
        
        description += `</ul></div>`;
    }
    else if (step.completed) {
        description += `<div class="alert alert-success my-3">
            <strong>Simulasi Selesai!</strong>
            <p>Semua proses telah berhasil dijalankan dalam urutan yang aman.</p>
            <p>Urutan eksekusi: ${step.safeSequence.join(" → ")}</p>
        </div>`;
    }
    
    // Tampilkan alasan atau penjelasan tambahan
    if (step.reason) {
        description += `<div class="mt-3"><strong>Penjelasan:</strong> ${step.reason}</div>`;
    }
    
    // Perbarui tampilan deskripsi langkah
    $('#step-description').html(description);
    
    // Tampilkan status sistem pada langkah ini
    let statusHTML = `<h6>Status Sistem:</h6>`;
    
    // Visualisasikan status finish processes
    if (step.finish) {
        statusHTML += `<div class="row mb-3">
            <div class="col-md-3">Status Proses:</div>
            <div class="col-md-9">`;
            
        step.finish.forEach((finished, idx) => {
            const statusClass = finished ? 'bg-success' : 'bg-secondary';
            const statusText = finished ? 'Selesai' : 'Menunggu';
            statusHTML += `<span class="badge ${statusClass} me-2 mb-1">P${idx + 1}: ${statusText}</span>`;
        });
        
        statusHTML += `</div></div>`;
    }
    
    // Visualisasikan ketersediaan sumber daya
    if (step.available) {
        statusHTML += `<div class="row">
            <div class="col-md-3">Sumber Daya Tersedia:</div>
            <div class="col-md-9">`;
            
        step.available.forEach((val, idx) => {
            statusHTML += `<span class="badge bg-info text-dark me-2">R${idx + 1}: ${val}</span>`;
        });
        
        statusHTML += `</div></div>`;
    }
    
    // Perbarui tampilan status
    $('#step-status').html(statusHTML);
    
    // Aktifkan/nonaktifkan tombol navigasi berdasarkan indeks langkah saat ini
    $('#prev-step').prop('disabled', currentStepIndex === 0);
    $('#next-step').prop('disabled', currentStepIndex === totalSteps - 1);
}

// Fungsi untuk mengatur event handler navigasi langkah
function setupStepNavigation() {
    $('#prev-step').off('click').on('click', function() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateStepView();
        }
    });
    
    $('#next-step').off('click').on('click', function() {
        if (currentStepIndex < simulationSteps.length - 1) {
            currentStepIndex++;
            updateStepView();
        }
    });
}

// Fungsi untuk memperbarui tab permintaan sumber daya
function updateRequestTab() {
    const { numProcesses, numResources } = lastCalculatedState;
    
    // Reset dan perbarui dropdown proses
    $('#requestProcess').empty().prop('disabled', numProcesses === 0);
    $('#requestProcess').append('<option value="" selected>-- Pilih Proses --</option>');
    
    for (let i = 1; i <= numProcesses; i++) {
        $('#requestProcess').append(`<option value="${i-1}">P${i}</option>`);
    }
    
    // Reset form permintaan sumber daya
    $('#resourceRequestInputs').empty();
    $('#checkRequestBtn').prop('disabled', numProcesses === 0);
    $('#requestResult').addClass('d-none');
    
    // Buat input untuk setiap sumber daya
    if (numResources > 0) {
        const row = $('<div class="row"></div>');
        
        for (let i = 0; i < numResources; i++) {
            const col = $(`
                <div class="col-md-${12 / numResources} mb-3">
                    <label for="request-r${i}" class="form-label">R${i+1}</label>
                    <input type="number" min="0" class="form-control request-input" id="request-r${i}" disabled>
                </div>
            `);
            row.append(col);
        }
        
        $('#resourceRequestInputs').append(row);
        
        // Enable input ketika proses dipilih
        $('#requestProcess').on('change', function() {
            const selectedProcess = $(this).val();
            if (selectedProcess !== '') {
                $('.request-input').prop('disabled', false);
                // Kosongkan input
                $('.request-input').val('');
            } else {
                $('.request-input').prop('disabled', true);
            }
        });
    }
}

// Fungsi untuk memeriksa keamanan permintaan sumber daya
function checkResourceRequest() {
    const processIndex = parseInt($('#requestProcess').val());
    if (isNaN(processIndex)) {
        alert('Silakan pilih proses terlebih dahulu!');
        return;
    }
    
    const { allocation, max, need, available, numResources } = lastCalculatedState;
    
    // Ambil nilai permintaan dari input
    const request = [];
    for (let i = 0; i < numResources; i++) {
        const val = parseInt($(`#request-r${i}`).val());
        if (isNaN(val) || val < 0) {
            alert(`Nilai permintaan untuk R${i+1} harus berupa angka non-negatif!`);
            return;
        }
        request.push(val);
    }
    
    // Periksa apakah permintaan melebihi need
    for (let i = 0; i < numResources; i++) {
        if (request[i] > need[processIndex][i]) {
            const result = `
                <div class="alert alert-danger">
                    <h5>Permintaan Ditolak</h5>
                    <p>Proses P${processIndex+1} meminta sumber daya R${i+1} sebanyak ${request[i]} melebihi kebutuhan yang tersisa (${need[processIndex][i]}).</p>
                    <p>Error: <code>request[${i}] > need[${processIndex}][${i}]</code></p>
                </div>
            `;
            $('#requestResult').html(result).removeClass('d-none');
            return;
        }
    }
    
    // Periksa apakah permintaan melebihi available resources
    for (let i = 0; i < numResources; i++) {
        if (request[i] > available[i]) {
            const result = `
                <div class="alert alert-warning">
                    <h5>Permintaan Tertunda</h5>
                    <p>Proses P${processIndex+1} harus menunggu karena sumber daya R${i+1} yang tersedia (${available[i]}) tidak mencukupi permintaan (${request[i]}).</p>
                    <p>Status: <code>Proses P${processIndex+1} harus menunggu</code></p>
                </div>
            `;
            $('#requestResult').html(result).removeClass('d-none');
            return;
        }
    }
    
    // Lakukan simulasi pengalokasian permintaan untuk memeriksa keamanan
    const tempAvailable = [...available];
    const tempAllocation = allocation.map(row => [...row]);
    const tempNeed = need.map(row => [...row]);
    
    // Alokasikan sumber daya sementara untuk permintaan
    for (let i = 0; i < numResources; i++) {
        tempAvailable[i] -= request[i];
        tempAllocation[processIndex][i] += request[i];
        tempNeed[processIndex][i] -= request[i];
    }
    
    // Periksa apakah alokasi tersebut masih dalam status aman
    if (isSystemSafe(tempAllocation, tempNeed, tempAvailable)) {
        const result = `
            <div class="alert alert-success">
                <h5>Permintaan Diterima</h5>
                <p>Proses P${processIndex+1} dapat dialokasikan sumber daya yang diminta.</p>
                <p>Status: <code>Sistem tetap dalam keadaan aman</code></p>
            </div>
            <div class="alert alert-info">
                <p>Sumber daya tersedia setelah alokasi:</p>
                <ul class="list-inline">
                    ${tempAvailable.map((val, idx) => `<li class="list-inline-item"><strong>R${idx+1}</strong>: ${val}</li>`).join('')}
                </ul>
            </div>
        `;
        $('#requestResult').html(result).removeClass('d-none');
    } else {
        const result = `
            <div class="alert alert-danger">
                <h5>Permintaan Ditolak</h5>
                <p>Proses P${processIndex+1} tidak dapat dialokasikan sumber daya yang diminta karena akan menyebabkan sistem tidak aman (berpotensi deadlock).</p>
                <p>Status: <code>Permintaan ditolak untuk menjaga sistem tetap aman</code></p>
            </div>
        `;
        $('#requestResult').html(result).removeClass('d-none');
    }
}

// Fungsi untuk memeriksa apakah sistem dalam keadaan aman
function isSystemSafe(allocation, need, available) {
    const numProcesses = allocation.length;
    const numResources = available.length;
    const tempAvailable = [...available];
    const finish = Array(numProcesses).fill(false);
    let safeSequence = [];
    
    // Algoritma banker untuk menentukan urutan aman
    let count = 0;
    while (count < numProcesses) {
        let found = false;
        for (let p = 0; p < numProcesses; p++) {
            if (!finish[p]) {
                let canAllocate = true;
                for (let r = 0; r < numResources; r++) {
                    if (need[p][r] > tempAvailable[r]) {
                        canAllocate = false;
                        break;
                    }
                }
                
                if (canAllocate) {
                    for (let r = 0; r < numResources; r++) {
                        tempAvailable[r] += allocation[p][r];
                    }
                    finish[p] = true;
                    safeSequence.push(p);
                    count++;
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) break;
    }
    
    return count === numProcesses;
}

//Proses loading
function load () {
    myvar = setTimeout(showPage, 100);
}
function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("main").style.display = "block";
}

// Fungsi untuk mengisi template dengan nilai contoh
function fillTemplate() {
    // Hapus semua tombol simulasi yang ada sebelum mengisi template
    $('#detailed-sim-btn').parent('.gap-2.mt-3').remove();
    
    let numResources = parseInt($('#numResources').val());
    let numProcesses = parseInt($('#numProcesses').val());

    // Jika input kosong, isi dengan nilai default
    if (!numResources || isNaN(numResources) || numResources <= 0) {
        numResources = Math.floor(Math.random() * 3) + 3; // Default 3-5 sumber daya
        $('#numResources').val(numResources);
        // Picu event keyup untuk membangun tabel
        $('#numResources').trigger('keyup');
    }

    if (!numProcesses || isNaN(numProcesses) || numProcesses <= 0) {
        numProcesses = Math.floor(Math.random() * 3) + 3; // Default 3-5 proses
        $('#numProcesses').val(numProcesses);
        // Picu event input untuk membangun baris tabel
        $('#numProcesses').trigger('input');
    }

    // Delay sedikit untuk memastikan tabel sudah dibangun
    setTimeout(() => {
        // Isi tabel dengan nilai acak
        for (let i = 1; i <= numProcesses; i++) {
            for (let j = 1; j <= numResources; j++) {
                // Untuk alokasi, isi dengan nilai acak 0-2
                const allocValue = Math.floor(Math.random() * 3);
                $(`#alloTable #a${i}${j}`).val(allocValue);

                // Untuk maksimum, isi dengan alokasi + 1-3
                const maxValue = allocValue + 1 + Math.floor(Math.random() * 3);
                $(`#maxTable #m${i}${j}`).val(maxValue);
            }
        }

        // Untuk available, isi dengan nilai acak 1-5
        for (let j = 1; j <= numResources; j++) {
            $(`#availResourceInput #a${j}`).val(1 + Math.floor(Math.random() * 5));
        }

        // Otomatis jalankan hitung setelah mengisi template
        isSafeState();

        // Pastikan input tetap dapat diedit setelah template diisi
        $('#numResources').prop('disabled', false);
        $('#numProcesses').prop('disabled', false);
    }, 300); // Delay 300ms untuk memastikan DOM sudah diupdate
}

// Tambahkan event listener untuk tombol periksa permintaan
$(document).ready(function() {
    // Event untuk tombol periksa permintaan
    $('#checkRequestBtn').click(function() {
        checkResourceRequest();
    });
    
    // Jangan tambahkan event handler klik untuk tab request di sini
    // karena sudah ditangani oleh kode inisialisasi Bootstrap tab di atas
});