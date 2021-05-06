const decode = obj => JSON.parse(atob(obj));
const encode = obj => btoa(JSON.stringify(obj));

function log(field, text, name = "") {
    let date = new Date();

    let hours = date.getHours();
    hours = hours < 10 ? '0' + hours : hours;
    let minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let seconds = date.getSeconds();
    seconds = seconds < 10 ? '0' + seconds : seconds;
    let milliSeconds = date.getMilliseconds();
    if (milliSeconds < 10) {
        milliSeconds = '00' + milliSeconds;
    } else if (milliSeconds < 100) {
        milliSeconds = '0' + milliSeconds;
    }
    let entry = `[${hours}:${minutes}:${seconds}.${milliSeconds}] `;

    if (name !== "") {
        entry += `[${name}] `
    }

    entry += `${text}\n`
    field.append(entry)
}

function copyToClipboard(data) {
    let $temp = $("<input>");
    $("body").append($temp);
    $temp.val(data).select();
    document.execCommand("copy");
    $temp.remove();
}

getNumbers = (array) => array.filter(it => !isNaN(it) && it !== null)

getSum = (array) => array.reduce((a, b) => a + b, 0)

getMethods = (obj) =>  Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === 'function')