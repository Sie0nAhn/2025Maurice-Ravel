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
const POINT_LIFETIME = 1000; // 점이 화면에 표시되는 시간 (밀리초)
const POINT_SIZE = 10; // 점 크기

let lastMouseX = 0;
let lastMouseY = 0;
let lastMouseTime = Date.now();

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
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastMouseTime;
    
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 마우스 속도 계산 (픽셀/밀리초)
    const speed = distance / deltaTime;
    
    // 속도 임계값 조정 - 더 빠른 움직임이 필요하도록
    let playbackRate;
    if (speed < 0.3) {  // 느린 속도 임계값 증가 (기존 0.1)
        playbackRate = 0.3;  // 최소 속도
    } else if (speed > 2.5) {  // 빠른 속도 임계값 증가 (기존 1)
        // 최대 속도에 도달하는 데 더 빠른 움직임 필요
        playbackRate = Math.min(2.5, 1 + (speed - 2.5) * 0.3);  // 속도 증가 계수 감소
    } else {
        // 중간 속도 범위 조정
        playbackRate = 0.3 + (speed - 0.3) * 0.4;  // 더 점진적인 속도 증가
    }
    
    audio.playbackRate = playbackRate;
    
    // 현재 위치와 시간 저장
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastMouseTime = currentTime;
    
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
    
    // 새로운 점 추가
    points.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
    });
    
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
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const speedFactor = audio ? audio.playbackRate : 1;
    const time = Date.now() * 0.0005;
    const volume = audio ? audio.volume : 0;

    const imageSize = 100;
    const safeMargin = imageSize * 1.5;

    instruments.forEach((instrument, index) => {
        // 초기 위치 설정
        if (!instrument.style.left || !instrument.style.top) {
            instrument.style.left = (windowWidth / 2 + (index - instruments.length / 2) * 200) + 'px';
            instrument.style.top = windowHeight / 2 + 'px';
        }
        
        const baseX = parseFloat(instrument.style.left);
        const baseY = parseFloat(instrument.style.top);

        // 더 넓은 움직임 범위 설정 (특히 상하 움직임 증가)
        const individualRangeX = (windowWidth - safeMargin * 2) * (0.85 + index * 0.12);
        const individualRangeY = (windowHeight - safeMargin * 2) * (1.2 + index * 0.15); // 상하 움직임 증가

        // 더 느린 주파수로 큰 움직임 만들기
        const horizontalFrequency = (0.012 + (index * 0.006)) * speedFactor;
        const verticalFrequency = (0.01 + (index * 0.005)) * speedFactor;

        // 이미지들을 더 멀리 분산
        const totalImages = instruments.length;
        const angleStep = (Math.PI * 2) / totalImages;
        const radius = Math.min(windowWidth, windowHeight) * 0.4; // 분산 반경 증가
        
        // 각 이미지별 기본 위치를 원형으로 분산
        const baseOffsetX = Math.cos(angleStep * index) * radius;
        const baseOffsetY = Math.sin(angleStep * index) * radius;

        // 움직임 중심점을 분산
        const centerX = windowWidth / 2 + baseOffsetX;
        const centerY = windowHeight / 2 + baseOffsetY;

        // 위상 차이 증가
        const phaseOffset = index * Math.PI * 1.5;

        // 복합적인 움직임 패턴
        let newX = centerX + 
                  Math.sin(time * horizontalFrequency + phaseOffset) * individualRangeX * volume * 0.6 +
                  Math.cos(time * horizontalFrequency * 0.7 + phaseOffset) * individualRangeX * volume * 0.4;
        
        let newY = centerY + 
                  Math.cos(time * verticalFrequency + phaseOffset) * individualRangeY * volume * 0.8 + // 상하 움직임 증가
                  Math.sin(time * verticalFrequency * 0.6 + phaseOffset) * individualRangeY * volume * 0.5;

        // 화면 경계 체크 및 제한
        const margin = 5; // 화면 가장자리 여백
        
        // X축 제한
        newX = Math.max(margin, Math.min(windowWidth - margin, newX));
        
        // Y축 제한
        newY = Math.max(margin, Math.min(windowHeight - margin, newY));

        // 이미지 간 충돌 방지
        instruments.forEach((other, otherIndex) => {
            if (index !== otherIndex && other.currentX && other.currentY) {
                const dx = newX - other.currentX;
                const dy = newY - other.currentY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = 250;
                
                if (distance < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const pushDistance = (minDistance - distance) * 0.6;
                    newX += Math.cos(angle) * pushDistance;
                    newY += Math.sin(angle) * pushDistance;
                }
            }
        });

        // 마우스 상호작용 - 더 넓은 범위, 약한 힘
        if (window.mouseX && window.mouseY) {
            const dx = window.mouseX - newX;
            const dy = window.mouseY - newY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const mouseRange = 500; // 마우스 영향 범위 증가
            const avoidStrength = 0.15 * speedFactor; // 약한 회피력
            
            if (distance < mouseRange) {
                const factor = (1 - distance / mouseRange) * avoidStrength;
                newX -= dx * factor;
                newY -= dy * factor;
            }
        }

        // 부드러운 움직임
        if (!instrument.currentX) instrument.currentX = newX;
        if (!instrument.currentY) instrument.currentY = newY;

        const smoothing = 0.04 * speedFactor;
        instrument.currentX += (newX - instrument.currentX) * smoothing;
        instrument.currentY += (newY - instrument.currentY) * smoothing;

        // 더 극적인 크전과 크기 변화
        const rotation = Math.sin(time * speedFactor + phaseOffset) * (4 + index * 2) * volume;
        const baseScale = 0.9;
        const scaleVariation = 0.25; // 더 큰 크기 변화
        const scale = baseScale + (Math.sin(time * speedFactor * 0.2 + phaseOffset) * scaleVariation + scaleVariation) * volume;

        instrument.style.transform = `
            translate(${instrument.currentX - baseX}px, ${instrument.currentY - baseY}px)
            rotate(${rotation}deg)
            scale(${scale})
        `;
        
        instrument.style.transition = `transform ${0.25 / speedFactor}s ease-out`;
    });

    drawPoints(); // 점들 그리기
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

