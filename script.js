let audio;
let isPlaying = false;

// 악기 설정 함수
function setupInstruments() {
    const container = document.getElementById('container');
    container.innerHTML = '';
    
    const instruments = {
        row3: ['1violons', '2violons', 'flute', 'oboe'],
        row2: ['her', 'horns', 'viola', 'clarinettes'],
        row1: ['doublebass', 'cello', 'bassoon']
    };
    
    // 화면을 그리드로 나누어 위치 계산
    const totalInstruments = Object.values(instruments).flat().length; // 전체 악기 수
    const columns = 4; // 한 행당 최대 악기 수
    const rows = Math.ceil(totalInstruments / columns);
    
    const gridWidth = window.innerWidth * 0.8; // 화면 너비의 80% 사용
    const gridHeight = window.innerHeight * 0.8; // 화면 높이의 80% 사용
    
    const cellWidth = gridWidth / columns;
    const cellHeight = gridHeight / rows;
    
    const startX = window.innerWidth * 0.1; // 왼쪽 여백 10%
    const startY = window.innerHeight * 0.1; // 위쪽 여백 10%
    
    let instrumentIndex = 0;
    
    for (const [rowId, instrumentList] of Object.entries(instruments)) {
        instrumentList.forEach(instrumentName => {
            const div = document.createElement('div');
            div.className = 'instrument';
            
            // 그리드 위치 계산
            const row = Math.floor(instrumentIndex / columns);
            const col = instrumentIndex % columns;
            
            // 위치에 약간의 랜덤성 추가
            const randomOffsetX = (Math.random() - 0.5) * (cellWidth * 0.3);
            const randomOffsetY = (Math.random() - 0.5) * (cellHeight * 0.3);
            
            const x = startX + (col * cellWidth) + (cellWidth / 2) + randomOffsetX;
            const y = startY + (row * cellHeight) + (cellHeight / 2) + randomOffsetY;
            
            div.style.left = `${x}px`;
            div.style.top = `${y}px`;
            
            const img = document.createElement('img');
            img.src = `${instrumentName}.svg`;
            img.alt = instrumentName;
            
            // 이미지 로드 에러 처리
            img.onerror = function() {
                console.error(`Failed to load image: ${instrumentName}.svg`);
                // 이미지 로드 실패 시 표시
                div.style.border = '2px solid red';
                div.style.padding = '10px';
                div.textContent = instrumentName;
            };
            
            div.appendChild(img);
            container.appendChild(div);
            instrumentIndex++;
        });
    }
}

// 마우스 트레일을 위한 캔버스 생성
let canvas;
let ctx;

function setupCanvas() {
    canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // 마우스 이벤트 무시
    canvas.style.zIndex = '999'; // 악기보다 위, 제목보다 아래
    
    // 캔버스 크기를 화면 크기로 설정
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);
}

// 점들을 저장할 배열
let points = [];
const POINT_LIFETIME = 2000; // 점이 사라지기까지의 시간 (밀리초)
const POINT_SIZE = 10; // 점 크기

// 시작 버튼 클릭 이벤트
document.getElementById('startButton').addEventListener('click', () => {
    try {
        // 오디오 초기화
        audio = new Audio('Pavane.mp3');
        audio.loop = true;
        
        // UI 설정
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('container').style.display = 'flex';
        
        setupInstruments();
        setupCanvas();
        
        // 크롬의 자동재생 정책을 위한 처리
        audio.play().then(() => {
            audio.volume = 0;
            console.log('Audio ready');
        }).catch(error => {
            console.error('Audio play failed:', error);
        });
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
});

// 마우스 움직임 감지
let mouseTimer;
document.addEventListener('mousemove', (e) => {
    if (!audio) return;
    
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
    
    // 새로운 점 추가
    if (canvas) {
        points.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        });
    }
    
    clearTimeout(mouseTimer);
    showMessage(false);
    
    // 음악 재생 확실히 하기
    if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Playback failed:', error);
            });
        }
    }
    
    // 볼륨 증가
    audio.volume = 1;
    
    if (!isPlaying) {
        isPlaying = true;
        animate();
    }
    
    mouseTimer = setTimeout(() => {
        audio.volume = 0.1;
        showMessage(true);
    }, 100);
});

