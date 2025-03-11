let currentPage = 1
let pages // Array med alle sider
let client 

let ddu_sign_button, ddu_sign_active

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

    client.on('connect', () => {
        console.log('MQTT connected')
        client.publish('DDU_CONTROLLER_CALL', 'DDU_INFINITY')

        // Abonner på Hue-statusopdateringer
        client.subscribe('HUE_CONTROLLER/status')

        // Bed M5-controlleren om at sende aktuel status ved opstart
        console.log('Sending status request on: HUE_CONTROLLER_STATUS_REQUEST...')
        client.publish('HUE_CONTROLLER_STATUS_REQUEST', '{}')
    })

    client.subscribe('DDU_CONTROLLER')

    client.on('message', (topic, message) => {
        let ms = JSON.parse(message.toString())
        console.log(`Received on ${topic}:`, ms)
    
        if (topic === 'DDU_CONTROLLER' && ms.control === 'DDU_INFINITY') {
            ddu_sign_active = ms.status
            if(ddu_sign_active){
                ddu_sign_button.addClass('active')
            }else{
                ddu_sign_button.removeClass('active')
            }
        }
    
        if (topic === 'HUE_CONTROLLER/status') {
            Object.entries(ms).forEach(([lightNumber, lightData]) => {
                let button = select(`.control_button[data-lightnumber="${lightNumber}"]`)
                if (button) {
                    updateHueButton(lightNumber, lightData.state.on, lightData.state.bri)
                }
            })
        }
    })
    

    // Find alle Hue-knapper og tilføj event listeners
    selectAll('.control_button[data-lightnumber]').forEach(button => {
        let lightNumber = button.attribute('data-lightnumber')

        // Tilføj tryk-event til knappen
        button.mousePressed(() => {
            console.log(`HUE BUTTON PRESSED for light ${lightNumber}`)
            toggleHueLight(lightNumber)
        })
    })
}
function toggleHueLight(lightNumber) {
    let button = select(`.control_button[data-lightnumber="${lightNumber}"]`)
    if (!button) return

    let isCurrentlyOn = button.hasClass('active') // Tjekker om knappen er aktiv
    let newState = !isCurrentlyOn // Skifter status

    let payload = JSON.stringify({ "light": lightNumber, "on": newState })
    client.publish('HUE_CONTROLLER_COMMAND', payload)

    console.log(`Toggling Light ${lightNumber} to: ${newState ? "ON" : "OFF"}`)
    updateHueButton(lightNumber, newState)
}

function updateHueButton(lightNumber, isActive, brightness) {
    let button = select(`.control_button[data-lightnumber="${lightNumber}"]`)
    if (!button) return

    if(isActive){
        button.addClass('active')
    }else{
        button.removeClass('active')
    }
}