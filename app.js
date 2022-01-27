'use strict';

const textAreaInput = document.querySelector('#input-urls')
const inputBtn = document.querySelector('#input-btn')
const buttonStart = document.querySelector('#start')
const buttonStop = document.querySelector('#stop')
const buttonReset = document.querySelector('#reset')
const inputMsF = document.querySelector('#inputMs')
const header = document.querySelector('#header1')
const succ = document.querySelector('.success')
const board = document.querySelector('#board')
const modal = document.getElementById("inputModal");
const btn = document.getElementById("modalBtn");
let linksNumber;
const squares = [];
let TAB_Q = 0;
let link, timeoutID;
let counter = 0;
let delay;

//берём из LocalStorage
function getUrlsLoc() {
  if (localStorage.getItem('urls') && localStorage.getItem('urls') !== '') {
    return JSON.parse(localStorage.getItem('urls'))
  } else console.log('empty localStorage')
}

let text2 = getUrlsLoc()
if (text2) linksNumber = text2.length;
header.textContent = `Ссылок: ${linksNumber}`

// console.log("-> local text2", text2);
function getDelay() {
  localStorage.getItem('delay') ? delay = +localStorage.getItem('delay') : delay = 2000;
  inputMsF.value = delay
}
getDelay()

function getCounter() {
  localStorage.getItem('counter') ? counter = +localStorage.getItem('counter') : counter = 0;
}
getCounter()

//рисуем поле квадратиков
for (let i = 0; i < linksNumber; i++) {
  const square = document.createElement('div');
  square.classList.add('square');
  board.append(square);
  squares.push(square);
}

if (counter) {
  for (let i = 0; i < counter; i++) {setColor(squares[i])}
}

async function getTabs() {
  await chrome.tabs.query({currentWindow:true}, function(tabs) {
    TAB_Q = tabs.length;
    console.log("-> Number of tabs on start", TAB_Q);
  })
}
getTabs()

function openLink() {
  if (counter < linksNumber) {
    // получаем количество вкладок в окне
    let tabQ;
    chrome.tabs.query({currentWindow:true}, function(tabs) {
      tabQ = tabs.length;

      if (tabQ < (13 + TAB_Q)) {
        link = text2[counter] //получаем ссылку
        link = encodeURI(link)
        // console.log(link);

        //create chrome tab
        chrome.tabs.create({url: link, selected: false})
        localStorage.setItem('counter', (counter + 1).toString())
        //пишем цифру в иконку
        let badgeText = linksNumber - counter
        chrome.action.setBadgeText({text: badgeText.toString()});
        chrome.action.setBadgeBackgroundColor({color: 'gray'});

        // console.log(counter)
        setColor(squares[counter])
        counter++;
        timeoutID = setTimeout(openLink, delay);
        document.title = `Сбор... (${counter} / ${linksNumber})`
        header.textContent = `Сбор... (${counter} / ${linksNumber})`
      } else {
        chrome.action.setBadgeBackgroundColor({color: "red"});
        timeoutID = setTimeout(openLink, delay);
        console.log('wait...')
      }
    });

  } else {
    clearTimeout(timeoutID)
    console.log("-> end timeoutID", timeoutID);
    chrome.action.setBadgeText({text: ""});
    const audio = new Audio('08368.mp3');
    audio.play();
    localStorage.setItem('counter', '0')
    header.textContent = `готово!`
    document.title = `готово!`
  }
}

