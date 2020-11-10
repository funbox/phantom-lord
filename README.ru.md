# @funboxteam/phantom-lord

<img align="right" width="192" height="192"
     alt="Лого Phantom Lord: Золотой щит с лицом фантома в короне, на чёрном фоне"
     src="./logo.png">

[![npm](https://img.shields.io/npm/v/@funboxteam/phantom-lord.svg)](https://www.npmjs.com/package/@funboxteam/phantom-lord)

Удобное АПИ для взаимодействия 
с [Headless Chromium](https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md), 
вдохновлённое [CasperJS](http://casperjs.org/).

Может использоваться для автоматизированного тестирования, создания обходчиков сайтов и других задач, 
требующих наличия виртуального браузера.

## Мотивация

Существует библиотека, позволяющая писать тесты на Node.js и выполнять их в виртуальном браузере, 
— [Selenium](http://www.seleniumhq.org/). С нашей точки зрения у неё есть две основные проблемы:

1. Она написана на Java.
2. Работа с виртуальным браузером не всегда проходит адекватно. 

А поэтому в случае возникновения каких-либо проблем для отладки требуется знание трех языков программирования 
и соответствующих инфраструктур (Node.js, Java, C++), что приводит к большим затратам времени 
и специфическим требованиям к компетенции разработчика. 

Пытаясь решить эту проблему мы написали свою библиотеку — Phantom Lord.

## Преимущества библиотеки

В качестве виртуального браузера используется Headless Chromium, из-за чего страница выглядит так же, как и в обычном 
Chrome с графическим интерфейсом.

Для управления браузером используется библиотека [Puppeteer](https://developers.google.com/web/tools/puppeteer/). 
В отличие от CasperJS и PhantomJS, все управляющие инструкции выполняются в контексте Node.js, 
что позволяет использовать ES2015 и более новые стандарты, а также библиотеки, написанные для Node.js.

## Установка

```bash
npm install --save-dev @funboxteam/phantom-lord
```

## Использование

Подключите библиотеку:

```js
const Browser = require('@funboxteam/phantom-lord');
```

Создайте инстанс браузера, настройте вывод ошибок и запустите его:

```js
const browser = new Browser();
browser.on('timeout', () => console.log('browser timeout!'));
browser.on('error', () => console.log('browser error!'));
await browser.startRemoteBrowser();
```

Теперь можете выполнять необходимые команды:

```javascript
await browser.open('https://ya.ru');
await browser.waitForText('Найти');
await browser.sendKeys('.form__field', 'hello');
await browser.click('button');
await browser.waitForUrl('yandex.ru');
await browser.waitForText('показов в месяц');
```

Так как библиотека решает только задачу взаимодействия с Headless Chromium, то для написания E2E-тестов необходимо 
подключить дополнительные инструменты. Например, [Mocha](https://mochajs.org/) 
или [@funboxteam/frontend-tests-runner](https://github.com/funbox/frontend-tests-runner).

<details>
  <summary>Пример интеграции Mocha и Phantom Lord</summary>
  
  Простейший код может выглядеть так:
  
  ```js
  const Browser = require('@funboxteam/phantom-lord');
  let browser;
  let restartReason;
  let test;
  
  describe('Проверка yandex.ru', function() {
    // Здесь не стрелочная функция, чтобы Mocha могла подменить this
    before(async function() {
      browser = new Browser();
  
      browser.on('timeout', (e) => {
        console.log('e2e-tests timeout!');

        // В случае таймаута завершаем тест с ошибкой
        test.callback(e);
      });
  
      browser.on('error', (e) => {
        console.log('e2e-tests error!');

        // В случае ошибки при выполнении команды браузера завершаем тест с ошибкой
        test.callback(new Error(e)); 
      });
  
      // Обработка внутренней ошибки Phantom Lord (например, падение Chromium)
      browser.on('phantomError', (e) => {
        if (browser.testAlreadyFailed) {
          console.log('Ошибка Chromium внутри afterEach, тест не перезапускаем');
        } else {
          console.log('Ошибка Chromium, перезапуск теста');
          test.currentRetry(0);
          test.retries(1);
          restartReason = 'phantomError';
          test.callback(new Error(e || 'Error'));
        }
      });
  
      // Обработка закрытия Chromium
      browser.on('exit', (code, signal) => {
        if (browser.state === 'started' || browser.state === 'starting') {
          console.log(`Chromium внезапно завершился code '${code}' signal '${signal}', перезапуск теста`);
          test.currentRetry(0);
          test.retries(1);
          restartReason = 'exit';
          test.callback(new Error('Unexpected Chromium exit'));
        }
      });
  
      // После добавления всех обработчиков запускаем браузер
      await browser.startRemoteBrowser();
    });
  
    after(async function() {
      // После проведения тестов нужно завершить работу браузера, иначе останется зомби-процесс
      await browser.exit();
    });
  
    beforeEach(async function() {
      test = this.currentTest;
    });
  
    afterEach(async function() {
      // Если тест завершился с ошибкой, делаем скриншот для удобства разбора падения
      if (this.currentTest.state === 'failed') {
        // Если падение теста произошло по вине падения Chromium, то пытаться сделать скриншот бесполезно
        if (browser.state !== 'started') {
          console.log(`Не делаем скриншот, потому что browser.state = ${browser.state}`);
        } else {
          let t = this.currentTest;
          const p = [];
          while (t) {
            p.unshift(t.title);
            t = t.parent;
          }
  
          const time = new Date(parseInt(process.env.E2E_TESTS_START_TIMESTAMP, 10));
          p.unshift(time.getTime());
  
          p.unshift('screenshots');
          const fname = `${p.join('/')}.png`;
          browser.testAlreadyFailed = true;
  
          await browser.capture(fname);
        }
      }
  
      // Если тест успел пройти, но остались незамоканные запросы, тест упадет с ошибкой
      if (browser.browserErrors.length > 0 && this.currentTest.state !== 'failed') {
        test.callback(new Error(browser.browserErrors[0].msg));
      }
  
      // Вызов browser.closeAllPages() закроет все вкладки и повлечет за собой открытие новой вкладки при следующем browser.open()
      await browser.closeAllPages();
    });
  
    it('тест поиска 1', async () => {
      await browser.open('https://ya.ru');
      await browser.waitForText('Найти');
      await browser.sendKeys('.input__control', 'hello');
      await browser.click('button');
      await browser.waitForUrl('yandex.ru');
      await browser.waitForText('показов в месяц'); // Если мы не дождемся данной надписи, тест провалится
    });
  
    it('тест поиска 2', async () => {
      await browser.open('https://ya.ru');
      await browser.waitForText('Найти');
      await browser.sendKeys('.input__control', 'world');
      await browser.click('button');
      await browser.waitForUrl('yandex.ru');
      await browser.waitForText('показов в месяц'); // Если мы не дождемся данной надписи, тест провалится
    });
  });
  ```
  
  Работа с вкладками:
  
  ```js
    it('тест открытия страницы в новой вкладке', async () => {
      await browser.open('https://yandex.ru');

      // Предположим, что клик по такой ссылке откроет страницу в новой вкладке
      await browser.click('[data-id="video"]');
  
      // Если мы не дождемся открытия этой вкладки, тест провалится
      await browser.waitForTab(/yandex\.ru\/portal\/video/);
      // После успешной проверки вкладка будет автоматически закрыта
    });
  
    it('тест с проверками в новой вкладке', async () => {
      await browser.open('https://yandex.ru');
      await browser.waitForText('Карты');
      await browser.click('[data-id="video"]');
  
      await browser.waitForTab(/yandex\.ru\/portal\/video/, async () => {
        // Проверка выполняется на странице, открытой в новой вкладке
        // Если мы не дождемся данной надписи на странице в новой вкладке, тест провалится
        await browser.waitForText('Что посмотреть');
      });
  
      // Эта проверка выполняется на начальной вкладке
      await browser.waitForText('Карты');
    });
  ```
</details>

## Команды

Актуальный список доступных команд перечислен в файле [lib/commands/index.js](./lib/commands/index.js).

## Особенности работы с библиотекой

### Каталог проекта

Некоторым командам нужно знать путь до каталога проекта. Например, `capture` нужно это знание, чтобы правильно создать 
подкаталог для скриншотов.

Для определения каталога проекта используется библиотека [app-root-path](https://www.npmjs.com/package/app-root-path). 
И ввиду [некоторых её особенностей](https://www.npmjs.com/package/app-root-path#primary-method), 
не стоит размещать свой проект в каталоге с названием `node_modules` или его подкаталогах.

* Правильно: `~/work/my-project/`.
* Неправильно: `~/work/node_modules/my-project/`.

### Запуск браузера

Команда `browser.startRemoteBrowser()` вызывается автоматически во время выполнения `browser.open()`, 
если в этот момент времени браузер еще не запущен. 

Однако, при попытке выполнить команду, взаимодействующую со страницей, 
до непосредственного открытия браузера, будет возвращена ошибка `notStarted`. 

### Особенности работы с отдельными командами

#### `sendKeys` 

В случае, если `sendKeys` используется для заполнения поля с маской, необходимо передать третий параметр `caretPosition` 
со значением `start`. Например, так:

```js
await browser.sendKeys('.text-field_masked input[type=text]', '9001234567', 'start');
```

Обычно, если у поля есть маска, реализованная какой-либо JS-библитекой, то при фокусе такому полю автоматически 
выставляется атрибут `value` со значением в виде пустой маски (например, `value="___ ___-__-__"`). 
По умолчанию, параметр `caretPosition` имеет значение `end`, а потому курсор выставится после `___ ___-__-__`, 
и переданное значение не введётся, либо введётся некорректно.

### События

Инстанс `RemoteBrowser` генерирует следующие события:

* `error` — возникла критическая ошибка в процессе выполнения команды;
* `timeout` — достигнут таймаут в процессе выполнения команды;
* `phantomError` — возникла ошибка при отправке команды в Chromium
  (обычно это говорит о том, что процесс вскоре аварийно завершится);
* `browserErrors` — возникли JS-ошибки на странице;
* `exit` — Chromium завершился.

`RemoteBrowser` наследует `EventEmitter`, потому подписаться на события можно так:

```javascript
browser.on('error', (e) => {
  console.log(`Произошла ошибка ${e}`);
});
```

### Состояния

В процессе работы инстанс `RemoteBrowser` может находиться в одном из нескольких состояний:

* `notStarted` — Chromium не запущен;
* `starting` — Chromium запускается;
* `started` — Chromium запущен и готов к работе (или работает);
* `error` — в процессе выполнения очередного шага произошла ошибка при отправке команды в Chromium, 
  требуется завершение работы;
* `exiting` — происходит завершение Chromium.

Текущее состояние указано в свойстве `state`:

```javascript
console.log(`Текущее состояние: ${browser.state}`);
```

### Переменные окружения

* `DEBUG` — boolean; включает вывод отладочных сообщений 
  (отправленные команды, полученные ответы, сообщения из консоли запущенного браузера и т. д.).
* `BROWSER_ARGS` — string; позволяет настраивать браузер. Значение — JSON с аргументами запуска виртуального браузера. 
  Может содержать следующие ключи:
    * `viewportWidth` — number; ширина окна браузера (по умолчанию `1440`);
    * `viewportHeight` — number; высота окна браузера (по умолчанию `900`);
    * `waitTimeout` — number; время в миллисекундах, по истечению которого проверка в команде ожидания 
      будет считаться проваленной (по умолчанию `30000`);
    * `slowMo` — number; замедляет выполнение всех действий внутри браузера на указанное количество миллисекунд 
      (по умолчанию `0`). 
      Отличие от переменной `E2E_TESTS_WITH_PAUSES` в том, что `slowMo` влияет на выполнение всех действий 
      по взаимодействию с браузером (в том числе клики, переходы, ввод данных и пр.), в то время как 
      `E2E_TESTS_WITH_PAUSES` влияет на интервал между командами ожидания.
* `E2E_TESTS_WITH_PAUSES` — boolean; увеличивает задержку между проверками в командах ожидания (`waitForUrl`, `waitForText` и пр.).
  Позволяет обнаружить нестабильные ошибки, связанные со слишком быстрым выполнением проверок.
* `HEADLESS_OFF` — boolean; отключает Headless-режим браузера при выполнении команд. Браузер открывается 
  в привычном оконном режиме и позволяет не только визуально наблюдать за процессом выполнения, но и при необходимости 
  вмешиваться в него. Может быть полезно при отладке.

### Стабы

При тестировании достаточно частой задачей является добавление стабов на страницу. Phantom Lord умеет работать с ними.

#### addStubToQueue

Для добавления нужно использовать функцию `addStubToQueue`. Она записывает переданные стабы в массив 
`window.stubs` на странице.

Функцию можно вызывать даже до загрузки страницы. В таком случае переданные данные будут записаны в `window.stubs` сразу, 
как только страница будет загружена.

Формат добавляемых стабов зависит от реализации на клиенте и не определяется библиотекой. Единственное, 
о чем нужно помнить — передаваемые в браузер данные сериализуются, следовательно, нельзя ссылаться на данные внутри 
процесса Node.js.

#### setRequestInterceptor

Также можно реализовать стабы с помощью функции `setRequestInterceptor`.
Если передать в эту функцию коллбэк, то он будет вызываться при выполнении браузером сетевых запросов.
В коллбэк передаётся объект [HTTPRequest](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#class-httprequest).

Пример использования:

```js
browser.setRequestInterceptor((request) => {
  const apiPrefix = utils.url('/api');

  if (request.url().indexOf(apiPrefix) === 0) {
    const shortUrl = request.url().replace(apiPrefix, '');
    let foundStub;

    stubs.forEach((stub) => {
      if (stub.method.toLowerCase() === request.method().toLowerCase() && stub.url === shortUrl) {
        foundStub = stub;
      }
    });

    if (foundStub) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(foundStub.data),
      });
      return;
    }

    browser.browserErrors.push({ msg: `Stub not found: ${request.method()} ${shortUrl}` });
  }

  request.continue();
});
```

### Local Storage

Каждый запуск браузера происходит с новым чистым профилем пользователя, для которого создается уникальная директория. 
При добавлении в браузере данных в Local Storage, они хранятся в созданной директории. После закрытия браузера 
эта директория удаляется автоматически.

## Совместимость с предыдущими версиями библиотеки

### Содержимое страницы

Предыдущие версии библиотеки для запуска виртуального браузера использовали PhantomJS, который имеет плохую поддержку 
современных веб-технологий и свой взгляд на содержимое страницы. В связи с этим, при переходе на новую версию, которая
использует Headless Chromium, могут возникать некоторые различия в том, как браузеры «видят» контент.

Например, браузер, запускаемый в PhantomJS, может проигнорировать неразрывный пробел между словами, и для `17&nbsp;640` 
ожидаемый текст будет «17640». Chromium же сохранит этот пробел, и для него ожидаемый текст будет «17 640».

**Важно**. Если в текстовом содержимом элемента содержатся символы неразрывного пробела (`&nbsp;`), они будут заменены 
на обычные пробелы при получении текста элемента (например, при использовании метода `waitForSelectorText`). В случае,
если тест упал на проверке текста с похожей ошибкой:

```
Error: Expected text of '.dialog__content p' to be 'Вы уверены, что хотите отключить услугу?', but it was 'Вы уверены, что хотите отключить услугу?'
```

скорее всего это значит, что текст _для теста_ был скопирован напрямую со страницы с сохранением неразрывных пробелов. 
В этом случае нужно исправить тест таким образом, чтобы в нём не было неразрывных пробелов.

### Обработка кликов по элементам документа

Механика обработки событий мыши (в первую очередь, кликов) различна для PhantomJS и Headless Chromium. 
Так, в PhantomJS используется способ создания нового события `Event` c последующим вызовом этого события на конкретном 
элементе с помощью `EventTarget.dispatchEvent()`. В Headless Chromium определяется положение искомого элемента на странице, 
затем клик производится по найденным координатам.

Если команда на клик успешно проходит, но далее не происходит ничего, что ожидается после клика, есть вероятность, 
что клик проходит по нужным координатам, но попадает на другой элемент. Возможный пример такого случая: 
наличие модальных окон или «прелоадеров», которые блокируют контент. Если на странице есть прелоадер и команда на клик 
посылается сразу после открытия страницы, стоит добавить отдельную команду, которая подождет исчезновения этого прелоадера.

Особое внимание следует обратить на клики по «невидимым» элементам. PhantomJS и Headless Chromium 
смогут кликнуть по элементу, даже если его размеры 0×0. Однако, если для элемента или его родителя задано CSS-свойство 
`display: none`, то в Headless Chromium попытка клика по такому элементу вернет ошибку `invisibleElement`, 
поскольку параметры его блочной модели и положение невозможно определить.

В случае ошибки, связанной с кликом по невидимому элементу, убедитесь, что ни элемент, ни один из его родителей, 
не имеют стилей, полностью скрывающих их на странице. В противном случае, перед кликом необходимо выполнить действие, 
возвращающее невидимый элемент в документ.

### Очистка Local Storage

Поскольку предыдущие версии библиотеки были основаны на PhantomJS, уникальный путь к Local Storage создавался средствами 
самой библиотеки Phantom Lord и требовал ручной очистки с помощью вызова `Browser.deleteLocalStorageBaseDir();`.

В новой версии вызов данной функции более не требуется.

### Прочие проблемы совместимости

Если в процессе переноса тестов с прошлых версий библиотеки на версию с использованием Headless Chromium вы столкнулись 
с какими-либо другими неотмеченными проблемами перехода, связанными с отличиями в отображении страницы между PhantomJS 
и Headless Chromium, пожалуйста, создайте ишью на дополнение данного раздела в документации.

## Разработка

### Декларационный файл

В корне проекта лежит декларационный файл `index.d.ts`. Он помогает IDE подсвечивать поля и методы класса `RemoteBrowser` 
и содержит информацию об аргументах методов и возвращаемом значении.

Если в процессе разработки добавляются новые команды, удаляются старые, или как-либо изменяется интерфейс класса, 
рекомендуется соответствующим образом изменять декларационный файл.

Для подстраховки добавлены тесты, которые проверяют соответствие методов, объявленных в декларационном файле, 
командам из `lib/commands` и собственным методам `RemoteBrowser`.

## Благодарности

Роскошную картинку для репозитория нарисовал [Игорь Гарибальди](https://pandabanda.com/).

[![Sponsored by FunBox](https://funbox.ru/badges/sponsored_by_funbox_centered.svg)](https://funbox.ru)
