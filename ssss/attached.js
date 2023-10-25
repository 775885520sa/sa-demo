let data = []
let chart = null

let city = document.getElementById('city')
document.getElementById('default').onclick = () => {
    city.value = 'whole country'
}



document.getElementById('form').addEventListener('submit', async (e) => {
    document.querySelector('.info').style.display = 'none'
    let wait = document.getElementById('wait')
    wait.style.display = 'block'
    e.preventDefault()
    // 城市
    let city = document.getElementById('city').value
    // 类别
    let mainActivity = document.getElementById('main-activity').value;
    // 性别
    let gender = document.getElementById('gender').value;
    // 年龄
    let age = document.getElementById('age').value;
    // 起始时间
    let start = parseInt(document.getElementById('start').value)
    // 终止时间
    let end = parseInt(document.getElementById('end').value)
    // 时间合集
    let times = []
    for (let i = start; i <= end; i++) {
        times.push(i + '')
    }
    console.log(city)

    const [codes, names] = await fetchMunicipalityCode();
    const codesJSON = JSON.stringify(codes);
    localStorage.setItem("codes", codesJSON);


    if (city == 'whole country') {
        data = await getData(codes, mainActivity, gender, age, times)
        names.splice(0, 1)
        spliceArr(data, times.length, names, times)
    } else {
        let index = names.indexOf(city)
        let code = codes[index]
        data = await getData(code, mainActivity, gender, age, times)

        chartTable(data, times, city)
    }

    wait.style.display = 'none'

})

async function getData(municipalityCodes, mainActivity, gender, age, times) {
    let code = null
    if (Array.isArray(municipalityCodes)) {
        code = municipalityCodes
    } else {
        code = [municipalityCodes]
    }
    const jsonQuery = {
        "query": [
            {
                "code": "Alue",
                "selection": {
                    "filter": "item",
                    "values": code
                }
            },
            {
                "code": "Pääasiallinen toiminta",
                "selection": {
                    "filter": "item",
                    "values": [mainActivity]
                }
            },
            {
                "code": "Sukupuoli",
                "selection": {
                    "filter": "item",
                    "values": [gender]
                }
            },
            {
                "code": "Ikä",
                "selection": {
                    "filter": "item",
                    "values": [age]
                }
            },
            {
                "code": "Vuosi",
                "selection": {
                    "filter": "item",
                    "values": times
                }
            }
        ],
        "response": {
            "format": "json-stat2"
        }
    }

    const response = await fetch('https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115b.px', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(jsonQuery)
    });
    if (response.status === 200) {
        const data = await response.json();
        return data.value

    } else {
        alert('Failed to fetch data.')
        return
    }

}

function chartTable(data, times, city) {
    let table = document.querySelector('.table')
    if (table) {
        table.style.display = 'none'
    }
    document.querySelector('.info').style.display = 'block'
    document.getElementById('cityName').innerText = city

    let title = `Labor Force Report in the ${city} from 2001 to 2005`

    // 创建图表
    let info = {
        labels: times,
        datasets: [{
            values: data,
            chartType: 'line'
        }]
    }
    chart = new frappe.Chart("#chart", {  // or a DOM element,
        // new Chart() in case of ES6 module with above usage
        data: info,
        title,
        type: 'axis-mixed', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
        height: 250,
        colors: ['#7cd6fd', '#743ee2']
    })

    document.querySelector('.saveBtn').onclick = () => {
        chart.export()
    }
}

function spliceArr(data, length, names, times) {
    let info = document.querySelector('.info')
    if (info) {
        info.style.display = 'none'
    }
    document.querySelector('.table').innerHTML = ''
    document.querySelector('.table').style.display = 'block'
    // 标题
    let ths = '<th scope="col">datas</th>'
    for (let i = 0; i < times.length; i++) {
        ths += `<th scope="col">${times[i]}</th>`
    }

    // 城市及对应年份数据
    let tbody = ''
    for (let i = 0; i < names.length; i++) {
        let tds = ''
        let infos = data.splice(0, length)
        for (let j = 0; j < infos.length; j++) {
            tds += `
                <td>${infos[j]}</td>
            `
        }
        tbody += `
            <tr>
                <th  scope="row">${names[i]}</th>
                ${tds}
            </tr>
        `
    }
    document.querySelector('.table').innerHTML = `
        <table class="table">
            <thead>
                <tr>
                   ${ths} 
                </tr>
            </thead>
            <tbody>
                ${tbody}
            </tbody>
        </table>
    `

}

async function fetchMunicipalityCode() {
    try {
        const response = await fetch('https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px');
        if (!response.ok) {
            console.error('Failed to fetch data.');
            return;
        }

        const data = await response.json();
        const codes = data.variables[1].values;
        const names = data.variables[1].valueTexts;
        return [codes, names];
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