//!modal => нажатие Добавить
inputBtn.addEventListener('click', () => {
  if (textAreaInput.textLength > 15) {
    let text = textAreaInput.value
    // console.log("-> textArea", text);
    //обрезает и разделяет строки на массив
    text = text.replace(/\s+/g, ' ').trim().split(" ");
    // console.log("-> textTrim", text);
    //проверяет, что в массиве только URL
    text = text.filter(function isValidURL(string) {
      const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
      return res != null;
    })
    text.map((item, i, arr) => {
      return arr[i] = decodeURI(item)
    })
    text.map((item, i, arr) => {
      return arr[i] = decodeURI(item)
    })
    text = [...new Set(text)]

//проверяем дубликаты
    if (text.length) {
      let c;
      if (text2) {
        c = text.filter(n => text2.indexOf(n) === -1)
        if (c.length) {
          text2.push(...c)
          console.log("-> new", c);
          succ.innerHTML = `<span style="color: #3bff3b; margin-right: 8px">✔</span>` +
            `<span>Добавлено ${c.length} новых ссылок!</span>`;
          succ.classList.remove('off')
          setTimeout(function () {
            succ.classList.add('off')
          }, 5000);
        } else {
          succ.innerHTML = `<span>Нет уникальных ссылок =(</span>`;
          succ.classList.remove('off')
          setTimeout(function () {
            succ.classList.add('off')
          }, 5000);
        }
      } else {
        text2 = text
        text2 = [...new Set(text2)]
        console.log('text2 -; text')
        succ.innerHTML = `<span style="color: #3bff3b; margin-right: 8px">✔</span>` +
          `<span>Добавлено ${text.length} новых ссылок!</span>`;
        succ.classList.remove('off')
        setTimeout(function () {
          succ.classList.add('off')
        }, 5000);
      }
    } else {
      console.log('text -')
      succ.innerHTML = `<span>Нет уникальных ссылок =(</span>`;
      succ.classList.remove('off')
      setTimeout(function () {
        succ.classList.add('off')
      }, 5000);
    }
//добавляем в локальный массив
    text2 = [...new Set(text2)]
    localStorage.setItem('urls', JSON.stringify(text2))
    textAreaInput.value = ''
  }
})


//закрашиваем цветом квадратики
function setColor(element) {
  const color = 'rgba(59,255,59,0.44)';
  element.style.backgroundColor = color;
  element.style.boxShadow = `0 0 2px ${color}, 0 0 10px ${color}`;
}

// Получить элемент <span>, который закрывает модальный
const closeButton = document.getElementsByClassName("close")[0];
// Когда пользователь нажимает на кнопку, откройте модальный
btn.onclick = function () {
  modal.style.display = "block";
}
// Когда пользователь нажимает на <span> (x), закройте модальное окно
closeButton.onclick = function () {
  modal.style.display = "none";
}
// Когда пользователь щелкает в любом месте за пределами модального, закройте его
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
}

buttonStart.addEventListener('click', () => {
  delay = +inputMsF.value
  localStorage.setItem('delay', JSON.stringify(delay))
  console.log('Script started with delay: ', delay)
  openLink();
  inputMsF.disabled = true
})
buttonStop.addEventListener('click', () => {
  clearTimeout(timeoutID)
  chrome.action.setBadgeText({text: ""});
  console.log(timeoutID + ' paused')
  inputMsF.disabled = false
})
buttonReset.addEventListener('click', () => {
  localStorage.setItem('counter', '0')
  chrome.action.setBadgeText({text: ""});
  inputMsF.disabled = false
  window.location.reload()
})

//? UPDATE from GitHub
let dateNow = new Date().toLocaleDateString().slice(0,5) // вывод только день и месяц
document.getElementById('test__btn').addEventListener('click', event => {
  const request = new XMLHttpRequest;
  let test;
  request.open('GET', 'https://raw.githubusercontent.com/x3mator/web-script/main/urls.txt', true);
//! Сделать проверку даты, чтобы обновлялось раз в неделю
  request.onload = function () {
    test = request.responseText
    console.log('1',test.length);
    test = test.replace(/\s+/g, ' ').trim().split(" ");
    let c, testLoc;
    testLoc = JSON.parse(localStorage.getItem('urls2'))
    console.log('test: ', test.length, 'testLoc: ', linksNumber)
    test.length > linksNumber ? localStorage.setItem('urls2', JSON.stringify(test)) : null
    document.querySelector(".test__list").textContent = ((test.length - linksNumber) > 0)
      ? `${dateNow}... +${test.length-linksNumber}` : dateNow
  };
  request.send(null);
});




