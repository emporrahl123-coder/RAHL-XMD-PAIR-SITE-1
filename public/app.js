let selectedMethod = 'qr';
let qrInterval;
gsap.from("#main-header", {duration: 1, y: -50, opacity: 0, ease: "power3.out"});
gsap.from("#method-card", {duration: 1, y: 30, opacity: 0, delay: 0.2, ease: "back.out(1.2)"});
gsap.from("#output-card", {duration: 1, y: 30, opacity: 0, delay: 0.4, ease: "power3.out"});
gsap.from("#rahl-image", {
    duration: 1.5,
    scale: 0.5,
    rotation: -10,
    opacity: 0,
    ease: "elastic.out(1, 0.5)",
    delay: 0.3
});
window.addEventListener('load', function() {
    const rahlImage = document.getElementById('rahl-image');
    rahlImage.addEventListener('load', function() {
        gsap.to(rahlImage, {
            duration: 1,
            scale: 1.05,
            boxShadow: "0 0 40px rgba(139, 92, 246, 0.6)",
            yoyo: true,
            repeat: 1
        });
    });
    rahlImage.addEventListener('error', function() {
    });
});
function selectMethod(method) {
    selectedMethod = method;
    document.querySelectorAll('.method-option').forEach(opt => {
        opt.classList.remove('border-cyan-500', 'border-purple-500', 'ring-4');
        opt.classList.add('border-gray-700');
    });
    const selectedEl = document.getElementById(`option-${method}`);
    const colorClass = method === 'qr' ? 'border-cyan-500 ring-cyan-500/30' : 'border-purple-500 ring-purple-500/30';
    selectedEl.classList.remove('border-gray-700');
    selectedEl.classList.add(colorClass, 'ring-4');
    const actionBtn = document.getElementById('action-button');
    const actionText = method === 'qr' ? 'Start QR Authentication' : 'Generate Pairing Code';
    actionBtn.innerHTML = `<i class="fas fa-${method === 'qr' ? 'qrcode' : 'mobile-alt'} mr-2"></i> ${actionText}`;
    actionBtn.disabled = false;
    document.getElementById('pairing-input-section').style.display = method === 'pair' ? 'block' : 'none';
    document.getElementById('qr-display').innerHTML = '';
    animateSelection(method);
}
function animateSelection(method) {
    const tl = gsap.timeline();
    const icon = document.querySelector(`#option-${method} .icon-wrapper i`);
    tl.to(icon, {duration: 0.3, scale: 1.4, ease: "elastic.out(1, 0.5)"})
      .to(icon, {duration: 0.5, scale: 1, ease: "back.out(3)"});
}
async function handleAction() {
    const statusEl = document.getElementById('status-indicator');
    statusEl.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-1"></i> Status: Processing...';
    statusEl.style.color = '#fbbf24';
    if (selectedMethod === 'qr') {
        await startQRGeneration();
    } else {
        await requestPairingCode();
    }
}
async function startQRGeneration() {
    try {
        const response = await fetch('/api/generate-qr');
        const data = await response.json();
        if (data.qrImage) {
            document.getElementById('qr-display').innerHTML = `<img src="${data.qrImage}" class="w-48 h-48 mx-auto rounded-lg shadow-2xl border-4 border-white" id="qr-image">`;
            gsap.from("#qr-image", {
                duration: 0.8,
                scale: 0,
                rotation: 180,
                ease: "back.out(1.7)"
            });
            startPollingSession();
        }
    } catch (error) {
        console.error("QR Error:", error);
    }
}
async function requestPairingCode() {
    const phone = document.getElementById('phone-input').value.trim();
    if (!phone) {
        alert('Please enter a valid phone number.');
        return;
    }
    try {
        const response = await fetch('/api/request-pairing-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });
        const data = await response.json();
        if (data.pairingCode) {
            alert(`Your 6-digit Pairing Code is: ${data.pairingCode}\n\nGo to WhatsApp > Linked Devices > Link a Device > "Pair with code" and enter this code.`);
            startPollingSession();
        }
    } catch (error) {
        console.error("Pairing Error:", error);
    }
}
function startPollingSession() {
    clearInterval(qrInterval);
    qrInterval = setInterval(async () => {
        const response = await fetch('/api/get-session');
        if (response.ok) {
            const data = await response.json();
            if (data.sessionId) {
                clearInterval(qrInterval);
                document.getElementById('session-output').value = data.sessionId;
                const statusEl = document.getElementById('status-indicator');
                statusEl.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Status: Authenticated!';
                statusEl.style.color = '#34d399';
                gsap.to("#output-card", {
                    duration: 0.5,
                    boxShadow: '0 0 30px rgba(52, 211, 153, 0.5)',
                    yoyo: true,
                    repeat: 1
                });
            }
        }
    }, 2000);
}
function copySession() {
    const sessionText = document.getElementById('session-output');
    sessionText.select();
    document.execCommand('copy');
    const btn = document.getElementById('copy-btn');
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
}