function animate() {
    if (!isPlaying) return;
    const instruments = document.querySelectorAll('.instrument');
    const time = Date.now() * 0.002;
    const volume = audio.volume;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 모든 이미지 쌍에 대해 충돌 검사
    for (let i = 0; i < instruments.length; i++) {
        for (let j = i + 1; j < instruments.length; j++) {
            const inst1 = instruments[i];
            const inst2 = instruments[j];
            
            const dx = inst2.currentX - inst1.currentX;
            const dy = inst2.currentY - inst1.currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 충돌 범위 (이미지 크기에 따라 조정)
            const collisionDistance = 150;
            
            if (distance < collisionDistance) {
                // 충돌 시 반발력 계산
                const angle = Math.atan2(dy, dx);
                const force = (collisionDistance - distance) * 0.05;
                
                // 반발력 적용
                inst1.velocityX -= Math.cos(angle) * force;
                inst1.velocityY -= Math.sin(angle) * force;
                inst2.velocityX += Math.cos(angle) * force;
                inst2.velocityY += Math.sin(angle) * force;
            }
        }
    }

    instruments.forEach((instrument, index) => {
        const baseX = parseFloat(instrument.style.left);
        const baseY = parseFloat(instrument.style.top);

        // 각 악기별 시간과 주파수
        const individualTime = time + (index * 0.5);
        const horizontalFrequency = 0.5 + (index * 0.1);
        const verticalFrequency = 0.6 + (index * 0.1);

        // 움직임 범위
        const moveRangeX = windowWidth * 0.35;
        const moveRangeY = windowHeight * 0.35;

        // 새로운 위치 계산
        let newX = baseX + Math.sin(individualTime * horizontalFrequency) * moveRangeX * volume;
        let newY = baseY + Math.sin(individualTime * verticalFrequency) * moveRangeY * volume;

        // 속도 초기화
        if (!instrument.velocityX) instrument.velocityX = 0;
        if (!instrument.velocityY) instrument.velocityY = 0;

        // 마우스 상호작용
        if (window.mouseX && window.mouseY) {
            const dx = window.mouseX - newX;
            const dy = window.mouseY - newY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const mouseRange = 300;
            const repelStrength = 0.5;
            
            if (distance < mouseRange) {
                const force = (1 - distance / mouseRange) * repelStrength;
                instrument.velocityX -= (dx / distance) * force * 2;
                instrument.velocityY -= (dy / distance) * force * 2;
            }
        }

        // 속도 적용
        newX += instrument.velocityX;
        newY += instrument.velocityY;

        // 화면 경계 체크 및 반발
        const margin = 100;
        if (newX < margin) {
            newX = margin;
            instrument.velocityX *= -0.5;
        }
        if (newX > windowWidth - margin) {
            newX = windowWidth - margin;
            instrument.velocityX *= -0.5;
        }
        if (newY < margin) {
            newY = margin;
            instrument.velocityY *= -0.5;
        }
        if (newY > windowHeight - margin) {
            newY = windowHeight - margin;
            instrument.velocityY *= -0.5;
        }

        // 감쇠
        instrument.velocityX *= 0.95;
        instrument.velocityY *= 0.95;

        // 부드러운 움직임을 위한 보간
        if (!instrument.currentX) instrument.currentX = newX;
        if (!instrument.currentY) instrument.currentY = newY;

        const smoothing = 0.1;
        instrument.currentX += (newX - instrument.currentX) * smoothing;
        instrument.currentY += (newY - instrument.currentY) * smoothing;

        // 회전과 크기
        const rotation = Math.sin(individualTime) * 20 * volume;
        const minScale = 0.8;
        const maxScale = 1.8;
        const scale = minScale + (Math.sin(individualTime * 0.5) * 0.5 + 0.5) * 
                     (maxScale - minScale) * volume;

        // 변환 적용
        instrument.style.transform = `
            translate(${instrument.currentX - baseX}px, ${instrument.currentY - baseY}px)
            rotate(${rotation}deg)
            scale(${scale})
        `;
        
        instrument.style.transition = 'transform 0.1s ease-out';
    });

    drawPoints();
    requestAnimationFrame(animate);
}

function showMessage(show) {
    const message = document.getElementById('message');
    if (message) {
        message.textContent = "지휘를 계속해주세요!";
        message.style.opacity = show ? '1' : '0';
    }
}

// 페이지 클릭 시 오디오 재생 시도
document.addEventListener('click', () => {
    if (audio && audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Click play failed:', error);
            });
        }
    }
});

// CSS 스타일 업데이트
const style = document.createElement('style');
style.textContent = `
    .instrument {
        position: absolute;
        width: 120px; // 이미지 크기 조절
        height: 120px;
        transform-origin: center center;
        will-change: transform;
        transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .instrument img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`;
document.head.appendChild(style);

// 점 그리기 함수
function drawPoints() {
    if (!ctx) return;
    
    const currentTime = Date.now();
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 오래된 점들 제거
    points = points.filter(point => currentTime - point.timestamp < POINT_LIFETIME);
    
    // 점들 그리기
    points.forEach(point => {
        const age = currentTime - point.timestamp;
        const opacity = 1 - (age / POINT_LIFETIME); // 시간이 지날수록 투명해짐
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_SIZE, 0, Math.PI * 4);
        ctx.fillStyle = `rgba(126, 206, 244, ${opacity})`; // #7ECEF4 with opacity
        ctx.fill();
    });
    
    requestAnimationFrame(drawPoints);
}

// 화면 크기 변경 시 캔버스 크기 조정
window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

