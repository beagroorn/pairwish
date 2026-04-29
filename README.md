# Наші бажання

Статичний сайт для GitHub Pages зі спільним списком бажань для пари.

Категорії:

- Побачення
- Експерименти з їжею
- Челенджи
- Фільми/серіали

Сайт використовує Firebase Firestore, тому зміни з одного телефона або комп'ютера будуть видні на інших пристроях.

## Файли

- `index.html` - сторінка сайту
- `styles.css` - адаптивний дизайн
- `script.js` - логіка вкладок і роботи з Firebase
- `firebase-config.js` - Firebase config, який треба заповнити

## Налаштування Firebase

1. Перейдіть на `https://console.firebase.google.com/`.
2. Створіть новий Firebase project.
3. У проекті натисніть `</>` для створення Web app.
4. Скопіюйте об'єкт `firebaseConfig`.
5. Вставте значення в `firebase-config.js` замість `PASTE_...`.
6. У Firebase відкрийте `Build` -> `Firestore Database`.
7. Натисніть `Create database`.
8. Для простого особистого сайту можна вибрати test mode, а потім додати правила нижче.

## Firestore rules

Для особистого спільного списку без логіну можна використати такі правила:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /ideas/{ideaId} {
      allow read, create, update, delete: if true;
    }
  }
}
```

Важливо: ці правила роблять колекцію доступною без логіну. Для приватного списку краще додати авторизацію або окремий захист, але для швидкого спільного сайту на GitHub Pages це найпростіший варіант.

## Публікація на GitHub Pages

1. Створіть новий репозиторій на GitHub.
2. Завантажте в нього файли з цієї папки.
3. Відкрийте `Settings` -> `Pages`.
4. У полі `Source` виберіть `Deploy from a branch`.
5. Виберіть гілку `main` і папку `/root`.
6. Натисніть `Save`.

Адреса сайту буде приблизно така:

```text
https://ваш-нік.github.io/назва-репозиторію/
```
