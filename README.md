# Облачные вычисления на wasm

Проект создан как лабораторная работа по развертыванию кластера с использованием [WebRTC Data Channel API](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) и последующим вычислением некоторой функции по исходным данным на подключенных узлах. Определение функции происходит в `.wasm` файле (см. [WebAssembly](https://webassembly.org/)).

Основная страница располагается [здесь](https://arostovsky.github.io/master.html) (/master.html).
Страница узла [/slave.html](https://arostovsky.github.io/slave.html).

# Как подключить узел:
1. Открыть страницу [/slave.html](https://arostovsky.github.io/slave.html)
2. Задать имя узла в поле Name
3. Нажать `Connect`
4. Дождаться инициализации узла и (в случае успеха) появления offer'а (может занять некоторое время, ориентировочно 30-60 секунд)
5. Нажать `Copy offer` (значение будет скопировано в clipboard)
6. Не закрывая страницу узла перейти в [/master.html](https://arostovsky.github.io/master.html)
7. Нажать `Add new slave`
8. Вставить значение скопированного offer'а и нажать `Create answer` 
9. Дождаться появления answer'а, нажать кнопку `Copy answer`
10. Вернуться в открытую страницу [/slave.html](https://arostovsky.github.io/slave.html)
11. Вставить значение скопированного answer'а и нажать `Add answer`
12. Если всё прошло успешно, вы увидите зеленый текст `Connected` напротив имени узла, который был указан в шаге №2

# Как произвести вычисления:
1. Перейти на открытую страницу [/master.html](https://arostovsky.github.io/master.html) с уже подключенными узлами. Если узлы не подключены - см. `Как подключить узлы`
2. В `Execute section` выбрать `.wasm` файл. Примеры файлов есть в папке `uploads`.
3. Получить список доступных функций этого файла через `Get available functions`
4. Выбрать функцию в выпадающем списке напротив `Function`
5. Вставить данные через пробел, например `1 2 3 4 5 6 7`. N.B.: ожидаются исключительно числа, другие форматы будут игнорироваться.
6. Нажать `Start` и получить ответ в логе `Final result: 28` :)

Скриншоты:
![master](https://raw.githubusercontent.com/ARostovsky/arostovsky.github.io/master/readme_files/Master.PNG)
![slave1](https://raw.githubusercontent.com/ARostovsky/arostovsky.github.io/master/readme_files/Slave1.PNG)
![slave2](https://raw.githubusercontent.com/ARostovsky/arostovsky.github.io/master/readme_files/Slave2.PNG)