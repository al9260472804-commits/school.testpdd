// Обработка формы викторины
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js загружен!');
    
    // Элементы DOM
    const submitBtn = document.getElementById('submit-quiz-btn');
    const fioInput = document.getElementById('fio-input');
    const feedbackBtn = document.getElementById('feedback-btn');
    const successModal = document.getElementById('success-modal');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const modalOkBtn = document.getElementById('modal-ok-btn');
    const quizResult = document.getElementById('quiz-result');
    
    // ФИКС: Добавляем обработчики для радиокнопок
    const radioInputs = document.querySelectorAll('.radio-input');
    radioInputs.forEach(radio => {
        radio.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        radio.addEventListener('change', function() {
            console.log('Радиокнопка изменена:', this.name, this.value);
            highlightSelectedRadio(this);
        });
    });
    
    // Функция выделения выбранной радиокнопки
    function highlightSelectedRadio(selectedRadio) {
        const groupName = selectedRadio.name;
        const allRadios = document.querySelectorAll(`input[name="${groupName}"]`);
        
        allRadios.forEach(radio => {
            const label = radio.closest('.g-control-label');
            if (label) {
                label.style.backgroundColor = '';
                label.style.borderRadius = '8px';
                label.style.padding = '8px 12px';
                label.style.transition = 'background-color 0.3s';
            }
        });
        
        // Выделяем выбранную
        const selectedLabel = selectedRadio.closest('.g-control-label');
        if (selectedLabel) {
            selectedLabel.style.backgroundColor = 'rgba(51, 142, 245, 0.2)';
            selectedLabel.style.border = '2px solid #338ef5';
        }
    }
    
    // Обработка отправки викторины
    submitBtn.addEventListener('click', function() {
        console.log('Отправка викторины...');
        
        // Проверка обязательных полей
        if (!validateForm()) {
            return;
        }
        
        // Сбор данных
        const formData = {
            fio: fioInput.value.trim(),
            question1: document.querySelector('input[name="question1"]:checked')?.value,
            question2: document.querySelector('input[name="question2"]:checked')?.value,
            timestamp: new Date().toLocaleString('ru-RU')
        };
        
        console.log('Данные викторины:', formData);
        
        // Проверка ответов
        const correctAnswers = {
            question1: 'no', // Нет, нельзя просто начать переход
            question2: 'enter-prohibited' // Въезд запрещен
        };
        
        let score = 0;
        if (formData.question1 === correctAnswers.question1) score++;
        if (formData.question2 === correctAnswers.question2) score++;
        
        // Показ результатов
        showResults(formData, score, correctAnswers);
    });
    
    // Валидация формы
    function validateForm() {
        let isValid = true;
        let errorMessage = '';
        
        // Проверка ФИО
        if (!fioInput.value.trim()) {
            isValid = false;
            errorMessage = 'Пожалуйста, введите ФИО и класс';
            fioInput.focus();
        }
        // Проверка первого вопроса
        else if (!document.querySelector('input[name="question1"]:checked')) {
            isValid = false;
            errorMessage = 'Пожалуйста, ответьте на первый вопрос';
            document.querySelector('input[name="question1"]').closest('.QuestionMarkup-Column').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Проверка второго вопроса
        else if (!document.querySelector('input[name="question2"]:checked')) {
            isValid = false;
            errorMessage = 'Пожалуйста, ответьте на второй вопрос';
            document.querySelector('input[name="question2"]').closest('.QuestionMarkup-Column').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (!isValid) {
            showError(errorMessage);
            return false;
        }
        
        return true;
    }
    
    // Показать ошибку
    function showError(message) {
        let errorEl = document.querySelector('.form-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            errorEl.style.cssText = `
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid #ff3333;
                color: #ff6666;
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
                text-align: center;
                animation: fadeIn 0.3s ease;
            `;
            submitBtn.parentNode.insertBefore(errorEl, submitBtn);
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
    
    // Показать результаты
    function showResults(formData, score, correctAnswers) {
        const totalQuestions = Object.keys(correctAnswers).length;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        // Формируем детальные результаты
        const details = `
            <strong>Результаты:</strong><br>
            ✅ Правильных ответов: ${score} из ${totalQuestions} (${percentage}%)<br><br>
            <strong>Правильные ответы:</strong><br>
            1. Если светофор сломан и мигает желтым, пешеход должен убедиться в безопасности, но уступить дорогу всем транспортным средствам. Ответ: <strong>Нет</strong><br>
            2. Знак означает: <strong>Въезд запрещен</strong>
        `;
        
        quizResult.innerHTML = details;
        
        // Показываем модальное окно
        successModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Сохраняем результат в localStorage
        const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        quizResults.push({
            ...formData,
            score,
            percentage,
            date: new Date().toISOString()
        });
        localStorage.setItem('quizResults', JSON.stringify(quizResults));
        
        // Активируем кнопку запуска игры
        setTimeout(() => {
            const launchBtn = document.getElementById('launch-game-btn');
            if (launchBtn) {
                launchBtn.disabled = false;
                launchBtn.style.animation = 'pulse 2s infinite';
                launchBtn.style.opacity = '1';
                launchBtn.style.cursor = 'pointer';
                launchBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }
    
    // Закрытие модального окна
    function closeSuccessModal() {
        successModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    modalCloseBtn.addEventListener('click', closeSuccessModal);
    modalOkBtn.addEventListener('click', closeSuccessModal);
    
    // Закрытие по клику вне окна
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
    
    // Обработка кнопки обратной связи
    feedbackBtn.addEventListener('click', function() {
        alert('Спасибо за обратную связь! Ваше мнение очень важно для нас. В реальном приложении здесь была бы форма для отправки отзыва.');
    });
    
    // Подсветка обязательных полей при фокусе
    const requiredInputs = document.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 3px rgba(51, 142, 245, 0.3)';
            this.style.borderColor = '#338ef5';
        });
        
        input.addEventListener('blur', function() {
            this.style.boxShadow = '';
            this.style.borderColor = '#444';
        });
    });
    
    // Автосохранение формы при вводе
    fioInput.addEventListener('input', function() {
        localStorage.setItem('quizFIO', this.value);
    });
    
    // Восстановление сохраненных данных
    const savedFIO = localStorage.getItem('quizFIO');
    if (savedFIO) {
        fioInput.value = savedFIO;
    }
    
    // Восстановление выбранных радиокнопок
    const savedQuiz = localStorage.getItem('quizResults');
    if (savedQuiz) {
        try {
            const lastQuiz = JSON.parse(savedQuiz)[0];
            if (lastQuiz) {
                // Восстанавливаем радиокнопки
                if (lastQuiz.question1) {
                    const radio1 = document.querySelector(`input[name="question1"][value="${lastQuiz.question1}"]`);
                    if (radio1) {
                        radio1.checked = true;
                        highlightSelectedRadio(radio1);
                    }
                }
                if (lastQuiz.question2) {
                    const radio2 = document.querySelector(`input[name="question2"][value="${lastQuiz.question2}"]`);
                    if (radio2) {
                        radio2.checked = true;
                        highlightSelectedRadio(radio2);
                    }
                }
            }
        } catch (e) {
            console.log('Ошибка восстановления данных:', e);
        }
    }
    
    // Установка текущего года в футере
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    console.log('✅ Система викторины готова к работе!');
});
