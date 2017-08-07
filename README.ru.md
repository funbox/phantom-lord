# frontend-e2e-tests-env

Библиотека, предоставляющая удобный интерфейс для взаимодействия с phantomjs, вдохновлённая casperjs.

## Использование

Подключить к тесту:

```
const Browser = require('frontend-e2e-tests-env');
```
Запустить сервер и настроить вывод ошибок:

```
this.browser = new Browser();
this.browser.on('timeout', () => console.log('browser timeout!'));
this.browser.on('error', () => console.log('browser error!'));
```

Использовать: 
```
this.browser.open('https://ya.ru');
this.browser.waitForText('Найти');
this.browser.sendKeys('.input__input', 'hello');
this.browser.click('button');
this.browser.waitForUrl('yandex.ru');
this.browser.waitForText('показов в месяц');
```