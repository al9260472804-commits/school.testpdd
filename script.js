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
    
    // Проверяем, что элементы существуют
    if (!submitBtn || !fioInput || !successModal) {
        console.log('Некоторые элементы не найдены');
        return;
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
            question1: 'no',
            question2: 'enter-prohibited'
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
        }
        // Проверка второго вопроса
        else if (!document.querySelector('input[name="question2"]:checked')) {
            isValid = false;
            errorMessage = 'Пожалуйста, ответьте на второй вопрос';
        }
        
        if (!isValid) {
            alert(errorMessage);
            return false;
        }
        
        return true;
    }
    
    // Показать результаты
    function showResults(formData, score, correctAnswers) {
        const totalQuestions = Object.keys(correctAnswers).length;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        let resultText = '';
        
        if (score === totalQuestions) {
            resultText = '🎉 Отлично! Все ответы правильные!';
        } else if (score >= totalQuestions / 2) {
            resultText = '👍 Хорошо! Но есть ошибки.';
        } else {
            resultText = '📚 Нужно повторить правила дорожного движения.';
        }
        
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
        
        // Показываем кнопку запуска игры
        setTimeout(() => {
            const launchBtn = document.getElementById('launch-game-btn');
            if (launchBtn) {
                launchBtn.style.animation = 'pulse 2s infinite';
                launchBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }
    
    // Закрытие модального окна
    function closeSuccessModal() {
        successModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeSuccessModal);
    }
    
    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', closeSuccessModal);
    }
    
    // Закрытие по клику вне окна
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
    
    // Обработка кнопки обратной связи
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function() {
            alert('Спасибо за обратную связь! Ваше мнение очень важно для нас. В реальном приложении здесь была бы форма для отправки отзыва.');
        });
    }
    
    // Анимация для радио-кнопок
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            // Удаляем выделение у всех радио-кнопок в группе
            const groupName = this.name;
            document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
                const label = r.closest('.g-control-label');
                if (label) {
                    label.style.backgroundColor = '';
                }
            });
            
            // Добавляем выделение к выбранной
            const selectedLabel = this.closest('.g-control-label');
            if (selectedLabel) {
                selectedLabel.style.backgroundColor = 'rgba(51, 142, 245, 0.1)';
            }
        });
    });
    
    // Подсветка обязательных полей при фокусе
    const requiredInputs = document.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 0 3px rgba(51, 142, 245, 0.3)';
        });
        
        input.addEventListener('blur', function() {
            this.style.boxShadow = '';
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
    
    console.log('Система викторины готова к работе!');
});

// Отображение версии приложения
console.log('Версия приложения: 1.0.0');
console.log('Дата сборки: ' + new Date().toLocaleDateString('ru-RU'));
