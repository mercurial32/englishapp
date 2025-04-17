// Массив карточек со словами
const cards = [
    {
        word: 'chase',
        transcription: '[чейс]',
        examples: [
            { eng: 'chase a thief', rus: 'преследовать вора' },
            { eng: 'chase a dream', rus: 'гнаться за мечтой' },
            { eng: 'chase away', rus: 'прогнать прочь' }
        ]
    },
    {
        word: 'achieve',
        transcription: '[əˈtʃiːv]',
        examples: [
            { eng: 'achieve goals', rus: 'достигать целей' },
            { eng: 'achieve success', rus: 'достичь успеха' },
            { eng: 'achieve results', rus: 'достичь результатов' }
        ]
    },
    {
        word: 'determine',
        transcription: '[dɪˈtɜːmɪn]',
        examples: [
            { eng: 'determine the cause', rus: 'определить причину' },
            { eng: 'determine the winner', rus: 'определить победителя' },
            { eng: 'determine the price', rus: 'определить цену' }
        ]
    }
];

class CardSwiper {
    constructor() {
        this.currentIndex = this.loadProgress();
        this.cards = cards;
        this.container = document.querySelector('.card-container');
        this.initializeUI();
        this.initializeNavigation();
        this.createSpeechSynthesis();
    }

    loadProgress() {
        return parseInt(localStorage.getItem('cardProgress')) || 0;
    }

    saveProgress() {
        localStorage.setItem('cardProgress', this.currentIndex.toString());
    }

    initializeUI() {
        this.container.innerHTML = ''; // Очищаем контейнер
        this.createCard(this.currentIndex);
        this.createNextCard();
    }

    createCard(index) {
        const card = document.createElement('div');
        card.className = 'card current-card';
        const cardData = this.cards[index % this.cards.length];

        card.innerHTML = `
            <div class="card-content">
                <div class="word-section">
                    <h2 class="word">${cardData.word}</h2>
                    <button class="sound-btn">🔊</button>
                </div>
                <p class="transcription">${cardData.transcription}</p>
                <div class="examples">
                    ${cardData.examples.map(ex => `
                        <div class="example">
                            <p>${ex.eng}</p>
                            <p class="translation">${ex.rus}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.container.appendChild(card);
        this.card = card;
        
        // Добавляем обработчик для кнопки звука
        const soundBtn = card.querySelector('.sound-btn');
        soundBtn.addEventListener('click', () => this.speakWord(cardData.word));
        
        this.initializeEvents();
    }

    createNextCard() {
        const nextIndex = (this.currentIndex + 1) % this.cards.length;
        const nextCard = document.createElement('div');
        nextCard.className = 'card next-card';
        const cardData = this.cards[nextIndex];

        nextCard.innerHTML = `
            <div class="card-content">
                <div class="word-section">
                    <h2 class="word">${cardData.word}</h2>
                    <button class="sound-btn">🔊</button>
                </div>
                <p class="transcription">${cardData.transcription}</p>
                <div class="examples">
                    ${cardData.examples.map(ex => `
                        <div class="example">
                            <p>${ex.eng}</p>
                            <p class="translation">${ex.rus}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.container.appendChild(nextCard);
    }

    initializeNavigation() {
        const searchBtn = document.querySelector('.search-btn');
        const cardsBtn = document.querySelector('.cards-btn');
        const randomBtn = document.querySelector('.random-btn');
        const favoriteBtn = document.querySelector('.favorite-btn');
        const profileBtn = document.querySelector('.profile-btn');

        randomBtn.addEventListener('click', () => {
            this.currentIndex = Math.floor(Math.random() * this.cards.length);
            this.initializeUI();
        });

        favoriteBtn.addEventListener('click', () => {
            const currentCard = this.cards[this.currentIndex % this.cards.length];
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            
            if (!favorites.includes(currentCard.word)) {
                favorites.push(currentCard.word);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                favoriteBtn.textContent = '❤️';
            } else {
                const index = favorites.indexOf(currentCard.word);
                favorites.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                favoriteBtn.textContent = '🤍';
            }
        });
    }

    createSpeechSynthesis() {
        this.synthesis = window.speechSynthesis;
        this.voice = null;

        // Ждем загрузки голосов
        window.speechSynthesis.onvoiceschanged = () => {
            const voices = this.synthesis.getVoices();
            this.voice = voices.find(voice => voice.lang === 'en-US') || voices[0];
        };
    }

    speakWord(word) {
        if (this.synthesis && this.voice) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.voice = this.voice;
            utterance.rate = 0.9;
            this.synthesis.speak(utterance);
        }
    }

    initializeEvents() {
        // Touch events
        this.card.addEventListener('touchstart', (e) => this.startDragging(e));
        this.card.addEventListener('touchmove', (e) => this.drag(e));
        this.card.addEventListener('touchend', () => this.endDragging());

        // Mouse events
        this.card.addEventListener('mousedown', (e) => this.startDragging(e));
        this.card.addEventListener('mousemove', (e) => this.drag(e));
        this.card.addEventListener('mouseup', () => this.endDragging());
        this.card.addEventListener('mouseleave', () => this.endDragging());
    }

    startDragging(e) {
        this.isDragging = true;
        this.startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
        this.currentX = 0;
        this.card.style.transition = 'none';
    }

    drag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        const currentX = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
        const diff = currentX - this.startX;
        this.currentX = diff;

        const rotation = diff * 0.1;
        this.card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;

        const opacity = Math.max(1 - Math.abs(diff) / 400, 0);
        this.card.style.opacity = opacity;
    }

    endDragging() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.card.style.transition = 'all 0.3s ease';

        if (Math.abs(this.currentX) > 100) {
            const direction = this.currentX > 0 ? 1 : -1;
            this.card.style.transform = `translateX(${direction * window.innerWidth}px) rotate(${direction * 45}deg)`;
            this.card.style.opacity = '0';
            
            // Переход к следующей карточке
            this.currentIndex = (this.currentIndex + 1) % this.cards.length;
            this.saveProgress();
            
            setTimeout(() => {
                this.initializeUI();
            }, 300);
        } else {
            this.card.style.transform = 'translateX(0) rotate(0)';
            this.card.style.opacity = '1';
        }
    }
}

// Initialize the card swiper when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CardSwiper();
}); 