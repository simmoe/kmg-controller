let currentPage = 1
let pages //array med alle elementer med class = page 
let client 

let ddu_sign_button, ddu_sign_active

function setup(){    

    //force reload 
    select('#reload').mousePressed(()=>{
        window.location.href = 'https://simmoe.github.io/kmg-controller/?forceReload=' + new Date().getTime()
    })

    pages = selectAll('.page')
    let ddu_sign_button = select('#ddu_sign')
    .mousePressed(()=>{
        client.publish('DDU_INFINITY')
    })

    client = mqtt.connect('wss://mqtt.nextservices.dk')

    client.on('connect', (m) => {
        console.log('Client connected: ', m)

        //DDU Sign 
        client.publish('DDU_CONTROLLER_CALL', 'DDU_INFINITY')

    })

    client.subscribe('DDU_CONTROLLER')
  
    client.on('message', (topic, message) => {
        console.log('received ', topic, message.toString())
        let ms = JSON.parse(message.toString())
        if(ms.control == 'DDU_INFINITY'){
            ddu_sign_active = ms.status
            console.log('DDU Sign response: ', ddu_sign_active)
            if(ddu_sign_active) {
                ddu_sign_button.addClass('active')
            }else{
                ddu_sign_button.removeClass('active')
            }
        }
    })  

}




function draw(){
}

function shiftPage(num){
    if(isNaN(num) || num > pages.length || num == 0){
        return
    }
    select("#page" + currentPage).removeClass('visible')
    currentPage = num
    select("#page" + currentPage).addClass('visible')
}

function keyPressed(){
    if(!isNaN(key)){
        shiftPage(key)
    }
    if(key == "Enter"){
        let fs = fullscreen()
        fullscreen(!fs)
    }
}