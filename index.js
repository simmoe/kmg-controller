let currentPage = 1
let pages // Array med alle sider
let client 

let ddu_sign_button, ddu_sign_active
var ip = '10.78.16.62' // Hub IP
var username = '6MXQnVOMUBwAuqXnedzRZ4cvhaI9MCLgSjYOrjdx'  

function setup() {    
    // Force reload knap
    select('#reload').mousePressed(() => {
        window.location.href = 'https://simmoe.github.io/kmg-controller/?forceReload=' + new Date().getTime()
    })

    pages = selectAll('.page')
    
    // DDU Sign knap
    ddu_sign_button = select('#ddu_sign')
    .mousePressed(() => {
        console.log('SIGN PRESSED')
        client.publish('DDU_INFINITY', ddu_sign_active ? 'off' : 'on')
    })

    client = mqtt.connect('wss://mqtt.nextservices.dk')

    client.on('connect', (m) => {
        console.log('Client connected:', m)
        client.publish('DDU_CONTROLLER_CALL', 'DDU_INFINITY')
    })

    client.subscribe('DDU_CONTROLLER')

    client.on('message', (topic, message) => {
        console.log('Received:', topic, message.toString())
        let ms = JSON.parse(message.toString())
        if (ms.control === 'DDU_INFINITY') {
            ddu_sign_active = ms.status
            console.log('DDU Sign response:', ddu_sign_active)
            ddu_sign_button.toggleClass('active', ddu_sign_active)
        }
    })  

    // Find alle Hue-knapper og tilføj event listeners
    selectAll('.control_button[data-lightnumber]').forEach(button => {
        let lightNumber = button.attribute('data-lightnumber')

        // Hent status ved opstart
        getHueLightStatus(lightNumber, button)

        // Tilføj tryk-event til knappen
        button.mousePressed(() => {
            console.log(`HUE BUTTON PRESSED for light ${lightNumber}`)
            toggleHueLight(lightNumber, button)
        })
    })
}

function getHueLightStatus(no, button) {
    let url = `http://${ip}/api/${username}/lights/${no}`
    
    httpDo(url, 'GET', (res) => {
        let data = JSON.parse(res)
        
        // Sikrer, at state.on ikke er undefined, ellers antager vi den er slukket
        let isActive = data.state && data.state.on === true
        
        isActive && button.addClass('active') // Opdater knap-visningen
        console.log(`Light ${no} status from API:`, isActive ? 'ON' : 'OFF')
    }, (err) => {
        console.error(`Failed to fetch light ${no} status`, err)
    })
}

// Tænder/slukker en Hue-lampe og opdaterer knappen korrekt
function toggleHueLight(no, button) {
    let url = `http://${ip}/api/${username}/lights/${no}/state`
    
    let isActive = button.hasClass('active')
    let payload = JSON.stringify({ "on": !isActive }) // Toggler tilstand

    httpDo(url, {
        method: 'PUT',
        body: payload
    }, (res) => {
        console.log(`HUE Light ${no} toggled to: ${!isActive}`, res)
        button.toggleClass('active', !isActive) // Opdater knap-visningen
    }, (err) => {
        console.error(`Failed to toggle light ${no}`, err)
    })
}

function draw() {}

function shiftPage(num) {
    if (isNaN(num) || num > pages.length || num == 0) {
        return
    }
    select("#page" + currentPage).removeClass('visible')
    currentPage = num
    select("#page" + currentPage).addClass('visible')
}

function keyPressed() {
    if (!isNaN(key)) {
        shiftPage(key)
    }
    if (key === "Enter") {
        let fs = fullscreen()
        fullscreen(!fs)
    }
}
