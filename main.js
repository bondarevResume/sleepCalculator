const cycleQuality = {
	GOOD: 6,
	MEDIUM : 4,
	BAD: 2,
}
const sleepDelay = 15; //
const autoDarkThemeHours = [21, 8]

var $ = function( id ) { return document.getElementById( id ); };

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}
window.addEventListener("load", function () {
    let darkThemeEnabled = false;
    let langData;

    const wakeInput = $("wake-input-field");
    const gotoInput = $("goToBed-input-field");
    const darkThemeSwitch = $("dark-theme-switch");

    function fadeResultCards(){
        $("result-card-good").style.opacity = 1;
        $("result-card-medium").style.opacity = 1;
        $("result-card-bad").style.opacity = 1;
    }
    
    function changeMode(mode){
        //Disable opposite mode
        $(mode === "wakeAt" ? "wakeAt-input" : "goToBed-input").removeAttribute("disabled");    
        $(mode === "wakeAt" ? "goToBed-input" : "wakeAt-input").setAttribute("disabled", true);
    
        //Change tip
        $(mode == "wakeAt" ? "text-shouldWakeUp" : "text-shouldGoToBed").style.display = "none";
        $(mode == "wakeAt" ? "text-shouldGoToBed" : "text-shouldWakeUp").style.display = "block";
    }
    
    function formatInput(inp, padZeroes){
        function pad(inp){return inp.length < 2 ? (inp.length < 1 ? "00" : "0" + inp) : inp; }

        inp = inp.replace(/\D/g, "");
        inp = inp.substr(0, 4);

        inp = (inp.substr(0,1) > 2 ? "0" + inp : inp);
        inp = (inp.substr(0,2) >= 24 ? "23" + inp.substr(2) : inp);
        
        //When specified fill minute field if less than 10. Should only fire on focus lost or submit
        if(padZeroes){
            inp = pad(inp.substr(0,2)) + pad(inp.substr(2)); 
        }
        inp = (inp.substr(2) >= 60 ? inp = inp.substr(0,2) + "59" : inp);

        //Add a separator if input comes with minutes specified
        inp = inp.length <= 2 ? inp : inp.substr(0, 2) + ":" + inp.substr(2);

        return inp
    }

    function handleInput(e){
        e.target.value = formatInput(e.target.value);
        if(e.target.value.length > 4){e.target.blur();}
    }

    function calculateTime(mode){

        //Splits text into hours and minutes
        function parseInput(inp){
            if(inp == null) return 0;

            inp = inp.replace(/\D/g,'');
            return [inp.substr(0,2), inp.substr(2)];
        }

        function format(mins){
            let hour = Math.floor(mins/60);
            let min = mins%60;
            return ("0" + hour).slice(-2) + ":" + ("0" + min).slice(-2);
        }

        function displayExtraInfo(cardName, hours, cycles){
            $(cardName+"-hours").innerHTML = hours;
            $(cardName+"-cycles").innerHTML = cycles;
        }

        let input = parseInput(mode === "goTo" ? wakeInput.value : gotoInput.value);
        let inputTime = input[0]*60 + +input[1];

        let goodAmount = 90*cycleQuality.GOOD ;
        let mediumAmount = 90*cycleQuality.MEDIUM;
        let badAmount = 90*cycleQuality.BAD;

        let goodTarget = (inputTime - (mode === "goTo" ? goodAmount : -goodAmount) - sleepDelay).mod(1440);
        let mediumTarget = (inputTime - (mode === "goTo" ? mediumAmount : -mediumAmount) - sleepDelay).mod(1440);
        let badTarget = (inputTime - (mode === "goTo" ? badAmount : -badAmount) - sleepDelay).mod(1440)

        $("ideal-info").innerHTML = format(goodTarget);
        $("medium-info").innerHTML = format(mediumTarget);
        $("bad-info").innerHTML = format(badTarget);

        displayExtraInfo("ideal-info-extra", Math.round(goodAmount/60), cycleQuality.GOOD);
        displayExtraInfo("medium-info-extra", Math.round(mediumAmount/60), cycleQuality.MEDIUM);
        displayExtraInfo("bad-info-extra", Math.round(badAmount/60), cycleQuality.BAD);
    }

    function toggleDarkTheme(){
        if(darkThemeEnabled){
            darkThemeEnabled = false;
            document.documentElement.removeAttribute("dark");
            return
        }
        darkThemeEnabled = true;
        document.documentElement.setAttribute("dark", true);
    }

    function autoDarkTheme(){
        let hr = new Date().getHours();
        if(hr > autoDarkThemeHours[0] || hr < autoDarkThemeHours[1]){
            toggleDarkTheme();
            darkThemeSwitch.setAttribute("checked", true);
        }
    }

    function loadLanguage(){
        fetch("./lang.json").then(response =>
            response.json()).then(data =>{
                langData = data[navigator.language] || data["en-US"]
                Object.entries(langData).forEach(([key, value]) => {
                    let field = $(key);
                    if(field != null){field.innerHTML = value}
                });
        });
    }

    wakeInput.addEventListener("input", (e)=>{
        handleInput(e);
        calculateTime("goTo");
    });
    gotoInput.addEventListener("input", (e)=>{
        handleInput(e);
        calculateTime("wakeAt");
    });


    wakeInput.addEventListener("focusin", ()=>{
        changeMode("wakeAt");
        wakeInput.value = "";
    });
    gotoInput.addEventListener("focusin", ()=>{
        changeMode("goToBed");
        gotoInput.value = "";
    });

    wakeInput.addEventListener("focusout", (e) => {
        e.target.value = formatInput(e.target.value, true);
        calculateTime("goTo");
    });
    gotoInput.addEventListener("focusout", (e) => {
        e.target.value = formatInput(e.target.value, true);
        calculateTime("wakeAt");
    });


    darkThemeSwitch.addEventListener("change", () => {toggleDarkTheme();})

    changeMode("wakeAt");
    fadeResultCards();
    autoDarkTheme();
    loadLanguage();
    calculateTime("goTo");
}, false);
